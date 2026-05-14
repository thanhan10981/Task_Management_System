import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { ProjectAccessService } from '../../../common/access/project-access.service';
import { NOTIFICATION_PREFERENCE_KEYS } from '../../../common/notifications/notification-preferences.constants';
import { NotificationPreferencesService } from '../../../common/notifications/notification-preferences.service';
import {
  createPaginatedResponse,
  createPaginationOptions,
} from '../../../common/helpers/pagination.helper';
import {
  CommentQueryDto,
  CreateCommentDto,
  UpdateCommentDto,
} from '../dto/comment.dto';
import { CommentsRepository } from '../repository/comments.repository';
import { NotificationsRepository } from '../../notifications/repository/notifications.repository';
import { TASK_HISTORY_ACTIONS } from '../../tasks/constants/task-actions.constants';
import { buildTaskHistoryMetadata } from '../../tasks/utils/task-history.util';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly projectAccessService: ProjectAccessService,
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationPreferencesService: NotificationPreferencesService,
  ) {}

  async listByTask(userId: string, taskId: string, queryDto: CommentQueryDto) {
    await this.projectAccessService.ensureTaskAccess(userId, taskId);
    const { skip, take } = createPaginationOptions(queryDto);

    const [comments, total] = await Promise.all([
      this.commentsRepository.listTaskComments(taskId, skip, take),
      this.commentsRepository.countTaskComments(taskId),
    ]);

    return createPaginatedResponse(comments, total, queryDto);
  }

  async create(userId: string, taskId: string, dto: CreateCommentDto) {
    const task = await this.commentsRepository.findTaskById(taskId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.projectAccessService.ensureProjectMember(userId, task.projectId);

    let parentComment: Awaited<ReturnType<CommentsRepository['findCommentById']>> = null;
    if (dto.parentCommentId) {
      parentComment = await this.commentsRepository.findCommentById(dto.parentCommentId);

      if (!parentComment || parentComment.taskId !== taskId) {
        throw new ForbiddenException('Parent comment must belong to same task');
      }
    }

    const createdComment = await this.commentsRepository.createComment({
      content: dto.content ?? '',
      task: { connect: { id: taskId } },
      user: { connect: { id: userId } },
      parentComment: dto.parentCommentId
        ? { connect: { id: dto.parentCommentId } }
        : undefined,
    });

    const historyPromise = this.commentsRepository.createTaskHistory({
      task: { connect: { id: taskId } },
      user: { connect: { id: userId } },
      actionType: TASK_HISTORY_ACTIONS.COMMENTED,
      metadata: buildTaskHistoryMetadata({
        comment: {
          old: null,
          new: {
            commentId: createdComment.id,
            content: createdComment.content,
          },
        },
      }),
    });

    const mentionedUserIds =
      await this.notificationPreferencesService.filterEnabledUserIds(
        (dto.mentionIds || []).filter((mentionId) => mentionId !== userId),
        NOTIFICATION_PREFERENCE_KEYS.mentions,
      );
    const notificationPromises = mentionedUserIds.map((mentionId) =>
      this.notificationsRepository.create({
        type: NotificationType.TASK_COMMENTED,
        title: 'You were mentioned in a comment',
        content: dto.content,
        data: { taskId, commentId: createdComment.id, authorId: userId },
        userId: mentionId,
        projectId: task.projectId,
      }),
    );

    const shouldNotifyParentAuthor =
      parentComment &&
      parentComment.userId !== userId &&
      !mentionedUserIds.includes(parentComment.userId) &&
      (await this.notificationPreferencesService.isEnabled(
        parentComment.userId,
        NOTIFICATION_PREFERENCE_KEYS.comments,
      ));

    if (shouldNotifyParentAuthor) {
      notificationPromises.push(
        this.notificationsRepository.create({
          type: NotificationType.TASK_COMMENTED,
          title: 'Someone replied to your comment',
          content: dto.content,
          data: {
            taskId,
            commentId: createdComment.id,
            parentCommentId: parentComment.id,
            authorId: userId,
          },
          userId: parentComment.userId,
          projectId: task.projectId,
        }),
      );
    }

    await Promise.all([historyPromise, ...notificationPromises]);

    this.logger.log(`Comment ${createdComment.id} created by user ${userId}`);
    return createdComment;
  }

  async update(userId: string, id: string, dto: UpdateCommentDto) {
    const existingComment = await this.commentsRepository.findCommentById(id);

    if (!existingComment) {
      throw new NotFoundException('Comment not found');
    }

    if (existingComment.userId !== userId) {
      throw new ForbiddenException('Only comment owner can update comment');
    }

    const task = await this.commentsRepository.findTaskById(existingComment.taskId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.projectAccessService.ensureProjectMember(userId, task.projectId);

    const updatedComment = await this.commentsRepository.updateComment(id, dto.content);

    await Promise.all([
      this.commentsRepository.createTaskHistory({
        task: { connect: { id: existingComment.taskId } },
        user: { connect: { id: userId } },
        actionType: TASK_HISTORY_ACTIONS.COMMENT_UPDATED,
        metadata: buildTaskHistoryMetadata({
          comment: {
            old: {
              commentId: existingComment.id,
              content: existingComment.content,
            },
            new: {
              commentId: existingComment.id,
              content: dto.content,
            },
          },
        }),
      }),
    ]);

    this.logger.log(`Comment ${id} updated by user ${userId}`);
    return updatedComment;
  }

  async remove(userId: string, id: string) {
    const existingComment = await this.commentsRepository.findCommentById(id);

    if (!existingComment) {
      throw new NotFoundException('Comment not found');
    }

    const task = await this.commentsRepository.findTaskById(existingComment.taskId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const access = await this.projectAccessService.ensureProjectMember(
      userId,
      task.projectId,
    );

    if (!access.isOwner && access.role !== 'ADMIN' && existingComment.userId !== userId) {
      throw new ForbiddenException('Only comment owner or project owner/admin can delete comment');
    }

    await this.commentsRepository.deleteComment(id);

    await Promise.all([
      this.commentsRepository.createTaskHistory({
        task: { connect: { id: existingComment.taskId } },
        user: { connect: { id: userId } },
        actionType: TASK_HISTORY_ACTIONS.COMMENT_DELETED,
        metadata: buildTaskHistoryMetadata({
          comment: {
            old: {
              commentId: existingComment.id,
              content: existingComment.content,
            },
            new: null,
          },
        }),
      }),
    ]);

    this.logger.log(`Comment ${id} deleted by user ${userId}`);
    return { success: true };
  }
}
