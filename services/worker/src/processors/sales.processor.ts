import { Worker, Job } from 'bullmq'
import { redis } from '../config/redis.config'
import { SalesJobData, SalesSlaReminderResult } from '../types/sales.types'
import { prisma } from '@kealee/database'
import { emailQueue } from '../queues/email.queue'

/**
 * Process sales SLA reminder job
 * NOTE: SalesTask model is not yet implemented in the schema.
 * This processor is stubbed for now.
 */
async function processSlaReminderJob(job: Job<SalesJobData>): Promise<SalesSlaReminderResult> {
  const { taskId, leadId, assignedToUserId, slaDueAt } = job.data

  try {
    // SalesTask model is not yet implemented
    // Stub the job to return success
    console.log(`📧 Sales SLA reminder job - feature not yet implemented (taskId: ${taskId})`)

    return {
      success: true,
      taskId,
      notificationSent: false,
      message: 'SalesTask model not yet implemented',
    }
  } catch (error: any) {
    console.error(`❌ Failed to process SLA reminder for task ${taskId}:`, error)
    throw error
  }
}

/**
 * Create sales worker
 */
export function createSalesWorker(): Worker<SalesJobData> {
  const worker = new Worker<SalesJobData>(
    'sales',
    async (job) => {
      switch (job.data.type) {
        case 'sla_reminder':
          return processSlaReminderJob(job)
        default:
          throw new Error(`Unknown sales job type: ${(job.data as any).type}`)
      }
    },
    {
      connection: redis,
      concurrency: 10, // Process up to 10 sales jobs concurrently
      limiter: {
        max: 100, // Max 100 jobs per
        duration: 60000, // 1 minute
      },
    }
  )

  worker.on('completed', (job, result) => {
    console.log(`✅ Sales job ${job.id} completed`, {
      type: job.data.type,
      taskId: result.taskId,
      notificationSent: result.notificationSent,
    })
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ Sales job ${job?.id} failed:`, err)
  })

  worker.on('error', (error) => {
    console.error('❌ Sales worker error:', error)
  })

  return worker
}
