/**
 * professional-assignment.service.ts
 *
 * Implements the Kealee rotating professional lead assignment system.
 *
 * Business rules:
 *  1. SPONSORED_AD     → direct route to that professional; no queue involved
 *  2. PLATFORM_SERVICE → next ELIGIBLE professional in rotating queue
 *  3. OWNER_INVITED    → must have a registered RotationQueueEntry; else error
 *  4. 48-hour accept window; expiry handled by lead-assignment-expiry cron job
 *  5. PM/Ops software: softwareAccessOnly = true → skip license gate
 *  6. Lead access: requires licenseVerified + insuranceVerified
 *  7. Contractor engagement: project must be in a CONSTRUCTION_READY phase
 *
 * Uses `prismaAny` throughout (matches rest of codebase pattern) because the
 * new models exist in schema-src but may not yet be reflected in the generated
 * Prisma client type definitions until `prisma generate` is re-run.
 */

import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'
import { constructionEngagementService } from './construction-engagement.service'

// ─── Constants ───────────────────────────────────────────────────────────────

/** Seconds → milliseconds */
const HOURS_48_MS = 48 * 60 * 60 * 1000

/**
 * PreConProject phases that indicate a project is construction-ready.
 * Maps to business rule 7: "plans exist and permits are at least submitted."
 *
 * TEMPORARY COMPATIBILITY GATE
 * ─────────────────────────────
 * The canonical `ConstructionReadinessStatus` enum does not yet exist in the
 * platform schema.  Until it is introduced and back-filled on Project /
 * PreConProject, we proxy the readiness check using PreConProject.phase.
 *
 * These phases are considered construction-ready because:
 *   - BIDDING_OPEN        → design approved, SRP set, permits submitted
 *   - AWARDED             → contractor selected, ready to mobilise
 *   - CONTRACT_PENDING    → contract in final review
 *   - CONTRACT_RATIFIED   → fully executed, construction can begin
 *   - COMPLETED           → project complete (allow late engagement audits)
 *
 * When ConstructionReadinessStatus is added platform-wide, replace this Set
 * with a direct field check on the project record, e.g.:
 *   project.constructionReadiness === 'CONSTRUCTION_READY'
 *
 * Track in: docs/MIGRATION_ENGAGEMENT_HARDENING.sql (already exists)
 */
const CONSTRUCTION_READY_PHASES = new Set([
  'BIDDING_OPEN',
  'AWARDED',
  'CONTRACT_PENDING',
  'CONTRACT_RATIFIED',
  'COMPLETED',
])

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfessionalTypeValue = 'ARCHITECT' | 'ENGINEER' | 'CONTRACTOR' | 'DESIGN_BUILD'
export type LeadSourceTypeValue   = 'SPONSORED_AD' | 'PLATFORM_SERVICE' | 'OWNER_INVITED'
export type AssignmentStatusValue = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'FORFEITED'
export type EligibilityValue      = 'ELIGIBLE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'INELIGIBLE'

export interface RouteLeadInput {
  leadId:             string
  professionalType:   ProfessionalTypeValue
  sourceType:         LeadSourceTypeValue
  /** Required when sourceType = OWNER_INVITED */
  invitedProfileId?:  string
  /** Override accept-window length in milliseconds (for testing) */
  acceptWindowMs?:    number
  triggeredByUserId?: string
}

export interface AssignmentResult {
  success:    boolean
  assignment?: any
  reason?:    string
  message?:   string
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const professionalAssignmentService = {

  // ── 1. ROUTE LEAD ──────────────────────────────────────────────────────────

  /**
   * Main entry point.  Determines routing path from sourceType and creates a
   * ProfessionalAssignment with a 48-hour accept window.
   *
   * Callers:
   *  - POST /marketplace/leads/:leadId/route
   *  - Internal: called after a lead is created or the previous assignment expires/is declined
   */
  async routeLead(input: RouteLeadInput): Promise<AssignmentResult> {
    const { leadId, professionalType, sourceType, invitedProfileId, triggeredByUserId } = input
    const acceptWindowMs = input.acceptWindowMs ?? HOURS_48_MS

    // Verify lead exists
    const lead = await prismaAny.lead.findUnique({ where: { id: leadId } })
    if (!lead) throw new NotFoundError('Lead', leadId)

    // Guard: only one PENDING assignment at a time per lead
    const existingPending = await prismaAny.professionalAssignment.findFirst({
      where: { leadId, status: 'PENDING' },
    })
    if (existingPending) {
      return {
        success: false,
        reason:  'ASSIGNMENT_ALREADY_PENDING',
        message: `Lead ${leadId} already has a pending assignment (id: ${existingPending.id}).  Wait for it to be accepted, declined, or expire.`,
      }
    }

    // Stamp sourceType / professionalType on the lead if not already set
    await prismaAny.lead.update({
      where: { id: leadId },
      data: {
        sourceType:         sourceType,
        professionalType:   professionalType,
        ...(invitedProfileId ? { invitedProfileId } : {}),
      },
    })

    switch (sourceType) {
      case 'SPONSORED_AD':
        return this._routeSponsored(leadId, professionalType, invitedProfileId!, acceptWindowMs, triggeredByUserId)

      case 'PLATFORM_SERVICE':
        return this._routeRotation(leadId, professionalType, acceptWindowMs, triggeredByUserId)

      case 'OWNER_INVITED':
        if (!invitedProfileId) {
          return {
            success: false,
            reason:  'INVITED_PROFILE_REQUIRED',
            message: 'invitedProfileId is required when sourceType = OWNER_INVITED',
          }
        }
        return this._routeOwnerInvited(leadId, professionalType, invitedProfileId, acceptWindowMs, triggeredByUserId)

      default:
        return { success: false, reason: 'UNKNOWN_SOURCE_TYPE', message: `Unknown sourceType: ${sourceType}` }
    }
  },

  /**
   * SPONSORED_AD: direct-route to the sponsored professional.
   * Bypasses queue ordering and eligibility rotation (but still checks
   * that the profile exists and is active).
   */
  async _routeSponsored(
    leadId:           string,
    professionalType: ProfessionalTypeValue,
    profileId:        string,
    acceptWindowMs:   number,
    triggeredByUserId?: string,
  ): Promise<AssignmentResult> {
    const profile = await prismaAny.marketplaceProfile.findUnique({
      where:   { id: profileId },
      include: { user: { select: { id: true, status: true } } },
    })

    if (!profile) {
      return { success: false, reason: 'PROFILE_NOT_FOUND', message: `MarketplaceProfile ${profileId} not found` }
    }
    if (profile.user?.status !== 'ACTIVE') {
      return { success: false, reason: 'PROFILE_INACTIVE', message: 'Sponsored professional account is not active' }
    }

    const assignment = await this._createAssignment({
      leadId,
      profileId,
      professionalType,
      sourceType:       'SPONSORED_AD',
      rotationPosition: null, // bypasses queue
      acceptWindowMs,
    })

    await this._emitAndAudit('LEAD_ROUTED_SPONSORED', leadId, triggeredByUserId, {
      profileId, professionalType,
    })

    return { success: true, assignment }
  },

  /**
   * PLATFORM_SERVICE: pick the next ELIGIBLE professional in the rotating queue.
   * Ordering: lastAssignedAt ASC NULLS FIRST (never-assigned = highest priority).
   * Skips professionals who have already been offered this specific lead.
   */
  async _routeRotation(
    leadId:           string,
    professionalType: ProfessionalTypeValue,
    acceptWindowMs:   number,
    triggeredByUserId?: string,
  ): Promise<AssignmentResult> {
    const candidate = await this.getNextInQueue(leadId, professionalType)

    if (!candidate) {
      return {
        success: false,
        reason:  'NO_ELIGIBLE_PROFESSIONAL',
        message: `No ELIGIBLE ${professionalType} in rotation for lead ${leadId}.  All available professionals have already been offered this lead or the queue is empty.`,
      }
    }

    const assignment = await this._createAssignment({
      leadId,
      profileId:        candidate.profileId,
      professionalType,
      sourceType:       'PLATFORM_SERVICE',
      rotationPosition: candidate.position,
      acceptWindowMs,
    })

    // Update queue entry: stamp lastAssignedAt, increment totalOffered
    await prismaAny.rotationQueueEntry.update({
      where: { id: candidate.entryId },
      data: {
        lastAssignedAt: new Date(),
        totalOffered:   { increment: 1 },
      },
    })

    await this._emitAndAudit('LEAD_ROUTED_ROTATION', leadId, triggeredByUserId, {
      profileId: candidate.profileId, professionalType, rotationPosition: candidate.position,
    })

    return { success: true, assignment }
  },

  /**
   * OWNER_INVITED: owner wants a specific professional.
   * Requires that professional to have a RotationQueueEntry (i.e. registered in Kealee).
   * The entry does NOT need to be ELIGIBLE — the invite bypasses rotation order — but it
   * MUST exist (enforces the "must register through Kealee" rule).
   * License/insurance check is still applied for lead access.
   */
  async _routeOwnerInvited(
    leadId:           string,
    professionalType: ProfessionalTypeValue,
    profileId:        string,
    acceptWindowMs:   number,
    triggeredByUserId?: string,
  ): Promise<AssignmentResult> {
    const entry = await prismaAny.rotationQueueEntry.findUnique({
      where: { profileId_professionalType: { profileId, professionalType } },
    })

    if (!entry) {
      return {
        success: false,
        reason:  'PROFESSIONAL_NOT_REGISTERED',
        message: 'The invited professional must register through Kealee before they can receive leads.  Send them an invitation link.',
      }
    }

    // Business rule 6: lead access requires verified license + insurance
    // (unless softwareAccessOnly — but softwareAccessOnly means no lead access at all)
    if (entry.softwareAccessOnly) {
      return {
        success: false,
        reason:  'SOFTWARE_ACCESS_ONLY',
        message: 'This professional has a PM/Ops software-only account and cannot receive leads.',
      }
    }

    const eligibilityCheck = this._checkLeadEligibility(entry)
    if (!eligibilityCheck.eligible) {
      return {
        success: false,
        reason:  eligibilityCheck.reason!,
        message: eligibilityCheck.message!,
      }
    }

    const assignment = await this._createAssignment({
      leadId,
      profileId,
      professionalType,
      sourceType:       'OWNER_INVITED',
      rotationPosition: null, // bypasses queue position
      acceptWindowMs,
    })

    // Still update lastAssignedAt so the fair-rotation position isn't gamed by
    // repeatedly being owner-invited without advancing the queue
    await prismaAny.rotationQueueEntry.update({
      where: { id: entry.id },
      data: {
        lastAssignedAt: new Date(),
        totalOffered:   { increment: 1 },
      },
    })

    await this._emitAndAudit('LEAD_ROUTED_OWNER_INVITED', leadId, triggeredByUserId, {
      profileId, professionalType,
    })

    return { success: true, assignment }
  },

  // ── 2. ACCEPT ──────────────────────────────────────────────────────────────

  /**
   * Professional accepts their lead offer.
   * Must be called within 48 hours.
   */
  async acceptAssignment(assignmentId: string, userId: string): Promise<any> {
    const assignment = await prismaAny.professionalAssignment.findUnique({
      where:   { id: assignmentId },
      include: { profile: true, lead: true },
    })

    if (!assignment) throw new NotFoundError('ProfessionalAssignment', assignmentId)

    if (assignment.status !== 'PENDING') {
      throw new Error(`Assignment ${assignmentId} is not PENDING (current: ${assignment.status})`)
    }

    const now = new Date()
    if (now > new Date(assignment.acceptDeadline)) {
      throw new Error(`Assignment ${assignmentId} accept window has expired (deadline: ${assignment.acceptDeadline})`)
    }

    const updated = await prismaAny.professionalAssignment.update({
      where: { id: assignmentId },
      data: {
        status:      'ACCEPTED',
        respondedAt: now,
      },
    })

    // Update rotation queue stats
    await prismaAny.rotationQueueEntry.updateMany({
      where: {
        profileId:        assignment.profileId,
        professionalType: assignment.professionalType,
      },
      data: {
        lastAssignedAt: now,
        totalAccepted:  { increment: 1 },
      },
    })

    // Update lead stage to DISTRIBUTED (first accepted assignment = lead has a home)
    await prismaAny.lead.update({
      where: { id: assignment.leadId },
      data:  { stage: 'DISTRIBUTED', stageChangedAt: now },
    })

    await this._emitAndAudit('ASSIGNMENT_ACCEPTED', assignment.leadId, userId, {
      assignmentId,
      profileId:        assignment.profileId,
      professionalType: assignment.professionalType,
    })

    return updated
  },

  // ── 3. DECLINE ─────────────────────────────────────────────────────────────

  /**
   * Professional declines their lead offer.
   * Lead is immediately forwarded to the next professional in queue.
   */
  async declineAssignment(
    assignmentId:    string,
    userId:          string,
    declineReason?:  string,
    acceptWindowMs?: number,
  ): Promise<AssignmentResult> {
    const assignment = await prismaAny.professionalAssignment.findUnique({
      where: { id: assignmentId },
    })

    if (!assignment) throw new NotFoundError('ProfessionalAssignment', assignmentId)

    if (assignment.status !== 'PENDING') {
      throw new Error(`Assignment ${assignmentId} is not PENDING (current: ${assignment.status})`)
    }

    const now = new Date()

    await prismaAny.professionalAssignment.update({
      where: { id: assignmentId },
      data: {
        status:       'DECLINED',
        respondedAt:  now,
        declineReason,
      },
    })

    // Update queue stats
    await prismaAny.rotationQueueEntry.updateMany({
      where: {
        profileId:        assignment.profileId,
        professionalType: assignment.professionalType,
      },
      data: { totalDeclined: { increment: 1 } },
    })

    await this._emitAndAudit('ASSIGNMENT_DECLINED', assignment.leadId, userId, {
      assignmentId, profileId: assignment.profileId, declineReason,
    })

    // Forward to next in queue (same acceptWindowMs if provided, else default 48h)
    return this._routeRotation(assignment.leadId, assignment.professionalType, acceptWindowMs ?? HOURS_48_MS, userId)
  },

  // ── 4. EXPIRY (called by worker cron) ──────────────────────────────────────

  /**
   * Scans all PENDING assignments past their acceptDeadline, marks them
   * FORFEITED, pushes the professional to the back of the queue, and
   * routes the lead to the next eligible professional.
   *
   * Called by the lead-assignment-expiry cron job every 30 minutes.
   * Returns count of processed assignments.
   */
  async processExpiredAssignments(): Promise<{ processed: number; errors: string[] }> {
    const now = new Date()
    const errors: string[] = []

    // Find all PENDING assignments past their deadline
    const expired = await prismaAny.professionalAssignment.findMany({
      where: {
        status:          'PENDING',
        acceptDeadline:  { lt: now },
      },
      // Safety cap: process at most 100 per cron tick to avoid long lock times
      take: 100,
    })

    let processed = 0

    for (const assignment of expired) {
      try {
        // Step 1: Mark EXPIRED (synchronous intermediate state so we don't
        //         double-process if the cron fires while we're mid-loop)
        await prismaAny.professionalAssignment.update({
          where: { id: assignment.id },
          data: { status: 'EXPIRED', forwardedAt: now },
        })

        // Step 2: Update queue entry → lastForwardedAt (pushes to back of queue),
        //         increment totalForfeited
        await prismaAny.rotationQueueEntry.updateMany({
          where: {
            profileId:        assignment.profileId,
            professionalType: assignment.professionalType,
          },
          data: {
            lastForwardedAt: now,
            // Stamp lastAssignedAt again so this professional sits behind others
            // who haven't been offered a lead recently
            lastAssignedAt:  now,
            totalForfeited:  { increment: 1 },
          },
        })

        // Step 3: Mark FORFEITED (final terminal state)
        await prismaAny.professionalAssignment.update({
          where: { id: assignment.id },
          data: { status: 'FORFEITED' },
        })

        await this._emitAndAudit('ASSIGNMENT_FORFEITED', assignment.leadId, 'system', {
          assignmentId: assignment.id,
          profileId:    assignment.profileId,
          professionalType: assignment.professionalType,
        })

        // Step 4: Route lead to next in queue
        await this._routeRotation(
          assignment.leadId,
          assignment.professionalType,
          HOURS_48_MS,
          'system',
        )

        processed++
      } catch (err: any) {
        errors.push(`Assignment ${assignment.id}: ${err?.message ?? String(err)}`)
      }
    }

    return { processed, errors }
  },

  // ── 5. QUEUE HELPERS ───────────────────────────────────────────────────────

  /**
   * Returns the next ELIGIBLE professional in the rotating queue for a given
   * professional type, excluding anyone who has already been offered this lead.
   *
   * Ordering: lastAssignedAt ASC NULLS FIRST.
   * "Never assigned" professionals (null lastAssignedAt) go first.
   */
  async getNextInQueue(
    leadId:           string,
    professionalType: ProfessionalTypeValue,
  ): Promise<{ entryId: string; profileId: string; position: number } | null> {
    // IDs of professionals already offered this lead (any terminal status)
    const previouslyOffered = await prismaAny.professionalAssignment.findMany({
      where:  { leadId },
      select: { profileId: true },
    })
    const excludeProfileIds = previouslyOffered.map((a: any) => a.profileId)

    // Fetch the first ELIGIBLE queue entry ordered by lastAssignedAt ASC NULLS FIRST
    // (never-assigned professionals have null lastAssignedAt and sort first).
    const first = await prismaAny.rotationQueueEntry.findFirst({
      where: {
        professionalType,
        eligibility:        'ELIGIBLE',
        softwareAccessOnly: false,
        ...(excludeProfileIds.length > 0 ? { profileId: { notIn: excludeProfileIds } } : {}),
      },
      orderBy: [{ lastAssignedAt: 'asc' }],
    })

    if (!first) return null
    return { entryId: first.id, profileId: first.profileId, position: 0 }
  },

  /**
   * Register (upsert) a RotationQueueEntry for a professional.
   * Called when a professional completes onboarding / verification.
   *
   * @param softwareAccessOnly  true → PM/Ops access without lead eligibility
   * @param licenseVerified     true → passes business rule 6 license check
   * @param insuranceVerified   true → passes business rule 6 insurance check
   */
  async upsertQueueEntry(input: {
    profileId:           string
    professionalType:    ProfessionalTypeValue
    softwareAccessOnly?: boolean
    licenseVerified?:    boolean
    insuranceVerified?:  boolean
  }): Promise<any> {
    const {
      profileId,
      professionalType,
      softwareAccessOnly  = false,
      licenseVerified     = false,
      insuranceVerified   = false,
    } = input

    // Derive eligibility
    let eligibility: EligibilityValue = 'PENDING_VERIFICATION'
    if (softwareAccessOnly) {
      // Software-only accounts stay PENDING_VERIFICATION so they're never
      // selected by getNextInQueue(), but the row exists to gate registration
      eligibility = 'PENDING_VERIFICATION'
    } else if (licenseVerified && insuranceVerified) {
      eligibility = 'ELIGIBLE'
    }

    return prismaAny.rotationQueueEntry.upsert({
      where: { profileId_professionalType: { profileId, professionalType } },
      create: {
        profileId,
        professionalType,
        eligibility,
        softwareAccessOnly,
        licenseVerified,
        insuranceVerified,
        ...(licenseVerified  ? { licenseVerifiedAt:   new Date() } : {}),
        ...(insuranceVerified ? { insuranceVerifiedAt: new Date() } : {}),
      },
      update: {
        eligibility,
        softwareAccessOnly,
        licenseVerified,
        insuranceVerified,
        ...(licenseVerified  ? { licenseVerifiedAt:   new Date() } : {}),
        ...(insuranceVerified ? { insuranceVerifiedAt: new Date() } : {}),
      },
    })
  },

  // ── 6. CONTRACTOR ENGAGEMENT ───────────────────────────────────────────────

  /**
   * Formally engage a contractor on a project.
   *
   * Business rules 7–9:
   *   - Plans must exist (PreConProject linked to the lead's project)
   *   - Project must be CONSTRUCTION_READY — dual-path check:
   *       Path A (canonical): Project.constructionReadiness === 'CONSTRUCTION_READY'
   *       Path B (fallback):  PreConProject.phase in CONSTRUCTION_READY_PHASES
   *     Path A is preferred; Path B is a backward-compat shim for projects not yet
   *     migrated via constructionEngagementService.markConstructionReady().
   *     Remove Path B once all projects are migrated.  See ConstructionReadinessStatus
   *     enum comment in schema-src/pm/enums.prisma.
   *   - Contractor must have an ACCEPTED ProfessionalAssignment for this lead
   *   - Contractor must have an ELIGIBLE RotationQueueEntry (license + insurance verified)
   *
   * After all guards pass:
   *   1. Awards the lead (stage = WON, awardedProfileId set)
   *   2. Updates contractor pipeline stats (lastWonAt, projectsCompleted)
   *   3. Calls constructionEngagementService.initializeEngagement() to auto-create
   *      the contract, milestones, escrow account, and initial notifications.
   *      Step 3 is best-effort; partial failures are logged but do NOT abort the award.
   */
  async engageContractor(input: {
    leadId:    string
    profileId: string
    userId:    string
  }): Promise<any> {
    const { leadId, profileId, userId } = input

    const lead = await prismaAny.lead.findUnique({
      where:   { id: leadId },
      include: {
        project: {
          select: {
            id:                    true,
            ownerId:               true,
            category:              true,
            constructionReadiness: true,
            preConProject: {
              select: {
                id:             true,
                phase:          true,
                contractAmount: true,
                category:       true,
              },
            },
          },
        },
      },
    })

    if (!lead) throw new NotFoundError('Lead', leadId)

    // Guard: must have an accepted assignment from this contractor
    const accepted = await prismaAny.professionalAssignment.findFirst({
      where: { leadId, profileId, status: 'ACCEPTED' },
    })
    if (!accepted) {
      throw new Error(
        `Cannot engage contractor ${profileId} on lead ${leadId}: no ACCEPTED assignment found.`
      )
    }

    // Guard: verify contractor's queue entry passes license + insurance
    const queueEntry = await prismaAny.rotationQueueEntry.findFirst({
      where: {
        profileId,
        professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] },
        eligibility:      'ELIGIBLE',
      },
    })
    if (!queueEntry) {
      throw new Error(
        `Contractor ${profileId} does not have an ELIGIBLE queue entry (license/insurance not verified).`
      )
    }

    // Guard: construction readiness — dual-path check
    // Path A: canonical ConstructionReadinessStatus field
    const isCanonicallyReady =
      lead.project?.constructionReadiness === 'CONSTRUCTION_READY'

    // Path B: TEMPORARY COMPATIBILITY GATE — PreConPhase proxy
    // Remove this path once Project.constructionReadiness is populated for all projects.
    const preConProject  = lead.project?.preConProject
    const isPhaseReady   = preConProject != null && CONSTRUCTION_READY_PHASES.has(preConProject.phase)

    if (!preConProject) {
      throw new Error(
        'Cannot engage contractor: no PreConProject linked to this lead\'s project.  Plans must exist.'
      )
    }

    if (!isCanonicallyReady && !isPhaseReady) {
      throw new Error(
        `Cannot engage contractor: project is not construction-ready. ` +
        `constructionReadiness="${lead.project?.constructionReadiness ?? 'NOT_SET'}", ` +
        `preConPhase="${preConProject.phase}". ` +
        `Required: constructionReadiness=CONSTRUCTION_READY OR preConPhase in ` +
        `[${[...CONSTRUCTION_READY_PHASES].join(', ')}] (plans approved and permits submitted).`
      )
    }

    // Log a warning when passing via the fallback path only
    if (!isCanonicallyReady && isPhaseReady) {
      await this._emitAndAudit('CONSTRUCTION_READINESS_FALLBACK_USED', leadId, userId, {
        note:          'Engagement approved via PreConPhase fallback; canonical constructionReadiness not set.',
        preConPhase:   preConProject.phase,
        profileId,
      })
    }

    // Look up contractor's User.id for contract + notification creation
    const contractorProfile = await prismaAny.marketplaceProfile.findUnique({
      where:  { id: profileId },
      select: { userId: true },
    })

    // All checks passed — award contractor on lead
    const updatedLead = await prismaAny.lead.update({
      where: { id: leadId },
      data: {
        awardedProfileId: profileId,
        stage:            'WON',
        wonAt:            new Date(),
        stageChangedAt:   new Date(),
      },
    })

    // Update contractor pipeline stats
    await prismaAny.marketplaceProfile.update({
      where: { id: profileId },
      data: {
        lastWonAt:         new Date(),
        projectsCompleted: { increment: 1 },
      },
    })

    await this._emitAndAudit('CONTRACTOR_ENGAGED', leadId, userId, {
      profileId,
      preConProjectId:    preConProject.id,
      preConProjectPhase: preConProject.phase,
      isCanonicallyReady,
    })

    // Auto-initialize engagement lifecycle: contract + milestones + escrow + notifications
    // Best-effort: partial failures are logged but do NOT abort the lead award.
    if (lead.projectId && contractorProfile?.userId && lead.project?.ownerId) {
      const contractAmount =
        Number(preConProject.contractAmount) ||
        Number(lead.srp) ||
        Number(lead.estimatedValue) ||
        0

      const engagementResult = await constructionEngagementService.initializeEngagement({
        leadId,
        profileId,
        contractorUserId:  contractorProfile.userId,
        ownerUserId:       lead.project.ownerId,
        projectId:         lead.projectId,
        contractAmount,
        projectCategory:   lead.project.category ?? preConProject.category ?? undefined,
        triggeredByUserId: userId,
      })

      // Surface partial failures in the response payload so callers can inspect
      if (engagementResult.errors?.length) {
        await this._emitAndAudit('CONSTRUCTION_ENGAGEMENT_PARTIAL_FAILURE', leadId, userId, {
          errors: engagementResult.errors,
        })
      }

      return { ...updatedLead, _engagement: engagementResult }
    }

    // Warn if we couldn't auto-initialize (missing projectId or user IDs)
    await this._emitAndAudit('CONSTRUCTION_ENGAGEMENT_SKIPPED', leadId, userId, {
      reason:       'Missing projectId, contractorUserId, or ownerUserId — run manual init.',
      projectId:    lead.projectId,
      contractorId: contractorProfile?.userId,
      ownerId:      lead.project?.ownerId,
    })

    return updatedLead
  },

  // ── 7. READ HELPERS ────────────────────────────────────────────────────────

  async getAssignment(assignmentId: string): Promise<any> {
    const assignment = await prismaAny.professionalAssignment.findUnique({
      where:   { id: assignmentId },
      include: {
        lead:    { select: { id: true, category: true, stage: true, estimatedValue: true } },
        profile: { select: { id: true, businessName: true, userId: true } },
      },
    })
    if (!assignment) throw new NotFoundError('ProfessionalAssignment', assignmentId)
    return assignment
  },

  async listAssignmentsForLead(leadId: string): Promise<any[]> {
    return prismaAny.professionalAssignment.findMany({
      where:   { leadId },
      include: { profile: { select: { id: true, businessName: true } } },
      orderBy: { assignedAt: 'asc' },
    })
  },

  async getQueueSnapshot(professionalType: ProfessionalTypeValue): Promise<any[]> {
    return prismaAny.rotationQueueEntry.findMany({
      where:   { professionalType },
      include: { profile: { select: { id: true, businessName: true, userId: true } } },
      orderBy: [{ lastAssignedAt: 'asc' }],
    })
  },

  // ── Internal helpers ───────────────────────────────────────────────────────

  /** Validate that a queue entry passes the lead-access gate (rule 6). */
  _checkLeadEligibility(entry: any): { eligible: boolean; reason?: string; message?: string } {
    if (entry.eligibility === 'SUSPENDED') {
      return { eligible: false, reason: 'QUEUE_SUSPENDED', message: 'This professional\'s queue entry is suspended by an admin.' }
    }
    if (entry.eligibility === 'INELIGIBLE') {
      return { eligible: false, reason: 'QUEUE_INELIGIBLE', message: 'This professional is ineligible for lead access.' }
    }
    if (!entry.licenseVerified) {
      return { eligible: false, reason: 'LICENSE_NOT_VERIFIED', message: 'Platform lead access requires a verified license.' }
    }
    if (!entry.insuranceVerified) {
      return { eligible: false, reason: 'INSURANCE_NOT_VERIFIED', message: 'Platform lead access requires verified insurance.' }
    }
    return { eligible: true }
  },

  /** Create a ProfessionalAssignment row. */
  async _createAssignment(input: {
    leadId:           string
    profileId:        string
    professionalType: ProfessionalTypeValue
    sourceType:       LeadSourceTypeValue
    rotationPosition: number | null
    acceptWindowMs:   number
  }): Promise<any> {
    const now            = new Date()
    const acceptDeadline = new Date(now.getTime() + input.acceptWindowMs)

    return prismaAny.professionalAssignment.create({
      data: {
        leadId:           input.leadId,
        profileId:        input.profileId,
        professionalType: input.professionalType,
        sourceType:       input.sourceType,
        status:           'PENDING',
        rotationPosition: input.rotationPosition,
        assignedAt:       now,
        acceptDeadline,
      },
    })
  },

  /** Fire audit + event records (best-effort; never throws). */
  async _emitAndAudit(
    eventType: string,
    leadId:    string,
    userId:    string | undefined,
    payload:   Record<string, any>,
  ): Promise<void> {
    await Promise.allSettled([
      auditService.recordAudit({
        action:     eventType,
        entityType: 'Lead',
        entityId:   leadId,
        userId:     userId ?? 'system',
        after:      payload,
      }),
      eventService.recordEvent({
        type:       eventType,
        entityType: 'Lead',
        entityId:   leadId,
        userId,
        payload:    { leadId, ...payload },
      }),
    ])
  },
}
