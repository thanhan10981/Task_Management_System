import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

const redisBaseOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectTimeout: 10000,
  keepAlive: 30000,
  retryStrategy: (times) => Math.min(times * 200, 2000),
};

export function buildRedisConnectionOptions(configService: ConfigService): RedisOptions {
  const url = configService.get<string>('REDIS_URL');

  if (url) {
    const redisUrl = new URL(url);
    const urlDb = redisUrl.pathname ? Number(redisUrl.pathname.replace('/', '')) : undefined;
    const shouldUseTls = redisUrl.protocol === 'rediss:' || redisUrl.hostname.endsWith('.upstash.io');

    return {
      ...redisBaseOptions,
      host: redisUrl.hostname,
      port: Number(redisUrl.port || 6379),
      username: redisUrl.username ? decodeURIComponent(redisUrl.username) : undefined,
      password: redisUrl.password ? decodeURIComponent(redisUrl.password) : undefined,
      db: Number.isNaN(urlDb) ? undefined : urlDb,
      tls: shouldUseTls ? { servername: redisUrl.hostname } : undefined,
    };
  }

  throw new Error('REDIS_URL is required');
}
