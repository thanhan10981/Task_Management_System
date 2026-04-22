import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  SaveReminderNotificationInput,
  TaskReminderTask,
} from '../types/task-reminder.types';

@Injectable()
export class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDueTasksWithinMinutes(minutes: number, fromDate: Date): Promise<TaskReminderTask[]> {
    const toDate = new Date(fromDate.getTime() + minutes * 60 * 1000);

    const tasks = await this.prisma.task.findMany({
      where: {
        dueDate: {
          gt: fromDate,
          lte: toDate,
        },
        status: {
          isDone: false,
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        projectId: true,
        project: {
          select: {
            name: true,
          },
        },
        assignees: {
          select: {
            userId: true,
            user: {
              select: {
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    return tasks
      .filter((task) => task.dueDate !== null)
      .map((task) => ({
        taskId: task.id,
        title: task.title,
        dueDate: task.dueDate as Date,
        projectId: task.projectId,
        projectName: task.project?.name,
        assignees: task.assignees
          .filter((assignee) => Boolean(assignee.user.email))
          .map((assignee) => ({
            userId: assignee.userId,
            email: assignee.user.email as string,
            fullName: assignee.user.fullName,
          })),
      }))
      .filter((task) => task.assignees.length > 0);
  }

  async findTaskForManualReminder(taskId: string): Promise<TaskReminderTask | null> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        isDeleted: false,
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        projectId: true,
        project: {
          select: {
            name: true,
          },
        },
        assignees: {
          select: {
            userId: true,
            user: {
              select: {
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!task?.dueDate) {
      return null;
    }

    const assignees = task.assignees
      .filter((assignee) => Boolean(assignee.user.email))
      .map((assignee) => ({
        userId: assignee.userId,
        email: assignee.user.email as string,
        fullName: assignee.user.fullName,
      }));

    return {
      taskId: task.id,
      title: task.title,
      dueDate: task.dueDate,
      projectId: task.projectId,
      projectName: task.project?.name,
      assignees,
    };
  }

  async tryReserveReminderNotification(
    input: SaveReminderNotificationInput,
  ): Promise<string | null> {
    return this.prisma.$transaction(async (transactionClient) => {
      await transactionClient.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${input.data.reminderKey}))
      `;

      const existingNotification = await transactionClient.notification.findFirst({
        where: {
          userId: input.userId,
          type: NotificationType.SYSTEM,
          data: {
            path: ['reminderKey'],
            equals: input.data.reminderKey,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingNotification) {
        return null;
      }

      const createdNotification = await transactionClient.notification.create({
        data: {
          userId: input.userId,
          projectId: input.projectId,
          type: NotificationType.SYSTEM,
          title: input.title,
          content: input.content,
          data: input.data,
        },
        select: {
          id: true,
        },
      });

      return createdNotification.id;
    });
  }

  async deleteNotificationById(notificationId: string): Promise<void> {
    await this.prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });
  }
}
