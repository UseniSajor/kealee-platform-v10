import { prisma } from '@kealee/database'
import { SCORING_BANDS } from '../constants/scoring-bands.js'

export interface OpportunityDashboardFilters {
  jurisdiction?: string
  productType?: string
  minScore?: number
  maxScore?: number
  propertyType?: string
  priority?: string
  limit?: number
}

export interface OpportunityDashboardSummary {
  totalProperties: number
  totalScored: number
  awaitingReview: number
  bandCounts: Record<string, number>
  avgScore: number
  topOpportunities: Array<{
    propertyTwinId: string
    address: string
    jurisdiction: string | null
    totalOpportunityScore: number
    recommendedPriority: string
    estimatedProjectValue: number | null
    topProduct: string | null
    confidenceScore: number
    createdAt: Date
  }>
}

export class OpportunityQueryService {
  async getDashboardSummary(filters: OpportunityDashboardFilters = {}): Promise<OpportunityDashboardSummary> {
    const limit = filters.limit ?? 25

    const [totalProperties, totalScored, awaitingReview, scores, recent] = await Promise.all([
      prisma.propertyTwin.count(),
      prisma.opportunityScore.count(),
      prisma.loopRun.count({ where: { status: 'awaiting_review' } }),
      prisma.opportunityScore.findMany({
        select: { totalOpportunityScore: true, recommendedPriority: true },
      }),
      prisma.opportunityScore.findMany({
        where: {
          ...(filters.minScore != null ? { totalOpportunityScore: { gte: filters.minScore } } : {}),
          ...(filters.maxScore != null ? { totalOpportunityScore: { lte: filters.maxScore } } : {}),
          ...(filters.priority ? { recommendedPriority: filters.priority } : {}),
          propertyTwin: {
            ...(filters.jurisdiction ? { jurisdiction: { contains: filters.jurisdiction, mode: 'insensitive' } } : {}),
            ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
            ...(filters.productType
              ? { recommendedProducts: { has: filters.productType } }
              : {}),
          },
        },
        orderBy: { totalOpportunityScore: 'desc' },
        take: limit,
        include: {
          propertyTwin: {
            select: {
              id: true,
              address: true,
              jurisdiction: true,
              recommendedProducts: true,
              latestScores: true,
            },
          },
        },
      }),
    ])

    const bandCounts: Record<string, number> = {}
    for (const band of SCORING_BANDS) {
      bandCounts[band.label] = scores.filter(
        (s) => s.totalOpportunityScore >= band.min && s.totalOpportunityScore <= band.max,
      ).length
    }

    const avgScore =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s.totalOpportunityScore, 0) / scores.length
        : 0

    return {
      totalProperties,
      totalScored,
      awaitingReview,
      bandCounts,
      avgScore: Math.round(avgScore * 10) / 10,
      topOpportunities: recent.map((row) => {
        const latest = row.propertyTwin.latestScores as { topProduct?: string } | null
        return {
          propertyTwinId: row.propertyTwin.id,
          address: row.propertyTwin.address,
          jurisdiction: row.propertyTwin.jurisdiction,
          totalOpportunityScore: row.totalOpportunityScore,
          recommendedPriority: row.recommendedPriority,
          estimatedProjectValue: row.estimatedProjectValue?.toNumber() ?? null,
          topProduct: latest?.topProduct ?? row.propertyTwin.recommendedProducts[0] ?? null,
          confidenceScore: row.confidenceScore,
          createdAt: row.createdAt,
        }
      }),
    }
  }
}

export const opportunityQueryService = new OpportunityQueryService()
