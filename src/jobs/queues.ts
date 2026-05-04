import { Queue } from 'bullmq';
import { config } from '../config';

const redisUrl = config.redis.url;
let connection: { host: string; port: number } | null = null;
let redisAvailable = false;

try {
  const parsed = new URL(redisUrl);
  if (parsed.protocol === 'redis:' || parsed.protocol === 'rediss:') {
    connection = {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379', 10),
    };
    redisAvailable = parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1';
  }
} catch {
  // Invalid URL
}

const dummyConnection = { host: 'localhost', port: 6379 };

function createQueue(name: string, opts: object) {
  if (!redisAvailable) {
    return {
      async add() { return null; },
      async close() {},
    } as unknown as Queue;
  }
  return new Queue(name, { connection: connection || dummyConnection, ...opts });
}

export const aiReactionQueue = createQueue('ai-reactions', {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const aiSchedulerQueue = createQueue('ai-scheduler', {
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

export const energyRefreshQueue = createQueue('energy-refresh', {
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: 10,
    removeOnFail: 10,
  },
});

export const notificationQueue = createQueue('notifications', {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
