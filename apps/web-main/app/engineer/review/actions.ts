'use server'

import { createHash } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  assertCurrentLicence,
  getEngineerIdentity,
  requireAssignedReview,
  reviewDb,
} from '@/lib/engineer-review'

const DECISIONS = new Set(['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'])

export async function createProfessionalProfile(formData: FormData) {
  const identity = await getEngineerIdentity()
  if (!identity) throw new Error('Authentication required.')

  const displayName = String(formData.get('displayName') ?? '').trim()
  const licenseNumber = String(formData.get('licenseNumber') ?? '').trim()
  const licenseState = String(formData.get('licenseState') ?? '').trim().toUpperCase()
  if (!displayName || !licenseNumber || !/^[A-Z]{2}$/.test(licenseState)) {
    throw new Error('Name, licence number, and two-letter state are required.')
  }

  await reviewDb.designProfessionalProfile.upsert({
    where: { userId: identity.user.id },
    create: {
      userId: identity.user.id,
      displayName,
      licenseNumber,
      licenseState,
      firmName: String(formData.get('firmName') ?? '').trim() || null,
      specialties: ['CIVIL_ENGINEERING', 'SITE_PLAN_REVIEW'],
      isLicensed: false,
    },
    update: {
      displayName,
      licenseNumber,
      licenseState,
      firmName: String(formData.get('firmName') ?? '').trim() || null,
      isLicensed: false,
    },
  })
  redirect('/engineer/review')
}

export async function verifyProfessionalProfile(formData: FormData) {
  const identity = await getEngineerIdentity()
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
  await reviewDb.designProfessionalProfile.update({
    where: { id: profileId }, data: { isLicensed: true },
  })
  revalidatePath('/admin/engineer-reviews')
  revalidatePath('/engineer/review')
}

export async function claimReview(formData: FormData) {
  const workflowId = String(formData.get('workflowId') ?? '')
  const identity = await getEngineerIdentity()
  if (!identity?.profile) throw new Error('Professional profile required.')
  assertCurrentLicence(identity.profile)

  const workflow = await reviewDb.sitePlanWorkflow.findFirst({
    where: { id: workflowId, professionalReviewRequired: true },
  })
  if (!workflow) throw new Error('Review is no longer available.')

  const [composeStage, renderStage, conditionsStage, document] = await Promise.all([
    reviewDb.sitePlanStageExecution.findFirst({
      where: { workflowId, job: 'siteplan.compose_sheets', status: 'COMPLETED' },
      select: { outputs: true },
    }),
    reviewDb.sitePlanStageExecution.findFirst({
      where: { workflowId, job: 'siteplan.render_exports', status: 'COMPLETED' },
      select: { outputs: true },
    }),
    reviewDb.sitePlanStageExecution.findFirst({
      where: { workflowId, job: 'siteplan.build_existing_conditions', status: 'COMPLETED' },
      select: { outputs: true },
    }),
    reviewDb.document.findFirst({
      where: { projectId: workflow.projectId, category: { startsWith: 'site-plan' } },
      orderBy: { createdAt: 'desc' },
    }),
  ])
  if (!document) throw new Error('The preliminary drawing package is not available yet.')

  const documentPayload = (document.content ?? {}) as { data?: string }
  const contentHash = createHash('sha256')
    .update(documentPayload.data ?? document.id)
    .digest('hex')
  const compose = (composeStage?.outputs ?? {}) as { pages?: { primary?: string }[] }
  const conditions = (conditionsStage?.outputs ?? {}) as { twinRevision?: number }
  const pages = compose.pages?.filter((page) => page.primary) ?? [{ primary: 'C-100' }]
  const twinRevision = conditions.twinRevision ?? 0

  await reviewDb.$transaction(async (tx: any) => {
    const assignment = await tx.sitePlanReviewAssignment.create({
      data: {
        workflowId,
        professionalProfileId: identity.profile.id,
        assignedById: identity.user.id,
        discipline: 'professional_engineer',
        acceptedAt: new Date(),
        dueAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      },
    })
    const existingSheets = await tx.sitePlanSheet.count({ where: { workflowId } })
    if (!existingSheets) {
      for (const [index, page] of pages.entries()) {
        await tx.sitePlanSheet.create({
          data: {
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
    const existingApprovals = await tx.sitePlanScopedApproval.count({ where: { workflowId } })
    if (!existingApprovals) {
      for (const subject of ['ZONING_COMPLIANCE', 'SITE_LAYOUT']) {
        await tx.sitePlanScopedApproval.create({
          data: {
            workflowId,
            subject,
            discipline: 'professional_engineer',
            appearsOnSheets: pages.map((page) => page.primary ?? 'C-100'),
            objectIds: [],
            decision: 'PENDING',
            twinRevision,
            contentHash,
          },
        })
      }
    }
    await tx.sitePlanIssuance.updateMany({
      where: { workflowId },
      data: { deliveryState: 'PROFESSIONAL_REVIEW' },
    })
    await tx.sitePlanAuditEvent.create({
      data: {
        workflowId,
        actorId: identity.user.id,
        actorType: 'professional_engineer',
        actorLicence: identity.profile.licenseNumber,
        eventType: 'review.assignment.accepted',
        entityTable: 'site_plan_review_assignments',
        entityId: assignment.id,
        summary: `${identity.profile.displayName} accepted professional review.`,
        metadata: { documentId: document.id, contentHash, renderOutputs: renderStage?.outputs ?? null },
      },
    })
  })
  redirect(`/engineer/review/${workflowId}`)
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

  await reviewDb.$transaction(async (tx: any) => {
    const approval = await tx.sitePlanScopedApproval.findFirst({ where: { id: approvalId, workflowId } })
    if (!approval) throw new Error('Review subject not found.')
    if (approval.discipline !== 'professional_engineer') {
      throw new Error(`This subject is assigned to ${approval.discipline}, not a professional engineer.`)
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
      },
    })

    if (decision !== 'APPROVED') {
      await tx.sitePlanReviewAssignment.update({
        where: { workflowId }, data: { status: 'REVISION_REQUIRED', notes: comment },
      })
      await tx.sitePlanIssuance.updateMany({
        where: { workflowId }, data: { deliveryState: 'REVISION_REQUIRED', issuable: false },
      })
    }

    await tx.sitePlanAuditEvent.create({
      data: {
        workflowId,
        actorId: identity.user.id,
        actorType: 'professional_engineer',
        actorLicence: identity.profile.licenseNumber,
        eventType: `review.subject.${decision.toLowerCase()}`,
        entityTable: 'site_plan_scoped_approvals',
        entityId: approvalId,
        summary: `${identity.profile.displayName} marked ${approval.subject} ${decision}.`,
        before,
        after: { decision: updated.decision, comment: updated.comment },
        twinRevision: updated.twinRevision,
      },
    })
  })

  revalidatePath(`/engineer/review/${workflowId}`)
  revalidatePath('/engineer/review')
}

export async function completeReview(formData: FormData) {
  const workflowId = String(formData.get('workflowId') ?? '')
  const identity = await requireAssignedReview(workflowId)
  assertCurrentLicence(identity.profile)

  await reviewDb.$transaction(async (tx: any) => {
    const approvals = await tx.sitePlanScopedApproval.findMany({
      where: { workflowId, discipline: 'professional_engineer' },
    })
    if (!approvals.length || approvals.some((item: any) =>
      item.decision !== 'APPROVED' || !item.contentHash || item.twinRevision === null)) {
      throw new Error('Every engineering subject must be approved and bound to a plan revision before completion.')
    }
    const openBlocks = await tx.sitePlanQcFinding.count({
      where: { workflowId, status: 'OPEN', severity: 'BLOCKING' },
    })
    if (openBlocks > 0) {
      throw new Error('Blocking QC findings must be resolved by evidence before review can complete.')
    }
    const assignment = await tx.sitePlanReviewAssignment.update({
      where: { workflowId }, data: { status: 'COMPLETED', completedAt: new Date() },
    })
    await tx.sitePlanAuditEvent.create({
      data: {
        workflowId,
        actorId: identity.user.id,
        actorType: 'professional_engineer',
        actorLicence: identity.profile.licenseNumber,
        eventType: 'review.completed',
        entityTable: 'site_plan_review_assignments',
        entityId: assignment.id,
        summary: `${identity.profile.displayName} completed scoped professional review. Sealing remains a separate act.`,
      },
    })
  })
  redirect('/engineer/review')
}
