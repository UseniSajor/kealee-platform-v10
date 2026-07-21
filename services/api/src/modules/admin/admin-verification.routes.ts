/**
 * admin-verification.routes.ts
 *
 * Admin endpoints for contractor verification review queue.
 * Registered at prefix /admin, so final paths are:
 *
 *   GET  /admin/verification/queue          — paginated contractor list with filters
 *   GET  /admin/verification/:profileId     — full contractor verification detail
 *   POST /admin/verification/:profileId/approve       — approve → ELIGIBLE
 *   POST /admin/verification/:profileId/reject        — reject  → PENDING_VERIFICATION + event
 *   POST /admin/verification/:profileId/request-info  — request more docs
 *   POST /admin/verification/:profileId/suspend       — suspend → SUSPENDED
 *
 * Authorization: admin or super_admin role only.
 *
 * Verification state is stored in:
 *   - RotationQueueEntry.eligibility (ELIGIBLE | PENDING_VERIFICATION | SUSPENDED | INELIGIBLE)
 *   - RotationQueueEntry.licenseVerified / insuranceVerified
 *   - MarketplaceProfile.verified / ContractorProfile.isVerified
 *   - WorkflowEvent (audit trail of admin decisions with notes)
 *   - WorkflowStage (lifecycle timeline via P0-Architecture primitives)
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { requireAdmin } from '../../middleware/auth.middleware'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import { workflowOrchestratorService } from '../workflow/workflow-orchestrator.service'
import { workflowEventService, WorkflowEventService } from '../workflow/workflow-event.service'
import { workflowStageService } from '../workflow/workflow-stage.service'
import { workItemService } from '../workflow/work-item.service'

// ─── Types ────────────────────────────────────────────────────────────────────

export type VerificationStatus =
  | 'PENDING'
  | 'NEEDS_INFO'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive the display-level verification status from DB state + latest event.
 */
function deriveVerificationStatus(
  eligibility: string,
  latestEventType: string | null,
): VerificationStatus {
  if (eligibility === 'ELIGIBLE')   return 'APPROVED'
  if (eligibility === 'SUSPENDED')  return 'SUSPENDED'
  if (eligibility === 'INELIGIBLE') return 'REJECTED'

  // PENDING_VERIFICATION — check latest admin action
  if (latestEventType === 'verification.rejected')  return 'REJECTED'
  if (latestEventType === 'verification.needs_info') return 'NEEDS_INFO'
  if (latestEventType === 'verification.under_review') return 'UNDER_REVIEW'
  return 'PENDING'
}

/**
 * Get the latest WorkflowEvent for a contractor profile.
 */
async function getLatestVerificationEvent(profileId: string) {
  return prismaAny.workflowEvent.findFirst({
    where: {
      subjectType: 'PROFESSIONAL_ASSIGNMENT',
      subjectId:   profileId,
      eventType: {
        startsWith: 'verification.',
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Build a contractor verification summary row from raw DB records.
 */
function buildSummary(
  profile: any,
  contractor: any,
  queueEntry: any,
  latestEvent: any,
) {
  const verificationStatus = deriveVerificationStatus(
    queueEntry?.eligibility ?? 'PENDING_VERIFICATION',
    latestEvent?.eventType ?? null,
  )

  return {
    profileId:          profile.id,
    userId:             profile.userId,
    businessName:       profile.businessName,
    contactName:        contractor?.user?.name  ?? null,
    contactEmail:       contractor?.email       ?? profile.user?.email ?? null,
    phone:              contractor?.phone       ?? null,
    city:               contractor?.city        ?? null,
    state:              contractor?.state       ?? null,
    specialties:        profile.specialties     ?? [],
    professionalType:   profile.professionalType ?? 'CONTRACTOR',
    verificationStatus,
    eligibility:        queueEntry?.eligibility ?? 'PENDING_VERIFICATION',
    licenseVerified:    queueEntry?.licenseVerified    ?? false,
    insuranceVerified:  queueEntry?.insuranceVerified  ?? false,
    licenseNumber:      contractor?.licenseNumber ?? null,
    insuranceCarrier:   contractor?.insuranceInfo?.carrier ?? null,
    insuranceExpiration: contractor?.insuranceInfo?.expiration ?? null,
    registeredAt:       profile.createdAt,
    lastActionAt:       latestEvent?.createdAt ?? null,
    lastActionNote:     latestEvent?.payload?.note ?? null,
    reviewedBy:         latestEvent?.payload?.reviewedByName ?? null,
  }
}

// ─── Route registration ───────────────────────────────────────────────────────

export async function adminVerificationRoutes(fastify: FastifyInstance) {
  const preHandler = [authenticateUser, requireAdmin]

  // ──────────────────────────────────────────────────────────────────────────
  // GET /admin/verification/queue
  // Paginated list of contractors with verification status + filters.
  // ──────────────────────────────────────────────────────────────────────────

  fastify.get('/verification/queue', { preHandler }, async (request: any, reply) => {
    const {
      status,
      search,
      page    = '1',
      limit   = '25',
      sort    = 'createdAt',
      dir     = 'desc',
    } = request.query as Record<string, string>

    const pageNum  = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const skip     = (pageNum - 1) * limitNum

    try {
      // Build eligibility filter from status param
      let eligibilityFilter: string[] | undefined
      if (status === 'PENDING')     eligibilityFilter = ['PENDING_VERIFICATION']
      if (status === 'APPROVED')    eligibilityFilter = ['ELIGIBLE']
      if (status === 'SUSPENDED')   eligibilityFilter = ['SUSPENDED']
      if (status === 'REJECTED')    eligibilityFilter = ['PENDING_VERIFICATION', 'INELIGIBLE']

      // Build name/email search
      const searchFilter = search
        ? {
            OR: [
              { businessName: { contains: search, mode: 'insensitive' } },
              { user:         { email: { contains: search, mode: 'insensitive' } } },
              { user:         { name:  { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}

      // Query MarketplaceProfile for CONTRACTOR / DESIGN_BUILD types
      const where: any = {
        professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] },
        ...searchFilter,
        ...(eligibilityFilter
          ? {
              queueEntries: {
                some: { eligibility: { in: eligibilityFilter } },
              },
            }
          : {}),
      }

      const [profiles, total] = await Promise.all([
        prismaAny.marketplaceProfile.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: dir === 'asc' ? 'asc' : 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            queueEntries: {
              where: { professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] } },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }),
        prismaAny.marketplaceProfile.count({ where }),
      ])

      // Fetch contractor profiles + latest events in parallel
      const profileIds = profiles.map((p: any) => p.id)
      const userIds    = profiles.map((p: any) => p.userId)

      const [contractorProfiles, latestEvents] = await Promise.all([
        prismaAny.contractorProfile.findMany({
          where: { userId: { in: userIds } },
          include: { user: { select: { name: true, email: true } } },
        }),
        prismaAny.workflowEvent.findMany({
          where: {
            subjectType: 'PROFESSIONAL_ASSIGNMENT',
            subjectId:   { in: profileIds },
            eventType:   { startsWith: 'verification.' },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ])

      const contractorByUserId  = Object.fromEntries(
        contractorProfiles.map((c: any) => [c.userId, c])
      )
      // Keep only the latest event per profileId
      const latestEventByProfile: Record<string, any> = {}
      for (const ev of latestEvents) {
        if (!latestEventByProfile[ev.subjectId]) {
          latestEventByProfile[ev.subjectId] = ev
        }
      }

      const rows = profiles.map((profile: any) => {
        const queueEntry = profile.queueEntries?.[0] ?? null
        const contractor = contractorByUserId[profile.userId]
        const latestEvent = latestEventByProfile[profile.id] ?? null
        return buildSummary(profile, contractor, queueEntry, latestEvent)
      })

      // Apply status filter post-query for NEEDS_INFO/UNDER_REVIEW/REJECTED
      // (since these derive from eventType, not eligibility alone)
      const filtered = status && !['PENDING', 'APPROVED', 'SUSPENDED'].includes(status)
        ? rows.filter((r: any) => r.verificationStatus === status)
        : rows

      return reply.send({
        contractors: filtered,
        pagination: {
          total,
          page:       pageNum,
          limit:      limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
        // Summary counts for filter tabs
        counts: {
          PENDING:  filtered.filter((r: any) => r.verificationStatus === 'PENDING').length,
          APPROVED: filtered.filter((r: any) => r.verificationStatus === 'APPROVED').length,
          REJECTED: filtered.filter((r: any) => r.verificationStatus === 'REJECTED').length,
          SUSPENDED: filtered.filter((r: any) => r.verificationStatus === 'SUSPENDED').length,
          NEEDS_INFO: filtered.filter((r: any) => r.verificationStatus === 'NEEDS_INFO').length,
        },
      })
    } catch (err: any) {
      fastify.log.error({ err }, 'Failed to fetch verification queue')
      return reply.code(500).send({ error: sanitizeErrorMessage(err, 'Failed to load verification queue') })
    }
  })

  // ──────────────────────────────────────────────────────────────────────────
  // GET /admin/verification/:profileId
  // Full contractor verification detail for the review panel.
  // ──────────────────────────────────────────────────────────────────────────

  fastify.get('/verification/:profileId', { preHandler }, async (request: any, reply) => {
    const { profileId } = request.params as { profileId: string }

    try {
      const [profile, queueEntry, latestEvent, stageTimeline, openWorkItems] = await Promise.all([
        prismaAny.marketplaceProfile.findUnique({
          where: { id: profileId },
          include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
        }),
        prismaAny.rotationQueueEntry.findFirst({
          where: {
            profileId,
            professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] },
          },
          orderBy: { createdAt: 'desc' },
        }),
        getLatestVerificationEvent(profileId),
        workflowStageService.getTimeline('PROFESSIONAL_ASSIGNMENT', profileId),
        workItemService.getOpenItemsForSubject('PROFESSIONAL_ASSIGNMENT', profileId),
      ])

      if (!profile) return reply.code(404).send({ error: 'Contractor profile not found' })

      const contractor = await prismaAny.contractorProfile.findFirst({
        where: { userId: profile.userId },
      })

      // Full verification event history for audit trail
      const eventHistory = await prismaAny.workflowEvent.findMany({
        where: {
          subjectType: 'PROFESSIONAL_ASSIGNMENT',
          subjectId:   profileId,
          eventType:   { startsWith: 'verification.' },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      const summary = buildSummary(profile, contractor, queueEntry, latestEvent)

      return reply.send({
        ...summary,
        user: profile.user,
        description:  profile.description ?? contractor?.description ?? null,
        serviceAreas: profile.serviceArea ?? contractor?.serviceArea ?? [],
        address:      contractor?.address ?? null,
        zip:          contractor?.zipCode ?? null,
        website:      null,
        allLicenses:  contractor?.insuranceInfo?.allLicenses ?? [],
        openWorkItems,
        stageTimeline: stageTimeline.stages,
        eventHistory: eventHistory.map((ev: any) => ({
          eventType:    ev.eventType,
          note:         ev.payload?.note ?? null,
          reviewedBy:   ev.payload?.reviewedByName ?? null,
          reviewedById: ev.payload?.reviewedById ?? null,
          createdAt:    ev.createdAt,
        })),
      })
    } catch (err: any) {
      fastify.log.error({ err }, 'Failed to fetch verification detail')
      return reply.code(500).send({ error: sanitizeErrorMessage(err, 'Failed to load contractor detail') })
    }
  })

  // ──────────────────────────────────────────────────────────────────────────
  // POST /admin/verification/:profileId/approve
  // Approve contractor → ELIGIBLE, mark verified flags, mirror workflow stage.
  // ──────────────────────────────────────────────────────────────────────────

  fastify.post('/verification/:profileId/approve', { preHandler }, async (request: any, reply) => {
    const { profileId }  = request.params as { profileId: string }
    const adminUser      = (request as any).user
    const { note }       = (request.body ?? {}) as { note?: string }

    try {
      const profile = await prismaAny.marketplaceProfile.findUnique({
        where: { id: profileId },
        select: { id: true, userId: true },
      })
      if (!profile) return reply.code(404).send({ error: 'Contractor profile not found' })

      // Get the current open VERIFICATION_REVIEW work item (if any)
      const openItems = await workItemService.getOpenItemsForSubject('PROFESSIONAL_ASSIGNMENT', profileId)
      const reviewItem = openItems.find((wi: any) => wi.type === 'VERIFICATION_REVIEW')

      // Run approval in parallel
      await Promise.all([
        // 1. Update RotationQueueEntry → ELIGIBLE
        prismaAny.rotationQueueEntry.updateMany({
          where:  { profileId, professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] } },
          data: {
            eligibility:        'ELIGIBLE',
            licenseVerified:    true,
            insuranceVerified:  true,
            licenseVerifiedAt:  new Date(),
            insuranceVerifiedAt: new Date(),
          },
        }),
        // 2. Update MarketplaceProfile.verified + acceptingLeads
        prismaAny.marketplaceProfile.update({
          where: { id: profileId },
          data:  { verified: true, acceptingLeads: true },
        }),
        // 3. Update ContractorProfile.isVerified
        prismaAny.contractorProfile.updateMany({
          where: { userId: profile.userId },
          data:  { isVerified: true, verifiedAt: new Date(), acceptingBids: true },
        }),
      ])

      // 4. Record workflow stage + event via orchestrator
      await workflowOrchestratorService.onVerificationApproved({
        orgId:            profileId, // using profileId as subject
        reviewedByUserId: adminUser.id,
        workItemId:       reviewItem?.id,
      })

      // 5. Emit verification.approved event with admin note
      await workflowEventService.emit({
        eventType:      'verification.approved',
        subjectType:    'PROFESSIONAL_ASSIGNMENT',
        subjectId:      profileId,
        idempotencyKey: WorkflowEventService.buildKey('verification.approved', 'PROFESSIONAL_ASSIGNMENT', profileId, adminUser.id),
        payload: {
          reviewedById:   adminUser.id,
          reviewedByName: adminUser.name,
          note:           note ?? null,
          approvedAt:     new Date().toISOString(),
        },
      })

      fastify.log.info({ profileId, adminId: adminUser.id }, 'Contractor approved')
      return reply.send({ success: true, verificationStatus: 'APPROVED' })
    } catch (err: any) {
      fastify.log.error({ err, profileId }, 'Approval failed')
      return reply.code(500).send({ error: sanitizeErrorMessage(err, 'Approval failed') })
    }
  })

  // ──────────────────────────────────────────────────────────────────────────
  // POST /admin/verification/:profileId/reject
  // Reject contractor — stays PENDING_VERIFICATION so they can resubmit.
  // ──────────────────────────────────────────────────────────────────────────

  const rejectSchema = z.object({
    note:   z.string().min(1, 'A rejection reason is required').max(2000),
    final:  z.boolean().optional().default(false), // true = INELIGIBLE (permanent)
  })

  fastify.post('/verification/:profileId/reject', { preHandler }, async (request: any, reply) => {
    const { profileId } = request.params as { profileId: string }
    const adminUser     = (request as any).user

    const parseResult = rejectSchema.safeParse(request.body ?? {})
    if (!parseResult.success) {
      return reply.code(400).send({ error: parseResult.error.issues[0]?.message ?? 'Validation failed' })
    }
    const { note, final } = parseResult.data

    try {
      const profile = await prismaAny.marketplaceProfile.findUnique({
        where: { id: profileId },
        select: { id: true, userId: true },
      })
      if (!profile) return reply.code(404).send({ error: 'Contractor profile not found' })

      const newEligibility = final ? 'INELIGIBLE' : 'PENDING_VERIFICATION'

      await Promise.all([
        prismaAny.rotationQueueEntry.updateMany({
          where: { profileId, professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] } },
          data:  { eligibility: newEligibility, licenseVerified: false, insuranceVerified: false },
        }),
        prismaAny.marketplaceProfile.update({
          where: { id: profileId },
          data:  { verified: false, acceptingLeads: false },
        }),
        prismaAny.contractorProfile.updateMany({
          where: { userId: profile.userId },
          data:  { isVerified: false, acceptingBids: false },
        }),
      ])

      await workflowOrchestratorService.onVerificationRejected({
        orgId:            profileId,
        reviewedByUserId: adminUser.id,
        reason:           note,
      })

      await workflowEventService.emit({
        eventType:      'verification.rejected',
        subjectType:    'PROFESSIONAL_ASSIGNMENT',
        subjectId:      profileId,
        idempotencyKey: WorkflowEventService.buildKey('verification.rejected', 'PROFESSIONAL_ASSIGNMENT', profileId, `${adminUser.id}:${Date.now()}`),
        payload: {
          reviewedById:   adminUser.id,
          reviewedByName: adminUser.name,
          note,
          final,
          rejectedAt: new Date().toISOString(),
        },
      })

      fastify.log.info({ profileId, adminId: adminUser.id, final }, 'Contractor rejected')
      return reply.send({ success: true, verificationStatus: final ? 'REJECTED' : 'REJECTED' })
    } catch (err: any) {
      fastify.log.error({ err, profileId }, 'Rejection failed')
      return reply.code(500).send({ error: sanitizeErrorMessage(err, 'Rejection failed') })
    }
  })

  // ──────────────────────────────────────────────────────────────────────────
  // POST /admin/verification/:profileId/request-info
  // Request additional documents — opens a work item, sends contractor a note.
  // ──────────────────────────────────────────────────────────────────────────

  const requestInfoSchema = z.object({
    note: z.string().min(1, 'Specify what information is needed').max(2000),
  })

  fastify.post('/verification/:profileId/request-info', { preHandler }, async (request: any, reply) => {
    const { profileId } = request.params as { profileId: string }
    const adminUser     = (request as any).user

    const parseResult = requestInfoSchema.safeParse(request.body ?? {})
    if (!parseResult.success) {
      return reply.code(400).send({ error: parseResult.error.issues[0]?.message ?? 'Validation failed' })
    }
    const { note } = parseResult.data

    try {
      const profile = await prismaAny.marketplaceProfile.findUnique({
        where: { id: profileId },
        select: { id: true, userId: true },
      })
      if (!profile) return reply.code(404).send({ error: 'Contractor profile not found' })

      // Cancel any existing open VERIFICATION_REVIEW work items first
      const openItems = await workItemService.getOpenItemsForSubject('PROFESSIONAL_ASSIGNMENT', profileId)
      await Promise.all(
        openItems
          .filter((wi: any) => wi.type === 'VERIFICATION_REVIEW')
          .map((wi: any) => workItemService.cancelWorkItem(wi.id))
      )

      // Create a new VERIFICATION_REVIEW work item assigned to the contractor
      await workItemService.createWorkItem({
        type:            'VERIFICATION_REVIEW',
        subjectType:     'PROFESSIONAL_ASSIGNMENT',
        subjectId:       profileId,
        assignedToUserId: profile.userId,
        title:           'Additional information requested by admin',
        description:     note,
        createdBySystem: true,
        metadata: {
          requestedById:   adminUser.id,
          requestedByName: adminUser.name,
        },
      })

      // Keep eligibility at PENDING_VERIFICATION
      await prismaAny.rotationQueueEntry.updateMany({
        where: { profileId, professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] } },
        data:  { eligibility: 'PENDING_VERIFICATION' },
      })

      await workflowEventService.emit({
        eventType:      'verification.needs_info',
        subjectType:    'PROFESSIONAL_ASSIGNMENT',
        subjectId:      profileId,
        idempotencyKey: WorkflowEventService.buildKey('verification.needs_info', 'PROFESSIONAL_ASSIGNMENT', profileId, `${adminUser.id}:${Date.now()}`),
        payload: {
          reviewedById:   adminUser.id,
          reviewedByName: adminUser.name,
          note,
          requestedAt: new Date().toISOString(),
        },
      })

      fastify.log.info({ profileId, adminId: adminUser.id }, 'Additional info requested')
      return reply.send({ success: true, verificationStatus: 'NEEDS_INFO' })
    } catch (err: any) {
      fastify.log.error({ err, profileId }, 'Request-info failed')
      return reply.code(500).send({ error: sanitizeErrorMessage(err, 'Request failed') })
    }
  })

  // ──────────────────────────────────────────────────────────────────────────
  // POST /admin/verification/:profileId/suspend
  // Suspend contractor — removes from lead rotation immediately.
  // ──────────────────────────────────────────────────────────────────────────

  const suspendSchema = z.object({
    note:   z.string().min(1, 'A suspension reason is required').max(2000),
    revert: z.boolean().optional().default(false), // true = unsuspend (back to PENDING)
  })

  fastify.post('/verification/:profileId/suspend', { preHandler }, async (request: any, reply) => {
    const { profileId } = request.params as { profileId: string }
    const adminUser     = (request as any).user

    const parseResult = suspendSchema.safeParse(request.body ?? {})
    if (!parseResult.success) {
      return reply.code(400).send({ error: parseResult.error.issues[0]?.message ?? 'Validation failed' })
    }
    const { note, revert } = parseResult.data

    try {
      const profile = await prismaAny.marketplaceProfile.findUnique({
        where: { id: profileId },
        select: { id: true, userId: true },
      })
      if (!profile) return reply.code(404).send({ error: 'Contractor profile not found' })

      const newEligibility = revert ? 'PENDING_VERIFICATION' : 'SUSPENDED'

      await Promise.all([
        prismaAny.rotationQueueEntry.updateMany({
          where: { profileId, professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] } },
          data:  { eligibility: newEligibility },
        }),
        prismaAny.marketplaceProfile.update({
          where: { id: profileId },
          data:  { verified: revert ? false : false, acceptingLeads: false },
        }),
        prismaAny.contractorProfile.updateMany({
          where: { userId: profile.userId },
          data:  { isActive: revert, acceptingBids: false },
        }),
      ])

      const eventType = revert ? 'verification.unsuspended' : 'verification.suspended'
      await workflowEventService.emit({
        eventType,
        subjectType:    'PROFESSIONAL_ASSIGNMENT',
        subjectId:      profileId,
        idempotencyKey: WorkflowEventService.buildKey(eventType, 'PROFESSIONAL_ASSIGNMENT', profileId, `${adminUser.id}:${Date.now()}`),
        payload: {
          reviewedById:   adminUser.id,
          reviewedByName: adminUser.name,
          note,
          suspendedAt: new Date().toISOString(),
        },
      })

      fastify.log.info({ profileId, adminId: adminUser.id, revert }, 'Contractor suspension updated')
      return reply.send({ success: true, verificationStatus: revert ? 'PENDING' : 'SUSPENDED' })
    } catch (err: any) {
      fastify.log.error({ err, profileId }, 'Suspend/unsuspend failed')
      return reply.code(500).send({ error: sanitizeErrorMessage(err, 'Suspend failed') })
    }
  })
}
