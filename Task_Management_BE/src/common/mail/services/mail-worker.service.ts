import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import { RedisOptions } from 'ioredis';
import { CreateEmailOptions, Resend } from 'resend';
import { REDIS_CONNECTION_OPTIONS } from '../../../config/redis/redis.constants';
import { buildMailFrom } from '../../helpers/mail-from.helper';
import { MailJob } from '../types/mail-job.type';

@Injectable()
export class MailWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailWorkerService.name);
  private worker: Worker<MailJob>;
  private readonly resend?: Resend;
  private readonly defaultFrom: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CONNECTION_OPTIONS)
    private readonly redisConnection: RedisOptions,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    this.resend = apiKey ? new Resend(apiKey) : undefined;
    this.defaultFrom = buildMailFrom(
      this.configService.get<string>('MAIL_PUBLIC_FROM_NAME'),
      this.configService.get<string>('MAIL_PUBLIC_FROM_ADDRESS'),
    );
  }

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

    this.worker.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'ECONNRESET') {
        this.logger.warn(
          `Mail worker Redis connection was reset and will reconnect: ${error.message}`,
        );
        return;
      }

      this.logger.error(`Mail worker error: ${error.message}`, error.stack);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  private async sendMail(job: Job<MailJob>): Promise<void> {
    const { to, from, subject, text, html } = job.data;

    this.logger.log(`Processing mail job ${job.id} for ${to}`);

    if (!this.resend) {
      this.logger.warn(
        `RESEND_API_KEY is missing. Mail job ${job.id} for ${to} was not delivered.`,
      );
      return;
    }

    const payload: CreateEmailOptions = {
      to,
      from: from || this.defaultFrom,
      subject,
      ...(html ? { html } : { text: text || '' }),
      ...(html && text ? { text } : {}),
    };

    const result = await this.resend.emails.send(payload);

    if (result.error) {
      throw new Error(result.error.message);
    }

    this.logger.log(`Mail job ${job.id} sent via Resend (${result.data?.id})`);
  }
}
