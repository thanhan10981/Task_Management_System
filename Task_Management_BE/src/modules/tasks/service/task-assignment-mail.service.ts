import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildMailFrom } from '../../../common/helpers/mail-from.helper';
import { MailJobQueueService } from '../../../common/mail/services/mail-job-queue.service';
import { taskAssignedTemplate } from '../../../common/mail/templates/task-assigned.template';
import { PrismaService } from '../../../common/prisma/prisma.service';

type SendTaskAssignedEmailsInput = {
  assigneeIds: string[];
  taskTitle: string;
  projectName?: string | null;
};

@Injectable()
export class TaskAssignmentMailService {
  private readonly logger = new Logger(TaskAssignmentMailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailJobQueueService: MailJobQueueService,
    private readonly configService: ConfigService,
  ) {}

  async sendTaskAssignedEmails({
    assigneeIds,
    taskTitle,
    projectName,
  }: SendTaskAssignedEmailsInput): Promise<void> {
    const uniqueAssigneeIds = [...new Set(assigneeIds)].filter(Boolean);
    if (!uniqueAssigneeIds.length) return;

    const recipients = await this.prisma.user.findMany({
      where: { id: { in: uniqueAssigneeIds } },
      select: { id: true, email: true, fullName: true },
    });

    if (!recipients.length) return;

    const fromAddress = buildMailFrom(
      this.configService.get<string>('MAIL_PUBLIC_FROM_NAME'),
      this.configService.get<string>('MAIL_PUBLIC_FROM_ADDRESS'),
    );

    await Promise.all(
      recipients.map(async (recipient) => {
        if (!recipient.email) return;

        const mail = taskAssignedTemplate({
          recipientName: recipient.fullName || recipient.email,
          taskTitle,
          projectName,
        });

        try {
          await this.mailJobQueueService.enqueue({
            to: recipient.email,
            from: fromAddress,
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
          });
          this.logger.log(
            `Task assignment email queued for ${recipient.email} for task "${taskTitle}"`,
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown mail queue error';
          this.logger.warn(
            `Failed to queue task assignment email for user ${recipient.id}: ${message}`,
          );
        }
      }),
    );
  }
}
