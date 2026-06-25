import { z } from 'zod'
import { LOAN_PRODUCTS } from '../constants/events.js'
import { confidenceScoreSchema, nextActionSchema } from './shared.js'

export const loanProductSchema = z.enum(LOAN_PRODUCTS)

export const capitalIntelligenceInputSchema = z.object({
  propertyTwin: z.record(z.unknown()).optional(),
  leadTwin: z.record(z.unknown()).optional(),
  projectTwin: z.record(z.unknown()).optional(),
  estimatedPropertyValue: z.number().optional(),
  estimatedMortgageBalance: z.number().optional(),
  estimatedEquity: z.number().optional(),
  estimatedLTV: z.number().optional(),
  projectBudget: z.number().optional(),
  scope: z.string().optional(),
  arvEstimate: z.number().optional(),
  occupancy: z.string().optional(),
  ownerType: z.string().optional(),
  customerFinancialInfo: z.record(z.unknown()).optional(),
  documents: z.array(z.string()).optional(),
  consentFinancing: z.boolean().default(false),
})

export const capitalIntelligenceOutputSchema = z.object({
  capitalFitScore: z.number().min(0).max(100),
  estimatedEquity: z.number().optional(),
  estimatedLTV: z.number().optional(),
  recommendedLoanProducts: z.array(loanProductSchema).default([]),
  fundingGap: z.number().optional(),
  requiredDocuments: z.array(z.string()).default([]),
  lenderRoutingRecommendation: z.string().optional(),
  riskFlags: z.array(z.string()).default([]),
  complianceFlags: z.array(z.string()).default([]),
  capitalTwinUpdates: z.array(z.object({ field: z.string(), value: z.unknown() })).default([]),
  nextActions: z.array(nextActionSchema).min(1),
  confidenceScore: confidenceScoreSchema,
  requiresHumanReview: z.boolean(),
  scoreExplanation: z.string().min(1),
})

export type CapitalIntelligenceInput = z.infer<typeof capitalIntelligenceInputSchema>
export type CapitalIntelligenceOutput = z.infer<typeof capitalIntelligenceOutputSchema>
