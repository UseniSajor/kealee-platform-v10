/**
 * services/command-center/queues/project-monitor.queue.ts
 *
 * BullMQ queue and worker for ProjectMonitorBot jobs.
 * Scheduled daily at 08:00 UTC via `scheduleDailyMonitor()`.
 */

import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import { createLogger } from '@kealee/observability'
import { ProjectMonitorBot } from '../bots/project-monitor/project-monitor.bot.js'
import type { BotEvent } from '../bots/shared/bot.interface.js'

const logger = createLogger('project-monitor-queue')

export const PROJECT_MONITOR_QUEUE_NAME = 'kealee-project-monitor-bot'

export type ProjectMonitorJobType = 'daily-scan' | 'dispatch-event'

export interface ProjectMonitorJobData {
  type: ProjectMonitorJobType
  event?: BotEvent
}

export function createProjectMonitorQueue(redisUrl: string): Queue<ProjectMonitorJobData> {
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
  return new Queue<ProjectMonitorJobData>(PROJECT_MONITOR_QUEUE_NAME, { connection })
}

export function createProjectMonitorWorker(redisUrl: string): Worker<ProjectMonitorJobData> {
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })

  const bot = new ProjectMonitorBot()

  const worker = new Worker<ProjectMonitorJobData>(
    PROJECT_MONITOR_QUEUE_NAME,
    async (job: Job<ProjectMonitorJobData>) => {
      logger.info({ jobId: job.id, type: job.data.type }, 'ProjectMonitorBot job starting')

      if (job.data.type === 'daily-scan') {
        return await bot.runScheduled!()
      }

      if (job.data.type === 'dispatch-event' && job.data.event) {
        return await bot.handle(job.data.event)
      }

      logger.warn({ jobId: job.id }, 'ProjectMonitorBot: unknown job type')
    },
    {
      connection: redis,
      concurrency: 2,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { age: 86400, count: 500 },
        removeOnFail: { age: 604800, count: 5000 },
      },
    },
  )

  worker.on('completed', job => logger.info({ jobId: job.id }, 'ProjectMonitorBot job done'))
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err: err.message }, 'ProjectMonitorBot job failed'))

  return worker
}

/**
 * Schedule daily 08:00 UTC scan.
 * Call once at startup — BullMQ deduplicates repeatable jobs.
 */
export async function scheduleDailyMonitor(queue: Queue<ProjectMonitorJobData>): Promise<void> {
  await queue.add(
    'daily-scan',
    { type: 'daily-scan' },
    {
      repeat: { pattern: '0 8 * * *' }, // 08:00 UTC daily
      jobId: 'project-monitor-daily',
    },
  )
  logger.info('ProjectMonitorBot daily scan scheduled (cron: 08:00 UTC)')
}
