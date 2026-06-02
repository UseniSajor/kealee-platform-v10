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
 */
export function ensureConceptPermitZoningFields(
  output: EnrichableConceptOutput,
  projectPath: string,
  tier: number,
  opts?: {
    projectAddress?: string
    permitRequired?: 'always' | 'sometimes' | 'rarely'
  },
): void {
  const tierKey = normalizeTier(tier)
  const family = intakePathToFamily(projectPath)
  const pzLabels = getPermitZoningLabels(family, tierKey)
  const permitRequired = opts?.permitRequired ?? 'sometimes'
  const defaultRequiresPermit =
    permitRequired === 'always' ||
    (permitRequired === 'sometimes' && STRUCTURAL_PATHS.has(projectPath))

  if (zoningLooksEmpty(output.zoningNotes)) {
    const zoningLines = pzLabels.filter((l) => /zoning|buildability|variance|HOA|overlay|setback/i.test(l))
    output.zoningNotes = [
      `Your ${tierKey === 1 ? 'Basic' : tierKey === 2 ? 'Premium' : 'Premium+'} package includes zoning and permit guidance.`,
      ...zoningLines,
      opts?.projectAddress ? `Property: ${opts.projectAddress}.` : '',
      'Confirm allowed use, setbacks, and height limits with your local planning department before construction.',
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
      estimatedPermitFee: ps?.estimatedPermitFee ?? (defaultRequiresPermit ? 850 : 0),
      estimatedProcessingDays: ps?.estimatedProcessingDays ?? (defaultRequiresPermit ? 21 : 0),
      requiresPE: ps?.requiresPE ?? STRUCTURAL_PATHS.has(projectPath),
      notes:
        ps?.notes?.trim() ||
        permitLabels.join(' ') ||
        'Permit scope brief included — agency filing and stamped drawings are available as a separate Kealee service.',
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
      captureZones: Array.isArray(formData.captureZones)
        ? (formData.captureZones as string[])
        : undefined,
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
