/**
 * intelligence.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../lib/prisma', () => ({
  default: {
    scoreEvent: { create: vi.fn(), findMany: vi.fn() },
    entityScore: { upsert: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
    contractAgreement: { findMany: vi.fn() },
    milestone: { findMany: vi.fn() },
  },
}))

import { prisma } from '../../../lib/prisma'
import {
  recordScoreEvent,
  getEntityScore,
  getMarketInsights,
  getContractorPerformance,
  getLeadFunnel,
  getContractorRecommendations,
} from '../intelligence.service'

const db = prisma as any

const CONTRACTOR_ID = 'contractor-001'

const MOCK_SCORE = {
  entityId: CONTRACTOR_ID,
  entityType: 'contractor',
  overallScore: 78,
  responsiveness: 85,
  reliability: 75,
  quality: 72,
  updatedAt: new Date('2026-03-15'),
}

// ─── recordScoreEvent ────────────────────────────────────────────────────────

describe('recordScoreEvent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates score event with default weight', async () => {
    db.scoreEvent.create.mockResolvedValue({})
    db.scoreEvent.findMany.mockResolvedValue([
      { eventType: 'LEAD_CONVERTED', weight: 8 },
      { eventType: 'REVIEW_5_STAR', weight: 6 },
    ])
    db.entityScore.upsert.mockResolvedValue({})

    await recordScoreEvent({
      entityId: CONTRACTOR_ID,
      entityType: 'contractor',
      eventType: 'LEAD_CONVERTED',
    })

    expect(db.scoreEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ weight: 8, eventType: 'LEAD_CONVERTED' }),
      }),
    )
    expect(db.entityScore.upsert).toHaveBeenCalled()
  })

  it('accepts custom weight override', async () => {
    db.scoreEvent.create.mockResolvedValue({})
    db.scoreEvent.findMany.mockResolvedValue([])
    db.entityScore.upsert.mockResolvedValue({})

    await recordScoreEvent({
      entityId: CONTRACTOR_ID,
      entityType: 'contractor',
      eventType: 'REVIEW_5_STAR',
      weight: 10,
    })

    expect(db.scoreEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ weight: 10 }),
      }),
    )
  })
})

// ─── getEntityScore ──────────────────────────────────────────────────────────

describe('getEntityScore', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when no score exists', async () => {
    db.entityScore.findUnique.mockResolvedValue(null)
    const result = await getEntityScore(CONTRACTOR_ID, 'contractor')
    expect(result).toBeNull()
  })

  it('returns mapped score dto', async () => {
    db.entityScore.findUnique.mockResolvedValue(MOCK_SCORE)
    const result = await getEntityScore(CONTRACTOR_ID, 'contractor')
    expect(result?.overallScore).toBe(78)
    expect(result?.responsiveness).toBe(85)
    expect(result?.lastUpdated).toBe(new Date('2026-03-15').toISOString())
  })
})

// ─── getMarketInsights ───────────────────────────────────────────────────────

describe('getMarketInsights', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns market insights with calculated rates', async () => {
    db.contractAgreement.findMany.mockResolvedValue([
      { id: 'c1', status: 'ACTIVE', amount: '50000', contractorId: 'gc-1' },
      { id: 'c2', status: 'DRAFT', amount: '30000', contractorId: 'gc-2' },
      { id: 'c3', status: 'COMPLETED', amount: '80000', contractorId: 'gc-1' },
    ])
    db.entityScore.findMany.mockResolvedValue([MOCK_SCORE])

    const result = await getMarketInsights({ period: '30d' })

    expect(result.totalLeads).toBe(3)
    expect(result.leadsConverted).toBe(2)  // ACTIVE + COMPLETED
    expect(result.activeContractors).toBe(2)  // unique contractor IDs
  })
})

// ─── getContractorPerformance ────────────────────────────────────────────────

describe('getContractorPerformance', () => {
  beforeEach(() => vi.clearAllMocks())

  it('computes on-time rate correctly', async () => {
    const due = new Date('2026-03-10')
    const onTime = new Date('2026-03-09')
    const late = new Date('2026-03-12')

    db.contractAgreement.findMany.mockResolvedValue([
      { id: 'c1', status: 'ACTIVE', amount: '45000' },
    ])
    db.milestone.findMany.mockResolvedValue([
      { status: 'PAID', completedAt: onTime, dueDate: due },
      { status: 'PAID', completedAt: late, dueDate: due },
      { status: 'PENDING', completedAt: null, dueDate: due },
    ])
    db.entityScore.findUnique.mockResolvedValue(MOCK_SCORE)

    const result = await getContractorPerformance({ contractorId: CONTRACTOR_ID, period: '90d' })

    expect(result.milestonesCompleted).toBe(2)
    expect(result.milestonesOnTime).toBe(1)
    expect(result.onTimeRate).toBe(50)
  })
})

// ─── getLeadFunnel ───────────────────────────────────────────────────────────

describe('getLeadFunnel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('computes acceptance and conversion rates', async () => {
    db.contractAgreement.findMany.mockResolvedValue([
      { id: 'c1', status: 'ACTIVE', tradeCategory: 'GENERAL_CONTRACTOR' },
      { id: 'c2', status: 'ACTIVE', tradeCategory: 'GENERAL_CONTRACTOR' },
      { id: 'c3', status: 'DRAFT', tradeCategory: 'PLUMBER' },
      { id: 'c4', status: 'COMPLETED', tradeCategory: 'GENERAL_CONTRACTOR' },
    ])

    const result = await getLeadFunnel({ period: '30d' })

    expect(result.dispatched).toBe(4)
    expect(result.accepted).toBe(3)  // non-DRAFT/CANCELLED
    expect(result.converted).toBe(3) // ACTIVE + COMPLETED
    expect(result.byTrade).toHaveLength(2)
  })
})

// ─── getContractorRecommendations ────────────────────────────────────────────

describe('getContractorRecommendations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns ranked recommendations with match reasons', async () => {
    db.entityScore.findMany.mockResolvedValue([
      { entityId: 'gc-1', overallScore: 90, responsiveness: 88 },
      { entityId: 'gc-2', overallScore: 72, responsiveness: 60 },
    ])

    const result = await getContractorRecommendations({
      projectId: 'proj-001',
      tradeCategory: 'GENERAL_CONTRACTOR',
      limit: 5,
    })

    expect(result[0].contractorId).toBe('gc-1')
    expect(result[0].score).toBe(90)
    expect(result[0].matchReason).toContain('Top-rated contractor')
    expect(result[0].estimatedResponseTimeHours).toBe(2)  // fast responder
  })
})
