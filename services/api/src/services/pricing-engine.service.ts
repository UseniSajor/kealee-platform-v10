/**
 * PRICING ENGINE SERVICE
 * Centralized pricing logic with 2023 CTC base costs + 13% inflation (2026 adjusted)
 * Supports dynamic pricing for concept, estimation, permits based on complexity and jurisdiction
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PricingInput {
  serviceType: 'concept' | 'estimation' | 'permits'
  tier: string
  jurisdiction?: string
  projectType?: string
  complexityScore?: number // 0-100
  zoningRisk?: 'LOW' | 'MEDIUM' | 'HIGH'
  submissionMethod?: 'SELF' | 'ASSISTED' | 'KEALEE_MANAGED'
  estimatedValuation?: number
}

export interface PricingOutput {
  finalPrice: number
  basePrice: number
  adjustments: PricingAdjustment[]
  pricingExplanation: string
  checkoutDisplayLabel: string
  currency: string
}

export interface PricingAdjustment {
  label: string
  amount: number
  percentage: number
  reason: string
}

// ============================================================================
// 2023 CTC BASE COSTS + 13% INFLATION (APRIL 2026)
// ============================================================================

const CTC_INFLATION_FACTOR = 1.13 // 2023 to 2026 inflation

// Concept service base prices (2023 CTC, inflated)
const CONCEPT_BASE_PRICES_2023 = {
  basic: 295 * CTC_INFLATION_FACTOR,       // Project Concept + Validation
  advanced: 695 * CTC_INFLATION_FACTOR,    // Advanced AI Concept
  full: 1495 * CTC_INFLATION_FACTOR,       // Full Design Package
}

// Estimation service base prices (2023 CTC, inflated)
const ESTIMATION_BASE_PRICES_2023 = {
  detailed: 595 * CTC_INFLATION_FACTOR,    // Detailed Estimate
  certified: 1850 * CTC_INFLATION_FACTOR,  // Certified Estimate
  bundle: 1100 * CTC_INFLATION_FACTOR,     // Bundle (Concept + Estimation)
}

// Permits service base prices (2023 CTC, inflated)
const PERMITS_BASE_PRICES_2023 = {
  document_assembly: 495 * CTC_INFLATION_FACTOR,      // Document Assembly
  submission: 795 * CTC_INFLATION_FACTOR,             // Submission
  tracking: 1495 * CTC_INFLATION_FACTOR,              // Tracking
  inspection_coordination: 2495 * CTC_INFLATION_FACTOR, // Inspection Coordination
}

// Zoning service base prices (2023 CTC, inflated)
const ZONING_BASE_PRICES_2023 = {
  research: 195 * CTC_INFLATION_FACTOR,        // Research
  feasibility: 495 * CTC_INFLATION_FACTOR,     // Feasibility Assessment
  entitlement_path: 995 * CTC_INFLATION_FACTOR, // Entitlement Path Analysis
  consulting: 1995 * CTC_INFLATION_FACTOR,      // Consulting
}

// ============================================================================
// JURISDICTION MULTIPLIERS
// ============================================================================

const JURISDICTION_MULTIPLIERS: Record<string, number> = {
  // DMV Area
  'Washington, DC': 1.25,
  'Arlington, VA': 1.18,
  'Alexandria, VA': 1.15,
  'Fairfax, VA': 1.12,
  'Falls Church, VA': 1.20,
  'Montgomery County, MD': 1.14,
  'Prince George\'s County, MD': 1.08,

  // Default for other jurisdictions
  'DEFAULT': 1.0,
}

// ============================================================================
// COMPLEXITY ADJUSTMENTS
// ============================================================================

function getComplexityMultiplier(complexityScore?: number): number {
  if (!complexityScore) return 1.0

  if (complexityScore < 20) return 0.9
  if (complexityScore < 40) return 1.0
  if (complexityScore < 60) return 1.15
  if (complexityScore < 80) return 1.35
  return 1.6
}

// ============================================================================
// ZONING RISK ADJUSTMENTS
// ============================================================================

function getZoningRiskAdjustment(zoningRisk?: string): number {
  switch (zoningRisk) {
    case 'LOW':
      return 0
    case 'MEDIUM':
      return 0.1 // 10% increase
    case 'HIGH':
      return 0.25 // 25% increase
    default:
      return 0
  }
}

// ============================================================================
// SUBMISSION METHOD ADJUSTMENTS (PERMITS ONLY)
// ============================================================================

function getSubmissionMethodMultiplier(submissionMethod?: string): number {
  switch (submissionMethod) {
    case 'SELF':
      return 0.8 // 20% discount
    case 'ASSISTED':
      return 1.0 // Base price
    case 'KEALEE_MANAGED':
      return 1.45 // 45% markup for managed service
    default:
      return 1.0
  }
}

// ============================================================================
// VALUATION-BASED ADJUSTMENTS (PERMITS ONLY)
// ============================================================================

function getValuationAdjustment(estimatedValuation?: number): number {
  if (!estimatedValuation) return 0

  if (estimatedValuation < 50000) return -0.05 // Small projects: -5%
  if (estimatedValuation < 250000) return 0 // Standard
  if (estimatedValuation < 500000) return 0.1 // -10% markup
  if (estimatedValuation < 1000000) return 0.2 // +20% markup
  return 0.35 // Large projects: +35% markup
}

// ============================================================================
// PRICING SERVICE
// ============================================================================

class PricingEngineService {
  /**
   * Calculate final pricing for a service
   */
  calculateFinalPrice(input: PricingInput): PricingOutput {
    let basePrice = 0
    const adjustments: PricingAdjustment[] = []

    // Step 1: Get base price
    switch (input.serviceType) {
      case 'concept':
        basePrice = this.getConceptBasePrice(input.tier)
        break
      case 'estimation':
        basePrice = this.getEstimationBasePrice(input.tier)
        break
      case 'permits':
        basePrice = this.getPermitsBasePrice(input.tier)
        break
    }

    let finalPrice = basePrice

    // Step 2: Apply jurisdiction multiplier
    if (input.jurisdiction) {
      const jurisdictionMultiplier = JURISDICTION_MULTIPLIERS[input.jurisdiction] || JURISDICTION_MULTIPLIERS['DEFAULT']
      if (jurisdictionMultiplier !== 1.0) {
        const jurisdictionAdjustment = basePrice * (jurisdictionMultiplier - 1)
        adjustments.push({
          label: 'Jurisdiction Complexity',
          amount: jurisdictionAdjustment,
          percentage: (jurisdictionMultiplier - 1) * 100,
          reason: `Adjusted for ${input.jurisdiction}`,
        })
        finalPrice *= jurisdictionMultiplier
      }
    }

    // Step 3: Apply complexity adjustment
    if (input.serviceType === 'estimation' || input.serviceType === 'permits') {
      const complexityMultiplier = getComplexityMultiplier(input.complexityScore)
      if (complexityMultiplier !== 1.0) {
        const complexityAdjustment = finalPrice * (complexityMultiplier - 1)
        adjustments.push({
          label: 'Project Complexity',
          amount: complexityAdjustment,
          percentage: (complexityMultiplier - 1) * 100,
          reason: `Complexity score: ${input.complexityScore}`,
        })
        finalPrice *= complexityMultiplier
      }
    }

    // Step 4: Apply zoning risk adjustment
    const zoningRiskAdjustment = getZoningRiskAdjustment(input.zoningRisk)
    if (zoningRiskAdjustment > 0) {
      const zoningAmount = finalPrice * zoningRiskAdjustment
      adjustments.push({
        label: 'Zoning Risk Factor',
        amount: zoningAmount,
        percentage: zoningRiskAdjustment * 100,
        reason: `${input.zoningRisk} zoning risk detected`,
      })
      finalPrice *= 1 + zoningRiskAdjustment
    }

    // Step 5: Apply submission method multiplier (permits only)
    if (input.serviceType === 'permits') {
      const submissionMultiplier = getSubmissionMethodMultiplier(input.submissionMethod)
      if (submissionMultiplier !== 1.0) {
        const submissionAdjustment = finalPrice * (submissionMultiplier - 1)
        adjustments.push({
          label: 'Submission Method',
          amount: submissionAdjustment,
          percentage: (submissionMultiplier - 1) * 100,
          reason: `${input.submissionMethod || 'ASSISTED'} submission`,
        })
        finalPrice *= submissionMultiplier
      }
    }

    // Step 6: Apply valuation adjustment (permits only)
    if (input.serviceType === 'permits' && input.estimatedValuation) {
      const valuationAdjustment = getValuationAdjustment(input.estimatedValuation)
      if (valuationAdjustment !== 0) {
        const valuationAmount = finalPrice * valuationAdjustment
        adjustments.push({
          label: 'Project Valuation',
          amount: valuationAmount,
          percentage: valuationAdjustment * 100,
          reason: `Project estimated at $${input.estimatedValuation.toLocaleString()}`,
        })
        finalPrice *= 1 + valuationAdjustment
      }
    }

    // Round to nearest cent
    finalPrice = Math.round(finalPrice * 100) / 100
    basePrice = Math.round(basePrice * 100) / 100

    const pricingExplanation = this.generatePricingExplanation(input, adjustments)
    const checkoutDisplayLabel = this.generateCheckoutLabel(input, finalPrice)

    return {
      finalPrice,
      basePrice,
      adjustments,
      pricingExplanation,
      checkoutDisplayLabel,
      currency: 'USD',
    }
  }

  /**
   * Get base price for concept service
   */
  private getConceptBasePrice(tier: string): number {
    const tierMap: Record<string, number> = {
      'concept_basic': CONCEPT_BASE_PRICES_2023.basic,
      'concept_advanced': CONCEPT_BASE_PRICES_2023.advanced,
      'concept_full': CONCEPT_BASE_PRICES_2023.full,
    }
    return tierMap[tier] || CONCEPT_BASE_PRICES_2023.basic
  }

  /**
   * Get base price for estimation service
   */
  private getEstimationBasePrice(tier: string): number {
    const tierMap: Record<string, number> = {
      'detailed_estimate': ESTIMATION_BASE_PRICES_2023.detailed,
      'certified_estimate': ESTIMATION_BASE_PRICES_2023.certified,
      'estimation_bundle': ESTIMATION_BASE_PRICES_2023.bundle,
    }
    return tierMap[tier] || ESTIMATION_BASE_PRICES_2023.detailed
  }

  /**
   * Get base price for permits service
   */
  private getPermitsBasePrice(tier: string): number {
    const tierMap: Record<string, number> = {
      'document_assembly': PERMITS_BASE_PRICES_2023.document_assembly,
      'submission': PERMITS_BASE_PRICES_2023.submission,
      'tracking': PERMITS_BASE_PRICES_2023.tracking,
      'inspection_coordination': PERMITS_BASE_PRICES_2023.inspection_coordination,
    }
    return tierMap[tier] || PERMITS_BASE_PRICES_2023.submission
  }

  /**
   * Generate human-readable pricing explanation
   */
  private generatePricingExplanation(input: PricingInput, adjustments: PricingAdjustment[]): string {
    let explanation = `${input.serviceType.charAt(0).toUpperCase() + input.serviceType.slice(1)} service pricing for ${input.tier}.`

    if (adjustments.length > 0) {
      explanation += ` Adjusted for: ${adjustments.map(a => a.reason).join(', ')}.`
    }

    explanation += ' Final pricing determined at checkout based on project details.'

    return explanation
  }

  /**
   * Generate checkout display label
   */
  private generateCheckoutLabel(input: PricingInput, finalPrice: number): string {
    return `${input.serviceType.charAt(0).toUpperCase() + input.serviceType.slice(1)} Service - ${input.tier} (${finalPrice > 0 ? `$${finalPrice.toFixed(2)}` : 'Free'})`
  }

  /**
   * Get pricing landing page copy (starting prices)
   */
  getServiceStartingPrices(serviceType: 'concept' | 'estimation' | 'permits' | 'zoning') {
    let basePrices: Record<string, number>
    let description: string

    switch (serviceType) {
      case 'concept':
        basePrices = CONCEPT_BASE_PRICES_2023
        description = 'Final pricing based on project complexity and service depth'
        break
      case 'estimation':
        basePrices = ESTIMATION_BASE_PRICES_2023
        description = 'Final pricing based on scope, complexity, and project details'
        break
      case 'permits':
        basePrices = PERMITS_BASE_PRICES_2023
        description = 'Final pricing based on jurisdiction, scope, and submission type'
        break
      case 'zoning':
        basePrices = ZONING_BASE_PRICES_2023
        description = 'Final pricing based on analysis depth and jurisdiction complexity'
        break
    }

    const startingPrice = Math.min(...Object.values(basePrices))

    return {
      serviceType,
      startingPrice: Math.round(startingPrice * 100) / 100,
      startingPriceCopy: `Starting at $${(Math.round(startingPrice * 100) / 100).toFixed(2)}`,
      description,
      basePrices: Object.entries(basePrices).reduce(
        (acc, [key, value]) => {
          acc[key] = Math.round(value * 100) / 100
          return acc
        },
        {} as Record<string, number>
      ),
    }
  }
}

export const pricingEngine = new PricingEngineService()
