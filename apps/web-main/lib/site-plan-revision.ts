/**
 * Closing the revision loop.
 *
 * A professional withholds approval → `route_review` → `apply_revisions`
 * reopens `compose_sheets` and waits for a drafter. This is the drafter's
 * act: on the staff desk they answer every redline, change the inputs the
 * engine draws from, and submit. The submission
 *
 *   1. patches the workflow's inputs (`SitePlanWorkflow.metadata`, which the
 *      worker reads as the stage form data) with the drafter's changes;
 *   2. bumps every sheet to the next revision and records a
 *      `SitePlanSheetRevision` with the redlines and responses;
 *   3. supersedes the withheld scoped approvals with fresh PENDING ones on the
 *      new revision, and returns each REVISION_REQUIRED assignment to ACTIVE,
 *      so the same professionals re-review the revised drawing;
 *   4. re-enqueues `siteplan.compose_sheets`. The runner derives the rest —
 *      render, QC, persist, deliver — the worker's delivery bridge refreshes
 *      the customer's record to the revised document, and re-routes it for
 *      review.
 *
 * The engine still applies no free-text redline itself: the drafter's input
 * change is what makes the next render different.
 */
import { prisma } from '@kealee/database'
import { enqueueSitePlanStage } from '@/lib/site-plan-workflow'

const db = prisma as any

export interface RedlineResponse {
  /** SitePlanScopedApproval id of the withheld subject. */
  approvalId: string
  /** What the drafter did about it. */
  response: string
}

export interface RevisionInput {
  workflowId: string
  /** Who is submitting — the staff user's id and display name for the audit trail. */
  actor: { id: string; name: string }
  /** What changed, in one sentence — printed in the sheet's revision block. */
  description: string
  responses: RedlineResponse[]
  /**
   * Changes to the inputs the engine draws from — the order's form data as
   * the workflow carries it (programme, setbacks, footprint placement, …).
   * Merged at the top level over `SitePlanWorkflow.metadata`.
   */
  formDataPatch: Record<string, unknown>
}

export interface RevisionOutcome {
  sheetRevision: number
  supersededApprovals: number
  reactivatedAssignments: number
  enqueued: boolean
  jobKey: string | null
  error?: string
}

export async function submitSitePlanRevision(input: RevisionInput): Promise<RevisionOutcome> {
  const workflow = await db.sitePlanWorkflow.findUnique({ where: { id: input.workflowId } })
  if (!workflow) throw new Error('Workflow not found.')
  if (!input.description.trim()) throw new Error('A revision description is required.')

  const withheld = await db.sitePlanScopedApproval.findMany({
    where: { workflowId: input.workflowId, supersededById: null, decision: { in: ['CHANGES_REQUESTED', 'REJECTED'] } },
  })
  if (!withheld.length) throw new Error('No withheld subjects to revise — nothing was requested.')
  const unanswered = withheld.filter((a: any) => !input.responses.find(r => r.approvalId === a.id && r.response.trim().length >= 5))
  if (unanswered.length) {
    throw new Error(`Every redline needs a response: ${unanswered.map((a: any) => a.subject).join(', ')}.`)
  }
  const hasInputChange = Object.keys(input.formDataPatch ?? {}).length > 0
  if (!hasInputChange) {
    throw new Error('A revision must change the inputs the engine draws from; the same inputs would draw the same sheet.')
  }

  const sheets = await db.sitePlanSheet.findMany({ where: { workflowId: input.workflowId } })
  const nextRevision = Math.max(0, ...sheets.map((s: any) => s.currentRevision)) + 1
  const now = new Date()

  const result = await db.$transaction(async (tx: any) => {
    // 1. The inputs. `metadata` is what the worker hands every stage as form data.
    const metadata = { ...((workflow.metadata ?? {}) as Record<string, unknown>), ...input.formDataPatch,
      sitePlanRevision: { number: nextRevision, description: input.description, submittedAt: now.toISOString(), submittedBy: input.actor.name } }
    await tx.sitePlanWorkflow.update({ where: { id: input.workflowId }, data: { metadata, version: { increment: 1 } } })

    // 2. Sheets to the next revision, each with its revision record.
    for (const sheet of sheets) {
      await tx.sitePlanSheetRevision.create({
        data: {
          organizationId: workflow.organizationId,
          sheetId: sheet.id, workflowId: input.workflowId,
          revisionNumber: nextRevision, revisionDate: now,
          description: input.description, issuedBy: input.actor.name,
          statusBefore: sheet.status, statusAfter: 'FOR_REVIEW',
          twinRevisionBefore: sheet.twinRevision, twinRevisionAfter: sheet.twinRevision,
          changes: withheld.map((a: any) => ({
            subject: a.subject, discipline: a.discipline, redline: a.comment, decidedBy: a.decidedByName,
            response: input.responses.find(r => r.approvalId === a.id)?.response ?? '',
          })),
          documentId: sheet.documentId, contentHash: sheet.contentHash,
        },
      })
      await tx.sitePlanSheet.update({ where: { id: sheet.id }, data: { currentRevision: nextRevision, status: 'FOR_REVIEW' } })
    }

    // 3. Fresh PENDING subjects for the reviewers, superseding the withheld ones; assignments back to ACTIVE.
    let superseded = 0
    for (const a of withheld) {
      const fresh = await tx.sitePlanScopedApproval.create({
        data: {
          organizationId: workflow.organizationId,
          workflowId: input.workflowId, subject: a.subject, discipline: a.discipline,
          appearsOnSheets: a.appearsOnSheets, objectIds: a.objectIds,
          decision: 'PENDING', twinRevision: a.twinRevision, contentHash: null,
        },
      })
      await tx.sitePlanScopedApproval.update({ where: { id: a.id }, data: { supersededById: fresh.id } })
      superseded++
    }
    const reactivated = await tx.sitePlanReviewAssignment.updateMany({
      where: { workflowId: input.workflowId, status: 'REVISION_REQUIRED' },
      data: { status: 'ACTIVE', notes: `Revision ${nextRevision} submitted by ${input.actor.name}: ${input.description}` },
    })
    await tx.sitePlanIssuance.updateMany({ where: { workflowId: input.workflowId }, data: { deliveryState: 'PROFESSIONAL_REVIEW' } })

    await tx.sitePlanAuditEvent.create({
      data: {
        organizationId: workflow.organizationId,
        workflowId: input.workflowId,
        actorId: input.actor.id, actorType: 'drafter',
        eventType: 'revision.submitted',
        entityTable: 'site_plan_workflows', entityId: input.workflowId,
        summary: `${input.actor.name} submitted revision ${nextRevision}: ${input.description}`,
        metadata: { formDataPatch: input.formDataPatch, responses: input.responses, supersededApprovals: superseded },
      },
    })
    return { superseded, reactivated: reactivated.count }
  })

  // 4. Re-enter the drawing chain from composition. The runner derives render → QC → persist →
  //    deliver; the worker re-bridges the revised document and re-routes it for review.
  const enq = await enqueueSitePlanStage(input.workflowId, 'siteplan.compose_sheets')
  return {
    sheetRevision: nextRevision,
    supersededApprovals: result.superseded,
    reactivatedAssignments: result.reactivated,
    enqueued: enq.enqueued, jobKey: enq.jobKey, error: enq.error,
  }
}
