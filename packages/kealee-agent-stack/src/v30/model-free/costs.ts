/**
 * Construction cost, computed — no model.
 *
 * Every figure is a unit cost from the platform's own assembly library
 * (`@kealee/estimating` MARKETPLACE_ASSEMBLIES: DC–Baltimore corridor,
 * material + labor, low / mid / high) times a quantity derived from the
 * intake's square footage, times the library's own regional multiplier.
 *
 * The recipes below name ONLY codes that exist in that library, checked by
 * test. (`PROJECT_TYPE_ASSEMBLIES` in the same package references codes that
 * mostly do not exist — kitchen 5 of 15, siding 0 of 8 — so it is not used.)
 *
 * A project the recipes do not cover is not priced: the caller gets `null`
 * and says so, rather than a number that looks like an estimate.
 */

import { MARKETPLACE_ASSEMBLIES } from '@kealee/estimating'

type MarketplaceAssembly = (typeof MARKETPLACE_ASSEMBLIES)[number]

export type CostTier = 'BUDGET' | 'BALANCED' | 'PREMIUM'

/** Quantity from the project's square feet. */
type Qty = (sqft: number) => number

interface RecipeLine {
  /** Assembly code per tier; one code for all tiers when a string. */
  code: string | Record<CostTier, string>
  qty: Qty
  /** Trade bucket for the by-trade breakdown. */
  trade: string
}

export interface CostRecipe {
  family: string
  label: string
  /** Square feet assumed when the intake gives none. */
  defaultSqft: number
  lines: RecipeLine[]
  /** What the library's assemblies leave out for this family, printed with every estimate. */
  caution?: string
}

const each = (n: number): Qty => () => n
const perSqft = (k: number): Qty => sqft => Math.round(sqft * k)
/** Linear feet of wall-run cabinetry for a kitchen of `sqft` (≈ perimeter share). */
const kitchenRunLf: Qty = sqft => Math.max(10, Math.round(Math.sqrt(sqft) * 2.2))

export const COST_RECIPES: CostRecipe[] = [
  {
    family: 'kitchen', label: 'Kitchen remodel', defaultSqft: 150,
    lines: [
      { trade: 'Demolition', code: 'KIT-DEMO-FULL', qty: perSqft(1) },
      { trade: 'Cabinetry', code: { BUDGET: 'KIT-CAB-STD-BASE', BALANCED: 'KIT-CAB-PREM-BASE', PREMIUM: 'KIT-CAB-CUST-BASE' }, qty: kitchenRunLf },
      { trade: 'Cabinetry', code: { BUDGET: 'KIT-CAB-STD-WALL', BALANCED: 'KIT-CAB-PREM-WALL', PREMIUM: 'KIT-CAB-CUST-WALL' }, qty: sqft => Math.round(kitchenRunLf(sqft) * 0.8) },
      { trade: 'Countertops', code: { BUDGET: 'KIT-CT-LAMINATE', BALANCED: 'KIT-CT-QUARTZ', PREMIUM: 'KIT-CT-MARBLE' }, qty: sqft => Math.round(kitchenRunLf(sqft) * 2.1) },
      { trade: 'Backsplash', code: { BUDGET: 'KIT-BS-SUBWAY', BALANCED: 'KIT-BS-MOSAIC', PREMIUM: 'KIT-BS-STONE' }, qty: sqft => Math.round(kitchenRunLf(sqft) * 1.5) },
      { trade: 'Appliances', code: { BUDGET: 'KIT-APPL-STD', BALANCED: 'KIT-APPL-PREM', PREMIUM: 'KIT-APPL-LUX' }, qty: each(1) },
      { trade: 'Plumbing', code: 'KIT-PLUMB-ROUGH', qty: each(1) },
      { trade: 'Plumbing', code: 'KIT-PLUMB-FINISH', qty: each(1) },
      { trade: 'Plumbing', code: { BUDGET: 'KIT-SINK-STD', BALANCED: 'KIT-SINK-UNDER', PREMIUM: 'KIT-SINK-FARM' }, qty: each(1) },
      { trade: 'Plumbing', code: { BUDGET: 'KIT-FAUC-STD', BALANCED: 'KIT-FAUC-PREM', PREMIUM: 'KIT-FAUC-PREM' }, qty: each(1) },
      { trade: 'Electrical', code: 'KIT-ELEC-ROUGH', qty: each(1) },
      { trade: 'Electrical', code: 'KIT-ELEC-FINISH', qty: each(1) },
      { trade: 'Lighting', code: 'KIT-LT-RECESS', qty: sqft => Math.max(4, Math.round(sqft / 25)) },
      { trade: 'Flooring', code: { BUDGET: 'KIT-FLR-LVP', BALANCED: 'KIT-FLR-TILE', PREMIUM: 'KIT-FLR-HARDWOOD' }, qty: perSqft(1) },
      { trade: 'Paint', code: 'KIT-PAINT-WALLS', qty: perSqft(2.5) },
      { trade: 'General conditions', code: 'GEN-DUMP-20', qty: each(1) },
      { trade: 'General conditions', code: 'GEN-CLEANUP-FINAL', qty: perSqft(1) },
      { trade: 'Permits', code: 'GEN-PERMIT-RES', qty: each(1) },
    ],
  },
  {
    family: 'bath', label: 'Bathroom remodel', defaultSqft: 60,
    lines: [
      { trade: 'Demolition', code: 'BATH-DEMO-FULL', qty: each(1) },
      { trade: 'Tile', code: { BUDGET: 'BATH-TILE-FLR-CER', BALANCED: 'BATH-TILE-FLR-PORC', PREMIUM: 'BATH-TILE-FLR-STONE' }, qty: perSqft(1) },
      { trade: 'Tile', code: { BUDGET: 'BATH-TILE-WALL-CER', BALANCED: 'BATH-TILE-WALL-PORC', PREMIUM: 'BATH-TILE-WALL-STONE' }, qty: perSqft(1.6) },
      { trade: 'Waterproofing', code: 'BATH-WP-MEMBRANE', qty: perSqft(1) },
      { trade: 'Vanity', code: { BUDGET: 'BATH-VAN-STD', BALANCED: 'BATH-VAN-FLOAT', PREMIUM: 'BATH-VAN-CUSTOM' }, qty: each(1) },
      { trade: 'Fixtures', code: { BUDGET: 'BATH-TOIL-STD', BALANCED: 'BATH-TOIL-LOFLOW', PREMIUM: 'BATH-TOIL-WALLHUNG' }, qty: each(1) },
      { trade: 'Fixtures', code: { BUDGET: 'BATH-SHWR-STD', BALANCED: 'BATH-SHWR-CUST', PREMIUM: 'BATH-SHWR-CUST' }, qty: each(1) },
      { trade: 'Fixtures', code: { BUDGET: 'BATH-FAUCET-STD', BALANCED: 'BATH-FAUCET-STD', PREMIUM: 'BATH-FAUCET-WALL' }, qty: each(1) },
      { trade: 'Plumbing', code: 'BATH-PLUMB-ROUGH', qty: each(1) },
      { trade: 'Plumbing', code: 'BATH-PLUMB-FINISH', qty: each(1) },
      { trade: 'Electrical', code: 'BATH-ELEC-ROUGH', qty: each(1) },
      { trade: 'Electrical', code: 'BATH-ELEC-FINISH', qty: each(1) },
      { trade: 'Ventilation', code: 'BATH-VENT-STD', qty: each(1) },
      { trade: 'Accessories', code: 'BATH-MIRROR-STD', qty: each(1) },
      { trade: 'Accessories', code: 'BATH-ACC-SET', qty: each(1) },
      { trade: 'Paint', code: 'BATH-PAINT', qty: perSqft(2) },
      { trade: 'General conditions', code: 'GEN-DUMP-10', qty: each(1) },
      { trade: 'Permits', code: 'GEN-PERMIT-RES', qty: each(1) },
    ],
  },
  {
    family: 'basement', label: 'Basement finishing', defaultSqft: 800,
    lines: [
      { trade: 'Framing', code: 'BASE-FRAME-WALL', qty: sqft => Math.round(Math.sqrt(sqft) * 4) },
      { trade: 'Insulation', code: 'BASE-INSUL-WALL', qty: perSqft(0.9) },
      { trade: 'Drywall', code: 'BASE-DRY-WALL', qty: perSqft(0.9) },
      { trade: 'Ceiling', code: { BUDGET: 'BASE-CEIL-DROP', BALANCED: 'BASE-CEIL-DRY', PREMIUM: 'BASE-CEIL-DRY' }, qty: perSqft(1) },
      { trade: 'Flooring', code: { BUDGET: 'BASE-FLR-CARPET', BALANCED: 'BASE-FLR-LVP', PREMIUM: 'BASE-FLR-TILE' }, qty: perSqft(1) },
      { trade: 'Electrical', code: 'BASE-ELEC', qty: sqft => Math.max(6, Math.round(sqft / 60)) },
      { trade: 'Paint', code: 'BASE-PAINT', qty: perSqft(1.8) },
      { trade: 'Trim & doors', code: 'BASE-TRIM', qty: sqft => Math.round(Math.sqrt(sqft) * 4) },
      { trade: 'Trim & doors', code: 'BASE-DOOR-INT', qty: sqft => Math.max(2, Math.round(sqft / 300)) },
      { trade: 'Egress', code: 'BASE-EGRESS', qty: each(1) },
      { trade: 'HVAC', code: 'BASE-HVAC-EXT', qty: each(1) },
      { trade: 'General conditions', code: 'GEN-PM-WEEKLY', qty: sqft => Math.max(6, Math.round(sqft / 100)) },
      { trade: 'General conditions', code: 'GEN-DUMP-20', qty: each(1) },
      { trade: 'General conditions', code: 'GEN-CLEANUP-FINAL', qty: perSqft(1) },
      { trade: 'Permits', code: 'GEN-PERMIT-RES', qty: each(1) },
    ],
  },
  {
    family: 'addition', label: 'Home addition', defaultSqft: 400,
    caution: 'The assembly library prices addition framing, finishes and systems at allowance level and excludes excavation, utility extensions and structural work beyond a basic engineering allowance. Treat this as a floor; staff review is recommended before it is quoted.',
    lines: [
      { trade: 'Foundation', code: 'ADD-FOUND-SLAB', qty: perSqft(1) },
      { trade: 'Framing', code: 'ADD-FRAME-WALL', qty: perSqft(1) },
      { trade: 'Framing', code: 'ADD-FRAME-ROOF', qty: perSqft(1.15) },
      { trade: 'Roofing', code: 'ADD-ROOF', qty: sqft => Math.max(1, Math.round(sqft * 1.15 / 100)) },
      { trade: 'Windows & doors', code: 'ADD-WINDOW', qty: sqft => Math.max(2, Math.round(sqft / 100)) },
      { trade: 'Windows & doors', code: 'ADD-DOOR-EXT', qty: each(1) },
      { trade: 'Exterior', code: 'ADD-SIDING', qty: sqft => Math.round(Math.sqrt(sqft) * 3 * 9) },
      { trade: 'Insulation', code: 'ADD-INSUL', qty: perSqft(2) },
      { trade: 'Drywall', code: 'ADD-DRYWALL', qty: perSqft(3.2) },
      { trade: 'Electrical', code: 'ADD-ELEC', qty: each(1) },
      { trade: 'HVAC', code: 'ADD-HVAC', qty: each(1) },
      { trade: 'Flooring', code: 'ADD-FLR', qty: perSqft(1) },
      { trade: 'Paint', code: 'ADD-PAINT', qty: perSqft(3.2) },
      { trade: 'Trim', code: 'ADD-TRIM', qty: sqft => Math.round(Math.sqrt(sqft) * 4) },
      { trade: 'Tie-in', code: 'ADD-TIE-IN', qty: each(1) },
      { trade: 'Roofing', code: 'ROOF-GUTT-ALU', qty: sqft => Math.round(Math.sqrt(sqft) * 2) },
      { trade: 'Engineering', code: 'GEN-ENGINEER', qty: each(1) },
      // General conditions — the addition assemblies carry none: supervision
      // for the build duration, waste, sanitation, temporary power, final clean.
      { trade: 'General conditions', code: 'GEN-PM-WEEKLY', qty: sqft => Math.max(8, Math.round(sqft / 30)) },
      { trade: 'General conditions', code: 'GEN-DUMP-30', qty: sqft => Math.max(1, Math.round(sqft / 250)) },
      { trade: 'General conditions', code: 'GEN-PORT-TOILET', qty: sqft => Math.max(2, Math.round(sqft / 120)) },
      { trade: 'General conditions', code: 'GEN-TEMP-POWER', qty: each(1) },
      { trade: 'General conditions', code: 'GEN-CLEANUP-FINAL', qty: perSqft(1) },
      { trade: 'Permits', code: 'GEN-PERMIT-RES', qty: each(1) },
    ],
  },
  {
    family: 'deck', label: 'Deck', defaultSqft: 300,
    lines: [
      { trade: 'Framing', code: 'DECK-FRAME-STD', qty: perSqft(1) },
      { trade: 'Decking', code: { BUDGET: 'DECK-SURF-PT', BALANCED: 'DECK-SURF-COMP', PREMIUM: 'DECK-SURF-PVC' }, qty: perSqft(1) },
      { trade: 'Railing', code: { BUDGET: 'DECK-RAIL-WOOD', BALANCED: 'DECK-RAIL-COMP', PREMIUM: 'DECK-RAIL-CABLE' }, qty: sqft => Math.round(Math.sqrt(sqft) * 3) },
      { trade: 'Footings', code: 'DECK-FOOTER-CONC', qty: sqft => Math.max(4, Math.round(sqft / 40)) },
      { trade: 'Posts', code: 'DECK-POST-6X6', qty: sqft => Math.max(4, Math.round(sqft / 40)) },
      { trade: 'Ledger', code: 'DECK-LEDGER', qty: sqft => Math.round(Math.sqrt(sqft)) },
      { trade: 'Stairs', code: 'DECK-STAIR', qty: each(1) },
      { trade: 'Permits', code: 'GEN-PERMIT-RES', qty: each(1) },
    ],
  },
  {
    family: 'landscape', label: 'Landscape', defaultSqft: 2000,
    lines: [
      { trade: 'Grading', code: 'LAND-GRADE-FINE', qty: perSqft(1) },
      { trade: 'Turf', code: { BUDGET: 'LAND-SEED', BALANCED: 'LAND-SOD', PREMIUM: 'LAND-SOD' }, qty: perSqft(0.6) },
      { trade: 'Beds', code: 'LAND-MULCH', qty: perSqft(0.25) },
      { trade: 'Plantings', code: 'LAND-PLANT-SHRUB', qty: sqft => Math.max(6, Math.round(sqft / 100)) },
      { trade: 'Plantings', code: 'LAND-PLANT-PERENNI', qty: sqft => Math.max(10, Math.round(sqft / 60)) },
      { trade: 'Plantings', code: 'LAND-PLANT-TREE-SM', qty: sqft => Math.max(1, Math.round(sqft / 800)) },
      { trade: 'Hardscape', code: 'LAND-PAVER-PATIO', qty: perSqft(0.1) },
      { trade: 'Edging', code: 'LAND-EDGE-ALUM', qty: sqft => Math.round(Math.sqrt(sqft) * 2) },
    ],
  },
  {
    family: 'flooring', label: 'Flooring', defaultSqft: 800,
    lines: [
      { trade: 'Demolition', code: 'FLR-DEMO-CARPET', qty: perSqft(1) },
      { trade: 'Flooring', code: { BUDGET: 'FLR-LVP', BALANCED: 'FLR-HDWD-ENG', PREMIUM: 'FLR-HDWD-SOLID' }, qty: perSqft(1.08) },
      { trade: 'Trim', code: 'FLR-BASE-STD', qty: sqft => Math.round(Math.sqrt(sqft) * 4) },
    ],
  },
  {
    family: 'painting', label: 'Interior painting', defaultSqft: 1500,
    lines: [
      { trade: 'Prep', code: 'PAINT-INT-PREP', qty: perSqft(2.8) },
      { trade: 'Paint', code: { BUDGET: 'PAINT-INT-WALL', BALANCED: 'PAINT-INT-WALL', PREMIUM: 'PAINT-INT-WALL-PREM' }, qty: perSqft(2.8) },
      { trade: 'Paint', code: 'PAINT-INT-CEIL', qty: perSqft(1) },
      { trade: 'Paint', code: 'PAINT-INT-TRIM', qty: sqft => Math.round(Math.sqrt(sqft) * 6) },
    ],
  },
]

const BY_CODE = new Map<string, MarketplaceAssembly>(MARKETPLACE_ASSEMBLIES.map(a => [a.code, a]))

/** Which recipe a project is, from the intake's scope text and project path. */
export function recipeFor(scopeText: string): CostRecipe | null {
  const s = scopeText.toLowerCase()
  const test = (re: RegExp) => re.test(s)
  const family =
    test(/kitchen/) ? 'kitchen'
      : test(/bath|powder|shower/) ? 'bath'
        : test(/basement|lower level/) ? 'basement'
          : test(/addition|adu|expan|bump.?out|sunroom/) ? 'addition'
            : test(/deck|porch/) ? 'deck'
              : test(/garden|landscap|yard|outdoor/) ? 'landscape'
                : test(/floor/) ? 'flooring'
                  : test(/paint/) ? 'painting'
                    : null
  return family ? COST_RECIPES.find(r => r.family === family) ?? null : null
}

/** The library's regional multiplier for the intake's location text; 1.0 (Baltimore) otherwise. */
export function regionFor(location: string): { key: string; multiplier: number } {
  const regions = MARKETPLACE_ASSEMBLIES[0]?.regionMultiplier ?? {}
  const l = location.toLowerCase()
  const hint: Array<[RegExp, string]> = [
    [/\b(dc|washington|district of columbia)\b/, 'DC'], [/bethesda|chevy chase|potomac/, 'Bethesda'],
    [/silver spring|takoma|wheaton/, 'Silver Spring'], [/rockville|gaithersburg|germantown/, 'Rockville'],
    [/annapolis|anne arundel|severna|arnold/, 'Annapolis'], [/columbia|ellicott|howard/, 'Columbia'],
    [/frederick|middletown|urbana/, 'Frederick'], [/towson/, 'Towson'],
    [/arlington|alexandria|fairfax|vienna|mclean|loudoun|prince william|\bva\b|virginia/, 'NoVA'],
  ]
  const hit = hint.find(([re]) => re.test(l))
  const key = hit?.[1] ?? 'Baltimore'
  return { key, multiplier: (regions as Record<string, number>)[key] ?? 1 }
}

export interface PricedLine {
  trade: string
  code: string
  name: string
  unit: string
  quantity: number
  unitCost: number
  total: number
}

export interface PricedEstimate {
  family: string
  label: string
  tier: CostTier
  sqft: number
  region: { key: string; multiplier: number }
  lines: PricedLine[]
  byTrade: Record<string, number>
  subtotal: number
  contingencyPct: number
  total: number
  costPerSqFt: number
  caution: string | null
  source: string
}

const COL: Record<CostTier, 'Low' | 'Mid' | 'High'> = { BUDGET: 'Low', BALANCED: 'Mid', PREMIUM: 'High' }

/** Prices a recipe at one tier. Throws if the recipe names a code the library lacks (a test guards this). */
export function priceRecipe(recipe: CostRecipe, tier: CostTier, sqftIn: number | null | undefined, location: string): PricedEstimate {
  const sqft = sqftIn && sqftIn > 0 ? sqftIn : recipe.defaultSqft
  const region = regionFor(location)
  const lines: PricedLine[] = []
  for (const l of recipe.lines) {
    const code = typeof l.code === 'string' ? l.code : l.code[tier]
    const a = BY_CODE.get(code)
    if (!a) throw new Error(`cost recipe ${recipe.family}: assembly ${code} is not in the library`)
    const quantity = Math.max(0, l.qty(sqft))
    if (!quantity) continue
    const col = COL[tier]
    const unitCost = (a[`materialCost${col}`] + a[`laborCost${col}`]) * region.multiplier
    lines.push({ trade: l.trade, code, name: a.name, unit: a.unit, quantity, unitCost: Math.round(unitCost * 100) / 100, total: Math.round(unitCost * quantity) })
  }
  const byTrade: Record<string, number> = {}
  for (const l of lines) byTrade[l.trade] = (byTrade[l.trade] ?? 0) + l.total
  const subtotal = lines.reduce((s, l) => s + l.total, 0)
  const contingencyPct = tier === 'BUDGET' ? 10 : 15
  return {
    family: recipe.family, label: recipe.label, tier, sqft, region, lines, byTrade, subtotal,
    contingencyPct, total: Math.round(subtotal * (1 + contingencyPct / 100)),
    costPerSqFt: Math.round(subtotal * (1 + contingencyPct / 100) / sqft),
    caution: recipe.caution ?? null,
    source: `Kealee assembly library (DC–Baltimore corridor, ${COL[tier].toLowerCase()} material + labor), region ${region.key} ×${region.multiplier}`,
  }
}
