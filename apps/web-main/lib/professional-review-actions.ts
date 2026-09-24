'use server'

/**
 * Server actions shared by the engineer (OS Engineering) and architect
 * (OS Architecture) review queues. The discipline comes from the caller's
 * profile, never from the form: a form field would let an engineer decide an
 * architect's subject.
 */
import { createHash } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  assertCurrentLicence,
  disciplineConfig,
  getProfessionalIdentity,
  requireAssignedReview,
  reviewDb,
  type ReviewDiscipline,
} from '@/lib/professional-review'
import { reopenSitePlanReview } from '@/lib/site-plan-workflow'

const DECISIONS = new Set(['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'])

/** The latest drawing and the hash a decision is bound to. */
async function latestDrawing(workflowId: string, projectId: string) {
  const [composeStage, renderStage, conditionsStage, document, sheets] = await Promise.all([
    reviewDb.sitePlanStageExecution.findFirst({ where: { workflowId, job: 'siteplan.compose_sheets', status: 'COMPLETED' }, select: { outputs: true } }),
    reviewDb.sitePlanStageExecution.findFirst({ where: { workflowId, job: 'siteplan.render_exports', status: 'COMPLETED' }, select: { outputs: true } }),
    reviewDb.sitePlanStageExecution.findFirst({ where: { workflowId, job: 'siteplan.build_existing_conditions', status: 'COMPLETED' }, select: { outputs: true } }),
    reviewDb.document.findFirst({ where: { projectId, category: { startsWith: 'site-plan' } }, orderBy: { createdAt: 'desc' } }),
    reviewDb.sitePlanSheet.findMany({ where: { workflowId }, select: { currentRevision: true } }),
  ])
  if (!document) return null
  const documentPayload = (document.content ?? {}) as { data?: string }
  const contentHash = createHash('sha256').update(documentPayload.data ?? document.id).digest('hex')
  const compose = (composeStage?.outputs ?? {}) as { pages?: { primary?: string }[] }
  const conditions = (conditionsStage?.outputs ?? {}) as { twinRevision?: number }
  const pages = compose.pages?.filter((page) => page.primary) ?? [{ primary: 'C-100' }]
  return {
    document, contentHash, pages, renderOutputs: renderStage?.outputs ?? null,
    twinRevision: conditions.twinRevision ?? 0,
    sheetRevision: Math.max(0, ...sheets.map((s: { currentRevision: number }) => s.currentRevision)),
  }
}

/**
 * The Org that owns a workflow — and an Org IS the tenant.
 *
 * Every site-plan child row carries it. There is a column default today, but
 * it points at the homeowner org and is a temporary hotfix: relying on it
 * would silently attribute a white-label row to Kealee's own business. See
 * docs/decisions/white-label-and-tenancy.md.
 */
async function ownerOf(workflowId: string): Promise<string | undefined> {
  const w = await reviewDb.sitePlanWorkflow.findUnique({
    where: { id: workflowId }, select: { organizationId: true },
  })
  return w?.organizationId ?? undefined
}

export async function createProfessionalProfile(formData: FormData) {
  const identity = await getProfessionalIdentity()
  if (!identity) throw new Error('Authentication required.')
  const discipline = (String(formData.get('discipline') ?? 'professional_engineer') as ReviewDiscipline)
  const cfg = disciplineConfig(discipline)

  const displayName = String(formData.get('displayName') ?? '').trim()
  const licenseNumber = String(formData.get('licenseNumber') ?? '').trim()
  const licenseState = String(formData.get('licenseState') ?? '').trim().toUpperCase()
  if (!displayName || !licenseNumber || !/^[A-Z]{2}$/.test(licenseState)) {
    throw new Error('Name, licence number, and two-letter state are required.')
  }

  await reviewDb.designProfessionalProfile.upsert({
    where: { userId: identity.user.id },
    create: {
      userId: identity.user.id, displayName, licenseNumber, licenseState,
      firmName: String(formData.get('firmName') ?? '').trim() || null,
      specialties: cfg.specialties,
      isLicensed: false,
    },
    update: {
      displayName, licenseNumber, licenseState,
      firmName: String(formData.get('firmName') ?? '').trim() || null,
      specialties: cfg.specialties,
      isLicensed: false,
    },
  })
  redirect(cfg.path)
}

export async function verifyProfessionalProfile(formData: FormData) {
  const identity = await getProfessionalIdentity()
  if (!identity || !['ADMIN', 'SUPER_ADMIN'].includes(String(identity.user.role).toUpperCase())) {
    throw new Error('Administrator access required.')
  }
  const profileId = String(formData.get('profileId') ?? '')
  const profile = await reviewDb.designProfessionalProfile.findUnique({ where: { id: profileId } })
  if (!profile?.licenseNumber || !profile.licenseState) {
    throw new Error('The professional profile is incomplete.')
  }
  if (profile.licenseExpiry && new Date(profile.licenseExpiry) < new Date()) {
    throw new Error('An expired licence cannot be verified.')
  }
  await reviewDb.designProfessionalProfile.update({ where: { id: profileId }, data: { isLicensed: true } })
  revalidatePath('/admin/engineer-reviews')
  revalidatePath('/engineer/review')
  revalidatePath('/architect/review')
}

export async function claimReview(formData: FormData) {
  const workflowId = String(formData.get('workflowId') ?? '')
  const identity = await getProfessionalIdentity()
  if (!identity?.profile || !identity.discipline) throw new Error('Professional profile required.')
  assertCurrentLicence(identity.profile)
  const cfg = disciplineConfig(identity.discipline)

  const workflow = await reviewDb.sitePlanWorkflow.findFirst({ where: { id: workflowId, professionalReviewRequired: true } })
  if (!workflow) throw new Error('Review is no longer available.')
  const taken = await reviewDb.sitePlanReviewAssignment.findFirst({ where: { workflowId, discipline: cfg.id } })
  if (taken) throw new Error(`Another ${cfg.id.replaceAll('_', ' ')} already holds this review.`)

  const drawing = await latestDrawing(workflowId, workflow.projectId)
  if (!drawing) throw new Error('The preliminary drawing package is not available yet.')
  const { document, contentHash, pages, twinRevision } = drawing

  await reviewDb.$transaction(async (tx: any) => {
    const assignment = await tx.sitePlanReviewAssignment.create({
      data: {
        organizationId: workflow.organizationId,
        workflowId,
        professionalProfileId: identity.profile.id,
        assignedById: identity.user.id,
        discipline: cfg.id,
        acceptedAt: new Date(),
        dueAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      },
    })
    const existingSheets = await tx.sitePlanSheet.count({ where: { workflowId } })
    if (!existingSheets) {
      for (const [index, page] of pages.entries()) {
        await tx.sitePlanSheet.create({
          data: {
            organizationId: workflow.organizationId,
            workflowId,
            sheetNumber: page.primary ?? `C-${(index + 1) * 100}`,
            title: index === 0 ? 'Site Plan and Zoning Layout' : 'Site Plan Continuation',
            covers: [page.primary ?? 'SITE_PLAN'],
            status: 'FOR_REVIEW',
            currentRevision: 0,
            twinRevision,
            documentId: document.id,
            contentHash,
            disclosure: 'Generated preliminary plan for licensed professional review. Not for permit or construction.',
          },
        })
      }
    }
    // This discipline's subjects, seeded once. Another discipline's subjects are untouched.
    const mine = await tx.sitePlanScopedApproval.count({ where: { workflowId, discipline: cfg.id, supersededById: null } })
    if (!mine) {
      for (const subject of cfg.subjects) {
        await tx.sitePlanScopedApproval.create({
          data: {
            organizationId: workflow.organizationId,
            workflowId, subject, discipline: cfg.id,
            appearsOnSheets: pages.map((page) => page.primary ?? 'C-100'),
            objectIds: [], decision: 'PENDING', twinRevision, contentHash,
          },
        })
      }
    }
    await tx.sitePlanIssuance.updateMany({ where: { workflowId }, data: { deliveryState: 'PROFESSIONAL_REVIEW' } })
    await tx.sitePlanAuditEvent.create({
      data: {
        organizationId: await ownerOf(workflowId),
        workflowId,
        actorId: identity.user.id,
        actorType: cfg.actorType,
        actorLicence: identity.profile.licenseNumber,
        eventType: 'review.assignment.accepted',
        entityTable: 'site_plan_review_assignments',
        entityId: assignment.id,
        summary: `${identity.profile.displayName} accepted ${cfg.id.replaceAll('_', ' ')} review.`,
        metadata: { documentId: document.id, contentHash, renderOutputs: drawing.renderOutputs, discipline: cfg.id },
      },
    })
  })
  // The routing stage re-reads the state: with every required discipline claimed it moves to IN_REVIEW.
  await reopenSitePlanReview(workflowId)
  redirect(`${cfg.path}/${workflowId}`)
}

export async function recordScopedDecision(formData: FormData) {
  const workflowId = String(formData.get('workflowId') ?? '')
  const approvalId = String(formData.get('approvalId') ?? '')
  const decision = String(formData.get('decision') ?? '')
  const comment = String(formData.get('comment') ?? '').trim()
  if (!DECISIONS.has(decision)) throw new Error('Invalid professional-review decision.')
  if (decision !== 'APPROVED' && comment.length < 10) {
    throw new Error('A substantive comment is required when approval is withheld.')
  }

  const identity = await requireAssignedReview(workflowId)
  assertCurrentLicence(identity.profile)
  const cfg = disciplineConfig(identity.discipline)
  const workflow = await reviewDb.sitePlanWorkflow.findUnique({ where: { id: workflowId }, select: { projectId: true, organizationId: true } })
  // A decision binds to the drawing on the desk NOW — after a revision that is the
  // re-rendered document, not the one the subject was seeded with.
  const drawing = workflow ? await latestDrawing(workflowId, workflow.projectId) : null

  await reviewDb.$transaction(async (tx: any) => {
    const approval = await tx.sitePlanScopedApproval.findFirst({ where: { id: approvalId, workflowId } })
    if (!approval) throw new Error('Review subject not found.')
    if (approval.discipline !== cfg.id) {
      throw new Error(`This subject is assigned to ${approval.discipline.replaceAll('_', ' ')}, not ${cfg.id.replaceAll('_', ' ')}.`)
    }

    const before = { decision: approval.decision, comment: approval.comment }
    const updated = await tx.sitePlanScopedApproval.update({
      where: { id: approvalId },
      data: {
        decision,
        comment: comment || null,
        decidedById: identity.user.id,
        decidedByName: identity.profile.displayName,
        licenceNumber: identity.profile.licenseNumber,
        licenceState: identity.profile.licenseState,
        decidedAt: new Date(),
        ...(drawing ? { contentHash: drawing.contentHash, twinRevision: drawing.twinRevision } : {}),
      },
    })

    if (decision !== 'APPROVED') {
      await tx.sitePlanReviewAssignment.updateMany({
        where: { workflowId, discipline: cfg.id }, data: { status: 'REVISION_REQUIRED', notes: comment },
      })
      await tx.sitePlanIssuance.updateMany({
        where: { workflowId }, data: { deliveryState: 'REVISION_REQUIRED', issuable: false },
      })
    }

    await tx.sitePlanAuditEvent.create({
      data: {
        organizationId: await ownerOf(workflowId),
        workflowId,
        actorId: identity.user.id,
        actorType: cfg.actorType,
        actorLicence: identity.profile.licenseNumber,
        eventType: `review.subject.${decision.toLowerCase()}`,
        entityTable: 'site_plan_scoped_approvals',
        entityId: approvalId,
        summary: `${identity.profile.displayName} (${cfg.id.replaceAll('_', ' ')}) marked ${approval.subject} ${decision}${drawing ? ` on revision ${drawing.sheetRevision}` : ''}.`,
        before,
        after: { decision: updated.decision, comment: updated.comment },
        twinRevision: updated.twinRevision,
      },
    })
  })

  // A withheld approval is a decision the workflow must hear about now, not
  // when the review is eventually "completed" — it never will be on this
  // revision. Re-run route_review so the redlines reach a drafter and the order.
  if (decision !== 'APPROVED') await reopenSitePlanReview(workflowId)

  revalidatePath(`${cfg.path}/${workflowId}`)
  revalidatePath(cfg.path)
}

export async function completeReview(formData: FormData) {
  const workflowId = String(formData.get('workflowId') ?? '')
  const identity = await requireAssignedReview(workflowId)
  assertCurrentLicence(identity.profile)
  const cfg = disciplineConfig(identity.discipline)

  await reviewDb.$transaction(async (tx: any) => {
    const approvals = await tx.sitePlanScopedApproval.findMany({ where: { workflowId, discipline: cfg.id, supersededById: null } })
    if (!approvals.length || approvals.some((item: any) =>
      item.decision !== 'APPROVED' || !item.contentHash || item.twinRevision === null)) {
      throw new Error(`Every ${cfg.id.replaceAll('_', ' ')} subject must be approved and bound to a plan revision before completion.`)
    }
    const openBlocks = await tx.sitePlanQcFinding.count({ where: { workflowId, status: 'OPEN', severity: 'BLOCKING' } })
    if (openBlocks > 0) {
      throw new Error('Blocking QC findings must be resolved by evidence before review can complete.')
    }
    await tx.sitePlanReviewAssignment.updateMany({
      where: { workflowId, discipline: cfg.id }, data: { status: 'COMPLETED', completedAt: new Date() },
    })
    await tx.sitePlanAuditEvent.create({
      data: {
        organizationId: await ownerOf(workflowId),
        workflowId,
        actorId: identity.user.id,
        actorType: cfg.actorType,
        actorLicence: identity.profile.licenseNumber,
        eventType: 'review.completed',
        entityTable: 'site_plan_review_assignments',
        entityId: identity.assignment.id,
        summary: `${identity.profile.displayName} completed scoped ${cfg.id.replaceAll('_', ' ')} review. Sealing remains a separate act.`,
      },
    })
  })
  // The workflow's route_review stage is waiting on exactly this.
  await reopenSitePlanReview(workflowId)
  redirect(cfg.path)
}
