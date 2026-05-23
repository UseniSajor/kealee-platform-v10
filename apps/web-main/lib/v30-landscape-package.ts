import {
  assembleLandscapePremiumPackage,
  isGardenLandscapeScope,
  type LandscapePremiumPackage,
} from '@kealee/kealee-agent-stack'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/** Merge Premium+ garden bot outputs into one customer-facing package on the intake lead. */
export async function syncLandscapePremiumPlusPackage(input: {
  intakeId: string
  projectPath: string
  tier?: number
  executions: Array<{
    botType: string
    status: string
    outputData?: Record<string, unknown>
  }>
  sitePlanImageUrl?: string
}): Promise<LandscapePremiumPackage | null> {
  if ((input.tier ?? 0) < 3) return null
  if (!isGardenLandscapeScope(input.projectPath)) return null

  const design = input.executions.find(e => e.botType === 'design' && e.status === 'COMPLETE')
  const floorplan = input.executions.find(e => e.botType === 'floorplan' && e.status === 'COMPLETE')
  const estimate = input.executions.find(e => e.botType === 'estimate' && e.status === 'COMPLETE')

  if (!floorplan?.outputData && !design?.outputData) return null

  const supabase = getSupabaseAdmin()
  const { data: row } = await supabase
    .from('public_intake_leads')
    .select('form_data')
    .eq('id', input.intakeId)
    .single()

  const formData = (row?.form_data as Record<string, unknown>) ?? {}
  const deliverables = formData.v30FloorplanDeliverables as { sitePlanImageUrl?: string; cadExport?: unknown } | undefined

  const pkg = assembleLandscapePremiumPackage({
    tier: 3,
    projectPath: input.projectPath,
    designOutput: design?.outputData,
    floorplanOutput: floorplan?.outputData,
    estimateOutput: estimate?.outputData,
    lotContext: formData.v30LotContext as Record<string, unknown> | null,
    sitePlanImageUrl: input.sitePlanImageUrl ?? deliverables?.sitePlanImageUrl,
    cadExportAvailable: Boolean(deliverables?.cadExport),
  })

  if (!pkg) return null

  await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...formData,
        v30LandscapePremiumPlus: pkg,
        conceptOutput: {
          ...((formData.conceptOutput ?? {}) as Record<string, unknown>),
          landscapePackage: pkg,
          billOfMaterials: buildBomFromLandscape(pkg),
          estimatedCost: pkg.estimatedCost.mid,
        },
        v30ConceptOutput: {
          ...((formData.v30ConceptOutput ?? {}) as Record<string, unknown>),
          landscapePackage: pkg,
        },
      },
    })
    .eq('id', input.intakeId)

  return pkg
}

function buildBomFromLandscape(pkg: LandscapePremiumPackage): Array<Record<string, unknown>> {
  const lines: Array<Record<string, unknown>> = []
  for (const p of pkg.plants) {
    lines.push({
      item: p.commonName ? `${p.commonName} (${p.species})` : p.species,
      quantity: p.quantity,
      unit: p.unit,
      unitCost: p.unitCost,
      total: p.lineTotal,
      category: 'plant',
    })
  }
  for (const t of pkg.trees) {
    lines.push({
      item: t.species,
      quantity: t.quantity,
      unit: 'each',
      unitCost: t.unitCost,
      total: t.lineTotal,
      category: 'tree',
      size: t.caliperOrSize,
    })
  }
  for (const m of pkg.materials) {
    lines.push({
      item: m.material,
      quantity: m.quantity,
      unit: m.unit,
      unitCost: m.unitCost,
      total: m.lineTotal,
      category: 'material',
    })
  }
  return lines
}
