import { prisma } from './client'
import {
  DEFAULT_V30_PRICING_FORMULA,
  resolveV30PricingFormula,
  v30PricingFormulaToRow,
  type V30PricingFormulaConfig,
  type V30PricingFormulaRow,
} from '@kealee/kealee-agent-stack'

function rowToConfig(row: {
  baseAmount: unknown
  sqftMultiplier: unknown
  complexityFees: unknown
  featureCosts: unknown
  urgencyMultiplier: unknown
  locationMultiplier: unknown
  minPrice: unknown
  maxPrice: unknown
}): V30PricingFormulaConfig {
  const featureCosts = (row.featureCosts ?? {}) as Record<string, unknown>
  const dbRow: V30PricingFormulaRow = {
    baseAmount: Number(row.baseAmount),
    sqftMultiplier: Number(row.sqftMultiplier),
    complexityFees: row.complexityFees as Record<string, number>,
    featureCosts: featureCosts as Record<string, number>,
    floorplanScopeCosts:
      typeof featureCosts.floorplanScopeCosts === 'object'
        ? (featureCosts.floorplanScopeCosts as V30PricingFormulaRow['floorplanScopeCosts'])
        : undefined,
    urgencyMultiplier: Number(row.urgencyMultiplier),
    locationMultiplier: Number(row.locationMultiplier),
    minPrice: Number(row.minPrice),
    maxPrice: Number(row.maxPrice),
  }
  return resolveV30PricingFormula(dbRow)
}

/** Active v30 formula from DB — used by API, os-intake, and quotes (real-time). */
export async function getActiveV30PricingFormula(): Promise<{
  config: V30PricingFormulaConfig
  source: 'database' | 'code_default'
  version?: number
  updatedAt?: string
}> {
  const row = await prisma.v30PricingFormula
    .findFirst({ where: { active: true }, orderBy: { updatedAt: 'desc' } })
    .catch(() => null)

  if (!row) {
    return { config: { ...DEFAULT_V30_PRICING_FORMULA }, source: 'code_default' }
  }

  return {
    config: rowToConfig(row),
    source: 'database',
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function upsertActiveV30PricingFormula(
  patch: Partial<V30PricingFormulaRow>,
): Promise<{ config: V30PricingFormulaConfig; version: number }> {
  const current = await getActiveV30PricingFormula()
  const merged = resolveV30PricingFormula({
    ...v30PricingFormulaToRow(current.config),
    ...patch,
  })
  const payload = v30PricingFormulaToRow(merged)
  const featureCosts = {
    ...payload.featureCosts,
    floorplanScopeCosts: payload.floorplanScopeCosts,
  }

  const baseAmount = Number(payload.baseAmount ?? 99)
  const sqftMultiplier = Number(payload.sqftMultiplier ?? 0.05)
  const urgencyMultiplier = Number(payload.urgencyMultiplier ?? 1)
  const locationMultiplier = Number(payload.locationMultiplier ?? 1)
  const minPrice = Number(payload.minPrice ?? 99)
  const maxPrice = Number(payload.maxPrice ?? 9999)

  const existing = await prisma.v30PricingFormula.findFirst({
    where: { active: true },
    orderBy: { updatedAt: 'desc' },
  })

  if (existing) {
    const updated = await prisma.v30PricingFormula.update({
      where: { id: existing.id },
      data: {
        baseAmount,
        sqftMultiplier,
        complexityFees: payload.complexityFees ?? {},
        featureCosts,
        urgencyMultiplier,
        locationMultiplier,
        minPrice,
        maxPrice,
        version: { increment: 1 },
      },
    })
    return { config: merged, version: updated.version }
  }

  const created = await prisma.v30PricingFormula.create({
    data: {
      baseAmount,
      sqftMultiplier,
      complexityFees: payload.complexityFees ?? {},
      featureCosts,
      urgencyMultiplier,
      locationMultiplier,
      minPrice,
      maxPrice,
      active: true,
    },
  })
  return { config: merged, version: created.version }
}
