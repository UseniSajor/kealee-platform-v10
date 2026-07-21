/**
 * services/command-center/bots/growth/growth.scoring.ts
 *
 * GrowthBot scoring model — pure functions with no side effects.
 * All scores are 0–100. Higher = more severe / more urgent.
 *
 * TRADE SHORTAGE SCORE
 *   shortageScore = min(100,
 *     (openProjects / max(1, verifiedContractors)) *
 *     (1 + expiredAssignmentRate) *
 *     (1 + unfilledAssignmentRatio) * 30
 *   )
 *
 * TRADE SURPLUS SCORE
 *   surplusScore = min(100,
 *     (verifiedContractors / max(1, openProjects)) *
 *     (inactiveRatio) * 40
 *   )
 *
 * GEO SHORTAGE SCORE
 *   geoShortageScore = min(100,
 *     (unfilledProjectCount / max(1, localContractorCount)) *
 *     (1 + avgDaysUnfilled / 14) * 25
 *   )
 *
 * CONTRACTOR INACTIVITY RISK
 *   inactivityRisk =
 *     (daysSinceLastActivity / 60) * 50 +
 *     (expiredRate) * 30 +
 *     (1 - responseRate) * 20
 *
 * PROJECT BACKLOG RISK
 *   backlogRisk = min(100,
 *     (avgDaysUnfilled / 14) * (1 + queueDepth / 10) * 20
 *   )
 *
 * MATCHING URGENCY
 *   matchingUrgency = expiryUrgency + valueBonus + tradeShortageBonus
 */

import type {
  TradeDemandRow,
  TradeSupplyRow,
  GeoRow,
  TradeScore,
  GeoScore,
  BacklogRiskScore,
  ContractorInactivityScore,
  AssignmentBacklogRow,
  GrowthRecommendation,
  RecruitmentPriorityItem,
  DemandGenPriorityItem,
} from './growth.types.js'
import { randomUUID as uuid } from 'crypto'

// ─── Trade Shortage Score ─────────────────────────────────────────────────────

export function calcTradeShortageScore(demand: TradeDemandRow, supply: TradeSupplyRow): number {
  const { openProjectCount, unfilledAssignmentCount, expiredAssignmentCount } = demand
  const { verifiedContractors } = supply

  const totalAssignments = unfilledAssignmentCount + expiredAssignmentCount
  const expiredAssignmentRate = totalAssignments > 0
    ? expiredAssignmentCount / totalAssignments
    : 0

  const unfilledRatio = openProjectCount > 0
    ? unfilledAssignmentCount / openProjectCount
    : 0

  const raw =
    (openProjectCount / Math.max(1, verifiedContractors)) *
    (1 + expiredAssignmentRate) *
    (1 + unfilledRatio) *
    30

  return clamp(raw)
}

// ─── Trade Surplus Score ──────────────────────────────────────────────────────

export function calcTradeSurplusScore(demand: TradeDemandRow, supply: TradeSupplyRow): number {
  const { verifiedContractors, inactiveContractors } = supply
  const { openProjectCount } = demand

  if (verifiedContractors === 0) return 0

  const inactiveRatio = inactiveContractors / Math.max(1, verifiedContractors)
  const raw = (verifiedContractors / Math.max(1, openProjectCount)) * inactiveRatio * 40

  return clamp(raw)
}

// ─── Geography Shortage Score ─────────────────────────────────────────────────

export function calcGeoShortageScore(row: GeoRow): number {
  const {
    unfilledProjectCount,
    verifiedContractorCount,
    expiredAssignmentCount,
    openProjectCount,
  } = row

  const expiredRate = openProjectCount > 0
    ? expiredAssignmentCount / openProjectCount
    : 0

  // avgDaysUnfilled from GeoRow not available directly; use expiredRate as proxy
  const filledFriction = 1 + expiredRate

  const raw =
    (unfilledProjectCount / Math.max(1, verifiedContractorCount)) *
    filledFriction *
    25

  return clamp(raw)
}

export function calcGeoSurplusScore(row: GeoRow): number {
  if (row.verifiedContractorCount === 0) return 0

  const raw =
    (row.verifiedContractorCount / Math.max(1, row.openProjectCount)) *
    (row.openProjectCount === 0 ? 5 : 1) *
    15

  return clamp(raw)
}

// ─── Backlog Risk ─────────────────────────────────────────────────────────────

export function calcBacklogRisk(row: AssignmentBacklogRow): number {
  const { queueDepth, oldestUnfilledDays } = row
  const raw = (oldestUnfilledDays / 14) * (1 + queueDepth / 10) * 20
  return clamp(raw)
}

// ─── Contractor Inactivity Risk ───────────────────────────────────────────────

export function calcInactivityRisk(
  daysSinceLastActivity: number,
  expiredAssignmentCount: number,
  totalAssignments: number,
  responseRate: number, // 0–1
): number {
  const expiredRate = totalAssignments > 0
    ? Math.min(1, expiredAssignmentCount / totalAssignments)
    : 0

  const inactivityComponent = Math.min(50, (daysSinceLastActivity / 60) * 50)
  const expiredComponent    = expiredRate * 30
  const responseComponent   = (1 - Math.min(1, responseRate)) * 20

  return clamp(inactivityComponent + expiredComponent + responseComponent)
}

// ─── Matching Urgency ─────────────────────────────────────────────────────────

export function calcMatchingUrgency(
  hoursUntilExpiry: number,
  projectValueUsd: number,
  tradeShortageScore: number,
): number {
  const expiryUrgency =
    hoursUntilExpiry < 12 ? 40 :
    hoursUntilExpiry < 24 ? 30 :
    hoursUntilExpiry < 36 ? 15 : 0

  const valueBonus =
    projectValueUsd > 500_000 ? 30 :
    projectValueUsd > 250_000 ? 20 :
    projectValueUsd > 100_000 ? 10 : 5

  const tradeBonus = (tradeShortageScore / 100) * 30

  return clamp(expiryUrgency + valueBonus + tradeBonus)
}

// ─── Priority label ───────────────────────────────────────────────────────────

export function toPriorityLabel(score: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' {
  if (score >= 75) return 'CRITICAL'
  if (score >= 50) return 'HIGH'
  if (score >= 25) return 'MEDIUM'
  if (score >= 10) return 'LOW'
  return 'NONE'
}

export function toUrgencyLabel(score: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 75) return 'CRITICAL'
  if (score >= 50) return 'HIGH'
  if (score >= 25) return 'MEDIUM'
  return 'LOW'
}

// ─── Assemble TradeScore ──────────────────────────────────────────────────────

export function buildTradeScore(
  demand: TradeDemandRow,
  supply: TradeSupplyRow,
  backlogRows: AssignmentBacklogRow[],
): TradeScore {
  const shortageScore = calcTradeShortageScore(demand, supply)
  const surplusScore  = calcTradeSurplusScore(demand, supply)

  const backlogRow = backlogRows.find(b => b.trade === demand.trade)
  const backlogRisk = backlogRow ? calcBacklogRisk(backlogRow) : 0

  // Matching urgency uses average assignment conditions for this trade
  const avgHoursRemaining = backlogRow?.avgExpiryHoursRemaining ?? 48
  const matchingUrgency = calcMatchingUrgency(
    avgHoursRemaining,
    demand.medianProjectValue,
    shortageScore,
  )

  return {
    trade: demand.trade,
    shortageScore,
    surplusScore,
    demand,
    supply,
    backlogRisk,
    matchingUrgency,
    recruitmentPriority: toPriorityLabel(shortageScore),
    demandGenPriority:   toPriorityLabel(surplusScore),
    computedAt: new Date().toISOString(),
  }
}

// ─── Assemble GeoScore ────────────────────────────────────────────────────────

export function buildGeoScore(row: GeoRow): GeoScore {
  const shortageScore = calcGeoShortageScore(row)
  const surplusScore  = calcGeoSurplusScore(row)
  const key = row.city ? `${row.state}:${row.city}` : row.state

  return {
    key,
    state: row.state,
    city: row.city,
    shortageScore,
    surplusScore,
    unfilledCount: row.unfilledProjectCount,
    verifiedSupplyCount: row.verifiedContractorCount,
    recruitmentPriority: toPriorityLabel(shortageScore),
    computedAt: new Date().toISOString(),
  }
}

// ─── Assemble BacklogRiskScore ────────────────────────────────────────────────

export function buildBacklogRiskScore(row: AssignmentBacklogRow): BacklogRiskScore {
  const score = calcBacklogRisk(row)
  return {
    trade:            row.trade,
    state:            row.state,
    backlogScore:     score,
    queueDepth:       row.queueDepth,
    oldestUnfilledDays: row.oldestUnfilledDays,
    urgency:          toUrgencyLabel(score),
  }
}

// ─── Build recruitment/demand-gen priority lists ───────────────────────────────

export function buildRecruitmentPriorityList(
  tradeScores: TradeScore[],
  geoScores: GeoScore[],
  limit = 10,
): RecruitmentPriorityItem[] {
  // Combine trade and geo shortage signals, dedupe and rank
  const items: RecruitmentPriorityItem[] = []

  // Trade-based
  for (const ts of tradeScores) {
    if (ts.shortageScore >= 10) {
      items.push({
        rank: 0,
        trade: ts.trade,
        shortageScore: ts.shortageScore,
        unfilledCount: ts.demand.unfilledAssignmentCount,
        reason: `${ts.demand.openProjectCount} open projects, only ${ts.supply.verifiedContractors} verified contractors`,
      })
    }
  }

  // Geo-based
  for (const gs of geoScores) {
    if (gs.shortageScore >= 10) {
      items.push({
        rank: 0,
        trade: 'All Trades',
        geo: gs.key,
        shortageScore: gs.shortageScore,
        unfilledCount: gs.unfilledCount,
        reason: `${gs.unfilledCount} unfilled projects, ${gs.verifiedSupplyCount} verified contractors in region`,
      })
    }
  }

  items.sort((a, b) => b.shortageScore - a.shortageScore)
  return items.slice(0, limit).map((item, i) => ({ ...item, rank: i + 1 }))
}

export function buildDemandGenPriorityList(
  tradeScores: TradeScore[],
  geoScores: GeoScore[],
  limit = 10,
): DemandGenPriorityItem[] {
  const items: DemandGenPriorityItem[] = []

  for (const ts of tradeScores) {
    if (ts.surplusScore >= 10) {
      items.push({
        rank: 0,
        trade: ts.trade,
        surplusScore: ts.surplusScore,
        idleContractorCount: ts.supply.inactiveContractors,
        reason: `${ts.supply.verifiedContractors} contractors vs ${ts.demand.openProjectCount} open projects`,
      })
    }
  }

  for (const gs of geoScores) {
    if (gs.surplusScore >= 10) {
      items.push({
        rank: 0,
        geo: gs.key,
        surplusScore: gs.surplusScore,
        idleContractorCount: gs.verifiedSupplyCount,
        reason: `${gs.verifiedSupplyCount} contractors in region with only ${gs.unfilledCount} unfilled projects`,
      })
    }
  }

  items.sort((a, b) => b.surplusScore - a.surplusScore)
  return items.slice(0, limit).map((item, i) => ({ ...item, rank: i + 1 }))
}

// ─── Overall liquidity score (0–100, 100 = perfectly balanced) ───────────────

export function calcOverallLiquidityScore(tradeScores: TradeScore[]): number {
  if (tradeScores.length === 0) return 50
  const avg = tradeScores.reduce((s, t) => s + Math.max(t.shortageScore, t.surplusScore), 0) / tradeScores.length
  // Invert: 0 imbalance = 100 liquidity
  return clamp(100 - avg)
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function clamp(val: number): number {
  return Math.min(100, Math.max(0, Math.round(val * 10) / 10))
}
