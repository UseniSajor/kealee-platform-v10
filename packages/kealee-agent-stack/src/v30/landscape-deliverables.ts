import { isGardenLandscapeScope } from './scope-rules'

export interface LandscapePlantLine {
  species: string
  commonName?: string
  quantity: number
  unit: 'each' | 'sqft' | 'linear_ft' | 'flat' | 'cubic_yd'
  zone?: string
  unitCost?: number
  lineTotal?: number
}

export interface LandscapeTreeLine {
  species: string
  caliperOrSize?: string
  quantity: number
  unitCost?: number
  lineTotal?: number
}

export interface LandscapeMaterialLine {
  material: string
  quantity: number
  unit: string
  unitCost?: number
  lineTotal?: number
}

/** Premium+ garden/landscape full package — plants, trees, materials, estimated cost. */
export interface LandscapePremiumPackage {
  packageType: 'landscape_premium_plus'
  tier: 3
  lotContext?: Record<string, unknown>
  sitePlanImageUrl?: string
  plants: LandscapePlantLine[]
  trees: LandscapeTreeLine[]
  materials: LandscapeMaterialLine[]
  estimatedCost: { low: number; high: number; mid: number; currency: 'USD' }
  maintenanceNotes?: string[]
  seasonalCalendar?: string[]
  cadExportAvailable?: boolean
  gisNote?: string
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/** Pull plant/tree/material schedules from FloorplanBot or DesignBot JSON. */
export function extractLandscapeSchedules(sources: Record<string, unknown>[]): {
  plants: LandscapePlantLine[]
  trees: LandscapeTreeLine[]
  materials: LandscapeMaterialLine[]
} {
  const plants: LandscapePlantLine[] = []
  const trees: LandscapeTreeLine[] = []
  const materials: LandscapeMaterialLine[] = []

  for (const src of sources) {
    const fp = (src.floorplan ?? src) as Record<string, unknown>
    for (const p of asArray<Record<string, unknown>>(fp.plantSchedule ?? fp.plants ?? src.plants)) {
      plants.push({
        species: String(p.species ?? p.botanicalName ?? p.name ?? 'Species TBD'),
        commonName: p.commonName ? String(p.commonName) : undefined,
        quantity: num(p.quantity ?? p.qty, 1),
        unit: (p.unit as LandscapePlantLine['unit']) ?? 'each',
        zone: p.zone ? String(p.zone) : undefined,
        unitCost: num(p.unitCost ?? p.costEach, 0) || undefined,
        lineTotal: num(p.lineTotal ?? p.total, 0) || undefined,
      })
    }
    for (const t of asArray<Record<string, unknown>>(fp.treeSchedule ?? fp.trees ?? src.trees)) {
      trees.push({
        species: String(t.species ?? t.name ?? 'Tree TBD'),
        caliperOrSize: t.caliperOrSize ? String(t.caliperOrSize) : t.size ? String(t.size) : undefined,
        quantity: num(t.quantity ?? t.qty, 1),
        unitCost: num(t.unitCost, 0) || undefined,
        lineTotal: num(t.lineTotal ?? t.total, 0) || undefined,
      })
    }
    for (const m of asArray<Record<string, unknown>>(
      fp.materialTakeoff ?? fp.hardscapeMaterials ?? fp.materials ?? src.materials,
    )) {
      materials.push({
        material: String(m.material ?? m.name ?? 'Material'),
        quantity: num(m.quantity ?? m.qty, 1),
        unit: String(m.unit ?? 'sqft'),
        unitCost: num(m.unitCost, 0) || undefined,
        lineTotal: num(m.lineTotal ?? m.total, 0) || undefined,
      })
    }
  }

  return { plants, trees, materials }
}

export function extractLandscapeCostEstimate(estimateOutput?: Record<string, unknown>): {
  low: number
  high: number
  mid: number
} {
  if (!estimateOutput) return { low: 0, high: 0, mid: 0 }
  const low = num(estimateOutput.costLow ?? estimateOutput.totalCostLow ?? estimateOutput.estimatedCostMin, 0)
  const high = num(estimateOutput.costHigh ?? estimateOutput.totalCostHigh ?? estimateOutput.estimatedCostMax, 0)
  const mid = num(
    estimateOutput.estimatedCost ?? estimateOutput.totalCost,
    low && high ? Math.round((low + high) / 2) : 0,
  )
  return { low, high: high || mid, mid: mid || Math.round((low + high) / 2) }
}

export function assembleLandscapePremiumPackage(input: {
  tier: number
  projectPath?: string
  designOutput?: Record<string, unknown>
  floorplanOutput?: Record<string, unknown>
  estimateOutput?: Record<string, unknown>
  lotContext?: Record<string, unknown> | null
  sitePlanImageUrl?: string
  cadExportAvailable?: boolean
}): LandscapePremiumPackage | null {
  if (input.tier < 3) return null
  if (!isGardenLandscapeScope(input.projectPath)) return null

  const { plants, trees, materials } = extractLandscapeSchedules(
    [input.floorplanOutput ?? {}, input.designOutput ?? {}].filter(Boolean),
  )
  const estimatedCost = extractLandscapeCostEstimate(input.estimateOutput)

  return {
    packageType: 'landscape_premium_plus',
    tier: 3,
    lotContext: input.lotContext ?? undefined,
    sitePlanImageUrl: input.sitePlanImageUrl,
    plants,
    trees,
    materials,
    estimatedCost: { ...estimatedCost, currency: 'USD' },
    maintenanceNotes: asArray<string>(
      (input.floorplanOutput?.maintenanceNotes ?? input.designOutput?.maintenanceNotes) as unknown,
    ),
    seasonalCalendar: asArray<string>(
      (input.floorplanOutput?.seasonalCalendar ?? input.designOutput?.seasonalCalendar) as unknown,
    ),
    cadExportAvailable: input.cadExportAvailable,
    gisNote:
      'Lot aligned via geocoded coordinates and satellite imagery. For additions, use the same GIS context for setback and footprint placement.',
  }
}

export { shouldResolveLotGis } from './floorplan-scope'
