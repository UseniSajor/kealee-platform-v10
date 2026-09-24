/**
 * The production seam: a paid Site Plan order activates the engine.
 *
 * Before this file, `apps/web-main/lib/site-plan-rules.ts` was the ONLY thing
 * outside `@kealee/pascal-agents` that imported the engine, and it used exactly
 * two namespaces. Everything that draws — GIS, twin, envelope, composition,
 * render, QC, persistence — had no caller. This connects the order to the
 * durable workflow that runs them.
 *
 * What this file does NOT do is run the engine. It creates or resumes a
 * workflow row, enqueues the first permitted job, and returns. The civil engine
 * does not belong inside a Stripe webhook.
 */

import { prisma } from '@kealee/database'
import { Workflow } from '@kealee/pascal-agents/engine'

/** Mirrors `SitePlanStageStatus`, narrowed to what the state machine reads. */
type StageStatus = Parameters<typeof Workflow.nextJobs>[0]['stages'][number]['status']

/**
 * Ports backed by Prisma and the site-plan queue.
 *
 * `enqueue` writes to `JobQueue` rather than reaching for BullMQ directly. The
 * webhook process is a web server, not a worker: recording the intent durably
 * and letting the worker service drain it means a Redis outage delays the plan
 * instead of losing a paid order.
 */
function productionPorts(): Workflow.ActivationPorts {
  return {
    async findWorkflowByIdempotencyKey(key) {
      const wf = await prisma.sitePlanWorkflow.findUnique({
        where: { idempotencyKey: key },
        select: { id: true, definitionVersion: true },
      })
      if (!wf) return null

      // Two queries, not a nested select. `SitePlanWorkflow` and
      // `SitePlanStageExecution` are joined by a plain `workflowId` column with
      // no Prisma relation declared on either side, so `stageExecutions` is not
      // a field the client has ever had — this file has never compiled, which
      // is why web-main last deployed on 21 August.
      const executions = await prisma.sitePlanStageExecution.findMany({
        where: { workflowId: wf.id },
        select: { job: true, status: true, attempt: true, completedAt: true },
      })

      return {
        workflowId: wf.id,
        definitionVersion: wf.definitionVersion,
        // The state machine sequences on the detailed job name, so a row
        // without one tells it nothing and is dropped. `job` must be SELECTED
        // for that to work: the previous version read it off an object that
        // never contained it, so every workflow resumed as though no stage had
        // ever completed.
        stages: executions.flatMap(e =>
          e.job
            ? [{ job: e.job as never, status: e.status as StageStatus, attempt: e.attempt,
                 completedAt: e.completedAt?.toISOString() ?? null }]
            : []),
      }
    },

    async createWorkflow(input) {
      const wf = await prisma.sitePlanWorkflow.create({
        data: {
          idempotencyKey: input.idempotencyKey,
          definitionVersion: input.definitionVersion,
          organizationId: input.organizationId,
          projectId: input.projectId,
          orderId: input.orderId,
          productId: input.productId,
          currentStage: input.currentStage as never,
          status: 'ACTIVE',
          version: 1,
          professionalReviewRequired: true,
          // The worker reads stage formData straight off this column.
          metadata: input.formData as never,
        },
        select: { id: true },
      })
      return { workflowId: wf.id }
    },

    async enqueue(input) {
      // `jobId` carries the idempotency key, so a duplicate delivery collides
      // on the unique constraint instead of queueing the same stage twice.
      await prisma.jobQueue.upsert({
        where: { queueName_jobId: { queueName: input.queue, jobId: input.jobKey } },
        create: {
          queueName: input.queue,
          jobId: input.jobKey,
          jobName: input.job,
          status: 'WAITING',
          priority: 0,
          attempts: 0,
          maxAttempts: input.maxAttempts,
          data: {
            workflowId: input.workflowId,
            job: input.job,
            payloadVersion: input.payloadVersion,
            backoffMs: input.backoffMs,
          },
        },
        update: {},   // redelivery is a no-op
      })
      // A FAILED row is terminal, and the upsert above leaves it that way —
      // so a resume after a failed stage silently enqueued nothing. An
      // explicit activation is the one place a failed job is put back to
      // WAITING. WAITING and ACTIVE rows are untouched: no double-run.
      await prisma.jobQueue.updateMany({
        where: { queueName: input.queue, jobId: input.jobKey, status: 'FAILED' },
        data: { status: 'WAITING', error: null, completedAt: null, processedAt: null },
      })
    },
  }
}

/**
 * Which organization owns a public-intake workflow.
 *
 * The public intake flow is org-less: it writes to Supabase
 * `public_intake_leads`, not to a Prisma `Org`, so a paid order arrives with no
 * organization in scope. `SitePlanWorkflow.organizationId` is required, so one
 * must be resolved here rather than invented at the call site.
 *
 * SITE_PLAN_ORG_ID is the explicit answer. Without it we fall back to the
 * oldest Org, which is correct for a single-tenant deployment and wrong the
 * moment there are two — so the fallback logs loudly rather than passing
 * silently. Closing this properly means carrying an organization through
 * intake, which is a change to the intake flow, not to this file.
 */
let cachedOrgId: string | null = null

async function resolveOrganizationId(): Promise<string | null> {
  const fromEnv = process.env.SITE_PLAN_ORG_ID
  if (fromEnv) return fromEnv
  if (cachedOrgId) return cachedOrgId

  // The oldest-Org fallback was safe while exactly one Org existed. It is not
  // safe now: an Org IS the tenant, so once a white-label Org exists this
  // would hand a HOMEOWNER order to a white-label tenant, or the reverse —
  // silently, and with the order's whole audit trail attributed to the wrong
  // business. The comment that used to sit here said "set it explicitly before
  // this deployment serves more than one tenant"; this enforces it instead of
  // asking.
  const orgs = await prisma.org.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, tenantKind: true },
    take: 2,
  })
  if (orgs.length === 0) return null

  const homeowner = orgs.filter(o => o.tenantKind === 'KEALEE_DIRECT')

  if (orgs.length > 1 || homeowner.length !== 1) {
    // More than one Org, or none unambiguously the homeowner business. Guessing
    // here is how a customer's plan ends up in someone else's tenant.
    throw new Error(
      'SITE_PLAN_ORG_ID is not set and the owning organization cannot be inferred: ' +
      `${orgs.length} organizations exist. An Org is a TENANT, so picking one by age ` +
      'could attribute a homeowner order to a white-label client. Set SITE_PLAN_ORG_ID ' +
      'to the KEALEE_DIRECT org id.',
    )
  }

  cachedOrgId = homeowner[0].id
  console.warn(
    '[site-plan-workflow] SITE_PLAN_ORG_ID is not set; using the single KEALEE_DIRECT Org ' +
    `(${cachedOrgId}). Set it explicitly — this fallback stops working the moment a ` +
    'second organization exists.',
  )
  return cachedOrgId
}

export interface SitePlanActivation {
  disposition: Workflow.ActivationDisposition
  workflowId: string | null
  enqueued: string[]
  summary: string
}

/**
 * Activate the site-plan workflow for a paid order.
 *
 * Never throws — the order is already paid, and an exception here would leave
 * Stripe retrying a completed payment. A failure returns `FAILED` with the
 * reason so the caller can route to the manual queue.
 */
export async function activateSitePlanForOrder(input: {
  /** Omit to resolve from SITE_PLAN_ORG_ID or the oldest Org. */
  organizationId?: string
  projectId: string
  orderId: string
  productId?: string | null
  isSitePlan: boolean
  /** Intake form data. The stages cannot resolve a property without it. */
  formData?: Record<string, unknown>
  /**
   * The order's `project_address` column. The intake form writes the address
   * there and NOT into form_data, so a workflow given form_data alone had no
   * address and blocked at resolve_property. Merged in as `address` unless
   * form_data already carries one.
   */
  projectAddress?: string | null
  ports?: Workflow.ActivationPorts
}): Promise<SitePlanActivation> {
  const organizationId = input.organizationId ?? (await resolveOrganizationId().catch(() => null))
  if (input.isSitePlan && !organizationId) {
    return {
      disposition: 'FAILED', workflowId: null, enqueued: [],
      summary:
        'No organization could be resolved for the site-plan workflow. Set SITE_PLAN_ORG_ID. ' +
        'The order is paid and unaffected; route to the manual queue.',
    }
  }

  const outcome = await Workflow.activateSitePlanWorkflow({
    subject: {
      organizationId: organizationId ?? '',
      projectId: input.projectId,
      orderId: input.orderId,
      productId: input.productId ?? null,
      formData: {
        ...(input.formData ?? {}),
        // Always retain the canonical column value under a dedicated key.
        // Older clients sometimes stored a street-only `address` in formData;
        // that value must not hide the complete paid-order address.
        ...(input.projectAddress ? { projectAddress: input.projectAddress } : {}),
        ...(input.projectAddress && !(input.formData?.address)
          ? { address: input.projectAddress }
          : {}),
      },
    },
    ports: input.ports ?? productionPorts(),
    eligible: input.isSitePlan,
  })

  // A RESUMED workflow keeps the metadata it was created with. The worker
  // reads its formData from that column, so a workflow created before the
  // address was carried through would resume without one and block again
  // at resolve_property. Back-fill it — only when absent, never overwrite.
  if (outcome.disposition === 'RESUMED' && outcome.workflowId && input.projectAddress && !input.ports) {
    try {
      const wf = await prisma.sitePlanWorkflow.findUnique({
        where: { id: outcome.workflowId }, select: { metadata: true },
      })
      const meta = (wf?.metadata as Record<string, unknown> | null) ?? {}
      if (!meta.projectAddress || !meta.address) {
        await prisma.sitePlanWorkflow.update({
          where: { id: outcome.workflowId },
          data: {
            metadata: {
              ...meta,
              projectAddress: meta.projectAddress ?? input.projectAddress,
              address: meta.address ?? input.projectAddress,
            } as never,
          },
        })
      }
    } catch (e) {
      console.warn('[site-plan-workflow] could not back-fill address on resume:', outcome.workflowId, e instanceof Error ? e.message : e)
    }
  }

  return {
    disposition: outcome.disposition,
    workflowId: outcome.workflowId,
    enqueued: outcome.enqueued,
    summary: outcome.error ? `${outcome.summary} (${outcome.error})` : outcome.summary,
  }
}

/** Recorded on the order so ops can see what happened without a query. */
export function sitePlanWorkflowFormData(a: SitePlanActivation): Record<string, unknown> {
  return {
    sitePlanWorkflowId: a.workflowId,
    sitePlanWorkflowDisposition: a.disposition,
    sitePlanWorkflowEnqueued: a.enqueued,
    sitePlanWorkflowSummary: a.summary,
  }
}

/**
 * Re-runs `siteplan.route_review` after a professional acts.
 *
 * The stage ends AWAITING_REVIEW while the plan is with the professional; it
 * cannot know when they decide unless something re-enqueues it. The engineer
 * review actions call this after `completeReview` and after any withheld
 * approval. The worker then re-reads the assignment and moves the workflow —
 * and the order — on.
 *
 * Its own idempotency key per re-run: the first run's JobQueue row is
 * terminal, and an upsert against it would be a silent no-op.
 *
 * Never throws — the professional's decision is already recorded under their
 * own identity, and a queue hiccup must not surface as a failed review.
 */
export async function reopenSitePlanReview(
  workflowId: string,
): Promise<{ enqueued: boolean; jobKey: string | null; error?: string }> {
  return enqueueSitePlanStage(workflowId, 'siteplan.route_review')
}

/**
 * Stages a person may re-run from the admin side, and why:
 *
 *   compose_sheets   — after revising inputs for engineer redlines or county
 *                      comments; the reopened chain resumes here
 *   route_review     — re-read the professional's decision
 *   ingest_comments  — staff have entered the County's comment letter
 *   run_issuance_qc  — evidence was attached; re-evaluate the gate
 *
 * Everything else is derived by the runner, and letting a person enqueue an
 * arbitrary stage would be a way around the guard.
 */
export const STAFF_RUNNABLE_STAGES = [
  'siteplan.compose_sheets',
  'siteplan.route_review',
  'siteplan.ingest_comments',
  'siteplan.run_issuance_qc',
] as const
export type StaffRunnableStage = (typeof STAFF_RUNNABLE_STAGES)[number]

export function isStaffRunnableStage(job: string): job is StaffRunnableStage {
  return (STAFF_RUNNABLE_STAGES as readonly string[]).includes(job)
}

/**
 * Enqueues one stage under its own idempotency key. The worker's guard still
 * decides whether it may run — a stage whose prerequisites are unmet is
 * rejected there, not silently skipped here.
 */
export async function enqueueSitePlanStage(
  workflowId: string,
  job: Workflow.SitePlanJobName,
): Promise<{ enqueued: boolean; jobKey: string | null; error?: string }> {
  try {
    const w = Workflow.workerFor(job)
    const prefix = Workflow.jobIdempotencyKey({ workflowId, job })
    const priorRuns = await prisma.jobQueue.count({
      where: { queueName: w.queue, jobId: { startsWith: prefix } },
    })
    const jobKey = Workflow.jobIdempotencyKey({ workflowId, job, attemptOf: priorRuns + 1 })
    await prisma.jobQueue.upsert({
      where: { queueName_jobId: { queueName: w.queue, jobId: jobKey } },
      create: {
        queueName: w.queue, jobId: jobKey, jobName: job, status: 'WAITING',
        priority: 0, attempts: 0, maxAttempts: w.maxAttempts,
        data: {
          workflowId, job,
          payloadVersion: Workflow.SITE_PLAN_WORKFLOW_VERSION,
          backoffMs: w.backoffMs,
        },
      },
      update: {},
    })
    return { enqueued: true, jobKey }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    console.error('[site-plan-workflow] could not enqueue', job, 'on', workflowId, error)
    return { enqueued: false, jobKey: null, error }
  }
}
