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
  TASK_HISTORY_ACTIONS,
} from '../constants/task-actions.constants';
import { TasksRepository } from '../repository/tasks.repository';
import { TxClient } from '../repository/tasks.repository';
import { buildTaskHistoryMetadata } from '../utils/task-history.util';

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

    const assigneeIds = Array.from(
      new Set(createTaskDto.assigneeIds?.length ? createTaskDto.assigneeIds : [userId]),
    );
    const assignsOtherUsers = assigneeIds.some((assigneeId) => assigneeId !== userId);

    if (assignsOtherUsers) {
      await this.projectAccessService.ensureProjectAdminOrOwner(
        userId,
        createTaskDto.projectId,
      );
    }

    await Promise.all(
      assigneeIds.map((assigneeId) =>
        this.projectAccessService.ensureProjectMember(
          assigneeId,
          createTaskDto.projectId,
        ),
      ),
    );

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
        userId,
        TASK_HISTORY_ACTIONS.CREATED,
        buildTaskHistoryMetadata({
          task: {
            old: null,
            new: {
              title: createdTask.title,
              description: createdTask.description,
              status: status.name,
              priority: createdTask.priority,
              startDate: createdTask.startDate,
              dueDate: createdTask.dueDate,
            },
          },
        }),
      );

      for (const assigneeId of assigneeIds) {
        await this.tasksRepository.assignUser(createdTask.id, assigneeId, userId, tx);

        await this.recordHistoryAndActivity(
          tx,
          createdTask.id,
          userId,
          TASK_HISTORY_ACTIONS.ASSIGNED,
          buildTaskHistoryMetadata({
            assignee: {
              old: null,
              new: assigneeId,
            },
          }),
        );
      }

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

    const { assigneeIds, ...taskPatch } = updateTaskDto;

    let nextStatus = null;
    if (taskPatch.statusId) {
      nextStatus = await this.tasksRepository.findStatusById(taskPatch.statusId);
      if (!nextStatus || nextStatus.projectId !== existingTask.projectId) {
        throw new NotFoundException('Task status not found in project');
      }
    }

    if (assigneeIds?.length) {
      await this.projectAccessService.ensureProjectAdminOrOwner(
        userId,
        existingTask.projectId,
      );

      await Promise.all(
        assigneeIds.map((assigneeId) =>
          this.projectAccessService.ensureProjectMember(
            assigneeId,
            existingTask.projectId,
          ),
        ),
      );
    }

    const {
      statusId,
      parentTaskId,
      dueDate,
      startDate,
      ...taskScalarPatch
    } = taskPatch;

    const updateData: Prisma.TaskUpdateInput = {
      ...taskScalarPatch,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      status: statusId ? { connect: { id: statusId } } : undefined,
      parentTask:
        parentTaskId === undefined
          ? undefined
          : parentTaskId
            ? { connect: { id: parentTaskId } }
            : { disconnect: true },
      updatedByUser: { connect: { id: userId } },
    };

    const updatedTask = await this.tasksRepository.withTransaction(async (tx) => {
      const task = await this.tasksRepository.updateTask(id, updateData, tx);
      const updateChanges: Record<string, { old: unknown; new: unknown }> = {};

      if (
        taskPatch.title !== undefined &&
        taskPatch.title !== existingTask.title
      ) {
        updateChanges.title = {
          old: existingTask.title,
          new: task.title,
        };
      }

      if (
        taskPatch.description !== undefined &&
        taskPatch.description !== existingTask.description
      ) {
        updateChanges.description = {
          old: existingTask.description,
          new: task.description,
        };
      }

      if (
        taskPatch.priority !== undefined &&
        taskPatch.priority !== existingTask.priority
      ) {
        updateChanges.priority = {
          old: existingTask.priority,
          new: task.priority,
        };
      }

      if (taskPatch.startDate !== undefined) {
        const oldStartDate = existingTask.startDate?.toISOString() ?? null;
        const newStartDate = task.startDate?.toISOString() ?? null;
        if (oldStartDate !== newStartDate) {
          updateChanges.startDate = {
            old: oldStartDate,
            new: newStartDate,
          };
        }
      }

      if (taskPatch.dueDate !== undefined) {
        const oldDueDate = existingTask.dueDate?.toISOString() ?? null;
        const newDueDate = task.dueDate?.toISOString() ?? null;
        if (oldDueDate !== newDueDate) {
          updateChanges.dueDate = {
            old: oldDueDate,
            new: newDueDate,
          };
        }
      }

      if (
        taskPatch.parentTaskId !== undefined &&
        taskPatch.parentTaskId !== existingTask.parentTaskId
      ) {
        updateChanges.parentTaskId = {
          old: existingTask.parentTaskId,
          new: task.parentTaskId,
        };
      }

      if (Object.keys(updateChanges).length > 0) {
        await this.recordHistoryAndActivity(
          tx,
          id,
          userId,
          TASK_HISTORY_ACTIONS.UPDATED,
          buildTaskHistoryMetadata(updateChanges),
        );
      }

      if (
        nextStatus &&
        taskPatch.statusId &&
        taskPatch.statusId !== existingTask.statusId
      ) {
        await this.recordHistoryAndActivity(
          tx,
          id,
          userId,
          TASK_HISTORY_ACTIONS.STATUS_CHANGED,
          buildTaskHistoryMetadata({
            status: {
              old: existingTask.status.name,
              new: nextStatus.name,
            },
          }),
        );
      }

      if (assigneeIds?.length) {
        const existingAssigneeIds = new Set(
          (await this.tasksRepository.listAssignees(id, tx)).map(
            (assignee) => assignee.userId,
          ),
        );

        for (const assigneeId of assigneeIds) {
          if (existingAssigneeIds.has(assigneeId)) {
            continue;
          }

          await this.tasksRepository.assignUser(id, assigneeId, userId, tx);
          await this.recordHistoryAndActivity(
            tx,
            id,
            userId,
            TASK_HISTORY_ACTIONS.ASSIGNED,
            buildTaskHistoryMetadata({
              assignee: {
                old: null,
                new: assigneeId,
              },
            }),
          );
        }
      }

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
        userId,
        TASK_HISTORY_ACTIONS.DELETED,
        buildTaskHistoryMetadata({
          task: {
            old: {
              title: task.title,
              description: task.description,
            },
            new: null,
          },
        }),
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
    actorId: string,
    historyAction: string,
    metadata: Prisma.InputJsonObject,
  ) {
    await this.tasksRepository.createTaskHistory(
      {
        task: { connect: { id: taskId } },
        user: { connect: { id: actorId } },
        actionType: historyAction,
        metadata,
      },
      tx,
    );
  }
}
