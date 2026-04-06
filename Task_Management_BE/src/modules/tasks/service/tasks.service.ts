import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from '../dto/task.dto';
import { createPaginationOptions, createPaginatedResponse } from '../../../common/helpers/pagination.helper';

const safeTaskUserSelect = {
  id: true,
  fullName: true,
  email: true,
  avatarUrl: true,
  coverUrl: true,
  jobTitle: true,
  phone: true,
  bio: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createTaskDto: CreateTaskDto) {
    const assigneeIds = Array.from(new Set([...(createTaskDto.assigneeIds ?? []), userId]));

    const task = await this.prisma.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        priority: createTaskDto.priority || 'MEDIUM',
        projectId: createTaskDto.projectId,
        statusId: createTaskDto.statusId,
        dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
        startDate: createTaskDto.startDate ? new Date(createTaskDto.startDate) : null,
        createdBy: userId,
        assignees: {
          create: assigneeIds.map((assigneeId) => ({
            userId: assigneeId,
            assignedBy: userId,
          })),
        },
      },
      include: {
        createdByUser: {
          select: safeTaskUserSelect,
        },
        status: true,
        project: true,
        assignees: true,
      },
    });

    return this.mapTaskResponse(task);
  }

  async findAll(userId: string, queryDto: TaskQueryDto) {
    const { skip, take } = createPaginationOptions(queryDto);

    const where: any = {
      createdBy: userId,
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
      this.prisma.task.findMany({
        where,
        include: {
          createdByUser: {
            select: safeTaskUserSelect,
          },
          status: true,
          project: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.task.count({ where }),
    ]);

    const mappedTasks = tasks.map((task) => this.mapTaskResponse(task));

    return createPaginatedResponse(mappedTasks, total, queryDto);
  }

  async findByParentTask(userId: string, parentTaskId: string, queryDto: TaskQueryDto) {
    const { skip, take } = createPaginationOptions(queryDto);

    const where: any = {
      createdBy: userId,
      parentTaskId,
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
      this.prisma.task.findMany({
        where,
        include: {
          createdByUser: {
            select: safeTaskUserSelect,
          },
          status: true,
          project: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.task.count({ where }),
    ]);

    const mappedTasks = tasks.map((task) => this.mapTaskResponse(task));

    return createPaginatedResponse(mappedTasks, total, queryDto);
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: safeTaskUserSelect,
        },
        status: true,
        project: true,
        assignees: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.createdBy !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return this.mapTaskResponse(task);
  }

  async update(userId: string, id: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.createdBy !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    const updateData: any = { ...updateTaskDto };
    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }
    if (updateTaskDto.startDate) {
      updateData.startDate = new Date(updateTaskDto.startDate);
    }
    updateData.updatedBy = userId;

    await this.prisma.task.update({
      where: { id },
      data: updateData,
    });

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.createdBy !== userId) {
      throw new ForbiddenException('Only the task owner can delete this task');
    }

    const [subtasks, assignees, comments, history, files] = await this.prisma.$transaction([
      this.prisma.task.count({ where: { parentTaskId: id } }),
      this.prisma.taskAssignee.count({ where: { taskId: id } }),
      this.prisma.comment.count({ where: { taskId: id } }),
      this.prisma.taskHistory.count({ where: { taskId: id } }),
      this.prisma.file.count({ where: { taskId: id } }),
    ]);

    const relationUsage = {
      subtasks,
      assignees,
      comments,
      history,
      files,
    };

    const hasRelatedData = Object.values(relationUsage).some((count) => count > 0);

    if (hasRelatedData) {
      throw new ConflictException({
        message: 'Cannot delete task with related data',
        relations: relationUsage,
      });
    }

    await this.prisma.task.delete({
      where: { id },
    });

    return { success: true };
  }

  private mapTaskResponse(task: any) {
    return task;
  }
}
