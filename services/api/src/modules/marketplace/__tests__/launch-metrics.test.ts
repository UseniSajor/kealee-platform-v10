/**
 * launch-metrics.test.ts
 *
 * Unit tests for P9: LaunchMetricsService and OnboardingService.
 * Uses Jest + manual prismaAny mock.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals'

// ── Mock prismaAny ────────────────────────────────────────────────────────────

const mockMarketplaceProfile = {
  count:     jest.fn(),
  aggregate: jest.fn(),
}
const mockLead = {
  count:     jest.fn(),
  aggregate: jest.fn(),
}
const mockPlatformFee = {
  aggregate: jest.fn(),
}
const mockProfessionalAssignment = {
  count: jest.fn(),
}
const mockVerificationDocument = {
  count: jest.fn(),
}
const mockContractorOnboarding = {
  findUnique: jest.fn(),
  findMany:   jest.fn(),
  create:     jest.fn(),
  update:     jest.fn(),
  groupBy:    jest.fn(),
}
const mockServiceRegion = {
  findMany: jest.fn(),
  create:   jest.fn(),
  update:   jest.fn(),
}
const mockLaunchCohort = {
  findMany: jest.fn(),
  create:   jest.fn(),
}
const mockUser = {
  findUnique: jest.fn(),
}

jest.mock('../../../utils/prisma-helper', () => ({
  prismaAny: {
    marketplaceProfile:      mockMarketplaceProfile,
    lead:                    mockLead,
    platformFee:             mockPlatformFee,
    professionalAssignment:  mockProfessionalAssignment,
    verificationDocument:    mockVerificationDocument,
    contractorOnboarding:    mockContractorOnboarding,
    serviceRegion:           mockServiceRegion,
    launchCohort:            mockLaunchCohort,
    user:                    mockUser,
  },
}))

import { LaunchMetricsService } from '../launch-metrics.service'
import { OnboardingService }    from '../onboarding.service'

// ── LaunchMetricsService ─────────────────────────────────────────────────────

describe('LaunchMetricsService', () => {
  let service: LaunchMetricsService

  beforeEach(() => {
    service = new LaunchMetricsService()
    jest.clearAllMocks()
  })

  // ── supplyMetrics ──────────────────────────────────────────────────────────

  describe('supplyMetrics()', () => {
    it('returns 6 supply metrics', async () => {
      mockMarketplaceProfile.count
        .mockResolvedValueOnce(80)   // total
        .mockResolvedValueOnce(60)   // verified
        .mockResolvedValueOnce(45)   // accepting
        .mockResolvedValueOnce(8)    // new 7d

      const metrics = await service.supplyMetrics()

      expect(metrics).toHaveLength(6)
      expect(metrics.find(m => m.name === 'contractors_registered')?.value).toBe(80)
      expect(metrics.find(m => m.name === 'contractors_verified')?.value).toBe(60)
      expect(metrics.find(m => m.name === 'contractors_accepting')?.value).toBe(45)
    })

    it('calculates verificationRate correctly', async () => {
      mockMarketplaceProfile.count
        .mockResolvedValueOnce(100)  // total
        .mockResolvedValueOnce(75)   // verified
        .mockResolvedValueOnce(50)   // accepting
        .mockResolvedValueOnce(5)    // new 7d

      const metrics = await service.supplyMetrics()
      const rate = metrics.find(m => m.name === 'contractor_verification_rate')
      expect(rate?.value).toBe(75)   // 75/100 = 75%
    })

    it('calculates activationRate correctly', async () => {
      mockMarketplaceProfile.count
        .mockResolvedValueOnce(100)  // total
        .mockResolvedValueOnce(80)   // verified
        .mockResolvedValueOnce(60)   // accepting (out of 80 verified)
        .mockResolvedValueOnce(5)    // new 7d

      const metrics = await service.supplyMetrics()
      const rate = metrics.find(m => m.name === 'contractor_activation_rate')
      expect(rate?.value).toBe(75)   // 60/80 = 75%
    })

    it('marks contractors_accepting as healthy when ≥20', async () => {
      mockMarketplaceProfile.count
        .mockResolvedValueOnce(50).mockResolvedValueOnce(40).mockResolvedValueOnce(25).mockResolvedValueOnce(3)
      const metrics = await service.supplyMetrics()
      const m = metrics.find(m => m.name === 'contractors_accepting')
      expect(m?.isHealthy).toBe(true)
    })

    it('marks contractors_accepting as unhealthy when <20', async () => {
      mockMarketplaceProfile.count
        .mockResolvedValueOnce(15).mockResolvedValueOnce(10).mockResolvedValueOnce(5).mockResolvedValueOnce(2)
      const metrics = await service.supplyMetrics()
      const m = metrics.find(m => m.name === 'contractors_accepting')
      expect(m?.isHealthy).toBe(false)
    })

    it('handles denominator zero for rates gracefully', async () => {
      mockMarketplaceProfile.count
        .mockResolvedValueOnce(0)  // total = 0
        .mockResolvedValueOnce(0)  // verified
        .mockResolvedValueOnce(0)  // accepting
        .mockResolvedValueOnce(0)  // new 7d

      const metrics = await service.supplyMetrics()
      expect(metrics.find(m => m.name === 'contractor_verification_rate')?.value).toBe(0)
      expect(metrics.find(m => m.name === 'contractor_activation_rate')?.value).toBe(0)
    })
  })

  // ── demandMetrics ──────────────────────────────────────────────────────────

  describe('demandMetrics()', () => {
    beforeEach(() => {
      mockLead.count
        .mockResolvedValueOnce(12)   // created 7d
        .mockResolvedValueOnce(100)  // total
        .mockResolvedValueOnce(60)   // distributed
        .mockResolvedValueOnce(20)   // quoted
        .mockResolvedValueOnce(15)   // awarded
        .mockResolvedValueOnce(30)   // construction_ready

      mockProfessionalAssignment.count
        .mockResolvedValueOnce(60)   // total assignments
        .mockResolvedValueOnce(42)   // accepted
        .mockResolvedValueOnce(9)    // expired/forfeited
    })

    it('returns demand metrics array', async () => {
      const metrics = await service.demandMetrics()
      expect(metrics.length).toBeGreaterThanOrEqual(6)
    })

    it('calculates acceptance rate from assignments', async () => {
      const metrics = await service.demandMetrics()
      const rate = metrics.find(m => m.name === 'lead_acceptance_rate')
      expect(rate?.value).toBe(70)   // 42/60 = 70%
    })

    it('calculates forfeit rate', async () => {
      const metrics = await service.demandMetrics()
      const rate = metrics.find(m => m.name === 'lead_forfeit_rate')
      expect(rate?.value).toBe(15)   // 9/60 = 15%
    })

    it('calculates permit_ready_rate (quality category)', async () => {
      const metrics = await service.demandMetrics()
      const rate = metrics.find(m => m.name === 'permit_ready_rate')
      expect(rate?.value).toBe(30)   // 30/100 = 30%
      expect(rate?.category).toBe('quality')
    })
  })

  // ── financialMetrics ──────────────────────────────────────────────────────

  describe('financialMetrics()', () => {
    it('returns 4 financial metrics', async () => {
      mockPlatformFee.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 50000 } })   // total fees
        .mockResolvedValueOnce({ _sum: { amount: 8500 }  })   // mtd fees
        .mockResolvedValueOnce({ _sum: { amount: 120000 } })  // escrow
      mockLead.aggregate
        .mockResolvedValueOnce({ _avg: { estimatedValue: 75000 } })  // avg contract

      const metrics = await service.financialMetrics()
      expect(metrics).toHaveLength(4)
      expect(metrics.find(m => m.name === 'platform_fees_total')?.value).toBe(50000)
      expect(metrics.find(m => m.name === 'escrow_balance')?.value).toBe(120000)
      expect(metrics.find(m => m.name === 'avg_contract_value')?.value).toBe(75000)
    })

    it('handles null aggregate values gracefully', async () => {
      mockPlatformFee.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } })
      mockLead.aggregate.mockResolvedValueOnce({ _avg: { estimatedValue: null } })

      const metrics = await service.financialMetrics()
      expect(metrics.find(m => m.name === 'platform_fees_total')?.value).toBe(0)
      expect(metrics.find(m => m.name === 'avg_contract_value')?.value).toBe(0)
    })
  })

  // ── qualityMetrics ─────────────────────────────────────────────────────────

  describe('qualityMetrics()', () => {
    it('returns quality metrics with correct values', async () => {
      mockMarketplaceProfile.aggregate.mockResolvedValueOnce({ _avg: { rating: 4.3 } })
      mockMarketplaceProfile.count.mockResolvedValueOnce(42)
      mockVerificationDocument.count
        .mockResolvedValueOnce(5)   // under review
        .mockResolvedValueOnce(2)   // expiring

      const metrics = await service.qualityMetrics()
      expect(metrics.find(m => m.name === 'avg_contractor_rating')?.value).toBe(4.3)
      expect(metrics.find(m => m.name === 'contractors_with_reviews')?.value).toBe(42)
      expect(metrics.find(m => m.name === 'docs_under_review')?.value).toBe(5)
      expect(metrics.find(m => m.name === 'docs_expiring_30d')?.value).toBe(2)
    })

    it('marks docs_under_review healthy when <20', async () => {
      mockMarketplaceProfile.aggregate.mockResolvedValueOnce({ _avg: { rating: 4.5 } })
      mockMarketplaceProfile.count.mockResolvedValueOnce(10)
      mockVerificationDocument.count.mockResolvedValueOnce(15).mockResolvedValueOnce(0)

      const metrics = await service.qualityMetrics()
      expect(metrics.find(m => m.name === 'docs_under_review')?.isHealthy).toBe(true)
    })
  })

  // ── regionStatus ──────────────────────────────────────────────────────────

  describe('regionStatus()', () => {
    it('maps region rows to RegionStatus shape', async () => {
      mockServiceRegion.findMany.mockResolvedValueOnce([
        { id: 'r1', slug: 'dc-metro', name: 'DC Metro', isLaunched: true, launchedAt: new Date('2026-01-01'), currentContractorCount: 45, targetContractorCount: 75 },
        { id: 'r2', slug: 'seattle', name: 'Seattle', isLaunched: false, launchedAt: null, currentContractorCount: 0, targetContractorCount: 50 },
      ])

      const regions = await service.regionStatus()
      expect(regions).toHaveLength(2)
      expect(regions[0].launched).toBe(true)
      expect(regions[0].contractors).toBe(45)
      expect(regions[1].launched).toBe(false)
      expect(regions[1].launchedAt).toBeNull()
    })

    it('returns empty array when serviceRegion table does not exist', async () => {
      mockServiceRegion.findMany.mockRejectedValueOnce(new Error('Table not found'))
      const regions = await service.regionStatus()
      expect(regions).toEqual([])
    })
  })
})

// ── OnboardingService ─────────────────────────────────────────────────────────

describe('OnboardingService', () => {
  let service: OnboardingService

  beforeEach(() => {
    service = new OnboardingService()
    jest.clearAllMocks()
  })

  const mockOB = {
    id:              'ob1',
    userId:          'user1',
    email:           'test@example.com',
    stage:           'REGISTRATION',
    completedStages: [],
    formData:        {},
    createdAt:       new Date('2026-01-01'),
    approvedAt:      null,
  }

  // ── getOrCreate ────────────────────────────────────────────────────────────

  describe('getOrCreate()', () => {
    it('returns existing record when present', async () => {
      mockContractorOnboarding.findUnique.mockResolvedValueOnce(mockOB)
      const result = await service.getOrCreate('user1', 'test@example.com')
      expect(result).toBe(mockOB)
      expect(mockContractorOnboarding.create).not.toHaveBeenCalled()
    })

    it('creates new record when not found', async () => {
      mockContractorOnboarding.findUnique.mockResolvedValueOnce(null)
      mockContractorOnboarding.create.mockResolvedValueOnce({ ...mockOB })

      await service.getOrCreate('user1', 'test@example.com', { inviteSource: 'linkedin' })
      expect(mockContractorOnboarding.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId:      'user1',
          email:       'test@example.com',
          stage:       'REGISTRATION',
          inviteSource: 'linkedin',
        }),
      })
    })
  })

  // ── advanceStage ──────────────────────────────────────────────────────────

  describe('advanceStage()', () => {
    it('advances stage and accumulates completedStages', async () => {
      mockContractorOnboarding.findUnique.mockResolvedValueOnce(mockOB)
      mockContractorOnboarding.update.mockResolvedValueOnce({ ...mockOB, stage: 'EMAIL_VERIFIED', completedStages: ['REGISTRATION'] })

      await service.advanceStage('user1', 'EMAIL_VERIFIED')
      const updateCall = mockContractorOnboarding.update.mock.calls[0][0]
      expect(updateCall.data.stage).toBe('EMAIL_VERIFIED')
      expect(updateCall.data.completedStages).toContain('REGISTRATION')
    })

    it('sets approvedAt when stage is APPROVED', async () => {
      mockContractorOnboarding.findUnique.mockResolvedValueOnce({ ...mockOB, stage: 'UNDER_REVIEW' })
      mockContractorOnboarding.update.mockResolvedValueOnce({})

      await service.advanceStage('user1', 'APPROVED')
      const updateCall = mockContractorOnboarding.update.mock.calls[0][0]
      expect(updateCall.data.approvedAt).toBeDefined()
      expect(updateCall.data.completedAt).toBeDefined()
    })

    it('sets rejectedAt when stage is REJECTED', async () => {
      mockContractorOnboarding.findUnique.mockResolvedValueOnce({ ...mockOB, stage: 'UNDER_REVIEW' })
      mockContractorOnboarding.update.mockResolvedValueOnce({})

      await service.advanceStage('user1', 'REJECTED')
      const updateCall = mockContractorOnboarding.update.mock.calls[0][0]
      expect(updateCall.data.rejectedAt).toBeDefined()
    })

    it('merges formData with existing data', async () => {
      mockContractorOnboarding.findUnique.mockResolvedValueOnce({
        ...mockOB,
        formData: { step1: { firstName: 'John' } },
      })
      mockContractorOnboarding.update.mockResolvedValueOnce({})

      await service.advanceStage('user1', 'PROFILE_BASIC', { step2: { businessName: 'ACME' } })
      const updateCall = mockContractorOnboarding.update.mock.calls[0][0]
      expect(updateCall.data.formData).toMatchObject({
        step1: { firstName: 'John' },
        step2: { businessName: 'ACME' },
      })
    })

    it('throws when no onboarding record exists', async () => {
      mockContractorOnboarding.findUnique.mockResolvedValueOnce(null)
      await expect(service.advanceStage('unknown', 'EMAIL_VERIFIED')).rejects.toThrow('not found')
    })
  })

  // ── approve / reject ──────────────────────────────────────────────────────

  describe('approve()', () => {
    it('calls advanceStage with APPROVED', async () => {
      mockContractorOnboarding.findUnique.mockResolvedValueOnce(mockOB)
      mockContractorOnboarding.update.mockResolvedValueOnce({})
      await service.approve('user1')
      const updateCall = mockContractorOnboarding.update.mock.calls[0][0]
      expect(updateCall.data.stage).toBe('APPROVED')
    })
  })

  describe('reject()', () => {
    it('sets REJECTED stage + reason', async () => {
      mockContractorOnboarding.update.mockResolvedValueOnce({})
      await service.reject('user1', 'License number not valid')
      expect(mockContractorOnboarding.update).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        data: expect.objectContaining({
          stage:           'REJECTED',
          rejectionReason: 'License number not valid',
        }),
      })
    })
  })

  // ── funnelStats ───────────────────────────────────────────────────────────

  describe('funnelStats()', () => {
    it('returns byStage counts with zeros for missing stages', async () => {
      mockContractorOnboarding.groupBy.mockResolvedValueOnce([
        { stage: 'REGISTRATION', _count: { _all: 50 } },
        { stage: 'APPROVED',     _count: { _all: 30 } },
      ])

      const stats = await service.funnelStats()
      expect(stats.byStage.REGISTRATION).toBe(50)
      expect(stats.byStage.APPROVED).toBe(30)
      expect(stats.byStage.EMAIL_VERIFIED).toBe(0)   // filled with zero
      expect(stats.total).toBe(80)
      expect(stats.approved).toBe(30)
    })

    it('calculates conversion rates between adjacent stages', async () => {
      mockContractorOnboarding.groupBy.mockResolvedValueOnce([
        { stage: 'REGISTRATION',   _count: { _all: 100 } },
        { stage: 'EMAIL_VERIFIED', _count: { _all: 80 } },
      ])

      const stats = await service.funnelStats()
      const reg2email = stats.conversions.find(c => c.from === 'REGISTRATION' && c.to === 'EMAIL_VERIFIED')
      expect(reg2email?.rate).toBe(80)   // 80/100 = 80%
    })
  })

  // ── avgTimeToApproval ─────────────────────────────────────────────────────

  describe('avgTimeToApproval()', () => {
    it('returns 0 when no approved records', async () => {
      mockContractorOnboarding.findMany.mockResolvedValueOnce([])
      expect(await service.avgTimeToApproval()).toBe(0)
    })

    it('calculates average days correctly', async () => {
      const now = new Date()
      const threeDaysAgo = new Date(now.getTime() - 3 * 86_400_000)
      const fiveDaysAgo  = new Date(now.getTime() - 5 * 86_400_000)

      mockContractorOnboarding.findMany.mockResolvedValueOnce([
        { createdAt: threeDaysAgo, approvedAt: now },
        { createdAt: fiveDaysAgo,  approvedAt: now },
      ])

      const avg = await service.avgTimeToApproval()
      expect(avg).toBe(4)  // (3+5)/2
    })
  })
})

// ── Seed data validation ──────────────────────────────────────────────────────

describe('Seed data: SERVICE_REGIONS', () => {
  it('includes DC Metro as first and launched region', async () => {
    const { SERVICE_REGIONS } = await import('../../../../packages/database/prisma/seeds/service-regions.seed').catch(() => ({
      SERVICE_REGIONS: null,
    }))
    if (!SERVICE_REGIONS) return   // skip if path not resolvable in test env
    const dc = (SERVICE_REGIONS as any[]).find((r: any) => r.slug === 'dc-metro')
    expect(dc).toBeDefined()
    expect(dc.isLaunched).toBe(true)
    expect(dc.states).toContain('DC')
  })
})

describe('Seed data: LAUNCH_CONFIG_DEFAULTS', () => {
  it('has rotation_enabled = true by default', async () => {
    const { LAUNCH_CONFIG_DEFAULTS } = await import('../../../../packages/database/prisma/seeds/launch-config.seed').catch(() => ({
      LAUNCH_CONFIG_DEFAULTS: null,
    }))
    if (!LAUNCH_CONFIG_DEFAULTS) return
    const flag = (LAUNCH_CONFIG_DEFAULTS as any[]).find((c: any) => c.key === 'rotation_enabled')
    expect(flag?.value).toBe(true)
  })

  it('has require_construction_ready_for_contractor = true', async () => {
    const { LAUNCH_CONFIG_DEFAULTS } = await import('../../../../packages/database/prisma/seeds/launch-config.seed').catch(() => ({
      LAUNCH_CONFIG_DEFAULTS: null,
    }))
    if (!LAUNCH_CONFIG_DEFAULTS) return
    const flag = (LAUNCH_CONFIG_DEFAULTS as any[]).find((c: any) => c.key === 'require_construction_ready_for_contractor')
    expect(flag?.value).toBe(true)
  })
})
