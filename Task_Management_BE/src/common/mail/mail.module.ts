import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { Queue } from 'bullmq';
import { buildMailFrom } from '../helpers/mail-from.helper';
import { REDIS_CONNECTION_OPTIONS } from '../../config/redis/redis.constants';
import { RedisModule } from '../../config/redis/redis.module';
import { MAIL_QUEUE } from './mail.constants';
import { MailJob } from './types/mail-job.type';
import { MailJobQueueService } from './services/mail-job-queue.service';
import { MailWorkerService } from './services/mail-worker.service';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('SMTP_HOST');
        const user = configService.get<string>('SMTP_USER');
        const pass = configService.get<string>('SMTP_PASS');
        const port = Number(configService.get<string>('SMTP_PORT') ?? 587);
        const secure =
          configService.get<boolean>('SMTP_SECURE') ?? port === 465;
        const fromAddress = buildMailFrom(
          configService.get<string>('MAIL_PUBLIC_FROM_NAME'),
          configService.get<string>('SMTP_FROM') ||
            configService.get<string>('MAIL_PUBLIC_FROM_ADDRESS') ||
            user,
        );

        if (!host || !user || !pass) {
          return {
            transport: {
              jsonTransport: true,
            },
            defaults: {
              from: fromAddress,
            },
          };
        }

        return {
          transport: {
            host,
            port,
            secure,
            auth: {
              user,
              pass,
            },
          },
          defaults: {
            from: fromAddress,
          },
        };
      },
    }),
  ],
  providers: [
    {
      provide: MAIL_QUEUE,
      inject: [ConfigService, REDIS_CONNECTION_OPTIONS],
      useFactory: (configService: ConfigService, connection) => {
        const queue = new Queue<MailJob>(
          configService.get<string>('MAIL_QUEUE_NAME'),
          {
            connection,
          },
        );
        const logger = new Logger('MailQueue');

        queue.on('error', (error) => {
          logger.warn(`Mail queue connection error: ${error.message}`);
        });

        return queue;
      },
    },
    MailJobQueueService,
    MailWorkerService,
  ],
  exports: [MailJobQueueService],
})
export class MailModule {}
