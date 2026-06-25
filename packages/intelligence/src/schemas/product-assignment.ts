import { z } from 'zod'
import { kealeeProductSchema } from './shared.js'
import { confidenceScoreSchema } from './shared.js'

export const productAssignmentOutputSchema = z.object({
  assignedProduct: kealeeProductSchema,
  productScore: z.number().min(0).max(100),
  displayName: z.string().min(1),
  campaign: z.string().min(1),
  landingPage: z.string().min(1),
  landingPageLabel: z.string().min(1),
  offer: z.string().min(1),
  offerPriceUsd: z.number().min(0),
  bot: z.string().min(1),
  nurtureSequence: z.string().min(1),
  nextServiceInJourney: kealeeProductSchema.optional(),
  crmPipelineStage: z.string().min(1),
  matchedRuleIds: z.array(z.string()).default([]),
  autoAssigned: z.boolean(),
  requiresHumanReview: z.boolean(),
  assignmentExplanation: z.string().min(1),
  confidenceScore: confidenceScoreSchema,
  crmTags: z.array(z.string()).default([]),
  crmCustomFields: z.record(z.string()).default({}),
})

export type ProductAssignmentOutput = z.infer<typeof productAssignmentOutputSchema>
