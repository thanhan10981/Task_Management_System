import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import Redis from 'ioredis';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ProjectAccessService } from '../../../common/access/project-access.service';
import { NOTIFICATION_PREFERENCE_KEYS } from '../../../common/notifications/notification-preferences.constants';
import { NotificationPreferencesService } from '../../../common/notifications/notification-preferences.service';
import {
  createPaginatedResponse,
  createPaginationOptions,
} from '../../../common/helpers/pagination.helper';
import { REDIS_CLIENT } from '../../../config/redis/redis.constants';
import {
  AddProjectMemberDto,
  CreateProjectDto,
  JoinProjectDto,
  ProjectQueryDto,
  UpdateProjectSettingsDto,
  UpdateProjectDto,
  UpdateProjectMemberRoleDto,
} from '../dto/project.dto';
import { SAFE_USER_SELECT } from '../../../common/constants/app.constants';
import { ProjectsRepository } from '../repository/projects.repository';
import {
  INVITE_TOKEN_BYTES,
  INVITE_TOKEN_ENCODING,
  INVITE_TOKEN_PREFIX,
  INVITE_TOKEN_TTL_SECONDS,
} from '../constants/invite.constants';
import {
  DEFAULT_PROJECT_MEMBER_ROLE,
  ProjectMemberRole,
  normalizeProjectRolePermissions,
  normalizeProjectRoleName,
} from '../constants/project-role-permissions.constants';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectAccessService: ProjectAccessService,
    private readonly notificationPreferencesService: NotificationPreferencesService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private inviteTokenKey(projectId: string) {
    return `${INVITE_TOKEN_PREFIX}:${projectId}`;
  }

  async create(userId: string, createProjectDto: CreateProjectDto) {
    const requestedMemberIds = Array.from(
      new Set((createProjectDto.memberIds ?? []).filter((memberId) => memberId !== userId)),
    );

    if (requestedMemberIds.length > 0) {
      const existingUsersCount = await this.prisma.user.count({
        where: {
          id: {
            in: requestedMemberIds,
          },
        },
      });

      if (existingUsersCount !== requestedMemberIds.length) {
        throw new BadRequestException('One or more selected members do not exist');
      }
    }

    const project = await this.prisma.$transaction(async (tx) => {
      const createdProject = await tx.project.create({
        data: {
          name: createProjectDto.name,
          description: createProjectDto.description,
          status: createProjectDto.status || 'ACTIVE',
          color: createProjectDto.color,
          icon: createProjectDto.icon,
          createdBy: userId,
          members: {
            create: [
              {
                userId,
                role: ProjectMemberRole.OWNER,
                addedBy: userId,
              },
              ...requestedMemberIds.map((memberId) => ({
                userId: memberId,
                role: DEFAULT_PROJECT_MEMBER_ROLE,
                addedBy: userId,
              })),
            ],
          },
        },
        include: {
          creator: {
            select: SAFE_USER_SELECT,
          },
          members: true,
          _count: { select: { tasks: true, members: true } },
        },
      });

      const notificationUserIds =
        await this.notificationPreferencesService.filterEnabledUserIds(
          requestedMemberIds,
          NOTIFICATION_PREFERENCE_KEYS.project,
        );

      if (notificationUserIds.length > 0) {
        await tx.notification.createMany({
          data: notificationUserIds.map((memberId) => ({
            userId: memberId,
            projectId: createdProject.id,
            type: NotificationType.SYSTEM,
            title: 'You were added to a project',
            content: `You have been added to project "${createdProject.name}" as DEVELOPER.`,
            data: {
              action: 'PROJECT_MEMBER_ADDED',
              projectId: createdProject.id,
              role: 'DEVELOPER',
              addedBy: userId,
            },
          })),
        });
      }

      return createdProject;
    });

    return project;
  }

  async findAll(userId: string, queryDto: ProjectQueryDto) {
    const { skip, take } = createPaginationOptions(queryDto);

    const where: Prisma.ProjectWhereInput = {
      OR: [{ createdBy: userId }, { members: { some: { userId } } }],
    };

    if (queryDto.status) {
      where.status = queryDto.status;
    }

    if (queryDto.search) {
      where.AND = [
        {
          OR: [
            { name: { contains: queryDto.search, mode: 'insensitive' } },
            {
              description: {
                contains: queryDto.search,
                mode: 'insensitive',
              },
            },
          ],
        },
      ];
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          creator: {
            select: SAFE_USER_SELECT,
          },
          members: true,
          _count: { select: { tasks: true, members: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.project.count({ where }),
    ]);

    return createPaginatedResponse(projects, total, queryDto);
  }

  async findOne(userId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        OR: [{ createdBy: userId }, { members: { some: { userId } } }],
      },
      include: {
        creator: {
          select: SAFE_USER_SELECT,
        },
        members: {
          include: {
            user: {
              select: SAFE_USER_SELECT,
            },
          },
        },
        taskStatuses: {
          orderBy: {
            position: 'asc',
          },
        },
        _count: { select: { tasks: true, members: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(userId: string, id: string, updateProjectDto: UpdateProjectDto) {
    const existingProject = await this.projectsRepository.findProjectById(id);

    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

    if (existingProject.createdBy !== userId) {
      throw new ForbiddenException('Only project owner can update this project');
    }

    const requestedMemberIds = Array.from(
      new Set((updateProjectDto.memberIds ?? []).filter((memberId) => memberId !== existingProject.createdBy)),
    );
    const existingMemberIds = new Set(
      (existingProject.members ?? []).map((member) => member.userId),
    );
    const newMemberIds = requestedMemberIds.filter((memberId) => !existingMemberIds.has(memberId));

    if (requestedMemberIds.length > 0) {
      const existingUsersCount = await this.prisma.user.count({
        where: {
          id: {
            in: requestedMemberIds,
          },
        },
      });

      if (existingUsersCount !== requestedMemberIds.length) {
        throw new BadRequestException('One or more selected members do not exist');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: {
          name: updateProjectDto.name,
          description: updateProjectDto.description,
          status: updateProjectDto.status,
          color: updateProjectDto.color,
          icon: updateProjectDto.icon,
        },
      });

      if (newMemberIds.length > 0) {
        await tx.projectMember.createMany({
          data: newMemberIds.map((memberId) => ({
            projectId: id,
            userId: memberId,
            role: DEFAULT_PROJECT_MEMBER_ROLE,
            addedBy: userId,
          })),
          skipDuplicates: true,
        });

        const notificationUserIds =
          await this.notificationPreferencesService.filterEnabledUserIds(
            newMemberIds,
            NOTIFICATION_PREFERENCE_KEYS.project,
          );

        if (notificationUserIds.length > 0) {
          await tx.notification.createMany({
            data: notificationUserIds.map((memberId) => ({
              userId: memberId,
              projectId: id,
              type: NotificationType.SYSTEM,
              title: 'You were added to a project',
              content: `You have been added to project "${existingProject.name}" as DEVELOPER.`,
              data: {
                action: 'PROJECT_MEMBER_ADDED',
                projectId: id,
                role: 'DEVELOPER',
                addedBy: userId,
              },
            })),
          });
        }
      }
    });

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    const existingProject = await this.projectsRepository.findProjectById(id);

    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

    if (existingProject.createdBy !== userId) {
      throw new ForbiddenException('Only project owner can delete this project');
    }

    await this.projectsRepository.deleteProject(id);

    this.logger.log(`Project ${id} deleted by user ${userId}`);

    return { success: true };
  }

  async listMembers(userId: string, projectId: string) {
    await this.projectAccessService.ensureProjectMember(userId, projectId);
    return this.projectsRepository.listProjectMembers(projectId);
  }

  async getSettings(userId: string, projectId: string) {
    await this.projectAccessService.ensureProjectMember(userId, projectId);
    const settings = await this.projectsRepository.findProjectSettings(projectId);

    return {
      projectId,
      rolePermissions: normalizeProjectRolePermissions(settings?.rolePermissions),
      updatedAt: settings?.updatedAt ?? null,
    };
  }

  async updateSettings(
    userId: string,
    projectId: string,
    dto: UpdateProjectSettingsDto,
  ) {
    await this.projectAccessService.ensureProjectAdminOrOwner(userId, projectId);

    const project = await this.projectsRepository.findProjectById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const rolePermissions = normalizeProjectRolePermissions(dto.rolePermissions);
    const settings = await this.projectsRepository.upsertProjectSettings(projectId, {
      rolePermissions,
    });

    return {
      projectId,
      rolePermissions: normalizeProjectRolePermissions(settings.rolePermissions),
      updatedAt: settings.updatedAt,
    };
  }

  async joinProject(userId: string, projectId: string, dto: JoinProjectDto) {
    const [project, existingMember] = await Promise.all([
      this.projectsRepository.findProjectById(projectId),
      this.projectsRepository.findProjectMember(projectId, userId),
    ]);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const storedToken = await this.redis.get(this.inviteTokenKey(projectId));
    if (!storedToken || storedToken !== dto.token) {
      throw new ForbiddenException('Invalid invite token');
    }

    if (existingMember) {
      return existingMember;
    }

    const member = await this.projectsRepository.addProjectMember(
      projectId,
      userId,
      DEFAULT_PROJECT_MEMBER_ROLE,
      userId,
    );

    this.logger.log(`User ${userId} joined project ${projectId} via invite link`);
    return member;
  }

  async leaveProject(userId: string, projectId: string) {
    const [project, member] = await Promise.all([
      this.projectsRepository.findProjectById(projectId),
      this.projectsRepository.findProjectMember(projectId, userId),
    ]);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    if (project.createdBy === userId) {
      throw new ForbiddenException('Project owner cannot leave project');
    }

    await this.projectsRepository.removeProjectMember(projectId, userId);

    this.logger.log(`User ${userId} left project ${projectId}`);
    return { success: true };
  }

  async createInviteToken(userId: string, projectId: string) {
    await this.projectAccessService.ensureProjectAdminOrOwner(userId, projectId);

    const project = await this.projectsRepository.findProjectById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const key = this.inviteTokenKey(projectId);
    const existingToken = await this.redis.get(key);
    if (existingToken) {
      return { token: existingToken };
    }

    const token = randomBytes(INVITE_TOKEN_BYTES).toString(INVITE_TOKEN_ENCODING);
    await this.redis.set(key, token, 'EX', INVITE_TOKEN_TTL_SECONDS);

    this.logger.log(`Invite token created for project ${projectId} by ${userId}`);
    return { token };
  }

  async addMember(userId: string, projectId: string, dto: AddProjectMemberDto) {
    await this.projectAccessService.ensureProjectAdminOrOwner(userId, projectId);

    const [project, targetMember] = await Promise.all([
      this.projectsRepository.findProjectById(projectId),
      this.projectsRepository.findProjectMember(projectId, dto.userId),
    ]);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (targetMember) {
      throw new ConflictException('User is already a member of this project');
    }

    const memberRole = normalizeProjectRoleName(dto.role) ?? DEFAULT_PROJECT_MEMBER_ROLE;

    const createdMember = await this.projectsRepository.withTransaction(async (tx) => {
      const member = await this.projectsRepository.addProjectMember(
        projectId,
        dto.userId,
        memberRole,
        userId,
        tx,
      );

      const shouldNotify =
        dto.userId !== userId &&
        (await this.notificationPreferencesService.isEnabled(
          dto.userId,
          NOTIFICATION_PREFERENCE_KEYS.project,
        ));

      if (shouldNotify) {
        await this.projectsRepository.createNotification(
          {
            user: { connect: { id: dto.userId } },
            project: { connect: { id: projectId } },
            type: NotificationType.SYSTEM,
            title: 'You were added to a project',
            content: `You have been added to project "${project.name}" as ${memberRole}.`,
            data: {
              action: 'PROJECT_MEMBER_ADDED',
              projectId,
              role: memberRole,
              addedBy: userId,
            },
          },
          tx,
        );
      }

      return member;
    });

    this.logger.log(
      `User ${dto.userId} added to project ${projectId} by ${userId} as ${memberRole}`,
    );

    return createdMember;
  }

  async updateMemberRole(
    userId: string,
    projectId: string,
    memberUserId: string,
    dto: UpdateProjectMemberRoleDto,
  ) {
    await this.projectAccessService.ensureProjectAdminOrOwner(userId, projectId);

    const [project, targetMember] = await Promise.all([
      this.projectsRepository.findProjectById(projectId),
      this.projectsRepository.findProjectMember(projectId, memberUserId),
    ]);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!targetMember) {
      throw new NotFoundException('Project member not found');
    }

    const nextRole = normalizeProjectRoleName(dto.role);
    if (!nextRole) {
      throw new BadRequestException('Invalid member role');
    }

    if (project.createdBy === memberUserId && nextRole !== ProjectMemberRole.OWNER) {
      throw new ForbiddenException('Project owner role cannot be downgraded');
    }

    const updatedMember = await this.projectsRepository.updateProjectMemberRole(
      projectId,
      memberUserId,
      nextRole,
    );

    this.logger.log(
      `User ${memberUserId} role updated in project ${projectId} by ${userId} to ${nextRole}`,
    );

    return updatedMember;
  }

  async removeMember(userId: string, projectId: string, memberUserId: string) {
    await this.projectAccessService.ensureProjectAdminOrOwner(userId, projectId);

    const project = await this.projectsRepository.findProjectById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.createdBy === memberUserId) {
      throw new ForbiddenException('Project owner cannot be removed from project');
    }

    const member = await this.projectsRepository.findProjectMember(projectId, memberUserId);

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    await this.projectsRepository.removeProjectMember(projectId, memberUserId);

    this.logger.log(
      `User ${memberUserId} removed from project ${projectId} by ${userId}`,
    );

    return { success: true };
  }
}
