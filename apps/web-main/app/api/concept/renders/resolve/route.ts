/**
 * POST /api/concept/renders/resolve
 * Body: { intakeId: string }
 *
 * Resolves pending Replicate render predictions for an intake and writes the
 * real image URLs back to conceptOutput in Supabase. Called when:
 *  - An intake has renderJobs but empty renderUrls (e.g. predictions expired
 *    before the generate route could poll them, or predictions were submitted
 *    before the resolve logic was wired in).
 *  - Admin wants to re-submit render jobs for an existing concept.
 *
 * If all stored predictions are already expired/failed, re-submits fresh
 * Replicate jobs using the existing concept style and project path.
 */

import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { generateImages, buildArchitecturalPrompt } from '@/lib/ai-image'
import { archiveReplicateOutputsFireAndForget } from '@/lib/replicate-archive'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import { TIER_IMAGE_COUNT, resolveConceptTier } from '@kealee/core-rules'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const DUAL_SCOPE_PATHS = new Set(['addition_expansion', 'whole_home_remodel', 'whole_home_concept'])

function projectPathToRoomType(p: string): string {
  const m: Record<string, string> = {
    kitchen_remodel: 'kitchen',
    bathroom_remodel: 'bathroom',
    exterior_concept: 'exterior facade',
    garden_concept: 'garden landscape',
    master_suite: 'master bedroom',
    living_room: 'living room',
    basement_finish: 'finished basement',
    home_addition: 'home addition',
    addition_expansion: 'modern home addition with open-plan interior',
    whole_home_concept: 'open-concept whole home interior with living room, dining room, and kitchen',
    whole_home_remodel: 'open-concept whole home interior with living room, dining room, and kitchen',
    interior_reno_concept: 'interior living space renovation',
    interior_renovation: 'interior living space renovation',
  }
  return m[p] ?? p.replace(/_/g, ' ')
}

function projectPathToExteriorRoomType(p: string): string {
  const m: Record<string, string> = {
    addition_expansion: 'home addition exterior facade with new wing tied to existing house',
    whole_home_remodel: 'whole house exterior renovation with updated facade and landscaping',
    whole_home_concept: 'whole house exterior curb appeal and architectural modernization',
  }
  return m[p] ?? 'single-family home exterior facade'
}

interface ResolvedBundle {
  renderUrls: string[]
  interiorRenderUrls: string[]
  exteriorRenderUrls: string[]
  newPredictionIds?: string[]
  newRenderJobScopes?: Array<'interior' | 'exterior'>
}

/**
 * Poll existing prediction IDs; returns resolved URLs for whichever completed.
 * Returns null entries for failed/expired predictions.
 */
async function pollPredictions(
  repl: Replicate,
  predictionIds: string[],
  renderJobScopes: Array<'interior' | 'exterior'>,
  maxWaitMs: number,
): Promise<ResolvedBundle> {
  const resolvedUrls: (string | null)[] = new Array(predictionIds.length).fill(null)
  const deadline = Date.now() + maxWaitMs
  let unresolved = predictionIds.length

  while (unresolved > 0 && Date.now() < deadline) {
    for (let i = 0; i < predictionIds.length; i++) {
      if (resolvedUrls[i] !== null) continue
      try {
        const pred = await repl.predictions.get(predictionIds[i])
        if (pred.status === 'succeeded') {
          const outputs = Array.isArray(pred.output)
            ? (pred.output as string[])
            : pred.output ? [pred.output as string] : []
          const url = outputs[0] ?? null
          resolvedUrls[i] = url ?? '__failed__'
          unresolved--
          if (url && outputs.length > 0) {
            archiveReplicateOutputsFireAndForget({
              predictionId: predictionIds[i],
              source: 'concept-renders-resolve',
              mediaKind: 'image',
              outputUrls: outputs,
              model: typeof pred.model === 'string' ? pred.model : undefined,
              context: { route: '/api/concept/renders/resolve' },
            })
          }
        } else if (pred.status === 'failed' || pred.status === 'canceled') {
          resolvedUrls[i] = '__failed__'
          unresolved--
        }
        // 'starting' | 'processing' → keep waiting
      } catch {
        // Likely expired — mark as failed
        resolvedUrls[i] = '__failed__'
        unresolved--
      }
    }
    if (unresolved > 0) await new Promise(r => setTimeout(r, 5_000))
  }

  const interiorRenderUrls: string[] = []
  const exteriorRenderUrls: string[] = []
  for (let i = 0; i < predictionIds.length; i++) {
    const url = resolvedUrls[i]
    if (!url || url === '__failed__') continue
    if ((renderJobScopes[i] ?? 'interior') === 'exterior') exteriorRenderUrls.push(url)
    else interiorRenderUrls.push(url)
  }
  return { renderUrls: [...interiorRenderUrls, ...exteriorRenderUrls], interiorRenderUrls, exteriorRenderUrls }
}

/**
 * Re-submit Replicate render jobs for an intake.
 * Used when stored predictions have expired.
 */
async function resubmitRenders(
  projectPath: string,
  renderCount: number,
  style: string,
): Promise<ResolvedBundle> {
  // 2.5s delay matches generate/route.ts — keeps Replicate rate limits safe
  // without causing timeouts for tier 3 (12 renders).
  const DELAY_MS = 2_500
  const dualScope = DUAL_SCOPE_PATHS.has(projectPath)
  const modes = ['realistic', 'cinematic'] as const

  type Job = { scope: 'interior' | 'exterior'; roomType: string }
  const jobs: Job[] = []

  if (dualScope) {
    const exterior = Math.max(2, Math.ceil(renderCount * 0.4))
    const interior = Math.max(2, renderCount - exterior)
    const interiorRoom = projectPathToRoomType(projectPath)
    const exteriorRoom = projectPathToExteriorRoomType(projectPath)
    for (let i = 0; i < interior; i++) jobs.push({ scope: 'interior', roomType: interiorRoom })
    for (let i = 0; i < exterior; i++) jobs.push({ scope: 'exterior', roomType: exteriorRoom })
  } else {
    const roomType = projectPathToRoomType(projectPath)
    for (let i = 0; i < renderCount; i++) jobs.push({ scope: 'interior', roomType })
  }

  const newPredictionIds: string[] = []
  const newRenderJobScopes: Array<'interior' | 'exterior'> = []

  for (let i = 0; i < jobs.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, DELAY_MS))
    try {
      const extra = jobs[i].scope === 'exterior'
        ? 'exterior architectural photography, front elevation, curb appeal, residential street context, no interior view'
        : undefined
      const result = await generateImages({
        prompt: buildArchitecturalPrompt({
          style: style.toLowerCase(),
          roomType: jobs[i].roomType,
          renderMode: modes[i % modes.length],
          extra,
        }),
        aspectRatio: '16:9',
      })
      if (result.predictionId) {
        newPredictionIds.push(result.predictionId)
        newRenderJobScopes.push(jobs[i].scope)
      }
    } catch (err: unknown) {
      console.warn('[renders/resolve] Re-submit job failed:', (err as Error)?.message)
    }
  }

  return {
    renderUrls: [],
    interiorRenderUrls: [],
    exteriorRenderUrls: [],
    newPredictionIds,
    newRenderJobScopes,
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'REPLICATE_API_TOKEN not configured' }, { status: 503 })
  }

  const { intakeId } = await req.json()
  if (!intakeId) {
    return NextResponse.json({ error: 'intakeId required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: intake, error: fetchErr } = await supabase
    .from('public_intake_leads')
    .select('*')
    .eq('id', intakeId)
    .single()

  if (fetchErr || !intake) {
    return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
  }

  const formData = (intake.form_data as Record<string, unknown>) ?? {}
  const conceptOutput = (formData.conceptOutput as Record<string, unknown>) ?? {}
  const existingRenderJobs = (formData.renderJobs as string[]) ?? []
  const existingRenderJobScopes = (formData.renderJobScopes as Array<'interior' | 'exterior'>) ?? []
  const projectPath = intake.project_path as string
  const style = (conceptOutput.designConcept as Record<string, unknown>)?.style as string ?? 'modern contemporary'
  const deliverable = SERVICE_DELIVERABLES[projectPath]
  // Use tier-aware render count — tier 3 gets 12 renders, tier 2 gets 6, tier 1 gets 3.
  const tier = resolveConceptTier(formData, { projectPath })
  const renderCount = TIER_IMAGE_COUNT[tier] ?? deliverable?.renderCount ?? 3

  const repl = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

  let bundle: ResolvedBundle
  let finalPredictionIds = existingRenderJobs
  let finalRenderJobScopes = existingRenderJobScopes

  if (existingRenderJobs.length > 0) {
    // Try polling existing predictions first (they may still be processing)
    bundle = await pollPredictions(repl, existingRenderJobs, existingRenderJobScopes, 60_000)

    if (bundle.renderUrls.length === 0) {
      // All expired/failed — re-submit fresh jobs
      console.log(`[renders/resolve] All predictions expired for ${intakeId}; re-submitting ${renderCount} renders`)
      const resubmitted = await resubmitRenders(projectPath, renderCount, style)
      finalPredictionIds = resubmitted.newPredictionIds ?? []
      finalRenderJobScopes = resubmitted.newRenderJobScopes ?? []

      // Poll newly submitted predictions
      bundle = await pollPredictions(repl, finalPredictionIds, finalRenderJobScopes, 150_000)
    }
  } else {
    // No existing predictions — submit new ones
    console.log(`[renders/resolve] No stored renderJobs for ${intakeId}; submitting ${renderCount} renders`)
    const resubmitted = await resubmitRenders(projectPath, renderCount, style)
    finalPredictionIds = resubmitted.newPredictionIds ?? []
    finalRenderJobScopes = resubmitted.newRenderJobScopes ?? []
    bundle = await pollPredictions(repl, finalPredictionIds, finalRenderJobScopes, 150_000)
  }

  if (bundle.renderUrls.length === 0) {
    return NextResponse.json(
      { error: 'Could not resolve any render URLs — predictions may still be processing', intakeId },
      { status: 202 },
    )
  }

  // Write resolved URLs back to conceptOutput in DB
  const updatedConceptOutput = {
    ...conceptOutput,
    renderUrls: bundle.renderUrls,
    ...(bundle.interiorRenderUrls.length > 0 && { interiorRenderUrls: bundle.interiorRenderUrls }),
    ...(bundle.exteriorRenderUrls.length > 0 && { exteriorRenderUrls: bundle.exteriorRenderUrls }),
  }

  const { error: updateErr } = await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...formData,
        conceptOutput: updatedConceptOutput,
        renderJobs: finalPredictionIds,
        renderJobScopes: finalRenderJobScopes,
        renderResolvedAt: new Date().toISOString(),
      },
    })
    .eq('id', intakeId)

  if (updateErr) {
    console.error('[renders/resolve] DB update failed:', updateErr.message)
    return NextResponse.json(
      { error: 'Resolved renders but failed to save to DB', detail: updateErr.message, bundle },
      { status: 500 },
    )
  }

  return NextResponse.json({
    resolved: true,
    intakeId,
    renderCount: bundle.renderUrls.length,
    interiorCount: bundle.interiorRenderUrls.length,
    exteriorCount: bundle.exteriorRenderUrls.length,
    renderUrls: bundle.renderUrls,
    interiorRenderUrls: bundle.interiorRenderUrls,
    exteriorRenderUrls: bundle.exteriorRenderUrls,
  })
}
