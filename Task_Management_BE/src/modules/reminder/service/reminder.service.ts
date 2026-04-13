import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { formatDateTimeVietnam, getVietnamTimeZone } from '../../../common/utils/datetime.helper';
import { TaskRepository } from '../repository/task.repository';
import { MailService } from './mail.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'task-deadline-reminder',
    timeZone: getVietnamTimeZone(),
  })
  async handleTaskReminderCron(): Promise<void> {
    const thresholds = this.getReminderThresholdsInMinutes();

    this.logger.log(`Running reminder cron with thresholds: ${thresholds.join(', ')}`);

    for (const thresholdMinutes of thresholds) {
      await this.processThreshold(thresholdMinutes);
    }
  }

  private async processThreshold(thresholdMinutes: number): Promise<void> {
    const now = new Date();
    const tasks = await this.taskRepository.findDueTasksWithinMinutes(thresholdMinutes, now);

    if (tasks.length === 0) {
      this.logger.debug(`No due tasks found for ${thresholdMinutes} minute threshold`);
      return;
    }

    let sentCount = 0;
    let skippedCount = 0;

    for (const task of tasks) {
      for (const assignee of task.assignees) {
        const reminderKey = this.buildReminderKey(
          task.taskId,
          assignee.userId,
          thresholdMinutes,
          task.dueDate,
        );

        const notificationId = await this.taskRepository.tryReserveReminderNotification({
          userId: assignee.userId,
          projectId: task.projectId,
          title: 'Task deadline reminder',
          content: `Task "${task.title}" is due at ${formatDateTimeVietnam(task.dueDate)} (Vietnam time)`,
          data: {
            reminderKey,
            taskId: task.taskId,
            thresholdMinutes,
            dueDate: task.dueDate.toISOString(),
            dueDateVietnam: formatDateTimeVietnam(task.dueDate),
          },
        });

        if (!notificationId) {
          skippedCount += 1;
          continue;
        }

        try {
          await this.mailService.sendTaskReminder({
            to: assignee.email,
            recipientName: assignee.fullName,
            taskTitle: task.title,
            dueDate: task.dueDate,
            projectName: task.projectName,
            thresholdMinutes,
          });

          sentCount += 1;
        } catch (error) {
          await this.taskRepository.deleteNotificationById(notificationId);

          const message = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to send reminder for task ${task.taskId} to user ${assignee.userId}: ${message}`,
          );
        }
      }
    }

    this.logger.log(
      `Reminder threshold ${thresholdMinutes}m processed. Sent: ${sentCount}, skipped: ${skippedCount}`,
    );
  }

  private getReminderThresholdsInMinutes(): number[] {
    const raw = this.configService.get<string>('REMINDER_THRESHOLDS_MINUTES') ?? '60';

    const thresholds = raw
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);

    return thresholds.length > 0 ? Array.from(new Set(thresholds)) : [60];
  }

  private buildReminderKey(
    taskId: string,
    userId: string,
    thresholdMinutes: number,
    dueDate: Date,
  ): string {
    return `task:${taskId}:user:${userId}:threshold:${thresholdMinutes}:due:${dueDate.toISOString()}`;
  }
}
