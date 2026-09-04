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

  const org = await prisma.org.findFirst({
    orderBy: { createdAt: 'asc' }, select: { id: true },
  })
  if (!org) return null

  cachedOrgId = org.id
  console.warn(
    '[site-plan-workflow] SITE_PLAN_ORG_ID is not set; defaulting to the oldest Org ' +
    `(${org.id}). Set it explicitly before this deployment serves more than one tenant.`,
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
      formData: input.formData ?? {},
    },
    ports: input.ports ?? productionPorts(),
    eligible: input.isSitePlan,
  })

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
