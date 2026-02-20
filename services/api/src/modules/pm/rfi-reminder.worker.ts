/**
 * RFI Reminder Worker
 *
 * BullMQ worker that processes the daily RFI reminder scan.
 * Registers a repeatable job that runs every day at 8:00 AM UTC.
 *
 * Usage:
 *   import { startRfiReminderWorker } from './rfi-reminder.worker'
 *   await startRfiReminderWorker()
 */

import { Queue, Worker, type Job } from 'bullmq'
import { rfiReminderService } from './rfi-reminder.service'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const QUEUE_NAME = 'rfi-reminders'
const JOB_NAME = 'scan-rfi-reminders'

/**
 * Get Redis connection options. Mirrors @kealee/queue/connection
 * but inlined to avoid circular dependency from services/api.
 */
function getRedisConnection() {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379'
  try {
    const parsed = new URL(url)
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
      maxRetriesPerRequest: null as any,
    }
  } catch {
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null as any,
    }
  }
}

// ---------------------------------------------------------------------------
// Queue & Worker
// ---------------------------------------------------------------------------

let queue: Queue | null = null
let worker: Worker | null = null

/**
 * Start the RFI reminder worker.
 * Idempotent — safe to call multiple times.
 */
export async function startRfiReminderWorker(): Promise<void> {
  const connection = getRedisConnection()

  // Create queue
  queue = new Queue(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  })

  // Register repeatable job — runs daily at 8:00 AM UTC
  await queue.upsertJobScheduler(
    JOB_NAME,
    { pattern: '0 8 * * *' }, // cron: 8 AM UTC daily
    {
      name: JOB_NAME,
      data: { trigger: 'scheduled' },
    },
  ).catch((err) => {
    // Fallback for older BullMQ versions: use add with repeat
    console.warn('[rfi-reminder] upsertJobScheduler not available, using add with repeat:', err.message)
    return queue!.add(JOB_NAME, { trigger: 'scheduled' }, {
      repeat: { pattern: '0 8 * * *' },
      jobId: JOB_NAME,
    })
  })

  console.log(`[rfi-reminder] Scheduled daily RFI reminder scan (8:00 AM UTC)`)

  // Create worker
  worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      console.log(`[rfi-reminder] Processing job ${job.id} (${job.name})`)
      const result = await rfiReminderService.scanForReminders()
      console.log(
        `[rfi-reminder] Scan complete: ${result.processed} RFIs checked, ${result.reminders.length} reminders sent`,
      )
      return result
    },
    {
      connection,
      concurrency: 1, // Only one scan at a time
    },
  )

  worker.on('completed', (job, result) => {
    console.log(`[rfi-reminder] Job ${job.id} completed:`, result)
  })

  worker.on('failed', (job, err) => {
    console.error(`[rfi-reminder] Job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('[rfi-reminder] Worker error:', err)
  })

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[rfi-reminder] Shutting down...')
    await worker?.close()
    await queue?.close()
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

/**
 * Manually trigger an RFI reminder scan (for testing/admin use).
 */
export async function triggerRfiReminderScan(): Promise<any> {
  if (!queue) {
    // Run directly without queue
    return rfiReminderService.scanForReminders()
  }
  const job = await queue.add(`${JOB_NAME}-manual`, { trigger: 'manual' })
  return { jobId: job.id, status: 'queued' }
}

/**
 * Stop the RFI reminder worker.
 */
export async function stopRfiReminderWorker(): Promise<void> {
  await worker?.close()
  await queue?.close()
  worker = null
  queue = null
}
