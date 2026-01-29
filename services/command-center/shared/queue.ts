/**
 * KEALEE COMMAND CENTER - QUEUE INFRASTRUCTURE
 * BullMQ Queue Setup for all 14 Mini-Apps
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';

// Redis connection factory
const createRedisConnection = () => new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

export const connection = createRedisConnection();
export const redisConnection = connection;

// Queue names for all 15 apps (no colons allowed in BullMQ queue names)
export const QUEUE_NAMES = {
  BID_ENGINE: 'kealee-bid-engine',
  VISIT_SCHEDULER: 'kealee-visit-scheduler',
  CHANGE_ORDER: 'kealee-change-order',
  REPORT_GENERATOR: 'kealee-report-generator',
  PERMIT_TRACKER: 'kealee-permit-tracker',
  INSPECTION: 'kealee-inspection-coordinator',
  BUDGET_TRACKER: 'kealee-budget-tracker',
  COMMUNICATION: 'kealee-communication-hub',
  TASK_QUEUE: 'kealee-task-queue',
  DOCUMENT_GEN: 'kealee-document-gen',
  PREDICTIVE: 'kealee-predictive-engine',
  SMART_SCHEDULER: 'kealee-smart-scheduler',
  QA_INSPECTOR: 'kealee-qa-inspector',
  DECISION_SUPPORT: 'kealee-decision-support',
  ESTIMATION: 'kealee-estimation-engine',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

// Create queues for all apps
export const queues = Object.fromEntries(
  Object.entries(QUEUE_NAMES).map(([key, name]) => [
    key,
    new Queue(name, { connection: createRedisConnection() })
  ])
) as Record<keyof typeof QUEUE_NAMES, Queue>;

// Queue events for monitoring
export const queueEvents = Object.fromEntries(
  Object.entries(QUEUE_NAMES).map(([key, name]) => [
    key,
    new QueueEvents(name, { connection: createRedisConnection() })
  ])
) as Record<keyof typeof QUEUE_NAMES, QueueEvents>;

// Standard job options
export const JOB_OPTIONS = {
  DEFAULT: {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 1000 },
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 604800, count: 5000 },
  },
  HIGH_PRIORITY: {
    priority: 1,
    attempts: 5,
    backoff: { type: 'exponential' as const, delay: 500 },
    removeOnComplete: { age: 43200 },
    removeOnFail: { age: 604800 },
  },
  LOW_PRIORITY: {
    priority: 10,
    attempts: 2,
    backoff: { type: 'fixed' as const, delay: 5000 },
    removeOnComplete: { age: 3600 },
  },
  SCHEDULED: {
    attempts: 3,
    backoff: { type: 'fixed' as const, delay: 5000 },
    removeOnComplete: { age: 86400 },
  },
  CRITICAL: {
    priority: 0,
    attempts: 10,
    backoff: { type: 'exponential' as const, delay: 200 },
    removeOnComplete: false,
    removeOnFail: false,
  },
};

// Worker factory
export function createWorker<T = unknown>(
  queueName: QueueName,
  processor: (job: Job<T>) => Promise<unknown>,
  options: {
    concurrency?: number;
    limiter?: { max: number; duration: number };
  } = {}
): Worker<T> {
  const { concurrency = 5, limiter } = options;

  const worker = new Worker(queueName, processor, {
    connection: createRedisConnection(),
    concurrency,
    limiter: limiter ?? { max: 100, duration: 60000 },
  });

  worker.on('completed', (job) => {
    console.log(`[${queueName}] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[${queueName}] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error(`[${queueName}] Worker error:`, err);
  });

  return worker;
}

// Add job to queue with standardized interface
export async function addJob<T>(
  queueKey: keyof typeof QUEUE_NAMES,
  jobName: string,
  data: T,
  options: typeof JOB_OPTIONS[keyof typeof JOB_OPTIONS] = JOB_OPTIONS.DEFAULT
): Promise<Job<T>> {
  return queues[queueKey].add(jobName, data, options);
}

// Schedule recurring job
export async function scheduleRecurringJob<T>(
  queueKey: keyof typeof QUEUE_NAMES,
  jobName: string,
  data: T,
  cron: string,
  timezone = 'America/Los_Angeles'
): Promise<void> {
  await queues[queueKey].add(jobName, data, {
    repeat: { pattern: cron, tz: timezone },
    ...JOB_OPTIONS.SCHEDULED,
  });
}

// Get queue metrics
export async function getQueueMetrics(queueKey: keyof typeof QUEUE_NAMES) {
  const queue = queues[queueKey];
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

// Get all queue metrics
export async function getAllQueueMetrics() {
  const metrics: Record<string, Awaited<ReturnType<typeof getQueueMetrics>>> = {};

  for (const key of Object.keys(QUEUE_NAMES) as (keyof typeof QUEUE_NAMES)[]) {
    metrics[key] = await getQueueMetrics(key);
  }

  return metrics;
}

// Graceful shutdown
export async function shutdownQueues(): Promise<void> {
  console.log('Shutting down queues...');

  await Promise.all([
    ...Object.values(queues).map(q => q.close()),
    ...Object.values(queueEvents).map(qe => qe.close()),
  ]);

  await connection.quit();
  console.log('Queues shutdown complete');
}
