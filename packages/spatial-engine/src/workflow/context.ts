/**
 * The typed execution context every stage receives.
 *
 * One shape, so a processor cannot quietly depend on something the workflow
 * never promised. Everything a stage needs arrives here; everything it produces
 * leaves through `StageResult` and is persisted before the next stage starts.
 */

import type { SitePlanJobName } from './definition'
import type { WorkflowSnapshot } from './state-machine'

/** Identity of the order this workflow serves. */
export interface WorkflowSubject {
  organizationId: string
  projectId: string
  orderId: string
  productId: string | null
  /** Free-form intake payload. Never trusted for jurisdiction. */
  formData: Record<string, unknown>
}

/**
 * Side-effecting capabilities, injected rather than imported.
 *
 * A stage that reaches for `fetch` directly cannot be tested without a network
 * and cannot be replayed. Passing them in is what makes the pilot reproducible
 * and the synchronisation test possible.
 */
export interface StageCapabilities {
  fetchImpl: typeof fetch
  /** Persist a stage result. Called before the next stage is enqueued. */
  persist: (r: PersistedStageOutput) => Promise<void>
  /** Store a rendered artifact and return its document id. */
  storeArtifact: (a: ArtifactInput) => Promise<{ documentId: string }>
  /** Structured trace. Never a substitute for persistence. */
  trace: (event: TraceEvent) => void
  now: () => Date
}

export interface ArtifactInput {
  workflowId: string
  job: SitePlanJobName
  filename: string
  contentType: string
  bytes: Buffer
  /** Preliminary output must be watermarked and labelled as such. */
  preliminary: boolean
}

export interface TraceEvent {
  workflowId: string
  job: SitePlanJobName
  phase: 'start' | 'complete' | 'fail' | 'skip'
  detail?: string
  durationMs?: number
}

export interface PersistedStageOutput {
  workflowId: string
  job: SitePlanJobName
  status: 'COMPLETED' | 'AWAITING_REVIEW' | 'BLOCKED' | 'REJECTED'
  attempt: number
  inputs: unknown
  outputs: unknown
  blockers?: string[]
  /** Twin revision this stage read or produced, for artifact versioning. */
  twinRevision?: number
  /** Certified rule-pack version the stage evaluated against. */
  rulePackVersion?: string
}

export interface StageContext {
  workflowId: string
  job: SitePlanJobName
  attempt: number
  subject: WorkflowSubject
  snapshot: WorkflowSnapshot
  capabilities: StageCapabilities
  /**
   * Outputs of completed prerequisite stages, keyed by job.
   *
   * A stage reads its inputs from here rather than recomputing them. That is
   * what makes resume cheap and what stops a non-deterministic stage — a live
   * GIS call — from returning a different answer on the second run.
   */
  priorOutputs: Partial<Record<SitePlanJobName, unknown>>
}

export interface StageResult {
  status: 'COMPLETED' | 'AWAITING_REVIEW' | 'BLOCKED'
  outputs: unknown
  /** Why the stage cannot proceed. Required when status is BLOCKED. */
  blockers?: string[]
  /** Jobs to enqueue next. Empty lets the runner derive them from the guard. */
  enqueue?: SitePlanJobName[]
  artifacts?: { documentId: string; filename: string }[]
  twinRevision?: number
  rulePackVersion?: string
}

/** A stage processor. Every registered job has exactly one. */
export type StageProcessor = (ctx: StageContext) => Promise<StageResult>

/**
 * Reads a prior stage's output with a type assertion.
 *
 * Throws rather than returning undefined: the guard already proved the
 * prerequisite completed, so a missing output means persistence failed, and
 * that must surface loudly instead of as a downstream null.
 */
export function requirePriorOutput<T>(ctx: StageContext, job: SitePlanJobName): T {
  const v = ctx.priorOutputs[job]
  if (v === undefined) {
    throw new Error(
      `${ctx.job} expected the output of ${job}, which the guard reports as complete. ` +
      'The stage result was not persisted — investigate persistence, do not recompute.')
  }
  return v as T
}
