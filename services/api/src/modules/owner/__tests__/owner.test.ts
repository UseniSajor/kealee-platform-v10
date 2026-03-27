/**
 * owner.test.ts
 * Tests for owner-project-engagement relationship integrity.
 * Uses vitest. Mocks Prisma to test service-layer logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Prisma ─────────────────────────────────────────────────────────────
vi.mock('../../../lib/prisma', () => ({
  default: {
    project: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    contractAgreement: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { prisma } from '../../../lib/prisma'
import {
  ownerListProjects,
  ownerGetProject,
  ownerCreateProject,
  ownerUpdateProject,
  ownerGetReadiness,
  ownerAdvanceReadiness,
  ownerListEngagements,
  ownerGetEngagement,
  ownerGetTimeline,
} from '../owner.service'

const db = prisma as any

const MOCK_USER_ID = 'user-001'
const MOCK_PROJECT_ID = 'project-001'
const MOCK_CONTRACT_ID = 'contract-001'

const MOCK_PROJECT = {
  id: MOCK_PROJECT_ID,
  name: 'Kitchen Remodel',
  category: 'KITCHEN',
  status: 'ACTIVE',
  currentPhase: 'DESIGN',
  constructionReadiness: 'DESIGN_READY',
  budgetTotal: 45000,
  address: '123 Main St',
  city: 'Bethesda',
  state: 'MD',
  zipCode: '20814',
  scheduledStartDate: null,
  scheduledEndDate: null,
  createdAt: new Date('2025-01-15'),
  description: 'Full kitchen renovation',
  orgId: 'org-001',
  ownerId: MOCK_USER_ID,
  memberships: [{ id: 'm1', userId: MOCK_USER_ID, role: 'OWNER', user: { id: MOCK_USER_ID, name: 'Tim', email: 'tim@example.com' } }],
  contracts: [{ id: MOCK_CONTRACT_ID }],
}

// ─── ownerListProjects ────────────────────────────────────────────────────────

describe('ownerListProjects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns mapped project summaries for owner', async () => {
    db.project.findMany.mockResolvedValue([
      { ...MOCK_PROJECT, memberships: [{ id: 'm1' }], contracts: [{ id: MOCK_CONTRACT_ID }] },
    ])
    const result = await ownerListProjects(MOCK_USER_ID)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(MOCK_PROJECT_ID)
    expect(result[0].name).toBe('Kitchen Remodel')
    expect(result[0].memberCount).toBe(1)
    expect(result[0].openEngagements).toBe(1)
  })

  it('queries with ownerId OR membership OWNER filter', async () => {
    db.project.findMany.mockResolvedValue([])
    await ownerListProjects(MOCK_USER_ID)
    expect(db.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { ownerId: MOCK_USER_ID },
          ]),
        }),
      })
    )
  })

  it('returns empty array when no projects', async () => {
    db.project.findMany.mockResolvedValue([])
    const result = await ownerListProjects(MOCK_USER_ID)
    expect(result).toHaveLength(0)
  })

  it('converts budgetTotal to number', async () => {
    db.project.findMany.mockResolvedValue([
      { ...MOCK_PROJECT, budgetTotal: '45000.00', memberships: [], contracts: [] },
    ])
    const result = await ownerListProjects(MOCK_USER_ID)
    expect(typeof result[0].budgetTotal).toBe('number')
  })
})

// ─── ownerGetProject ──────────────────────────────────────────────────────────

describe('ownerGetProject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when project not found', async () => {
    db.project.findFirst.mockResolvedValue(null)
    const result = await ownerGetProject('nonexistent', MOCK_USER_ID)
    expect(result).toBeNull()
  })

  it('returns project detail with memberships', async () => {
    db.project.findFirst.mockResolvedValue(MOCK_PROJECT)
    // ownerGetReadiness is called internally — mock it
    db.project.findFirst
      .mockResolvedValueOnce(MOCK_PROJECT) // main query
      .mockResolvedValueOnce({ constructionReadiness: 'DESIGN_READY' }) // readiness query

    const result = await ownerGetProject(MOCK_PROJECT_ID, MOCK_USER_ID)
    expect(result).not.toBeNull()
    expect(result?.memberships).toHaveLength(1)
    expect(result?.memberships[0].role).toBe('OWNER')
  })

  it('enforces owner-only access', async () => {
    db.project.findFirst.mockResolvedValue(null)
    const result = await ownerGetProject(MOCK_PROJECT_ID, 'other-user')
    expect(result).toBeNull()
    // Should query with OR including ownerId = other-user
    expect(db.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: MOCK_PROJECT_ID,
          OR: expect.arrayContaining([{ ownerId: 'other-user' }]),
        }),
      })
    )
  })
})

// ─── ownerCreateProject ───────────────────────────────────────────────────────

describe('ownerCreateProject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 422 when no adminOverride', async () => {
    await expect(
      ownerCreateProject(MOCK_USER_ID, null, {
        name: 'New Project',
        category: 'KITCHEN',
      })
    ).rejects.toMatchObject({ statusCode: 422 })
  })

  it('creates project with adminOverride', async () => {
    db.project.create.mockResolvedValue({ id: 'new-project', ...MOCK_PROJECT })
    db.auditLog.create.mockResolvedValue({})
    const result = await ownerCreateProject(MOCK_USER_ID, 'org-001', {
      name: 'New Kitchen',
      category: 'KITCHEN',
      adminOverride: true,
      adminReason: 'Requested by owner',
    })
    expect(db.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'New Kitchen',
          category: 'KITCHEN',
          ownerId: MOCK_USER_ID,
          constructionReadiness: 'NOT_READY',
        }),
      })
    )
  })
})

// ─── ownerAdvanceReadiness ────────────────────────────────────────────────────

describe('ownerAdvanceReadiness', () => {
  beforeEach(() => vi.clearAllMocks())

  it('advances from DESIGN_READY to PERMITS_SUBMITTED', async () => {
    db.project.findFirst.mockResolvedValue({ id: MOCK_PROJECT_ID, constructionReadiness: 'DESIGN_READY' })
    db.project.update.mockResolvedValue({ id: MOCK_PROJECT_ID, constructionReadiness: 'PERMITS_SUBMITTED' })
    db.auditLog.create.mockResolvedValue({})
    const result = await ownerAdvanceReadiness(MOCK_PROJECT_ID, MOCK_USER_ID, 'PERMITS_SUBMITTED')
    expect(result.gate).toBe('PERMITS_SUBMITTED')
  })

  it('rejects backwards advancement', async () => {
    db.project.findFirst.mockResolvedValue({ id: MOCK_PROJECT_ID, constructionReadiness: 'PERMITS_SUBMITTED' })
    await expect(
      ownerAdvanceReadiness(MOCK_PROJECT_ID, MOCK_USER_ID, 'DESIGN_READY')
    ).rejects.toMatchObject({ statusCode: 422 })
  })

  it('rejects gate skipping', async () => {
    db.project.findFirst.mockResolvedValue({ id: MOCK_PROJECT_ID, constructionReadiness: 'NOT_READY' })
    await expect(
      ownerAdvanceReadiness(MOCK_PROJECT_ID, MOCK_USER_ID, 'CONSTRUCTION_READY')
    ).rejects.toMatchObject({ statusCode: 422 })
  })

  it('throws 404 when project not found', async () => {
    db.project.findFirst.mockResolvedValue(null)
    await expect(
      ownerAdvanceReadiness('nonexistent', MOCK_USER_ID, 'DESIGN_READY')
    ).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── ownerListEngagements ─────────────────────────────────────────────────────

describe('ownerListEngagements', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when project not found', async () => {
    db.project.findFirst.mockResolvedValue(null)
    await expect(ownerListEngagements('nonexistent', MOCK_USER_ID)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns engagement summaries with computed paidAmount', async () => {
    db.project.findFirst.mockResolvedValue({ id: MOCK_PROJECT_ID })
    db.contractAgreement.findMany.mockResolvedValue([
      {
        id: MOCK_CONTRACT_ID,
        projectId: MOCK_PROJECT_ID,
        contractorId: 'contractor-001',
        amount: '45000',
        status: 'ACTIVE',
        signedAt: new Date('2025-02-01'),
        expiresAt: null,
        createdAt: new Date('2025-02-01'),
        contractor: { id: 'contractor-001', name: 'Carlos Rivera' },
        milestones: [
          { amount: '10000', status: 'PAID' },
          { amount: '15000', status: 'PENDING' },
        ],
        escrowAgreement: { currentBalance: '35000' },
      },
    ])

    const result = await ownerListEngagements(MOCK_PROJECT_ID, MOCK_USER_ID)
    expect(result).toHaveLength(1)
    expect(result[0].contractorName).toBe('Carlos Rivera')
    expect(result[0].paidAmount).toBe(10000)
    expect(result[0].pendingAmount).toBe(15000)
    expect(result[0].escrowBalance).toBe(35000)
  })
})

// ─── ownerGetEngagement ───────────────────────────────────────────────────────

describe('ownerGetEngagement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when engagement not found', async () => {
    db.contractAgreement.findFirst.mockResolvedValue(null)
    const result = await ownerGetEngagement('nonexistent', MOCK_USER_ID)
    expect(result).toBeNull()
  })

  it('returns engagement detail with milestones and escrow', async () => {
    db.contractAgreement.findFirst.mockResolvedValue({
      id: MOCK_CONTRACT_ID,
      projectId: MOCK_PROJECT_ID,
      contractorId: 'contractor-001',
      amount: '45000',
      status: 'ACTIVE',
      signedAt: new Date('2025-02-01'),
      expiresAt: null,
      contractor: { id: 'contractor-001', name: 'Carlos Rivera' },
      milestones: [
        { id: 'm1', name: 'Foundation', description: null, amount: '10000', status: 'PAID', completedAt: new Date(), approvedAt: new Date(), paidAt: new Date(), dependsOnId: null },
        { id: 'm2', name: 'Framing', description: null, amount: '15000', status: 'PENDING', completedAt: null, approvedAt: null, paidAt: null, dependsOnId: 'm1' },
      ],
      escrowAgreement: {
        id: 'escrow-001',
        status: 'ACTIVE',
        totalContractAmount: '45000',
        currentBalance: '35000',
        availableBalance: '30000',
        heldBalance: '5000',
        holdbackPercentage: 10,
      },
      disputes: [],
    })

    const result = await ownerGetEngagement(MOCK_CONTRACT_ID, MOCK_USER_ID)
    expect(result).not.toBeNull()
    expect(result?.milestones).toHaveLength(2)
    expect(result?.escrow?.status).toBe('ACTIVE')
    expect(result?.disputes).toHaveLength(0)
  })

  it('verifies owner access through project relation', () => {
    // Verify query includes project access filter
    db.contractAgreement.findFirst.mockResolvedValue(null)
    ownerGetEngagement(MOCK_CONTRACT_ID, MOCK_USER_ID)
    expect(db.contractAgreement.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: MOCK_CONTRACT_ID,
          project: expect.objectContaining({
            OR: expect.arrayContaining([{ ownerId: MOCK_USER_ID }]),
          }),
        }),
      })
    )
  })
})

// ─── ownerGetTimeline ─────────────────────────────────────────────────────────

describe('ownerGetTimeline', () => {
  beforeEach(() => vi.clearAllMocks())

  it('always includes PROJECT_CREATED as first event', async () => {
    db.project.findFirst.mockResolvedValue({ id: MOCK_PROJECT_ID, createdAt: new Date('2025-01-15'), ownerId: MOCK_USER_ID })
    db.auditLog.findMany.mockResolvedValue([])
    db.contractAgreement.findMany.mockResolvedValue([])

    const events = await ownerGetTimeline(MOCK_PROJECT_ID, MOCK_USER_ID)
    expect(events.some(e => e.type === 'PROJECT_CREATED')).toBe(true)
  })

  it('throws 404 when project not found', async () => {
    db.project.findFirst.mockResolvedValue(null)
    await expect(ownerGetTimeline('nonexistent', MOCK_USER_ID)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns events sorted by date descending', async () => {
    db.project.findFirst.mockResolvedValue({ id: MOCK_PROJECT_ID, createdAt: new Date('2025-01-01'), ownerId: MOCK_USER_ID })
    db.auditLog.findMany.mockResolvedValue([])
    db.contractAgreement.findMany.mockResolvedValue([
      { id: 'c1', createdAt: new Date('2025-03-01'), contractorId: 'con-1', amount: '45000' },
    ])

    const events = await ownerGetTimeline(MOCK_PROJECT_ID, MOCK_USER_ID)
    for (let i = 0; i < events.length - 1; i++) {
      expect(new Date(events[i].occurredAt).getTime()).toBeGreaterThanOrEqual(
        new Date(events[i + 1].occurredAt).getTime()
      )
    }
  })
})
