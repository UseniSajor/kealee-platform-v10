import { z } from 'zod'
import {
  confidenceScoreSchema,
  digitalTwinUpdateSchema,
  productScoresSchema,
} from './shared.js'
import { propertyIntelligenceOutputSchema } from './property-intelligence.js'
import { marketingIntelligenceOutputSchema } from './marketing-intelligence.js'

export const opportunityScoringInputSchema = z.object({
  propertyIntelligence: propertyIntelligenceOutputSchema,
  marketingIntelligence: marketingIntelligenceOutputSchema.optional(),
  parcelData: z.record(z.unknown()).optional(),
  ownerLeadData: z.record(z.unknown()).optional(),
  projectHistory: z.array(z.record(z.unknown())).optional(),
  permitHistory: z.array(z.record(z.unknown())).optional(),
  marketData: z.record(z.unknown()).optional(),
  crmActivity: z.array(z.record(z.unknown())).optional(),
  websiteBehavior: z.record(z.unknown()).optional(),
  campaignResponse: z.record(z.unknown()).optional(),
  budgetIndicators: z.record(z.unknown()).optional(),
})

export const opportunityScoringOutputSchema = z.object({
  totalOpportunityScore: z.number().min(0).max(100),
  productScores: productScoresSchema,
  urgencyScore: z.number().min(0).max(100),
  revenuePotential: z.number().min(0).optional(),
  conversionLikelihood: confidenceScoreSchema,
  estimatedProjectValue: z.number().min(0).optional(),
  recommendedPriority: z.enum(['immediate', 'high', 'nurture', 'low', 'suppress']),
  recommendedNextAction: z.string().min(1),
  dataQualityScore: confidenceScoreSchema,
  scoreExplanation: z.string().min(1),
  digitalTwinUpdates: z.array(digitalTwinUpdateSchema).default([]),
  crmUpdates: z.record(z.unknown()).default({}),
  confidenceScore: confidenceScoreSchema,
  requiresHumanReview: z.boolean(),
})

export type OpportunityScoringInput = z.infer<typeof opportunityScoringInputSchema>
export type OpportunityScoringOutput = z.infer<typeof opportunityScoringOutputSchema>
