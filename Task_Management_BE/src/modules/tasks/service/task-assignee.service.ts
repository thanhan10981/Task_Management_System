import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProjectAccessService } from '../../../common/access/project-access.service';
import { AssignTaskUserDto } from '../dto/task.dto';
import {
  TASK_ACTIVITY_ACTIONS,
  TASK_HISTORY_ACTIONS,
} from '../constants/task-actions.constants';
import { TasksRepository } from '../repository/tasks.repository';

@Injectable()
export class TaskAssigneeService {
  private readonly logger = new Logger(TaskAssigneeService.name);

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly projectAccessService: ProjectAccessService,
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

    await this.projectAccessService.ensureProjectMember(userId, task.projectId);
    await this.projectAccessService.ensureProjectMember(dto.userId, task.projectId);

    const existingAssignment = await this.tasksRepository.findAssignment(
      taskId,
      dto.userId,
    );

    if (existingAssignment) {
      throw new ConflictException('User is already assigned to task');
    }

    let assignment;
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
              action: TASK_HISTORY_ACTIONS.ASSIGNED,
              newValue: {
                assigneeId: dto.userId,
              },
            },
            tx,
          ),
          this.tasksRepository.createActivityLog(
            {
              user: { connect: { id: userId } },
              project: { connect: { id: task.projectId } },
              entityType: 'TASK',
              entityId: taskId,
              action: TASK_ACTIVITY_ACTIONS.ASSIGNED,
              description: `Task ${taskId} assigned to ${dto.userId}`,
            },
            tx,
          ),
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
    return assignment;
  }

  async unassignUser(userId: string, taskId: string, assigneeUserId: string) {
    const task = await this.tasksRepository.findTaskBasicById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.projectAccessService.ensureProjectMember(userId, task.projectId);

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
            action: TASK_HISTORY_ACTIONS.UNASSIGNED,
            oldValue: {
              assigneeId: assigneeUserId,
            },
          },
          tx,
        ),
        this.tasksRepository.createActivityLog(
          {
            user: { connect: { id: userId } },
            project: { connect: { id: task.projectId } },
            entityType: 'TASK',
            entityId: taskId,
            action: TASK_ACTIVITY_ACTIONS.UNASSIGNED,
            description: `Task ${taskId} unassigned from ${assigneeUserId}`,
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
