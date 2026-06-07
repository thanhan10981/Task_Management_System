import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectStatus, TaskPriority, UserRole } from '@prisma/client';
import {
  createPaginatedResponse,
  createPaginationOptions,
} from '../../common/helpers/pagination.helper';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  AdminProjectQueryDto,
  AdminSearchQueryDto,
  AdminTaskQueryDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      totalTasks,
      taskStatusGroups,
      recentProjects,
      recentTasks,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.project.count(),
      this.prisma.task.count({ where: { isDeleted: false } }),
      this.prisma.task.groupBy({
        by: ['statusId'],
        where: { isDeleted: false },
        _count: { _all: true },
      }),
      this.prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          creator: { select: this.safeUserSelect() },
          _count: { select: { members: true, tasks: true } },
        },
      }),
      this.prisma.task.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: this.taskInclude(),
      }),
    ]);

    const statuses = await this.prisma.taskStatus.findMany({
      where: { id: { in: taskStatusGroups.map((group) => group.statusId) } },
      select: { id: true, name: true, color: true, isDone: true, projectId: true },
    });
    const statusById = new Map(statuses.map((status) => [status.id, status]));

    return {
      totals: {
        users: totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        projects: totalProjects,
        tasks: totalTasks,
      },
      tasksByStatus: taskStatusGroups.map((group) => ({
        statusId: group.statusId,
        statusName: statusById.get(group.statusId)?.name ?? 'Unknown',
        color: statusById.get(group.statusId)?.color ?? null,
        isDone: statusById.get(group.statusId)?.isDone ?? false,
        count: group._count._all,
      })),
      recentProjects,
      recentTasks,
    };
  }

  async listUsers(queryDto: AdminSearchQueryDto) {
    const { skip, take } = createPaginationOptions(queryDto);
    const where = this.userSearchWhere(queryDto.search);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          ...this.safeUserSelect(),
          _count: {
            select: {
              projectsCreated: true,
              projectMembers: true,
              tasksCreated: true,
              taskAssignees: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return createPaginatedResponse(users, total, queryDto);
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...this.safeUserSelect(),
        _count: {
          select: {
            projectsCreated: true,
            projectMembers: true,
            tasksCreated: true,
            taskAssignees: true,
            comments: true,
            filesUploaded: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserRole(currentUserId: string, targetUserId: string, role: UserRole) {
    await this.ensureUserExists(targetUserId);

    if (currentUserId === targetUserId && role !== UserRole.ADMIN) {
      throw new ConflictException('You cannot remove your own admin role');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: this.safeUserSelect(),
    });
  }

  async updateUserStatus(currentUserId: string, targetUserId: string, isActive: boolean) {
    await this.ensureUserExists(targetUserId);

    if (currentUserId === targetUserId && !isActive) {
      throw new ConflictException('You cannot disable your own account');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
      select: this.safeUserSelect(),
    });
  }

  async listProjects(queryDto: AdminProjectQueryDto) {
    const { skip, take } = createPaginationOptions(queryDto);
    const where: Prisma.ProjectWhereInput = {
      ...(queryDto.status ? { status: queryDto.status } : {}),
      ...(queryDto.search
        ? {
            OR: [
              { name: { contains: queryDto.search, mode: 'insensitive' } },
              { description: { contains: queryDto.search, mode: 'insensitive' } },
              { creator: { fullName: { contains: queryDto.search, mode: 'insensitive' } } },
              { creator: { email: { contains: queryDto.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          creator: { select: this.safeUserSelect() },
          _count: { select: { members: true, tasks: true, files: true } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return createPaginatedResponse(projects, total, queryDto);
  }

  async updateProjectStatus(projectId: string, status: ProjectStatus) {
    await this.ensureProjectExists(projectId);
    return this.prisma.project.update({
      where: { id: projectId },
      data: { status },
      include: {
        creator: { select: this.safeUserSelect() },
        _count: { select: { members: true, tasks: true } },
      },
    });
  }

  async deleteProject(projectId: string) {
    await this.ensureProjectExists(projectId);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { success: true };
  }

  async listTasks(queryDto: AdminTaskQueryDto) {
    const { skip, take } = createPaginationOptions(queryDto);
    const where: Prisma.TaskWhereInput = {
      isDeleted: false,
      ...(queryDto.projectId ? { projectId: queryDto.projectId } : {}),
      ...(queryDto.statusId ? { statusId: queryDto.statusId } : {}),
      ...(queryDto.priority ? { priority: queryDto.priority as TaskPriority } : {}),
      ...(queryDto.assigneeId ? { assignees: { some: { userId: queryDto.assigneeId } } } : {}),
      ...(queryDto.search
        ? {
            OR: [
              { title: { contains: queryDto.search, mode: 'insensitive' } },
              { description: { contains: queryDto.search, mode: 'insensitive' } },
              { project: { name: { contains: queryDto.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: this.taskInclude(),
      }),
      this.prisma.task.count({ where }),
    ]);

    return createPaginatedResponse(tasks, total, queryDto);
  }

  async updateTaskStatus(taskId: string, statusId: string, adminUserId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const status = await this.prisma.taskStatus.findUnique({
      where: { id: statusId },
      select: { id: true, projectId: true },
    });

    if (!status || status.projectId !== task.projectId) {
      throw new NotFoundException('Task status not found in project');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { statusId, updatedBy: adminUserId },
      include: this.taskInclude(),
    });
  }

  async deleteTask(taskId: string, adminUserId: string) {
    await this.ensureTaskExists(taskId);
    return this.prisma.task.update({
      where: { id: taskId },
      data: { isDeleted: true, updatedBy: adminUserId },
      include: this.taskInclude(),
    });
  }

  async listMembers(queryDto: AdminSearchQueryDto) {
    const { skip, take } = createPaginationOptions(queryDto);
    const where: Prisma.ProjectMemberWhereInput = queryDto.search
      ? {
          OR: [
            { role: { contains: queryDto.search, mode: 'insensitive' } },
            { user: { fullName: { contains: queryDto.search, mode: 'insensitive' } } },
            { user: { email: { contains: queryDto.search, mode: 'insensitive' } } },
            { project: { name: { contains: queryDto.search, mode: 'insensitive' } } },
          ],
        }
      : {};

    const [members, total] = await Promise.all([
      this.prisma.projectMember.findMany({
        where,
        orderBy: { joinedAt: 'desc' },
        skip,
        take,
        include: {
          user: { select: this.safeUserSelect() },
          project: {
            select: {
              id: true,
              name: true,
              status: true,
              createdAt: true,
              creator: { select: this.safeUserSelect() },
            },
          },
          addedByUser: { select: this.safeUserSelect() },
        },
      }),
      this.prisma.projectMember.count({ where }),
    ]);

    return createPaginatedResponse(members, total, queryDto);
  }

  private safeUserSelect() {
    return {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      coverUrl: true,
      jobTitle: true,
      phone: true,
      bio: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    } satisfies Prisma.UserSelect;
  }

  private taskInclude() {
    return {
      project: { select: { id: true, name: true, status: true } },
      status: { select: { id: true, name: true, color: true, isDone: true } },
      group: { select: { id: true, name: true, color: true } },
      sprint: { select: { id: true, name: true, status: true } },
      createdByUser: { select: this.safeUserSelect() },
      updatedByUser: { select: this.safeUserSelect() },
      assignees: {
        include: {
          user: { select: this.safeUserSelect() },
        },
      },
    } satisfies Prisma.TaskInclude;
  }

  private userSearchWhere(search?: string): Prisma.UserWhereInput {
    if (!search) {
      return {};
    }

    return {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  private async ensureUserExists(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private async ensureProjectExists(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  private async ensureTaskExists(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id }, select: { id: true } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
  }
}
