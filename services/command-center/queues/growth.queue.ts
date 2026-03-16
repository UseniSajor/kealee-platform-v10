/**
 * services/command-center/queues/growth.queue.ts
 *
 * BullMQ queue and worker for GrowthBot jobs.
 * Integrates with the existing command-center queue infrastructure.
 */

import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import { createLogger } from '@kealee/observability'
import { GrowthBot } from '../bots/growth/growth.bot.js'
import { BotDispatcher } from '../bots/shared/bot.dispatcher.js'
import type { BotEvent } from '../bots/shared/bot.interface.js'

const logger = createLogger('growth-queue')

export const GROWTH_QUEUE_NAME = 'kealee-growth-bot'

export type GrowthJobType =
  | 'run-full-analysis'
  | 'dispatch-event'

export interface GrowthJobData {
  type: GrowthJobType
  event?: BotEvent
  runId?: string
}

// ─── Queue factory ────────────────────────────────────────────────────────────

export function createGrowthQueue(redisUrl: string): Queue<GrowthJobData> {
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
  return new Queue<GrowthJobData>(GROWTH_QUEUE_NAME, { connection })
}

// ─── Worker factory ───────────────────────────────────────────────────────────

export function createGrowthWorker(redisUrl: string): Worker<GrowthJobData> {
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })

  const bot        = new GrowthBot(redis)
  const dispatcher = new BotDispatcher(redis)

  const worker = new Worker<GrowthJobData>(
    GROWTH_QUEUE_NAME,
    async (job: Job<GrowthJobData>) => {
      logger.info({ jobId: job.id, type: job.data.type }, 'GrowthBot job starting')

      if (job.data.type === 'run-full-analysis') {
        return await bot.runScheduled!()
      }

      if (job.data.type === 'dispatch-event' && job.data.event) {
        return await dispatcher.dispatch(job.data.event)
      }

      logger.warn({ jobId: job.id, type: job.data.type }, 'Unknown GrowthBot job type')
    },
    {
      connection: redis,
      concurrency: 1,          // serialized to avoid duplicate analysis
      limiter: {
        max: 2,
        duration: 60_000,       // max 2 jobs/min
      },
    },
  )

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, type: job.data.type }, 'GrowthBot job completed')
  })

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'GrowthBot job failed')
  })

  return worker
}

// ─── Job helpers ──────────────────────────────────────────────────────────────

/**
 * Enqueue a full growth analysis run.
 * Uses a stable jobId to prevent duplicate scheduled runs.
 */
export async function enqueueFullAnalysis(
  queue: Queue<GrowthJobData>,
  opts: { delay?: number } = {},
): Promise<void> {
  await queue.add(
    'run-full-analysis',
    { type: 'run-full-analysis' },
    {
      jobId: `growth-analysis-${new Date().toISOString().slice(0, 10)}`, // once per day
      delay: opts.delay,
      attempts: 3,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: { count: 10 },
      removeOnFail:     { count: 20 },
    },
  )
}

/**
 * Enqueue a specific event for GrowthBot dispatch.
 */
export async function enqueueGrowthEvent(
  queue: Queue<GrowthJobData>,
  event: BotEvent,
): Promise<void> {
  await queue.add(
    'dispatch-event',
    { type: 'dispatch-event', event },
    {
      jobId: `growth-event-${event.id}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: { count: 50 },
      removeOnFail:     { count: 50 },
    },
  )
}
