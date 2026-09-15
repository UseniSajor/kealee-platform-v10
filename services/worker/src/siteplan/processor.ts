/**
 * The site-plan worker: drains JobQueue and runs stages.
 *
 * The webhook records intent in `JobQueue` rather than pushing to Redis, so a
 * Redis outage delays a plan instead of losing a paid order. This is the other
 * half of that: it claims WAITING rows, runs the stage through the engine's
 * runner, and enqueues whatever the runner says is now unblocked.
 *
 * It calls `Workflow.runStage` and nothing else. No processor is invoked
 * directly, so the guard, the persistence contract and the AWAITING_REVIEW rule
 * cannot be bypassed by adding a worker.
 */

import { prisma } from '@kealee/database'
import { Workflow } from '@kealee/pascal-agents/engine'
import { productionCapabilities, loadSnapshot, loadPriorOutputs } from './capabilities'
import {
  bridgeSitePlanDelivery, bridgeSitePlanReviewOutcome, productionDeliveryPorts,
  productIncludesProfessionalReview,
} from './delivery'

export interface DrainResult {
  claimed: number
  completed: number
  blocked: number
  failed: number
  enqueued: number
  details: { job: string; workflowId: string; disposition: string; summary: string }[]
}

/**
 * Enqueues one stage. Upsert on (queueName, jobId) so a redelivery or a
 * concurrent run cannot double-queue a stage; `update: {}` makes the second
 * writer a no-op.
 *
 * `attemptOf` is for RE-RUNNING a stage that ended AWAITING_REVIEW — its
 * original row is terminal, so the re-run needs its own key rather than a
 * silent no-op against the finished one.
 */
export async function enqueueSitePlanJob(input: {
  workflowId: string
  job: Workflow.SitePlanJobName
  attemptOf?: number
}): Promise<void> {
  const w = Workflow.workerFor(input.job)
  const jobKey = Workflow.jobIdempotencyKey(input)
  await prisma.jobQueue.upsert({
    where: { queueName_jobId: { queueName: w.queue, jobId: jobKey } },
    create: {
      queueName: w.queue, jobId: jobKey, jobName: input.job, status: 'WAITING',
      priority: 0, attempts: 0, maxAttempts: w.maxAttempts,
      data: {
        workflowId: input.workflowId, job: input.job,
        payloadVersion: Workflow.SITE_PLAN_WORKFLOW_VERSION,
        backoffMs: w.backoffMs,
      } as never,
    },
    update: {},
  })
}

/**
 * Re-runs a stage that is waiting on a human. Called when the professional
 * acts, so the stage can read the decision and move on. The key carries the
 * next free ordinal for this (workflow, job) so each re-run is its own row.
 */
export async function reopenSitePlanJob(input: {
  workflowId: string
  job: Workflow.SitePlanJobName
}): Promise<{ jobKey: string }> {
  const w = Workflow.workerFor(input.job)
  const prefix = Workflow.jobIdempotencyKey(input)
  const priorRuns = await prisma.jobQueue.count({
    where: { queueName: w.queue, jobId: { startsWith: prefix } },
  })
  const attemptOf = priorRuns + 1
  await enqueueSitePlanJob({ ...input, attemptOf })
  return { jobKey: Workflow.jobIdempotencyKey({ ...input, attemptOf }) }
}

/**
 * Claims one WAITING row atomically.
 *
 * `updateMany` with a status predicate is the claim: two workers racing for the
 * same row means one updates zero rows and moves on. Without that, both would
 * run the same stage, and a non-deterministic stage would produce two different
 * answers for one workflow.
 */
async function claimNext(): Promise<{
  id: string; jobName: string | null; data: unknown; attempts: number; maxAttempts: number
} | null> {
  const candidate = await prisma.jobQueue.findFirst({
    where: { queueName: Workflow.SITE_PLAN_QUEUE, status: 'WAITING' },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    select: { id: true, jobName: true, data: true, attempts: true, maxAttempts: true },
  })
  if (!candidate) return null

  const claim = await prisma.jobQueue.updateMany({
    where: { id: candidate.id, status: 'WAITING' },
    data: { status: 'ACTIVE', attempts: { increment: 1 }, processedAt: new Date() },
  })
  return claim.count === 1 ? candidate : null
}

/** Runs one claimed job. */
async function runOne(
  claimed: NonNullable<Awaited<ReturnType<typeof claimNext>>>,
): Promise<DrainResult['details'][number] & { enqueued: number }> {
  const payload = (claimed.data ?? {}) as {
    workflowId?: string; job?: string; payloadVersion?: number
  }
  const workflowId = payload.workflowId ?? ''
  const job = payload.job ?? claimed.jobName ?? ''

  const fail = async (summary: string) => {
    await prisma.jobQueue.update({
      where: { id: claimed.id },
      data: { status: 'FAILED', error: summary, completedAt: new Date() },
    })
    return { job, workflowId, disposition: 'FAILED', summary, enqueued: 0 }
  }

  if (!workflowId || !Workflow.isRegisteredJob(job)) {
    return fail(`Malformed site-plan job payload: workflowId="${workflowId}" job="${job}".`)
  }

  // Payload version is validated before any work: a job queued under an older
  // definition must not run against this one.
  if (payload.payloadVersion !== undefined
      && payload.payloadVersion !== Workflow.SITE_PLAN_WORKFLOW_VERSION) {
    return fail(
      `Job was queued under payload version ${payload.payloadVersion}; this worker is ` +
      `version ${Workflow.SITE_PLAN_WORKFLOW_VERSION}.`)
  }

  const snapshot = await loadSnapshot(workflowId)
  if (!snapshot) return fail(`Workflow ${workflowId} not found.`)

  const wf = await prisma.sitePlanWorkflow.findUnique({
    where: { id: workflowId },
    select: { organizationId: true, projectId: true, orderId: true, productId: true, metadata: true },
  })

  const outcome = await Workflow.runStage(
    {
      workflowId, job, attempt: claimed.attempts,
      subject: {
        organizationId: wf?.organizationId ?? '',
        projectId: wf?.projectId ?? '',
        orderId: wf?.orderId ?? '',
        productId: wf?.productId ?? null,
        formData: ((wf?.metadata as Record<string, unknown>) ?? {}),
      },
      snapshot,
      capabilities: productionCapabilities({ jobQueueId: claimed.id }),
      priorOutputs: (await loadPriorOutputs(workflowId)) as never,
    },
    {
      processors: Workflow.SITE_PLAN_PROCESSORS,
      loadPriorResult: async (w, j) => (await loadPriorOutputs(w))[j] ?? null,
    },
  )

  const terminal = outcome.disposition === 'COMPLETED'
    || outcome.disposition === 'SKIPPED_ALREADY_DONE'
    || outcome.disposition === 'AWAITING_REVIEW'

  await prisma.jobQueue.update({
    where: { id: claimed.id },
    data: {
      status: terminal ? 'COMPLETED' : 'FAILED',
      result: { disposition: outcome.disposition, summary: outcome.summary } as never,
      error: outcome.error ?? null,
      completedAt: new Date(),
    },
  })

  // A deliverable stage reaching COMPLETED is the moment the customer can be
  // given something. Bridge it to the order: status, portal record, email.
  // Runs on SKIPPED_ALREADY_DONE too, so a replayed job still closes an order
  // whose bridge previously failed; the bridge itself is idempotent.
  let deliverySummary: string | null = null
  let enqueued = 0
  const settled = outcome.disposition === 'COMPLETED' || outcome.disposition === 'SKIPPED_ALREADY_DONE'
  const subject = { workflowId, orderId: wf?.orderId ?? '', productId: wf?.productId ?? null }
  const ports = productionDeliveryPorts({ loadOutputs: loadPriorOutputs })

  if (settled && Workflow.stageFor(job as Workflow.SitePlanJobName).deliverable) {
    const delivery = await bridgeSitePlanDelivery(subject, ports)
    deliverySummary = delivery.summary
    console.log(`[siteplan] delivery: ${delivery.summary}`)

    // The higher tiers include a licensed professional's review. Route the
    // delivered plan to one now. `route_review` is not in the first release,
    // so the runner never derives it; it is enqueued here, on purpose, for
    // the products that paid for it.
    if (productIncludesProfessionalReview(subject.productId)) {
      await enqueueSitePlanJob({ workflowId, job: 'siteplan.route_review' })
      enqueued++
      console.log(`[siteplan] routed ${workflowId} for professional review`)
    }
  }

  // A decided review — approved or changes requested — reaches the order.
  if (settled && job === 'siteplan.route_review') {
    const review = await bridgeSitePlanReviewOutcome(subject, ports)
    deliverySummary = review.summary
    console.log(`[siteplan] review: ${review.summary}`)
  }

  // Enqueue what this stage unblocked.
  if (outcome.disposition === 'COMPLETED') {
    for (const next of outcome.nextJobs) {
      await enqueueSitePlanJob({ workflowId, job: next })
      enqueued++
    }
  }

  return {
    job, workflowId, disposition: outcome.disposition,
    summary: deliverySummary ? `${outcome.summary} ${deliverySummary}` : outcome.summary,
    enqueued,
  }
}

/**
 * Drains up to `max` site-plan jobs.
 *
 * Bounded rather than looping until empty: a stage that enqueues its successor
 * would otherwise let one invocation run an entire workflow, holding the tick
 * open and hiding failures behind a long-running call.
 */
export async function drainSitePlanQueue(max = 10): Promise<DrainResult> {
  const result: DrainResult = {
    claimed: 0, completed: 0, blocked: 0, failed: 0, enqueued: 0, details: [],
  }

  for (let i = 0; i < max; i++) {
    const claimed = await claimNext()
    if (!claimed) break
    result.claimed++

    try {
      const r = await runOne(claimed)
      result.enqueued += r.enqueued
      if (r.disposition === 'COMPLETED' || r.disposition === 'SKIPPED_ALREADY_DONE') result.completed++
      else if (r.disposition === 'BLOCKED' || r.disposition === 'AWAITING_REVIEW') result.blocked++
      else result.failed++
      result.details.push({
        job: r.job, workflowId: r.workflowId, disposition: r.disposition, summary: r.summary,
      })
    } catch (e) {
      // A worker that dies leaves the row ACTIVE forever. Release it.
      const message = e instanceof Error ? e.message : String(e)
      await prisma.jobQueue.update({
        where: { id: claimed.id },
        data: {
          status: claimed.attempts >= claimed.maxAttempts ? 'FAILED' : 'WAITING',
          error: message,
        },
      }).catch(() => undefined)
      result.failed++
      result.details.push({
        job: claimed.jobName ?? '?', workflowId: '?', disposition: 'FAILED', summary: message,
      })
    }
  }

  return result
}
