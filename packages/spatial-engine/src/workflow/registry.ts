/**
 * Who runs each stage, and on which queue.
 *
 * Two registries, deliberately separate:
 *
 *   AGENTS decide and produce content. Some are software; some are licensed
 *   humans. The distinction is load-bearing — an agent marked `human` with a
 *   licence requirement can never be satisfied by a worker, and the guard uses
 *   that to stop a machine from marking a professional approval.
 *
 *   WORKERS execute. Every registered job maps to exactly one queue and one
 *   processor, using the queue infrastructure that already exists rather than
 *   one queue per job.
 */

import { SITE_PLAN_STAGES, type SitePlanJobName } from './definition'

export type AgentKind = 'software' | 'human'

export interface AgentDefinition {
  id: string
  kind: AgentKind
  title: string
  /** Licence a human agent must hold. Null for software. */
  licence: string | null
  /** Stages this agent is authorised to complete. */
  stages: SitePlanJobName[]
  /**
   * Whether this agent may record a professional approval. Only ever true for
   * a licensed human — no worker may mark professional or jurisdiction
   * approval, and this is where that is enforced rather than assumed.
   */
  mayApprove: boolean
}

export const SITE_PLAN_AGENTS: AgentDefinition[] = [
  {
    id: 'siteplan.drafter', kind: 'software', title: 'Kealee site-plan drafter', licence: null,
    stages: [
      'siteplan.initialize', 'siteplan.resolve_property', 'siteplan.ingest_documents',
      'siteplan.resolve_jurisdiction', 'siteplan.evaluate_rules',
      'siteplan.build_existing_conditions', 'siteplan.generate_envelope',
      'siteplan.generate_layout', 'siteplan.compose_sheets', 'siteplan.render_exports',
      'siteplan.run_draft_qc', 'siteplan.persist_package', 'siteplan.deliver_preliminary',
      'siteplan.ingest_survey', 'siteplan.reconcile_survey', 'siteplan.generate_grading',
      'siteplan.generate_drainage', 'siteplan.generate_swm', 'siteplan.generate_utilities',
      'siteplan.generate_environmental', 'siteplan.route_review', 'siteplan.apply_revisions',
      'siteplan.run_issuance_qc', 'siteplan.build_submission', 'siteplan.ingest_comments',
    ],
    mayApprove: false,
  },
  {
    id: 'surveyor', kind: 'human', title: 'Maryland Licensed Surveyor',
    licence: 'Maryland Professional Land Surveyor',
    stages: ['siteplan.reconcile_survey', 'siteplan.apply_revisions'], mayApprove: true,
  },
  {
    id: 'professional_engineer', kind: 'human', title: 'Maryland Professional Engineer',
    licence: 'Maryland Professional Engineer',
    stages: ['siteplan.apply_revisions', 'siteplan.run_issuance_qc'], mayApprove: true,
  },
  {
    id: 'landscape_architect', kind: 'human', title: 'Maryland Landscape Architect',
    licence: 'Maryland Landscape Architect',
    stages: ['siteplan.apply_revisions'], mayApprove: true,
  },
]

/** Agents authorised for a stage. */
export function agentsFor(job: SitePlanJobName): AgentDefinition[] {
  return SITE_PLAN_AGENTS.filter(a => a.stages.includes(job))
}

/**
 * Whether a software worker may complete this stage unaided.
 *
 * False means the stage ends AWAITING_REVIEW: the machine prepares the work and
 * a licensed human decides.
 */
export function isMachineCompletable(job: SitePlanJobName): boolean {
  const agents = agentsFor(job)
  return agents.some(a => a.kind === 'software')
}

// ── Workers ─────────────────────────────────────────────────────────────────

/**
 * One queue, typed job names within it.
 *
 * Per-job queues would multiply Redis keys and dashboards for no benefit; the
 * existing architecture already routes by job name.
 */
export const SITE_PLAN_QUEUE = 'siteplan'

export interface WorkerDefinition {
  job: SitePlanJobName
  queue: string
  /** Processor module, relative to the worker service. */
  processor: string
  /** Bounded. A stage that calls a live GIS service gets more attempts. */
  maxAttempts: number
  /** Milliseconds; exponential backoff base. */
  backoffMs: number
  /** Long-running renders need a longer lock. */
  timeoutMs: number
}

const DEFAULT_ATTEMPTS = 3

export const SITE_PLAN_WORKERS: WorkerDefinition[] = SITE_PLAN_STAGES.map(s => ({
  job: s.job,
  queue: SITE_PLAN_QUEUE,
  processor: `siteplan/${s.job.replace('siteplan.', '')}.processor`,
  // A non-deterministic stage depends on a live service, so a retry is often
  // the right answer to a transient failure. A deterministic one that failed
  // will fail again, so retrying it mostly wastes time.
  maxAttempts: s.deterministic ? DEFAULT_ATTEMPTS : 5,
  backoffMs: s.deterministic ? 2_000 : 5_000,
  timeoutMs: s.job === 'siteplan.render_exports' ? 120_000 : 60_000,
}))

const WORKER_BY_JOB = new Map(SITE_PLAN_WORKERS.map(w => [w.job, w]))

export function workerFor(job: SitePlanJobName): WorkerDefinition {
  const w = WORKER_BY_JOB.get(job)
  if (!w) throw new Error(`No worker registered for ${job}`)
  return w
}

/**
 * A stable idempotency key.
 *
 * Duplicate Stripe delivery is normal, not exceptional. Keying on order plus
 * workflow version means a redelivery resolves to the same workflow, while a
 * genuine re-run under a new definition version gets its own.
 */
export function workflowIdempotencyKey(input: {
  orderId: string; definitionVersion: number
}): string {
  return `siteplan:${input.orderId}:v${input.definitionVersion}`
}

/** Per-job key, so a BullMQ redelivery collapses onto one execution. */
export function jobIdempotencyKey(input: {
  workflowId: string; job: SitePlanJobName; attemptOf?: number
}): string {
  const suffix = input.attemptOf ? `:r${input.attemptOf}` : ''
  return `${input.workflowId}:${input.job}${suffix}`
}
