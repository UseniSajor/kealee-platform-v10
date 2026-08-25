/**
 * The executable state machine.
 *
 * Not a prompt, not documentation — code the workers call. A job that runs
 * without passing `assertCanRun` is a bug, and the synchronisation test exists
 * to keep that honest.
 *
 * Two properties matter more than anything else here:
 *
 *   RESUME. A workflow that fails at stage 9 of 13 must restart at 9, not at 1.
 *   Stage results are persisted, so `nextJobs()` is derived from what has
 *   COMPLETED rather than from a cursor that a crash could leave stale.
 *
 *   IDEMPOTENCE. A duplicate webhook or a BullMQ redelivery must not produce a
 *   second workflow, a second sheet or a second artifact. `alreadySatisfied`
 *   answers that before any work is done.
 */

import {
  SITE_PLAN_STAGES, SITE_PLAN_WORKFLOW_VERSION, FIRST_JOB,
  stageFor, isRegisteredJob,
  type SitePlanJobName, type StageDefinition, type PersistedStageCode,
} from './definition'

/** Mirrors `SitePlanStageStatus` in Prisma. */
export type StageStatus =
  | 'NOT_STARTED' | 'READY' | 'IN_PROGRESS' | 'BLOCKED'
  | 'AWAITING_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED'

/** Terminal for the purpose of dependency satisfaction. */
const SATISFYING: ReadonlySet<StageStatus> = new Set<StageStatus>(['COMPLETED', 'APPROVED'])

export interface StageRecord {
  job: SitePlanJobName
  status: StageStatus
  attempt: number
  completedAt?: string | null
}

export interface WorkflowSnapshot {
  workflowId: string
  /** The definition version this instance was started under. */
  definitionVersion: number
  stages: StageRecord[]
}

export class WorkflowTransitionError extends Error {
  constructor(
    readonly code:
      | 'UNREGISTERED_JOB'
      | 'VERSION_MISMATCH'
      | 'PREREQUISITE_INCOMPLETE'
      | 'ALREADY_RUNNING'
      | 'ALREADY_COMPLETED'
      | 'STAGE_REJECTED',
    message: string,
  ) {
    super(message)
    this.name = 'WorkflowTransitionError'
  }
}

function recordFor(snap: WorkflowSnapshot, job: SitePlanJobName): StageRecord | undefined {
  return snap.stages.find(s => s.job === job)
}

export function statusOf(snap: WorkflowSnapshot, job: SitePlanJobName): StageStatus {
  return recordFor(snap, job)?.status ?? 'NOT_STARTED'
}

/** Whether this job's work is already done and must not be repeated. */
export function alreadySatisfied(snap: WorkflowSnapshot, job: SitePlanJobName): boolean {
  return SATISFYING.has(statusOf(snap, job))
}

/** Unmet prerequisites, in definition order. */
export function unmetPrerequisites(
  snap: WorkflowSnapshot, job: SitePlanJobName,
): SitePlanJobName[] {
  return stageFor(job).requires.filter(r => !SATISFYING.has(statusOf(snap, r)))
}

/**
 * The transition guard. Every worker calls this FIRST.
 *
 * Throws rather than returning false, because a worker that ignores a boolean
 * is the failure mode this is meant to prevent.
 */
export function assertCanRun(snap: WorkflowSnapshot, job: string): StageDefinition {
  if (!isRegisteredJob(job)) {
    throw new WorkflowTransitionError('UNREGISTERED_JOB',
      `"${job}" is not a registered site-plan job. Add it to SITE_PLAN_STAGES; ` +
      'a worker may not invent a stage.')
  }
  if (snap.definitionVersion !== SITE_PLAN_WORKFLOW_VERSION) {
    throw new WorkflowTransitionError('VERSION_MISMATCH',
      `Workflow ${snap.workflowId} was started under definition version ` +
      `${snap.definitionVersion}; this worker is version ${SITE_PLAN_WORKFLOW_VERSION}. ` +
      'Finish or migrate the instance rather than mixing versions.')
  }

  const status = statusOf(snap, job)
  if (status === 'IN_PROGRESS') {
    throw new WorkflowTransitionError('ALREADY_RUNNING',
      `${job} is already IN_PROGRESS on workflow ${snap.workflowId}.`)
  }
  if (SATISFYING.has(status)) {
    throw new WorkflowTransitionError('ALREADY_COMPLETED',
      `${job} has already completed on workflow ${snap.workflowId}. ` +
      'Return the persisted result rather than recomputing.')
  }
  if (status === 'REJECTED') {
    throw new WorkflowTransitionError('STAGE_REJECTED',
      `${job} was REJECTED on workflow ${snap.workflowId} and needs an explicit reopen.`)
  }

  const unmet = unmetPrerequisites(snap, job)
  if (unmet.length) {
    throw new WorkflowTransitionError('PREREQUISITE_INCOMPLETE',
      `${job} requires ${unmet.join(', ')} to complete first.`)
  }
  return stageFor(job)
}

/** Non-throwing form, for planning rather than enforcement. */
export function canRun(snap: WorkflowSnapshot, job: string): boolean {
  try { assertCanRun(snap, job); return true } catch { return false }
}

/**
 * Every job that may be enqueued right now.
 *
 * This is the resume mechanism: derived from persisted stage records, so an
 * interrupted workflow picks up exactly where it stopped.
 */
export function nextJobs(
  snap: WorkflowSnapshot, opts: { firstReleaseOnly?: boolean } = {},
): SitePlanJobName[] {
  const pool = opts.firstReleaseOnly
    ? SITE_PLAN_STAGES.filter(s => s.inFirstRelease)
    : SITE_PLAN_STAGES
  return pool.filter(s => canRun(snap, s.job)).map(s => s.job)
}

/** The stage code to write for a job. */
export function persistedStageFor(job: SitePlanJobName): PersistedStageCode {
  return stageFor(job).persistAs
}

/**
 * The workflow's current persisted stage: the code of the furthest job that has
 * completed, or the first stage's code when nothing has.
 */
export function currentStage(snap: WorkflowSnapshot): PersistedStageCode {
  let code = stageFor(FIRST_JOB).persistAs
  for (const s of SITE_PLAN_STAGES) {
    if (SATISFYING.has(statusOf(snap, s.job))) code = s.persistAs
  }
  return code
}

export interface WorkflowProgress {
  total: number
  completed: number
  /** True once a customer-visible package exists. */
  hasDeliverable: boolean
  /** Jobs runnable now. Empty with completed < total means BLOCKED. */
  runnable: SitePlanJobName[]
  blocked: boolean
}

export function progress(
  snap: WorkflowSnapshot, opts: { firstReleaseOnly?: boolean } = {},
): WorkflowProgress {
  const pool = opts.firstReleaseOnly
    ? SITE_PLAN_STAGES.filter(s => s.inFirstRelease)
    : SITE_PLAN_STAGES
  const completed = pool.filter(s => SATISFYING.has(statusOf(snap, s.job)))
  const runnable = nextJobs(snap, opts)
  return {
    total: pool.length,
    completed: completed.length,
    hasDeliverable: completed.some(s => s.deliverable === true),
    runnable,
    blocked: runnable.length === 0 && completed.length < pool.length,
  }
}

/** A fresh instance, before any stage has run. */
export function newWorkflow(workflowId: string): WorkflowSnapshot {
  return { workflowId, definitionVersion: SITE_PLAN_WORKFLOW_VERSION, stages: [] }
}
