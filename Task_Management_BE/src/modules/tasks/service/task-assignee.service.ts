import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { NOTIFICATION_PREFERENCE_KEYS } from '../../../common/notifications/notification-preferences.constants';
import { NotificationPreferencesService } from '../../../common/notifications/notification-preferences.service';
import { ProjectAccessService } from '../../../common/access/project-access.service';
import { AssignTaskUserDto } from '../dto/task.dto';
import {
  TASK_HISTORY_ACTIONS,
} from '../constants/task-actions.constants';
import { TasksRepository } from '../repository/tasks.repository';
import { buildTaskHistoryMetadata } from '../utils/task-history.util';
import { TaskAssignmentMailService } from './task-assignment-mail.service';

@Injectable()
export class TaskAssigneeService {
  private readonly logger = new Logger(TaskAssigneeService.name);

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly projectAccessService: ProjectAccessService,
    private readonly notificationPreferencesService: NotificationPreferencesService,
    private readonly taskAssignmentMailService: TaskAssignmentMailService,
  ) {}

  async listAssignees(userId: string, taskId: string) {
    await this.projectAccessService.ensureTaskAccess(userId, taskId);
    return this.tasksRepository.listAssignees(taskId);
  }

  async assignUser(userId: string, taskId: string, dto: AssignTaskUserDto) {
    const task = await this.tasksRepository.findTaskBasicById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.projectAccessService.ensureProjectAdminOrOwner(
      userId,
      task.projectId,
    );
    await this.projectAccessService.ensureProjectMember(dto.userId, task.projectId);

    const existingAssignment = await this.tasksRepository.findAssignment(
      taskId,
      dto.userId,
    );

    if (existingAssignment) {
      throw new ConflictException('User is already assigned to task');
    }

    let assignment;
    const assignmentMailUserIds: string[] = [];
    try {
      assignment = await this.tasksRepository.withTransaction(async (tx) => {
        const created = await this.tasksRepository.assignUser(
          taskId,
          dto.userId,
          userId,
          tx,
        );

        await Promise.all([
          this.tasksRepository.createTaskHistory(
            {
              task: { connect: { id: taskId } },
              user: { connect: { id: userId } },
              actionType: TASK_HISTORY_ACTIONS.ASSIGNED,
              metadata: buildTaskHistoryMetadata({
                assignee: {
                  old: null,
                  new: dto.userId,
                },
              }),
            },
            tx,
          ),
          ...(dto.userId !== userId &&
          (await this.notificationPreferencesService.isEnabled(
            dto.userId,
            NOTIFICATION_PREFERENCE_KEYS.taskAssigned,
          ))
            ? (assignmentMailUserIds.push(dto.userId),
              [
                this.tasksRepository.createNotification(
                  {
                    user: { connect: { id: dto.userId } },
                    project: { connect: { id: task.projectId } },
                    type: NotificationType.TASK_ASSIGNED,
                    title: 'You were assigned to a task',
                    content: `You have been assigned to task "${task.title}".`,
                    data: {
                      taskId,
                      projectId: task.projectId,
                      assignedBy: userId,
                      action: TASK_HISTORY_ACTIONS.ASSIGNED,
                    },
                  },
                  tx,
                ),
              ])
            : []),
        ]);

        return created;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User is already assigned to task');
      }

      throw error;
    }

    this.logger.log(`Task ${taskId} assigned to user ${dto.userId} by ${userId}`);

    await this.taskAssignmentMailService.sendTaskAssignedEmails({
      assigneeIds: assignmentMailUserIds,
      taskTitle: task.title,
      projectName: task.project?.name,
    });

    return assignment;
  }

  async unassignUser(userId: string, taskId: string, assigneeUserId: string) {
    const task = await this.tasksRepository.findTaskBasicById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.projectAccessService.ensureProjectAdminOrOwner(
      userId,
      task.projectId,
    );

    const existingAssignment = await this.tasksRepository.findAssignment(
      taskId,
      assigneeUserId,
    );

    if (!existingAssignment) {
      throw new NotFoundException('Task assignee not found');
    }

    await this.tasksRepository.withTransaction(async (tx) => {
      await this.tasksRepository.unassignUser(taskId, assigneeUserId, tx);

      await Promise.all([
        this.tasksRepository.createTaskHistory(
          {
            task: { connect: { id: taskId } },
            user: { connect: { id: userId } },
            actionType: TASK_HISTORY_ACTIONS.UNASSIGNED,
            metadata: buildTaskHistoryMetadata({
              assignee: {
                old: assigneeUserId,
                new: null,
              },
            }),
          },
          tx,
        ),
      ]);
    });

    this.logger.log(
      `Task ${taskId} unassigned from user ${assigneeUserId} by ${userId}`,
    );

    return { success: true };
  }
}
