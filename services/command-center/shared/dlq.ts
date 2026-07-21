/**
 * services/command-center/shared/dlq.ts
 *
 * Sprint 5A — BullMQ Dead Letter Queue (DLQ) Infrastructure
 *
 * When a job exhausts its attempts, the `failed` handler moves it to a
 * dedicated `dlq:{queueName}` queue for inspection and replay.
 *
 * Usage:
 *   import { attachDLQ, DLQMonitor } from './dlq.js'
 *   const worker = new Worker(...)
 *   attachDLQ(worker, QUEUE_NAME, redisUrl)
 *
 * DLQ jobs have extra metadata attached:
 *   { originalJobId, originalJobName, failedAt, failReason, originalData }
 *
 * The DLQMonitor runs every 5 minutes and emits INTERNAL_ALERT if DLQ depth > threshold.
 */

import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import { createLogger } from '@kealee/observability'

const logger = createLogger('dlq')

export const DLQ_QUEUE_PREFIX = 'dlq:'
export const DLQ_ALERT_THRESHOLD = 10 // alert if any DLQ has > 10 jobs

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DLQJob<T = unknown> {
  originalJobId:   string
  originalJobName: string
  originalQueue:   string
  failedAt:        string  // ISO
  failReason:      string
  attemptsMade:    number
  originalData:    T
}

// ─── Attach DLQ to a worker ───────────────────────────────────────────────────

/**
 * Attach DLQ behaviour to an existing Worker.
 * Failed jobs (after maxAttempts exhausted) are moved to `dlq:{queueName}`.
 */
export function attachDLQ<T>(
  worker: Worker<T>,
  queueName: string,
  redisUrl: string,
): Queue<DLQJob<T>> {
  const dlqName = `${DLQ_QUEUE_PREFIX}${queueName}`
  const dlqConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
  const dlqQueue = new Queue<DLQJob<T>>(dlqName, { connection: dlqConnection })

  worker.on('failed', async (job: Job<T> | undefined, err: Error) => {
    if (!job) return

    // Only move to DLQ when all retry attempts are exhausted
    const maxAttempts = job.opts?.attempts ?? 3
    if (job.attemptsMade < maxAttempts) return

    try {
      await dlqQueue.add(
        `dlq-${job.name}`,
        {
          originalJobId:   job.id ?? 'unknown',
          originalJobName: job.name,
          originalQueue:   queueName,
          failedAt:        new Date().toISOString(),
          failReason:      err.message,
          attemptsMade:    job.attemptsMade,
          originalData:    job.data,
        },
        {
          removeOnComplete: false,
          removeOnFail:     false,
        },
      )

      logger.warn(
        { jobId: job.id, jobName: job.name, queue: queueName, dlqName },
        'Job moved to DLQ after exhausting retries',
      )
    } catch (dlqErr: unknown) {
      logger.error(
        { err: (dlqErr as Error).message, jobId: job.id },
        'Failed to enqueue job in DLQ',
      )
    }
  })

  return dlqQueue
}

// ─── DLQ Monitor ─────────────────────────────────────────────────────────────

/**
 * Polls all known DLQs every 5 minutes.
 * Emits INTERNAL_ALERT via the provided callback when depth > threshold.
 */
export class DLQMonitor {
  private readonly interval = 5 * 60 * 1000 // 5 minutes
  private timer: ReturnType<typeof setInterval> | null = null
  private readonly queues: Map<string, Queue<DLQJob>> = new Map()

  constructor(
    private readonly redisUrl: string,
    private readonly onAlert: (queueName: string, depth: number) => void,
  ) {}

  /** Register a queue name to monitor */
  watch(queueName: string): void {
    const dlqName = `${DLQ_QUEUE_PREFIX}${queueName}`
    if (!this.queues.has(dlqName)) {
      const connection = new Redis(this.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      })
      this.queues.set(dlqName, new Queue<DLQJob>(dlqName, { connection }))
    }
  }

  start(): void {
    if (this.timer) return
    this.timer = setInterval(() => void this._scan(), this.interval)
    void this._scan() // initial scan on start
    logger.info({ queues: [...this.queues.keys()], interval: '5m' }, 'DLQMonitor started')
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private async _scan(): Promise<void> {
    for (const [dlqName, queue] of this.queues.entries()) {
      try {
        const waiting = await queue.getWaitingCount()
        logger.debug({ dlqName, depth: waiting }, 'DLQ scan')

        if (waiting >= DLQ_ALERT_THRESHOLD) {
          logger.warn({ dlqName, depth: waiting }, 'DLQ threshold exceeded — alerting')
          this.onAlert(dlqName, waiting)
        }
      } catch (err: unknown) {
        logger.error({ dlqName, err: (err as Error).message }, 'DLQ scan error')
      }
    }
  }

  /** Get depth snapshot for /admin/dlq endpoint */
  async getDepths(): Promise<Record<string, number>> {
    const result: Record<string, number> = {}
    for (const [dlqName, queue] of this.queues.entries()) {
      result[dlqName] = await queue.getWaitingCount().catch(() => -1)
    }
    return result
  }

  /** Replay a single DLQ job back to the original queue */
  async replayJob(dlqName: string, jobId: string, targetQueue: Queue): Promise<boolean> {
    const queue = this.queues.get(dlqName)
    if (!queue) return false

    const jobs = await queue.getJobs(['waiting'])
    const job = jobs.find(j => j.id === jobId)
    if (!job) return false

    await targetQueue.add(job.data.originalJobName, job.data.originalData, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    })

    await job.remove()
    logger.info({ jobId, dlqName }, 'DLQ job replayed')
    return true
  }
}
