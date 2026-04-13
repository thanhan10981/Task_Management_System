import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
import { ProjectsRepository } from '../repository/projects.repository';
import { ProjectAccessService } from '../../../common/access/project-access.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async create(userId: string, createProjectDto: CreateProjectDto) {
    const project = await this.projectsRepository.createProject(userId, {
      name: createProjectDto.name,
      description: createProjectDto.description,
      status: createProjectDto.status || 'ACTIVE',
      color: createProjectDto.color,
      icon: createProjectDto.icon,
    });

    this.logger.log(`Project ${project.id} created by user ${userId}`);

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
      this.projectsRepository.findAccessibleProjects(where, skip, take),
      this.projectsRepository.countProjects(where),
    ]);

    return createPaginatedResponse(projects, total, queryDto);
  }

  async findOne(userId: string, id: string) {
    const project = await this.projectsRepository.findAccessibleProjectById(userId, id);

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

    await this.projectsRepository.updateProject(id, {
      name: updateProjectDto.name,
      description: updateProjectDto.description,
      status: updateProjectDto.status,
      color: updateProjectDto.color,
      icon: updateProjectDto.icon,
    });

    this.logger.log(`Project ${id} updated by user ${userId}`);

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

    const createdMember = await this.projectsRepository.addProjectMember(
      projectId,
      dto.userId,
      dto.role || 'MEMBER',
      userId,
    );

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
      userId,
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

    await this.projectsRepository.removeProjectMember(projectId, memberUserId, userId);

    this.logger.log(
      `User ${memberUserId} removed from project ${projectId} by ${userId}`,
    );

    return { success: true };
  }
}
