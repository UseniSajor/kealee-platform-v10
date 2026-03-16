/**
 * services/command-center/bots/growth/growth.service.ts
 *
 * GrowthBot core service — queries production DB via Prisma,
 * assembles supply/demand data, and runs analysis.
 */

import { PrismaClient } from '@prisma/client'
import { v4 as uuid } from 'uuid'
import { createLogger } from '@kealee/observability'
import {
  buildTradeScore,
  buildGeoScore,
  buildBacklogRiskScore,
  calcInactivityRisk,
  buildRecruitmentPriorityList,
  buildDemandGenPriorityList,
  calcOverallLiquidityScore,
} from './growth.scoring.js'
import { deriveAllRecommendations } from './growth.rules.js'
import type {
  TradeDemandRow,
  TradeSupplyRow,
  GeoRow,
  AssignmentBacklogRow,
  ContractorInactivityScore,
  GrowthAnalysis,
  GrowthDashboardMetrics,
  TradeScore,
  GeoScore,
  BacklogRiskScore,
} from './growth.types.js'

const logger = createLogger('growth-service')

// Prisma as `any` since schema types may differ across v10/v20
const db = new PrismaClient() as any

// ─── Constants ────────────────────────────────────────────────────────────────

const INACTIVITY_DAYS_THRESHOLD = 60
const DEMAND_LOOKBACK_DAYS      = 90   // projects created in last N days
const ASSIGNMENT_LOOKBACK_DAYS  = 30

// ─── DB helpers ───────────────────────────────────────────────────────────────

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

// ─── Supply data ──────────────────────────────────────────────────────────────

async function fetchTradeSupply(): Promise<TradeSupplyRow[]> {
  /**
   * Query RotationQueueEntry grouped by professionalType/trade,
   * joined to ProfessionalAssignment for response rate.
   *
   * NOTE: csiDivisions on MarketplaceProfile is a string[].
   * We use UNNEST / raw SQL for aggregation.
   * Falls back to mock-safe grouping if raw unavailable.
   */
  try {
    // Get all ELIGIBLE queue entries with their profile specialties
    const queueEntries: any[] = await db.rotationQueueEntry.findMany({
      where: {
        professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] },
      },
      include: {
        profile: {
          select: {
            id: true,
            csiDivisions: true,
            userId: true,
            createdAt: true,
          },
        },
      },
    })

    // Aggregate by specialty
    const tradeMap = new Map<string, {
      total: number
      verified: number
      active: number
      inactive: number
    }>()

    const cutoff = daysAgo(INACTIVITY_DAYS_THRESHOLD)

    for (const entry of queueEntries) {
      const isVerified = entry.eligibility === 'ELIGIBLE'
      const isInactive = entry.profile?.createdAt < cutoff

      const specialties: string[] = entry.profile?.csiDivisions ?? ['General']
      for (const spec of specialties.length > 0 ? specialties : ['General']) {
        if (!tradeMap.has(spec)) {
          tradeMap.set(spec, { total: 0, verified: 0, active: 0, inactive: 0 })
        }
        const row = tradeMap.get(spec)!
        row.total++
        if (isVerified) row.verified++
        if (isInactive) row.inactive++
        else row.active++
      }
    }

    return [...tradeMap.entries()].map(([trade, counts]) => ({
      trade,
      totalContractors:  counts.total,
      verifiedContractors: counts.verified,
      activeContractors: counts.active,
      inactiveContractors: counts.inactive,
      avgResponseRateDays: 1.5, // TODO: compute from assignment.respondedAt - assignedAt
    }))
  } catch (err) {
    logger.warn({ err }, 'fetchTradeSupply: falling back to empty supply')
    return []
  }
}

// ─── Demand data ──────────────────────────────────────────────────────────────

async function fetchTradeDemand(): Promise<TradeDemandRow[]> {
  try {
    const since = daysAgo(DEMAND_LOOKBACK_DAYS)
    const expirySince = daysAgo(ASSIGNMENT_LOOKBACK_DAYS)

    // Fetch leads with assignments
    const leads: any[] = await db.lead.findMany({
      where: { createdAt: { gte: since } },
      select: {
        id: true,
        csiDivisions: true,
        estimatedValue: true,
        budget: true,
        stage: true,
        assignments: {
          select: {
            status: true,
            assignedAt: true,
            respondedAt: true,
          },
        },
      },
    })

    const tradeMap = new Map<string, {
      open: number
      totalValue: number
      values: number[]
      unfilled: number
      expired: number
      unfilledDays: number[]
    }>()

    const now = Date.now()
    for (const lead of leads) {
      const specialties: string[] = lead.csiDivisions ?? ['General']
      const value = Number(lead.estimatedValue ?? lead.budget ?? 0)
      const isOpen = lead.stage !== 'CLOSED' && lead.stage !== 'COMPLETED'

      const unfilled = lead.assignments.filter((a: any) => a.status === 'PENDING').length
      const expired  = lead.assignments.filter((a: any) => a.status === 'EXPIRED' || a.status === 'FORFEITED').length
      const unfilledDays = unfilled > 0
        ? (now - new Date(lead.assignments[0]?.assignedAt ?? now).getTime()) / 86_400_000
        : 0

      for (const spec of specialties.length > 0 ? specialties : ['General']) {
        if (!tradeMap.has(spec)) {
          tradeMap.set(spec, { open: 0, totalValue: 0, values: [], unfilled: 0, expired: 0, unfilledDays: [] })
        }
        const row = tradeMap.get(spec)!
        if (isOpen) row.open++
        row.totalValue += value
        if (value > 0) row.values.push(value)
        row.unfilled += unfilled
        row.expired  += expired
        if (unfilledDays > 0) row.unfilledDays.push(unfilledDays)
      }
    }

    return [...tradeMap.entries()].map(([trade, d]) => {
      const sortedValues = [...d.values].sort((a, b) => a - b)
      const median = sortedValues.length > 0
        ? sortedValues[Math.floor(sortedValues.length / 2)]
        : 0
      const avgDaysUnfilled = d.unfilledDays.length > 0
        ? d.unfilledDays.reduce((s, v) => s + v, 0) / d.unfilledDays.length
        : 0

      return {
        trade,
        openProjectCount:        d.open,
        totalProjectValue:       d.totalValue,
        medianProjectValue:      median,
        unfilledAssignmentCount: d.unfilled,
        expiredAssignmentCount:  d.expired,
        avgDaysUnfilled,
      }
    })
  } catch (err) {
    logger.warn({ err }, 'fetchTradeDemand: falling back to empty demand')
    return []
  }
}

// ─── Geography data ───────────────────────────────────────────────────────────

async function fetchGeoData(): Promise<GeoRow[]> {
  try {
    const since = daysAgo(DEMAND_LOOKBACK_DAYS)

    const leads: any[] = await db.lead.findMany({
      where: { createdAt: { gte: since }, state: { not: null } },
      select: {
        id: true,
        state: true,
        city: true,
        estimatedValue: true,
        stage: true,
        assignments: { select: { status: true } },
      },
    })

    const contractors: any[] = await db.rotationQueueEntry.findMany({
      where: {
        eligibility: 'ELIGIBLE',
        professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] },
      },
      include: {
        profile: {
          select: { serviceArea: true, city: true, state: true },
        },
      },
    })

    // Build geo demand map
    const geoMap = new Map<string, GeoRow>()

    for (const lead of leads) {
      if (!lead.state) continue
      const key = lead.city ? `${lead.state}:${lead.city}` : lead.state
      if (!geoMap.has(key)) {
        geoMap.set(key, {
          state: lead.state,
          city: lead.city ?? undefined,
          openProjectCount:       0,
          unfilledProjectCount:   0,
          verifiedContractorCount: 0,
          expiredAssignmentCount: 0,
          medianProjectValue:     0,
        })
      }
      const row = geoMap.get(key)!
      const isOpen = lead.stage !== 'CLOSED' && lead.stage !== 'COMPLETED'
      if (isOpen) row.openProjectCount++

      const hasUnfilled = lead.assignments.some((a: any) => a.status === 'PENDING')
      if (hasUnfilled) row.unfilledProjectCount++

      const hasExpired  = lead.assignments.some((a: any) => a.status === 'EXPIRED' || a.status === 'FORFEITED')
      if (hasExpired)   row.expiredAssignmentCount++
    }

    // Add contractor supply counts
    for (const entry of contractors) {
      const state = entry.profile?.state
      const city  = entry.profile?.city
      if (!state) continue
      const key = city ? `${state}:${city}` : state
      if (!geoMap.has(key)) {
        geoMap.set(key, {
          state, city: city ?? undefined,
          openProjectCount: 0, unfilledProjectCount: 0,
          verifiedContractorCount: 0, expiredAssignmentCount: 0,
          medianProjectValue: 0,
        })
      }
      geoMap.get(key)!.verifiedContractorCount++
    }

    return [...geoMap.values()].filter(r => r.openProjectCount > 0 || r.verifiedContractorCount > 0)
  } catch (err) {
    logger.warn({ err }, 'fetchGeoData: falling back to empty geo')
    return []
  }
}

// ─── Backlog data ─────────────────────────────────────────────────────────────

async function fetchBacklogData(): Promise<AssignmentBacklogRow[]> {
  try {
    const assignments: any[] = await db.professionalAssignment.findMany({
      where: {
        status: 'PENDING',
        assignedAt: { gte: daysAgo(ASSIGNMENT_LOOKBACK_DAYS) },
      },
      include: {
        lead: { select: { csiDivisions: true, state: true, city: true } },
      },
    })

    const backlogMap = new Map<string, {
      trade: string; state: string
      depths: number
      daysUnfilled: number[]
      expiryHours: number[]
    }>()

    const now = Date.now()
    for (const a of assignments) {
      const trade = (a.lead?.csiDivisions?.[0] ?? 'General') as string
      const state = (a.lead?.state ?? 'Unknown') as string
      const key   = `${trade}:${state}`
      if (!backlogMap.has(key)) {
        backlogMap.set(key, { trade, state, depths: 0, daysUnfilled: [], expiryHours: [] })
      }
      const row = backlogMap.get(key)!
      row.depths++
      row.daysUnfilled.push((now - new Date(a.assignedAt).getTime()) / 86_400_000)
      const expiryMs = new Date(a.acceptDeadline).getTime() - now
      row.expiryHours.push(Math.max(0, expiryMs / 3_600_000))
    }

    return [...backlogMap.values()].map(row => ({
      trade:  row.trade,
      state:  row.state,
      queueDepth: row.depths,
      oldestUnfilledDays: row.daysUnfilled.length > 0 ? Math.max(...row.daysUnfilled) : 0,
      avgExpiryHoursRemaining: row.expiryHours.length > 0
        ? row.expiryHours.reduce((s, v) => s + v, 0) / row.expiryHours.length
        : 48,
    }))
  } catch (err) {
    logger.warn({ err }, 'fetchBacklogData: falling back to empty backlog')
    return []
  }
}

// ─── Inactive contractors ─────────────────────────────────────────────────────

async function fetchInactiveContractors(): Promise<ContractorInactivityScore[]> {
  try {
    const cutoff = daysAgo(INACTIVITY_DAYS_THRESHOLD)

    const queueEntries: any[] = await db.rotationQueueEntry.findMany({
      where: {
        eligibility: 'ELIGIBLE',
        professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] },
        lastAssignedAt: { lt: cutoff },
      },
      include: {
        profile: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            user: { select: { email: true } },
          },
        },
      },
    })

    return queueEntries.map(entry => {
      const lastActive = entry.lastAssignedAt
        ? new Date(entry.lastAssignedAt)
        : new Date(entry.createdAt)
      const daysSinceLast = (Date.now() - lastActive.getTime()) / 86_400_000

      const risk = calcInactivityRisk(
        daysSinceLast,
        entry.expiredAssignmentCount ?? 0,
        Math.max(1, (entry.expiredAssignmentCount ?? 0) + (entry.assignmentCount ?? 0)),
        entry.responseRate ?? 0.5,
      )

      return {
        profileId:          entry.profile?.id ?? entry.profileId,
        userId:             entry.profile?.userId ?? '',
        businessName:       entry.profile?.businessName ?? '',
        email:              entry.profile?.user?.email ?? '',
        inactivityRiskScore: risk,
        daysSinceLastActivity: Math.round(daysSinceLast),
        expiredAssignmentRate: Math.min(1, (entry.expiredAssignmentCount ?? 0) / Math.max(1, entry.assignmentCount ?? 1)),
        responseRate: entry.responseRate ?? 0.5,
        atRiskOfChurn: risk >= 70,
      }
    })
  } catch (err) {
    logger.warn({ err }, 'fetchInactiveContractors: falling back to empty list')
    return []
  }
}

// ─── Main analysis ─────────────────────────────────────────────────────────────

export async function runGrowthAnalysis(): Promise<GrowthAnalysis> {
  const runId = uuid()
  logger.info({ runId }, 'GrowthBot analysis starting')
  const startMs = Date.now()

  // Parallel data fetch
  const [
    supplyRows,
    demandRows,
    geoRows,
    backlogRows,
    inactiveContractors,
  ] = await Promise.all([
    fetchTradeSupply(),
    fetchTradeDemand(),
    fetchGeoData(),
    fetchBacklogData(),
    fetchInactiveContractors(),
  ])

  // Build a unified trade list
  const allTrades = new Set([
    ...supplyRows.map(r => r.trade),
    ...demandRows.map(r => r.trade),
  ])

  const defaultDemand = (trade: string): TradeDemandRow => ({
    trade,
    openProjectCount: 0, totalProjectValue: 0, medianProjectValue: 0,
    unfilledAssignmentCount: 0, expiredAssignmentCount: 0, avgDaysUnfilled: 0,
  })
  const defaultSupply = (trade: string): TradeSupplyRow => ({
    trade,
    totalContractors: 0, verifiedContractors: 0, activeContractors: 0,
    inactiveContractors: 0, avgResponseRateDays: 0,
  })

  const tradeScores: TradeScore[] = [...allTrades].map(trade => {
    const demand = demandRows.find(r => r.trade === trade) ?? defaultDemand(trade)
    const supply = supplyRows.find(r => r.trade === trade) ?? defaultSupply(trade)
    return buildTradeScore(demand, supply, backlogRows)
  })

  const geoScores: GeoScore[] = geoRows.map(buildGeoScore)
  const backlogRisks: BacklogRiskScore[] = backlogRows.map(buildBacklogRiskScore)

  const recommendations = deriveAllRecommendations(
    tradeScores,
    geoScores,
    backlogRisks,
    inactiveContractors,
  )

  // Build dashboard metrics
  const activeByTrade: Record<string, number> = {}
  const activeByRegion: Record<string, number> = {}
  for (const s of supplyRows) activeByTrade[s.trade] = s.activeContractors
  for (const g of geoRows) activeByRegion[`${g.state}${g.city ? ':' + g.city : ''}`] = g.verifiedContractorCount

  const openByTrade: Record<string, number> = {}
  const unfilledByRegion: Record<string, number> = {}
  for (const d of demandRows) openByTrade[d.trade] = d.openProjectCount
  for (const g of geoRows) unfilledByRegion[`${g.state}${g.city ? ':' + g.city : ''}`] = g.unfilledProjectCount

  const totalAssignments = backlogRows.reduce((s, b) => s + b.queueDepth, 0)
  const expiredTotal     = demandRows.reduce((s, d) => s + d.expiredAssignmentCount, 0)
  const expirationRate   = totalAssignments > 0 ? expiredTotal / (totalAssignments + expiredTotal) : 0

  const avgDaysToFill = demandRows.length > 0
    ? demandRows.reduce((s, d) => s + d.avgDaysUnfilled, 0) / demandRows.length
    : 0

  const dashboardMetrics: GrowthDashboardMetrics = {
    totalVerifiedContractors:  supplyRows.reduce((s, r) => s + r.verifiedContractors, 0),
    activeContractorsByTrade:  activeByTrade,
    activeContractorsByRegion: activeByRegion,
    churnRiskContractorCount:  inactiveContractors.filter(c => c.atRiskOfChurn).length,
    totalOpenProjects:         demandRows.reduce((s, d) => s + d.openProjectCount, 0),
    openProjectsByTrade:       openByTrade,
    unfilledProjectsByRegion:  unfilledByRegion,
    assignmentExpirationRate:  expirationRate,
    avgDaysToFill,
    overallLiquidityScore:     calcOverallLiquidityScore(tradeScores),
    recruitmentPriorityList:   buildRecruitmentPriorityList(tradeScores, geoScores),
    demandGenPriorityList:     buildDemandGenPriorityList(tradeScores, geoScores),
    computedAt: new Date().toISOString(),
  }

  const analysis: GrowthAnalysis = {
    runId,
    computedAt: new Date().toISOString(),
    tradeScores,
    geoScores,
    backlogRisks,
    inactiveContractors,
    recommendations,
    dashboardMetrics,
  }

  logger.info({
    runId,
    ms: Date.now() - startMs,
    trades: tradeScores.length,
    geos: geoScores.length,
    recommendations: recommendations.length,
    liquidityScore: dashboardMetrics.overallLiquidityScore,
  }, 'GrowthBot analysis complete')

  return analysis
}

/** Lightweight single-trade analysis for event-driven runs */
export async function analyzeTradeQuick(trade: string): Promise<TradeScore | null> {
  try {
    const [supply, demand, backlog] = await Promise.all([
      fetchTradeSupply(),
      fetchTradeDemand(),
      fetchBacklogData(),
    ])
    const s = supply.find(r => r.trade === trade)
    const d = demand.find(r => r.trade === trade)
    if (!s || !d) return null
    return buildTradeScore(d, s, backlog)
  } catch {
    return null
  }
}

export async function disconnect(): Promise<void> {
  await db.$disconnect()
}
