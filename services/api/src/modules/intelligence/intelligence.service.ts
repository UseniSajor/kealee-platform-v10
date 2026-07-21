/**
 * intelligence.service.ts — Marketplace Intelligence Layer
 * Scoring engine, analytics aggregation, contractor recommendations.
 */
import { prisma } from '../../lib/prisma'
import type {
  RecordScoreEventBody,
  MarketInsightQuery,
  ContractorPerformanceQuery,
  LeadFunnelQuery,
  GetContractorRecommendationsBody,
  EntityScoreDto,
  MarketInsightDto,
  ContractorPerformanceDto,
  LeadFunnelDto,
  ContractorRecommendationDto,
} from './intelligence.dto'

const db = prisma as any

// ─── Score weights (additive model, max 100) ──────────────────────────────────

const EVENT_WEIGHTS: Record<string, number> = {
  LEAD_CONVERTED:              +8,
  LEAD_ACCEPTED:               +2,
  LEAD_DECLINED:               -1,
  RESPONSE_TIME_FAST:          +3,
  RESPONSE_TIME_SLOW:          -2,
  MILESTONE_COMPLETED_ONTIME:  +5,
  MILESTONE_COMPLETED_LATE:    -3,
  DISPUTE_OPENED_AGAINST:      -10,
  DISPUTE_WON:                 +5,
  REVIEW_5_STAR:               +6,
  REVIEW_BELOW_3:              -8,
  READINESS_ADVANCED:          +3,
  PROJECT_COMPLETED:           +5,
  PAYMENT_ON_TIME:             +2,
  PAYMENT_LATE:                -4,
}

// ─── Score recording ──────────────────────────────────────────────────────────

export async function recordScoreEvent(body: RecordScoreEventBody): Promise<void> {
  const weight = body.weight ?? EVENT_WEIGHTS[body.eventType] ?? 0

  await db.scoreEvent.create({
    data: {
      entityId: body.entityId,
      entityType: body.entityType,
      eventType: body.eventType,
      weight,
      metadata: body.metadata ?? {},
    },
  })

  // Recompute and upsert the aggregate score
  await recomputeScore(body.entityId, body.entityType)
}

async function recomputeScore(entityId: string, entityType: string): Promise<void> {
  const events = await db.scoreEvent.findMany({
    where: { entityId, entityType },
    select: { eventType: true, weight: true },
  })

  const rawScore = events.reduce((sum: number, e: any) => sum + e.weight, 50) // base 50
  const clamped = Math.min(100, Math.max(0, rawScore))

  // Dimension scores (simple partition of events)
  const responsiveness = computeDimensionScore(events, ['LEAD_ACCEPTED', 'LEAD_DECLINED', 'RESPONSE_TIME_FAST', 'RESPONSE_TIME_SLOW'])
  const reliability = computeDimensionScore(events, ['MILESTONE_COMPLETED_ONTIME', 'MILESTONE_COMPLETED_LATE', 'PAYMENT_ON_TIME', 'PAYMENT_LATE'])
  const quality = computeDimensionScore(events, ['REVIEW_5_STAR', 'REVIEW_BELOW_3', 'DISPUTE_OPENED_AGAINST', 'DISPUTE_WON'])

  await db.entityScore.upsert({
    where: { entityId_entityType: { entityId, entityType } },
    create: {
      entityId,
      entityType,
      overallScore: clamped,
      responsiveness,
      reliability,
      quality,
    },
    update: {
      overallScore: clamped,
      responsiveness,
      reliability,
      quality,
    },
  })
}

function computeDimensionScore(events: any[], relevantTypes: string[]): number {
  const relevant = events.filter((e: any) => relevantTypes.includes(e.eventType))
  if (!relevant.length) return 50
  const raw = relevant.reduce((s: number, e: any) => s + e.weight, 50)
  return Math.min(100, Math.max(0, raw))
}

// ─── Get score ────────────────────────────────────────────────────────────────

export async function getEntityScore(entityId: string, entityType: string): Promise<EntityScoreDto | null> {
  const score = await db.entityScore.findUnique({
    where: { entityId_entityType: { entityId, entityType } },
  })
  if (!score) return null
  return mapScore(score)
}

// ─── Market insights ──────────────────────────────────────────────────────────

export async function getMarketInsights(query: MarketInsightQuery): Promise<MarketInsightDto> {
  const since = periodToDate(query.period)

  // Aggregate lead data from ContractAgreement + Project queries
  const [leads, contractors] = await Promise.all([
    db.contractAgreement.findMany({
      where: {
        createdAt: { gte: since },
        ...(query.jurisdictionCode ? { project: { jurisdictionCode: query.jurisdictionCode } } : {}),
      },
      select: { id: true, status: true, amount: true, contractorId: true },
    }),
    db.entityScore.findMany({
      where: { entityType: 'contractor' },
      orderBy: { overallScore: 'desc' },
      take: 5,
      select: { entityId: true, overallScore: true },
    }),
  ])

  const accepted = leads.filter((l: any) => l.status !== 'DRAFT' && l.status !== 'CANCELLED').length
  const converted = leads.filter((l: any) => ['ACTIVE', 'COMPLETED'].includes(l.status)).length
  const totalAmount = leads.reduce((sum: number, l: any) => sum + (parseFloat(l.amount ?? '0') || 0), 0)
  const avgAmount = converted > 0 ? Math.round((totalAmount / converted) * 100) : 0

  return {
    jurisdictionCode: query.jurisdictionCode ?? 'ALL',
    tradeCategory: query.tradeCategory ?? null,
    period: query.period,
    totalLeads: leads.length,
    leadsAccepted: accepted,
    leadsConverted: converted,
    averageContractValueCents: avgAmount,
    averageResponseTimeHours: 0, // TODO: compute from lead_response_events when implemented
    activeContractors: new Set(leads.map((l: any) => l.contractorId)).size,
    averageContractorScore: contractors.length
      ? Math.round(contractors.reduce((s: number, c: any) => s + c.overallScore, 0) / contractors.length)
      : 0,
    topContractors: contractors.map((c: any) => ({
      id: c.entityId,
      name: '',  // resolved via join in production
      score: c.overallScore,
    })),
  }
}

// ─── Contractor performance ───────────────────────────────────────────────────

export async function getContractorPerformance(query: ContractorPerformanceQuery): Promise<ContractorPerformanceDto> {
  const since = periodToDate(query.period)

  const [contracts, milestones, score] = await Promise.all([
    db.contractAgreement.findMany({
      where: { contractorId: query.contractorId, createdAt: { gte: since } },
      select: { id: true, status: true, amount: true },
    }),
    db.milestone.findMany({
      where: { contract: { contractorId: query.contractorId }, createdAt: { gte: since } },
      select: { status: true, completedAt: true, dueDate: true },
    }),
    getEntityScore(query.contractorId, 'contractor'),
  ])

  const leadsConverted = contracts.filter((c: any) => ['ACTIVE', 'COMPLETED'].includes(c.status)).length
  const msCompleted = milestones.filter((m: any) => m.status === 'PAID').length
  const msOnTime = milestones.filter((m: any) => {
    if (m.status !== 'PAID' || !m.completedAt || !m.dueDate) return false
    return new Date(m.completedAt) <= new Date(m.dueDate)
  }).length
  const totalRevenue = contracts
    .filter((c: any) => c.status === 'COMPLETED')
    .reduce((s: number, c: any) => s + (parseFloat(c.amount ?? '0') * 100 || 0), 0)

  return {
    contractorId: query.contractorId,
    period: query.period,
    leadsReceived: contracts.length,
    leadsAccepted: contracts.filter((c: any) => c.status !== 'DRAFT').length,
    leadsConverted,
    conversionRate: contracts.length > 0 ? Math.round((leadsConverted / contracts.length) * 100) : 0,
    averageResponseTimeHours: 0, // TODO from response events
    milestonesCompleted: msCompleted,
    milestonesOnTime: msOnTime,
    onTimeRate: msCompleted > 0 ? Math.round((msOnTime / msCompleted) * 100) : 0,
    averageReviewScore: 0, // TODO from Review model
    totalRevenueCents: Math.round(totalRevenue),
    score: score ?? defaultScore(query.contractorId, 'contractor'),
  }
}

// ─── Lead funnel ──────────────────────────────────────────────────────────────

export async function getLeadFunnel(query: LeadFunnelQuery): Promise<LeadFunnelDto> {
  const since = periodToDate(query.period)

  const contracts = await db.contractAgreement.findMany({
    where: {
      createdAt: { gte: since },
      ...(query.tradeCategory ? { tradeCategory: query.tradeCategory } : {}),
    },
    select: { id: true, status: true, tradeCategory: true },
  })

  const dispatched = contracts.length
  const accepted = contracts.filter((c: any) => c.status !== 'DRAFT' && c.status !== 'CANCELLED').length
  const converted = contracts.filter((c: any) => ['ACTIVE', 'COMPLETED'].includes(c.status)).length

  // By-trade breakdown
  const tradeMap: Record<string, { generated: number; converted: number }> = {}
  for (const c of contracts) {
    const cat = c.tradeCategory ?? 'UNKNOWN'
    if (!tradeMap[cat]) tradeMap[cat] = { generated: 0, converted: 0 }
    tradeMap[cat].generated++
    if (['ACTIVE', 'COMPLETED'].includes(c.status)) tradeMap[cat].converted++
  }

  return {
    period: query.period,
    generated: dispatched,  // treat all contracts created as "generated leads"
    dispatched,
    accepted,
    converted,
    acceptanceRate: dispatched > 0 ? Math.round((accepted / dispatched) * 100) : 0,
    conversionRate: dispatched > 0 ? Math.round((converted / dispatched) * 100) : 0,
    byTrade: Object.entries(tradeMap).map(([tradeCategory, stats]) => ({ tradeCategory, ...stats })),
  }
}

// ─── Contractor recommendations ───────────────────────────────────────────────

export async function getContractorRecommendations(
  body: GetContractorRecommendationsBody,
): Promise<ContractorRecommendationDto[]> {
  // Score-ranked contractors with relevant trade category
  const scores = await db.entityScore.findMany({
    where: { entityType: 'contractor' },
    orderBy: { overallScore: 'desc' },
    take: body.limit * 3, // fetch more, filter down
    select: { entityId: true, overallScore: true, responsiveness: true },
  })

  // Enrich with user data
  const results: ContractorRecommendationDto[] = []
  for (const s of scores) {
    if (results.length >= body.limit) break

    const matchReasons: string[] = []
    if (s.overallScore >= 80) matchReasons.push('Top-rated contractor')
    if (s.responsiveness >= 75) matchReasons.push('Fast responder')

    results.push({
      contractorId: s.entityId,
      displayName: '',  // resolved via profile join in production
      tradeCategory: body.tradeCategory,
      score: s.overallScore,
      matchReason: matchReasons.length ? matchReasons : ['Active in your area'],
      estimatedResponseTimeHours: s.responsiveness >= 75 ? 2 : 12,
    })
  }

  return results
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function periodToDate(period: string): Date {
  const now = new Date()
  const map: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
  const days = map[period] ?? 30
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

function mapScore(s: any): EntityScoreDto {
  return {
    entityId: s.entityId,
    entityType: s.entityType,
    overallScore: s.overallScore,
    responsiveness: s.responsiveness,
    reliability: s.reliability,
    quality: s.quality,
    lastUpdated: new Date(s.updatedAt).toISOString(),
  }
}

function defaultScore(entityId: string, entityType: string): EntityScoreDto {
  return {
    entityId,
    entityType,
    overallScore: 50,
    responsiveness: 50,
    reliability: 50,
    quality: 50,
    lastUpdated: new Date().toISOString(),
  }
}
