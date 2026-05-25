/**
 * v30 dynamic pricing — live formula in `v30_pricing_formulas` (portal-admin PATCH).
 * Quotes read the active row at request time; no redeploy required to change AI package prices.
 * Tier card prices on /concept/confirm may still use @kealee/core-rules until fully on v30 checkout.
 */

import { calculateFloorplanAddon } from './floorplan-pricing'
import type { V30FloorplanScope } from './floorplan-pricing'
import type { V30Complexity, V30IntakeFormAnswers } from './types'

export interface V30PricingFormulaConfig {
  baseAmount: number
  sqftMultiplier: number
  complexityFees: Record<V30Complexity, number>
  featureCosts: Record<string, number>
  /** Per-scope floorplan add-ons (whole house scales with sqft in calculateFloorplanAddon). */
  floorplanScopeCosts?: Partial<Record<V30FloorplanScope, number>>
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
    CADExport: 149,
    Marketing: 85,
  },
  floorplanScopeCosts: {
    room: 80,
    kitchen: 140,
    bath: 100,
    addition: 220,
    whole_house: 280,
    garden_landscape: 175,
    exterior: 130,
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

export interface V30PackagePriceOptions {
  answers?: V30IntakeFormAnswers
  projectPath?: string
}

export function resolveFeatureAddon(
  feature: string,
  formula: V30PricingFormulaConfig,
  options?: V30PackagePriceOptions,
): number {
  if (feature === 'Floorplan' && options?.answers) {
    return calculateFloorplanAddon(options.answers, formula, options.projectPath).amount
  }
  return formula.featureCosts[feature] ?? 0
}

export function calculateV30PackagePrice(
  basePrice: number,
  features: string[],
  formula: V30PricingFormulaConfig = DEFAULT_V30_PRICING_FORMULA,
  options?: V30PackagePriceOptions,
): {
  featureAddons: number
  totalPrice: number
  featureBreakdown: Record<string, number>
} {
  const featureBreakdown: Record<string, number> = {}
  const featureAddons = features.reduce((sum, f) => {
    const addon = resolveFeatureAddon(f, formula, options)
    featureBreakdown[f] = addon
    return sum + addon
  }, 0)
  const totalPrice = Math.min(
    formula.maxPrice,
    Math.max(formula.minPrice, Math.round(basePrice + featureAddons)),
  )
  return { featureAddons, totalPrice, featureBreakdown }
}
