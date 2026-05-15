import { Global, Module, OnModuleDestroy, Inject, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { REDIS_CLIENT, REDIS_CONNECTION_OPTIONS } from './redis.constants';
import { buildRedisConnectionOptions } from './redis.config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CONNECTION_OPTIONS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => buildRedisConnectionOptions(configService),
    },
    {
      provide: REDIS_CLIENT,
      inject: [REDIS_CONNECTION_OPTIONS],
      useFactory: (connectionOptions: RedisOptions) => {
        const logger = new Logger('RedisClient');
        const redis = new Redis(connectionOptions);

        redis.on('error', (error) => {
          logger.warn(`Redis connection error: ${error.message}`);
        });

        return redis;
      },
    },
  ],
  exports: [REDIS_CONNECTION_OPTIONS, REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
