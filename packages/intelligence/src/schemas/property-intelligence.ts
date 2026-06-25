import { z } from 'zod'
import {
  confidenceScoreSchema,
  digitalTwinUpdateSchema,
  kealeeProductSchema,
  nextActionSchema,
  riskLevelSchema,
} from './shared.js'

export const propertyIntelligenceInputSchema = z.object({
  parcelId: z.string().optional(),
  address: z.string().min(1),
  ownerData: z.record(z.unknown()).optional(),
  zoning: z.record(z.unknown()).optional(),
  lotSize: z.number().optional(),
  buildingSquareFootage: z.number().optional(),
  yearBuilt: z.number().int().optional(),
  assessedValue: z.number().optional(),
  lastSaleDate: z.string().datetime().optional(),
  ownerOccupancy: z.boolean().optional(),
  permitHistory: z.array(z.record(z.unknown())).optional(),
  propertyType: z.string().optional(),
  ownershipType: z.string().optional(),
  floodEnvironmentalFlags: z.array(z.string()).optional(),
  gisContext: z.record(z.unknown()).optional(),
  censusMarketContext: z.record(z.unknown()).optional(),
  priorKealeeInteractions: z.array(z.record(z.unknown())).optional(),
  serviceIntent: z.string().optional(),
  budgetHint: z.number().optional(),
})

export const propertyIntelligenceOutputSchema = z.object({
  propertySummary: z.string().min(1),
  propertyType: z.string().min(1),
  ownershipType: z.string().min(1),
  likelyUseCases: z.array(z.string()).min(1),
  developmentPotential: riskLevelSchema,
  renovationPotential: riskLevelSchema,
  permitRisk: riskLevelSchema,
  zoningRisk: riskLevelSchema,
  physicalRisk: riskLevelSchema,
  dataQualityScore: confidenceScoreSchema,
  recommendedKealeeProducts: z.array(kealeeProductSchema).min(1),
  digitalTwinUpdates: z.array(digitalTwinUpdateSchema).default([]),
  nextActions: z.array(nextActionSchema).min(1),
  confidenceScore: confidenceScoreSchema,
  requiresHumanReview: z.boolean(),
})

export type PropertyIntelligenceInput = z.infer<typeof propertyIntelligenceInputSchema>
export type PropertyIntelligenceOutput = z.infer<typeof propertyIntelligenceOutputSchema>
