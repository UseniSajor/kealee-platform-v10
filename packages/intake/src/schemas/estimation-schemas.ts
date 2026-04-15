/**
 * Estimation Intake Schemas
 * Schemas for cost estimation service intake validation
 */

import { z } from 'zod'
import { BaseContactSchema, ProjectDetailsSchema } from './base-schemas'

/**
 * Estimation-specific project details
 * Extends base project details with estimation-relevant fields
 */
export const EstimationProjectDetailsSchema = ProjectDetailsSchema.extend({
  // Project scope
  projectScope: z
    .enum([
      'interior_remodel',
      'exterior_renovation',
      'addition',
      'new_construction',
      'mep_upgrade',
      'accessibility_modification',
      'other',
    ])
    .describe('Primary project scope category'),

  // Budget range for cost comparison
  estimatedBudget: z.string().optional().describe('Owner or contractor estimated budget (informational)'),

  // Project stage
  projectStage: z
    .enum(['pre_design', 'schematic', 'design_development', 'construction_documents', 'bidding', 'pricing', 'construction'])
    .describe('Current project stage'),

  // Scope detail level
  scopeDetail: z
    .enum(['verbal_description', 'sketch', 'schematic_drawing', 'design_drawing', 'construction_documents'])
    .describe('Quality/detail level of scope provided'),

  // CSI divisions needed (for pre-filtering)
  csiDivisions: z
    .array(
      z.enum([
        'concrete',
        'structural_steel',
        'wood_plastics_composites',
        'thermal_moisture',
        'finishes',
        'specialties',
        'equipment',
        'furnishings',
        'fire_suppression',
        'plumbing',
        'hvac',
        'power_distribution',
        'data_comms',
        'fire_alarm',
        'lighting',
        'special_systems',
      ])
    )
    .optional()
    .describe('Known CSI divisions required (for cost database filtering)'),

  // Unit cost source preference
  costSourcePreference: z.enum(['rsmeans', 'market_survey', 'historical']).optional().describe('Cost source preference if known'),
})

/**
 * Full Estimation Intake request
 * Combines contact info + project details
 */
export const EstimationIntakeSchema = z.object({
  contact: BaseContactSchema.describe('Contact information'),
  project: EstimationProjectDetailsSchema.describe('Project details'),
  
  // Accessibility questions for tiering
  hasDesignDrawings: z.boolean().describe('Whether owner has design drawings'),
  hasContractorFeedback: z.boolean().optional().describe('Whether scope includes contractor feedback'),
  requiresArchitecturalReview: z.boolean().optional().describe('Whether architectural review needed'),
  requiresEngineeringReview: z.boolean().optional().describe('Whether engineering review needed'),

  // Tier preference hint (used by EstimateBot for tier recommendation)
  tierPreference: z
    .enum(['cost_estimate', 'certified_estimate', 'bundle'])
    .optional()
    .describe('User tier preference if indicated'),
})

export type EstimationIntake = z.infer<typeof EstimationIntakeSchema>

/**
 * Estimation Intake Response
 * Returned after intake submission, includes lead scoring and tier recommendation
 */
export const EstimationIntakeResponseSchema = z.object({
  intakeId: z.string().describe('Unique intake identifier'),
  leadScore: z.number().min(0).max(100).describe('Lead quality score'),
  tier: z.enum(['cost_estimate', 'certified_estimate', 'bundle']).describe('Recommended tier based on scope'),
  route: z.enum(['immediate', 'high_priority', 'standard', 'requires_followup']).describe('Processing route'),
  readinessState: z
    .enum(['NOT_READY', 'NEEDS_MORE_INFO', 'READY_FOR_ESTIMATE', 'READY_FOR_ESTIMATE_PLUS_PERMIT'])
    .describe('Estimation readiness state'),
  flags: z
    .object({
      requiresArchitect: z.boolean(),
      requiresEngineer: z.boolean(),
      complexityLevel: z.enum(['low', 'medium', 'high']),
      estimatedTurnaround: z.number().int().describe('Estimated days to completion'),
    })
    .describe('Additional processing flags'),
  estimatedPrice: z.number().describe('Recommended tier price in cents'),
  nextStep: z.string().describe('User-friendly description of next step'),
})

export type EstimationIntakeResponse = z.infer<typeof EstimationIntakeResponseSchema>

/**
 * EstimateBot Input Schema
 * What DesignBot hands off to EstimateBot
 */
export const EstimateBotInputSchema = z.object({
  intakeId: z.string().describe('Original intake ID'),
  projectScope: z.string().describe('Detailed project scope description'),
  floorplanId: z.string().optional().describe('Design floorplan ID if available'),
  designConceptId: z.string().optional().describe('Related design concept ID'),
  csiDivisions: z.array(z.string()).describe('Relevant CSI divisions to estimate'),
  complexityScore: z.number().min(0).max(100).optional().describe('Design complexity score from DesignBot'),
  estimationApproach: z.enum(['unit_cost', 'assembly_based', 'historical']).describe('Recommended estimation approach'),
  constraints: z
    .object({
      maxBudget: z.number().optional().describe('Maximum budget constraint'),
      timeline: z.enum(['immediate', 'standard', 'flexible']).optional(),
      localInflationFactor: z.number().optional().describe('DMV market inflation adjustment'),
    })
    .optional()
    .describe('Estimation constraints'),
})

export type EstimateBotInput = z.infer<typeof EstimateBotInputSchema>

/**
 * EstimateBot Output Schema
 * What EstimateBot produces (gates PermitBot readiness)
 */
export const EstimateBotOutputSchema = z.object({
  intakeId: z.string().describe('Reference to original intake'),
  estimateId: z.string().describe('Unique estimate identifier'),
  createdAt: z.string().datetime().describe('Estimate creation timestamp'),
  
  // Cost breakdown
  costBreakdown: z
    .array(
      z.object({
        division: z.string().describe('CSI division code'),
        divisionName: z.string().describe('CSI division name'),
        items: z.array(
          z.object({
            description: z.string(),
            unit: z.string(),
            quantity: z.number(),
            unitCost: z.number(),
            total: z.number(),
            source: z.enum(['rsmeans', 'market', 'historical']),
          })
        ),
        subtotal: z.number(),
      })
    )
    .describe('Detailed cost breakdown by CSI division'),

  // Summary numbers
  summary: z.object({
    directCosts: z.number().describe('Sum of all trade costs'),
    contingency: z.number().describe('Contingency allowance (typically 10-15%)'),
    generalConditions: z.number().describe('GC overhead (typically 15%)'),
    profitMargin: z.number().describe('Contractor profit margin (typically 10%)'),
    totalEstimatedCost: z.number().describe('Grand total estimate'),
  }),

  // Confidence and scenarios
  confidence: z.number().min(0).max(100).describe('Confidence score in estimate accuracy'),
  scenarios: z
    .object({
      lowCost: z.number().optional().describe('Low-end scenario total'),
      midCost: z.number().optional().describe('Mid-range scenario total'),
      highCost: z.number().optional().describe('High-end scenario total'),
    })
    .optional()
    .describe('Cost range scenarios'),

  // Gate for PermitBot
  readinessForPermit: z.boolean().describe('Whether estimate is ready for permit stage'),
  permitBotInput: z
    .object({
      estimateId: z.string(),
      totalCost: z.number(),
      projectScope: z.string(),
      csiDivisions: z.array(z.string()),
      confidenceScore: z.number(),
    })
    .optional()
    .describe('Input prepared for PermitBot if ready'),

  // Validation
  assumptions: z.array(z.string()).describe('Key assumptions made in estimation'),
  exclusions: z.array(z.string()).describe('Important items explicitly excluded'),
})

export type EstimateBotOutput = z.infer<typeof EstimateBotOutputSchema>
