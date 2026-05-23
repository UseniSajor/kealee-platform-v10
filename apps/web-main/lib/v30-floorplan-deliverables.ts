import Replicate from 'replicate'
import {
  buildFloorplanSheetPrompt,
  floorplanToCadBundle,
  includesCadExport,
  inferFloorplanScope,
  isGardenLandscapeScope,
  type V30CadExportInput,
  type V30IntakeFormAnswers,
} from '@kealee/kealee-agent-stack'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { generateImages } from '@/lib/ai-image'
import { pollV30RenderPredictions } from '@/lib/v30-replicate-poll'
import { resolveLotContext, type V30LotContext } from '@/lib/v30-lot-gis'

function buildSitePlanPrompt(
  floorplan: Record<string, unknown>,
  projectPath: string,
  lot?: V30LotContext | null,
  answers?: V30IntakeFormAnswers,
): string {
  const lotNote = lot?.satelliteImageUrl
    ? ' Align layout to satellite lot context.'
    : lot
      ? ` Lot coordinates ${lot.lat}, ${lot.lng}.`
      : ''
  return buildFloorplanSheetPrompt(floorplan, projectPath, lotNote, answers)
}

async function pollRecraftPrediction(predictionId: string, maxMs = 120_000): Promise<string | null> {
  if (!process.env.REPLICATE_API_TOKEN) return null
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const p = await replicate.predictions.get(predictionId)
    if (p.status === 'succeeded') {
      const url = Array.isArray(p.output) ? (p.output[0] as string) : (p.output as string)
      return url ?? null
    }
    if (p.status === 'failed' || p.status === 'canceled') return null
    await new Promise(r => setTimeout(r, 5000))
  }
  return null
}

/**
 * End-to-end floorplan deliverables: GIS lot → Recraft plan sheet → optional CAD export → intake form_data.
 */
export async function finalizeV30FloorplanDeliverables(input: {
  intakeId: string
  projectPath: string
  floorplanOutput?: Record<string, unknown>
  tier?: 1 | 2 | 3
  features?: string[]
  address?: string
}): Promise<Record<string, unknown>> {
  const supabase = getSupabaseAdmin()
  const { data: row } = await supabase
    .from('public_intake_leads')
    .select('form_data')
    .eq('id', input.intakeId)
    .single()

  const formData = (row?.form_data as Record<string, unknown>) ?? {}
  const existingLot = formData.v30LotContext as V30LotContext | undefined
  const lot =
    existingLot ??
    (input.address || String(formData.v30Answers && (formData.v30Answers as { location?: string }).location))
      ? await resolveLotContext(
          input.address ??
            String((formData.v30Answers as { location?: string })?.location ?? ''),
        )
      : null

  const answers = (formData.v30Answers ?? {}) as V30IntakeFormAnswers
  const fpRoot = (input.floorplanOutput?.floorplan ?? input.floorplanOutput) as Record<string, unknown>
  const floorplanScope = inferFloorplanScope(
    answers.primaryScope
      ? answers
      : { ...answers, primaryScope: input.projectPath, squareFeet: Number(formData.squareFootage ?? 0) || 1200 },
    input.projectPath,
  )
  const deliverables: Record<string, unknown> = {
    completedAt: new Date().toISOString(),
    lotContext: lot,
    floorplanScope,
    permitNote: isGardenLandscapeScope(input.projectPath)
      ? 'Landscape permit not required unless irrigation or permanent plumbing is in scope.'
      : undefined,
  }

  if (process.env.REPLICATE_API_TOKEN && fpRoot && Object.keys(fpRoot).length > 0) {
    try {
      const prompt = buildSitePlanPrompt(fpRoot, input.projectPath, lot, answers.primaryScope ? answers : undefined)
      const job = await generateImages({
        prompt,
        provider: 'recraft-v3',
        aspectRatio: '4:3',
        inputImageUrl: lot?.satelliteImageUrl ?? undefined,
      })
      const planUrl = await pollRecraftPrediction(job.predictionId)
      if (planUrl) {
        deliverables.sitePlanImageUrl = planUrl
        deliverables.sitePlanProvider = 'recraft-v3'
      }
      deliverables.sitePlanPredictionId = job.predictionId
    } catch (err: unknown) {
      deliverables.sitePlanError = err instanceof Error ? err.message : 'Recraft failed'
    }
  }

  const featureList = input.features ?? (formData.v30Features as string[]) ?? []
  if (includesCadExport(featureList, input.tier) && fpRoot) {
    const cad = floorplanToCadBundle({
      floorplan: fpRoot as V30CadExportInput['floorplan'],
      projectPath: input.projectPath,
      lotContext: lot
        ? { lat: lot.lat, lng: lot.lng, address: lot.address }
        : undefined,
    })
    deliverables.cadExport = cad
    deliverables.cadUpsell = {
      label: 'Professional CAD export (Premium+)',
      formats: ['DXF', 'layout JSON', 'geoJson point for GIS / Google Earth'],
      transitionHint:
        'Open DXF in AutoCAD or SketchUp; refine in Vectorworks / PRO Landscape / DynaSCAPE for permit-grade sheets.',
    }
  }

  const conceptOutput = {
    ...((formData.conceptOutput ?? formData.v30ConceptOutput) as Record<string, unknown>),
    floorPlanUrl: deliverables.sitePlanImageUrl ?? (formData.conceptOutput as { floorPlanUrl?: string })?.floorPlanUrl,
    floorplanDeliverables: deliverables,
    lotContext: lot,
  }

  await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...formData,
        v30LotContext: lot,
        v30FloorplanDeliverables: deliverables,
        conceptOutput,
        v30ConceptOutput: conceptOutput,
      },
    })
    .eq('id', input.intakeId)

  void pollV30RenderPredictions(input.intakeId)

  return deliverables
}
