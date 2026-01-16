import { describe, it, expect, beforeEach, vi } from 'vitest'
import { leadsService } from '../leads.service'
import { prisma } from '@kealee/database'
import { Prisma } from '@prisma/client'
import { auditService } from '../../audit/audit.service'
import { eventService } from '../../events/event.service'

// Mock dependencies
vi.mock('@kealee/database', () => ({
  prisma: {
    lead: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    marketplaceProfile: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../../audit/audit.service', () => ({
  auditService: {
    recordAudit: vi.fn(),
  },
}))

vi.mock('../../events/event.service', () => ({
  eventService: {
    recordEvent: vi.fn(),
  },
}))

describe('leadsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('distributeLead', () => {
    it('should disqualify lead if estimatedValue exceeds $500k', async () => {
      const leadId = 'lead-123'
      const userId = 'user-123'
      const highValueLead = {
        id: leadId,
        stage: 'INTAKE' as const,
        estimatedValue: new Prisma.Decimal(600000),
        distributedTo: [],
      }

      ;(prisma.lead.findUnique as any).mockResolvedValue(highValueLead)
      ;(prisma.lead.update as any).mockResolvedValue({
        ...highValueLead,
        stage: 'LOST',
        lostAt: new Date(),
        lostReason: expect.stringContaining('exceeds maximum threshold'),
      })
      ;(auditService.recordAudit as any).mockResolvedValue({})
      ;(eventService.recordEvent as any).mockResolvedValue({})

      const result = await leadsService.distributeLead({
        leadId,
        userId,
      })

      expect(result.success).toBe(false)
      expect(result.reason).toBe('LEAD_VALUE_EXCEEDS_THRESHOLD')
      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: leadId },
        data: {
          stage: 'LOST',
          lostAt: expect.any(Date),
          lostReason: expect.stringContaining('500000'),
          stageChangedAt: expect.any(Date),
        },
      })
      expect(auditService.recordAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LEAD_DISQUALIFIED',
          entityType: 'Lead',
          entityId: leadId,
        })
      )
    })

    it('should mark lead as INTAKE if estimatedValue is missing', async () => {
      const leadId = 'lead-123'
      const userId = 'user-123'
      const leadWithoutValue = {
        id: leadId,
        stage: 'INTAKE' as const,
        estimatedValue: null,
        distributedTo: [],
      }

      const mockProfiles = [
        {
          id: 'profile-1',
          userId: 'user-1',
          businessName: 'Test Contractor',
          acceptingLeads: true,
          maxPipelineValue: new Prisma.Decimal(500000),
          subscriptionTier: 'pro',
          user: { status: 'ACTIVE' },
          distributedLeads: [],
          awardedLeads: [],
          quotes: [],
        },
      ]

      ;(prisma.lead.findUnique as any).mockResolvedValue(leadWithoutValue)
      ;(prisma.marketplaceProfile.findMany as any).mockResolvedValue(mockProfiles)
      ;(prisma.lead.update as any).mockResolvedValue({
        ...leadWithoutValue,
        stage: 'INTAKE',
        distributedTo: [{ id: 'profile-1' }],
      })
      ;(auditService.recordAudit as any).mockResolvedValue({})
      ;(eventService.recordEvent as any).mockResolvedValue({})

      const result = await leadsService.distributeLead({
        leadId,
        userId,
      })

      expect(result.success).toBe(true)
      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: leadId },
        data: expect.objectContaining({
          stage: 'INTAKE',
          stageChangedAt: expect.any(Date),
        }),
      })
    })

    it('should filter contractors by acceptingLeads = true', async () => {
      const leadId = 'lead-123'
      const lead = {
        id: leadId,
        stage: 'INTAKE' as const,
        estimatedValue: new Prisma.Decimal(100000),
        distributedTo: [],
      }

      const mockProfiles = [
        {
          id: 'profile-1',
          userId: 'user-1',
          businessName: 'Accepting Contractor',
          acceptingLeads: true,
          maxPipelineValue: new Prisma.Decimal(500000),
          subscriptionTier: 'pro',
          user: { status: 'ACTIVE' },
          distributedLeads: [],
          awardedLeads: [],
          quotes: [],
        },
        {
          id: 'profile-2',
          userId: 'user-2',
          businessName: 'Not Accepting',
          acceptingLeads: false, // Should be filtered out
          maxPipelineValue: new Prisma.Decimal(500000),
          subscriptionTier: 'basic',
          user: { status: 'ACTIVE' },
          distributedLeads: [],
          awardedLeads: [],
          quotes: [],
        },
      ]

      ;(prisma.lead.findUnique as any).mockResolvedValue(lead)
      ;(prisma.marketplaceProfile.findMany as any).mockResolvedValue(mockProfiles)
      ;(prisma.lead.update as any).mockResolvedValue({
        ...lead,
        distributedTo: [{ id: 'profile-1' }],
      })
      ;(auditService.recordAudit as any).mockResolvedValue({})
      ;(eventService.recordEvent as any).mockResolvedValue({})

      const result = await leadsService.distributeLead({
        leadId,
      })

      expect(result.success).toBe(true)
      // Should only distribute to profile-1 (acceptingLeads = true)
      expect(result.distributedTo).toHaveLength(1)
      expect(result.distributedTo[0].profileId).toBe('profile-1')
    })

    it('should filter contractors by maxPipelineValue constraint', async () => {
      const leadId = 'lead-123'
      const lead = {
        id: leadId,
        stage: 'INTAKE' as const,
        estimatedValue: new Prisma.Decimal(200000),
        distributedTo: [],
      }

      const mockProfiles = [
        {
          id: 'profile-1',
          userId: 'user-1',
          businessName: 'Has Capacity',
          acceptingLeads: true,
          maxPipelineValue: new Prisma.Decimal(500000),
          subscriptionTier: 'pro',
          user: { status: 'ACTIVE' },
          distributedLeads: [], // No existing pipeline
          awardedLeads: [],
          quotes: [],
        },
        {
          id: 'profile-2',
          userId: 'user-2',
          businessName: 'Exceeds Capacity',
          acceptingLeads: true,
          maxPipelineValue: new Prisma.Decimal(500000),
          subscriptionTier: 'basic',
          user: { status: 'ACTIVE' },
          distributedLeads: [
            { estimatedValue: new Prisma.Decimal(400000) }, // Already at 400k
          ], // Would exceed with 200k lead
          awardedLeads: [],
          quotes: [],
        },
      ]

      ;(prisma.lead.findUnique as any).mockResolvedValue(lead)
      ;(prisma.marketplaceProfile.findMany as any).mockResolvedValue(mockProfiles)
      ;(prisma.lead.update as any).mockResolvedValue({
        ...lead,
        distributedTo: [{ id: 'profile-1' }],
      })
      ;(auditService.recordAudit as any).mockResolvedValue({})
      ;(eventService.recordEvent as any).mockResolvedValue({})

      const result = await leadsService.distributeLead({
        leadId,
      })

      expect(result.success).toBe(true)
      // Should only distribute to profile-1 (has capacity)
      expect(result.distributedTo).toHaveLength(1)
      expect(result.distributedTo[0].profileId).toBe('profile-1')
    })

    it('should return error if no eligible contractors found', async () => {
      const leadId = 'lead-123'
      const lead = {
        id: leadId,
        stage: 'INTAKE' as const,
        estimatedValue: new Prisma.Decimal(100000),
        distributedTo: [],
      }

      ;(prisma.lead.findUnique as any).mockResolvedValue(lead)
      ;(prisma.marketplaceProfile.findMany as any).mockResolvedValue([]) // No contractors
      ;(auditService.recordAudit as any).mockResolvedValue({})
      ;(eventService.recordEvent as any).mockResolvedValue({})

      const result = await leadsService.distributeLead({
        leadId,
      })

      expect(result.success).toBe(false)
      expect(result.reason).toBe('NO_ELIGIBLE_CONTRACTORS')
      expect(auditService.recordAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LEAD_DISTRIBUTION_FAILED',
        })
      )
    })

    it('should limit distribution to top N contractors (default 5)', async () => {
      const leadId = 'lead-123'
      const lead = {
        id: leadId,
        stage: 'INTAKE' as const,
        estimatedValue: new Prisma.Decimal(100000),
        distributedTo: [],
      }

      // Create 10 eligible contractors
      const mockProfiles = Array.from({ length: 10 }, (_, i) => ({
        id: `profile-${i + 1}`,
        userId: `user-${i + 1}`,
        businessName: `Contractor ${i + 1}`,
        acceptingLeads: true,
        maxPipelineValue: new Prisma.Decimal(500000),
        subscriptionTier: 'pro',
        user: { status: 'ACTIVE' },
        distributedLeads: [],
        awardedLeads: [],
        quotes: [],
      }))

      ;(prisma.lead.findUnique as any).mockResolvedValue(lead)
      ;(prisma.marketplaceProfile.findMany as any).mockResolvedValue(mockProfiles)
      ;(prisma.lead.update as any).mockResolvedValue({
        ...lead,
        distributedTo: mockProfiles.slice(0, 5).map((p) => ({ id: p.id })),
      })
      ;(auditService.recordAudit as any).mockResolvedValue({})
      ;(eventService.recordEvent as any).mockResolvedValue({})

      const result = await leadsService.distributeLead({
        leadId,
      })

      expect(result.success).toBe(true)
      expect(result.distributedTo).toHaveLength(5) // Default limit
    })

    it('should respect custom distributionCount', async () => {
      const leadId = 'lead-123'
      const lead = {
        id: leadId,
        stage: 'INTAKE' as const,
        estimatedValue: new Prisma.Decimal(100000),
        distributedTo: [],
      }

      const mockProfiles = Array.from({ length: 10 }, (_, i) => ({
        id: `profile-${i + 1}`,
        userId: `user-${i + 1}`,
        businessName: `Contractor ${i + 1}`,
        acceptingLeads: true,
        maxPipelineValue: new Prisma.Decimal(500000),
        subscriptionTier: 'pro',
        user: { status: 'ACTIVE' },
        distributedLeads: [],
        awardedLeads: [],
        quotes: [],
      }))

      ;(prisma.lead.findUnique as any).mockResolvedValue(lead)
      ;(prisma.marketplaceProfile.findMany as any).mockResolvedValue(mockProfiles)
      ;(prisma.lead.update as any).mockResolvedValue({
        ...lead,
        distributedTo: mockProfiles.slice(0, 3).map((p) => ({ id: p.id })),
      })
      ;(auditService.recordAudit as any).mockResolvedValue({})
      ;(eventService.recordEvent as any).mockResolvedValue({})

      const result = await leadsService.distributeLead({
        leadId,
        distributionCount: 3,
      })

      expect(result.success).toBe(true)
      expect(result.distributedTo).toHaveLength(3) // Custom limit
    })
  })

  describe('findEligibleContractors', () => {
    it('should sort contractors by verified, performanceScore, rating, projectsCompleted', async () => {
      const lead = {
        id: 'lead-123',
        estimatedValue: new Prisma.Decimal(100000),
        projectType: null,
        city: null,
        state: null,
      }

      const mockProfiles = [
        {
          id: 'profile-1',
          userId: 'user-1',
          businessName: 'Low Priority',
          acceptingLeads: true,
          maxPipelineValue: new Prisma.Decimal(500000),
          subscriptionTier: 'basic',
          user: { status: 'ACTIVE' },
          distributedLeads: [],
          awardedLeads: [], // 0 completed
          quotes: [],
        },
        {
          id: 'profile-2',
          userId: 'user-2',
          businessName: 'High Priority',
          acceptingLeads: true,
          maxPipelineValue: new Prisma.Decimal(500000),
          subscriptionTier: 'enterprise',
          user: { status: 'ACTIVE' },
          distributedLeads: [],
          awardedLeads: Array(5).fill({ id: 'project' }), // 5 completed
          quotes: [],
        },
      ]

      ;(prisma.marketplaceProfile.findMany as any).mockResolvedValue(mockProfiles)

      const candidates = await leadsService.findEligibleContractors(lead, 10)

      // Should prioritize profile-2 (more projects completed)
      expect(candidates.length).toBeGreaterThan(0)
      // Note: Since verified, performanceScore, rating are all null/calculated,
      // sorting will primarily be by projectsCompleted
      expect(candidates[0].projectsCompleted).toBeGreaterThanOrEqual(
        candidates[candidates.length - 1]?.projectsCompleted || 0
      )
    })
  })
})
