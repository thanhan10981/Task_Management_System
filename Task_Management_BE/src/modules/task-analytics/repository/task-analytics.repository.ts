import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class TaskAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getProjectAccessWhere(userId: string) {
    return {
      OR: [
        { createdBy: userId },
        {
          members: {
            some: {
              userId,
            },
          },
        },
      ],
    };
  }

  findTasksForChart(
    userId: string,
    startDate: Date,
    endDate: Date,
    projectId?: string,
  ) {
    return this.prisma.task.findMany({
      where: {
        isDeleted: false,
        parentTaskId: null,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        project: projectId
          ? { id: projectId, ...this.getProjectAccessWhere(userId) }
          : this.getProjectAccessWhere(userId),
      },
      select: {
        createdAt: true,
        status: {
          select: {
            isDone: true,
            name: true,
          },
        },
      },
    });
  }

  findTasksForReport(userId: string, projectId?: string, sprintId?: string) {
    return this.prisma.task.findMany({
      where: {
        isDeleted: false,
        parentTaskId: null,
        ...(sprintId ? { sprintId } : {}),
        project: projectId
          ? { id: projectId, ...this.getProjectAccessWhere(userId) }
          : this.getProjectAccessWhere(userId),
      },
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
        updatedAt: true,
        status: {
          select: {
            name: true,
            color: true,
            isDone: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
          },
        },
        assignees: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  findMembersForReport(userId: string, projectId?: string) {
    return this.prisma.projectMember.findMany({
      where: {
        project: projectId
          ? { id: projectId, ...this.getProjectAccessWhere(userId) }
          : this.getProjectAccessWhere(userId),
      },
      select: {
        id: true,
        role: true,
        userId: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });
  }
}
