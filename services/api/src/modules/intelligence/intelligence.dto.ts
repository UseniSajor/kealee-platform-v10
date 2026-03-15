/**
 * intelligence.dto.ts — Marketplace Intelligence Layer DTOs
 * Scoring, analytics, recommendations, market insights.
 */
import { z } from 'zod'

// ─── Score event recording ─────────────────────────────────────────────────────

export const ScoreEventTypeEnum = z.enum([
  // Contractor signals
  'LEAD_ACCEPTED',
  'LEAD_DECLINED',
  'LEAD_CONVERTED',        // bid won → contract signed
  'RESPONSE_TIME_FAST',    // responded within 1h
  'RESPONSE_TIME_SLOW',    // responded after 24h
  'MILESTONE_COMPLETED_ONTIME',
  'MILESTONE_COMPLETED_LATE',
  'DISPUTE_OPENED_AGAINST',
  'DISPUTE_WON',
  'REVIEW_5_STAR',
  'REVIEW_BELOW_3',
  // Owner signals
  'READINESS_ADVANCED',
  'PROJECT_COMPLETED',
  'PAYMENT_ON_TIME',
  'PAYMENT_LATE',
])

export const RecordScoreEventDto = z.object({
  entityId: z.string(),
  entityType: z.enum(['contractor', 'owner', 'project']),
  eventType: ScoreEventTypeEnum,
  weight: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
})

// ─── Analytics queries ────────────────────────────────────────────────────────

export const MarketInsightQueryDto = z.object({
  jurisdictionCode: z.string().optional(),
  tradeCategory: z.string().optional(),
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
})

export const ContractorPerformanceQueryDto = z.object({
  contractorId: z.string(),
  period: z.enum(['30d', '90d', '1y']).default('90d'),
})

export const LeadFunnelQueryDto = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
  tradeCategory: z.string().optional(),
  jurisdictionCode: z.string().optional(),
})

// ─── Recommendation queries ───────────────────────────────────────────────────

export const GetContractorRecommendationsDto = z.object({
  projectId: z.string(),
  tradeCategory: z.string(),
  limit: z.number().int().min(1).max(20).default(5),
})

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface EntityScoreDto {
  entityId: string
  entityType: string
  overallScore: number           // 0–100
  responsiveness: number
  reliability: number
  quality: number
  lastUpdated: string
}

export interface MarketInsightDto {
  jurisdictionCode: string
  tradeCategory: string | null
  period: string
  totalLeads: number
  leadsAccepted: number
  leadsConverted: number
  averageContractValueCents: number
  averageResponseTimeHours: number
  activeContractors: number
  averageContractorScore: number
  topContractors: { id: string; name: string; score: number }[]
}

export interface ContractorPerformanceDto {
  contractorId: string
  period: string
  leadsReceived: number
  leadsAccepted: number
  leadsConverted: number
  conversionRate: number
  averageResponseTimeHours: number
  milestonesCompleted: number
  milestonesOnTime: number
  onTimeRate: number
  averageReviewScore: number
  totalRevenueCents: number
  score: EntityScoreDto
}

export interface LeadFunnelDto {
  period: string
  generated: number
  dispatched: number
  accepted: number
  converted: number
  acceptanceRate: number
  conversionRate: number
  byTrade: { tradeCategory: string; generated: number; converted: number }[]
}

export interface ContractorRecommendationDto {
  contractorId: string
  displayName: string
  tradeCategory: string
  score: number
  matchReason: string[]
  estimatedResponseTimeHours: number
}

// Inferred types
export type RecordScoreEventBody = z.infer<typeof RecordScoreEventDto>
export type MarketInsightQuery = z.infer<typeof MarketInsightQueryDto>
export type ContractorPerformanceQuery = z.infer<typeof ContractorPerformanceQueryDto>
export type LeadFunnelQuery = z.infer<typeof LeadFunnelQueryDto>
export type GetContractorRecommendationsBody = z.infer<typeof GetContractorRecommendationsDto>
