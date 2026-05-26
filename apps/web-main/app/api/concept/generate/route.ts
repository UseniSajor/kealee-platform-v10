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
import Anthropic from '@anthropic-ai/sdk'
import Replicate from 'replicate'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import {
  AI_MODELS,
  getConceptPackageDeliverableLabelsForIntake,
  type ConceptTier,
} from '@kealee/core-rules'
import { generateImages, buildArchitecturalPrompt, type GenerateImageResult } from '@/lib/ai-image'
import { archiveReplicateOutputsFireAndForget } from '@/lib/replicate-archive'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // Claude + Replicate render jobs can take 60–180s

// Statuses that authorise a concept generation. Stripe webhook flips intake
// to `paid`; the first successful generation flips it to `concept_ready`
// (regenerations are allowed and return cached output).
const PAID_INTAKE_STATUSES = new Set(['paid', 'concept_ready', 'processing'])

function normalizeConceptTier(tier: number): ConceptTier {
  return (tier === 3 ? 3 : tier === 2 ? 2 : 1) as ConceptTier
}

function tierDeliverableIncludes(projectPath: string, tier: number): string[] {
  return getConceptPackageDeliverableLabelsForIntake(projectPath, normalizeConceptTier(tier))
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
  const RENDER_SUBMIT_DELAY_MS = 11_000
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[concept/generate] Render ${i + 1}/${jobs.length} (${jobs[i].scope}) failed:`, msg)
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
              source: 'concept-generate-resolve',
              mediaKind: 'image',
              outputUrls: outputs,
              model: typeof pred.model === 'string' ? pred.model : undefined,
              context: { route: '/api/concept/generate' },
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
function attachConceptVideoFields(conceptOutput: ConceptOutput, tier: number): void {
  if (tier < 2) return
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
function triggerConceptVideoGeneration(baseUrl: string, intakeId: string, tier: number): void {
  if (tier < 2) return
  fetch(`${baseUrl}/api/concept/video`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ intakeId }),
  }).catch(err => {
    console.error('[concept/generate] Video generation trigger failed:', err?.message ?? err)
  })
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

  fetch(`${baseUrl}/api/emails/concept-ready`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      to:             email,
      firstName,
      service:        args.projectPath,
      intakeId:       args.intakeId,
      estimatedCost:  args.conceptOutput.estimatedCost,
      tier:           args.tier,
      videoIncluded:  args.tier >= 2,
    }),
  }).catch(err => {
    console.error('[concept/generate] concept-ready email trigger failed:', err?.message ?? err)
  })
}

function permitGuidance(permitRequired: 'always' | 'sometimes' | 'rarely' | undefined): string {
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
    const tier = typeof existingFormData.tier === 'number' ? existingFormData.tier : 1
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
    if (existingFormData.conceptOutput && intake.status === 'concept_ready') {
      const out = { ...(existingFormData.conceptOutput as ConceptOutput) }
      out.renderUrls = preferSelectedRender(out.renderUrls ?? [], existingFormData.selectedRenderUrl as string | undefined)
      attachConceptVideoFields(out, tier)
      return NextResponse.json({ conceptOutput: out, cached: true })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
    }

    // Pick model: Opus for high-stakes tiers (developer/commercial/multi-unit/
    // certified estimate) where reasoning quality matters more than cost.
    const PREMIUM_TIERS = new Set([
      'developer_concept', 'multi_unit_residential', 'mixed_use',
      'commercial_office', 'development_feasibility', 'townhome_subdivision',
      'single_family_subdivision', 'certified_estimate',
    ])
    const model = PREMIUM_TIERS.has(projectPath)
      ? AI_MODELS.conceptTextPremium
      : AI_MODELS.conceptText

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
    const client = new Anthropic({ apiKey })
    const prompt = buildConceptPrompt(intake as Record<string, unknown>, projectPath, tier, geometry)

    const message = await client.messages.create({
      model,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)

    let conceptOutput: ConceptOutput
    if (!jsonMatch) {
      console.error('[concept/generate] No JSON in Claude response, using partial data')
      // Return partial concept rather than failing
      conceptOutput = {
        designConcept: {
          style: 'Modern Contemporary',
          colorPalette: ['Neutral tones', 'Natural materials', 'Accent finishes'],
          keyFeatures: ['Custom design tailored to your project', 'Professional-grade materials', 'Energy efficient systems'],
        },
        mepSystem: {
          electrical: 'Updated electrical systems per code requirements',
          plumbing: 'N/A',
          hvac: 'N/A',
          lighting: 'LED lighting throughout',
        },
        billOfMaterials: [
          { item: 'Materials Package', quantity: 1, unit: 'set', estimatedCost: 15000, description: 'All required materials for project scope' },
          { item: 'Labor - Installation', quantity: 100, unit: 'hours', estimatedCost: 8000, description: 'Professional installation labor' },
        ],
        estimatedCost: 23000,
        projectTimeline: '4–6 weeks',
        description: 'Your personalized concept package has been prepared based on your project details.',
        includes: tierDeliverableIncludes(projectPath, tier),
        renderUrls: preferSelectedRender(
          getRenderUrls(projectPath, tier),
          geometry?.selectedRenderUrl ?? (existingFormData.selectedRenderUrl as string | undefined),
        ),
        permitScope: {
          requiresPermit: deliverable?.permitRequired === 'always',
          permitTypes: deliverable?.permitRequired === 'always' ? ['Building Permit'] : [],
          estimatedPermitFee: 0,
          estimatedProcessingDays: 0,
          requiresPE: false,
          notes: 'Permit requirements to be confirmed with your local jurisdiction.',
        },
        zoningNotes: 'Zoning analysis pending — confirm with local planning department.',
        buildabilityFlag: 'feasible' as const,
        readinessScore: deliverable?.permitRequired === 'always' ? 55 : 70,
      }
    } else {
      conceptOutput = JSON.parse(jsonMatch[0]) as ConceptOutput
      // Ensure includes matches canonical tier package (permit + zoning in all tiers)
      conceptOutput.includes = tierDeliverableIncludes(projectPath, tier)
      conceptOutput.renderUrls = preferSelectedRender(
        getRenderUrls(projectPath, tier),
        geometry?.selectedRenderUrl ?? (existingFormData.selectedRenderUrl as string | undefined),
      )
      // Enforce catalog permit rule — override AI if it contradicts the product definition
      if (deliverable?.permitRequired === 'always' && !conceptOutput.permitScope?.requiresPermit) {
        if (!conceptOutput.permitScope) {
          conceptOutput.permitScope = {
            requiresPermit: true,
            permitTypes: ['Building Permit'],
            estimatedPermitFee: 0,
            estimatedProcessingDays: 0,
            requiresPE: false,
            notes: 'A permit is required for this project type in the DMV region.',
          }
        } else {
          conceptOutput.permitScope.requiresPermit = true
        }
      }
      if (deliverable?.permitRequired === 'rarely' && conceptOutput.permitScope?.requiresPermit === undefined) {
        conceptOutput.permitScope = conceptOutput.permitScope ?? {
          requiresPermit: false,
          permitTypes: [],
          estimatedPermitFee: 0,
          estimatedProcessingDays: 0,
          requiresPE: false,
          notes: 'Permit rarely required for this project type.',
        }
      }
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
        deliverable?.renderCount ?? 3,
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

    attachConceptVideoFields(conceptOutput, tier)

    // 3. Update intake record
    const { error: updateErr } = await supabase
      .from('public_intake_leads')
      .update({
        form_data: {
          ...existingFormData,
          selectedRenderUrl: geometry?.selectedRenderUrl ?? existingFormData.selectedRenderUrl,
          coverImageUrl: geometry?.coverImageUrl ?? existingFormData.coverImageUrl,
          conceptOutput,
          renderJobs,
          renderJobScopes,
          conceptGeneratedAt: new Date().toISOString(),
        },
        status: 'concept_ready',
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
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin

    // Tier 2+ deliverables include a video. Fire-and-forget — Stripe webhook
    // path doesn't wait, and the customer portal polls /api/concept/video?intakeId=
    // for the real URL when ready (Sora/Veo/Kling typically take 30–120s).
    triggerConceptVideoGeneration(appBaseUrl, intakeId, tier)

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
