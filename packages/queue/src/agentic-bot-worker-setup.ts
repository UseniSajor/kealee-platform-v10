/**
 * Agentic Bot Queue Worker Setup
 *
 * Production-ready queue worker configuration for agentic bots.
 * Handles job processing, error handling, monitoring, and health checks.
 */

import type { Worker, Queue } from 'bullmq';
import { createAgenticBotHandler, type AgenticBotWorkerConfig } from './agentic-bot-worker';

export interface MinimalLogger {
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
  debug(msg: string, meta?: Record<string, unknown>): void;
}

export interface AgenticBotWorkerSetupConfig extends AgenticBotWorkerConfig {
  logger: MinimalLogger;
  queueName?: string;
  concurrency?: number;
  stalledInterval?: number;
  maxStalledCount?: number;
  retryDelay?: number;
}

/**
 * Setup agentic bot worker with error handling and monitoring
 */
export function setupAgenticBotWorker(
  Worker: typeof import('bullmq').Worker,
  queue: Queue,
  config: AgenticBotWorkerSetupConfig
): Worker {
  const {
    logger,
    queueName = 'agentic-bots',
    concurrency = 5,
    stalledInterval = 5000,
    maxStalledCount = 2,
    retryDelay = 5000,
  } = config;

  const handler = createAgenticBotHandler(config);

  const worker = new Worker(queueName, handler, {
    connection: (queue as any).client.options, // Use same Redis connection
    concurrency,
    stalledInterval,
  }) as unknown as Worker;

  // Event handlers
  worker.on('completed', (job) => {
    logger.info('[AgenticBotWorker] Job completed', {
      jobId: job?.id,
      jobName: job?.name,
      progress: job?.progress,
    });
  });

  worker.on('failed', (job, err) => {
    logger.error('[AgenticBotWorker] Job failed', {
      jobId: job?.id,
      jobName: job?.name,
      error: err?.message,
      stack: err?.stack,
    });
  });

  worker.on('error', (err) => {
    logger.error('[AgenticBotWorker] Worker error', {
      error: err?.message,
      stack: err?.stack,
    });
  });

  worker.on('stalled', (jobId) => {
    logger.warn('[AgenticBotWorker] Job stalled', { jobId });
  });

  worker.on('active', (job) => {
    logger.debug('[AgenticBotWorker] Job active', {
      jobId: job?.id,
      jobName: job?.name,
    });
  });

  logger.info('[AgenticBotWorker] Setup complete', {
    queueName,
    concurrency,
    stalledInterval,
  });

  return worker;
}

/**
 * Health check for agentic bot worker
 */
export async function getAgenticBotWorkerHealth(worker: Worker): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  processing: number;
  paused: boolean;
  active: boolean;
  stalled: number;
  failed: number;
  delayed: number;
}> {
  try {
    const [active, stalled, failed, delayed] = await Promise.all([
      (worker as any).getActiveCount?.(),
      (worker as any).getStalledCount?.(),
      (worker as any).getFailedCount?.(),
      (worker as any).getDelayedCount?.(),
    ]);

    const status = !worker.isPaused() && worker.isRunning() ? 'healthy' : 'degraded';

    return {
      status,
      processing: active || 0,
      paused: worker.isPaused(),
      active: worker.isRunning(),
      stalled: stalled || 0,
      failed: failed || 0,
      delayed: delayed || 0,
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      processing: 0,
      paused: false,
      active: false,
      stalled: 0,
      failed: 0,
      delayed: 0,
    };
  }
}

/**
 * Graceful shutdown for agentic bot worker
 */
export async function shutdownAgenticBotWorker(
  worker: Worker,
  logger: MinimalLogger,
  timeoutMs: number = 30000
): Promise<void> {
  logger.info('[AgenticBotWorker] Shutting down gracefully', { timeoutMs });

  try {
    await Promise.race([
      worker.close(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Shutdown timeout')), timeoutMs)
      ),
    ]);

    logger.info('[AgenticBotWorker] Shutdown complete');
  } catch (err) {
    logger.error('[AgenticBotWorker] Shutdown failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
