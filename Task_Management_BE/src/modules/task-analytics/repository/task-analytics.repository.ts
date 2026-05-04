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
}
