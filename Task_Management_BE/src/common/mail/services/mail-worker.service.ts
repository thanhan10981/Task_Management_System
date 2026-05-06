import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import { RedisOptions } from 'ioredis';
import { REDIS_CONNECTION_OPTIONS } from '../../../config/redis/redis.constants';
import { MailJob } from '../types/mail-job.type';

@Injectable()
export class MailWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailWorkerService.name);
  private worker: Worker<MailJob>;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    @Inject(REDIS_CONNECTION_OPTIONS) private readonly redisConnection: RedisOptions,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker<MailJob>(
      this.configService.get<string>('MAIL_QUEUE_NAME'),
      (job) => this.sendMail(job),
      {
        connection: this.redisConnection,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Mail job ${job.id} completed for ${job.data.to}`);
    });

    this.worker.on('failed', (job, error) => {
      const jobId = job?.id ?? 'unknown';
      const recipient = job?.data?.to ?? 'unknown recipient';
      const attemptsMade = job?.attemptsMade ?? 0;
      const attemptsTotal = job?.opts?.attempts ?? 1;

      this.logger.error(
        `Mail job ${jobId} failed for ${recipient} (attempt ${attemptsMade}/${attemptsTotal}): ${error.message}`,
        error.stack,
      );
    });

    this.worker.on('error', (error) => {
      this.logger.error(`Mail worker error: ${error.message}`, error.stack);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  private async sendMail(job: Job<MailJob>): Promise<void> {
    const { to, from, subject, text, html } = job.data;

    this.logger.log(`Processing mail job ${job.id} for ${to}`);

    await this.mailerService.sendMail({
      to,
      from,
      subject,
      text,
      html,
    });
  }
}
