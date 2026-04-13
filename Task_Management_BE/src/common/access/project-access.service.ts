import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectMemberRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface ProjectAccessContext {
  projectId: string;
  isOwner: boolean;
  role: ProjectMemberRole | null;
}

@Injectable()
export class ProjectAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureProjectMember(
    userId: string,
    projectId: string,
  ): Promise<ProjectAccessContext> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        createdBy: true,
        members: {
          where: { userId },
          select: { role: true },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const memberRole = project.members[0]?.role ?? null;
    const isOwner = project.createdBy === userId || memberRole === 'OWNER';

    if (!isOwner && !memberRole) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return {
      projectId: project.id,
      isOwner,
      role: memberRole,
    };
  }

  async ensureProjectAdminOrOwner(
    userId: string,
    projectId: string,
  ): Promise<ProjectAccessContext> {
    const access = await this.ensureProjectMember(userId, projectId);

    if (!access.isOwner && access.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only project owner or admin can perform this action',
      );
    }

    return access;
  }

  async ensureTaskAccess(userId: string, taskId: string): Promise<string> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.ensureProjectMember(userId, task.projectId);
    return task.projectId;
  }
}
