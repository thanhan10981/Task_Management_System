import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma, PrismaClient, ProjectStatus } from '@prisma/client';
import { ProjectMemberRole } from '../constants/project-role-permissions.constants';

export type TxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async withTransaction<T>(handler: (tx: TxClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => handler(tx as TxClient));
  }

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
            role: ProjectMemberRole.OWNER,
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

  findProjectSettings(projectId: string) {
    return this.prisma
      .$queryRaw<Array<{ projectId: string; rolePermissions: unknown; updatedAt: Date }>>`
        SELECT "projectId", "rolePermissions", "updatedAt"
        FROM "project_settings"
        WHERE "projectId" = ${projectId}
        LIMIT 1
      `
      .then((rows) => rows[0] ?? null);
  }

  upsertProjectSettings(projectId: string, data: { rolePermissions?: Record<string, unknown> }) {
    return this.prisma
      .$queryRaw<Array<{ projectId: string; rolePermissions: unknown; updatedAt: Date }>>`
        INSERT INTO "project_settings" ("projectId", "rolePermissions", "updatedAt")
        VALUES (${projectId}, ${JSON.stringify(data.rolePermissions ?? {})}::jsonb, NOW())
        ON CONFLICT ("projectId")
        DO UPDATE SET
          "rolePermissions" = EXCLUDED."rolePermissions",
          "updatedAt" = NOW()
        RETURNING "projectId", "rolePermissions", "updatedAt"
      `
      .then((rows) => rows[0]);
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
    role: string,
    addedBy: string,
    tx?: TxClient,
  ) {
    const client = tx ?? this.prisma;
    return client.projectMember.create({
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
  }

  createNotification(data: Prisma.NotificationCreateInput, tx?: TxClient) {
    const client = tx ?? this.prisma;
    return client.notification.create({ data });
  }

  async updateProjectMemberRole(projectId: string, userId: string, role: string) {
    return this.prisma.projectMember.update({
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
  }

  async removeProjectMember(projectId: string, userId: string) {
    await this.prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    return { success: true };
  }
}
