/**
 * Pure v30 pricing configuration shared by persistence and the agent runtime.
 *
 * Keep this module free of Prisma/runtime imports. It is exported as a package
 * subpath so higher-level packages can use the pricing contract without
 * creating a database -> agent-stack -> estimating -> database build cycle.
 */

export type V30PricingComplexity = 'simple' | 'moderate' | 'complex'

export type V30PricingFloorplanScope =
  | 'room'
  | 'kitchen'
  | 'bath'
  | 'addition'
  | 'whole_house'
  | 'garden_landscape'
  | 'exterior'

export interface V30PricingFormulaConfig {
  baseAmount: number
  sqftMultiplier: number
  complexityFees: Record<V30PricingComplexity, number>
  featureCosts: Record<string, number>
  floorplanScopeCosts?: Partial<Record<V30PricingFloorplanScope, number>>
  urgencyMultiplier: number
  locationMultiplier: number
  minPrice: number
  maxPrice: number
}

export interface V30PricingFormulaRow {
  baseAmount?: number | string
  sqftMultiplier?: number | string
  complexityFees?: Record<string, number>
  featureCosts?: Record<string, number>
  floorplanScopeCosts?: Partial<Record<V30PricingFloorplanScope, number>>
  urgencyMultiplier?: number | string
  locationMultiplier?: number | string
  minPrice?: number | string
  maxPrice?: number | string
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

function finiteNumber(value: unknown, fallback: number): number {
  const parsed =
    typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN
  return Number.isFinite(parsed) ? parsed : fallback
}

export function resolveV30PricingFormula(
  row?: V30PricingFormulaRow | null,
): V30PricingFormulaConfig {
  if (!row) return { ...DEFAULT_V30_PRICING_FORMULA }

  const complexityFees: Record<V30PricingComplexity, number> = {
    simple: row.complexityFees?.simple ?? 0,
    moderate: row.complexityFees?.moderate ?? 200,
    complex: row.complexityFees?.complex ?? 500,
  }

  return {
    baseAmount: finiteNumber(row.baseAmount, DEFAULT_V30_PRICING_FORMULA.baseAmount),
    sqftMultiplier: finiteNumber(
      row.sqftMultiplier,
      DEFAULT_V30_PRICING_FORMULA.sqftMultiplier,
    ),
    complexityFees,
    featureCosts: {
      ...DEFAULT_V30_PRICING_FORMULA.featureCosts,
      ...(row.featureCosts ?? {}),
    },
    floorplanScopeCosts: {
      ...DEFAULT_V30_PRICING_FORMULA.floorplanScopeCosts,
      ...(row.floorplanScopeCosts ?? {}),
    },
    urgencyMultiplier: finiteNumber(row.urgencyMultiplier, 1),
    locationMultiplier: finiteNumber(row.locationMultiplier, 1),
    minPrice: finiteNumber(row.minPrice, DEFAULT_V30_PRICING_FORMULA.minPrice),
    maxPrice: finiteNumber(row.maxPrice, DEFAULT_V30_PRICING_FORMULA.maxPrice),
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
