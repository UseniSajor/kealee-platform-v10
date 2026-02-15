import { Queue, Worker, type Processor } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';

/**
 * Get Redis connection options from REDIS_URL.
 */
export function getRedisConnection(): ConnectionOptions {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const parsed = new URL(url);

  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    password: parsed.password || undefined,
    username: parsed.username || undefined,
    ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
  };
}

/**
 * Create a BullMQ queue with Kealee default job options:
 * - 3 retry attempts with exponential backoff (1s base)
 * - Auto-cleanup: completed after 1000 jobs, failed after 5000 jobs
 */
export function createQueue(name: string): Queue {
  return new Queue(name, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        count: 1000,
      },
      removeOnFail: {
        count: 5000,
      },
    },
  });
}

/**
 * Create a BullMQ worker with error logging and graceful shutdown.
 * Default concurrency: 5.
 */
export function createWorker(
  name: string,
  processor: Processor,
  concurrency = 5
): Worker {
  const worker = new Worker(name, processor, {
    connection: getRedisConnection(),
    concurrency,
  });

  worker.on('failed', (job, err) => {
    console.error(
      `[Queue:${name}] Job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts?.attempts ?? 3}):`,
      err.message
    );
  });

  worker.on('error', (err) => {
    console.error(`[Queue:${name}] Worker error:`, err);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log(`[Queue:${name}] Shutting down worker...`);
    await worker.close();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return worker;
}
