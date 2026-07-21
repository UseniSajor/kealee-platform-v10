/**
 * revenue.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../lib/prisma', () => ({
  default: {
    subscriptionPlan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    leadPricing: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    sponsoredPlacement: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: { findUnique: vi.fn() },
  },
}))

import { prisma } from '../../../lib/prisma'
import {
  listSubscriptionPlans,
  getSubscriptionPlan,
  createSubscriptionPlan,
  listLeadPricing,
  getLeadPrice,
  upsertLeadPricing,
  getUpsellOffer,
} from '../revenue.service'

const db = prisma as any

const MOCK_PLAN = {
  id: 'plan-001',
  name: 'Professional',
  tier: 'PROFESSIONAL',
  monthlyPriceCents: 9900,
  annualPriceCents: 99000,
  features: { unlimitedLeads: true },
  leadCreditsPerMonth: null,
  maxProjects: null,
  maxTeamMembers: 10,
  active: true,
  stripePriceIdMonthly: 'price_monthly',
  stripePriceIdAnnual: 'price_annual',
}

const MOCK_PRICING = {
  id: 'lp-001',
  tradeCategory: 'GENERAL_CONTRACTOR',
  jurisdictionCode: 'CA-LA',
  strategy: 'FLAT',
  flatPriceCents: 4900,
  minBidCents: null,
  maxBidCents: null,
  active: true,
}

// ─── listSubscriptionPlans ───────────────────────────────────────────────────

describe('listSubscriptionPlans', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns active plans', async () => {
    db.subscriptionPlan.findMany.mockResolvedValue([MOCK_PLAN])
    const result = await listSubscriptionPlans()
    expect(result).toHaveLength(1)
    expect(result[0].tier).toBe('PROFESSIONAL')
  })

  it('filters by active: true when includeInactive=false', async () => {
    db.subscriptionPlan.findMany.mockResolvedValue([])
    await listSubscriptionPlans(false)
    expect(db.subscriptionPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } }),
    )
  })

  it('passes no where clause when includeInactive=true', async () => {
    db.subscriptionPlan.findMany.mockResolvedValue([MOCK_PLAN])
    await listSubscriptionPlans(true)
    expect(db.subscriptionPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined }),
    )
  })
})

// ─── getSubscriptionPlan ─────────────────────────────────────────────────────

describe('getSubscriptionPlan', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns plan when found', async () => {
    db.subscriptionPlan.findUnique.mockResolvedValue(MOCK_PLAN)
    const result = await getSubscriptionPlan('plan-001')
    expect(result.name).toBe('Professional')
  })

  it('throws 404 when not found', async () => {
    db.subscriptionPlan.findUnique.mockResolvedValue(null)
    await expect(getSubscriptionPlan('plan-xxx')).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── createSubscriptionPlan ──────────────────────────────────────────────────

describe('createSubscriptionPlan', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates plan and returns dto', async () => {
    db.subscriptionPlan.create.mockResolvedValue(MOCK_PLAN)
    const result = await createSubscriptionPlan({
      name: 'Professional',
      tier: 'PROFESSIONAL',
      monthlyPriceCents: 9900,
      annualPriceCents: 99000,
      features: {},
    })
    expect(result.monthlyPriceCents).toBe(9900)
    expect(db.subscriptionPlan.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ active: true }) }),
    )
  })
})

// ─── listLeadPricing ─────────────────────────────────────────────────────────

describe('listLeadPricing', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns filtered lead pricing records', async () => {
    db.leadPricing.findMany.mockResolvedValue([MOCK_PRICING])
    const result = await listLeadPricing('GENERAL_CONTRACTOR', 'CA-LA')
    expect(result[0].flatPriceCents).toBe(4900)
  })
})

// ─── getLeadPrice ────────────────────────────────────────────────────────────

describe('getLeadPrice', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when no pricing exists', async () => {
    db.leadPricing.findFirst.mockResolvedValue(null)
    const result = await getLeadPrice('PLUMBER', 'TX-HOU')
    expect(result).toBeNull()
  })

  it('returns pricing when found', async () => {
    db.leadPricing.findFirst.mockResolvedValue(MOCK_PRICING)
    const result = await getLeadPrice('GENERAL_CONTRACTOR', 'CA-LA')
    expect(result?.strategy).toBe('FLAT')
  })
})

// ─── upsertLeadPricing ───────────────────────────────────────────────────────

describe('upsertLeadPricing', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upserts and returns mapped pricing', async () => {
    db.leadPricing.upsert.mockResolvedValue(MOCK_PRICING)
    const result = await upsertLeadPricing({
      tradeCategory: 'GENERAL_CONTRACTOR',
      jurisdictionCode: 'CA-LA',
      strategy: 'FLAT',
      flatPriceCents: 4900,
    })
    expect(result.id).toBe('lp-001')
  })
})

// ─── getUpsellOffer ──────────────────────────────────────────────────────────

describe('getUpsellOffer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns offer copy for known trigger', async () => {
    db.subscriptionPlan.findFirst.mockResolvedValue(MOCK_PLAN)
    const result = await getUpsellOffer({ trigger: 'LEAD_LIMIT_REACHED' })
    expect(result.headline).toContain('lead limit')
    expect(result.ctaLabel).toContain('Professional')
    expect(result.recommendedPlanId).toBe('plan-001')
  })

  it('throws 400 for unknown trigger', async () => {
    await expect(getUpsellOffer({ trigger: 'UNKNOWN_TRIGGER' as any }))
      .rejects.toMatchObject({ statusCode: 400 })
  })
})
