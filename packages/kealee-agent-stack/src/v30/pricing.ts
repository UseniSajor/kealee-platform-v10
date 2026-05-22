/**
 * v30 dynamic pricing — formula from KEALEE-v30-COMPLETE-MASTER-SPEC.md
 * Dollar amounts are computed; tier display prices still come from @kealee/core-rules at checkout.
 */

import type { V30Complexity, V30IntakeFormAnswers } from './types'

export interface V30PricingFormulaConfig {
  baseAmount: number
  sqftMultiplier: number
  complexityFees: Record<V30Complexity, number>
  featureCosts: Record<string, number>
  urgencyMultiplier: number
  locationMultiplier: number
  minPrice: number
  maxPrice: number
}

export const DEFAULT_V30_PRICING_FORMULA: V30PricingFormulaConfig = {
  baseAmount: 99,
  sqftMultiplier: 0.05,
  complexityFees: { simple: 0, moderate: 200, complex: 500 },
  featureCosts: {
    Design: 150,
    Floorplan: 100,
    Estimate: 200,
    Permits: 250,
    Videos: 400,
    Support: 50,
  },
  urgencyMultiplier: 1,
  locationMultiplier: 1,
  minPrice: 99,
  maxPrice: 9999,
}

function urgencyFromTimeline(timeline: string): number {
  const t = timeline.toLowerCase()
  if (t.includes('asap') || t.includes('urgent')) return 1.35
  if (t.includes('flex')) return 0.9
  return 1
}

function inferComplexity(answers: V30IntakeFormAnswers): V30Complexity {
  const scope = answers.primaryScope.toLowerCase()
  const sqft = answers.squareFeet
  if (scope.includes('whole') || scope.includes('new') || sqft > 3500) return 'complex'
  if (scope.includes('addition') || scope.includes('commercial') || sqft > 1800) return 'moderate'
  return 'simple'
}

export function calculateV30BasePrice(
  answers: V30IntakeFormAnswers,
  formula: V30PricingFormulaConfig = DEFAULT_V30_PRICING_FORMULA,
): { total: number; complexity: V30Complexity; breakdown: Record<string, number> } {
  const complexity = inferComplexity(answers)
  const urgency = urgencyFromTimeline(answers.timeline)
  const sqftComponent = answers.squareFeet * formula.sqftMultiplier
  const complexityFee = formula.complexityFees[complexity]
  const subtotal =
    (formula.baseAmount + sqftComponent + complexityFee) *
    urgency *
    formula.locationMultiplier
  const total = Math.min(formula.maxPrice, Math.max(formula.minPrice, Math.round(subtotal)))
  return {
    total,
    complexity,
    breakdown: {
      baseAmount: formula.baseAmount,
      sqftComponent,
      complexityFee,
      urgencyMultiplier: urgency,
      locationMultiplier: formula.locationMultiplier,
    },
  }
}

export function calculateV30PackagePrice(
  basePrice: number,
  features: string[],
  formula: V30PricingFormulaConfig = DEFAULT_V30_PRICING_FORMULA,
): { featureAddons: number; totalPrice: number } {
  const featureAddons = features.reduce(
    (sum, f) => sum + (formula.featureCosts[f] ?? 0),
    0,
  )
  const totalPrice = Math.min(
    formula.maxPrice,
    Math.max(formula.minPrice, Math.round(basePrice + featureAddons)),
  )
  return { featureAddons, totalPrice }
}
