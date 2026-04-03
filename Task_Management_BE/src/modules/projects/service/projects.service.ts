import {
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

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createProjectDto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description,
        status: createProjectDto.status || 'ACTIVE',
        color: createProjectDto.color,
        icon: createProjectDto.icon,
        startDate: createProjectDto.startDate
          ? new Date(createProjectDto.startDate)
          : null,
        endDate: createProjectDto.endDate
          ? new Date(createProjectDto.endDate)
          : null,
        createdBy: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
            addedBy: userId,
          },
        },
      },
      include: {
        creator: true,
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
          creator: true,
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
        creator: true,
        members: {
          include: {
            user: true,
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

    await this.prisma.project.update({
      where: { id },
      data: {
        name: updateProjectDto.name,
        description: updateProjectDto.description,
        status: updateProjectDto.status,
        color: updateProjectDto.color,
        icon: updateProjectDto.icon,
        startDate: updateProjectDto.startDate
          ? new Date(updateProjectDto.startDate)
          : undefined,
        endDate: updateProjectDto.endDate
          ? new Date(updateProjectDto.endDate)
          : undefined,
      },
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
