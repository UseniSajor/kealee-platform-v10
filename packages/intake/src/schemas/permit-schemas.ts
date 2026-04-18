/**
 * Permit Intake Schemas
 * Schemas for permit services intake validation
 */

import { z } from 'zod' /* ESTIMATION_BOT_OUTPUT */

/**
 * Permit-specific project details
 */
export const PermitProjectDetailsSchema = z.object({
  // Jurisdiction selection (primary gating control)
  jurisdiction: z
    .enum([
      'dc_dob',
      'pg_county_dps',
      'montgomery_county_deid',
      'arlington_county_pzm',
      'alexandria_dna',
      'fairfax_county_zea',
      'baltimore_dop',
    ])
    .describe('Target permit jurisdiction'),

  // Permit type determination
  permitTypes: z
    .array(
      z.enum([
        'building_permit',
        'electrical_permit',
        'plumbing_permit',
        'hvac_permit',
        'mechanical_permit',
        'envelope_permit',
        'occupancy_permit',
        'demolition_permit',
      ])
    )
    .describe('Expected permit types needed'),

  // Project characteristics that affect permit path
  projectCharacteristics: z
    .object({
      isRenovation: z.boolean(),
      isAddition: z.boolean(),
      isNewConstruction: z.boolean(),
      isAccessibilityWork: z.boolean(),
      involvesStructuralChange: z.boolean(),
      involvesSchoolProximity: z.boolean(),
      involvesHistoricDistrict: z.boolean(),
      involvesWetlands: z.boolean(),
    })
    .describe('Project characteristics relevant to permitting'),

  // Estimate data if available (from EstimateBot output)
  relatedEstimateId: z.string().optional().describe('Linked estimate ID if permit follows estimate'),
  estimatedProjectCost: z.number().optional().describe('Total project cost for permitting thresholds'),

  // Existing permits/violations
  hasExistingViolations: z.boolean().optional().describe('Known code violations on property'),
  hasExistingPermits: z.boolean().optional().describe('Other active permits on property'),
})

/**
 * Full Permit Intake request
 */
export const PermitIntakeSchema = z.object({
  contact: z
    .object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
      role: z.enum(['homeowner', 'contractor', 'architect', 'project_manager']),
      companyName: z.string().optional(),
    })
    .describe('Contact information'),

  project: PermitProjectDetailsSchema.describe('Project details'),

  // Service tier requested
  tierPreference: z
    .enum(['document_assembly', 'submission', 'tracking', 'inspection_coordination'])
    .optional()
    .describe('Permit service tier preference'),

  // Accessibility for triage
  hasDesignDocuments: z.boolean().optional().describe('Has design/construction documents'),
  hasContractorSelected: z.boolean().optional().describe('General contractor already selected'),
  isOwnersBuilder: z.boolean().optional().describe('Owner acting as builder/contractor'),
})

export type PermitIntake = z.infer<typeof PermitIntakeSchema>

/**
 * Permit Intake Response
 */
export const PermitIntakeResponseSchema = z.object({
  intakeId: z.string().describe('Unique intake identifier'),
  jurisdiction: z.string().describe('Confirmed jurisdiction'),
  estimatedProcessingTime: z.number().int().describe('Estimated days to permit issuance'),
  permitTypesNeeded: z.array(z.string()).describe('Confirmed permit types'),
  readinessState: z
    .enum(['NEEDS_ESTIMATE', 'READY_FOR_PERMIT_PREP', 'READY_FOR_SUBMISSION', 'CANNOT_PROCEED'])
    .describe('Permit readiness assessment'),
  flags: z
    .object({
      requiresArchitecturalReview: z.boolean(),
      requiresStructuralEngineer: z.boolean(),
      flaggedForComplexReview: z.boolean(),
      jurisdictionSpecialRequirement: z.string().optional(),
    })
    .describe('Permit-specific processing flags'),
  estimatedPrice: z.number().describe('Estimated service cost in cents'),
  nextStep: z.string().describe('User-friendly description of next step'),
})

export type PermitIntakeResponse = z.infer<typeof PermitIntakeResponseSchema>

/**
 * PermitBot Input Schema
 * What EstimateBot (or DesignBot) hands to PermitBot
 */
export const PermitBotInputSchema = z.object({
  intakeId: z.string().describe('Original permit intake ID'),
  estimateId: z.string().optional().describe('Reference to completed estimate'),
  jurisdiction: z.string().describe('Target permit jurisdiction'),
  
  projectScope: z.string().describe('Detailed project scope'),
  totalProjectCost: z.number().optional().describe('Total estimated project cost'),
  
  permitTypes: z.array(z.string()).describe('Permit types required'),
  projectCharacteristics: z.record(z.boolean()).describe('Project characteristics affecting permits'),
  
  previousPermitHistory: z
    .object({
      permitNumber: z.string(),
      issuedDate: z.string().datetime().optional(),
      status: z.enum(['active', 'completed', 'expired', 'violation']),
    })
    .optional()
    .describe('Previous related permits'),

  constraints: z
    .object({
      timeline: z.enum(['immediate', 'standard', 'flexible']).optional(),
      jurisdictionSpecificRequirements: z.array(z.string()).optional(),
    })
    .optional()
    .describe('Permit constraints'),
})

export type PermitBotInput = z.infer<typeof PermitBotInputSchema>

/**
 * PermitBot Output Schema
 * What PermitBot produces after analysis
 */
export const PermitBotOutputSchema = z.object({
  intakeId: z.string().describe('Reference to original intake'),
  permitPackageId: z.string().describe('Unique permit package identifier'),
  createdAt: z.string().datetime().describe('Package creation timestamp'),
  
  jurisdiction: z.string().describe('Target jurisdiction'),
  
  // Permit requirements
  permitRequirements: z
    .array(
      z.object({
        permitType: z.string(),
        agency: z.string(),
        requiredDocuments: z.array(z.string()),
        approvals: z.array(z.string()).optional(),
        inspectionPoints: z.array(z.string()).optional(),
        timeline: z.object({
          submissionReadiness: z.number().int().describe('Days until ready to submit'),
          expectedReviewTime: z.number().int().describe('Expected review days'),
          estimatedIssuance: z.number().int().describe('Total days from submission to issuance'),
        }),
        riskFactors: z.array(z.string()).optional().describe('Known risk factors affecting this permit'),
      })
    )
    .describe('Detailed requirements per permit type'),

  // Submission readiness
  readyForSubmission: z.boolean().describe('All documents ready for submission'),
  missingDocuments: z.array(z.string()).optional().describe('Documents still needed before submission'),

  // Jurisdiction-specific guidance
  jurisdictionSpecificGuidance: z
    .object({
      agency: z.string(),
      submissionMethod: z.enum(['online', 'in_person', 'email', 'mail']),
      reviewDaysStandard: z.number().int(),
      reviewDaysExpedited: z.boolean().optional(),
      contactInfo: z.object({
        phone: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
      }),
      commonIssues: z.array(z.string()).optional(),
    })
    .describe('Jurisdiction-specific processing guidance'),

  // Cost implications
  estimatedPermitCosts: z.object({
    applicationFees: z.number().optional(),
    inspectionFees: z.number().optional(),
    expeditedFees: z.number().optional(),
    estimatedTotal: z.number(),
  }),

  // Inspector scheduling
  inspectionSchedule: z
    .array(
      z.object({
        inspectionType: z.string(),
        timing: z.enum(['pre_work', 'during_phase', 'final']),
        description: z.string(),
      })
    )
    .optional()
    .describe('Typical inspection schedule for this jurisdiction'),

  // Validation
  assumptions: z.array(z.string()).describe('Key assumptions in permit package'),
  recommendations: z.array(z.string()).describe('Permit-related recommendations'),
  confidenceScore: z.number().min(0).max(100).describe('Confidence in permit guidance accuracy'),
})

export type PermitBotOutput = z.infer<typeof PermitBotOutputSchema>

/**
 * Jurisdiction-specific rules (DMV region)
 * Used by PermitBot for routing and guidance
 */
export const DMV_JURISDICTIONS = {
  dc_dob: {
    name: 'DC Department of Buildings',
    abbreviation: 'DC',
    state: 'DC',
    website: 'https://doee.dc.gov/service/permits-and-licenses',
    submissionMethod: 'online',
    requiredPermits: ['building_permit'],
    reviewDaysStandard: 14,
    reviewDaysExpedited: true,
  },
  pg_county_dps: {
    name: 'Prince George\'s County - Department of Permitting, Inspections & Enforcement',
    abbreviation: 'PG',
    state: 'MD',
    website: 'https://www.princegeorgescountymd.gov/311/Permits-Licenses',
    submissionMethod: 'in_person',
    requiredPermits: ['building_permit', 'electrical_permit', 'plumbing_permit', 'hvac_permit'],
    reviewDaysStandard: 21,
    reviewDaysExpedited: false,
  },
  montgomery_county_deid: {
    name: 'Montgomery County - Dept of Permitting Services',
    abbreviation: 'MC',
    state: 'MD',
    website: 'https://www.montgomerycountymd.gov/permittingservices/',
    submissionMethod: 'online',
    requiredPermits: ['building_permit', 'electrical_permit', 'plumbing_permit', 'mechanical_permit'],
    reviewDaysStandard: 21,
    reviewDaysExpedited: true,
  },
  arlington_county_pzm: {
    name: 'Arlington County - Permitting & Zoning Management',
    abbreviation: 'ARL',
    state: 'VA',
    website: 'https://www.arlingtonva.us/government/build-or-permit',
    submissionMethod: 'in_person',
    requiredPermits: ['building_permit', 'electrical_permit', 'plumbing_permit'],
    reviewDaysStandard: 14,
    reviewDaysExpedited: true,
  },
  alexandria_dna: {
    name: 'City of Alexandria - Division of Neighborhood Services',
    abbreviation: 'ALX',
    state: 'VA',
    website: 'https://www.alexandriava.gov/permits',
    submissionMethod: 'in_person',
    requiredPermits: ['building_permit', 'electrical_permit', 'plumbing_permit'],
    reviewDaysStandard: 14,
    reviewDaysExpedited: true,
  },
  fairfax_county_zea: {
    name: 'Fairfax County - Department of Planning & Zoning',
    abbreviation: 'FFC',
    state: 'VA',
    website: 'https://www.fairfaxcounty.gov/planning-zoning/',
    submissionMethod: 'in_person',
    requiredPermits: ['building_permit', 'electrical_permit', 'plumbing_permit', 'mechanical_permit'],
    reviewDaysStandard: 28,
    reviewDaysExpedited: false,
  },
  baltimore_dop: {
    name: 'Baltimore City - Department of Housing & Community Development',
    abbreviation: 'BAL',
    state: 'MD',
    website: 'https://dhcd.baltimorecity.gov/permits',
    submissionMethod: 'in_person',
    requiredPermits: ['building_permit', 'electrical_permit', 'plumbing_permit'],
    reviewDaysStandard: 21,
    reviewDaysExpedited: false,
  },
} as const

export type DMVJurisdictionCode = keyof typeof DMV_JURISDICTIONS
