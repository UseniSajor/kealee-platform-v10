import { z } from 'zod'
import { KEALEE_PRODUCTS } from '../constants/products.js'

export const confidenceScoreSchema = z.number().min(0).max(1)

export const digitalTwinUpdateSchema = z.object({
  field: z.string(),
  value: z.unknown(),
  reason: z.string().optional(),
})

export const nextActionSchema = z.object({
  action: z.string(),
  priority: z.enum(['immediate', 'high', 'medium', 'low']).optional(),
  channel: z.string().optional(),
  rationale: z.string().optional(),
})

export const kealeeProductSchema = z.enum(KEALEE_PRODUCTS)

export const riskLevelSchema = z.enum(['low', 'medium', 'high', 'unknown'])

export const productScoresSchema = z.object({
  designConceptScore: z.number().min(0).max(100),
  estimateDetailedScore: z.number().min(0).max(100),
  permitPackageScore: z.number().min(0).max(100),
  contractorMatchScore: z.number().min(0).max(100),
  pmAdvisoryScore: z.number().min(0).max(100),
  aduFeasibilityScore: z.number().min(0).max(100),
  additionFeasibilityScore: z.number().min(0).max(100),
  basementFinishScore: z.number().min(0).max(100),
  kitchenBathScore: z.number().min(0).max(100),
  developerFeasibilityScore: z.number().min(0).max(100),
  financeScore: z.number().min(0).max(100),
  commercialRenovationScore: z.number().min(0).max(100),
  investorServicesScore: z.number().min(0).max(100),
})

export type ProductScores = z.infer<typeof productScoresSchema>
export type DigitalTwinUpdate = z.infer<typeof digitalTwinUpdateSchema>
export type NextAction = z.infer<typeof nextActionSchema>
