/**
 * services/command-center/queues/contractor-match.queue.ts
 *
 * BullMQ queue and worker for ContractorMatchBot jobs.
 */

import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import { createLogger } from '@kealee/observability'
import { ContractorMatchBot } from '../bots/contractor-match/contractor-match.bot.js'
import type { BotEvent } from '../bots/shared/bot.interface.js'

const logger = createLogger('contractor-match-queue')

export const CONTRACTOR_MATCH_QUEUE_NAME = 'kealee-contractor-match-bot'

export interface ContractorMatchJobData {
  type: 'dispatch-event'
  event: BotEvent
}

export function createContractorMatchQueue(redisUrl: string): Queue<ContractorMatchJobData> {
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
  return new Queue<ContractorMatchJobData>(CONTRACTOR_MATCH_QUEUE_NAME, { connection })
}

export function createContractorMatchWorker(redisUrl: string): Worker<ContractorMatchJobData> {
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })

  const bot = new ContractorMatchBot()

  const worker = new Worker<ContractorMatchJobData>(
    CONTRACTOR_MATCH_QUEUE_NAME,
    async (job: Job<ContractorMatchJobData>) => {
      logger.info({ jobId: job.id }, 'ContractorMatchBot job starting')
      return await bot.handle(job.data.event)
    },
    {
      connection: redis,
      concurrency: 5,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 86400, count: 1000 },
        removeOnFail: { age: 604800, count: 5000 },
      },
    },
  )

  worker.on('completed', job => logger.info({ jobId: job.id }, 'ContractorMatchBot job done'))
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err: err.message }, 'ContractorMatchBot job failed'))

  return worker
}
