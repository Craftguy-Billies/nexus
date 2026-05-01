import { Queue } from 'bullmq';
import { config } from '../config';

const connection = {
  host: new URL(config.redis.url).hostname || 'localhost',
  port: parseInt(new URL(config.redis.url).port || '6379', 10),
};

export const aiReactionQueue = new Queue('ai-reactions', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const aiSchedulerQueue = new Queue('ai-scheduler', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

export const energyRefreshQueue = new Queue('energy-refresh', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: 10,
    removeOnFail: 10,
  },
});

export const notificationQueue = new Queue('notifications', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
