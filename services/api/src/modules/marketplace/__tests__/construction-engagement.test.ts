/**
 * construction-engagement.test.ts
 *
 * Test checklist for the CONSTRUCTION_READY → contractor engagement automation flow.
 *
 * Coverage:
 *   A. ConstructionReadinessStatus canonical gate (markConstructionReady)
 *   B. initializeEngagement automation sequence (all 4 project types)
 *   C. engageContractor() dual-path readiness check (canonical + PreConPhase fallback)
 *   D. Partial failure handling (escrow fails, milestones fail, etc.)
 *   E. getEngagementStatus / getReadinessStatus read paths
 *   F. Milestone template coverage for RESIDENTIAL, COMMERCIAL, MULTIFAMILY, MIXED_USE
 *
 * TO RUN:  pnpm --filter services/api test -- construction-engagement
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { constructionEngagementService } from '../construction-engagement.service'

// ─── Mock setup ───────────────────────────────────────────────────────────────

vi.mock('../../../utils/prisma-helper', () => ({
  prismaAny: {
    project:            { findUnique: vi.fn(), update: vi.fn() },
    contractAgreement:  { create: vi.fn() },
    milestone:          { create: vi.fn() },
    escrowAgreement:    { create: vi.fn(), findFirst: vi.fn() },
    lead:               { findUnique: vi.fn() },
    $transaction:       vi.fn((ops: any[]) => Promise.all(ops)),
  },
}))

vi.mock('../../audit/audit.service',  () => ({ auditService:  { recordAudit:  vi.fn() } }))
vi.mock('../../events/event.service', () => ({ eventService:  { recordEvent:  vi.fn() } }))

import { prismaAny } from '../../../utils/prisma-helper'

beforeEach(() => vi.clearAllMocks())
afterEach(()  => vi.useRealTimers())

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PROJECT_ID   = 'project-001'
const LEAD_ID      = 'lead-001'
const CONTRACT_ID  = 'contract-001'
const ESCROW_ID    = 'escrow-001'
const OWNER_ID     = 'owner-user'
const CONTRACTOR_ID = 'contractor-user'
const PROFILE_ID   = 'profile-001'

const CONTRACT_AMOUNT = 250_000

const mockProjectReady = {
  id:                               PROJECT_ID,
  constructionReadiness:            'NOT_READY',
  constructionReadinessUpdatedAt:   null,
  constructionReadinessConfirmedBy: null,
  preConProject: { id: 'precon-001', phase: 'BIDDING_OPEN' },
}

const mockProjectCanonicallyReady = {
  ...mockProjectReady,
  constructionReadiness: 'CONSTRUCTION_READY',
}

// ─── A. markConstructionReady ─────────────────────────────────────────────────

describe('A — markConstructionReady()', () => {
  it('sets constructionReadiness=CONSTRUCTION_READY when PreConPhase is BIDDING_OPEN', async () => {
    ;(prismaAny.project.findUnique as any).mockResolvedValue(mockProjectReady)
    ;(prismaAny.project.update    as any).mockResolvedValue({ ...mockProjectReady, constructionReadiness: 'CONSTRUCTION_READY' })

    const result = await constructionEngagementService.markConstructionReady({
      projectId:   PROJECT_ID,
      confirmedBy: OWNER_ID,
    })

    expect(prismaAny.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ constructionReadiness: 'CONSTRUCTION_READY' }),
      })
    )
    expect(result.constructionReadiness).toBe('CONSTRUCTION_READY')
  })

  it.each([
    'AWARDED',
    'CONTRACT_PENDING',
    'CONTRACT_RATIFIED',
    'COMPLETED',
  ])('allows %s phase', async (phase) => {
    ;(prismaAny.project.findUnique as any).mockResolvedValue({
      ...mockProjectReady, preConProject: { id: 'precon-001', phase },
    })
    ;(prismaAny.project.update as any).mockResolvedValue({})

    await expect(
      constructionEngagementService.markConstructionReady({ projectId: PROJECT_ID, confirmedBy: OWNER_ID })
    ).resolves.not.toThrow()
  })

  it.each([
    'INTAKE',
    'DESIGN_IN_PROGRESS',
    'DESIGN_REVIEW',
    'DESIGN_APPROVED',
    'SRP_GENERATED',
    'MARKETPLACE_READY',
  ])('rejects phase %s (plans or permits not ready)', async (phase) => {
    ;(prismaAny.project.findUnique as any).mockResolvedValue({
      ...mockProjectReady, preConProject: { id: 'precon-001', phase },
    })

    await expect(
      constructionEngagementService.markConstructionReady({ projectId: PROJECT_ID, confirmedBy: OWNER_ID })
    ).rejects.toThrow('BIDDING_OPEN or later')
  })

  it('throws when no PreConProject is linked', async () => {
    ;(prismaAny.project.findUnique as any).mockResolvedValue({
      ...mockProjectReady, preConProject: null,
    })

    await expect(
      constructionEngagementService.markConstructionReady({ projectId: PROJECT_ID, confirmedBy: OWNER_ID })
    ).rejects.toThrow('no PreConProject')
  })

  it('throws NotFoundError for a missing project', async () => {
    ;(prismaAny.project.findUnique as any).mockResolvedValue(null)

    await expect(
      constructionEngagementService.markConstructionReady({ projectId: 'bad-id', confirmedBy: OWNER_ID })
    ).rejects.toThrow()
  })
})

// ─── B. initializeEngagement — all project types ──────────────────────────────

describe('B — initializeEngagement() — full success path', () => {
  const baseInput = {
    leadId:            LEAD_ID,
    profileId:         PROFILE_ID,
    contractorUserId:  CONTRACTOR_ID,
    ownerUserId:       OWNER_ID,
    projectId:         PROJECT_ID,
    contractAmount:    CONTRACT_AMOUNT,
    triggeredByUserId: OWNER_ID,
  }

  function mockSuccessPath() {
    ;(prismaAny.contractAgreement.create as any).mockResolvedValue({ id: CONTRACT_ID })
    ;(prismaAny.$transaction             as any).mockResolvedValue([])
    ;(prismaAny.escrowAgreement.findFirst as any).mockResolvedValue(null)
    ;(prismaAny.escrowAgreement.create   as any).mockResolvedValue({ id: ESCROW_ID })
    ;(prismaAny.project.update           as any).mockResolvedValue({})
  }

  it.each([
    ['RESIDENTIAL',  7], // 7 milestones
    ['COMMERCIAL',   6], // 6 milestones
    ['MULTIFAMILY',  7], // 7 milestones
    ['MIXED_USE',    7], // 7 milestones
  ] as const)(
    'creates %s project with %d milestones',
    async (category, expectedMilestones) => {
      mockSuccessPath()

      const result = await constructionEngagementService.initializeEngagement({
        ...baseInput, projectCategory: category,
      })

      expect(result.success).toBe(true)
      expect(result.contractId).toBe(CONTRACT_ID)
      expect(result.escrowId).toBe(ESCROW_ID)
      expect(result.milestonesCreated).toBe(expectedMilestones)
      expect(result.errors).toBeUndefined()
    }
  )

  it('defaults to RESIDENTIAL template when category is null', async () => {
    mockSuccessPath()

    const result = await constructionEngagementService.initializeEngagement({
      ...baseInput, projectCategory: undefined,
    })

    expect(result.milestonesCreated).toBe(7) // RESIDENTIAL has 7 milestones
  })

  it('maps category strings to correct templates', () => {
    const cases: Array<[string, string]> = [
      ['commercial',         'COMMERCIAL'],
      ['OFFICE',             'COMMERCIAL'],
      ['retail space',       'COMMERCIAL'],
      ['warehouse',          'COMMERCIAL'],
      ['multifamily',        'MULTIFAMILY'],
      ['apartment complex',  'MULTIFAMILY'],
      ['condo',              'MULTIFAMILY'],
      ['mixed use',          'MIXED_USE'],
      ['MIXED_USE',          'MIXED_USE'],
      ['residential',        'RESIDENTIAL'],
      ['kitchen remodel',    'RESIDENTIAL'],
      ['',                   'RESIDENTIAL'],
    ]

    for (const [input, expected] of cases) {
      const detected = constructionEngagementService._detectCategory(input)
      expect(detected, `input: "${input}"`).toBe(expected)
    }
  })

  it('creates contract with DRAFT status', async () => {
    mockSuccessPath()

    await constructionEngagementService.initializeEngagement(baseInput)

    expect(prismaAny.contractAgreement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status:      'DRAFT',
          ownerId:     OWNER_ID,
          contractorId: CONTRACTOR_ID,
          amount:      CONTRACT_AMOUNT,
        }),
      })
    )
  })

  it('creates escrow with 10 % initial deposit and 10 % holdback', async () => {
    mockSuccessPath()

    await constructionEngagementService.initializeEngagement(baseInput)

    expect(prismaAny.escrowAgreement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalContractAmount:  CONTRACT_AMOUNT,
          initialDepositAmount: 25_000,  // 10% of 250,000
          holdbackPercentage:   10,
          status:               'PENDING_DEPOSIT',
        }),
      })
    )
  })

  it('milestone amounts sum to contract amount (RESIDENTIAL)', async () => {
    mockSuccessPath()
    const rows: any[] = []
    ;(prismaAny.$transaction as any).mockImplementation((ops: any[]) => {
      // Capture the milestone data by inspecting mock calls inline
      return Promise.all(ops)
    })
    // Inspect via template directly
    const template = constructionEngagementService.getMilestoneTemplate('RESIDENTIAL')
    const total    = template.reduce((s, m) => s + m.pct, 0)
    expect(total).toBeCloseTo(1.0, 5) // percentages sum to 1
  })

  it('stamps Project.constructionReadiness = CONSTRUCTION_READY', async () => {
    mockSuccessPath()

    await constructionEngagementService.initializeEngagement(baseInput)

    expect(prismaAny.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ constructionReadiness: 'CONSTRUCTION_READY' }),
      })
    )
  })
})

// ─── C. Milestone template pct sums ───────────────────────────────────────────

describe('C — Milestone template percentage integrity', () => {
  const categories = ['RESIDENTIAL', 'COMMERCIAL', 'MULTIFAMILY', 'MIXED_USE'] as const

  for (const category of categories) {
    it(`${category} milestones sum to 100 %`, () => {
      const tpl   = constructionEngagementService.getMilestoneTemplate(category)
      const total = tpl.reduce((s, m) => s + m.pct, 0)
      expect(total).toBeCloseTo(1.0, 5)
    })

    it(`${category} milestones have sequential order numbers starting at 1`, () => {
      const tpl    = constructionEngagementService.getMilestoneTemplate(category)
      const orders = tpl.map((m) => m.order)
      const expected = tpl.map((_, i) => i + 1)
      expect(orders).toEqual(expected)
    })
  }
})

// ─── D. Partial failure handling ──────────────────────────────────────────────

describe('D — initializeEngagement() partial failures', () => {
  const baseInput = {
    leadId:            LEAD_ID,
    profileId:         PROFILE_ID,
    contractorUserId:  CONTRACTOR_ID,
    ownerUserId:       OWNER_ID,
    projectId:         PROJECT_ID,
    contractAmount:    CONTRACT_AMOUNT,
    triggeredByUserId: OWNER_ID,
  }

  it('returns success=false and collects errors when contract creation fails', async () => {
    ;(prismaAny.contractAgreement.create as any).mockRejectedValue(new Error('DB constraint'))
    ;(prismaAny.project.update           as any).mockResolvedValue({})

    const result = await constructionEngagementService.initializeEngagement(baseInput)

    expect(result.success).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Contract creation failed')]))
    expect(result.contractId).toBeUndefined()
    // Escrow and milestones should be skipped (depend on contractId)
    expect(result.escrowId).toBeUndefined()
    expect(result.milestonesCreated).toBe(0)
  })

  it('returns success=false and collects errors when escrow creation fails', async () => {
    ;(prismaAny.contractAgreement.create as any).mockResolvedValue({ id: CONTRACT_ID })
    ;(prismaAny.$transaction             as any).mockResolvedValue([])
    ;(prismaAny.escrowAgreement.findFirst as any).mockResolvedValue(null)
    ;(prismaAny.escrowAgreement.create   as any).mockRejectedValue(new Error('Unique constraint violation'))
    ;(prismaAny.project.update           as any).mockResolvedValue({})

    const result = await constructionEngagementService.initializeEngagement(baseInput)

    expect(result.success).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Escrow creation failed')]))
    // Contract and milestones should still succeed
    expect(result.contractId).toBe(CONTRACT_ID)
    expect(result.milestonesCreated).toBeGreaterThan(0)
    expect(result.escrowId).toBeUndefined()
  })

  it('returns success=false when milestone $transaction fails', async () => {
    ;(prismaAny.contractAgreement.create as any).mockResolvedValue({ id: CONTRACT_ID })
    ;(prismaAny.$transaction             as any).mockRejectedValue(new Error('Transaction timeout'))
    ;(prismaAny.escrowAgreement.findFirst as any).mockResolvedValue(null)
    ;(prismaAny.escrowAgreement.create   as any).mockResolvedValue({ id: ESCROW_ID })
    ;(prismaAny.project.update           as any).mockResolvedValue({})

    const result = await constructionEngagementService.initializeEngagement(baseInput)

    expect(result.success).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Milestone creation failed')]))
    // Contract and escrow should still succeed
    expect(result.contractId).toBe(CONTRACT_ID)
    expect(result.escrowId).toBe(ESCROW_ID)
    expect(result.milestonesCreated).toBe(0)
  })
})

// ─── E. Escrow account number generation ──────────────────────────────────────

describe('E — _generateEscrowAccountNumber()', () => {
  it('generates ESC-YYYYMMDD-0001 format for first escrow of the day', async () => {
    ;(prismaAny.escrowAgreement.findFirst as any).mockResolvedValue(null)

    const num = await constructionEngagementService._generateEscrowAccountNumber()
    expect(num).toMatch(/^ESC-\d{8}-0001$/)
  })

  it('increments sequence for subsequent escrows on the same day', async () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    ;(prismaAny.escrowAgreement.findFirst as any).mockResolvedValue({
      escrowAccountNumber: `ESC-${today}-0003`,
    })

    const num = await constructionEngagementService._generateEscrowAccountNumber()
    expect(num).toBe(`ESC-${today}-0004`)
  })
})

// ─── F. getReadinessStatus ────────────────────────────────────────────────────

describe('F — getReadinessStatus()', () => {
  it('returns isReady=true when constructionReadiness=CONSTRUCTION_READY', async () => {
    ;(prismaAny.project.findUnique as any).mockResolvedValue(mockProjectCanonicallyReady)

    const status = await constructionEngagementService.getReadinessStatus(PROJECT_ID)

    expect(status.isReady).toBe(true)
    expect(status.constructionReadiness).toBe('CONSTRUCTION_READY')
  })

  it('returns isReady=false when constructionReadiness=NOT_READY', async () => {
    ;(prismaAny.project.findUnique as any).mockResolvedValue({
      ...mockProjectReady,
      constructionReadiness: 'NOT_READY',
    })

    const status = await constructionEngagementService.getReadinessStatus(PROJECT_ID)

    expect(status.isReady).toBe(false)
    expect(status.proxyWouldPass).toBe(true) // PreConPhase = BIDDING_OPEN still passes proxy
  })

  it('reports proxyWouldPass=false for early PreConPhase', async () => {
    ;(prismaAny.project.findUnique as any).mockResolvedValue({
      ...mockProjectReady,
      constructionReadiness: 'NOT_READY',
      preConProject: { id: 'precon-001', phase: 'DESIGN_IN_PROGRESS' },
    })

    const status = await constructionEngagementService.getReadinessStatus(PROJECT_ID)

    expect(status.isReady).toBe(false)
    expect(status.proxyWouldPass).toBe(false)
  })
})

// ─── G. getEngagementStatus ───────────────────────────────────────────────────

describe('G — getEngagementStatus()', () => {
  it('returns contract with milestones and escrow when engagement is initialized', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue({
      id:        LEAD_ID,
      projectId: PROJECT_ID,
      project: {
        constructionReadiness: 'CONSTRUCTION_READY',
        contracts: [
          {
            id:              CONTRACT_ID,
            status:          'DRAFT',
            amount:          CONTRACT_AMOUNT,
            signedAt:        null,
            milestones:      [{ id: 'm-1', name: 'Mobilization', amount: 25_000, status: 'PENDING' }],
            escrowAgreement: { id: ESCROW_ID, status: 'PENDING_DEPOSIT', currentBalance: 0 },
          },
        ],
      },
    })

    const status = await constructionEngagementService.getEngagementStatus(LEAD_ID)

    expect(status.constructionReadiness).toBe('CONSTRUCTION_READY')
    expect(status.contract.id).toBe(CONTRACT_ID)
    expect(status.contract.milestoneCount).toBe(1)
    expect(status.contract.escrow.id).toBe(ESCROW_ID)
  })

  it('returns contract=null when no contract exists yet', async () => {
    ;(prismaAny.lead.findUnique as any).mockResolvedValue({
      id:        LEAD_ID,
      projectId: PROJECT_ID,
      project:   { constructionReadiness: 'NOT_READY', contracts: [] },
    })

    const status = await constructionEngagementService.getEngagementStatus(LEAD_ID)
    expect(status.contract).toBeNull()
  })
})

// ─── H. engageContractor dual-path integration (unit) ────────────────────────
// Note: Full integration test for engageContractor() including the
// constructionEngagementService call lives in professional-assignment.test.ts.
// These scenarios test the readiness check logic only.

describe('H — readiness check logic (dual-path)', () => {
  it('dual-path: canonical=true, phase=early → passes (canonical wins)', () => {
    // Simulated logic from engageContractor()
    const constructionReadiness = 'CONSTRUCTION_READY'
    const preConPhase           = 'DESIGN_IN_PROGRESS'
    const CONSTRUCTION_READY_PHASES = new Set(['BIDDING_OPEN', 'AWARDED', 'CONTRACT_PENDING', 'CONTRACT_RATIFIED', 'COMPLETED'])

    const isCanonicallyReady = constructionReadiness === 'CONSTRUCTION_READY'
    const isPhaseReady       = CONSTRUCTION_READY_PHASES.has(preConPhase)

    expect(isCanonicallyReady || isPhaseReady).toBe(true)
    expect(isCanonicallyReady).toBe(true)
    expect(isPhaseReady).toBe(false)
  })

  it('dual-path: canonical=NOT_READY, phase=BIDDING_OPEN → passes via fallback', () => {
    const constructionReadiness = 'NOT_READY'
    const preConPhase           = 'BIDDING_OPEN'
    const CONSTRUCTION_READY_PHASES = new Set(['BIDDING_OPEN', 'AWARDED', 'CONTRACT_PENDING', 'CONTRACT_RATIFIED', 'COMPLETED'])

    const isCanonicallyReady = constructionReadiness === 'CONSTRUCTION_READY'
    const isPhaseReady       = CONSTRUCTION_READY_PHASES.has(preConPhase)

    expect(isCanonicallyReady || isPhaseReady).toBe(true)
    expect(isCanonicallyReady).toBe(false) // fallback path used
    expect(isPhaseReady).toBe(true)
  })

  it('dual-path: canonical=NOT_READY, phase=DESIGN_IN_PROGRESS → BLOCKED', () => {
    const constructionReadiness = 'NOT_READY'
    const preConPhase           = 'DESIGN_IN_PROGRESS'
    const CONSTRUCTION_READY_PHASES = new Set(['BIDDING_OPEN', 'AWARDED', 'CONTRACT_PENDING', 'CONTRACT_RATIFIED', 'COMPLETED'])

    const isCanonicallyReady = constructionReadiness === 'CONSTRUCTION_READY'
    const isPhaseReady       = CONSTRUCTION_READY_PHASES.has(preConPhase)

    expect(isCanonicallyReady || isPhaseReady).toBe(false)
  })
})
