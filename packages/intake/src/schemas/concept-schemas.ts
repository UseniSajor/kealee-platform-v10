/**
 * Concept Intake Schemas
 * Schemas for architectural concept generation intake validation
 */

import { z } from 'zod'

/**
 * Concept Intake request schema
 * Captures project details for AI concept generation
 */
export const ConceptIntakeSchema = z.object({
  // Project type
  projectType: z
    .enum([
      'kitchen',
      'bathroom',
      'addition',
      'adu',
      'facade',
      'landscape',
      'multifamily',
      'interior_remodel',
      'exterior_renovation',
      'structural_change',
      'new_construction',
    ])
    .describe('Primary project type'),

  // Project description
  description: z.string().optional().describe('Detailed project description'),

  // Location
  address: z.string().optional().describe('Project address'),
  zipCode: z.string().optional().describe('Project zip code'),

  // Contact
  email: z.string().email().optional().describe('Contact email'),
  phone: z.string().optional().describe('Contact phone'),
  name: z.string().optional().describe('Contact name'),

  // Visual inputs
  hasPhotos: z.boolean().default(false).describe('Whether photos are provided'),
  photoCount: z.number().int().optional().describe('Number of photos provided'),
  photoUrls: z.array(z.string()).optional().describe('URLs of uploaded photos'),

  // Dimensions
  roughDimensions: z
    .object({
      sqft: z.number().optional().describe('Approximate square footage'),
      width: z.number().optional().describe('Approximate width in feet'),
      depth: z.number().optional().describe('Approximate depth in feet'),
    })
    .optional()
    .describe('Rough project dimensions'),

  // Style preferences
  stylePreference: z
    .enum(['modern', 'traditional', 'transitional', 'contemporary', 'craftsman', 'mediterranean', 'other'])
    .optional()
    .describe('Preferred architectural style'),

  // Budget
  budgetRange: z
    .enum([
      'under_25k',
      '25k_50k',
      '50k_100k',
      '100k_250k',
      '250k_500k',
      '500k_plus',
    ])
    .optional()
    .describe('Estimated budget range'),

  // Timeline
  timeline: z
    .enum(['asap', '1_3_months', '3_6_months', '6_12_months', 'flexible'])
    .optional()
    .describe('Desired project timeline'),

  // Additional context
  additionalNotes: z.string().optional().describe('Any additional context or requirements'),
})

export type ConceptIntake = z.infer<typeof ConceptIntakeSchema>

/**
 * Generated concept option
 */
export const ConceptOptionSchema = z.object({
  conceptId: z.string().describe('Unique concept identifier'),
  title: z.string().describe('Concept title'),
  description: z.string().describe('Concept description'),
  styleCategory: z.string().describe('Style category'),
  renderingUrl: z.string().describe('URL to concept rendering'),
  confidence: z.number().min(0).max(1).describe('AI confidence score'),
})

export type ConceptOption = z.infer<typeof ConceptOptionSchema>

/**
 * Concept Intake Response schema
 * Returned after intake submission
 */
export const ConceptIntakeResponseSchema = z.object({
  intakeId: z.string().describe('Unique intake identifier'),
  leadScore: z.number().min(0).max(100).describe('Lead quality score'),
  tier: z
    .enum(['concept_basic', 'concept_advanced', 'concept_full'])
    .describe('Recommended concept tier'),
  route: z
    .enum(['immediate', 'standard', 'requires_followup'])
    .describe('Processing route'),
  readinessState: z
    .enum(['NEEDS_MORE_INFO', 'READY_FOR_CONCEPT', 'READY_FOR_DESIGN'])
    .describe('Concept readiness state'),
  complexity: z
    .enum(['simple', 'moderate', 'complex'])
    .describe('Project complexity assessment'),
  flags: z
    .object({
      hasPhotos: z.boolean(),
      hasRoughDimensions: z.boolean(),
      hasBudgetRange: z.boolean(),
      hasStylePreference: z.boolean(),
      requiresArchitect: z.boolean(),
      requiresEngineer: z.boolean(),
    })
    .describe('Intake completeness flags'),
  scopeSummary: z
    .object({
      projectType: z.string(),
      scope: z.string().optional(),
      estimatedSquareFootage: z.number().optional(),
      budgetRange: z.string().optional(),
    })
    .describe('Summary of project scope'),
  conceptOptions: z.array(ConceptOptionSchema).describe('Generated concept options'),
  styleDirection: z.string().describe('Recommended style direction'),
  feasibilitySignals: z
    .object({
      complexity: z.enum(['simple', 'moderate', 'complex']),
      estimatedTurnaround: z.number().int().describe('Estimated days to completion'),
      recommendedNextStep: z.string(),
    })
    .describe('Feasibility assessment signals'),
  estimatedPrice: z.number().describe('Recommended tier price in cents'),
  nextStep: z.string().describe('User-friendly description of next step'),
})

export type ConceptIntakeResponse = z.infer<typeof ConceptIntakeResponseSchema>
