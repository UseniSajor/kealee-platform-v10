/**
 * The v30 bot worker: drains JobQueue and runs one bot per job.
 *
 * The other half of enqueueV30BotJobs. Generation used to run in the API
 * process via `void runV30ParallelGeneration(...)`, so an API restart killed
 * in-flight bots with no resume and a rate limit failed a paid order outright.
 * This claims WAITING rows, runs one bot through the canonical orch path, and
 * decides retry-vs-fail from the error.
 *
 * Three properties the old design did not have:
 *
 *  1. Restart-safe. A process that dies mid-bot leaves its row ACTIVE; the
 *     reaper releases claims older than V30_BOT_STALE_CLAIM_MS back to WAITING
 *     so the next tick picks them up. (The site-plan drain only releases rows
 *     on an in-process exception, which does not cover a killed process.)
 *  2. Bounded. At most V30_BOT_CONCURRENCY bots run at once regardless of how
 *     many orders are queued. Seventeen bots fired for two orders under the old
 *     design; ten concurrent orders would have been ~85 simultaneous Claude
 *     calls and a guaranteed 429.
 *  3. Backed off. A 429 or 5xx requeues with exponential backoff instead of
 *     failing the order.
 */

import { prisma } from '@kealee/database'
import {
  V30_BOT_QUEUE,
  V30_BOT_PAYLOAD_VERSION,
  V30_BOT_STALE_CLAIM_MS,
  backoffForAttempt,
  enqueueV30BotJobs,
  isRetryableBotError,
  runV30BotExecution,
  finalizeV30PackageIfComplete,
  type V30BotJobPayload,
} from '@kealee/os-ai-orch'

/**
 * How many bots may run concurrently across the whole worker.
 *
 * This is the rate-limit control. Each bot is one Claude call lasting 20-30s,
 * so this caps sustained request rate against the Anthropic account. Raise it
 * only alongside the account's actual limits — the failure mode of setting it
 * too high is 429s across every order at once, which is worse than a queue
 * that drains slightly slower.
 */
export const V30_BOT_CONCURRENCY = Number(process.env.V30_BOT_CONCURRENCY ?? 4)

export interface V30DrainResult {
  recovered: number
  deliveryReconciled: number
  deliveryFailed: number
  reaped: number
  claimed: number
  completed: number
  failed: number
  retried: number
  finalized: number
  details: { bot: string; disposition: string; summary: string }[]
}

function webMainBase(): string {
  const raw = process.env.NEXT_PUBLIC_WEB_MAIN_URL
    ?? process.env.WEB_MAIN_URL
    ?? process.env.RAILWAY_SERVICE_WEB_MAIN_URL
    ?? 'https://kealee.com'
  return raw.replace(/\/$/, '')
}

/**
 * Replays the v30 -> intake delivery bridge until the customer-facing record
 * says both fulfillment and concept assembly completed.
 *
 * This is intentionally a scan of durable state rather than an in-memory
 * callback from the API. If web-main is deploying or an image provider times
 * out, the next worker tick tries again. The endpoint itself is idempotent.
 */
export async function reconcileV30CustomerDeliveries(limit = 2): Promise<{
  reconciled: number
  failed: number
}> {
  const secret = process.env.KEALEE_OPS_SECRET ?? process.env.CRON_SECRET
  if (!secret) return { reconciled: 0, failed: 0 }

  const projects = await prisma.project.findMany({
    where: {
      status: { in: ['GENERATING', 'DESIGN', 'DELIVERED', 'FAILED'] },
      updatedAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { updatedAt: 'asc' },
    select: { id: true, categoryMetadata: true },
    take: 100,
  })

  let reconciled = 0
  let failed = 0
  for (const project of projects) {
    if (reconciled + failed >= limit) break
    const meta = (project.categoryMetadata as Record<string, unknown> | null) ?? {}
    const intakeId = typeof meta.intakeLeadId === 'string' ? meta.intakeLeadId : ''
    if (!intakeId) continue

    const rows = await prisma.$queryRaw<Array<{ form_data: unknown }>>`
      SELECT form_data FROM public_intake_leads WHERE id = ${intakeId} LIMIT 1
    `
    const formData = (rows[0]?.form_data as Record<string, unknown> | null) ?? {}
    if (formData.fulfillmentCompletedAt && formData.v30ConceptDeliverablesFinalizedAt) continue

    const executions = await prisma.v30BotExecution.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'desc' },
      select: { botType: true, status: true },
    })
    if (!executions.some(e => e.botType === 'design' && e.status === 'COMPLETE')) continue

    try {
      const response = await fetch(`${webMainBase()}/api/internal/v30/reconcile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intakeId,
          projectId: project.id,
          requiredBotTypes: Array.isArray(formData.fulfillmentBotTypes)
            ? formData.fulfillmentBotTypes
            : [],
        }),
      })
      if (!response.ok) throw new Error(`web-main reconciliation returned HTTP ${response.status}`)
      reconciled++
    } catch (error) {
      failed++
      console.error(
        `[v30-delivery] reconcile failed intake=${intakeId} project=${project.id}:`,
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  return { reconciled, failed }
}

/**
 * Repairs the most dangerous payment/generation split-brain state:
 * V30BotExecution rows exist, but no JobQueue row was committed for them.
 *
 * This can happen when an older API deployment creates executions just before
 * a restart, or when a process dies between those two writes. The executions
 * are the durable statement that work is owed, so the worker reconstructs the
 * missing queue rows. Upsert-by-execution-id makes this safe on every tick.
 *
 * EXECUTING rows with no queue record and no update for the full stale window
 * are also reset. A live execution is never touched.
 */
export async function recoverOrphanedV30Executions(): Promise<number> {
  const now = Date.now()
  const pendingGrace = new Date(now - 30_000)
  const staleExecution = new Date(now - V30_BOT_STALE_CLAIM_MS)

  const candidates = await prisma.v30BotExecution.findMany({
    where: {
      OR: [
        { status: 'PENDING', createdAt: { lt: pendingGrace } },
        { status: 'EXECUTING', updatedAt: { lt: staleExecution } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, projectId: true, packageId: true, botType: true,
      status: true, updatedAt: true,
    },
    take: 200,
  })
  if (candidates.length === 0) return 0

  const existing = await prisma.jobQueue.findMany({
    where: { queueName: V30_BOT_QUEUE, jobId: { in: candidates.map(c => c.id) } },
    select: { jobId: true },
  })
  const queuedIds = new Set(existing.map(j => j.jobId))
  const missing = candidates.filter(c => !queuedIds.has(c.id))
  if (missing.length === 0) return 0

  let recovered = 0
  for (const execution of missing) {
    if (execution.status === 'EXECUTING') {
      await prisma.v30BotExecution.updateMany({
        where: { id: execution.id, status: 'EXECUTING', updatedAt: { lt: staleExecution } },
        data: {
          status: 'PENDING',
          errorMessage: 'Recovered after execution lost its durable queue record.',
        },
      })
    }
    recovered += await enqueueV30BotJobs({
      projectId: execution.projectId,
      packageId: execution.packageId,
      executionIds: { [execution.botType]: execution.id },
    })
  }

  return recovered
}

/**
 * Releases claims left behind by a dead process.
 *
 * A row is ACTIVE with a processedAt older than the stale window only if the
 * worker that claimed it never finished — a normal run either completes the
 * row or fails it. Attempts were already incremented at claim time, so a job
 * that repeatedly kills its worker still exhausts maxAttempts rather than
 * looping forever.
 */
async function reapStaleClaims(): Promise<number> {
  const cutoff = new Date(Date.now() - V30_BOT_STALE_CLAIM_MS)
  const stale = await prisma.jobQueue.updateMany({
    where: {
      queueName: V30_BOT_QUEUE,
      status: 'ACTIVE',
      processedAt: { lt: cutoff },
    },
    data: { status: 'WAITING', error: 'Released: claim went stale (worker restart or crash)' },
  })
  return stale.count
}

/**
 * Atomic claim. `updateMany` with a status predicate means two workers racing
 * for the same row leave one with zero updated rows, which moves on. Without
 * it both would run the same bot and bill twice for one answer.
 *
 * `delay` doubles as "not before": a retry sets it to the backoff deadline in
 * epoch ms, and a row whose deadline has not passed is skipped.
 */
async function claimNext(): Promise<
  { id: string; data: unknown; attempts: number; maxAttempts: number } | null
> {
  const now = Date.now()
  const candidates = await prisma.jobQueue.findMany({
    where: { queueName: V30_BOT_QUEUE, status: 'WAITING' },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    select: { id: true, data: true, attempts: true, maxAttempts: true, delay: true },
    take: 20,
  })

  for (const candidate of candidates) {
    if (candidate.delay && candidate.delay > now) continue // still backing off
    const claim = await prisma.jobQueue.updateMany({
      where: { id: candidate.id, status: 'WAITING' },
      data: { status: 'ACTIVE', attempts: { increment: 1 }, processedAt: new Date() },
    })
    if (claim.count === 1) return candidate
  }
  return null
}

/** Runs one claimed job and records its outcome. */
async function runOne(
  claimed: NonNullable<Awaited<ReturnType<typeof claimNext>>>,
): Promise<{ disposition: 'COMPLETED' | 'FAILED' | 'RETRY'; bot: string; summary: string; finalized: boolean }> {
  const payload = (claimed.data ?? {}) as Partial<V30BotJobPayload>
  const bot = payload.botType ?? '?'

  const fail = async (summary: string) => {
    await prisma.jobQueue.update({
      where: { id: claimed.id },
      data: { status: 'FAILED', error: summary, completedAt: new Date() },
    })
    return { disposition: 'FAILED' as const, bot, summary, finalized: false }
  }

  if (!payload.executionId || !payload.projectId || !payload.packageId) {
    return fail(`Malformed v30 bot payload: ${JSON.stringify(payload).slice(0, 200)}`)
  }
  if (payload.payloadVersion !== V30_BOT_PAYLOAD_VERSION) {
    return fail(
      `Job queued under payload version ${payload.payloadVersion}; this worker is ` +
      `version ${V30_BOT_PAYLOAD_VERSION}.`,
    )
  }

  try {
    const result = await runV30BotExecution(payload.executionId)

    await prisma.jobQueue.update({
      where: { id: claimed.id },
      data: { status: 'COMPLETED', progress: 100, completedAt: new Date() },
    })

    // Whichever bot finishes last closes the package out.
    const fin = await finalizeV30PackageIfComplete({
      projectId: payload.projectId,
      packageId: payload.packageId,
    })

    return {
      disposition: 'COMPLETED',
      bot,
      summary: `${bot} ${result.status}`,
      finalized: fin.finalized,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const retryable = isRetryableBotError(err)
    const exhausted = claimed.attempts >= claimed.maxAttempts

    if (retryable && !exhausted) {
      // Back-pressure, not a bad job. Requeue behind a deadline so a
      // rate-limited queue spreads out instead of re-hitting the ceiling.
      const notBefore = Date.now() + backoffForAttempt(claimed.attempts)
      await prisma.jobQueue.update({
        where: { id: claimed.id },
        data: { status: 'WAITING', delay: notBefore, error: `Retrying: ${message.slice(0, 300)}` },
      })
      return {
        disposition: 'RETRY',
        bot,
        summary: `${bot} retry ${claimed.attempts}/${claimed.maxAttempts}: ${message.slice(0, 120)}`,
        finalized: false,
      }
    }

    // Terminal: record it on the execution too, or the package never finalizes
    // because one row sits PENDING forever.
    await prisma.v30BotExecution.update({
      where: { id: payload.executionId },
      data: { status: 'FAILED', errorMessage: message.slice(0, 500), completedAt: new Date() },
    }).catch(() => undefined)

    const outcome = await fail(message.slice(0, 500))
    const fin = await finalizeV30PackageIfComplete({
      projectId: payload.projectId,
      packageId: payload.packageId,
    }).catch(() => ({ finalized: false }))

    return { ...outcome, finalized: fin.finalized }
  }
}

/**
 * Drains up to `limit` jobs, at most V30_BOT_CONCURRENCY at a time.
 *
 * Bounded per tick so one long-running order cannot hold a tick open and hide
 * failures from the next one.
 */
export async function drainV30BotQueue(limit = 8): Promise<V30DrainResult> {
  const result: V30DrainResult = {
    recovered: 0, deliveryReconciled: 0, deliveryFailed: 0,
    reaped: 0, claimed: 0, completed: 0, failed: 0, retried: 0, finalized: 0, details: [],
  }

  result.recovered = await recoverOrphanedV30Executions()
  result.reaped = await reapStaleClaims()

  let remaining = limit
  while (remaining > 0) {
    const batch: NonNullable<Awaited<ReturnType<typeof claimNext>>>[] = []
    const want = Math.min(V30_BOT_CONCURRENCY, remaining)

    for (let i = 0; i < want; i++) {
      const claimed = await claimNext()
      if (!claimed) break
      batch.push(claimed)
    }
    if (batch.length === 0) break

    result.claimed += batch.length
    remaining -= batch.length

    const settled = await Promise.allSettled(batch.map(runOne))
    for (const s of settled) {
      if (s.status !== 'fulfilled') {
        result.failed++
        result.details.push({ bot: '?', disposition: 'FAILED', summary: String(s.reason).slice(0, 200) })
        continue
      }
      const r = s.value
      if (r.disposition === 'COMPLETED') result.completed++
      else if (r.disposition === 'RETRY') result.retried++
      else result.failed++
      if (r.finalized) result.finalized++
      result.details.push({ bot: r.bot, disposition: r.disposition, summary: r.summary })
    }
  }

  const delivery = await reconcileV30CustomerDeliveries()
  result.deliveryReconciled = delivery.reconciled
  result.deliveryFailed = delivery.failed

  return result
}
