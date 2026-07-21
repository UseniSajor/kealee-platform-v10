import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import type { MarketingJobPayload, MarketingJobType } from './domain'

export const MARKETING_OS_QUEUE = 'kealee-marketing-os'

let connection: IORedis | null = null
let queue: Queue<MarketingJobPayload> | null = null

function getConnection() {
  if (!process.env.REDIS_URL) throw new Error('REDIS_URL is required for Marketing OS automation')
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      connectionName: 'kealee-marketing-os',
    })
  }
  return connection
}

export function getMarketingQueue() {
  if (!queue) {
    queue = new Queue<MarketingJobPayload>(MARKETING_OS_QUEUE, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 4,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { age: 60 * 60 * 24 * 30, count: 10_000 },
        removeOnFail: { age: 60 * 60 * 24 * 90, count: 25_000 },
      },
    })
  }
  return queue
}

export async function enqueueMarketingJob(opts: {
  type: MarketingJobType
  actorId: string
  input: Record<string, unknown>
  idempotencyKey: string
  approvalMode?: MarketingJobPayload['approvalMode']
  delayMs?: number
  priority?: number
}) {
  const correlationId = crypto.randomUUID()
  const payload: MarketingJobPayload = {
    type: opts.type,
    actorId: opts.actorId,
    correlationId,
    input: opts.input,
    approvalMode: opts.approvalMode ?? 'risk_based',
  }
  const job = await getMarketingQueue().add(opts.type, payload, {
    jobId: opts.idempotencyKey,
    delay: opts.delayMs,
    priority: opts.priority,
  })
  return { jobId: job.id, correlationId, payload }
}

export async function getQueueHealth() {
  if (!process.env.REDIS_URL) return { configured: false, connected: false, counts: null }
  try {
    const q = getMarketingQueue()
    const [waiting, active, delayed, completed, failed] = await Promise.all([
      q.getWaitingCount(),
      q.getActiveCount(),
      q.getDelayedCount(),
      q.getCompletedCount(),
      q.getFailedCount(),
    ])
    return { configured: true, connected: true, counts: { waiting, active, delayed, completed, failed } }
  } catch (error) {
    return {
      configured: true,
      connected: false,
      counts: null,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
