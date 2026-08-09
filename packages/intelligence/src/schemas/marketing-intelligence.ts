import { z } from 'zod'
import { MARKETING_SEGMENTS } from '../constants/segments.js'
import { confidenceScoreSchema, kealeeProductSchema, nextActionSchema } from './shared.js'

export const marketingChannelSchema = z.enum([
  'paid_ads',
  'email',
  'sms',
  'direct_mail',
  'retargeting',
  'sales_call',
  'organic',
  'none',
])

export const marketingIntelligenceInputSchema = z.object({
  propertyTwin: z.record(z.unknown()),
  leadTwin: z.record(z.unknown()).optional(),
  opportunityScores: z.record(z.unknown()).optional(),
  campaignHistory: z.array(z.record(z.unknown())).optional(),
  sourceChannel: z.string().optional(),
  geographicMarket: z.string().optional(),
  serviceCatalog: z.array(z.record(z.unknown())).optional(),
  priorInteractionHistory: z.array(z.record(z.unknown())).optional(),
  crmStatus: z.string().optional(),
  complianceFlags: z.array(z.string()).optional(),
})

export const marketingIntelligenceOutputSchema = z.object({
  audienceSegment: z.enum(MARKETING_SEGMENTS),
  recommendedCampaign: z.string().min(1),
  recommendedChannel: marketingChannelSchema,
  recommendedOffer: z.string().min(1),
  recommendedMessageAngle: z.string().min(1),
  productRouting: z.array(kealeeProductSchema).min(1),
  salesPriority: z.enum(['immediate', 'high', 'medium', 'low', 'suppress']),
  crmTags: z.array(z.string()).default([]),
  nurtureSequence: z.string().optional(),
  suppressionFlags: z.array(z.string()).default([]),
  complianceFlags: z.array(z.string()).default([]),
  nextActions: z.array(nextActionSchema).min(1),
  confidenceScore: confidenceScoreSchema,
  requiresHumanReview: z.boolean(),
})

export type MarketingIntelligenceInput = z.infer<typeof marketingIntelligenceInputSchema>
export type MarketingIntelligenceOutput = z.infer<typeof marketingIntelligenceOutputSchema>
