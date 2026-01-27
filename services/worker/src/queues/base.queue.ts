import { Queue, QueueOptions } from 'bullmq'
import { redis } from '../config/redis.config'

export interface BaseJobData {
  [key: string]: any
}

/**
 * Base queue class for all BullMQ queues
 * Provides common configuration and utilities
 */
export class BaseQueue<T = BaseJobData> extends Queue<T> {
  constructor(name: string, options?: Partial<QueueOptions>) {
    super(name, {
      connection: redis as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
      ...options,
    })

    // Log queue events
    this.on('error', (error: unknown) => {
      console.error(`Queue ${name} error:`, error)
    })

    // BullMQ v5's event typing is strict; keep these handlers runtime-safe.
    this.on('waiting' as any, (job: any) => {
      console.log(`Job ${job.id} is waiting in queue ${name}`)
    })

    this.on('active' as any, (job: any) => {
      console.log(`Job ${job.id} is now active in queue ${name}`)
    })

    this.on('completed' as any, (job: any) => {
      console.log(`Job ${job.id} completed in queue ${name}`)
    })

    this.on('failed' as any, (job: any, err: any) => {
      console.error(`Job ${job?.id} failed in queue ${name}:`, err)
    })
  }

  /**
   * Get simple queue counts (waiting/active/completed/etc)
   */
  async getQueueCounts() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.getWaitingCount(),
      this.getActiveCount(),
      this.getCompletedCount(),
      this.getFailedCount(),
      this.getDelayedCount(),
    ])

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    }
  }

  /**
   * Clean old jobs
   */
  async cleanOldJobs(grace: number = 1000, limit: number = 1000) {
    await super.clean(grace, limit, 'completed')
    await super.clean(grace, limit, 'failed')
  }
}
