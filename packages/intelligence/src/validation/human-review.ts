import type { PropertyIntelligenceOutput } from '../schemas/property-intelligence.js'
import type { MarketingIntelligenceOutput } from '../schemas/marketing-intelligence.js'
import type { OpportunityScoringOutput } from '../schemas/opportunity-scoring.js'

export const HUMAN_REVIEW_THRESHOLDS = {
  dataQualityMin: 0.7,
  confidenceMin: 0.75,
  highValueProjectUsd: 250_000,
  paidAdSpendThresholdUsd: 500,
} as const

export interface HumanReviewInput {
  dataQualityScore?: number
  confidenceScore?: number
  permitRisk?: string
  zoningRisk?: string
  estimatedProjectValue?: number
  audienceSegment?: string
  complianceFlags?: string[]
  ownerDataSourceUncertain?: boolean
  paidAdSpendRecommendation?: number
  agentRequiresReview?: boolean
}

export interface HumanReviewResult {
  requiresHumanReview: boolean
  reasons: string[]
}

export function evaluateHumanReview(input: HumanReviewInput): HumanReviewResult {
  const reasons: string[] = []

  if (input.dataQualityScore != null && input.dataQualityScore < HUMAN_REVIEW_THRESHOLDS.dataQualityMin) {
    reasons.push('data_quality_below_threshold')
  }
  if (input.confidenceScore != null && input.confidenceScore < HUMAN_REVIEW_THRESHOLDS.confidenceMin) {
    reasons.push('confidence_below_threshold')
  }
  if (input.permitRisk === 'high' || input.zoningRisk === 'high') {
    reasons.push('high_permit_or_zoning_risk')
  }
  if (
    input.estimatedProjectValue != null &&
    input.estimatedProjectValue > HUMAN_REVIEW_THRESHOLDS.highValueProjectUsd
  ) {
    reasons.push('high_estimated_project_value')
  }
  if (
    input.audienceSegment &&
    (input.audienceSegment.includes('commercial') || input.audienceSegment.includes('developer'))
  ) {
    reasons.push('commercial_or_developer_opportunity')
  }
  if (input.complianceFlags?.length) {
    reasons.push('compliance_flags_present')
  }
  if (input.ownerDataSourceUncertain) {
    reasons.push('uncertain_owner_data_source')
  }
  if (
    input.paidAdSpendRecommendation != null &&
    input.paidAdSpendRecommendation > HUMAN_REVIEW_THRESHOLDS.paidAdSpendThresholdUsd
  ) {
    reasons.push('paid_ad_spend_above_threshold')
  }
  if (input.agentRequiresReview) {
    reasons.push('agent_flagged_review')
  }

  return {
    requiresHumanReview: reasons.length > 0,
    reasons,
  }
}

export function mergeHumanReviewFromPropertyOutput(output: PropertyIntelligenceOutput): HumanReviewResult {
  return evaluateHumanReview({
    dataQualityScore: output.dataQualityScore,
    confidenceScore: output.confidenceScore,
    permitRisk: output.permitRisk,
    zoningRisk: output.zoningRisk,
    agentRequiresReview: output.requiresHumanReview,
  })
}

export function mergeHumanReviewFromOpportunityOutput(output: OpportunityScoringOutput): HumanReviewResult {
  return evaluateHumanReview({
    dataQualityScore: output.dataQualityScore,
    confidenceScore: output.confidenceScore,
    estimatedProjectValue: output.estimatedProjectValue,
    agentRequiresReview: output.requiresHumanReview,
  })
}

export function mergeHumanReviewFromMarketingOutput(output: MarketingIntelligenceOutput): HumanReviewResult {
  return evaluateHumanReview({
    confidenceScore: output.confidenceScore,
    audienceSegment: output.audienceSegment,
    complianceFlags: output.complianceFlags,
    agentRequiresReview: output.requiresHumanReview,
  })
}
