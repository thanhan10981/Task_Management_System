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

  findTasksForChart(userId: string, startDate: Date, endDate: Date) {
    return this.prisma.task.findMany({
      where: {
        isDeleted: false,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        project: this.getProjectAccessWhere(userId),
      },
      select: {
        createdAt: true,
        statusId: true,
      },
    });
  }

  findDoneStatusIdsForUserProjects(userId: string) {
    return this.prisma.taskStatus.findMany({
      where: {
        isDone: true,
        project: this.getProjectAccessWhere(userId),
      },
      select: {
        id: true,
      },
    });
  }
}
