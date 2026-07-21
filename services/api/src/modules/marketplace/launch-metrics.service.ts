/**
 * launch-metrics.service.ts
 *
 * Aggregates live marketplace KPIs from the database for the command-center
 * launch dashboard and os-admin launch control panel.
 * All queries degrade gracefully (`.catch(() => fallback)`) so the dashboard
 * works before every migration has been applied in a given environment.
 */

import { prismaAny } from '../../utils/prisma-helper'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MetricValue {
  name:           string
  label:          string
  value:          number
  unit:           'count' | 'percent' | 'usd' | 'days'
  category:       'supply' | 'demand' | 'financial' | 'quality'
  trend?:         'up' | 'down' | 'flat'
  changePercent?: number
  target?:        number
  isHealthy?:     boolean
}

export interface RegionStatus {
  id:          string
  slug:        string
  name:        string
  launched:    boolean
  launchedAt:  string | null
  contractors: number
  target:      number
}

export interface LaunchDashboard {
  generatedAt: string
  supply:      MetricValue[]
  demand:      MetricValue[]
  financial:   MetricValue[]
  quality:     MetricValue[]
  funnel:      Array<{ stage: string; count: number }>
  regions:     RegionStatus[]
  onboarding:  {
    avgDaysToApproval: number
    funnelByStage:     Record<string, number>
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const daysAgo = (n: number): Date => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const pct = (num: number, den: number): number =>
  den === 0 ? 0 : Math.round((num / den) * 100)

const safe = <T>(promise: Promise<T>, fallback: T): Promise<T> =>
  promise.catch(() => fallback)

// ── Service ───────────────────────────────────────────────────────────────────

export class LaunchMetricsService {

  // ── Supply ──────────────────────────────────────────────────────────────────

  async supplyMetrics(): Promise<MetricValue[]> {
    const [
      totalContractors,
      verifiedContractors,
      acceptingLeads,
      newThisWeek,
    ] = await Promise.all([
      safe(prismaAny.marketplaceProfile.count(), 0),
      safe(prismaAny.marketplaceProfile.count({ where: { verified: true } }), 0),
      safe(prismaAny.marketplaceProfile.count({ where: { verified: true, acceptingLeads: true } }), 0),
      safe(prismaAny.marketplaceProfile.count({ where: { createdAt: { gte: daysAgo(7) } } }), 0),
    ])

    const verificationRate = pct(verifiedContractors, totalContractors)
    const activationRate   = pct(acceptingLeads,      verifiedContractors)

    return [
      {
        name: 'contractors_registered',
        label: 'Total Registered',
        value: totalContractors,
        unit: 'count',
        category: 'supply',
        target: 200,
        isHealthy: totalContractors >= 50,
      },
      {
        name: 'contractors_verified',
        label: 'Verified',
        value: verifiedContractors,
        unit: 'count',
        category: 'supply',
        target: 150,
        isHealthy: verifiedContractors >= 30,
      },
      {
        name: 'contractors_accepting',
        label: 'Accepting Leads',
        value: acceptingLeads,
        unit: 'count',
        category: 'supply',
        target: 100,
        isHealthy: acceptingLeads >= 20,
      },
      {
        name: 'contractor_verification_rate',
        label: 'Verification Rate',
        value: verificationRate,
        unit: 'percent',
        category: 'supply',
        target: 80,
        isHealthy: verificationRate >= 60,
      },
      {
        name: 'contractor_activation_rate',
        label: 'Activation Rate',
        value: activationRate,
        unit: 'percent',
        category: 'supply',
        target: 75,
        isHealthy: activationRate >= 60,
      },
      {
        name: 'contractors_new_7d',
        label: 'New This Week',
        value: newThisWeek,
        unit: 'count',
        category: 'supply',
      },
    ]
  }

  // ── Demand ──────────────────────────────────────────────────────────────────

  async demandMetrics(): Promise<MetricValue[]> {
    const [
      leadsCreated7d,
      leadsTotal,
      leadsDistributed,
      leadsQuoted,
      leadsAwarded,
      constructionReadyLeads,
      totalAssignments,
      acceptedAssignments,
      expiredAssignments,
    ] = await Promise.all([
      safe(prismaAny.lead.count({ where: { createdAt: { gte: daysAgo(7) } } }), 0),
      safe(prismaAny.lead.count(), 0),
      safe(prismaAny.lead.count({ where: { stage: { in: ['DISTRIBUTED', 'QUOTED', 'AWARDED'] } } }), 0),
      safe(prismaAny.lead.count({ where: { stage: 'QUOTED' } }), 0),
      safe(prismaAny.lead.count({ where: { stage: 'AWARDED' } }), 0),
      safe(
        prismaAny.lead.count({
          where: { project: { constructionReadiness: 'CONSTRUCTION_READY' } },
        }),
        0,
      ),
      safe(prismaAny.professionalAssignment.count(), 0),
      safe(prismaAny.professionalAssignment.count({ where: { status: 'ACCEPTED' } }), 0),
      safe(
        prismaAny.professionalAssignment.count({
          where: { status: { in: ['EXPIRED', 'FORFEITED'] } },
        }),
        0,
      ),
    ])

    const acceptanceRate = pct(acceptedAssignments, totalAssignments)
    const forfeitRate    = pct(expiredAssignments,  totalAssignments)
    const quoteRate      = pct(leadsQuoted + leadsAwarded, leadsDistributed)
    const conversionRate = pct(leadsAwarded, leadsDistributed)
    const permitReadyRate = pct(constructionReadyLeads, leadsTotal)

    return [
      {
        name: 'leads_created_7d',
        label: 'New Leads (7d)',
        value: leadsCreated7d,
        unit: 'count',
        category: 'demand',
        target: 20,
        isHealthy: leadsCreated7d >= 10,
      },
      {
        name: 'leads_total',
        label: 'Total Leads',
        value: leadsTotal,
        unit: 'count',
        category: 'demand',
      },
      {
        name: 'leads_distributed',
        label: 'Distributed',
        value: leadsDistributed,
        unit: 'count',
        category: 'demand',
      },
      {
        name: 'lead_acceptance_rate',
        label: 'Acceptance Rate',
        value: acceptanceRate,
        unit: 'percent',
        category: 'demand',
        target: 70,
        isHealthy: acceptanceRate >= 60,
      },
      {
        name: 'lead_forfeit_rate',
        label: 'Forfeit Rate',
        value: forfeitRate,
        unit: 'percent',
        category: 'demand',
        target: 15,
        isHealthy: forfeitRate <= 20,
      },
      {
        name: 'lead_quote_rate',
        label: 'Quote Rate',
        value: quoteRate,
        unit: 'percent',
        category: 'demand',
        target: 50,
        isHealthy: quoteRate >= 40,
      },
      {
        name: 'lead_conversion_rate',
        label: 'Lead → Contract',
        value: conversionRate,
        unit: 'percent',
        category: 'demand',
        target: 25,
        isHealthy: conversionRate >= 20,
      },
      {
        name: 'permit_ready_rate',
        label: 'Permit-Ready Leads',
        value: permitReadyRate,
        unit: 'percent',
        category: 'quality',
        target: 80,
        isHealthy: permitReadyRate >= 70,
      },
    ]
  }

  // ── Financial ────────────────────────────────────────────────────────────────

  async financialMetrics(): Promise<MetricValue[]> {
    const mtdStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    const [feesTotal, feesMtd, escrowRow, avgContractRow] = await Promise.all([
      safe(
        prismaAny.platformFee.aggregate({
          where: { status: 'COLLECTED' },
          _sum:  { amount: true },
        }),
        { _sum: { amount: 0 } },
      ),
      safe(
        prismaAny.platformFee.aggregate({
          where: { status: 'COLLECTED', collectedAt: { gte: mtdStart } },
          _sum:  { amount: true },
        }),
        { _sum: { amount: 0 } },
      ),
      safe(
        prismaAny.platformFee.aggregate({
          where: { status: 'HOLD' },
          _sum:  { amount: true },
        }),
        { _sum: { amount: 0 } },
      ),
      safe(
        prismaAny.lead.aggregate({
          where: { stage: 'AWARDED', estimatedValue: { not: null } },
          _avg:  { estimatedValue: true },
        }),
        { _avg: { estimatedValue: 0 } },
      ),
    ])

    return [
      {
        name: 'platform_fees_total',
        label: 'Total Fees Collected',
        value: Math.round(Number(feesTotal._sum.amount) || 0),
        unit: 'usd',
        category: 'financial',
      },
      {
        name: 'platform_fees_mtd',
        label: 'Fees MTD',
        value: Math.round(Number(feesMtd._sum.amount) || 0),
        unit: 'usd',
        category: 'financial',
        target: 10000,
      },
      {
        name: 'escrow_balance',
        label: 'Escrow Balance',
        value: Math.round(Number(escrowRow._sum.amount) || 0),
        unit: 'usd',
        category: 'financial',
      },
      {
        name: 'avg_contract_value',
        label: 'Avg Contract Value',
        value: Math.round(Number(avgContractRow._avg.estimatedValue) || 0),
        unit: 'usd',
        category: 'financial',
        target: 75000,
        isHealthy: Number(avgContractRow._avg.estimatedValue) >= 40000,
      },
    ]
  }

  // ── Quality ──────────────────────────────────────────────────────────────────

  async qualityMetrics(): Promise<MetricValue[]> {
    const [avgRatingRow, reviewedCount, docsUnderReview, docsExpiring] = await Promise.all([
      safe(
        prismaAny.marketplaceProfile.aggregate({
          where: { verified: true },
          _avg:  { rating: true },
        }),
        { _avg: { rating: 0 } },
      ),
      safe(prismaAny.marketplaceProfile.count({ where: { reviewCount: { gt: 0 } } }), 0),
      safe(
        prismaAny.verificationDocument.count({ where: { status: 'UNDER_REVIEW' } }),
        0,
      ),
      safe(
        prismaAny.verificationDocument.count({
          where: {
            status:    'APPROVED',
            expiresAt: { lt: new Date(Date.now() + 30 * 86_400_000) },
          },
        }),
        0,
      ),
    ])

    const avgR = Math.round((Number(avgRatingRow._avg?.rating) || 0) * 10) / 10

    return [
      {
        name: 'avg_contractor_rating',
        label: 'Avg Contractor Rating',
        value: avgR,
        unit: 'count',
        category: 'quality',
        target: 4.5,
        isHealthy: avgR >= 4.0,
      },
      {
        name: 'contractors_with_reviews',
        label: 'Contractors w/ Reviews',
        value: reviewedCount,
        unit: 'count',
        category: 'quality',
      },
      {
        name: 'docs_under_review',
        label: 'Docs Awaiting Review',
        value: docsUnderReview,
        unit: 'count',
        category: 'quality',
        isHealthy: docsUnderReview < 20,
      },
      {
        name: 'docs_expiring_30d',
        label: 'Docs Expiring (30d)',
        value: docsExpiring,
        unit: 'count',
        category: 'quality',
        isHealthy: docsExpiring === 0,
      },
    ]
  }

  // ── Regions ──────────────────────────────────────────────────────────────────

  async regionStatus(): Promise<RegionStatus[]> {
    const rows = await safe(
      prismaAny.serviceRegion.findMany({
        where:   { isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
      [],
    )
    return (rows as Array<any>).map(r => ({
      id:          r.id,
      slug:        r.slug,
      name:        r.name,
      launched:    r.isLaunched,
      launchedAt:  r.launchedAt ? r.launchedAt.toISOString() : null,
      contractors: r.currentContractorCount,
      target:      r.targetContractorCount,
    }))
  }

  // ── Full dashboard ────────────────────────────────────────────────────────────

  async fullDashboard(): Promise<LaunchDashboard> {
    const [supply, demand, financial, quality, funnelRaw, regions, avgDays, funnelStats] =
      await Promise.all([
        this.supplyMetrics(),
        this.demandMetrics(),
        this.financialMetrics(),
        this.qualityMetrics(),
        safe(
          prismaAny.contractorOnboarding.groupBy({
            by:    ['stage'],
            _count: { _all: true },
          }),
          [],
        ),
        this.regionStatus(),
        safe(
          prismaAny.contractorOnboarding
            .findMany({
              where:  { stage: { in: ['APPROVED', 'ACTIVE'] }, approvedAt: { not: null } },
              select: { createdAt: true, approvedAt: true },
            })
            .then((recs: Array<{ createdAt: Date; approvedAt: Date }>) => {
              if (!recs.length) return 0
              const total = recs.reduce(
                (s, r) => s + (r.approvedAt.getTime() - r.createdAt.getTime()),
                0,
              )
              return Math.round(total / recs.length / 86_400_000)
            }),
          0,
        ),
        safe(
          prismaAny.contractorOnboarding
            .groupBy({ by: ['stage'], _count: { _all: true } })
            .then((rows: Array<{ stage: string; _count: { _all: number } }>) =>
              Object.fromEntries(rows.map(r => [r.stage, r._count._all])),
            ),
          {},
        ),
      ])

    const funnel = (
      funnelRaw as Array<{ stage: string; _count: { _all: number } }>
    ).map(r => ({ stage: r.stage, count: r._count._all }))

    // Separate the permit_ready_rate metric (tagged quality) from demand slice
    const demandOnly   = demand.filter(m => m.category === 'demand')
    const qualityExtra = demand.filter(m => m.category === 'quality')

    return {
      generatedAt: new Date().toISOString(),
      supply,
      demand:    demandOnly,
      financial,
      quality:   [...quality, ...qualityExtra],
      funnel,
      regions,
      onboarding: {
        avgDaysToApproval: avgDays as number,
        funnelByStage:     funnelStats as Record<string, number>,
      },
    }
  }
}

export const launchMetricsService = new LaunchMetricsService()
