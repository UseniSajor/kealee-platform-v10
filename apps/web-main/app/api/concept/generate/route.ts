/**
 * POST /api/concept/generate
 * Body: { intakeId: string }
 *
 * 1. Fetch intake record from Supabase
 * 2. ENFORCE that the intake is paid (status in ['paid','concept_ready'])
 * 3. Load SERVICE_DELIVERABLES[projectPath] for context
 * 4. Call Claude (model pinned in @kealee/core-rules AI_MODELS)
 * 5. UPDATE intake record with conceptOutput + status='concept_ready'
 * 6. Return concept data
 *
 * Auth gate added 2026-05-09 (P0-4): previously this endpoint generated
 * concepts for any UUID, burning Anthropic credits and giving away the
 * deliverable to anyone who could guess an intake id.
 */

import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { DesignBotEnterprise, mapDesignOutputToConceptOutput } from '@kealee/core-llm'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import {
  AI_MODELS,
  getConceptPackageDeliverableLabelsForIntake,
  resolveConceptTier,
  renderCountForTier,
  shouldTriggerConceptVideo,
  conceptTierIncludesVideo,
  type ConceptTier,
} from '@kealee/core-rules'
import { generateImages, buildArchitecturalPrompt, type GenerateImageResult } from '@/lib/ai-image'
import { archiveReplicateOutputs } from '@/lib/replicate-archive'
import {
  ensureConceptPermitZoningFields,
  generateAndAttachConceptFloorplan,
  generateAndAttachConceptPdf,
} from '@/lib/concept-output-enrichment'
import { runZoningBot } from '@kealee/core-rules'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // Claude + Replicate render jobs can take 60–180s

// Statuses that authorise a concept generation. Stripe webhook flips intake
// to `paid`; the first successful generation flips it to `concept_ready`
// (regenerations are allowed and return cached output).
const PAID_INTAKE_STATUSES = new Set(['paid', 'concept_ready', 'processing', 'delivered'])

function normalizeConceptTier(tier: number): ConceptTier {
  return (tier === 3 ? 3 : tier === 2 ? 2 : 1) as ConceptTier
}

function tierDeliverableIncludes(projectPath: string, tier: number): string[] {
  return getConceptPackageDeliverableLabelsForIntake(projectPath, normalizeConceptTier(tier))
}

function packageIncludesVideo(_projectPath: string, tier: number): boolean {
  return conceptTierIncludesVideo(normalizeConceptTier(tier))
}

/** Until a Kealee transcode pipeline writes project-specific MP4s to storage, tier 2+ packages get a playable URL (override via env). */
const DEFAULT_CONCEPT_PLACEHOLDER_VIDEO_URL =
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'

interface ConceptOutput {
  designConcept: {
    style: string
    colorPalette: string[]
    keyFeatures: string[]
  }
  mepSystem: {
    electrical: string
    plumbing: string
    hvac: string
    lighting: string
  }
  billOfMaterials: Array<{
    item: string
    quantity: number
    unit: string
    estimatedCost: number
    description: string
  }>
  estimatedCost: number
  projectTimeline: string
  description: string
  includes: string[]
  renderUrls: string[]
  permitScope: {
    requiresPermit: boolean
    permitTypes: string[]
    estimatedPermitFee: number
    estimatedProcessingDays: number
    requiresPE: boolean
    notes: string
  }
  zoningNotes: string
  buildabilityFlag: 'feasible' | 'feasible-with-variance' | 'challenging'
  readinessScore: number
  /** Present when package tier includes video (Premium / Premium+). */
  videoUrl?: string
  videoDuration?: number
  /** Premium+ UI: keyed by the same labels as `VideoPlayer` format tabs. */
  videoFormatUrls?: Record<string, string>
  /** Addition / whole-home: interior-only gallery URLs. */
  interiorRenderUrls?: string[]
  /** Addition / whole-home: exterior-only gallery URLs. */
  exteriorRenderUrls?: string[]
  /** Original "before" photos uploaded by the client during intake. */
  beforeUrls?: string[]
  /** Storage URL for the generated concept package PDF (set after PDF generation). */
  pdfUrl?: string
}

/** Paths that ship both interior and exterior concept renders. */
const DUAL_SCOPE_PROJECT_PATHS = new Set([
  'addition_expansion',
  'whole_home_remodel',
  'whole_home_concept',
])

// ── AI render helpers ─────────────────────────────────────────────────────────

function projectPathToRoomType(projectPath: string): string {
  const map: Record<string, string> = {
    kitchen_remodel:          'kitchen',
    bathroom_remodel:         'bathroom',
    exterior_concept:         'exterior facade',
    garden_concept:           'garden landscape',
    master_suite:             'master bedroom',
    living_room:              'living room',
    basement_finish:          'finished basement',
    home_addition:            'home addition',
    full_home_renovation:     'open-concept living space',
    commercial_office:        'modern office interior',
    developer_concept:        'luxury residential interior',
    // Whole-home packages — render a multi-room living/dining/kitchen open plan
    whole_home_concept:       'open-concept whole home interior with living room, dining room, and kitchen',
    whole_home_remodel:       'open-concept whole home interior with living room, dining room, and kitchen',
    interior_reno_concept:    'interior living space renovation',
    interior_renovation:      'interior living space renovation',
    addition_expansion:       'modern home addition with open-plan interior',
    capture_site_concept:     'exterior facade and site',
    // Commercial / mixed-use
    multi_unit_residential:   'modern multi-unit residential interior',
    mixed_use:                'modern mixed-use lobby and commercial interior',
    development_feasibility:  'luxury residential development interior',
    townhome_subdivision:     'modern townhome interior',
    single_family_subdivision:'luxury single-family home interior',
    single_lot_development:   'luxury custom home interior',
  }
  return map[projectPath] ?? projectPath.replace(/_/g, ' ')
}

function projectPathToExteriorRoomType(projectPath: string): string {
  const map: Record<string, string> = {
    addition_expansion: 'home addition exterior facade with new wing tied to existing house',
    whole_home_remodel: 'whole house exterior renovation with updated facade and landscaping',
    whole_home_concept: 'whole house exterior curb appeal and architectural modernization',
  }
  return map[projectPath] ?? 'single-family home exterior facade'
}

function splitDualRenderCounts(total: number): { interior: number; exterior: number } {
  const exterior = Math.max(2, Math.ceil(total * 0.4))
  const interior = Math.max(2, total - exterior)
  return { interior, exterior }
}

const DUAL_SCOPE_DEV_STUBS: Record<string, { interior: string[]; exterior: string[] }> = {
  addition_expansion: {
    interior: [
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1920&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80',
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1920&q=80',
    ],
    exterior: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1920&q=80',
    ],
  },
  whole_home_remodel: {
    interior: [
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1920&q=80',
      'https://images.unsplash.com/photo-1600566752734-2a0cd0e0da49?w=1920&q=80',
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1920&q=80',
      'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=1920&q=80',
    ],
    exterior: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1920&q=80',
      'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=1920&q=80',
    ],
  },
  whole_home_concept: {
    interior: [
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1920&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80',
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1920&q=80',
      'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=1920&q=80',
    ],
    exterior: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1920&q=80',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1920&q=80',
    ],
  },
}

function getDualScopeDevStubs(projectPath: string, renderCount: number): {
  interiorRenderUrls: string[]
  exteriorRenderUrls: string[]
  renderUrls: string[]
} {
  const pack = DUAL_SCOPE_DEV_STUBS[projectPath] ?? DUAL_SCOPE_DEV_STUBS.addition_expansion
  const { interior, exterior } = splitDualRenderCounts(renderCount)
  const interiorRenderUrls = pack.interior.slice(0, interior)
  const exteriorRenderUrls = pack.exterior.slice(0, exterior)
  return {
    interiorRenderUrls,
    exteriorRenderUrls,
    renderUrls: [...interiorRenderUrls, ...exteriorRenderUrls],
  }
}

/**
 * Minimal static fallbacks used when REPLICATE_API_TOKEN is not configured
 * (local dev / CI). Keeps the portal gallery visible without burning API credits.
 */
const DEV_RENDER_STUBS = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
  'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1920&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
]

/**
 * Fire AI render jobs via Flux 1.1 Pro Ultra on Replicate (non-blocking).
 * Returns predictionIds for storage in form_data.renderJobs so the concept
 * portal can poll /api/concept/renders/[id] for real URLs as jobs complete.
 *
 * Falls back to DEV_RENDER_STUBS when REPLICATE_API_TOKEN is not configured.
 */
interface ConceptRenderBundle {
  predictionIds: string[]
  renderJobScopes: Array<'interior' | 'exterior'>
  renderUrls: string[]
  interiorRenderUrls: string[]
  exteriorRenderUrls: string[]
}

async function submitOneRenderJob(opts: {
  style: string
  roomType: string
  scope: 'interior' | 'exterior'
  renderMode: 'realistic' | 'cinematic'
  inputImageUrl?: string
}): Promise<string | null> {
  const extra =
    opts.scope === 'exterior'
      ? 'exterior architectural photography, front elevation, curb appeal, residential street context, no interior view'
      : undefined
  const result = await generateImages({
    prompt: buildArchitecturalPrompt({
      style: opts.style.toLowerCase(),
      roomType: opts.roomType,
      renderMode: opts.renderMode,
      extra,
    }),
    aspectRatio: '16:9',
    inputImageUrl: opts.scope === 'interior' ? opts.inputImageUrl : undefined,
  })
  return result.predictionId
}

async function fireConceptRenders(
  projectPath: string,
  renderCount: number,
  style: string,
  uploadedPhotoUrls: string[],
): Promise<ConceptRenderBundle> {
  const count = renderCount
  const dualScope = DUAL_SCOPE_PROJECT_PATHS.has(projectPath)

  if (!process.env.REPLICATE_API_TOKEN) {
    if (dualScope) {
      const stubs = getDualScopeDevStubs(projectPath, count)
      return {
        predictionIds: [],
        renderJobScopes: [],
        ...stubs,
      }
    }
    const renderUrls = Array.from(
      { length: count },
      (_, i) => DEV_RENDER_STUBS[i % DEV_RENDER_STUBS.length],
    )
    return {
      predictionIds: [],
      renderJobScopes: [],
      renderUrls,
      interiorRenderUrls: [],
      exteriorRenderUrls: [],
    }
  }

  const modes = ['realistic', 'cinematic'] as const
  const inputImageUrl = uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls[0] : undefined
  // 2.5s between submissions: 12 renders × 2.5s = 30s, well within 300s maxDuration.
  // (Was 11s, which caused tier 3 to exceed the route timeout before resolution could start.)
  const RENDER_SUBMIT_DELAY_MS = 2_500
  const predictionIds: string[] = []
  const renderJobScopes: Array<'interior' | 'exterior'> = []

  const jobs: Array<{ scope: 'interior' | 'exterior'; roomType: string }> = []
  if (dualScope) {
    const { interior, exterior } = splitDualRenderCounts(count)
    const interiorRoom = projectPathToRoomType(projectPath)
    const exteriorRoom = projectPathToExteriorRoomType(projectPath)
    for (let i = 0; i < interior; i++) jobs.push({ scope: 'interior', roomType: interiorRoom })
    for (let i = 0; i < exterior; i++) jobs.push({ scope: 'exterior', roomType: exteriorRoom })
  } else {
    const roomType = projectPathToRoomType(projectPath)
    for (let i = 0; i < count; i++) jobs.push({ scope: 'interior', roomType })
  }

  for (let i = 0; i < jobs.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, RENDER_SUBMIT_DELAY_MS))
    // Replicate throttles prediction creation hard when account credit is low
    // (burst of 1/min). Retry 429s with a wait so bursts still complete.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const id = await submitOneRenderJob({
          style,
          roomType: jobs[i].roomType,
          scope: jobs[i].scope,
          renderMode: modes[i % modes.length],
          inputImageUrl,
        })
        if (id) {
          predictionIds.push(id)
          renderJobScopes.push(jobs[i].scope)
        }
        break
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('429') && attempt < 3) {
          await new Promise(r => setTimeout(r, 12_000))
          continue
        }
        console.warn(`[concept/generate] Render ${i + 1}/${jobs.length} (${jobs[i].scope}) failed:`, msg)
        break
      }
    }
  }

  console.log(
    `[concept/generate] Fired ${predictionIds.length}/${jobs.length} render jobs` +
      (dualScope ? ' (interior + exterior)' : ''),
  )

  return {
    predictionIds,
    renderJobScopes,
    renderUrls: [],
    interiorRenderUrls: [],
    exteriorRenderUrls: [],
  }
}

/**
 * Poll Replicate predictions to completion and return real render URLs.
 * Called immediately after fireConceptRenders so URLs are written to the DB
 * before the response is returned. Predictions expire ~1h after completion,
 * so this must run within the same serverless invocation.
 *
 * maxWaitMs budget: 300s route limit − ~30s Claude − ~55s submit = ~215s headroom.
 * We use 150s so there's margin for Supabase write + email trigger.
 */
async function resolveConceptRenders(
  predictionIds: string[],
  renderJobScopes: Array<'interior' | 'exterior'>,
  maxWaitMs = 150_000,
): Promise<ConceptRenderBundle> {
  if (!process.env.REPLICATE_API_TOKEN || predictionIds.length === 0) {
    return { predictionIds, renderJobScopes, renderUrls: [], interiorRenderUrls: [], exteriorRenderUrls: [] }
  }

  const repl = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  // null = not yet resolved, string = resolved URL (or sentinel '__failed__')
  const resolvedUrls: (string | null)[] = new Array(predictionIds.length).fill(null)
  // Archive promises fired in parallel as each render resolves; awaited after polling
  // so we can swap Replicate delivery URLs (expire ~1h) for permanent Supabase URLs.
  const archivePromises: Array<{ index: number; promise: Promise<string | null> }> = []
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
            // Fire archive in parallel; promise collected below to swap temp→permanent URL.
            archivePromises.push({
              index: i,
              promise: archiveReplicateOutputs({
                predictionId: predictionIds[i],
                source: 'concept-generate-resolve',
                mediaKind: 'image',
                outputUrls: outputs,
                model: typeof pred.model === 'string' ? pred.model : undefined,
                context: { route: '/api/concept/generate' },
              }).then(result => result?.assets[0]?.publicUrl ?? null).catch(() => null),
            })
          }
        } else if (pred.status === 'failed' || pred.status === 'canceled') {
          console.warn(`[concept/generate] Render ${predictionIds[i]} ${pred.status}`)
          resolvedUrls[i] = '__failed__'
          unresolved--
        }
      } catch (err: unknown) {
        console.warn('[concept/generate] resolve poll error:', predictionIds[i], (err as Error)?.message)
      }
    }
    if (unresolved > 0) await new Promise(r => setTimeout(r, 5_000))
  }

  if (unresolved > 0) {
    console.warn(`[concept/generate] resolveConceptRenders timed out with ${unresolved} unresolved predictions`)
  }

  // Swap Replicate delivery URLs (expire ~1h) for permanent Supabase storage URLs.
  // Archives run in parallel so total overhead is ~5–10s regardless of render count.
  if (archivePromises.length > 0) {
    const settled = await Promise.all(
      archivePromises.map(({ index, promise }) =>
        promise.then(permanentUrl => ({ index, permanentUrl })),
      ),
    )
    for (const { index, permanentUrl } of settled) {
      if (permanentUrl && resolvedUrls[index] && resolvedUrls[index] !== '__failed__') {
        resolvedUrls[index] = permanentUrl
      }
    }
  }

  const interiorRenderUrls: string[] = []
  const exteriorRenderUrls: string[] = []
  for (let i = 0; i < predictionIds.length; i++) {
    const url = resolvedUrls[i]
    if (!url || url === '__failed__') continue
    if ((renderJobScopes[i] ?? 'interior') === 'exterior') exteriorRenderUrls.push(url)
    else interiorRenderUrls.push(url)
  }

  return {
    predictionIds,
    renderJobScopes,
    renderUrls: [...interiorRenderUrls, ...exteriorRenderUrls],
    interiorRenderUrls,
    exteriorRenderUrls,
  }
}

function preferSelectedRender(renderUrls: string[], selectedRenderUrl?: string | null): string[] {
  if (!selectedRenderUrl) return renderUrls
  return [
    selectedRenderUrl,
    ...renderUrls.filter(url => url !== selectedRenderUrl),
  ]
}

/** Initial renderUrls on concept JSON; async jobs replace via fireConceptRenders. */
function getRenderUrls(projectPath: string, _tier: number): string[] {
  const count = SERVICE_DELIVERABLES[projectPath]?.renderCount ?? 3
  if (process.env.REPLICATE_API_TOKEN) return []
  if (DUAL_SCOPE_PROJECT_PATHS.has(projectPath)) {
    return getDualScopeDevStubs(projectPath, count).renderUrls
  }
  return Array.from({ length: count }, (_, i) => DEV_RENDER_STUBS[i % DEV_RENDER_STUBS.length])
}

function applyRenderBundle(conceptOutput: ConceptOutput, bundle: ConceptRenderBundle): void {
  conceptOutput.renderUrls = bundle.renderUrls
  if (bundle.interiorRenderUrls.length > 0) {
    conceptOutput.interiorRenderUrls = bundle.interiorRenderUrls
  }
  if (bundle.exteriorRenderUrls.length > 0) {
    conceptOutput.exteriorRenderUrls = bundle.exteriorRenderUrls
  }
}

/**
 * Tier 2+ deliverables include a video. The actual generation is async and
 * runs out-of-band via /api/concept/video. This function only attaches the
 * placeholder URL so the customer sees something while the real video renders.
 *
 * Once /api/concept/video reports `completed`, the customer portal swaps in
 * `form_data.conceptVideo.outputUrl`.
 */
function attachConceptVideoFields(conceptOutput: ConceptOutput, projectPath: string, tier: number): void {
  if (!packageIncludesVideo(projectPath, tier)) return
  if (conceptOutput.videoUrl) return
  const url =
    (typeof process.env.CONCEPT_PLACEHOLDER_VIDEO_URL === 'string' &&
      process.env.CONCEPT_PLACEHOLDER_VIDEO_URL.trim()) ||
    DEFAULT_CONCEPT_PLACEHOLDER_VIDEO_URL
  conceptOutput.videoUrl = url
  conceptOutput.videoDuration = 60
  if (tier >= 3) {
    conceptOutput.videoFormatUrls = {
      '60s Full': url,
      '30s Mobile': url,
      '15s Social': url,
      '10s Preview': url,
    }
  }
}

/**
 * Fire-and-forget call to /api/concept/video for tier 2+. Returns immediately;
 * the customer portal polls via GET to swap in the real video when ready.
 */
/**
 * Base URL for fire-and-forget self-calls (video trigger/poll, render resolve,
 * deliverable-ready email). On Railway, fetching our own public domain from
 * inside the container fails ('fetch failed') — call the local server directly.
 */
function internalApiBaseUrl(req: NextRequest): string {
  if (process.env.RAILWAY_ENVIRONMENT_NAME && process.env.PORT) {
    return `http://127.0.0.1:${process.env.PORT}`
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
}

function triggerConceptVideoGeneration(baseUrl: string, intakeId: string, tier: number): void {
  if (!conceptTierIncludesVideo(tier as ConceptTier)) return
  fetch(`${baseUrl}/api/concept/video`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ intakeId }),
  }).catch(err => {
    console.error('[concept/generate] Video generation trigger failed:', err?.message ?? err)
  })
}

/** Kick GET poll once so segment chaining starts even without a browser on web-main. */
function kickConceptVideoPoll(baseUrl: string, intakeId: string, tier: number): void {
  if (!conceptTierIncludesVideo(tier as ConceptTier)) return
  fetch(`${baseUrl}/api/concept/video?intakeId=${encodeURIComponent(intakeId)}`).catch(() => {})
}

/**
 * Fire-and-forget call to the customer "your concept is ready" email.
 * Skips silently when no email is on file or RESEND is unconfigured.
 */
function triggerConceptReadyEmail(
  baseUrl: string,
  args: {
    intakeId: string
    projectPath: string
    intake: Record<string, unknown>
    conceptOutput: ConceptOutput
    tier: number
  },
): void {
  const intake = args.intake
  const formData = (intake.form_data as Record<string, unknown> | undefined) ?? {}
  const email =
    (intake.contact_email as string | undefined) ??
    (intake.email as string | undefined) ??
    (formData.email as string | undefined)

  if (!email) {
    console.warn('[concept/generate] No customer email on intake; skipping concept-ready notification', args.intakeId)
    return
  }

  const firstName =
    (intake.client_name as string | undefined)?.split(' ')[0] ??
    (formData.firstName as string | undefined) ??
    (formData.fullName as string | undefined)?.split(' ')[0]

  fetch(`${baseUrl}/api/emails/deliverable-ready`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      to:             email,
      firstName,
      service:        args.projectPath,
      intakeId:       args.intakeId,
      estimatedCost:  args.conceptOutput.estimatedCost,
      tier:           args.tier,
      videoIncluded:  packageIncludesVideo(args.projectPath, args.tier),
    }),
  }).catch(err => {
    console.error('[concept/generate] deliverable-ready email trigger failed:', err?.message ?? err)
  })
}

function intakeFloorplanInput(intake: Record<string, unknown>, intakeId: string) {
  return {
    id: intakeId,
    project_path: intake.project_path as string,
    client_name: intake.client_name as string | null,
    contact_email: intake.contact_email as string | null,
    contact_phone: intake.contact_phone as string | null,
    project_address: intake.project_address as string | null,
    budget_range: intake.budget_range as string | null,
    form_data: (intake.form_data as Record<string, unknown> | null) ?? null,
  }
}

/** Map a projectPath to the ZoningBot projectType enum */
function projectPathToZoningType(projectPath: string): 'garden' | 'kitchen' | 'landscape' | 'renovation' {
  if (projectPath.includes('kitchen')) return 'kitchen'
  if (projectPath.includes('garden')) return 'garden'
  if (projectPath.includes('landscape')) return 'landscape'
  return 'renovation'
}

// ── DMV jurisdiction lookup (local, no DB query required) ────────────────────
// Maps zip codes and city names to real fee schedules from the seeded Jurisdiction table.
// Covers the core DMV market; callers fall back to runZoningBot for other locations.

interface JurisdictionRecord {
  name: string
  city: string
  state: string
  avgReviewDays: number
  feeSchedule: Record<string, number>
  inferredByAI: false
}

const DMV_JURISDICTION_BY_ZIP: Record<string, JurisdictionRecord> = {
  // DC zip codes
  '20001': { name: 'DC Department of Buildings (DCRA)', city: 'Washington', state: 'DC', avgReviewDays: 21, feeSchedule: { kitchen_remodel: 850, bathroom_remodel: 550, interior_renovation: 950, whole_home_remodel: 4000, addition_expansion: 6500 }, inferredByAI: false },
  '20002': { name: 'DC Department of Buildings (DCRA)', city: 'Washington', state: 'DC', avgReviewDays: 21, feeSchedule: { kitchen_remodel: 850, bathroom_remodel: 550, interior_renovation: 950, whole_home_remodel: 4000, addition_expansion: 6500 }, inferredByAI: false },
  '20003': { name: 'DC Department of Buildings (DCRA)', city: 'Washington', state: 'DC', avgReviewDays: 21, feeSchedule: { kitchen_remodel: 850, bathroom_remodel: 550, interior_renovation: 950, whole_home_remodel: 4000, addition_expansion: 6500 }, inferredByAI: false },
  '20010': { name: 'DC Department of Buildings (DCRA)', city: 'Washington', state: 'DC', avgReviewDays: 21, feeSchedule: { kitchen_remodel: 850, bathroom_remodel: 550, interior_renovation: 950, whole_home_remodel: 4000, addition_expansion: 6500 }, inferredByAI: false },
  '20024': { name: 'DC Department of Buildings (DCRA)', city: 'Washington', state: 'DC', avgReviewDays: 21, feeSchedule: { kitchen_remodel: 850, bathroom_remodel: 550, interior_renovation: 950, whole_home_remodel: 4000, addition_expansion: 6500 }, inferredByAI: false },
  // Arlington VA
  '22201': { name: 'Arlington County DCP', city: 'Arlington', state: 'VA', avgReviewDays: 14, feeSchedule: { kitchen_remodel: 700, bathroom_remodel: 450, interior_renovation: 800, whole_home_remodel: 3500, addition_expansion: 5500 }, inferredByAI: false },
  '22202': { name: 'Arlington County DCP', city: 'Arlington', state: 'VA', avgReviewDays: 14, feeSchedule: { kitchen_remodel: 700, bathroom_remodel: 450, interior_renovation: 800, whole_home_remodel: 3500, addition_expansion: 5500 }, inferredByAI: false },
  '22203': { name: 'Arlington County DCP', city: 'Arlington', state: 'VA', avgReviewDays: 14, feeSchedule: { kitchen_remodel: 700, bathroom_remodel: 450, interior_renovation: 800, whole_home_remodel: 3500, addition_expansion: 5500 }, inferredByAI: false },
  '22204': { name: 'Arlington County DCP', city: 'Arlington', state: 'VA', avgReviewDays: 14, feeSchedule: { kitchen_remodel: 700, bathroom_remodel: 450, interior_renovation: 800, whole_home_remodel: 3500, addition_expansion: 5500 }, inferredByAI: false },
  '22205': { name: 'Arlington County DCP', city: 'Arlington', state: 'VA', avgReviewDays: 14, feeSchedule: { kitchen_remodel: 700, bathroom_remodel: 450, interior_renovation: 800, whole_home_remodel: 3500, addition_expansion: 5500 }, inferredByAI: false },
  '22206': { name: 'Arlington County DCP', city: 'Arlington', state: 'VA', avgReviewDays: 14, feeSchedule: { kitchen_remodel: 700, bathroom_remodel: 450, interior_renovation: 800, whole_home_remodel: 3500, addition_expansion: 5500 }, inferredByAI: false },
  '22207': { name: 'Arlington County DCP', city: 'Arlington', state: 'VA', avgReviewDays: 14, feeSchedule: { kitchen_remodel: 700, bathroom_remodel: 450, interior_renovation: 800, whole_home_remodel: 3500, addition_expansion: 5500 }, inferredByAI: false },
  '22209': { name: 'Arlington County DCP', city: 'Arlington', state: 'VA', avgReviewDays: 14, feeSchedule: { kitchen_remodel: 700, bathroom_remodel: 450, interior_renovation: 800, whole_home_remodel: 3500, addition_expansion: 5500 }, inferredByAI: false },
  // Montgomery County MD
  '20814': { name: 'Montgomery County DPS', city: 'Bethesda', state: 'MD', avgReviewDays: 18, feeSchedule: { kitchen_remodel: 620, bathroom_remodel: 400, interior_renovation: 750, whole_home_remodel: 3200, addition_expansion: 5000 }, inferredByAI: false },
  '20815': { name: 'Montgomery County DPS', city: 'Chevy Chase', state: 'MD', avgReviewDays: 18, feeSchedule: { kitchen_remodel: 620, bathroom_remodel: 400, interior_renovation: 750, whole_home_remodel: 3200, addition_expansion: 5000 }, inferredByAI: false },
  '20816': { name: 'Montgomery County DPS', city: 'Cabin John', state: 'MD', avgReviewDays: 18, feeSchedule: { kitchen_remodel: 620, bathroom_remodel: 400, interior_renovation: 750, whole_home_remodel: 3200, addition_expansion: 5000 }, inferredByAI: false },
  '20817': { name: 'Montgomery County DPS', city: 'Bethesda', state: 'MD', avgReviewDays: 18, feeSchedule: { kitchen_remodel: 620, bathroom_remodel: 400, interior_renovation: 750, whole_home_remodel: 3200, addition_expansion: 5000 }, inferredByAI: false },
  '20854': { name: 'Montgomery County DPS', city: 'Potomac', state: 'MD', avgReviewDays: 18, feeSchedule: { kitchen_remodel: 620, bathroom_remodel: 400, interior_renovation: 750, whole_home_remodel: 3200, addition_expansion: 5000 }, inferredByAI: false },
  '20895': { name: 'Montgomery County DPS', city: 'Kensington', state: 'MD', avgReviewDays: 18, feeSchedule: { kitchen_remodel: 620, bathroom_remodel: 400, interior_renovation: 750, whole_home_remodel: 3200, addition_expansion: 5000 }, inferredByAI: false },
  // Fairfax County VA
  '22153': { name: 'Fairfax County LDS', city: 'Springfield', state: 'VA', avgReviewDays: 16, feeSchedule: { kitchen_remodel: 580, bathroom_remodel: 380, interior_renovation: 700, whole_home_remodel: 3000, addition_expansion: 4800 }, inferredByAI: false },
  '22180': { name: 'Fairfax County LDS', city: 'Vienna', state: 'VA', avgReviewDays: 16, feeSchedule: { kitchen_remodel: 580, bathroom_remodel: 380, interior_renovation: 700, whole_home_remodel: 3000, addition_expansion: 4800 }, inferredByAI: false },
  '22182': { name: 'Fairfax County LDS', city: 'Vienna', state: 'VA', avgReviewDays: 16, feeSchedule: { kitchen_remodel: 580, bathroom_remodel: 380, interior_renovation: 700, whole_home_remodel: 3000, addition_expansion: 4800 }, inferredByAI: false },
  '22101': { name: 'Fairfax County LDS', city: 'McLean', state: 'VA', avgReviewDays: 16, feeSchedule: { kitchen_remodel: 580, bathroom_remodel: 380, interior_renovation: 700, whole_home_remodel: 3000, addition_expansion: 4800 }, inferredByAI: false },
  '22102': { name: 'Fairfax County LDS', city: 'McLean', state: 'VA', avgReviewDays: 16, feeSchedule: { kitchen_remodel: 580, bathroom_remodel: 380, interior_renovation: 700, whole_home_remodel: 3000, addition_expansion: 4800 }, inferredByAI: false },
  // Alexandria VA
  '22301': { name: 'Alexandria DPZ', city: 'Alexandria', state: 'VA', avgReviewDays: 15, feeSchedule: { kitchen_remodel: 680, bathroom_remodel: 430, interior_renovation: 780, whole_home_remodel: 3400, addition_expansion: 5200 }, inferredByAI: false },
  '22302': { name: 'Alexandria DPZ', city: 'Alexandria', state: 'VA', avgReviewDays: 15, feeSchedule: { kitchen_remodel: 680, bathroom_remodel: 430, interior_renovation: 780, whole_home_remodel: 3400, addition_expansion: 5200 }, inferredByAI: false },
  '22304': { name: 'Alexandria DPZ', city: 'Alexandria', state: 'VA', avgReviewDays: 15, feeSchedule: { kitchen_remodel: 680, bathroom_remodel: 430, interior_renovation: 780, whole_home_remodel: 3400, addition_expansion: 5200 }, inferredByAI: false },
  '22314': { name: 'Alexandria DPZ', city: 'Alexandria', state: 'VA', avgReviewDays: 15, feeSchedule: { kitchen_remodel: 680, bathroom_remodel: 430, interior_renovation: 780, whole_home_remodel: 3400, addition_expansion: 5200 }, inferredByAI: false },
  // Prince George's County MD
  '20745': { name: "Prince George's County DPIE", city: 'Oxon Hill', state: 'MD', avgReviewDays: 20, feeSchedule: { kitchen_remodel: 600, bathroom_remodel: 390, interior_renovation: 720, whole_home_remodel: 3100, addition_expansion: 4900 }, inferredByAI: false },
  '20746': { name: "Prince George's County DPIE", city: 'Camp Springs', state: 'MD', avgReviewDays: 20, feeSchedule: { kitchen_remodel: 600, bathroom_remodel: 390, interior_renovation: 720, whole_home_remodel: 3100, addition_expansion: 4900 }, inferredByAI: false },
  '20747': { name: "Prince George's County DPIE", city: 'District Heights', state: 'MD', avgReviewDays: 20, feeSchedule: { kitchen_remodel: 600, bathroom_remodel: 390, interior_renovation: 720, whole_home_remodel: 3100, addition_expansion: 4900 }, inferredByAI: false },
}

/** Lookup jurisdiction data from address string without a DB query. */
function lookupDmvJurisdiction(address: string): JurisdictionRecord | null {
  if (!address?.trim()) return null
  // Try zip code match first (most reliable)
  const zipMatch = address.match(/\b(\d{5})\b/)
  if (zipMatch) {
    const rec = DMV_JURISDICTION_BY_ZIP[zipMatch[1]]
    if (rec) return rec
  }
  // Try city name match
  const lower = address.toLowerCase()
  if (lower.includes('washington') || lower.includes(', dc')) {
    return DMV_JURISDICTION_BY_ZIP['20001']
  }
  if (lower.includes('arlington') && (lower.includes(', va') || lower.includes('virginia'))) {
    return DMV_JURISDICTION_BY_ZIP['22201']
  }
  if (lower.includes('alexandria') && (lower.includes(', va') || lower.includes('virginia'))) {
    return DMV_JURISDICTION_BY_ZIP['22301']
  }
  if (lower.includes('mclean') || lower.includes('vienna') || lower.includes('fairfax')) {
    return DMV_JURISDICTION_BY_ZIP['22180']
  }
  if (lower.includes('bethesda') || lower.includes('rockville') || lower.includes('silver spring') || lower.includes('chevy chase')) {
    return DMV_JURISDICTION_BY_ZIP['20814']
  }
  return null
}

/**
 * Run the zoning bot for tier 2+ when an address is provided.
 * Merges real jurisdiction/setback/FAR/permit data into the concept output.
 * Non-fatal — failures are logged but don't block generation.
 *
 * Returns jurisdiction data when a real DB/lookup record was found so the caller
 * can pass it to ensureConceptPermitZoningFields() to override AI-default fees.
 */
async function enrichWithZoningData(
  conceptOutput: ConceptOutput,
  projectPath: string,
  projectAddress: string | null | undefined,
  squareFootage: unknown,
  email: string | null | undefined,
): Promise<JurisdictionRecord | null> {
  if (!projectAddress?.trim()) return null

  // Step 1: Try fast local DMV lookup (no DB or AI call needed)
  const dmvRecord = lookupDmvJurisdiction(projectAddress)

  try {
    const sqFt = typeof squareFootage === 'number'
      ? squareFootage
      : typeof squareFootage === 'string'
      ? parseInt(squareFootage, 10) || 1500
      : 1500

    const zoning = await runZoningBot({
      location: projectAddress.trim(),
      propertySize: sqFt,
      projectType: projectPathToZoningType(projectPath),
      email: email?.trim() || 'unknown@kealee.com',
    })

    // Merge zoning data into the concept output
    const setbackDesc = `Front: ${zoning.setbacks.front}ft, Side: ${zoning.setbacks.side}ft, Rear: ${zoning.setbacks.rear}ft`
    const farDesc = zoning.far ? ` FAR: ${zoning.far}.` : ''
    conceptOutput.zoningNotes =
      `${zoning.jurisdiction} — Zone: ${zoning.zoning}. Setbacks: ${setbackDesc}.${farDesc}` +
      (zoning.requirements.length > 0 ? ` Requirements: ${zoning.requirements.join('; ')}.` : '')

    // Merge permit types from zoning bot if it found them
    if (zoning.permitType.length > 0 && conceptOutput.permitScope) {
      const existing = conceptOutput.permitScope.permitTypes ?? []
      const merged = Array.from(new Set([...existing, ...zoning.permitType]))
      conceptOutput.permitScope.permitTypes = merged
      if (merged.length > 0) conceptOutput.permitScope.requiresPermit = true
    }

    // If we found a real DMV record, override AI-estimated fee/timeline with real values
    if (dmvRecord && conceptOutput.permitScope) {
      const realFee = dmvRecord.feeSchedule[projectPath] ?? dmvRecord.feeSchedule['interior_renovation']
      if (realFee && (conceptOutput.permitScope.estimatedPermitFee === 0 || conceptOutput.permitScope.estimatedPermitFee === 850)) {
        conceptOutput.permitScope.estimatedPermitFee = realFee
      }
      if (conceptOutput.permitScope.estimatedProcessingDays === 0 || conceptOutput.permitScope.estimatedProcessingDays === 30) {
        conceptOutput.permitScope.estimatedProcessingDays = dmvRecord.avgReviewDays
      }
    }
  } catch (zoningErr: unknown) {
    const msg = zoningErr instanceof Error ? zoningErr.message : String(zoningErr)
    console.warn('[concept/generate] runZoningBot failed (non-fatal):', msg)
  }

  return dmvRecord
}

function permitGuidance(permitRequired: string | undefined): string {
  if (permitRequired === 'always') {
    return `PERMIT RULE (from Kealee product catalog): This project type ALWAYS requires a permit in the DMV region. You MUST set "requiresPermit": true in permitScope regardless of scope details. Identify the specific permit types, realistic fees, and processing days for the jurisdiction.`
  }
  if (permitRequired === 'sometimes') {
    return `PERMIT RULE (from Kealee product catalog): This project type SOMETIMES requires a permit depending on scope (structural changes, electrical panel work, plumbing rough-in, HVAC ductwork, decks over 30", etc.). Assess the described scope and set "requiresPermit" accordingly.`
  }
  if (permitRequired === 'rarely') {
    return `PERMIT RULE (from Kealee product catalog): This project type RARELY requires a permit. Only set "requiresPermit": true if the described scope explicitly includes something permit-triggering (e.g. irrigation system in a jurisdiction that requires it, grading over regulated thresholds).`
  }
  return `PERMIT RULE: Assess whether a permit is required based on the described scope and DMV jurisdiction norms.`
}

interface PascalGeometry {
  totalSqFt: number | null
  roomCount: number | null
  wallLengthFt: number | null
  floorCount: number | null
  doorCount: number | null
  windowCount: number | null
  exteriorPerimFt: number | null
  style: string | null
  projectType: string | null
  selectedRenderUrl: string | null
  coverImageUrl: string | null
}

function buildGeometrySection(geo: PascalGeometry): string {
  const lines: string[] = ['Measured Floor Plan Data (from Pascal Design Studio):']
  if (geo.totalSqFt)      lines.push(`- Total floor area: ${geo.totalSqFt.toFixed(0)} sq ft (use this for BOM quantities)`)
  if (geo.roomCount)      lines.push(`- Room count: ${geo.roomCount}`)
  if (geo.wallLengthFt)   lines.push(`- Total wall length: ${geo.wallLengthFt.toFixed(0)} linear ft`)
  if (geo.exteriorPerimFt) lines.push(`- Exterior perimeter: ${geo.exteriorPerimFt.toFixed(0)} linear ft`)
  if (geo.doorCount)      lines.push(`- Door openings: ${geo.doorCount}`)
  if (geo.windowCount)    lines.push(`- Window openings: ${geo.windowCount}`)
  if (geo.floorCount && geo.floorCount > 1) lines.push(`- Floors/levels: ${geo.floorCount}`)
  if (geo.style)          lines.push(`- Preferred design style: ${geo.style}`)
  lines.push('Use these measured quantities to produce accurate line-item quantities in the bill of materials.')
  return lines.join('\n')
}

function buildConceptPrompt(
  intake: Record<string, unknown>,
  projectPath: string,
  tier: number,
  geometry?: PascalGeometry,
): string {
  const deliverable = SERVICE_DELIVERABLES[projectPath]
  const formData = (intake.form_data as Record<string, unknown>) ?? {}
  const tierIncludes = tierDeliverableIncludes(projectPath, tier)

  const sqFt = geometry?.totalSqFt
    ? `${geometry.totalSqFt.toFixed(0)} sq ft (measured)`
    : (formData.squareFootage ?? 'Not specified')

  return `You are a senior construction design consultant generating a detailed concept package for a client.

Project Details:
- Service: ${deliverable?.label ?? projectPath}
- Category: ${deliverable?.category ?? 'design'}
- Client: ${intake.client_name ?? 'Client'}
- Address: ${intake.project_address ?? 'Not specified'}
- Description: ${formData.description ?? 'No description provided'}
- Square Footage: ${sqFt}
- Timeline: ${formData.timeline ?? 'Flexible'}
- Budget Range: ${intake.budget_range ?? 'Not specified'}
${geometry ? '\n' + buildGeometrySection(geometry) : ''}

What this service includes (tier ${normalizeConceptTier(tier)} — permit and zoning included):
${tierIncludes.map((i) => `- ${i}`).join('\n')}

${permitGuidance(deliverable?.permitRequired)}

Generate a comprehensive concept package. Respond ONLY with valid JSON in this exact shape:
{
  "designConcept": {
    "style": "Style name (e.g. 'Modern Contemporary', 'Transitional')",
    "colorPalette": ["Material/finish 1", "Material/finish 2", "Material/finish 3", "Material/finish 4"],
    "keyFeatures": [
      "Feature 1 specific to this project",
      "Feature 2",
      "Feature 3",
      "Feature 4",
      "Feature 5"
    ]
  },
  "mepSystem": {
    "electrical": "Detailed electrical specification for this project",
    "plumbing": "Plumbing specification (write N/A if not applicable)",
    "hvac": "HVAC specification (write N/A if not applicable)",
    "lighting": "Lighting specification"
  },
  "billOfMaterials": [
    { "item": "Item name", "quantity": 1, "unit": "unit", "estimatedCost": 5000, "description": "Brief description" },
    { "item": "Item 2", "quantity": 100, "unit": "sqft", "estimatedCost": 3000, "description": "Description" },
    { "item": "Labor - Installation", "quantity": 80, "unit": "hours", "estimatedCost": 6400, "description": "Professional installation" }
  ],
  "estimatedCost": 25000,
  "projectTimeline": "X–Y weeks",
  "description": "2-3 sentence concept summary for the client",
  "includes": [
    "What client receives item 1",
    "What client receives item 2"
  ],
  "permitScope": {
    "requiresPermit": true,
    "permitTypes": ["Building Permit", "Electrical Permit"],
    "estimatedPermitFee": 850,
    "estimatedProcessingDays": 30,
    "requiresPE": false,
    "notes": "A building permit is required for this scope. Submit to local jurisdiction before construction begins."
  },
  "zoningNotes": "R-4 residential zone — proposed scope is permitted by right. No variance required.",
  "buildabilityFlag": "feasible",
  "readinessScore": 80
}

Use realistic costs for the DC/MD/VA metro area. Bill of materials should have 5-8 line items with accurate quantities and costs that sum to estimatedCost (within 5%). The includes array should match what this service delivers.

For permitScope: requiresPE should be true if the project involves structural changes, new load-bearing elements, additions, ADUs, or new construction. buildabilityFlag must be one of "feasible", "feasible-with-variance", or "challenging". readinessScore is 0–100 (permit readiness).`
}

export async function POST(req: NextRequest) {
  let intakeId: string | undefined

  try {
    const body = await req.json()
    intakeId = body.intakeId

    if (!intakeId) {
      return NextResponse.json({ error: 'intakeId is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // 1. Fetch intake record
    const { data: intake, error: fetchErr } = await supabase
      .from('public_intake_leads')
      .select('*')
      .eq('id', intakeId)
      .single()

    if (fetchErr || !intake) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    // ── Payment gate (P0-4) ─────────────────────────────────────────────────
    // Block generation for unpaid intakes — never expose AI credits or the
    // deliverable to a UUID-guesser.
    const intakeStatus = intake.status as string | null
    if (!intakeStatus || !PAID_INTAKE_STATUSES.has(intakeStatus)) {
      return NextResponse.json(
        {
          error: 'Payment required',
          message: 'Concept generation is only available after intake payment.',
          status: intakeStatus ?? 'unknown',
        },
        { status: 402 },
      )
    }

    const projectPath = intake.project_path as string
    const existingFormData = (intake.form_data as Record<string, unknown>) ?? {}
    const tier = resolveConceptTier(existingFormData, { projectPath })
    const deliverable = SERVICE_DELIVERABLES[projectPath]

    // v30: DesignBot runs via os-ai-orch — never duplicate v20 concept/generate Claude call
    if (existingFormData.v30 || existingFormData.v30SkipConceptGenerate) {
      const v30Out = (existingFormData.v30ConceptOutput ?? existingFormData.conceptOutput) as
        | ConceptOutput
        | undefined
      if (v30Out) {
        return NextResponse.json({
          conceptOutput: v30Out,
          cached: true,
          source: 'v30_design_bot',
        })
      }
      return NextResponse.json(
        {
          error: 'v30 concept pending',
          message: 'DesignBot is still generating. Open your v30 workspace or try again shortly.',
          workspaceUrl: `/workspace/${intakeId}`,
        },
        { status: 202 },
      )
    }

    // Parse before-photos uploaded during intake (comma-separated public URLs)
    const attachmentsRaw = (existingFormData.attachments as string | undefined) ?? ''
    const uploadedPhotoUrls = attachmentsRaw
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u.length > 0 && /\.(jpe?g|png|webp|heic)/i.test(u))

    // Return cached concept if already generated
    if (existingFormData.conceptOutput && (intake.status === 'concept_ready' || intake.status === 'delivered')) {
      const cachedRaw = existingFormData.conceptOutput as ConceptOutput & Record<string, unknown>
      const out = { ...cachedRaw }
      out.renderUrls = preferSelectedRender(out.renderUrls ?? [], existingFormData.selectedRenderUrl as string | undefined)
      ensureConceptPermitZoningFields(out, projectPath, tier, {
        projectAddress: intake.project_address as string | undefined,
        permitRequired: deliverable?.permitRequired,
      })
      attachConceptVideoFields(out, projectPath, tier)

      const hadFloorplan =
        typeof cachedRaw.floorplanSvgInline === 'string' &&
        cachedRaw.floorplanSvgInline.trim().startsWith('<')
      await generateAndAttachConceptFloorplan(
        intakeFloorplanInput(intake as Record<string, unknown>, intakeId),
        out,
        tier,
      )
      const floorplanBackfilled =
        !hadFloorplan &&
        typeof out.floorplanSvgInline === 'string' &&
        out.floorplanSvgInline.trim().startsWith('<')

      if (floorplanBackfilled) {
        const pdfUrl = await generateAndAttachConceptPdf({
          ...intakeFloorplanInput(intake as Record<string, unknown>, intakeId),
          form_data: { ...existingFormData, conceptOutput: out },
        })
        if (pdfUrl) out.pdfUrl = pdfUrl
        await supabase
          .from('public_intake_leads')
          .update({
            form_data: {
              ...existingFormData,
              conceptOutput: out,
            },
          })
          .eq('id', intakeId)
      }

      const appBaseUrl = internalApiBaseUrl(req)
      if (packageIncludesVideo(projectPath, tier) && shouldTriggerConceptVideo(tier, existingFormData.conceptVideo)) {
        triggerConceptVideoGeneration(appBaseUrl, intakeId, tier)
        kickConceptVideoPoll(appBaseUrl, intakeId, tier)
      }
      return NextResponse.json({ conceptOutput: out, cached: true, floorplanBackfilled })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
    }

    // Optionally fetch Pascal scene geometry if intake was started from Design Studio
    let geometry: PascalGeometry | undefined
    const linkedSceneId = existingFormData.sceneId as string | undefined
    if (linkedSceneId) {
      try {
        const { data: scene } = await supabase
          .from('pascal_scenes')
          .select('total_sq_ft, room_count, wall_length_ft, floor_count, door_count, window_count, exterior_perim_ft, style, project_type, selected_render_url, cover_image_url')
          .eq('id', linkedSceneId)
          .eq('is_deleted', false)
          .single()

        if (scene) {
          geometry = {
            totalSqFt:       scene.total_sq_ft,
            roomCount:       scene.room_count,
            wallLengthFt:    scene.wall_length_ft,
            floorCount:      scene.floor_count,
            doorCount:       scene.door_count,
            windowCount:     scene.window_count,
            exteriorPerimFt: scene.exterior_perim_ft,
            style:           scene.style,
            projectType:     scene.project_type,
            selectedRenderUrl: scene.selected_render_url,
            coverImageUrl:     scene.cover_image_url,
          }
        }
      } catch (geoErr: any) {
        // Non-fatal — proceed without geometry
        console.warn('[concept/generate] Could not fetch Pascal scene geometry:', geoErr?.message)
      }
    }
    const designBot = new DesignBotEnterprise()
    const botResult = await designBot.execute({
      projectId: intakeId,
      projectType: projectPath,
      squareFeet: Math.max(1, Number(existingFormData.sqft ?? existingFormData.squareFootage ?? 1000)),
      budget: Math.max(1, Number(existingFormData.budget ?? 50000)),
      stylePreferences: existingFormData.style ? [existingFormData.style as string] : [],
      accessibility: Boolean(existingFormData.accessibility),
      // Intake stores timeline as a label ('Flexible', 'ASAP (1-2 weeks)') — Number() of
      // those is NaN and surfaces as 'NaN days' in the deliverable. Default to 30 days.
      timeline: Number.isFinite(Number(existingFormData.timeline)) ? Number(existingFormData.timeline) : 30,
      formData: { ...existingFormData, geometry },
    })

    if (!botResult.success || !botResult.data) {
      throw new Error(botResult.error ?? 'DesignBot failed')
    }

    const conceptOutput: ConceptOutput = mapDesignOutputToConceptOutput(botResult.data, {
      tier,
      projectPath,
      includes: tierDeliverableIncludes(projectPath, tier),
    }) as ConceptOutput

    // Tier 2+: enrich zoning/permit data from real address via ZoningBot (Claude).
    // Returns real jurisdiction data when a DMV address is recognized.
    // Non-fatal — generation continues even if zoning lookup fails.
    let jurisdictionData: JurisdictionRecord | null = null
    if (tier >= 2) {
      jurisdictionData = await enrichWithZoningData(
        conceptOutput,
        projectPath,
        intake.project_address as string | null | undefined,
        (existingFormData.squareFootage as unknown) ?? (existingFormData.totalSqFt as unknown),
        (intake.contact_email as string | null | undefined) ?? (existingFormData.email as string | null | undefined),
      )
    }

    // Fire AI render jobs (non-blocking — Replicate is async).
    // predictionIds stored in renderJobs so the portal can poll for real URLs.
    // If the client uploaded before-photos, img2img is used so renders match
    // the actual room geometry — those source photos become the "before" set.
    let renderJobs: string[] = []
    let renderJobScopes: Array<'interior' | 'exterior'> = []
    try {
      const renders = await fireConceptRenders(
        projectPath,
        renderCountForTier(tier, deliverable?.renderCount ?? 3),
        conceptOutput.designConcept?.style ?? 'modern contemporary',
        uploadedPhotoUrls,
      )
      // Resolve Replicate predictions to real URLs before writing to DB.
      // Predictions expire ~1h after completion, so this must happen in the
      // same serverless invocation. Budget: 150s within the 300s maxDuration.
      const resolved = await resolveConceptRenders(
        renders.predictionIds,
        renders.renderJobScopes,
        150_000,
      )
      const bundle = resolved.renderUrls.length > 0 ? resolved : renders
      applyRenderBundle(conceptOutput, bundle)
      renderJobs = renders.predictionIds
      renderJobScopes = renders.renderJobScopes
    } catch (renderErr: unknown) {
      const msg = renderErr instanceof Error ? renderErr.message : String(renderErr)
      console.warn('[concept/generate] Render job submission/resolve failed:', msg)
    }

    // Attach before-photos so the portal can display a before/after comparison
    if (uploadedPhotoUrls.length > 0) {
      conceptOutput.beforeUrls = uploadedPhotoUrls
    }

    ensureConceptPermitZoningFields(conceptOutput, projectPath, tier, {
      projectAddress: intake.project_address as string | undefined,
      permitRequired: deliverable?.permitRequired,
      jurisdictionData: jurisdictionData ?? undefined,
    })

    // Synthesize dynamic next steps based on permit requirement and jurisdiction data.
    // Written to packageJson.nextSteps.actionItems so the portal renders them.
    {
      const requiresPermit = conceptOutput.permitScope?.requiresPermit ?? false
      const permitTypes = conceptOutput.permitScope?.permitTypes ?? []
      const processingDays = conceptOutput.permitScope?.estimatedProcessingDays ?? 21
      const jCity = jurisdictionData?.city ?? ''
      const nextStepItems: string[] = []

      if (requiresPermit && permitTypes.length > 0) {
        const permitList = permitTypes.slice(0, 2).join(' + ')
        nextStepItems.push(
          `Obtain ${permitList} — estimated ${processingDays} business days processing${jCity ? ` in ${jCity}` : ''}. Filing details included in your permit scope brief.`,
        )
      } else if (!requiresPermit) {
        nextStepItems.push(
          'Match with licensed contractors using your concept brief — no permit delay needed before construction can begin.',
        )
      }

      nextStepItems.push('Review your zoning compliance summary and confirm setback/height limits with your local planning department.')
      nextStepItems.push('Schedule a professional site assessment to verify existing conditions before construction documents are produced.')

      if (tier >= 2) {
        nextStepItems.push('Share your concept package with your design professional to advance to permit-ready construction drawings.')
      }

      // Attach to packageJson.nextSteps (read by portal deliverables page)
      const co = conceptOutput as ConceptOutput & Record<string, unknown>
      const existingPkg = (co.packageJson as Record<string, unknown> | undefined) ?? {}
      co.packageJson = {
        ...existingPkg,
        nextSteps: { actionItems: nextStepItems },
      }
    }

    attachConceptVideoFields(conceptOutput, projectPath, tier)

    // Stamp a stable package ID and provenance metadata so agents and humans
    // can retrieve, audit, and track each delivered package by a durable key.
    // Written once at generation time; regenerations preserve the existing ID.
    {
      const co = conceptOutput as ConceptOutput & Record<string, unknown>
      if (!co.packageId) co.packageId = crypto.randomUUID()
      co.packageGeneratedAt = new Date().toISOString()
      co.packageTier        = tier
      co.packageProjectPath = projectPath
      co.packageIntakeId    = intakeId
      co.packageVersion     = '1'
    }

    await generateAndAttachConceptFloorplan(
      intakeFloorplanInput(intake as Record<string, unknown>, intakeId),
      conceptOutput as ConceptOutput & Record<string, unknown>,
      tier,
    )

    const pdfUrl = await generateAndAttachConceptPdf({
      id: intakeId,
      project_path: projectPath,
      client_name: intake.client_name as string | null,
      contact_email: intake.contact_email as string | null,
      contact_phone: intake.contact_phone as string | null,
      project_address: intake.project_address as string | null,
      budget_range: intake.budget_range as string | null,
      form_data: { ...existingFormData, conceptOutput },
    })
    if (pdfUrl) conceptOutput.pdfUrl = pdfUrl

    // 3. Update intake record
    const { error: updateErr } = await supabase
      .from('public_intake_leads')
      .update({
        form_data: {
          ...existingFormData,
          tier,
          selectedRenderUrl: geometry?.selectedRenderUrl ?? existingFormData.selectedRenderUrl,
          coverImageUrl: geometry?.coverImageUrl ?? existingFormData.coverImageUrl,
          conceptOutput,
          renderJobs,
          renderJobScopes,
          conceptGeneratedAt: new Date().toISOString(),
        },
        // DB enum lacks 'concept_ready'; 'delivered' = generated-and-delivered
        status: 'delivered',
      })
      .eq('id', intakeId)

    if (updateErr) {
      console.error('[concept/generate] Failed to update intake:', updateErr.message, {
        intakeId,
        projectPath,
        code: (updateErr as { code?: string }).code,
      })
      return NextResponse.json(
        {
          error: 'Concept generated but failed to save to database',
          detail: updateErr.message,
          intakeId,
          partial: true,
          conceptOutput,
        },
        { status: 500 },
      )
    }

    // Use canonical app URL for sub-fetches so they always hit production,
    // not a preview URL if this route was invoked from a webhook on a non-prod origin.
    const appBaseUrl = internalApiBaseUrl(req)

    // Tier 2+ deliverables include a video. Fire-and-forget — portal polls GET to advance segments.
    if (packageIncludesVideo(projectPath, tier) && shouldTriggerConceptVideo(tier, existingFormData.conceptVideo)) {
      triggerConceptVideoGeneration(appBaseUrl, intakeId, tier)
      kickConceptVideoPoll(appBaseUrl, intakeId, tier)
    }

    // If inline render resolution timed out, kick the external resolve route so
    // renders eventually write back to conceptOutput.renderUrls in DB.
    if (renderJobs.length > 0 && !(conceptOutput.renderUrls as string[] | undefined)?.length) {
      fetch(`${appBaseUrl}/api/concept/renders/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeId }),
      }).catch((err: unknown) => {
        console.warn('[concept/generate] Render resolve kick failed:', (err as Error)?.message ?? err)
      })
    }

    // Notify the customer that their concept is ready to view in the portal.
    // (Fire-and-forget so a slow Resend call never delays the API response.)
    triggerConceptReadyEmail(appBaseUrl, {
      intakeId,
      projectPath,
      intake: intake as Record<string, unknown>,
      conceptOutput,
      tier,
    })

    return NextResponse.json({ conceptOutput })
  } catch (err: any) {
    console.error('[concept/generate] error:', err?.message)
    // Return partial data rather than hard failure
    return NextResponse.json(
      { error: err?.message ?? 'Generation failed', partial: true },
      { status: 500 }
    )
  }
}
