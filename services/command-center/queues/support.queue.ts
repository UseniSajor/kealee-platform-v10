/**
 * services/command-center/queues/support.queue.ts
 *
 * BullMQ queue and worker for SupportBot jobs.
 */

import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import { createLogger } from '@kealee/observability'
import { SupportBot } from '../bots/support/support.bot.js'
import type { BotEvent } from '../bots/shared/bot.interface.js'

const logger = createLogger('support-queue')

export const SUPPORT_QUEUE_NAME = 'kealee-support-bot'

export interface SupportJobData {
  type: 'dispatch-event'
  event: BotEvent
}

export function createSupportQueue(redisUrl: string): Queue<SupportJobData> {
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
  return new Queue<SupportJobData>(SUPPORT_QUEUE_NAME, { connection })
}

export function createSupportWorker(redisUrl: string): Worker<SupportJobData> {
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })

  const bot = new SupportBot()

  const worker = new Worker<SupportJobData>(
    SUPPORT_QUEUE_NAME,
    async (job: Job<SupportJobData>) => {
      logger.info({ jobId: job.id }, 'SupportBot job starting')
      return await bot.handle(job.data.event)
    },
    {
      connection: redis,
      concurrency: 10,  // support is high-throughput
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { age: 86400, count: 5000 },
        removeOnFail: { age: 604800, count: 5000 },
      },
    },
  )

  worker.on('completed', job => logger.info({ jobId: job.id }, 'SupportBot job done'))
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err: err.message }, 'SupportBot job failed'))

  return worker
}
