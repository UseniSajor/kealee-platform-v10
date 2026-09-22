/**
 * Durable queueing for v30 bot execution.
 *
 * startV30Generation used to dispatch bots with `void runV30ParallelGeneration(...)`
 * — fire-and-forget inside the API process. Three things followed from that:
 * an API restart killed every in-flight bot with no resume (observed: the API
 * redeployed mid-run and two paid orders lost their generation), a failed bot
 * was terminal until a human called /retry, and minutes-long Claude calls
 * competed with ordinary api.kealee.com request handling.
 *
 * This records intent in JobQueue instead, the same way the Stripe webhook
 * records site-plan stages, so a restart delays a bot rather than losing it.
 * The worker drains the queue.
 *
 * The v30BotExecution row is already the durable record of intent and carries
 * inputData, so a job payload only needs identifiers — the worker reads
 * everything else from the row. That also means a requeue can never disagree
 * with what the execution was created for.
 */

import { prisma } from '@kealee/database'

export const V30_BOT_QUEUE = 'v30-bot'

/**
 * Bumped when the payload shape changes. A job queued under an older version
 * is failed rather than run against a definition it was not written for.
 */
export const V30_BOT_PAYLOAD_VERSION = 1

/** Per-bot attempts before a job is abandoned to FAILED. */
export const V30_BOT_MAX_ATTEMPTS = 3

/** Base backoff between retries; grows exponentially per attempt. */
export const V30_BOT_BACKOFF_MS = 30_000

/**
 * A claim older than this is assumed to belong to a dead process and is
 * released back to WAITING. This is what makes a restart survivable: without
 * it a row claimed by a process that then died stays ACTIVE forever and the
 * order silently stops moving.
 *
 * Must exceed the longest plausible bot run. Observed runs are 20-30s; design
 * and floorplan are the slow ones. Ten minutes is generous on purpose — the
 * cost of reaping too early is running a bot twice.
 */
export const V30_BOT_STALE_CLAIM_MS = 10 * 60 * 1000

export interface V30BotJobPayload {
  executionId: string
  projectId: string
  packageId: string
  botType: string
  payloadVersion: number
}

/**
 * Enqueues one job per bot execution.
 *
 * Keyed on the executionId, which is unique per bot per generation run, so a
 * redelivery or a concurrent caller cannot double-queue the same bot. `update`
 * is deliberately a no-op: the existing row already describes this work, and
 * overwriting it would reset attempts on a job that is mid-retry.
 */
export async function enqueueV30BotJobs(input: {
  projectId: string
  packageId: string
  /** botType -> v30BotExecution.id, as returned by startV30Generation. */
  executionIds: Record<string, string>
}): Promise<number> {
  const entries = Object.entries(input.executionIds)
  let queued = 0

  for (const [botType, executionId] of entries) {
    const payload: V30BotJobPayload = {
      executionId,
      projectId: input.projectId,
      packageId: input.packageId,
      botType,
      payloadVersion: V30_BOT_PAYLOAD_VERSION,
    }

    await prisma.jobQueue.upsert({
      where: { queueName_jobId: { queueName: V30_BOT_QUEUE, jobId: executionId } },
      create: {
        queueName: V30_BOT_QUEUE,
        jobId: executionId,
        jobName: `v30:${botType}`,
        status: 'WAITING',
        priority: 0,
        attempts: 0,
        maxAttempts: V30_BOT_MAX_ATTEMPTS,
        data: payload as never,
      },
      update: {},
    })
    queued++
  }

  return queued
}

/**
 * True when an error means "try again later" rather than "this job is bad".
 *
 * Anthropic returns 429 when the account's rate limit is exceeded and 529 when
 * the service is overloaded; both are the fleet telling us to slow down, and
 * failing the bot for them would abandon a paid order over back-pressure. 5xx
 * is treated the same way. A 400 is not retryable — that is a bug in the
 * request and retrying it just burns the attempt budget.
 */
export function isRetryableBotError(err: unknown): boolean {
  const status = (err as { status?: number; statusCode?: number } | null)?.status
    ?? (err as { statusCode?: number } | null)?.statusCode
  if (typeof status === 'number') {
    return status === 429 || status >= 500
  }

  const message = err instanceof Error ? err.message : String(err ?? '')
  return /\b(429|rate[_ -]?limit|overloaded|529|502|503|504|ETIMEDOUT|ECONNRESET)\b/i.test(message)
}

/**
 * Backoff for the next attempt, in milliseconds. Exponential on attempt count
 * so a rate-limited queue spreads out instead of hammering the same ceiling.
 */
export function backoffForAttempt(attempt: number): number {
  return V30_BOT_BACKOFF_MS * Math.pow(2, Math.max(0, attempt - 1))
}
