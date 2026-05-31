import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildMailFrom } from '../../../common/helpers/mail-from.helper';
import { MailJobQueueService } from '../../../common/mail/services/mail-job-queue.service';
import { feedbackTemplate } from '../../../common/mail/templates/feedback.template';
import { AuthenticatedUser } from '../../../common/types/authenticated-user.type';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';

const FEEDBACK_RECIPIENT = 'voan10981@gmail.com';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly mailJobQueueService: MailJobQueueService,
    private readonly configService: ConfigService,
  ) {}

  async submitFeedback(user: AuthenticatedUser, dto: CreateFeedbackDto) {
    const mail = feedbackTemplate({
      ...dto,
      user,
    });

    await this.mailJobQueueService.enqueue({
      to: FEEDBACK_RECIPIENT,
      from: buildMailFrom(
        this.configService.get<string>('MAIL_PUBLIC_FROM_NAME'),
        this.configService.get<string>('MAIL_PUBLIC_FROM_ADDRESS'),
      ),
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });

    return { message: 'Feedback sent successfully' };
  }
}
