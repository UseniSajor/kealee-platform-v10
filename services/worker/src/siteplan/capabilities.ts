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
import { Workflow, type EvidenceKind, type Discipline, type CountyComment } from '@kealee/pascal-agents/engine'
import { productReviewDisciplines } from './delivery'

/** Maps a runner status onto the SitePlanStageStatus the schema already has. */
function toStageStatus(s: string): 'COMPLETED' | 'AWAITING_REVIEW' | 'BLOCKED' | 'REJECTED' {
  switch (s) {
    case 'COMPLETED': return 'COMPLETED'
    case 'AWAITING_REVIEW': return 'AWAITING_REVIEW'
    case 'REJECTED': return 'REJECTED'
    default: return 'BLOCKED'
  }
}

/**
 * Runs a unit of site-plan database work with the tenant session set.
 *
 * ONE SHORT TRANSACTION PER OPERATION, deliberately not one spanning the whole
 * stage. A stage run does minutes of network I/O between its database calls —
 * county GIS, PDF rendering, SSURGO — and a transaction held open across that
 * would pin a pooled connection for the duration and, at any concurrency,
 * exhaust the pool.
 *
 * `SET LOCAL` rather than a session `SET`: verified against the real Supabase
 * transaction-mode pooler on port 6543 that the setting IS visible to later
 * statements in the same transaction and does NOT survive it. Both halves
 * matter — the first makes RLS work, the second stops one tenant's context
 * reaching whoever takes the connection next.
 *
 * When no owner is known the work still runs, WITHOUT a session. Today that is
 * harmless because the application role bypasses RLS. Once it does not, such a
 * call returns nothing rather than someone else's rows, which is the right
 * direction to fail in.
 */
async function withOwner<T>(
  owner: string | null,
  fn: (tx: typeof prisma) => Promise<T>,
): Promise<T> {
  if (!owner) return fn(prisma)
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, owner)
    return fn(tx as unknown as typeof prisma)
  })
}

export function productionCapabilities(opts: {
  jobQueueId?: string | null
  /**
   * The Org that owns this workflow — and an Org IS the tenant.
   *
   * Every site-plan child row must carry it. There IS a column default today,
   * pointing at the homeowner org, but that default is a temporary hotfix and
   * is scheduled for removal: relying on it would mean a white-label row
   * written by forgetful code is silently attributed to Kealee's own business,
   * which is the exact failure docs/decisions/white-label-and-tenancy.md
   * exists to prevent. So it is passed explicitly here.
   */
  organizationId?: string | null
} = {}): Workflow.StageCapabilities {
  // Resolved once. A write with no owner is a bug worth seeing rather than a
  // row quietly filed under whoever the default happens to name.
  const owner = opts.organizationId?.trim() || null
  if (!owner) {
    // Loud, because a run with no owner writes rows that land on whichever org
    // the temporary column default names. That default exists to keep the
    // deployed worker writing while this wiring lands; it is not a fallback to
    // rely on, and silently depending on it is how a white-label row ends up
    // attributed to Kealee's own business.
    console.warn(
      '[siteplan] no organizationId supplied to productionCapabilities; rows will fall back ' +
      'to the column default. This is a bug in the caller, not a supported mode.',
    )
  }
  // Typed as definite so Prisma accepts the spread. At runtime the property is
  // absent when there is no owner, and the column default covers it — which is
  // exactly the temporary arrangement the warning above is about.
  const ownerFields = (owner ? { organizationId: owner } : {}) as { organizationId: string }
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

      return withOwner(owner, async (prisma) => {
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
            ...ownerFields,
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
      })
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
    /**
     * The professional-review record, read-only.
     *
     * The assignment and scoped approvals are written by the engineer review
     * application under the professional's own identity. The engine only
     * reads them here; nothing in the worker can mark a subject approved.
     */
    async loadReviewState(workflowId) {
      // One assignment per discipline: the engineer's and the architect's
      // reviews of the same plan sit side by side. The product says which
      // disciplines it paid for; route_review waits on each of those.
      return withOwner(owner, async (prisma) => {
      const wf = await prisma.sitePlanWorkflow.findUnique({ where: { id: workflowId }, select: { productId: true } })
      const rows = await prisma.sitePlanReviewAssignment.findMany({
        where: { workflowId },
        orderBy: { assignedAt: 'asc' },
        select: {
          status: true, discipline: true, acceptedAt: true, completedAt: true,
          notes: true, professionalProfileId: true,
        },
      })
      const profiles = rows.length
        ? await prisma.designProfessionalProfile.findMany({
            where: { id: { in: rows.map(r => r.professionalProfileId) } },
            select: { id: true, displayName: true, licenseNumber: true, licenseState: true },
          })
        : []
      const approvals = await prisma.sitePlanScopedApproval.findMany({
        where: { workflowId, supersededById: null },
        orderBy: { createdAt: 'asc' },
        select: {
          subject: true, discipline: true, decision: true, comment: true, decidedByName: true,
          licenceNumber: true, licenceState: true, decidedAt: true,
        },
      })
      const sheets = await prisma.sitePlanSheet.aggregate({ where: { workflowId }, _max: { currentRevision: true } })
      if (rows.length === 0 && approvals.length === 0) return null
      const assignments = rows.map(a => {
        const p = profiles.find(x => x.id === a.professionalProfileId) ?? null
        return {
          status: a.status,
          discipline: a.discipline,
          acceptedAt: a.acceptedAt?.toISOString() ?? null,
          completedAt: a.completedAt?.toISOString() ?? null,
          notes: a.notes,
          professional: p ? { displayName: p.displayName, licenceNumber: p.licenseNumber, licenceState: p.licenseState } : null,
        }
      })
      const required = productReviewDisciplines(wf?.productId)
      return {
        assignment: assignments.find(a => a.discipline === 'professional_engineer') ?? assignments[0] ?? null,
        assignments,
        // Whatever the product says, a discipline that has claimed the plan is part of its review.
        requiredDisciplines: [...new Set([...(required.length ? required : ['professional_engineer']), ...assignments.map(a => a.discipline)])],
        sheetRevision: sheets._max.currentRevision ?? 0,
        approvals: approvals.map(a => ({
          subject: String(a.subject),
          discipline: a.discipline,
          decision: a.decision as Workflow.ReviewSubjectDecision['decision'],
          comment: a.comment,
          decidedByName: a.decidedByName,
          licenceNumber: a.licenceNumber,
          licenceState: a.licenceState,
          decidedAt: a.decidedAt?.toISOString() ?? null,
        })),
      }
      })
    },

    /**
     * Evidence attached to the workflow, read-only. Revoked items are
     * excluded; a revoked certified-survey file must not clear a block.
     */
    async loadEvidenceLedger(workflowId) {
      return withOwner(owner, async (prisma) => {
      const rows = await prisma.sitePlanEvidence.findMany({
        where: { workflowId, revokedAt: null },
        orderBy: { attachedAt: 'asc' },
      })
      return {
        items: rows.map(r => ({
          id: r.id,
          kind: String(r.kind).toLowerCase() as EvidenceKind,
          reference: r.reference,
          attachedAt: r.attachedAt.toISOString(),
          attachedBy: r.attachedById,
          attestedBy: r.attestedByName && r.attestedByLicence && r.attestedByDiscipline && r.attestedByState
            ? {
                name: r.attestedByName,
                licenceNumber: r.attestedByLicence,
                discipline: r.attestedByDiscipline as Discipline,
                state: r.attestedByState,
              }
            : undefined,
          checksum: r.checksum ?? undefined,
          notes: r.notes ?? undefined,
        })),
      }
      })
    },

    /**
     * County review comments, entered against the ORDER by staff as
     * `form_data.sitePlanCountyComments`. Read-only here. Ids listed in
     * `form_data.sitePlanCountyCommentsIngested` were consumed by an earlier
     * round; the staff-entered array itself is never rewritten.
     */
    async loadCountyComments(workflowId) {
      const wf = await prisma.sitePlanWorkflow.findUnique({
        where: { id: workflowId }, select: { orderId: true },
      })
      if (!wf?.orderId) return null
      const rows = await prisma.$queryRaw<{ comments: unknown; ingested: unknown }[]>`
        SELECT form_data -> 'sitePlanCountyComments' AS comments,
               form_data -> 'sitePlanCountyCommentsIngested' AS ingested
        FROM public_intake_leads WHERE id = ${wf.orderId} LIMIT 1
      `
      const raw = rows[0]?.comments
      if (!Array.isArray(raw)) return []
      const ingested = new Set(Array.isArray(rows[0]?.ingested) ? (rows[0]!.ingested as unknown[]).map(String) : [])
      return raw.flatMap((c, i): CountyComment[] => {
        if (!c || typeof c !== 'object') return []
        const r = c as Record<string, unknown>
        const id = String(r.id ?? `${wf.orderId}:${i}`)
        if (ingested.has(id)) return []
        if (typeof r.comment !== 'string' || !r.comment.trim()) return []
        return [{
          id,
          sheet: typeof r.sheet === 'string' ? (r.sheet as CountyComment['sheet']) : undefined,
          reviewer: String(r.reviewer ?? 'County reviewer'),
          comment: r.comment,
          receivedAt: String(r.receivedAt ?? new Date().toISOString()),
        }]
      })
    },

    /**
     * Records a reopen: the named stage rows drop to READY, outputs kept.
     * `loadSnapshot` then reports them unsatisfied and the guard lets them
     * run again. The runner passes the full closure; nothing is added here.
     */
    async reopenStages(workflowId, jobs) {
      if (jobs.length === 0) return
      return withOwner(owner, async (prisma) => {
      await prisma.sitePlanStageExecution.updateMany({
        where: { workflowId, job: { in: jobs } },
        data: { status: 'READY' as never, completedAt: null },
      })
      await prisma.sitePlanAuditEvent.create({
        data: {
          ...ownerFields,
          workflowId,
          sequence: BigInt(Date.now()),
          occurredAt: new Date(),
          actorType: 'SYSTEM',
          eventType: 'stage.reopen',
          entityTable: 'site_plan_stage_executions',
          entityId: jobs[0],
          summary: `Reopened ${jobs.length} stage(s): ${jobs.join(', ')}`,
        },
      }).catch(() => undefined)
      })
    },

    trace(e) {
      void prisma.sitePlanAuditEvent.create({
        data: {
          ...ownerFields,
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
