import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'

let redisClient: Redis | null = null
let jobQueues: Map<string, Queue> = new Map()

function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || process.env.DATABASE_URL
    if (!redisUrl) {
      throw new Error('REDIS_URL or DATABASE_URL must be set for BullMQ support')
    }

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  }
  return redisClient
}

export interface CronJobData {
  taskName: string
  schedule: string
  handlerName: string
}

export async function initializeJobQueues(taskNames: string[]) {
  try {
    const redis = getRedisClient()

    for (const taskName of taskNames) {
      const queue = new Queue(`cron:${taskName}`, { connection: redis })
      jobQueues.set(taskName, queue)

      // Cleanup old jobs
      await queue.clean(7 * 24 * 60 * 60 * 1000, 1000) // Keep 7 days of history
    }

    console.log(`📊 Initialized ${taskNames.length} job queues`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.warn(`⚠️  BullMQ initialization skipped: ${msg}`)
    console.warn('   Marketing cron will run without job persistence.')
  }
}

export async function addJobToQueue(taskName: string, data: CronJobData) {
  try {
    const queue = jobQueues.get(taskName)
    if (!queue) {
      console.warn(`  Queue not found for task: ${taskName}`)
      return
    }

    const job = await queue.add(`${taskName}:execution`, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    })

    return job.id
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`Failed to queue job for ${taskName}: ${msg}`)
  }
}

export async function getJobHistory(taskName: string, limit = 50) {
  try {
    const queue = jobQueues.get(taskName)
    if (!queue) return []

    const completed = await queue.getCompleted(0, limit - 1)
    const failed = await queue.getFailed(0, limit - 1)

    return [...completed, ...failed].sort((a, b) => (b.finishedOn || 0) - (a.finishedOn || 0))
  } catch (error) {
    console.error(`Failed to get job history: ${error}`)
    return []
  }
}

export async function getQueueStats(): Promise<Record<string, any>> {
  const stats: Record<string, any> = {}

  try {
    for (const [taskName, queue] of jobQueues) {
      const counts = await queue.getJobCounts()
      const completed = await queue.getCompleted(0, 0)
      const lastJob = completed[0]

      stats[taskName] = {
        ...counts,
        lastCompletedAt: lastJob?.finishedOn,
        isPaused: await queue.isPaused(),
      }
    }
  } catch (error) {
    console.warn(`Failed to get queue stats: ${error}`)
  }

  return stats
}

export async function shutdown() {
  try {
    for (const queue of jobQueues.values()) {
      await queue.close()
    }
    if (redisClient) {
      await redisClient.quit()
    }
  } catch (error) {
    console.error('Error shutting down job queues:', error)
  }
}
