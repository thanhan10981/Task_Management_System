import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import {
  createPaginatedResponse,
  createPaginationOptions,
} from '../../../common/helpers/pagination.helper';
import { ProjectAccessService } from '../../../common/access/project-access.service';
import {
  CreateTaskGroupDto,
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

    if (createTaskDto.groupId) {
      const group = await this.tasksRepository.findGroupById(createTaskDto.groupId);
      if (!group || group.projectId !== createTaskDto.projectId) {
        throw new NotFoundException('Task group not found in project');
      }
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
          tags: createTaskDto.tags as Prisma.InputJsonObject | undefined,
          project: { connect: { id: createTaskDto.projectId } },
          status: { connect: { id: createTaskDto.statusId } },
          group: createTaskDto.groupId
            ? { connect: { id: createTaskDto.groupId } }
            : undefined,
          sprint: createTaskDto.sprintId
            ? { connect: { id: createTaskDto.sprintId } }
            : undefined,
          parentTask: createTaskDto.parentTaskId
            ? { connect: { id: createTaskDto.parentTaskId } }
            : undefined,
          startDate: createTaskDto.startDate
            ? new Date(createTaskDto.startDate)
            : null,
          dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
          createdByUser: { connect: { id: userId } },
        } as any,
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

        await Promise.all([
          this.recordHistoryAndActivity(
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
          ),
          ...(assigneeId !== userId
            ? [
                this.tasksRepository.createNotification(
                  {
                    user: { connect: { id: assigneeId } },
                    project: { connect: { id: createTaskDto.projectId } },
                    type: NotificationType.TASK_ASSIGNED,
                    title: 'You were assigned to a task',
                    content: `You have been assigned to task "${createdTask.title}".`,
                    data: {
                      taskId: createdTask.id,
                      projectId: createTaskDto.projectId,
                      assignedBy: userId,
                      action: TASK_HISTORY_ACTIONS.ASSIGNED,
                    },
                  },
                  tx,
                ),
              ]
            : []),
        ]);
      }

      return createdTask;
    });

    this.logger.log(`Task ${task.id} created by user ${userId}`);
    return task;
  }

  async findAll(userId: string, queryDto: TaskQueryDto) {
    const { skip, take } = createPaginationOptions(queryDto);
    const deletedOnly = queryDto.deleted === 'true';

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

    if (queryDto.groupId) {
      (where as any).groupId = queryDto.groupId;
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
      this.tasksRepository.findTasks(where, skip, take, { deletedOnly }),
      this.tasksRepository.countTasks(where, { deletedOnly }),
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

    if (queryDto.groupId) {
      (where as any).groupId = queryDto.groupId;
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

    if (taskPatch.groupId) {
      const nextGroup = await this.tasksRepository.findGroupById(taskPatch.groupId);
      if (!nextGroup || nextGroup.projectId !== existingTask.projectId) {
        throw new NotFoundException('Task group not found in project');
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
      groupId,
      sprintId,
      parentTaskId,
      dueDate,
      startDate,
      tags,
      ...taskScalarPatch
    } = taskPatch;

    const updateData = {
      ...taskScalarPatch,
      tags: tags === undefined ? undefined : (tags as Prisma.InputJsonObject | null),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      status: statusId ? { connect: { id: statusId } } : undefined,
      group:
        groupId === undefined
          ? undefined
          : groupId
            ? { connect: { id: groupId } }
            : { disconnect: true },
      sprint:
        sprintId === undefined
          ? undefined
          : sprintId
            ? { connect: { id: sprintId } }
            : { disconnect: true },
      parentTask:
        parentTaskId === undefined
          ? undefined
          : parentTaskId
            ? { connect: { id: parentTaskId } }
            : { disconnect: true },
      updatedByUser: { connect: { id: userId } },
    } as any;

    const updatedTask = await this.tasksRepository.withTransaction(async (tx) => {
      const task = await this.tasksRepository.updateTask(id, updateData, tx);
      const taskWithGroup = task as any;
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
        taskPatch.priority !== undefined &&
        taskPatch.priority !== existingTask.priority
      ) {
        updateChanges.priority = {
          old: existingTask.priority,
          new: task.priority,
        };
      }

      if (taskPatch.groupId !== undefined && taskPatch.groupId !== existingTask.groupId) {
        updateChanges.groupId = {
          old: existingTask.group
            ? { id: existingTask.group.id, name: existingTask.group.name }
            : null,
          new: taskWithGroup.group
            ? { id: taskWithGroup.group.id, name: taskWithGroup.group.name }
            : null,
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
          await Promise.all([
            this.recordHistoryAndActivity(
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
            ),
            ...(assigneeId !== userId
              ? [
                  this.tasksRepository.createNotification(
                    {
                      user: { connect: { id: assigneeId } },
                      project: { connect: { id: existingTask.projectId } },
                      type: NotificationType.TASK_ASSIGNED,
                      title: 'You were assigned to a task',
                      content: `You have been assigned to task "${task.title}".`,
                      data: {
                        taskId: id,
                        projectId: existingTask.projectId,
                        assignedBy: userId,
                        action: TASK_HISTORY_ACTIONS.ASSIGNED,
                      },
                    },
                    tx,
                  ),
                ]
              : []),
          ]);
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

  async restore(userId: string, id: string) {
    const task = await this.tasksRepository.findTaskBasicById(id, true);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const access = await this.projectAccessService.ensureProjectMember(
      userId,
      task.projectId,
    );

    if (!access.isOwner && access.role !== 'ADMIN' && task.createdBy !== userId) {
      throw new ConflictException('Only owner/admin or task creator can restore task');
    }

    const restoredTask = await this.tasksRepository.restoreTask(id, userId);

    this.logger.log(`Task ${id} restored by user ${userId}`);
    return restoredTask;
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

  async listProjectGroups(userId: string, projectId: string) {
    // Ensure user is a member of the project before listing groups
    await this.projectAccessService.ensureProjectMember(userId, projectId);
    
    const groups = await this.tasksRepository.listProjectGroups(projectId);
    
    return groups.map(group => ({
      id: group.id,
      name: group.name,
      color: group.color,
      position: group.position,
      projectId: group.projectId,
    }));
  }

  async createProjectGroup(
    userId: string,
    projectId: string,
    dto: CreateTaskGroupDto,
  ) {
    await this.projectAccessService.ensureProjectAdminOrOwner(userId, projectId);

    const existingGroups = await this.tasksRepository.listProjectGroups(projectId);
    const nextPosition =
      Math.max(0, ...existingGroups.map((group) => group.position ?? 0)) + 1;

    try {
      return await this.tasksRepository.createTaskGroup({
        project: { connect: { id: projectId } },
        name: dto.name.trim(),
        color: dto.color,
        position: nextPosition,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Group name or position already exists in this project',
        );
      }

      throw error;
    }
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
