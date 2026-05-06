import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export function buildRedisConnectionOptions(configService: ConfigService): RedisOptions {
  const host = configService.get<string>('REDIS_HOST');
  const port = Number(configService.get<number | string>('REDIS_PORT'));
  const password = configService.get<string>('REDIS_PASSWORD');
  const db = Number(configService.get<number | string>('REDIS_DB'));

  return {
    host,
    port,
    password: password || undefined,
    db,
    maxRetriesPerRequest: null,
  };
}
