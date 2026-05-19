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
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import { AI_MODELS } from '@kealee/core-rules'
import { generateImages, buildArchitecturalPrompt, type GenerateImageResult } from '@/lib/ai-image'

export const dynamic = 'force-dynamic'

// Statuses that authorise a concept generation. Stripe webhook flips intake
// to `paid`; the first successful generation flips it to `concept_ready`
// (regenerations are allowed and return cached output).
const PAID_INTAKE_STATUSES = new Set(['paid', 'concept_ready', 'processing'])

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
  /** Original "before" photos uploaded by the client during intake. */
  beforeUrls?: string[]
}

// ── AI render helpers ─────────────────────────────────────────────────────────

function projectPathToRoomType(projectPath: string): string {
  const map: Record<string, string> = {
    kitchen_remodel:       'kitchen',
    bathroom_remodel:      'bathroom',
    exterior_concept:      'exterior facade',
    garden_concept:        'garden landscape',
    master_suite:          'master bedroom',
    living_room:           'living room',
    basement_finish:       'finished basement',
    home_addition:         'home addition',
    full_home_renovation:  'open-concept living space',
    commercial_office:     'modern office interior',
    developer_concept:     'luxury residential interior',
  }
  return map[projectPath] ?? projectPath.replace(/_/g, ' ')
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
async function fireConceptRenders(
  projectPath: string,
  tier: number,
  style: string,
  uploadedPhotoUrls: string[],
): Promise<{ predictionIds: string[]; renderUrls: string[] }> {
  const count = tier >= 3 ? 12 : tier === 2 ? 6 : 3

  if (!process.env.REPLICATE_API_TOKEN) {
    return {
      predictionIds: [],
      renderUrls: Array.from({ length: count }, (_, i) => DEV_RENDER_STUBS[i % DEV_RENDER_STUBS.length]),
    }
  }

  const roomType = projectPathToRoomType(projectPath)
  const modes    = ['realistic', 'cinematic'] as const

  // When the client uploaded before-photos, use the first image as a structural
  // guide for img2img — the "after" render preserves the room geometry while
  // applying the new design. Without a photo, fall back to pure text-to-image.
  const inputImageUrl = uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls[0] : undefined

  // Submit sequentially with a short delay to avoid Replicate burst-rate limits
  // on accounts with low credit balance (1 req/min burst cap below $5).
  const predictionIds: string[] = []
  for (let i = 0; i < count; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 2000))
    try {
      const result = await generateImages({
        prompt:      buildArchitecturalPrompt({
          style:      style.toLowerCase(),
          roomType,
          renderMode: modes[i % modes.length],
        }),
        aspectRatio:  '16:9',
        inputImageUrl,  // img2img when before-photo is available
      })
      predictionIds.push(result.predictionId)
    } catch (err: any) {
      console.warn(`[concept/generate] Render ${i + 1}/${count} failed:`, err?.message)
    }
  }

  console.log(`[concept/generate] Fired ${predictionIds.length}/${count} render jobs`)

  // renderUrls start empty — portal polls renderJobs predictionIds for real URLs
  return { predictionIds, renderUrls: [] }
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

function buildConceptPrompt(intake: Record<string, unknown>, projectPath: string, geometry?: PascalGeometry): string {
  const deliverable = SERVICE_DELIVERABLES[projectPath]
  const formData = (intake.form_data as Record<string, unknown>) ?? {}

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

What this service includes:
${deliverable?.includes?.map(i => `- ${i}`).join('\n') ?? '- Concept package'}

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

    // Parse before-photos uploaded during intake (comma-separated public URLs)
    const attachmentsRaw = (existingFormData.attachments as string | undefined) ?? ''
    const uploadedPhotoUrls = attachmentsRaw
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u.length > 0 && /\.(jpe?g|png|webp|heic)/i.test(u))

    // Return cached concept if already generated
    if (existingFormData.conceptOutput && intake.status === 'concept_ready') {
      const out = { ...(existingFormData.conceptOutput as ConceptOutput) }
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
          .select('total_sq_ft, room_count, wall_length_ft, floor_count, door_count, window_count, exterior_perim_ft, style, project_type')
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
          }
        }
      } catch (geoErr: any) {
        // Non-fatal — proceed without geometry
        console.warn('[concept/generate] Could not fetch Pascal scene geometry:', geoErr?.message)
      }
    }
    const client = new Anthropic({ apiKey })
    const prompt = buildConceptPrompt(intake as Record<string, unknown>, projectPath, geometry)

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
        includes: SERVICE_DELIVERABLES[projectPath]?.includes ?? [],
        renderUrls: [],
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
      // Ensure includes matches the service deliverable
      if (!conceptOutput.includes?.length && SERVICE_DELIVERABLES[projectPath]?.includes) {
        conceptOutput.includes = SERVICE_DELIVERABLES[projectPath].includes
      }
      conceptOutput.renderUrls = []
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
    try {
      const renders = await fireConceptRenders(
        projectPath, tier,
        conceptOutput.designConcept?.style ?? 'modern contemporary',
        uploadedPhotoUrls,
      )
      conceptOutput.renderUrls = renders.renderUrls
      renderJobs = renders.predictionIds
    } catch (renderErr: any) {
      console.warn('[concept/generate] Render job submission failed:', renderErr?.message)
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
          conceptOutput,
          renderJobs,
          conceptGeneratedAt: new Date().toISOString(),
        },
        status: 'concept_ready',
      })
      .eq('id', intakeId)

    if (updateErr) {
      console.error('[concept/generate] Failed to update intake:', updateErr.message)
      // Still return the concept data even if save failed
    }

    // Tier 2+ deliverables include a video. Fire-and-forget — Stripe webhook
    // path doesn't wait, and the customer portal polls /api/concept/video?intakeId=
    // for the real URL when ready (Sora/Veo/Kling typically take 30–120s).
    triggerConceptVideoGeneration(req.nextUrl.origin, intakeId, tier)

    // Notify the customer that their concept is ready to view in the portal.
    // (Fire-and-forget so a slow Resend call never delays the API response.)
    triggerConceptReadyEmail(req.nextUrl.origin, {
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
