import { Module } from '@nestjs/common';
import { MailModule } from '../../common/mail/mail.module';
import { FeedbackController } from './controller/feedback.controller';
import { FeedbackService } from './service/feedback.service';

@Module({
  imports: [MailModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
