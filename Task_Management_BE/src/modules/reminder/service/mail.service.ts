import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildMailFrom } from '../../../common/helpers/mail-from.helper';
import { MailJobQueueService } from '../../../common/mail/services/mail-job-queue.service';
import { taskReminderTemplate } from '../../../common/mail/templates/task-reminder.template';
import { formatDateTimeVietnam } from '../../../common/utils/datetime.helper';
import { TaskReminderMailDto } from '../dto/task-reminder-mail.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailJobQueueService: MailJobQueueService,
    private readonly configService: ConfigService,
  ) {}

  async sendTaskReminder(dto: TaskReminderMailDto): Promise<void> {
    const fromAddress = buildMailFrom(
      this.configService.get<string>('MAIL_PUBLIC_FROM_NAME'),
      this.configService.get<string>('MAIL_PUBLIC_FROM_ADDRESS'),
    );
    const dueDateDisplay = formatDateTimeVietnam(dto.dueDate);
    const mail = taskReminderTemplate({
      recipientName: dto.recipientName,
      taskTitle: dto.taskTitle,
      projectName: dto.projectName,
      dueDateDisplay,
      thresholdMinutes: dto.thresholdMinutes,
    });

    this.mailJobQueueService.enqueue({
      to: dto.to,
      from: fromAddress,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });

    this.logger.log(`Reminder email sent to ${dto.to} for task "${dto.taskTitle}"`);
  }
}
