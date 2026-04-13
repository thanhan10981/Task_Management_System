import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  createPaginatedResponse,
  createPaginationOptions,
} from '../../../common/helpers/pagination.helper';
import { ProjectAccessService } from '../../../common/access/project-access.service';
import {
  CreateTaskDto,
  TaskQueryDto,
  UpdateTaskDto,
} from '../dto/task.dto';
import {
  TASK_ACTIVITY_ACTIONS,
  TASK_HISTORY_ACTIONS,
} from '../constants/task-actions.constants';
import { TasksRepository } from '../repository/tasks.repository';
import { TxClient } from '../repository/tasks.repository';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async create(userId: string, createTaskDto: CreateTaskDto) {
    await this.projectAccessService.ensureProjectMember(userId, createTaskDto.projectId);

    const status = await this.tasksRepository.findStatusById(createTaskDto.statusId);
    if (!status || status.projectId !== createTaskDto.projectId) {
      throw new NotFoundException('Task status not found in project');
    }

    const task = await this.tasksRepository.withTransaction(async (tx) => {
      const createdTask = await this.tasksRepository.createTask(
        {
          title: createTaskDto.title,
          description: createTaskDto.description,
          priority: createTaskDto.priority || 'MEDIUM',
          project: { connect: { id: createTaskDto.projectId } },
          status: { connect: { id: createTaskDto.statusId } },
          parentTask: createTaskDto.parentTaskId
            ? { connect: { id: createTaskDto.parentTaskId } }
            : undefined,
          startDate: createTaskDto.startDate
            ? new Date(createTaskDto.startDate)
            : null,
          dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
          createdByUser: { connect: { id: userId } },
        },
        tx,
      );

      await this.recordHistoryAndActivity(
        tx,
        createdTask.id,
        createdTask.projectId,
        userId,
        TASK_HISTORY_ACTIONS.CREATED,
        TASK_ACTIVITY_ACTIONS.CREATED,
        {
          newValue: {
            title: createdTask.title,
            statusId: createdTask.statusId,
            priority: createdTask.priority,
          },
          description: `Task ${createdTask.title} created`,
        },
      );

      return createdTask;
    });

    this.logger.log(`Task ${task.id} created by user ${userId}`);
    return task;
  }

  async findAll(userId: string, queryDto: TaskQueryDto) {
    const { skip, take } = createPaginationOptions(queryDto);

    const where: Prisma.TaskWhereInput = {
      project: {
        OR: [
          { createdBy: userId },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
    };

    if (queryDto.projectId) {
      await this.projectAccessService.ensureProjectMember(userId, queryDto.projectId);
      where.projectId = queryDto.projectId;
    }

    if (queryDto.status) {
      where.status = {
        name: queryDto.status,
      };
    }

    if (queryDto.priority) {
      where.priority = queryDto.priority;
    }

    if (queryDto.search) {
      where.OR = [
        { title: { contains: queryDto.search, mode: 'insensitive' } },
        { description: { contains: queryDto.search, mode: 'insensitive' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      this.tasksRepository.findTasks(where, skip, take),
      this.tasksRepository.countTasks(where),
    ]);

    return createPaginatedResponse(tasks, total, queryDto);
  }

  async findByParentTask(userId: string, parentTaskId: string, queryDto: TaskQueryDto) {
    const parentTask = await this.tasksRepository.findTaskBasicById(parentTaskId);

    if (!parentTask) {
      throw new NotFoundException('Parent task not found');
    }

    await this.projectAccessService.ensureProjectMember(userId, parentTask.projectId);

    const { skip, take } = createPaginationOptions(queryDto);
    const where: Prisma.TaskWhereInput = {
      parentTaskId,
      projectId: parentTask.projectId,
    };

    if (queryDto.status) {
      where.status = {
        name: queryDto.status,
      };
    }

    if (queryDto.priority) {
      where.priority = queryDto.priority;
    }

    if (queryDto.search) {
      where.OR = [
        { title: { contains: queryDto.search, mode: 'insensitive' } },
        { description: { contains: queryDto.search, mode: 'insensitive' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      this.tasksRepository.findTasks(where, skip, take),
      this.tasksRepository.countTasks(where),
    ]);

    return createPaginatedResponse(tasks, total, queryDto);
  }

  async findOne(userId: string, id: string) {
    const task = await this.tasksRepository.findTaskById(id);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.projectAccessService.ensureProjectMember(userId, task.projectId);
    return task;
  }

  async update(userId: string, id: string, updateTaskDto: UpdateTaskDto) {
    const existingTask = await this.tasksRepository.findTaskBasicById(id);

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    await this.projectAccessService.ensureProjectMember(userId, existingTask.projectId);

    if (updateTaskDto.statusId) {
      const nextStatus = await this.tasksRepository.findStatusById(updateTaskDto.statusId);
      if (!nextStatus || nextStatus.projectId !== existingTask.projectId) {
        throw new NotFoundException('Task status not found in project');
      }
    }

    const updateData: Prisma.TaskUpdateInput = {
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : undefined,
      startDate: updateTaskDto.startDate
        ? new Date(updateTaskDto.startDate)
        : undefined,
      updatedByUser: { connect: { id: userId } },
    };

    const updatedTask = await this.tasksRepository.withTransaction(async (tx) => {
      const task = await this.tasksRepository.updateTask(id, updateData, tx);

      const historyAction =
        updateTaskDto.statusId && updateTaskDto.statusId !== existingTask.statusId
          ? TASK_HISTORY_ACTIONS.STATUS_CHANGED
          : TASK_HISTORY_ACTIONS.UPDATED;

      await this.recordHistoryAndActivity(
        tx,
        id,
        task.projectId,
        userId,
        historyAction,
        TASK_ACTIVITY_ACTIONS.UPDATED,
        {
          oldValue: {
            title: existingTask.title,
            description: existingTask.description,
            statusId: existingTask.statusId,
            priority: existingTask.priority,
            startDate: existingTask.startDate,
            dueDate: existingTask.dueDate,
          },
          newValue: {
            title: task.title,
            description: task.description,
            statusId: task.statusId,
            priority: task.priority,
            startDate: task.startDate,
            dueDate: task.dueDate,
          },
          description: `Task ${task.title} updated`,
        },
      );

      return task;
    });

    this.logger.log(`Task ${id} updated by user ${userId}`);
    return updatedTask;
  }

  async remove(userId: string, id: string) {
    // Soft delete keeps auditability and mirrors Jira/Notion recoverable workflows.
    const task = await this.tasksRepository.findTaskBasicById(id);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const access = await this.projectAccessService.ensureProjectMember(
      userId,
      task.projectId,
    );

    if (!access.isOwner && access.role !== 'ADMIN' && task.createdBy !== userId) {
      throw new ConflictException('Only owner/admin or task creator can delete task');
    }

    await this.tasksRepository.withTransaction(async (tx) => {
      await this.tasksRepository.softDeleteTask(id, userId, tx);

      await this.recordHistoryAndActivity(
        tx,
        id,
        task.projectId,
        userId,
        TASK_HISTORY_ACTIONS.DELETED,
        TASK_ACTIVITY_ACTIONS.DELETED,
        {
          oldValue: {
            title: task.title,
            description: task.description,
          },
          description: `Task ${task.title} soft deleted`,
        },
      );
    });

    this.logger.log(`Task ${id} soft deleted by user ${userId}`);
    return { success: true };
  }

  async getHistory(userId: string, taskId: string, queryDto: TaskQueryDto) {
    // Task history is read-only by design; writes only occur as task side effects.
    await this.projectAccessService.ensureTaskAccess(userId, taskId);

    const { skip, take } = createPaginationOptions(queryDto);

    const [history, total] = await Promise.all([
      this.tasksRepository.listTaskHistory(taskId, skip, take),
      this.tasksRepository.countTaskHistory(taskId),
    ]);

    return createPaginatedResponse(history, total, queryDto);
  }

  private async recordHistoryAndActivity(
    tx: TxClient,
    taskId: string,
    projectId: string,
    actorId: string,
    historyAction: string,
    activityAction: string,
    payload: {
      oldValue?: Record<string, unknown>;
      newValue?: Record<string, unknown>;
      description: string;
    },
  ) {
    await Promise.all([
      this.tasksRepository.createTaskHistory(
        {
          task: { connect: { id: taskId } },
          user: { connect: { id: actorId } },
          action: historyAction,
          oldValue: payload.oldValue as Prisma.InputJsonValue,
          newValue: payload.newValue as Prisma.InputJsonValue,
        },
        tx,
      ),
      this.tasksRepository.createActivityLog(
        {
          user: { connect: { id: actorId } },
          project: { connect: { id: projectId } },
          entityType: 'TASK',
          entityId: taskId,
          action: activityAction,
          description: payload.description,
        },
        tx,
      ),
    ]);
  }
}
