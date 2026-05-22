/** Client-safe v30 helpers (Kealee Platform v30 spec). */

export function isV30EnabledClient(): boolean {
  return process.env.NEXT_PUBLIC_KEALEE_V30_ENABLED === 'true'
}

export interface V30IntakeAnswers {
  propertyType: string
  primaryScope: string
  budgetRange: string
  timeline: string
  location: string
  squareFeet: number
  yearBuilt: string
  utilities: { naturalGas?: boolean; waterSewer?: boolean }
  codeConsiderations: string[]
}

export interface V30QuoteResponse {
  analysis: {
    scopeComplexity: string
    riskLevel: string
    estimatedCost: number
    estimatedDays: number
    suggestedFeatures: string[]
  }
  package: {
    features: string[]
    basePrice: number
    featureAddons: number
    totalPrice: number
  }
}

export const V30_FEATURE_OPTIONS = [
  'Design',
  'Floorplan',
  'Estimate',
  'Permits',
  'Videos',
  'Support',
] as const

export const V30_INTAKE_QUESTIONS = [
  { key: 'propertyType', label: 'Property type', type: 'select', options: ['single-family', 'multi-family', 'commercial', 'mixed-use'] },
  { key: 'primaryScope', label: 'Primary scope', type: 'select', options: ['kitchen_remodel', 'bath_remodel', 'addition', 'whole_house', 'HVAC', 'electrical', 'exterior', 'other'] },
  { key: 'budgetRange', label: 'Budget range', type: 'select', options: ['$25K-$50K', '$50K-$100K', '$100K-$250K', '$250K+'] },
  { key: 'timeline', label: 'Timeline', type: 'select', options: ['ASAP', '6-8 weeks', '3+ months', 'flexible'] },
  { key: 'location', label: 'Location (DC / MD county / VA)', type: 'text' },
  { key: 'squareFeet', label: 'Square footage', type: 'number' },
  { key: 'yearBuilt', label: 'Year built', type: 'select', options: ['pre-1950', '1950-1980', '1980-2000', '2000+'] },
] as const
