import { z } from 'zod'
import { confidenceScoreSchema, nextActionSchema } from './shared.js'

export const projectIntelligenceInputSchema = z.object({
  projectTwin: z.record(z.unknown()),
  propertyTwin: z.record(z.unknown()).optional(),
  leadTwin: z.record(z.unknown()).optional(),
  capitalTwin: z.record(z.unknown()).optional(),
  scope: z.record(z.unknown()).optional(),
  budget: z.number().optional(),
  estimate: z.record(z.unknown()).optional(),
  permitStatus: z.string().optional(),
  contractorBids: z.array(z.record(z.unknown())).optional(),
  schedule: z.record(z.unknown()).optional(),
  tasks: z.array(z.record(z.unknown())).optional(),
  documents: z.array(z.record(z.unknown())).optional(),
  customerDecisions: z.array(z.record(z.unknown())).optional(),
})

export const projectIntelligenceOutputSchema = z.object({
  projectHealthScore: z.number().min(0).max(100),
  missingItems: z.array(z.string()).default([]),
  riskFlags: z.array(z.string()).default([]),
  budgetImpact: z.string().optional(),
  scheduleImpact: z.string().optional(),
  recommendedNextActions: z.array(nextActionSchema).min(1),
  deliverableUpdates: z.array(z.object({ type: z.string(), status: z.string() })).default([]),
  projectTwinUpdates: z.array(z.object({ field: z.string(), value: z.unknown() })).default([]),
  customerSummary: z.string().min(1),
  adminSummary: z.string().min(1),
  confidenceScore: confidenceScoreSchema,
  requiresHumanReview: z.boolean(),
  scoreExplanation: z.string().min(1),
})

export type ProjectIntelligenceInput = z.infer<typeof projectIntelligenceInputSchema>
export type ProjectIntelligenceOutput = z.infer<typeof projectIntelligenceOutputSchema>
