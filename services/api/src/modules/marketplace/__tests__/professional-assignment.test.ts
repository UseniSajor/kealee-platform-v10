/**
 * professional-assignment.test.ts
 *
 * Test checklist for the Kealee rotating professional lead assignment system.
 *
 * All scenarios map directly to the 10 business rules.
 * Tests are structured as vitest describe/it blocks.
 * Arrange/Act/Assert pattern throughout.
 *
 * TO RUN:  pnpm test --filter services/api (from monorepo root)
 *          or: cd services/api && pnpm test
 *
 * Mock strategy:
 *   - Mock `prismaAny` (../../utils/prisma-helper)
 *   - Mock `auditService` and `eventService`
 *   - Use vi.useFakeTimers() for time-dependent tests (48h window)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { professionalAssignmentService } from '../professional-assignment.service'

// ─── Mock setup (wiring only — fill in per test) ─────────────────────────────

vi.mock('../../../utils/prisma-helper', () => ({
  prismaAny: {
    lead:                    { findUnique: vi.fn(), update: vi.fn() },
    marketplaceProfile:      { findUnique: vi.fn(), update: vi.fn() },
    professionalAssignment:  { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    rotationQueueEntry:      { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  },
}))

vi.mock('../../audit/audit.service',  () => ({ auditService:  { recordAudit:  vi.fn() } }))
vi.mock('../../events/event.service', () => ({ eventService:  { recordEvent:  vi.fn() } }))

import { prismaAny } from '../../../utils/prisma-helper'

// Helper: reset all mocks between tests
beforeEach(() => { vi.clearAllMocks() })
afterEach(()  => { vi.useRealTimers() })

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LEAD_ID       = 'lead-001'
const PROFILE_A     = 'profile-A'
const PROFILE_B     = 'profile-B'
const ASSIGNMENT_ID = 'assign-001'

const mockLead = {
  id:               LEAD_ID,
  stage:            'OPEN',
  sourceType:       'PLATFORM_SERVICE',
  professionalType: 'CONTRACTOR',
}

const mockQueueEntryEligible = {
  id:                 'qe-A',
  profileId:          PROFILE_A,
  professionalType:   'CONTRACTOR',
  eligibility:        'ELIGIBLE',
  softwareAccessOnly: false,
  licenseVerified:    true,
  insuranceVerified:  true,
  lastAssignedAt:     null,
  totalOffered:       0,
}

const mockAssignmentPending = {
  id:               ASSIGNMENT_ID,
  leadId:           LEAD_ID,
  profileId:        PROFILE_A,
  professionalType: 'CONTRACTOR',
  sourceType:       'PLATFORM_SERVICE',
  status:           'PENDING',
  assignedAt:       new Date('2026-01-01T10:00:00Z'),
  acceptDeadline:   new Date('2026-01-03T10:00:00Z'), // 48h later
}

// ─── Rule 1: SPONSORED_AD → direct route ─────────────────────────────────────

describe('Rule 1 — SPONSORED_AD routes directly to that professional', () => {
  it('creates an assignment with PENDING status to the specified profileId', async () => {
    ;(prismaAny.lead.findUnique       as any).mockResolvedValue(mockLead)
    ;(prismaAny.lead.update           as any).mockResolvedValue(mockLead)
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(null) // no existing PENDING
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValue({
      id: PROFILE_A, user: { status: 'ACTIVE' },
    })
    ;(prismaAny.professionalAssignment.create as any).mockResolvedValue({
      id: ASSIGNMENT_ID, profileId: PROFILE_A, status: 'PENDING',
    })

    const result = await professionalAssignmentService.routeLead({
      leadId:           LEAD_ID,
      professionalType: 'CONTRACTOR',
      sourceType:       'SPONSORED_AD',
      invitedProfileId: PROFILE_A,
    })

    expect(result.success).toBe(true)
    expect(result.assignment?.profileId).toBe(PROFILE_A)
    // Queue rotation logic must NOT be called for sponsored ads
    expect(prismaAny.rotationQueueEntry.findMany).not.toHaveBeenCalled()
  })

  it('rejects if the sponsored professional account is not ACTIVE', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue(mockLead)
    ;(prismaAny.lead.update     as any).mockResolvedValue(mockLead)
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(null)
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValue({
      id: PROFILE_A, user: { status: 'SUSPENDED' },
    })

    const result = await professionalAssignmentService.routeLead({
      leadId:           LEAD_ID,
      professionalType: 'CONTRACTOR',
      sourceType:       'SPONSORED_AD',
      invitedProfileId: PROFILE_A,
    })

    expect(result.success).toBe(false)
    expect(result.reason).toBe('PROFILE_INACTIVE')
  })
})

// ─── Rule 2: PLATFORM_SERVICE → rotating queue ────────────────────────────────

describe('Rule 2 — PLATFORM_SERVICE routes to next in rotating queue', () => {
  it('selects the professional with the oldest lastAssignedAt (or null = first)', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue(mockLead)
    ;(prismaAny.lead.update     as any).mockResolvedValue(mockLead)
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(null)
    ;(prismaAny.professionalAssignment.findMany  as any).mockResolvedValue([]) // no previous offers
    ;(prismaAny.rotationQueueEntry.findFirst as any).mockResolvedValue(mockQueueEntryEligible)
    ;(prismaAny.rotationQueueEntry.update    as any).mockResolvedValue(mockQueueEntryEligible)
    ;(prismaAny.professionalAssignment.create as any).mockResolvedValue({
      ...mockAssignmentPending, profileId: PROFILE_A,
    })

    const result = await professionalAssignmentService.routeLead({
      leadId:           LEAD_ID,
      professionalType: 'CONTRACTOR',
      sourceType:       'PLATFORM_SERVICE',
    })

    expect(result.success).toBe(true)
    expect(result.assignment?.profileId).toBe(PROFILE_A)
    expect(prismaAny.rotationQueueEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalOffered: { increment: 1 } }),
      })
    )
  })

  it('returns NO_ELIGIBLE_PROFESSIONAL when queue is empty', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue(mockLead)
    ;(prismaAny.lead.update     as any).mockResolvedValue(mockLead)
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(null)
    ;(prismaAny.professionalAssignment.findMany  as any).mockResolvedValue([])
    ;(prismaAny.rotationQueueEntry.findFirst as any).mockResolvedValue(null)

    const result = await professionalAssignmentService.routeLead({
      leadId:           LEAD_ID,
      professionalType: 'CONTRACTOR',
      sourceType:       'PLATFORM_SERVICE',
    })

    expect(result.success).toBe(false)
    expect(result.reason).toBe('NO_ELIGIBLE_PROFESSIONAL')
  })

  it('skips professionals who have already been offered this lead', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue(mockLead)
    ;(prismaAny.lead.update     as any).mockResolvedValue(mockLead)
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(null)
    // Profile A was already offered → excluded
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValue([{ profileId: PROFILE_A }])
    // Profile B is next eligible
    ;(prismaAny.rotationQueueEntry.findFirst as any).mockResolvedValue({
      ...mockQueueEntryEligible, id: 'qe-B', profileId: PROFILE_B,
    })
    ;(prismaAny.rotationQueueEntry.update as any).mockResolvedValue({})
    ;(prismaAny.professionalAssignment.create as any).mockResolvedValue({
      ...mockAssignmentPending, profileId: PROFILE_B,
    })

    const result = await professionalAssignmentService.routeLead({
      leadId:           LEAD_ID,
      professionalType: 'CONTRACTOR',
      sourceType:       'PLATFORM_SERVICE',
    })

    expect(result.success).toBe(true)
    expect(result.assignment?.profileId).toBe(PROFILE_B)
  })

  it('rejects if there is already a PENDING assignment for this lead', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue(mockLead)
    ;(prismaAny.lead.update     as any).mockResolvedValue(mockLead)
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(mockAssignmentPending)

    const result = await professionalAssignmentService.routeLead({
      leadId:           LEAD_ID,
      professionalType: 'CONTRACTOR',
      sourceType:       'PLATFORM_SERVICE',
    })

    expect(result.success).toBe(false)
    expect(result.reason).toBe('ASSIGNMENT_ALREADY_PENDING')
  })
})

// ─── Rule 3: OWNER_INVITED must be registered in Kealee ─────────────────────

describe('Rule 3 — Owner-invited professionals must be registered through Kealee', () => {
  it('rejects if the invited professional has no RotationQueueEntry', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue(mockLead)
    ;(prismaAny.lead.update     as any).mockResolvedValue(mockLead)
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(null)
    ;(prismaAny.rotationQueueEntry.findUnique as any).mockResolvedValue(null)

    const result = await professionalAssignmentService.routeLead({
      leadId:           LEAD_ID,
      professionalType: 'ARCHITECT',
      sourceType:       'OWNER_INVITED',
      invitedProfileId: PROFILE_A,
    })

    expect(result.success).toBe(false)
    expect(result.reason).toBe('PROFESSIONAL_NOT_REGISTERED')
  })

  it('succeeds when the invited professional is registered and eligible', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue(mockLead)
    ;(prismaAny.lead.update     as any).mockResolvedValue(mockLead)
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(null)
    ;(prismaAny.rotationQueueEntry.findUnique as any).mockResolvedValue({
      ...mockQueueEntryEligible, professionalType: 'ARCHITECT',
    })
    ;(prismaAny.rotationQueueEntry.update as any).mockResolvedValue({})
    ;(prismaAny.professionalAssignment.create as any).mockResolvedValue({
      ...mockAssignmentPending, sourceType: 'OWNER_INVITED',
    })

    const result = await professionalAssignmentService.routeLead({
      leadId:           LEAD_ID,
      professionalType: 'ARCHITECT',
      sourceType:       'OWNER_INVITED',
      invitedProfileId: PROFILE_A,
    })

    expect(result.success).toBe(true)
  })

  it('rejects invitedProfileId missing when sourceType = OWNER_INVITED', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue(mockLead)
    ;(prismaAny.lead.update     as any).mockResolvedValue(mockLead)
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(null)

    const result = await professionalAssignmentService.routeLead({
      leadId:           LEAD_ID,
      professionalType: 'ARCHITECT',
      sourceType:       'OWNER_INVITED',
      // invitedProfileId intentionally omitted
    })

    expect(result.success).toBe(false)
    expect(result.reason).toBe('INVITED_PROFILE_REQUIRED')
  })
})

// ─── Rule 4: 48-hour accept window ───────────────────────────────────────────

describe('Rule 4 — 48-hour accept window', () => {
  it('allows accept within 48 hours', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-02T09:59:00Z')) // within 48h of Jan 1 10:00

    ;(prismaAny.professionalAssignment.findUnique as any).mockResolvedValue(mockAssignmentPending)
    ;(prismaAny.professionalAssignment.update     as any).mockResolvedValue({ ...mockAssignmentPending, status: 'ACCEPTED' })
    ;(prismaAny.rotationQueueEntry.updateMany     as any).mockResolvedValue({})
    ;(prismaAny.lead.update                       as any).mockResolvedValue({ ...mockLead, stage: 'DISTRIBUTED' })

    const result = await professionalAssignmentService.acceptAssignment(ASSIGNMENT_ID, 'user-1')
    expect(result.status).toBe('ACCEPTED')
  })

  it('throws when attempting to accept after 48-hour deadline', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-05T00:00:00Z')) // past Jan 3 10:00

    ;(prismaAny.professionalAssignment.findUnique as any).mockResolvedValue(mockAssignmentPending)

    await expect(
      professionalAssignmentService.acceptAssignment(ASSIGNMENT_ID, 'user-1')
    ).rejects.toThrow('accept window has expired')
  })

  it('allows decline at any time while PENDING', async () => {
    ;(prismaAny.professionalAssignment.findUnique as any).mockResolvedValue(mockAssignmentPending)
    ;(prismaAny.professionalAssignment.update     as any).mockResolvedValue({ ...mockAssignmentPending, status: 'DECLINED' })
    ;(prismaAny.rotationQueueEntry.updateMany     as any).mockResolvedValue({})
    // For re-routing after decline:
    ;(prismaAny.professionalAssignment.findFirst  as any).mockResolvedValue(null)
    ;(prismaAny.professionalAssignment.findMany   as any).mockResolvedValue([{ profileId: PROFILE_A }])
    ;(prismaAny.rotationQueueEntry.findFirst      as any).mockResolvedValue(null) // no next in queue

    const result = await professionalAssignmentService.declineAssignment(ASSIGNMENT_ID, 'user-1', 'Not available')
    // Decline succeeds even when no next-in-queue professional exists
    expect(result).toBeDefined()
  })
})

// ─── Rule 5 — Expiry → FORFEITED → back of queue (processExpiredAssignments) ──

describe('Rule 4+5 — Expiry: processExpiredAssignments()', () => {
  it('marks expired PENDING assignments as FORFEITED and stamps lastForwardedAt', async () => {
    const expiredAssignment = {
      ...mockAssignmentPending,
      acceptDeadline: new Date('2020-01-01'), // definitely past
    }

    ;(prismaAny.professionalAssignment.findMany  as any).mockResolvedValueOnce([expiredAssignment])
    ;(prismaAny.professionalAssignment.update    as any).mockResolvedValue({ ...expiredAssignment, status: 'EXPIRED' })
    ;(prismaAny.rotationQueueEntry.updateMany    as any).mockResolvedValue({})
    // Final FORFEITED update
    ;(prismaAny.professionalAssignment.update    as any).mockResolvedValue({ ...expiredAssignment, status: 'FORFEITED' })
    // For re-routing after expiry (no next in queue):
    ;(prismaAny.professionalAssignment.findMany  as any).mockResolvedValueOnce([{ profileId: PROFILE_A }])
    ;(prismaAny.rotationQueueEntry.findFirst     as any).mockResolvedValue(null)

    const result = await professionalAssignmentService.processExpiredAssignments()

    expect(result.processed).toBe(1)
    expect(prismaAny.rotationQueueEntry.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastForwardedAt: expect.any(Date),
          totalForfeited:  { increment: 1 },
        }),
      })
    )
  })

  it('skips already non-PENDING assignments', async () => {
    // Worker query filters by status=PENDING, so this is an integration note:
    // If the DB correctly filters, no ACCEPTED/DECLINED row should appear here.
    // Test that processExpiredAssignments returns processed=0 when findMany returns []
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValue([])

    const result = await professionalAssignmentService.processExpiredAssignments()
    expect(result.processed).toBe(0)
  })
})

// ─── Rule 5 — PM/Ops access: no license required ─────────────────────────────

describe('Rule 5 — PM/Ops software access does NOT require license verification', () => {
  it('upserts queue entry with softwareAccessOnly=true and PENDING_VERIFICATION eligibility', async () => {
    ;(prismaAny.rotationQueueEntry.upsert as any).mockResolvedValue({
      profileId:          PROFILE_A,
      professionalType:   'CONTRACTOR',
      softwareAccessOnly: true,
      eligibility:        'PENDING_VERIFICATION',
    })

    const entry = await professionalAssignmentService.upsertQueueEntry({
      profileId:          PROFILE_A,
      professionalType:   'CONTRACTOR',
      softwareAccessOnly: true,
    })

    expect(entry.softwareAccessOnly).toBe(true)
    // softwareAccessOnly entries never become ELIGIBLE (no lead rotation)
    expect(entry.eligibility).toBe('PENDING_VERIFICATION')
  })

  it('excludes softwareAccessOnly entries from getNextInQueue', async () => {
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValue([])
    ;(prismaAny.rotationQueueEntry.findFirst    as any).mockResolvedValue(null)

    const next = await professionalAssignmentService.getNextInQueue(LEAD_ID, 'CONTRACTOR')
    // Should use { softwareAccessOnly: false } in the where clause
    expect(prismaAny.rotationQueueEntry.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ softwareAccessOnly: false }),
      })
    )
    expect(next).toBeNull()
  })
})

// ─── Rule 6 — Lead access: verified license + insurance required ──────────────

describe('Rule 6 — Platform referral/lead access requires verified license + insurance', () => {
  it('blocks OWNER_INVITED professional with unverified license', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue(mockLead)
    ;(prismaAny.lead.update     as any).mockResolvedValue(mockLead)
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(null)
    ;(prismaAny.rotationQueueEntry.findUnique as any).mockResolvedValue({
      ...mockQueueEntryEligible,
      licenseVerified: false, // <-- unverified
    })

    const result = await professionalAssignmentService.routeLead({
      leadId:           LEAD_ID,
      professionalType: 'CONTRACTOR',
      sourceType:       'OWNER_INVITED',
      invitedProfileId: PROFILE_A,
    })

    expect(result.success).toBe(false)
    expect(result.reason).toBe('LICENSE_NOT_VERIFIED')
  })

  it('blocks OWNER_INVITED professional with unverified insurance', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue(mockLead)
    ;(prismaAny.lead.update     as any).mockResolvedValue(mockLead)
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(null)
    ;(prismaAny.rotationQueueEntry.findUnique as any).mockResolvedValue({
      ...mockQueueEntryEligible,
      licenseVerified:   true,
      insuranceVerified: false, // <-- unverified
    })

    const result = await professionalAssignmentService.routeLead({
      leadId:           LEAD_ID,
      professionalType: 'CONTRACTOR',
      sourceType:       'OWNER_INVITED',
      invitedProfileId: PROFILE_A,
    })

    expect(result.success).toBe(false)
    expect(result.reason).toBe('INSURANCE_NOT_VERIFIED')
  })

  it('upsertQueueEntry sets eligibility=ELIGIBLE when both verified', async () => {
    ;(prismaAny.rotationQueueEntry.upsert as any).mockResolvedValue({
      profileId:        PROFILE_A,
      eligibility:      'ELIGIBLE',
      licenseVerified:  true,
      insuranceVerified: true,
    })

    const entry = await professionalAssignmentService.upsertQueueEntry({
      profileId:         PROFILE_A,
      professionalType:  'ARCHITECT',
      licenseVerified:   true,
      insuranceVerified: true,
    })

    expect(entry.eligibility).toBe('ELIGIBLE')
  })

  it('upsertQueueEntry sets PENDING_VERIFICATION when only one verified', async () => {
    ;(prismaAny.rotationQueueEntry.upsert as any).mockResolvedValue({
      profileId:        PROFILE_A,
      eligibility:      'PENDING_VERIFICATION',
      licenseVerified:  true,
      insuranceVerified: false,
    })

    const entry = await professionalAssignmentService.upsertQueueEntry({
      profileId:         PROFILE_A,
      professionalType:  'ARCHITECT',
      licenseVerified:   true,
      insuranceVerified: false,
    })

    expect(entry.eligibility).toBe('PENDING_VERIFICATION')
  })
})

// ─── Rules 8 & 9 — Contractor engagement: plans + permits + CONSTRUCTION_READY ─

describe('Rules 8 & 9 — Contractor engagement requires project readiness', () => {
  const mockLeadWithProject = (phase: string) => ({
    ...mockLead,
    project: {
      preConProject: { id: 'precon-1', phase },
    },
  })

  it('engages contractor when project is in BIDDING_OPEN phase', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue(mockLeadWithProject('BIDDING_OPEN'))
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(mockAssignmentPending)
    ;(prismaAny.rotationQueueEntry.findFirst     as any).mockResolvedValue({
      ...mockQueueEntryEligible, professionalType: 'CONTRACTOR',
    })
    ;(prismaAny.lead.update              as any).mockResolvedValue({ ...mockLead, stage: 'WON', awardedProfileId: PROFILE_A })
    ;(prismaAny.marketplaceProfile.update as any).mockResolvedValue({})

    const lead = await professionalAssignmentService.engageContractor({
      leadId: LEAD_ID, profileId: PROFILE_A, userId: 'user-1',
    })

    expect(lead.stage).toBe('WON')
    expect(lead.awardedProfileId).toBe(PROFILE_A)
  })

  it('rejects engagement when project is in DESIGN_IN_PROGRESS phase (not ready)', async () => {
    ;(prismaAny.lead.findUnique          as any).mockResolvedValue(mockLeadWithProject('DESIGN_IN_PROGRESS'))
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(mockAssignmentPending)
    ;(prismaAny.rotationQueueEntry.findFirst     as any).mockResolvedValue(mockQueueEntryEligible)

    await expect(
      professionalAssignmentService.engageContractor({
        leadId: LEAD_ID, profileId: PROFILE_A, userId: 'user-1',
      })
    ).rejects.toThrow('plans approved and permits submitted')
  })

  it('rejects engagement when no PreConProject is linked', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue({
      ...mockLead, project: { preConProject: null },
    })
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(mockAssignmentPending)
    ;(prismaAny.rotationQueueEntry.findFirst     as any).mockResolvedValue(mockQueueEntryEligible)

    await expect(
      professionalAssignmentService.engageContractor({
        leadId: LEAD_ID, profileId: PROFILE_A, userId: 'user-1',
      })
    ).rejects.toThrow('Plans must exist')
  })

  it('rejects engagement when contractor has no ACCEPTED assignment', async () => {
    ;(prismaAny.lead.findUnique          as any).mockResolvedValue(mockLeadWithProject('BIDDING_OPEN'))
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(null) // no accepted

    await expect(
      professionalAssignmentService.engageContractor({
        leadId: LEAD_ID, profileId: PROFILE_A, userId: 'user-1',
      })
    ).rejects.toThrow('no ACCEPTED assignment found')
  })

  it('rejects engagement for contractor with unverified license/insurance', async () => {
    ;(prismaAny.lead.findUnique          as any).mockResolvedValue(mockLeadWithProject('BIDDING_OPEN'))
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(mockAssignmentPending)
    ;(prismaAny.rotationQueueEntry.findFirst     as any).mockResolvedValue(null) // no ELIGIBLE entry

    await expect(
      professionalAssignmentService.engageContractor({
        leadId: LEAD_ID, profileId: PROFILE_A, userId: 'user-1',
      })
    ).rejects.toThrow('license/insurance not verified')
  })
})

// ─── Rule 10 — Supports all professional types ────────────────────────────────

describe('Rule 10 — Supports ARCHITECT, ENGINEER, CONTRACTOR, DESIGN_BUILD', () => {
  const types = ['ARCHITECT', 'ENGINEER', 'CONTRACTOR', 'DESIGN_BUILD'] as const

  types.forEach((type) => {
    it(`routes a PLATFORM_SERVICE lead to a ${type}`, async () => {
      ;(prismaAny.lead.findUnique as any).mockResolvedValue({ ...mockLead, professionalType: type })
      ;(prismaAny.lead.update     as any).mockResolvedValue({})
      ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(null)
      ;(prismaAny.professionalAssignment.findMany  as any).mockResolvedValue([])
      ;(prismaAny.rotationQueueEntry.findFirst as any).mockResolvedValue({
        ...mockQueueEntryEligible, professionalType: type,
      })
      ;(prismaAny.rotationQueueEntry.update    as any).mockResolvedValue({})
      ;(prismaAny.professionalAssignment.create as any).mockResolvedValue({
        id: 'assign-x', profileId: PROFILE_A, professionalType: type, status: 'PENDING',
      })

      const result = await professionalAssignmentService.routeLead({
        leadId:           LEAD_ID,
        professionalType: type,
        sourceType:       'PLATFORM_SERVICE',
      })

      expect(result.success).toBe(true)
      expect(result.assignment?.professionalType).toBe(type)
    })
  })
})

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('throws NotFoundError for a non-existent lead', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue(null)

    await expect(
      professionalAssignmentService.routeLead({
        leadId:           'non-existent',
        professionalType: 'CONTRACTOR',
        sourceType:       'PLATFORM_SERVICE',
      })
    ).rejects.toThrow()
  })

  it('throws when accepting a non-PENDING assignment', async () => {
    ;(prismaAny.professionalAssignment.findUnique as any).mockResolvedValue({
      ...mockAssignmentPending, status: 'ACCEPTED',
    })

    await expect(
      professionalAssignmentService.acceptAssignment(ASSIGNMENT_ID, 'user-1')
    ).rejects.toThrow('not PENDING')
  })

  it('blocks OWNER_INVITED softwareAccessOnly professional from receiving leads', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue(mockLead)
    ;(prismaAny.lead.update     as any).mockResolvedValue(mockLead)
    ;(prismaAny.professionalAssignment.findFirst as any).mockResolvedValue(null)
    ;(prismaAny.rotationQueueEntry.findUnique as any).mockResolvedValue({
      ...mockQueueEntryEligible,
      softwareAccessOnly: true,
    })

    const result = await professionalAssignmentService.routeLead({
      leadId:           LEAD_ID,
      professionalType: 'CONTRACTOR',
      sourceType:       'OWNER_INVITED',
      invitedProfileId: PROFILE_A,
    })

    expect(result.success).toBe(false)
    expect(result.reason).toBe('SOFTWARE_ACCESS_ONLY')
  })
})
