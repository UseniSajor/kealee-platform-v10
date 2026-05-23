import {
  DEFAULT_V30_PRICING_FORMULA,
  type V30PricingFormulaConfig,
} from './pricing'
import type { V30Complexity } from './types'
import type { V30FloorplanScope } from './floorplan-pricing'

/** DB row shape (`v30_pricing_formulas`) or API JSON. */
export interface V30PricingFormulaRow {
  baseAmount?: number | string
  sqftMultiplier?: number | string
  complexityFees?: Record<string, number>
  featureCosts?: Record<string, number>
  floorplanScopeCosts?: Partial<Record<V30FloorplanScope, number>>
  urgencyMultiplier?: number | string
  locationMultiplier?: number | string
  minPrice?: number | string
  maxPrice?: number | string
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : fallback
}

/**
 * Normalize DB / admin JSON → runtime formula.
 * Portal-admin PATCH updates `v30_pricing_formulas`; next quote uses this config (no redeploy).
 */
export function resolveV30PricingFormula(
  row?: V30PricingFormulaRow | null,
): V30PricingFormulaConfig {
  if (!row) return { ...DEFAULT_V30_PRICING_FORMULA }

  const complexityFees = {
    simple: row.complexityFees?.simple ?? 0,
    moderate: row.complexityFees?.moderate ?? 200,
    complex: row.complexityFees?.complex ?? 500,
  } as Record<V30Complexity, number>

  return {
    baseAmount: num(row.baseAmount, DEFAULT_V30_PRICING_FORMULA.baseAmount),
    sqftMultiplier: num(row.sqftMultiplier, DEFAULT_V30_PRICING_FORMULA.sqftMultiplier),
    complexityFees,
    featureCosts: {
      ...DEFAULT_V30_PRICING_FORMULA.featureCosts,
      ...(row.featureCosts ?? {}),
    },
    floorplanScopeCosts: {
      ...DEFAULT_V30_PRICING_FORMULA.floorplanScopeCosts,
      ...(row.floorplanScopeCosts ?? {}),
    },
    urgencyMultiplier: num(row.urgencyMultiplier, 1),
    locationMultiplier: num(row.locationMultiplier, 1),
    minPrice: num(row.minPrice, DEFAULT_V30_PRICING_FORMULA.minPrice),
    maxPrice: num(row.maxPrice, DEFAULT_V30_PRICING_FORMULA.maxPrice),
  }
}

export function v30PricingFormulaToRow(
  config: V30PricingFormulaConfig,
): V30PricingFormulaRow {
  return {
    baseAmount: config.baseAmount,
    sqftMultiplier: config.sqftMultiplier,
    complexityFees: config.complexityFees,
    featureCosts: config.featureCosts,
    floorplanScopeCosts: config.floorplanScopeCosts,
    urgencyMultiplier: config.urgencyMultiplier,
    locationMultiplier: config.locationMultiplier,
    minPrice: config.minPrice,
    maxPrice: config.maxPrice,
  }
}
