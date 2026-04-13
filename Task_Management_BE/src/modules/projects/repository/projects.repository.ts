import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma, ProjectMemberRole, ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createProject(
    userId: string,
    data: {
      name: string;
      description?: string;
      status?: ProjectStatus;
      color?: string;
      icon?: string;
    },
  ) {
    return this.prisma.project.create({
      data: {
        ...data,
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
        members: {
          include: {
            user: true,
          },
        },
        _count: { select: { tasks: true, members: true } },
      },
    });
  }

  findAccessibleProjects(where: Prisma.ProjectWhereInput, skip: number, take: number) {
    return this.prisma.project.findMany({
      where,
      include: {
        creator: true,
        members: true,
        _count: { select: { tasks: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  countProjects(where: Prisma.ProjectWhereInput) {
    return this.prisma.project.count({ where });
  }

  findAccessibleProjectById(userId: string, id: string) {
    return this.prisma.project.findFirst({
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
  }

  findProjectById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  updateProject(id: string, data: Prisma.ProjectUpdateInput) {
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  deleteProject(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }

  findProjectMember(projectId: string, userId: string) {
    return this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  }

  listProjectMembers(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: true,
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
  }

  async addProjectMember(
    projectId: string,
    userId: string,
    role: ProjectMemberRole,
    addedBy: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.projectMember.create({
        data: {
          projectId,
          userId,
          role,
          addedBy,
        },
        include: {
          user: true,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: addedBy,
          projectId,
          entityType: 'PROJECT',
          entityId: projectId,
          action: 'PROJECT_MEMBER_ADDED',
          description: 'A member was added to project',
          metadata: {
            memberId: userId,
            role,
          },
        },
      });

      return member;
    });
  }

  async updateProjectMemberRole(projectId: string, userId: string, role: ProjectMemberRole, updatedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.projectMember.update({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
        data: {
          role,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: updatedBy,
          projectId,
          entityType: 'PROJECT',
          entityId: projectId,
          action: 'PROJECT_MEMBER_ROLE_UPDATED',
          description: 'A project member role was updated',
          metadata: {
            memberId: userId,
            role,
          },
        },
      });

      return member;
    });
  }

  async removeProjectMember(projectId: string, userId: string, removedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.projectMember.delete({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: removedBy,
          projectId,
          entityType: 'PROJECT',
          entityId: projectId,
          action: 'PROJECT_MEMBER_REMOVED',
          description: 'A member was removed from project',
          metadata: {
            memberId: userId,
          },
        },
      });

      return { success: true };
    });
  }
}
