/**
 * markets.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../lib/prisma', () => ({
  default: {
    market: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    launchChecklistItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    marketConfig: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    project: { count: vi.fn() },
    contractAgreement: { count: vi.fn() },
  },
}))

import { prisma } from '../../../lib/prisma'
import {
  listMarkets,
  getMarket,
  createMarket,
  updateMarket,
  getChecklist,
  createChecklistItem,
  updateChecklistItem,
  getMarketStats,
} from '../markets.service'

const db = prisma as any

const MOCK_MARKET = {
  id: 'mkt-001',
  name: 'Los Angeles',
  jurisdictionCode: 'CA-LA',
  countryCode: 'US',
  stateCode: 'CA',
  city: 'Los Angeles',
  timezone: 'America/Los_Angeles',
  status: 'ACTIVE',
  launchDate: new Date('2026-01-01'),
  notes: null,
  createdAt: new Date('2026-01-01'),
  checklistItems: [
    { status: 'DONE' },
    { status: 'DONE' },
    { status: 'TODO' },
  ],
  _count: { checklistItems: 3 },
}

const MOCK_ITEM = {
  id: 'item-001',
  marketId: 'mkt-001',
  category: 'LEGAL',
  title: 'File LLC',
  description: null,
  status: 'TODO',
  dueDate: null,
  assigneeId: null,
  completedAt: null,
}

// ─── listMarkets ─────────────────────────────────────────────────────────────

describe('listMarkets', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns mapped markets with checklist progress', async () => {
    db.market.findMany.mockResolvedValue([MOCK_MARKET])
    const result = await listMarkets()
    expect(result[0].checklistProgress).toEqual({ total: 3, done: 2 })
    expect(result[0].jurisdictionCode).toBe('CA-LA')
  })

  it('filters by status', async () => {
    db.market.findMany.mockResolvedValue([])
    await listMarkets('PLANNED')
    expect(db.market.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'PLANNED' } }),
    )
  })
})

// ─── getMarket ───────────────────────────────────────────────────────────────

describe('getMarket', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when market not found', async () => {
    db.market.findUnique.mockResolvedValue(null)
    await expect(getMarket('mkt-xxx')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns market dto', async () => {
    db.market.findUnique.mockResolvedValue(MOCK_MARKET)
    const result = await getMarket('mkt-001')
    expect(result.name).toBe('Los Angeles')
  })
})

// ─── createMarket ────────────────────────────────────────────────────────────

describe('createMarket', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 409 when jurisdiction already exists', async () => {
    db.market.findFirst.mockResolvedValue(MOCK_MARKET)
    await expect(createMarket({
      name: 'LA Duplicate',
      jurisdictionCode: 'CA-LA',
      countryCode: 'US',
      timezone: 'America/Los_Angeles',
    })).rejects.toMatchObject({ statusCode: 409 })
  })

  it('creates market with PLANNED status', async () => {
    db.market.findFirst.mockResolvedValue(null)
    db.market.create.mockResolvedValue({ ...MOCK_MARKET, status: 'PLANNED', checklistItems: [] })
    const result = await createMarket({
      name: 'Houston',
      jurisdictionCode: 'TX-HOU',
      countryCode: 'US',
      timezone: 'America/Chicago',
    })
    expect(db.market.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PLANNED' }) }),
    )
    expect(result.jurisdictionCode).toBe('CA-LA') // from mock
  })
})

// ─── getChecklist ────────────────────────────────────────────────────────────

describe('getChecklist', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns checklist items ordered by category', async () => {
    db.launchChecklistItem.findMany.mockResolvedValue([MOCK_ITEM])
    const result = await getChecklist('mkt-001')
    expect(result[0].category).toBe('LEGAL')
    expect(result[0].status).toBe('TODO')
  })
})

// ─── createChecklistItem ─────────────────────────────────────────────────────

describe('createChecklistItem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when market not found', async () => {
    db.market.findUnique.mockResolvedValue(null)
    await expect(createChecklistItem({ marketId: 'bad', category: 'LEGAL', title: 'x' }))
      .rejects.toMatchObject({ statusCode: 404 })
  })

  it('creates item with TODO status', async () => {
    db.market.findUnique.mockResolvedValue(MOCK_MARKET)
    db.launchChecklistItem.create.mockResolvedValue(MOCK_ITEM)
    await createChecklistItem({ marketId: 'mkt-001', category: 'LEGAL', title: 'File LLC' })
    expect(db.launchChecklistItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'TODO' }) }),
    )
  })
})

// ─── updateChecklistItem ─────────────────────────────────────────────────────

describe('updateChecklistItem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('auto-sets completedAt when status → DONE', async () => {
    db.launchChecklistItem.findUnique.mockResolvedValue(MOCK_ITEM)
    db.launchChecklistItem.update.mockResolvedValue({ ...MOCK_ITEM, status: 'DONE', completedAt: new Date() })
    await updateChecklistItem('item-001', { status: 'DONE' })
    expect(db.launchChecklistItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ completedAt: expect.any(Date) }),
      }),
    )
  })
})

// ─── getMarketStats ──────────────────────────────────────────────────────────

describe('getMarketStats', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when market not found', async () => {
    db.market.findUnique.mockResolvedValue(null)
    await expect(getMarketStats('bad')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns aggregated stats', async () => {
    db.market.findUnique.mockResolvedValue(MOCK_MARKET)
    db.project.count.mockResolvedValue(12)
    db.contractAgreement.count.mockResolvedValue(8)
    const result = await getMarketStats('mkt-001')
    expect(result.activeProjects).toBe(12)
    expect(result.completedContracts).toBe(8)
  })
})
