import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  createPaginatedResponse,
  createPaginationOptions,
} from '../../../common/helpers/pagination.helper';
import {
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from '../dto/project.dto';
import { SAFE_USER_SELECT } from '../../../common/constants/app.constants';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

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

    const where: any = {
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
    const existingProject = await this.prisma.project.findUnique({
      where: { id },
    });

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
    const existingProject = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

    if (existingProject.createdBy !== userId) {
      throw new ForbiddenException('Only project owner can delete this project');
    }

    await this.prisma.project.delete({
      where: { id },
    });

    return { success: true };
  }
}
