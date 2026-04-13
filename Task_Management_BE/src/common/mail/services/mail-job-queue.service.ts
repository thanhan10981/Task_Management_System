import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendMailOptions } from 'nodemailer';
import { MailJob } from '../types/mail-job.type';

@Injectable()
export class MailJobQueueService {
  private readonly logger = new Logger(MailJobQueueService.name);
  private readonly jobs: MailJob[] = [];
  private isProcessing = false;

  constructor(private readonly mailerService: MailerService) {}

  enqueue(options: SendMailOptions): void {
    this.jobs.push({ options, attempts: 0 });
    void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.jobs.length > 0) {
        const job = this.jobs.shift();

        if (!job) {
          continue;
        }

        try {
          await this.mailerService.sendMail(job.options);
        } catch (error) {
          job.attempts += 1;

          if (job.attempts < 3) {
            this.jobs.push(job);
            this.logger.warn(
              `Mail job failed (attempt ${job.attempts}). Retrying...`,
            );
          } else {
            const message = error instanceof Error ? error.message : 'Unknown mail error';
            this.logger.error(`Mail job failed after 3 attempts: ${message}`);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}
