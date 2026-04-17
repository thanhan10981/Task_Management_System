import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ProjectAccessService } from '../../../common/access/project-access.service';
import {
  createPaginatedResponse,
  createPaginationOptions,
} from '../../../common/helpers/pagination.helper';
import {
  AddProjectMemberDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
  UpdateProjectMemberRoleDto,
} from '../dto/project.dto';
import { SAFE_USER_SELECT } from '../../../common/constants/app.constants';
import { ProjectsRepository } from '../repository/projects.repository';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

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

    const project = await this.prisma.project.create({
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
              role: 'OWNER',
              addedBy: userId,
            },
            ...requestedMemberIds.map((memberId) => ({
              userId: memberId,
              role: 'MEMBER' as const,
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

      if (requestedMemberIds.length > 0) {
        await tx.projectMember.createMany({
          data: requestedMemberIds.map((memberId) => ({
            projectId: id,
            userId: memberId,
            role: 'MEMBER',
            addedBy: userId,
          })),
          skipDuplicates: true,
        });
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

    const createdMember = await this.projectsRepository.withTransaction(async (tx) => {
      const member = await this.projectsRepository.addProjectMember(
        projectId,
        dto.userId,
        dto.role || 'MEMBER',
        userId,
        tx,
      );

      if (dto.userId !== userId) {
        await this.projectsRepository.createNotification(
          {
            user: { connect: { id: dto.userId } },
            project: { connect: { id: projectId } },
            type: NotificationType.SYSTEM,
            title: 'You were added to a project',
            content: `You have been added to project "${project.name}" as ${dto.role || 'MEMBER'}.`,
            data: {
              action: 'PROJECT_MEMBER_ADDED',
              projectId,
              role: dto.role || 'MEMBER',
              addedBy: userId,
            },
          },
          tx,
        );
      }

      return member;
    });

    this.logger.log(
      `User ${dto.userId} added to project ${projectId} by ${userId} as ${dto.role || 'MEMBER'}`,
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

    if (project.createdBy === memberUserId && dto.role !== 'OWNER') {
      throw new ForbiddenException('Project owner role cannot be downgraded');
    }

    const updatedMember = await this.projectsRepository.updateProjectMemberRole(
      projectId,
      memberUserId,
      dto.role,
    );

    this.logger.log(
      `User ${memberUserId} role updated in project ${projectId} by ${userId} to ${dto.role}`,
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
