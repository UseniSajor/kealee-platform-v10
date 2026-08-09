import { z } from 'zod'
import { confidenceScoreSchema, nextActionSchema } from './shared.js'

export const leadIntelligenceInputSchema = z.object({
  leadTwin: z.record(z.unknown()).optional(),
  propertyTwin: z.record(z.unknown()).optional(),
  campaignSource: z.string().optional(),
  formData: z.record(z.unknown()).optional(),
  conversationHistory: z.array(z.record(z.unknown())).optional(),
  websiteBehavior: z.record(z.unknown()).optional(),
  crmStatus: z.string().optional(),
  purchaseHistory: z.array(z.record(z.unknown())).optional(),
  projectInterest: z.string().optional(),
  budget: z.number().optional(),
  timeline: z.string().optional(),
  uploadedPhotos: z.boolean().optional(),
})

export const leadIntelligenceOutputSchema = z.object({
  leadSegment: z.string().min(1),
  intentScore: z.number().min(0).max(100),
  engagementScore: z.number().min(0).max(100),
  salesPriority: z.enum(['immediate', 'high', 'medium', 'low', 'suppress']),
  recommendedProduct: z.string().min(1),
  recommendedNurtureSequence: z.string().optional(),
  recommendedSalesAction: z.string().min(1),
  crmTags: z.array(z.string()).default([]),
  suppressionFlags: z.array(z.string()).default([]),
  complianceFlags: z.array(z.string()).default([]),
  leadTwinUpdates: z.array(z.object({ field: z.string(), value: z.unknown() })).default([]),
  nextActions: z.array(nextActionSchema).min(1),
  confidenceScore: confidenceScoreSchema,
  requiresHumanReview: z.boolean(),
  scoreExplanation: z.string().min(1),
})

export type LeadIntelligenceInput = z.infer<typeof leadIntelligenceInputSchema>
export type LeadIntelligenceOutput = z.infer<typeof leadIntelligenceOutputSchema>
