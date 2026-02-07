import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import type { QueueOptions, WorkerOptions } from 'bullmq';
import type Redis from 'ioredis';
import { getQueueConnection } from './redis.js';

export const QUEUE_NAMES = {
  BID_ENGINE: 'bid-engine',
  VISIT_SCHEDULER: 'visit-scheduler',
  CHANGE_ORDER: 'change-order',
  REPORT_GENERATOR: 'report-generator',
  PERMIT_TRACKER: 'permit-tracker',
  INSPECTION: 'inspection-coordinator',
  BUDGET_TRACKER: 'budget-tracker',
  COMMUNICATION: 'communication-hub',
  TASK_QUEUE: 'task-queue',
  DOCUMENT_GEN: 'document-generator',
  PREDICTIVE: 'predictive-engine',
  SMART_SCHEDULER: 'smart-scheduler',
  QA_INSPECTOR: 'qa-inspector',
  DECISION_SUPPORT: 'decision-support',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/**
 * Create a BullMQ queue with shared Redis connection and sensible defaults.
 */
export function createQueue(name: string, opts?: Partial<QueueOptions>): Queue {
  const connection = getQueueConnection();

  return new Queue(name, {
    connection: connection as any,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
    ...opts,
  });
}

/**
 * Create a BullMQ worker with shared Redis connection, logging, and concurrency.
 */
export function createWorker<T = any>(
  name: string,
  processor: (job: Job<T>) => Promise<any>,
  opts?: {
    concurrency?: number;
    limiter?: { max: number; duration: number };
  },
): Worker<T> {
  const connection = getQueueConnection();
  const concurrency = opts?.concurrency ?? 5;

  const workerOpts: WorkerOptions = {
    connection: connection as any,
    concurrency,
  };

  if (opts?.limiter) {
    workerOpts.limiter = opts.limiter;
  }

  const worker = new Worker<T>(name, processor, workerOpts);

  worker.on('completed', (job: Job<T>) => {
    const duration = job.finishedOn && job.processedOn
      ? job.finishedOn - job.processedOn
      : 0;
    console.log(
      `[Worker:${name}] Job ${job.id} (${job.name}) completed in ${duration}ms`,
    );
  });

  worker.on('failed', (job: Job<T> | undefined, err: Error) => {
    const duration =
      job?.finishedOn && job?.processedOn
        ? job.finishedOn - job.processedOn
        : 0;
    console.error(
      `[Worker:${name}] Job ${job?.id} (${job?.name}) failed after ${duration}ms:`,
      err.message,
    );
  });

  worker.on('error', (err: Error) => {
    console.error(`[Worker:${name}] Error:`, err.message);
  });

  return worker;
}

/**
 * Create a QueueEvents instance for monitoring a queue.
 */
export function createQueueEvents(name: string): QueueEvents {
  const connection = getQueueConnection();
  return new QueueEvents(name, { connection: connection as any });
}

/**
 * Get the shared Redis connection for direct use.
 */
export function getConnection(): Redis {
  return getQueueConnection();
}

/**
 * Add a job to a queue with optional priority, delay, and scheduled time.
 */
export async function addJob<T>(
  queue: Queue,
  name: string,
  data: T,
  opts?: {
    priority?: number;
    delay?: number;
    scheduledFor?: Date;
  },
): Promise<Job<T>> {
  let delay = opts?.delay;

  if (opts?.scheduledFor) {
    const now = Date.now();
    const scheduledTime = opts.scheduledFor.getTime();
    const calculatedDelay = scheduledTime - now;
    delay = calculatedDelay > 0 ? calculatedDelay : 0;
  }

  return queue.add(name, data, {
    priority: opts?.priority,
    delay,
  });
}
