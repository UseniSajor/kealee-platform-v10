/**
 * Order to workflow to queue — the production entry point.
 *
 * ── The constraint that shapes this file ───────────────────────────────────
 *
 * This runs inside a Stripe webhook, on an order that has ALREADY been paid
 * for. Two consequences:
 *
 *   It must return fast. The civil engine does not belong in a web request —
 *   this creates or resumes the workflow, enqueues the first permitted job, and
 *   returns. Workers do the durable work asynchronously.
 *
 *   It must not throw. An exception leaves Stripe retrying a completed payment
 *   with no plan produced. Every failure path returns an outcome describing
 *   what happened, and the caller decides.
 *
 * ── Idempotency ───────────────────────────────────────────────────────────
 *
 * Duplicate webhook delivery is normal, not exceptional. The key is derived
 * from the order and the definition version, so a redelivery resolves to the
 * existing workflow and enqueues nothing new, while a genuine re-run under a
 * new definition version gets its own instance.
 */

import {
  SITE_PLAN_WORKFLOW_VERSION, FIRST_JOB, type SitePlanJobName,
} from './definition'
import {
  nextJobs, progress, currentStage, type WorkflowSnapshot, type StageRecord,
} from './state-machine'
import { workflowIdempotencyKey, jobIdempotencyKey, workerFor } from './registry'

export interface ActivationSubject {
  organizationId: string
  projectId: string
  orderId: string
  productId?: string | null
  formData?: Record<string, unknown>
}

/** An existing workflow row, as the store returns it. */
export interface ExistingWorkflow {
  workflowId: string
  definitionVersion: number
  stages: StageRecord[]
}

/**
 * Persistence and queue, injected.
 *
 * The entry point does not import Prisma or BullMQ. That keeps this module
 * server-safe and unit-testable, and it is what lets the diagnostic script call
 * the same production path with in-memory doubles instead of carrying its own
 * business logic.
 */
export interface ActivationPorts {
  findWorkflowByIdempotencyKey: (key: string) => Promise<ExistingWorkflow | null>
  createWorkflow: (input: {
    idempotencyKey: string
    definitionVersion: number
    organizationId: string
    projectId: string
    orderId: string
    productId: string | null
    currentStage: string
  }) => Promise<{ workflowId: string }>
  enqueue: (input: {
    queue: string
    job: SitePlanJobName
    jobKey: string
    workflowId: string
    payloadVersion: number
    maxAttempts: number
    backoffMs: number
  }) => Promise<void>
}

export type ActivationDisposition =
  | 'CREATED'            // new workflow, first job enqueued
  | 'RESUMED'            // existing workflow, next permitted job enqueued
  | 'ALREADY_COMPLETE'   // nothing left to run
  | 'DUPLICATE'          // redelivery; work already in flight
  | 'VERSION_MISMATCH'   // instance predates this definition
  | 'NOT_ELIGIBLE'       // not a site-plan order
  | 'FAILED'             // ports threw; recorded, never rethrown

export interface ActivationOutcome {
  disposition: ActivationDisposition
  workflowId: string | null
  definitionVersion: number
  enqueued: SitePlanJobName[]
  /** Plain-language explanation, safe to log or show ops. */
  summary: string
  error?: string
}

/**
 * Creates or resumes the workflow for a paid site-plan order.
 *
 * `eligible` is the caller's decision — this module does not re-derive whether
 * the product is a site plan, because `isSitePlanOrder` already owns that and
 * two sources of that truth would drift.
 */
export async function activateSitePlanWorkflow(input: {
  subject: ActivationSubject
  ports: ActivationPorts
  eligible: boolean
  /** Restrict to the first-release slice. */
  firstReleaseOnly?: boolean
}): Promise<ActivationOutcome> {
  const { subject, ports, eligible } = input
  const firstReleaseOnly = input.firstReleaseOnly ?? true
  const definitionVersion = SITE_PLAN_WORKFLOW_VERSION

  if (!eligible) {
    return {
      disposition: 'NOT_ELIGIBLE', workflowId: null, definitionVersion, enqueued: [],
      summary: 'Not a Site Plan product; no workflow created.',
    }
  }

  const key = workflowIdempotencyKey({ orderId: subject.orderId, definitionVersion })

  try {
    const existing = await ports.findWorkflowByIdempotencyKey(key)

    if (existing) {
      if (existing.definitionVersion !== definitionVersion) {
        return {
          disposition: 'VERSION_MISMATCH', workflowId: existing.workflowId,
          definitionVersion, enqueued: [],
          summary:
            `Workflow ${existing.workflowId} was started under definition version ` +
            `${existing.definitionVersion}; this build is version ${definitionVersion}. ` +
            'Finish or migrate that instance rather than mixing versions.',
        }
      }

      const snap: WorkflowSnapshot = {
        workflowId: existing.workflowId,
        definitionVersion: existing.definitionVersion,
        stages: existing.stages,
      }
      const p = progress(snap, { firstReleaseOnly })
      if (p.completed >= p.total) {
        return {
          disposition: 'ALREADY_COMPLETE', workflowId: existing.workflowId,
          definitionVersion, enqueued: [],
          summary: `Workflow ${existing.workflowId} has completed all ${p.total} stages.`,
        }
      }

      const runnable = nextJobs(snap, { firstReleaseOnly })
      if (runnable.length === 0) {
        return {
          disposition: 'DUPLICATE', workflowId: existing.workflowId,
          definitionVersion, enqueued: [],
          summary:
            `Workflow ${existing.workflowId} has no runnable stage — work is already in ` +
            'flight or blocked. Duplicate delivery enqueued nothing.',
        }
      }

      const enqueued = await enqueueAll(ports, existing.workflowId, runnable, definitionVersion)
      return {
        disposition: 'RESUMED', workflowId: existing.workflowId, definitionVersion, enqueued,
        summary:
          `Resumed workflow ${existing.workflowId} at ${p.completed}/${p.total} stages; ` +
          `enqueued ${enqueued.join(', ')}.`,
      }
    }

    const created = await ports.createWorkflow({
      idempotencyKey: key,
      definitionVersion,
      organizationId: subject.organizationId,
      projectId: subject.projectId,
      orderId: subject.orderId,
      productId: subject.productId ?? null,
      currentStage: currentStage({ workflowId: '', definitionVersion, stages: [] }),
    })

    const enqueued = await enqueueAll(ports, created.workflowId, [FIRST_JOB], definitionVersion)
    return {
      disposition: 'CREATED', workflowId: created.workflowId, definitionVersion, enqueued,
      summary: `Created workflow ${created.workflowId} and enqueued ${FIRST_JOB}.`,
    }
  } catch (e) {
    // A paid order must not be lost to an exception. Record and return.
    return {
      disposition: 'FAILED', workflowId: null, definitionVersion, enqueued: [],
      summary:
        'Site-plan workflow activation failed. The order is paid and unaffected; ' +
        'route to the manual queue and investigate.',
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

async function enqueueAll(
  ports: ActivationPorts, workflowId: string,
  jobs: SitePlanJobName[], payloadVersion: number,
): Promise<SitePlanJobName[]> {
  const done: SitePlanJobName[] = []
  for (const job of jobs) {
    const w = workerFor(job)
    await ports.enqueue({
      queue: w.queue,
      job,
      jobKey: jobIdempotencyKey({ workflowId, job }),
      workflowId,
      payloadVersion,
      maxAttempts: w.maxAttempts,
      backoffMs: w.backoffMs,
    })
    done.push(job)
  }
  return done
}
