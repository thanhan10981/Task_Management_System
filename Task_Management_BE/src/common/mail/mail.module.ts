import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
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
