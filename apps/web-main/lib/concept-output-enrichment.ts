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
      upload: async (pdfBuffer, intakeId) => {
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
