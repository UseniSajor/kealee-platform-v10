/**
 * Guarantee permit/zoning fields on Claude conceptOutput and attach PDF URL after generation.
 */

import {
  getPermitZoningLabels,
  intakePathToFamily,
  type ConceptTier,
} from '@kealee/core-rules'

export interface ConceptPermitScope {
  requiresPermit: boolean
  permitTypes: string[]
  estimatedPermitFee: number
  estimatedProcessingDays: number
  requiresPE: boolean
  notes: string
}

export interface EnrichableConceptOutput {
  permitScope?: ConceptPermitScope
  zoningNotes?: string
  buildabilityFlag?: 'feasible' | 'feasible-with-variance' | 'challenging'
  readinessScore?: number
  pdfUrl?: string
  includes?: string[]
  floorplanSvgInline?: string
  floorPlanUrl?: string
  packageJson?: Record<string, unknown>
}

const STRUCTURAL_PATHS = new Set([
  'addition_expansion',
  'whole_home_remodel',
  'whole_home_concept',
  'home_addition',
  'design_build',
])

function normalizeTier(tier: number): ConceptTier {
  return (tier === 3 ? 3 : tier === 2 ? 2 : 1) as ConceptTier
}

function zoningLooksEmpty(notes: string | undefined): boolean {
  if (!notes?.trim()) return true
  return /pending|confirm with local|not yet|to be determined/i.test(notes)
}

/**
 * Fills permitScope + zoningNotes when Claude omitted them or returned placeholders.
 *
 * @param jurisdictionData  Optional real data from DB lookup. When provided, overrides
 *   the hardcoded fee/timeline defaults so customers see accurate permit costs.
 */
export function ensureConceptPermitZoningFields(
  output: EnrichableConceptOutput,
  projectPath: string,
  tier: number,
  opts?: {
    projectAddress?: string
    permitRequired?: 'always' | 'sometimes' | 'rarely'
    jurisdictionData?: {
      avgReviewDays?: number
      feeSchedule?: Record<string, number>
      city?: string
      state?: string
      inferredByAI?: boolean
    }
  },
): void {
  const tierKey = normalizeTier(tier)
  const family = intakePathToFamily(projectPath)
  const pzLabels = getPermitZoningLabels(family, tierKey)
  const permitRequired = opts?.permitRequired ?? 'sometimes'
  const defaultRequiresPermit =
    permitRequired === 'always' ||
    (permitRequired === 'sometimes' && STRUCTURAL_PATHS.has(projectPath))

  // Resolve permit fee: prefer real DB fee schedule over the $850 hardcoded default
  const jData = opts?.jurisdictionData
  const realFee = jData?.feeSchedule?.[projectPath] ?? jData?.feeSchedule?.['interior_renovation']
  const permitFee = realFee ?? (defaultRequiresPermit ? 850 : 0)
  const processingDays = jData?.avgReviewDays ?? (defaultRequiresPermit ? 21 : 0)

  if (zoningLooksEmpty(output.zoningNotes)) {
    const zoningLines = pzLabels.filter((l) => /zoning|buildability|variance|HOA|overlay|setback/i.test(l))
    const locationLabel = jData?.city && jData?.state
      ? `${jData.city}, ${jData.state}`
      : opts?.projectAddress ?? undefined
    output.zoningNotes = [
      `Your ${tierKey === 1 ? 'Basic' : tierKey === 2 ? 'Premium' : 'Premium+'} package includes zoning and permit guidance.`,
      ...zoningLines,
      locationLabel ? `Property: ${locationLabel}.` : '',
      jData && !jData.inferredByAI
        ? 'Permit data sourced from jurisdiction records — verify current fees with your local AHJ before filing.'
        : 'Confirm allowed use, setbacks, and height limits with your local planning department before construction.',
    ]
      .filter(Boolean)
      .join(' ')
  }

  const ps = output.permitScope
  const permitTypesMissing = !ps?.permitTypes?.length
  if (!ps || permitTypesMissing) {
    const permitLabels = pzLabels.filter((l) => /permit|AHJ|trade|fee|timeline|checklist/i.test(l))
    output.permitScope = {
      requiresPermit: ps?.requiresPermit ?? defaultRequiresPermit,
      permitTypes: permitTypesMissing
        ? defaultRequiresPermit
          ? ['Building / alteration permit', 'Electrical permit (if scope includes)', 'Plumbing permit (if scope includes)']
          : []
        : (ps!.permitTypes ?? []),
      estimatedPermitFee: ps?.estimatedPermitFee ?? permitFee,
      estimatedProcessingDays: ps?.estimatedProcessingDays ?? processingDays,
      requiresPE: ps?.requiresPE ?? STRUCTURAL_PATHS.has(projectPath),
      notes:
        ps?.notes?.trim() ||
        permitLabels.join(' ') ||
        'Permit scope brief included — agency filing and stamped drawings are available as a separate Kealee service.',
    }
  } else if (jData && !jData.inferredByAI) {
    // Real jurisdiction data found — override generated using AI tools fee/timeline estimates
    if (ps.estimatedPermitFee === 0 || ps.estimatedPermitFee === 850) {
      ps.estimatedPermitFee = permitFee
    }
    if (ps.estimatedProcessingDays === 0 || ps.estimatedProcessingDays === 21) {
      ps.estimatedProcessingDays = processingDays
    }
  }

  if (output.readinessScore == null || output.readinessScore < 1) {
    output.readinessScore = defaultRequiresPermit ? 72 : 85
  }
  if (!output.buildabilityFlag) {
    output.buildabilityFlag = defaultRequiresPermit ? 'feasible-with-variance' : 'feasible'
  }
}

const NO_FLOORPLAN_PATHS = new Set([
  'cost_estimate',
  'certified_estimate',
  'contractor_match',
  'permit_path_only',
  'professional_drawings',
  'developer_concept',
  'development_feasibility',
  'multi_unit_residential',
  'mixed_use',
  'commercial_office',
  'townhome_subdivision',
  'single_family_subdivision',
  'single_lot_development',
])

export interface FloorplanEnrichmentInput {
  id: string
  project_path: string
  client_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  project_address?: string | null
  budget_range?: string | null
  form_data?: Record<string, unknown> | null
}

// ── Description / photo analysis helpers ─────────────────────────────────────

/**
 * Extract room-size hints from description text and goals.
 * Returns a map of RoomType string → scale multiplier (0.82–1.5).
 */
function parseDescriptionForRoomHints(
  description: string,
  goals: string[],
): { roomSizeHints: Record<string, number>; extraCaptureZones: string[] } {
  const text = [description, ...goals].join(' ').toLowerCase()
  const hints: Record<string, number> = {}
  const extra: string[] = []

  // Kitchen size
  if (/large kitchen|chef.?s kitchen|open kitchen|gourmet kitchen/.test(text))  hints['kitchen'] = 1.28
  else if (/small kitchen|compact kitchen|galley kitchen/.test(text))            hints['kitchen'] = 0.82

  // Living area
  if (/great room|large living|open\s+(plan|concept|layout)|vaulted ceiling/.test(text)) hints['living'] = 1.28

  // Primary bedroom
  if (/large (master|primary) bed|owner.?s suite|master suite/.test(text)) hints['primary_bedroom'] = 1.28

  // Detect extra room types not in default set
  if (/home office|study room/.test(text))           extra.push('office')
  if (/mudroom|boot room/.test(text))                extra.push('mudroom')
  if (/laundry room/.test(text))                     extra.push('laundry')
  if (/flex room|bonus room|media room|game room|playroom/.test(text)) extra.push('flex_room')

  return { roomSizeHints: hints, extraCaptureZones: extra }
}

/**
 * Call Claude vision (haiku) on uploaded photos to detect room types and sizes.
 * Non-fatal — returns empty results on any error.
 * Analyzes up to 3 HTTP(S) photo URLs to control cost and latency.
 */
async function analyzePhotosForFloorplan(photoUrls: string[]): Promise<{
  captureZones: string[]
  roomSizeHints: Record<string, number>
}> {
  const urls = photoUrls.filter((u) => /^https?:\/\//.test(u)).slice(0, 3)
  if (urls.length === 0) return { captureZones: [], roomSizeHints: {} }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic()

    // Build a content array with image blocks (URL source) + prompt text.
    // Cast to unknown[] to work around SDK union narrowing on ImageBlockParam.source.
    const content: unknown[] = [
      ...urls.map((url) => ({
        type: 'image',
        source: { type: 'url', url },
      })),
      {
        type: 'text',
        text:
          'Identify the rooms shown in these photos. For each, estimate if the room is ' +
          'small, medium, or large. Reply ONLY with JSON, no prose: ' +
          '{"rooms":[{"type":"kitchen","size":"large"}]}. ' +
          'Valid types: kitchen, dining, living, primary_bedroom, secondary_bedroom, ' +
          'primary_bathroom, secondary_bathroom, hallway, garage, office, laundry, mudroom, flex_room. ' +
          'Valid sizes: small, medium, large.',
      },
    ]

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      messages: [
        {
          role: 'user' as const,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: content as any,
        },
      ],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return { captureZones: [], roomSizeHints: {} }

    const data = JSON.parse(match[0]) as { rooms?: Array<{ type?: string; size?: string }> }
    const captureZones: string[] = []
    const roomSizeHints: Record<string, number> = {}

    for (const r of data.rooms ?? []) {
      if (!r.type) continue
      captureZones.push(r.type)
      if (r.size === 'large')  roomSizeHints[r.type] = 1.25
      else if (r.size === 'small') roomSizeHints[r.type] = 0.82
    }

    return { captureZones, roomSizeHints }
  } catch (err) {
    console.warn(
      '[concept-floorplan] photo analysis skipped:',
      err instanceof Error ? err.message : err,
    )
    return { captureZones: [], roomSizeHints: {} }
  }
}

/** Run concept-engine floorplan optimizer and attach SVG + packageJson.floorPlan (Premium+ tiers). */
export async function generateAndAttachConceptFloorplan(
  intake: FloorplanEnrichmentInput,
  output: EnrichableConceptOutput & Record<string, unknown>,
  tier: number,
): Promise<void> {
  if (normalizeTier(tier) < 2) return
  if (NO_FLOORPLAN_PATHS.has(intake.project_path)) return
  if (typeof output.floorplanSvgInline === 'string' && output.floorplanSvgInline.trim().startsWith('<')) {
    return
  }

  try {
    const { generateFloorplan } = await import('@kealee/concept-engine')
    const formData = (intake.form_data ?? {}) as Record<string, unknown>
    const design = (output.designConcept as { style?: string } | undefined) ?? {}
    const attachmentsRaw = (formData.attachments as string | undefined) ?? ''
    const uploadedPhotos = attachmentsRaw
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean)

    const styleFromForm = typeof formData.style === 'string' ? formData.style : null
    const stylePreferences = styleFromForm
      ? [styleFromForm]
      : design.style
        ? [design.style]
        : ['Contemporary']

    const description = typeof formData.description === 'string' ? formData.description : ''
    const goals = description ? [description] : []

    // Parse description + goals for room size hints and extra zone hints
    const { roomSizeHints: descHints, extraCaptureZones } =
      parseDescriptionForRoomHints(description, goals)

    // Analyze uploaded photos via Claude vision (non-fatal, no-op if no valid URLs)
    const photoAnalysis = uploadedPhotos.length
      ? await analyzePhotosForFloorplan(uploadedPhotos)
      : { captureZones: [] as string[], roomSizeHints: {} as Record<string, number> }

    // Merge size hints (photo analysis wins on conflict)
    const roomSizeHints: Record<string, number> = { ...descHints, ...photoAnalysis.roomSizeHints }

    // Merge capture zones from form, description parsing, and photo analysis
    const baseCaptureZones: string[] = Array.isArray(formData.captureZones)
      ? (formData.captureZones as string[])
      : []
    const mergedCaptureZones = [
      ...baseCaptureZones,
      ...extraCaptureZones,
      ...photoAnalysis.captureZones,
    ]

    const result = generateFloorplan({
      intakeId: intake.id,
      projectPath: intake.project_path,
      tier,
      clientName: intake.client_name ?? 'Homeowner',
      contactEmail: intake.contact_email ?? '',
      contactPhone: intake.contact_phone ?? undefined,
      projectAddress: intake.project_address ?? '',
      budgetRange: intake.budget_range ?? '—',
      stylePreferences,
      goals,
      knownConstraints: [],
      uploadedPhotos,
      captureZones: mergedCaptureZones.length ? mergedCaptureZones : undefined,
      roomSizeHints: Object.keys(roomSizeHints).length ? roomSizeHints : undefined,
    })

    if (!result.roomCount || !result.svgString?.trim()) {
      console.warn('[concept-floorplan] empty layout for', intake.project_path)
      return
    }

    let floorPlanUrl: string | undefined
    try {
      const { uploadFile } = await import('@kealee/storage')
      const upload = await uploadFile({
        bucket: 'designs',
        path: `concept-packages/${intake.id}/floorplan.svg`,
        file: Buffer.from(result.svgString, 'utf-8'),
        contentType: 'image/svg+xml',
      })
      floorPlanUrl = upload.url
    } catch (uploadErr: unknown) {
      console.warn('[concept-floorplan] SVG upload failed (inline SVG still attached):',
        uploadErr instanceof Error ? uploadErr.message : uploadErr)
    }

    output.floorplanSvgInline = result.svgString
    if (floorPlanUrl) output.floorPlanUrl = floorPlanUrl

    const existingPkg = (output.packageJson as Record<string, unknown> | undefined) ?? {}
    output.packageJson = {
      ...existingPkg,
      floorPlan: {
        floorplanId: result.floorplanId,
        totalAreaFt2: result.totalAreaFt2,
        roomCount: result.roomCount,
        totalWidthFt: result.floorplanJson.totalWidthFt,
        totalDepthFt: result.floorplanJson.totalDepthFt,
        rooms: result.floorplanJson.rooms.map((r: { label: string; widthFt: number; depthFt: number; areaFt2: number; type: string }) => ({
          label: r.label,
          widthFt: r.widthFt,
          depthFt: r.depthFt,
          areaFt2: r.areaFt2,
          type: r.type,
        })),
        layoutNotes: generateAdjacencyNotes(result.floorplanJson),
        layoutIssues: result.layoutIssues,
        svgUrl: floorPlanUrl,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn('[concept-floorplan] generation failed (non-fatal):', message)
  }
}

function generateAdjacencyNotes(json: { rooms: Array<{ label: string; areaFt2: number }> }): string[] {
  const notes = [`${json.rooms.length} rooms · ${Math.round(json.rooms.reduce((s, r) => s + r.areaFt2, 0))} sq ft total`]
  return notes
}

export interface IntakePdfRow {
  id: string
  project_path: string
  client_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  project_address?: string | null
  budget_range?: string | null
  form_data?: Record<string, unknown> | null
}

/** Generate PDF, upload to storage, return public URL (non-fatal on failure). */
export async function generateAndAttachConceptPdf(intake: IntakePdfRow): Promise<string | null> {
  try {
    const { serveConceptPackagePdf } = await import('@kealee/concept-engine')
    const { uploadFile } = await import('@kealee/storage')

    const { cachedUrl } = await serveConceptPackagePdf(intake, {
      upload: async (pdfBuffer: Buffer, intakeId: string) => {
        const result = await uploadFile({
          bucket: 'designs',
          path: `concept-packages/${intakeId}/concept-package.pdf`,
          file: pdfBuffer,
          contentType: 'application/pdf',
        })
        return result.url
      },
    })

    return cachedUrl ?? null
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn('[concept-pdf] generation failed (non-fatal):', message)
    return null
  }
}
