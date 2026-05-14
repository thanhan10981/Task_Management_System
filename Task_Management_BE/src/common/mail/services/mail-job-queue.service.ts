import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { MAIL_QUEUE, MAIL_QUEUE_JOB_NAME } from '../mail.constants';
import { MailJob } from '../types/mail-job.type';

@Injectable()
export class MailJobQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(MailJobQueueService.name);

  constructor(@Inject(MAIL_QUEUE) private readonly mailQueue: Queue<MailJob>) {}

  async enqueue(data: MailJob): Promise<void> {
    try {
      const job = await this.mailQueue.add(MAIL_QUEUE_JOB_NAME, data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 24 * 60 * 60,
          count: 1000,
        },
        removeOnFail: false,
      });

      this.logger.log(`Queued mail job ${job.id} for ${data.to}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown mail queue error';
      this.logger.error(`Failed to queue mail job for ${data.to}: ${message}`);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.mailQueue.close();
  }
}
