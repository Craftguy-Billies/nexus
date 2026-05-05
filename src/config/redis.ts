import Redis from 'ioredis';
import { config } from './index';

let redis: Redis | null = null;

export function isRedisConfigured(): boolean {
  return Boolean(config.redis.url);
}

export function getRedis(): Redis {
  if (!config.redis.url) {
    throw new Error('REDIS_URL is not configured');
  }

  if (!redis) {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
      retryStrategy(times: number) {
        if (times > 10) return null;
        return Math.min(times * 200, 5000);
      },
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });

    redis.on('connect', () => {
      console.log('Connected to Redis');
    });
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
