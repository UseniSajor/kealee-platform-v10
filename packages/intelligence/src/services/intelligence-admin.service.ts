import { prisma, Prisma } from '@kealee/database'

export interface IntelligenceListFilters {
  jurisdiction?: string
  productType?: string
  minScore?: number
  maxScore?: number
  propertyType?: string
  ownershipType?: string
  priority?: string
  segment?: string
  minDataQuality?: number
  campaignStatus?: 'routed' | 'suppressed' | 'all'
  limit?: number
  offset?: number
}

export class IntelligenceAdminService {
  async listProperties(filters: IntelligenceListFilters = {}) {
    const limit = filters.limit ?? 50
    const offset = filters.offset ?? 0

    return prisma.propertyTwin.findMany({
      where: {
        ...(filters.jurisdiction
          ? { jurisdiction: { contains: filters.jurisdiction, mode: 'insensitive' } }
          : {}),
        ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
        ...(filters.ownershipType ? { ownershipType: filters.ownershipType } : {}),
        ...(filters.productType ? { recommendedProducts: { has: filters.productType } } : {}),
        ...(filters.minDataQuality != null
          ? { dataQualityScore: { gte: filters.minDataQuality } }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        opportunityScores: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        campaignRecommendations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })
  }

  async listOpportunities(filters: IntelligenceListFilters = {}) {
    const limit = filters.limit ?? 50
    const offset = filters.offset ?? 0

    return prisma.opportunityScore.findMany({
      where: {
        ...(filters.minScore != null ? { totalOpportunityScore: { gte: filters.minScore } } : {}),
        ...(filters.maxScore != null ? { totalOpportunityScore: { lte: filters.maxScore } } : {}),
        ...(filters.priority ? { recommendedPriority: filters.priority } : {}),
        propertyTwin: {
          ...(filters.jurisdiction
            ? { jurisdiction: { contains: filters.jurisdiction, mode: 'insensitive' } }
            : {}),
          ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
          ...(filters.productType ? { recommendedProducts: { has: filters.productType } } : {}),
        },
      },
      orderBy: { totalOpportunityScore: 'desc' },
      take: limit,
      skip: offset,
      include: { propertyTwin: true, loopRun: true },
    })
  }

  async listCampaigns(filters: IntelligenceListFilters = {}) {
    const limit = filters.limit ?? 50
    const offset = filters.offset ?? 0

    return prisma.campaignRecommendation.findMany({
      where: {
        ...(filters.priority ? { salesPriority: filters.priority } : {}),
        ...(filters.segment ? { recommendedCampaign: { contains: filters.segment, mode: 'insensitive' } } : {}),
        ...(filters.campaignStatus === 'suppressed'
          ? { NOT: { suppressionFlags: { equals: [] } } }
          : filters.campaignStatus === 'routed'
            ? { suppressionFlags: { equals: [] } }
            : {}),
        propertyTwin: filters.jurisdiction
          ? { jurisdiction: { contains: filters.jurisdiction, mode: 'insensitive' } }
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { propertyTwin: true },
    })
  }

  async listLoopHistory(propertyTwinId?: string, limit = 30) {
    return prisma.loopRun.findMany({
      where: propertyTwinId ? { propertyTwinId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        propertyTwin: { select: { address: true, jurisdiction: true } },
        leadTwin: { select: { email: true, name: true, segment: true } },
      },
    })
  }

  async listReviewQueue(limit = 50) {
    return prisma.loopRun.findMany({
      where: { status: 'awaiting_review' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        propertyTwin: true,
        leadTwin: true,
        projectTwin: true,
        capitalTwin: true,
        opportunityScores: { orderBy: { createdAt: 'desc' }, take: 1 },
        platformRuns: { orderBy: { createdAt: 'desc' }, take: 1 },
        steps: { orderBy: { stepOrder: 'asc' } },
      },
    })
  }

  async listLeads(filters: IntelligenceListFilters = {}) {
    const limit = filters.limit ?? 50
    const offset = filters.offset ?? 0
    return prisma.leadTwin.findMany({
      where: {
        ...(filters.segment ? { segment: filters.segment } : {}),
        ...(filters.priority ? { crmStatus: filters.priority } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        propertyTwin: { select: { address: true, jurisdiction: true } },
        intelligenceRuns: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })
  }

  async listCapital(filters: IntelligenceListFilters = {}) {
    const limit = filters.limit ?? 50
    const offset = filters.offset ?? 0
    return prisma.capitalTwin.findMany({
      where: {
        ...(filters.minScore != null ? { capitalFitScore: { gte: filters.minScore } } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        propertyTwin: { select: { address: true } },
        leadTwin: { select: { email: true, name: true } },
        intelligenceRuns: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })
  }

  async listProjects(filters: IntelligenceListFilters = {}) {
    const limit = filters.limit ?? 50
    const offset = filters.offset ?? 0
    return prisma.projectTwin.findMany({
      where: {
        ...(filters.minScore != null ? { healthScore: { gte: filters.minScore } } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        propertyTwin: { select: { address: true } },
        leadTwin: { select: { email: true, name: true } },
        intelligenceRuns: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })
  }

  async getDashboard() {
    const [
      propertyCount,
      opportunityCount,
      leadCount,
      capitalCount,
      projectCount,
      reviewCount,
      recentRuns,
    ] = await Promise.all([
      prisma.propertyTwin.count(),
      prisma.opportunityScore.count(),
      prisma.leadTwin.count(),
      prisma.capitalTwin.count(),
      prisma.projectTwin.count(),
      prisma.loopRun.count({ where: { status: 'awaiting_review' } }),
      prisma.intelligenceRun.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          propertyTwin: { select: { address: true } },
          leadTwin: { select: { email: true } },
        },
      }),
    ])

    return {
      counts: {
        properties: propertyCount,
        opportunities: opportunityCount,
        leads: leadCount,
        capital: capitalCount,
        projects: projectCount,
        awaitingReview: reviewCount,
      },
      recentRuns,
    }
  }

  async resolveReview(loopRunId: string, decision: 'approved' | 'rejected' | 'deferred', notes?: string) {
    const run = await prisma.loopRun.findUnique({ where: { id: loopRunId } })
    if (!run) throw new Error('Loop run not found')

    const result = {
      ...(run.result as Record<string, unknown> | null),
      reviewDecision: decision,
      reviewNotes: notes,
      reviewedAt: new Date().toISOString(),
    }

    return prisma.loopRun.update({
      where: { id: loopRunId },
      data: {
        status: decision === 'approved' ? 'completed' : decision === 'rejected' ? 'cancelled' : 'awaiting_review',
        result: result as Prisma.InputJsonValue,
        completedAt: decision !== 'deferred' ? new Date() : undefined,
      },
    })
  }
}

export const intelligenceAdminService = new IntelligenceAdminService()
