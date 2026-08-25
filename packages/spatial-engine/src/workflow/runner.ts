/**
 * The stage runner. Every worker calls this; no worker calls a processor
 * directly.
 *
 * It is the single place the guard is applied, the single place a result is
 * persisted, and the single place the next job is derived. A processor that
 * ran without passing through here would bypass sequencing, and the whole
 * point of the enforcement layer is that it cannot.
 *
 * ── Idempotence ───────────────────────────────────────────────────────────
 *
 * A BullMQ redelivery must not repeat work. When the guard reports the stage
 * already satisfied, the runner returns the PERSISTED result rather than
 * recomputing — which matters most for the non-deterministic stages, where a
 * second live GIS call could legitimately return something different and
 * silently fork the plan.
 */

import {
  assertCanRun, nextJobs, alreadySatisfied, WorkflowTransitionError,
  type WorkflowSnapshot,
} from './state-machine'
import type { SitePlanJobName } from './definition'
import type { StageContext, StageResult, StageProcessor } from './context'
import { isMachineCompletable } from './registry'

export type RunDisposition =
  | 'COMPLETED' | 'AWAITING_REVIEW' | 'BLOCKED'
  | 'SKIPPED_ALREADY_DONE' | 'REJECTED_BY_GUARD' | 'NO_PROCESSOR' | 'FAILED'

export interface RunOutcome {
  disposition: RunDisposition
  job: SitePlanJobName
  workflowId: string
  outputs: unknown
  blockers: string[]
  /** Jobs unblocked by this one completing. */
  nextJobs: SitePlanJobName[]
  artifacts: { documentId: string; filename: string }[]
  summary: string
  error?: string
  durationMs: number
}

export interface RunnerDeps {
  processors: Partial<Record<SitePlanJobName, StageProcessor | undefined>>
  /** Persisted result of an already-completed stage, for idempotent replay. */
  loadPriorResult?: (workflowId: string, job: SitePlanJobName) => Promise<unknown>
}

/**
 * Runs one stage.
 *
 * Never throws. A worker that dies on an exception leaves the workflow with a
 * stage stuck IN_PROGRESS and no record of why; returning an outcome means the
 * failure is persisted and the stage can be retried or reopened.
 */
export async function runStage(
  ctx: StageContext, deps: RunnerDeps,
): Promise<RunOutcome> {
  const started = Date.now()
  const base = {
    job: ctx.job, workflowId: ctx.workflowId,
    outputs: null as unknown, blockers: [] as string[],
    nextJobs: [] as SitePlanJobName[],
    artifacts: [] as { documentId: string; filename: string }[],
  }

  // Idempotent replay comes BEFORE the guard, because the guard treats a
  // completed stage as an error while a redelivery is entirely normal.
  if (alreadySatisfied(ctx.snapshot, ctx.job)) {
    const prior = deps.loadPriorResult
      ? await deps.loadPriorResult(ctx.workflowId, ctx.job).catch(() => null)
      : null
    ctx.capabilities.trace({
      workflowId: ctx.workflowId, job: ctx.job, phase: 'skip',
      detail: 'already completed; returning the persisted result',
    })
    return {
      ...base, disposition: 'SKIPPED_ALREADY_DONE', outputs: prior,
      nextJobs: nextJobs(ctx.snapshot, { firstReleaseOnly: true }),
      summary: `${ctx.job} already completed; returned the persisted result.`,
      durationMs: Date.now() - started,
    }
  }

  try {
    assertCanRun(ctx.snapshot, ctx.job)
  } catch (e) {
    const err = e as WorkflowTransitionError
    return {
      ...base, disposition: 'REJECTED_BY_GUARD',
      summary: `Guard rejected ${ctx.job}: ${err.code}.`,
      error: err.message, durationMs: Date.now() - started,
    }
  }

  const processor = deps.processors[ctx.job]
  if (!processor) {
    return {
      ...base, disposition: 'NO_PROCESSOR',
      summary:
        `${ctx.job} is registered in the workflow definition but has no processor. ` +
        'It is declared and not yet connected.',
      durationMs: Date.now() - started,
    }
  }

  ctx.capabilities.trace({ workflowId: ctx.workflowId, job: ctx.job, phase: 'start' })

  let result: StageResult
  try {
    result = await processor(ctx)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    await persistSafely(ctx, {
      status: 'BLOCKED', attempt: ctx.attempt, inputs: ctx.priorOutputs,
      outputs: null, blockers: [message],
    })
    ctx.capabilities.trace({
      workflowId: ctx.workflowId, job: ctx.job, phase: 'fail',
      detail: message, durationMs: Date.now() - started,
    })
    return {
      ...base, disposition: 'FAILED',
      summary: `${ctx.job} threw. The failure is persisted; the stage can be retried.`,
      error: message, durationMs: Date.now() - started,
    }
  }

  // A stage no software agent may complete ends AWAITING_REVIEW even if the
  // processor reported success — a machine never records a professional
  // decision, and this is where that is enforced rather than trusted.
  const status = result.status === 'COMPLETED' && !isMachineCompletable(ctx.job)
    ? 'AWAITING_REVIEW'
    : result.status

  await persistSafely(ctx, {
    status, attempt: ctx.attempt, inputs: ctx.priorOutputs, outputs: result.outputs,
    blockers: result.blockers, twinRevision: result.twinRevision,
    rulePackVersion: result.rulePackVersion,
  })

  const advanced: WorkflowSnapshot = status === 'COMPLETED'
    ? { ...ctx.snapshot, stages: [...ctx.snapshot.stages, { job: ctx.job, status: 'COMPLETED', attempt: ctx.attempt }] }
    : ctx.snapshot

  const durationMs = Date.now() - started
  ctx.capabilities.trace({
    workflowId: ctx.workflowId, job: ctx.job, phase: 'complete',
    detail: status, durationMs,
  })

  return {
    ...base,
    disposition: status,
    outputs: result.outputs,
    blockers: result.blockers ?? [],
    nextJobs: result.enqueue ?? nextJobs(advanced, { firstReleaseOnly: true }),
    artifacts: result.artifacts ?? [],
    summary: `${ctx.job} -> ${status}.`,
    durationMs,
  }
}

/**
 * Persistence failure must not be mistaken for stage failure.
 *
 * If the stage did its work and only the write failed, the honest record is
 * that the write failed — swallowing it would let the workflow advance past a
 * stage whose result nobody can read on resume.
 */
async function persistSafely(
  ctx: StageContext,
  r: {
    status: 'COMPLETED' | 'AWAITING_REVIEW' | 'BLOCKED' | 'REJECTED'
    attempt: number; inputs: unknown; outputs: unknown
    blockers?: string[]; twinRevision?: number; rulePackVersion?: string
  },
): Promise<void> {
  try {
    await ctx.capabilities.persist({ workflowId: ctx.workflowId, job: ctx.job, ...r })
  } catch (e) {
    ctx.capabilities.trace({
      workflowId: ctx.workflowId, job: ctx.job, phase: 'fail',
      detail: `PERSISTENCE FAILED: ${e instanceof Error ? e.message : String(e)}`,
    })
    throw e
  }
}
