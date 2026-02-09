/**
 * Queue Factory — Managed Workers & Queues
 *
 * Wraps BullMQ Worker and Queue with integrated error handling:
 * - Structured error logging + classification
 * - AutomationTask + AppHealthMetric tracking
 * - Dead letter queue on final attempt failure
 * - Alert escalation for critical failures
 * - Health metric tracking (success + failure)
 *
 * Usage:
 *   const worker = createManagedWorker({
 *     queueName: 'estimation-tool',
 *     processor: async (job) => { ... },
 *     prisma,
 *     connection,
 *   });
 *
 *   const queue = createManagedQueue('estimation-tool', connection);
 */

import { Worker, Queue, Job } from 'bullmq';
import IORedis from 'ioredis';
import { CommandCenterErrorHandler, mapQueueToAppId } from './error-handler';

// ── Types ────────────────────────────────────────────────────

export interface ManagedWorkerOptions<TData = any, TResult = any> {
  /** Queue name (maps to an app ID via mapQueueToAppId) */
  queueName: string;

  /** The job processor function. Throw to signal failure. */
  processor: (job: Job<TData>) => Promise<TResult>;

  /** IORedis connection instance */
  connection: IORedis;

  /** Prisma client for DB tracking (optional but recommended) */
  prisma?: any;

  /** Worker concurrency (default: 5) */
  concurrency?: number;

  /** Rate limiter (default: 10 per 1000ms) */
  limiter?: { max: number; duration: number };

  /** Default max attempts for jobs (default: 3) */
  defaultAttempts?: number;

  /** Called on successful job completion (optional) */
  onCompleted?: (job: Job<TData>, result: TResult) => void;

  /** Called on job failure before error handler runs (optional) */
  onFailed?: (job: Job<TData> | undefined, error: Error) => void;
}

// ── Managed Worker ──────────────────────────────────────────

/**
 * Create a BullMQ Worker with integrated Command Center error handling.
 *
 * What this adds over a plain BullMQ Worker:
 * 1. Wraps the processor in try/catch with structured error logging
 * 2. Tracks AppHealthMetric on every success and failure
 * 3. On the final attempt failure: moves job to dead letter + creates alert
 * 4. Classifies errors (transient / permanent / rate_limit / data / external)
 */
export function createManagedWorker<TData = any, TResult = any>(
  opts: ManagedWorkerOptions<TData, TResult>
): Worker<TData, TResult> {
  const {
    queueName,
    processor,
    connection,
    prisma,
    concurrency = 5,
    limiter = { max: 10, duration: 1000 },
    defaultAttempts = 3,
    onCompleted,
    onFailed,
  } = opts;

  const appId = mapQueueToAppId(queueName);

  // ── Wrapped Processor ────────────────────────────────────
  const managedProcessor = async (job: Job<TData>): Promise<TResult> => {
    const startTime = Date.now();

    try {
      const result = await processor(job);

      // Track success in health metrics
      if (prisma) {
        const durationMs = Date.now() - startTime;
        trackSuccess(prisma, appId, durationMs).catch((err) =>
          console.error('[ManagedWorker] Health metric tracking failed:', err)
        );
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const attempt = job.attemptsMade + 1;
      const maxAttempts = (job.opts?.attempts ?? defaultAttempts);

      // Run the full error handler pipeline
      await CommandCenterErrorHandler.handleJobError({
        appId,
        jobId: job.id ?? 'unknown',
        jobName: job.name,
        error: err,
        data: job.data,
        attempt,
        maxAttempts,
        prisma,
      });

      // Re-throw so BullMQ retries or fails the job
      throw error;
    }
  };

  // ── Create Worker ────────────────────────────────────────
  const worker = new Worker<TData, TResult>(
    queueName,
    managedProcessor,
    {
      connection,
      concurrency,
      limiter,
    }
  );

  // ── Event Listeners ──────────────────────────────────────

  worker.on('completed', (job: Job<TData>, result: TResult) => {
    console.log(
      `[${queueName}] ✓ Job ${job.id} (${job.name}) completed in ${
        Date.now() - (job.processedOn ?? Date.now())
      }ms`
    );
    onCompleted?.(job, result);
  });

  worker.on('failed', (job: Job<TData> | undefined, error: Error) => {
    const attempt = job ? job.attemptsMade : '?';
    const maxAttempts = job?.opts?.attempts ?? defaultAttempts;
    console.error(
      `[${queueName}] ✗ Job ${job?.id} (${job?.name}) failed [${attempt}/${maxAttempts}]: ${error.message}`
    );
    onFailed?.(job, error);
  });

  worker.on('error', (error: Error) => {
    console.error(`[${queueName}] Worker error:`, error.message);
  });

  worker.on('stalled', (jobId: string) => {
    console.warn(`[${queueName}] ⚠ Job ${jobId} stalled — will be re-processed`);
  });

  console.log(
    `[${queueName}] Managed worker started (concurrency: ${concurrency}, app: ${appId})`
  );

  return worker;
}

// ── Managed Queue ───────────────────────────────────────────

/**
 * Create a BullMQ Queue with sensible production defaults.
 *
 * Defaults:
 * - 3 retry attempts with exponential backoff (1s base)
 * - Keeps last 100 completed, last 50 failed
 */
export function createManagedQueue<TData = any>(
  queueName: string,
  connection: IORedis,
  defaultJobOptions?: {
    attempts?: number;
    backoff?: { type: 'fixed' | 'exponential'; delay: number };
    removeOnComplete?: { count: number } | boolean;
    removeOnFail?: { count: number } | boolean;
  }
): Queue<TData> {
  const queue = new Queue<TData>(queueName, {
    connection,
    defaultJobOptions: {
      attempts: defaultJobOptions?.attempts ?? 3,
      backoff: defaultJobOptions?.backoff ?? { type: 'exponential', delay: 1000 },
      removeOnComplete: defaultJobOptions?.removeOnComplete ?? { count: 100 },
      removeOnFail: defaultJobOptions?.removeOnFail ?? { count: 50 },
    },
  });

  console.log(`[${queueName}] Managed queue created`);
  return queue;
}

// ── Health Metric Helpers ────────────────────────────────────

/**
 * Track a successful job completion in AppHealthMetric.
 */
async function trackSuccess(
  prisma: any,
  appId: string,
  durationMs: number
): Promise<void> {
  const periodStart = new Date();
  periodStart.setSeconds(0, 0); // truncate to minute

  try {
    // Upsert the metric row for this app + minute window
    const existing = await prisma.appHealthMetric.findUnique({
      where: {
        appId_period: {
          appId,
          period: periodStart,
        },
      },
    });

    if (existing) {
      // Compute running average for duration
      const totalCompleted = existing.jobsCompleted + 1;
      const newAvg = Math.round(
        (existing.avgDurationMs * existing.jobsCompleted + durationMs) / totalCompleted
      );
      const newMax = Math.max(existing.maxDurationMs, durationMs);

      await prisma.appHealthMetric.update({
        where: {
          appId_period: {
            appId,
            period: periodStart,
          },
        },
        data: {
          jobsCompleted: { increment: 1 },
          jobsTotal: { increment: 1 },
          avgDurationMs: newAvg,
          maxDurationMs: newMax,
          errorRate: existing.jobsTotal > 0
            ? (existing.jobsFailed / (existing.jobsTotal + 1)) * 100
            : 0,
        },
      });
    } else {
      await prisma.appHealthMetric.create({
        data: {
          appId,
          period: periodStart,
          jobsCompleted: 1,
          jobsTotal: 1,
          avgDurationMs: Math.round(durationMs),
          maxDurationMs: Math.round(durationMs),
          errorRate: 0,
        },
      });
    }
  } catch (err) {
    // Non-fatal — don't disrupt job processing for metric tracking
    console.error('[ManagedWorker] Failed to track success metric:', err);
  }
}
