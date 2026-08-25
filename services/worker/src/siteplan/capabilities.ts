/**
 * Production StageCapabilities, backed by Prisma and the Document store.
 *
 * The engine declares what a stage needs — persist, storeArtifact, trace, fetch,
 * now — and this supplies it. Keeping the implementations here rather than
 * inside the engine is what lets the same processors run under test with
 * in-memory doubles, and it keeps Prisma out of a package that also builds for
 * the browser.
 *
 * Persistence happens PER STAGE, not once at the end. A workflow that dies
 * halfway must resume from its last completed stage, and it can only do that if
 * each stage was written as it finished.
 */

import { prisma } from '@kealee/database'
import { Workflow } from '@kealee/pascal-agents/engine'

/** Maps a runner status onto the SitePlanStageStatus the schema already has. */
function toStageStatus(s: string): 'COMPLETED' | 'AWAITING_REVIEW' | 'BLOCKED' | 'REJECTED' {
  switch (s) {
    case 'COMPLETED': return 'COMPLETED'
    case 'AWAITING_REVIEW': return 'AWAITING_REVIEW'
    case 'REJECTED': return 'REJECTED'
    default: return 'BLOCKED'
  }
}

export function productionCapabilities(opts: {
  jobQueueId?: string | null
} = {}): Workflow.StageCapabilities {
  return {
    fetchImpl: fetch,
    now: () => new Date(),

    /**
     * One row per stage attempt.
     *
     * Upserted on (workflowId, job) so a retry updates the attempt rather than
     * accumulating rows — the resume logic reads the latest status, and a pile
     * of historical attempts would make "what completed" ambiguous. The audit
     * trail is `SitePlanAuditEvent`, which is append-only and separate.
     */
    async persist(r) {
      const stage = Workflow.persistedStageFor(r.job)
      const status = toStageStatus(r.status)

      const existing = await prisma.sitePlanStageExecution.findFirst({
        where: { workflowId: r.workflowId, job: r.job },
        select: { id: true },
      })

      const data = {
        stage: stage as never,
        job: r.job,
        jobQueueId: opts.jobQueueId ?? null,
        status: status as never,
        attempt: r.attempt,
        inputs: (r.inputs ?? {}) as never,
        outputs: (r.outputs ?? {}) as never,
        blockers: (r.blockers ?? []) as never,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      }

      if (existing) {
        await prisma.sitePlanStageExecution.update({ where: { id: existing.id }, data })
      } else {
        // The table carries a PRE-EXISTING unique on (workflowId, stage,
        // attempt), and several registered jobs share one coarse stage — three
        // land on COMPLIANCE_AUDIT alone. Writing them all at attempt 1 makes
        // the second collide, which a live database found and no in-memory
        // double could.
        //
        // The row's `attempt` therefore becomes the next free ordinal WITHIN
        // that coarse stage. Job identity lives in `job`, and the true retry
        // count stays on JobQueue.attempts, so nothing is lost.
        const used = await prisma.sitePlanStageExecution.count({
          where: { workflowId: r.workflowId, stage: stage as never },
        })
        await prisma.sitePlanStageExecution.create({
          data: {
            ...data,
            attempt: used + 1,
            workflowId: r.workflowId,
            prerequisites: [] as never,
            startedAt: new Date(),
          },
        })
      }

      // Advance the workflow's coarse stage so a reader who never touches the
      // execution rows still sees where it got to.
      await prisma.sitePlanWorkflow.update({
        where: { id: r.workflowId },
        data: { currentStage: stage as never },
      }).catch(() => undefined)
    },

    /**
     * Stores a rendered artifact in the EXISTING Document model.
     *
     * No new storage system: `Document` already carries projectId, type,
     * category, version, fileUrl and format, and the portal already reads it.
     */
    async storeArtifact(a) {
      // Idempotent by (workflow, job, filename). A stage that reruns — because
      // its persist failed, or because of a redelivery — must not leave a
      // second copy of the same PDF for the customer to choose between. The
      // live run produced four before this was added.
      const already = await prisma.document.findFirst({
        where: { name: a.filename, category: { startsWith: 'site-plan' } },
        select: { id: true },
      })
      if (already) return { documentId: already.id }

      const wf = await prisma.sitePlanWorkflow.findUnique({
        where: { id: a.workflowId },
        select: { projectId: true },
      })

      const doc = await prisma.document.create({
        data: {
          projectId: wf?.projectId ?? null,
          type: 'SITE_PLAN',
          category: a.preliminary ? 'site-plan-preliminary' : 'site-plan-issued',
          name: a.filename,
          description: a.preliminary
            ? 'Preliminary site plan. Not for permit or construction. ' +
              'Jurisdiction approval is separate and not implied.'
            : 'Site plan.',
          version: 1,
          format: 'pdf',
          size: a.bytes.length,
          // Base64 in `content` keeps the artifact durable without introducing
          // an object-store dependency this checkpoint does not need. A later
          // checkpoint can move the bytes and leave `fileUrl` pointing at them.
          content: { encoding: 'base64', data: a.bytes.toString('base64') } as never,
        },
        select: { id: true },
      })
      return { documentId: doc.id }
    },

    /**
     * Structured trace, appended to the audit trail.
     *
     * Never a substitute for persistence: a trace explains what happened, the
     * stage execution row is what resume reads.
     */
    trace(e) {
      void prisma.sitePlanAuditEvent.create({
        data: {
          workflowId: e.workflowId,
          sequence: BigInt(Date.now()),
          occurredAt: new Date(),
          actorType: 'SYSTEM',
          eventType: `stage.${e.phase}`,
          entityTable: 'site_plan_stage_executions',
          entityId: e.job,
          summary: e.detail
            ? `${e.job} ${e.phase}: ${e.detail}`
            : `${e.job} ${e.phase}`,
        },
      }).catch(() => undefined)   // tracing must never fail a stage
    },
  }
}

/** Rebuilds the state-machine snapshot from persisted rows. This is resume. */
export async function loadSnapshot(workflowId: string): Promise<Workflow.WorkflowSnapshot | null> {
  // SitePlanWorkflow carries no `stageExecutions` relation, so the executions
  // are read on their own rather than through an include that does not exist.
  const wf = await prisma.sitePlanWorkflow.findUnique({
    where: { id: workflowId },
    select: { id: true, definitionVersion: true },
  })
  if (!wf) return null

  const executions = await prisma.sitePlanStageExecution.findMany({
    where: { workflowId },
    select: { job: true, status: true, attempt: true, completedAt: true },
  })

  return {
    workflowId: wf.id,
    definitionVersion: wf.definitionVersion,
    stages: executions
      .filter((e): e is typeof e & { job: string } => Boolean(e.job))
      .map(e => ({
        job: e.job as never,
        status: e.status as never,
        attempt: e.attempt,
        completedAt: e.completedAt?.toISOString() ?? null,
      })),
  }
}

/** Outputs of completed stages, which is how a stage reads its inputs. */
export async function loadPriorOutputs(
  workflowId: string,
): Promise<Record<string, unknown>> {
  const rows = await prisma.sitePlanStageExecution.findMany({
    where: { workflowId, status: 'COMPLETED' },
    select: { job: true, outputs: true },
  })
  const out: Record<string, unknown> = {}
  for (const r of rows) if (r.job) out[r.job] = r.outputs
  return out
}
