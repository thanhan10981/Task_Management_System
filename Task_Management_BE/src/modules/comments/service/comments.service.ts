import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProjectAccessService } from '../../../common/access/project-access.service';
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

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly projectAccessService: ProjectAccessService,
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

    if (dto.parentCommentId) {
      const parentComment = await this.commentsRepository.findCommentById(
        dto.parentCommentId,
      );

      if (!parentComment || parentComment.taskId !== taskId) {
        throw new ForbiddenException('Parent comment must belong to same task');
      }
    }

    const createdComment = await this.commentsRepository.createComment({
      content: dto.content,
      task: { connect: { id: taskId } },
      user: { connect: { id: userId } },
      parentComment: dto.parentCommentId
        ? { connect: { id: dto.parentCommentId } }
        : undefined,
    });

    await Promise.all([
      this.commentsRepository.createTaskHistory({
        task: { connect: { id: taskId } },
        user: { connect: { id: userId } },
        action: 'TASK_COMMENTED',
        newValue: {
          commentId: createdComment.id,
          content: createdComment.content,
        },
      }),
      this.commentsRepository.createActivityLog({
        user: { connect: { id: userId } },
        project: { connect: { id: task.projectId } },
        entityType: 'TASK',
        entityId: taskId,
        action: 'TASK_COMMENTED',
        description: 'A comment was added to task',
      }),
    ]);

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
        action: 'TASK_COMMENT_UPDATED',
        oldValue: { content: existingComment.content },
        newValue: { content: dto.content },
      }),
      this.commentsRepository.createActivityLog({
        user: { connect: { id: userId } },
        project: { connect: { id: task.projectId } },
        entityType: 'TASK',
        entityId: existingComment.taskId,
        action: 'TASK_COMMENT_UPDATED',
        description: 'A task comment was updated',
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
        action: 'TASK_COMMENT_DELETED',
        oldValue: { commentId: existingComment.id, content: existingComment.content },
      }),
      this.commentsRepository.createActivityLog({
        user: { connect: { id: userId } },
        project: { connect: { id: task.projectId } },
        entityType: 'TASK',
        entityId: existingComment.taskId,
        action: 'TASK_COMMENT_DELETED',
        description: 'A task comment was deleted',
      }),
    ]);

    this.logger.log(`Comment ${id} deleted by user ${userId}`);
    return { success: true };
  }
}
