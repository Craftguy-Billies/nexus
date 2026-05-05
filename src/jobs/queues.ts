import { Queue } from 'bullmq';
import { getRedis, isRedisConfigured } from '../config/redis';

function createQueue(name: string, opts: object) {
  if (!isRedisConfigured()) {
    return {
      async add() { return null; },
      async close() {},
    } as unknown as Queue;
  }
  return new Queue(name, { connection: getRedis(), ...opts });
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
