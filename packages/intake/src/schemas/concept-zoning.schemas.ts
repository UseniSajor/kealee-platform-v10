/**
 * Concept & Zoning Intake Schemas
 * Zod validation schemas for AI concept intake and zoning analysis
 */

import { z } from 'zod'

// ============================================================================
// CONCEPT INTAKE SCHEMA
// ============================================================================

export const ConceptIntakeSchema = z.object({
  // Required fields
  projectType: z.enum([
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
  ]),
  description: z.string().min(10, 'Please provide at least 10 characters'),
  email: z.string().email('Invalid email address'),

  // Optional fields
  address: z.string().optional(),
  zipCode: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),

  // Project details
  hasPhotos: z.boolean().optional(),
  photoCount: z.number().optional(),
  roughDimensions: z.object({
    sqft: z.number().optional(),
    length: z.number().optional(),
    width: z.number().optional(),
  }).optional(),
  budgetRange: z.string().optional(),
  stylePreference: z.string().optional(),

  // Flags
  hasExistingStructure: z.boolean().optional(),
})

export type ConceptIntake = z.infer<typeof ConceptIntakeSchema>

export const ConceptIntakeResponseSchema = z.object({
  intakeId: z.string(),
  leadScore: z.number(),
  tier: z.enum(['concept_basic', 'concept_advanced', 'concept_full']),
  route: z.enum(['immediate', 'standard', 'requires_followup']),
  readinessState: z.enum(['NOT_READY', 'NEEDS_MORE_INFO', 'READY_FOR_CONCEPT']),
  complexity: z.enum(['simple', 'moderate', 'complex']),
  flags: z.record(z.union([z.boolean(), z.string()])),
  scopeSummary: z.object({
    projectType: z.string(),
    scope: z.string(),
    estimatedSquareFootage: z.number().optional(),
    budgetRange: z.string().optional(),
  }),
  conceptOptions: z.array(z.object({
    conceptId: z.string(),
    title: z.string(),
    description: z.string(),
    styleCategory: z.string(),
    renderingUrl: z.string(),
    confidence: z.number(),
  })),
  styleDirection: z.string(),
  feasibilitySignals: z.object({
    complexity: z.enum(['simple', 'moderate', 'complex']),
    estimatedTurnaround: z.number(),
    recommendedNextStep: z.string(),
  }),
  estimatedPrice: z.number(),
  nextStep: z.string(),
})

export type ConceptIntakeResponse = z.infer<typeof ConceptIntakeResponseSchema>

// ============================================================================
// ZONING INTAKE SCHEMA
// ============================================================================

export const ZoningIntakeSchema = z.object({
  // Required fields
  address: z.string().optional(), // Either address or zipCode
  zipCode: z.string().optional(),
  projectIntent: z.string().optional(),
  email: z.string().email('Invalid email address'),

  // Optional but encouraged
  jurisdiction: z.string().optional(),
  zoningDistrict: z.string().optional(),
  lotSize: z.number().optional(),
  existingStructureInfo: z.string().optional(),
  desiredBuild: z.string().optional(),

  // Environmental factors
  environmentalConstraints: z.string().optional(),

  // Documentation
  uploadedPhotos: z.boolean().optional(),
  uploadedDocuments: z.boolean().optional(),

  // Property info
  propertyType: z.enum(['residential', 'commercial', 'mixed_use', 'industrial']).optional(),
  currentUse: z.string().optional(),
})

export type ZoningIntake = z.infer<typeof ZoningIntakeSchema>

export const ZoningIntakeResponseSchema = z.object({
  intakeId: z.string(),
  jurisdiction: z.string(),
  zoningDistrict: z.string(),
  buildabilityScore: z.number(),
  readinessState: z.enum([
    'NOT_READY',
    'NEEDS_MORE_INFO',
    'READY_FOR_ZONING_REVIEW',
    'READY_FOR_ESTIMATE',
    'REQUIRES_CONSULTATION',
  ]),
  flags: z.record(z.union([z.boolean(), z.string()])),
  feasibilityNotes: z.string(),
  recommendedTier: z.enum(['zoning_research', 'feasibility_assessment', 'entitlement_path', 'pre_submission_consulting']),
  estimatedPrice: z.number(),
  estimatedTurnaround: z.number(),
  nextStep: z.string(),
})

export type ZoningIntakeResponse = z.infer<typeof ZoningIntakeResponseSchema>

// ============================================================================
// DMV JURISDICTIONS REFERENCE
// ============================================================================

export const DMV_JURISDICTIONS: Record<string, {
  name: string
  state: string
  averagePermitDays: number
  reviewDaysExpedited?: number
  requiresEmergencyPath?: boolean
  jurisdiction?: string
}> = {
  'DC': {
    name: 'District of Columbia',
    state: 'DC',
    averagePermitDays: 45,
    reviewDaysExpedited: 20,
    jurisdiction: 'DC DOEE',
  },
  'MD': {
    name: 'Maryland',
    state: 'MD',
    averagePermitDays: 60,
    reviewDaysExpedited: 30,
  },
  'VA': {
    name: 'Virginia',
    state: 'VA',
    averagePermitDays: 45,
    reviewDaysExpedited: 20,
  },
  'MONTGOMERY': {
    name: 'Montgomery County',
    state: 'MD',
    averagePermitDays: 60,
    reviewDaysExpedited: 35,
    jurisdiction: 'MCDPS',
  },
  'FAIRFAX': {
    name: 'Fairfax County',
    state: 'VA',
    averagePermitDays: 40,
    reviewDaysExpedited: 20,
    jurisdiction: 'Fairfax DPU',
  },
  'ARLINGTON': {
    name: 'Arlington County',
    state: 'VA',
    averagePermitDays: 45,
    reviewDaysExpedited: 25,
    jurisdiction: 'Arlington DES',
  },
}
