import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { buildMailFrom } from '../../../common/helpers/mail-from.helper';
import { formatDateTimeVietnam } from '../../../common/utils/datetime.helper';
import { TaskReminderMailDto } from '../dto/task-reminder-mail.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendTaskReminder(dto: TaskReminderMailDto): Promise<void> {
    const fromAddress = buildMailFrom(
      this.configService.get<string>('MAIL_PUBLIC_FROM_NAME'),
      this.configService.get<string>('MAIL_PUBLIC_FROM_ADDRESS'),
    );
    const dueDateDisplay = formatDateTimeVietnam(dto.dueDate);

    await this.mailerService.sendMail({
      to: dto.to,
      from: fromAddress,
      subject: 'Task Deadline Reminder',
      text: [
        `Dear ${dto.recipientName},`,
        '',
        'This is a friendly reminder that the following task is approaching its deadline:',
        `- Task: ${dto.taskTitle}`,
        `- Project: ${dto.projectName ?? 'N/A'}`,
        `- Due date (Vietnam time): ${dueDateDisplay}`,
        `- Reminder threshold: ${dto.thresholdMinutes} minutes`,
        '',
        'Please review and complete the task on time.',
        '',
        'Best regards,',
        'Task Management Team',
      ].join('\n'),
      html: `
        <p>Dear ${dto.recipientName},</p>
        <p>This is a friendly reminder that the following task is approaching its deadline:</p>
        <ul>
          <li><strong>Task:</strong> ${dto.taskTitle}</li>
          <li><strong>Project:</strong> ${dto.projectName ?? 'N/A'}</li>
          <li><strong>Due date (Vietnam time):</strong> ${dueDateDisplay}</li>
          <li><strong>Reminder threshold:</strong> ${dto.thresholdMinutes} minutes</li>
        </ul>
        <p>Please review and complete the task on time.</p>
        <p>Best regards,<br/>Task Management Team</p>
      `,
    });

    this.logger.log(`Reminder email sent to ${dto.to} for task "${dto.taskTitle}"`);
  }
}
