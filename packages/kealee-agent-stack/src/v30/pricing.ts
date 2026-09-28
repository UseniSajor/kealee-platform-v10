/**
 * v30 dynamic pricing — live formula in `v30_pricing_formulas` (portal-admin PATCH).
 * Quotes read the active row at request time; no redeploy required to change AI package prices.
 * Tier card prices on /concept/confirm may still use @kealee/core-rules until fully on v30 checkout.
 */

import { calculateFloorplanAddon } from './floorplan-pricing'
import type { V30Complexity, V30IntakeFormAnswers } from './types'
import {
  DEFAULT_V30_PRICING_FORMULA,
  type V30PricingFormulaConfig,
} from '@kealee/database/v30-pricing-config'

export {
  DEFAULT_V30_PRICING_FORMULA,
  type V30PricingFormulaConfig,
} from '@kealee/database/v30-pricing-config'

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
