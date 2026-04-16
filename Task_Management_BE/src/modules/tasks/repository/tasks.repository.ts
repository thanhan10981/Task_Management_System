import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

export type TxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async withTransaction<T>(
    handler: (tx: TxClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction((tx) => handler(tx as TxClient));
  }

  findTaskById(id: string, includeDeleted = false) {
    return this.prisma.task.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { isDeleted: false }),
      },
      include: {
        status: true,
        project: true,
        assignees: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  findTaskBasicById(id: string, includeDeleted = false) {
    return this.prisma.task.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { isDeleted: false }),
      },
      select: {
        id: true,
        projectId: true,
        statusId: true,
        createdBy: true,
        title: true,
        description: true,
        priority: true,
        startDate: true,
        dueDate: true,
        parentTaskId: true,
        status: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  createTask(data: Prisma.TaskCreateInput, tx?: TxClient) {
    const client = tx ?? this.prisma;
    return client.task.create({
      data,
      include: {
        createdByUser: true,
        status: true,
        project: true,
      },
    });
  }

  updateTask(id: string, data: Prisma.TaskUpdateInput, tx?: TxClient) {
    const client = tx ?? this.prisma;
    return client.task.update({
      where: { id },
      data,
      include: {
        createdByUser: true,
        status: true,
        project: true,
        assignees: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  softDeleteTask(id: string, updatedBy: string, tx?: TxClient) {
    const client = tx ?? this.prisma;
    return client.task.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedBy,
      },
    });
  }

  findTasks(where: Prisma.TaskWhereInput, skip: number, take: number) {
    return this.prisma.task.findMany({
      where: {
        isDeleted: false,
        ...where,
      },
      include: {
        createdByUser: true,
        status: true,
        project: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  countTasks(where: Prisma.TaskWhereInput) {
    return this.prisma.task.count({
      where: {
        isDeleted: false,
        ...where,
      },
    });
  }

  findStatusById(id: string) {
    return this.prisma.taskStatus.findUnique({ where: { id } });
  }

  listProjectStatuses(projectId: string) {
    return this.prisma.taskStatus.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    });
  }

  createTaskStatus(data: Prisma.TaskStatusCreateInput) {
    return this.prisma.taskStatus.create({ data });
  }

  updateTaskStatus(id: string, data: Prisma.TaskStatusUpdateInput) {
    return this.prisma.taskStatus.update({ where: { id }, data });
  }

  deleteTaskStatus(id: string) {
    return this.prisma.taskStatus.delete({ where: { id } });
  }

  countTasksByStatus(statusId: string) {
    return this.prisma.task.count({
      where: {
        statusId,
        isDeleted: false,
      },
    });
  }

  findAssignment(taskId: string, userId: string) {
    return this.prisma.taskAssignee.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
      include: {
        user: true,
      },
    });
  }

  listAssignees(taskId: string, tx?: TxClient) {
    const client = tx ?? this.prisma;
    return client.taskAssignee.findMany({
      where: { taskId },
      include: {
        user: true,
      },
      orderBy: { assignedAt: 'asc' },
    });
  }

  assignUser(taskId: string, userId: string, assignedBy: string | null, tx?: TxClient) {
    const client = tx ?? this.prisma;
    return client.taskAssignee.create({
      data: {
        taskId,
        userId,
        assignedBy,
      },
      include: {
        user: true,
      },
    });
  }

  unassignUser(taskId: string, userId: string, tx?: TxClient) {
    const client = tx ?? this.prisma;
    return client.taskAssignee.delete({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });
  }

  createTaskHistory(data: Prisma.TaskHistoryCreateInput, tx?: TxClient) {
    const client = tx ?? this.prisma;
    return client.taskHistory.create({ data });
  }

  listTaskHistory(taskId: string, skip: number, take: number) {
    return this.prisma.taskHistory.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  countTaskHistory(taskId: string) {
    return this.prisma.taskHistory.count({ where: { taskId } });
  }

  getTaskDeleteRelationsCount(id: string) {
    return this.prisma.$transaction([
      this.prisma.task.count({ where: { parentTaskId: id, isDeleted: false } }),
      this.prisma.taskAssignee.count({ where: { taskId: id } }),
      this.prisma.comment.count({ where: { taskId: id } }),
      this.prisma.taskHistory.count({ where: { taskId: id } }),
      this.prisma.file.count({ where: { taskId: id, isDeleted: false } }),
    ]);
  }

  async reorderStatuses(projectId: string, statusId: string, newPosition: number) {
    const statuses = await this.prisma.taskStatus.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    });

    const target = statuses.find((status) => status.id === statusId);
    if (!target) {
      return null;
    }

    const filtered = statuses.filter((status) => status.id !== statusId);
    const safePosition = Math.max(1, Math.min(newPosition, filtered.length + 1));
    filtered.splice(safePosition - 1, 0, target);

    await this.prisma.$transaction(
      filtered.map((status, index) =>
        this.prisma.taskStatus.update({
          where: { id: status.id },
          data: { position: index + 1 },
        }),
      ),
    );

    return this.listProjectStatuses(projectId);
  }
}
