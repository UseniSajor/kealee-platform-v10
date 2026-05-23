/**
 * Build HomeownerDeliverables for PDF rendering from public_intake_leads rows
 * when concept-engine package_json is absent (Claude concept/generate path).
 */

import type { HomeownerDeliverables } from '../package/generate-homeowner-deliverables'

export interface IntakePdfSource {
  id: string
  project_path: string
  client_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  project_address?: string | null
  budget_range?: string | null
  form_data?: Record<string, unknown> | null
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

export function getConceptOutputRecord(
  formData: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!formData) return null
  const raw = formData.conceptOutput ?? formData.v30ConceptOutput
  return asRecord(raw)
}

/** Prefer stored packageJson; otherwise synthesize from conceptOutput. */
export function resolveHomeownerDeliverablesForPdf(
  intake: IntakePdfSource,
): HomeownerDeliverables | null {
  const formData = (intake.form_data ?? {}) as Record<string, unknown>
  const co = getConceptOutputRecord(formData)
  if (!co) return null

  const pkg = asRecord(co.packageJson) as HomeownerDeliverables | null
  if (pkg?.version && pkg.project) return pkg

  const design = asRecord(co.designConcept)
  const permitScope = asRecord(co.permitScope)
  const bom = Array.isArray(co.billOfMaterials) ? co.billOfMaterials : []
  const renderUrls = Array.isArray(co.renderUrls) ? (co.renderUrls as string[]) : []

  const lineItems = bom.map((row) => {
    const r = asRecord(row) ?? {}
    const cost = Number(r.estimatedCost ?? 0)
    return {
      trade: 'Materials',
      description: String(r.item ?? r.description ?? ''),
      estimatedLow: `$${Math.round(cost * 0.9).toLocaleString()}`,
      estimatedHigh: `$${Math.round(cost * 1.1).toLocaleString()}`,
    }
  })

  const totalBom = bom.reduce((sum, row) => {
    const r = asRecord(row)
    return sum + Number(r?.estimatedCost ?? 0)
  }, 0)
  const estimatedCost = Number(co.estimatedCost ?? totalBom)

  const style = String(design?.style ?? 'Contemporary')
  const description = String(co.description ?? '')

  const likelyPermits = Array.isArray(permitScope?.permitsRequired)
    ? (permitScope!.permitsRequired as string[])
    : Array.isArray(permitScope?.likelyPermits)
      ? (permitScope!.likelyPermits as string[])
      : ['Building permit']

  const now = new Date().toISOString()

  return {
    version: '1.0',
    generatedAt: String(co.generatedAt ?? now),
    client: {
      name: intake.client_name ?? 'Homeowner',
      email: intake.contact_email ?? '',
      phone: intake.contact_phone ?? undefined,
      address: intake.project_address ?? '',
      propertyUse: 'Residential',
    },
    project: {
      path: intake.project_path,
      budgetRange: intake.budget_range ?? '—',
      stylePreferences: [style],
      goals: [],
      knownConstraints: [],
      address: intake.project_address ?? undefined,
    },
    floorPlan: {
      floorplanId: `intake-${intake.id}`,
      totalAreaFt2: 0,
      roomCount: 0,
      rooms: [],
      layoutNotes: ['See concept renderings and scope sections for spatial direction.'],
    },
    narrative: {
      projectSummary: description || `Concept package for ${intake.project_path.replace(/_/g, ' ')}`,
      designIntent: description,
      materialDirection: String(design?.colorPalette ? (design.colorPalette as string[]).join(', ') : ''),
      styleNarrative: style,
      lifestyleAlignment: '',
      nextSteps: 'Review scope and permit path; schedule a consultation to proceed.',
      rooms: {},
    },
    scope: {
      totalEstimatedMin: Math.round(estimatedCost * 0.85),
      totalEstimatedMax: Math.round(estimatedCost * 1.15),
      budgetFitNote: 'Indicative range from concept BOM and scope.',
      topRequiredTrades: ['General contractor', 'Electrical', 'Plumbing'],
      exclusions: ['Permit fees', 'AHJ-specific requirements', 'Site work not shown'],
      lineItems,
      estimatedTotal: `$${estimatedCost.toLocaleString()}`,
    },
    permit: {
      requiresPermit: Boolean(permitScope?.requiresPermit ?? true),
      likelyPermits,
      likelyTradePermits: [],
      hoaReviewRequired: Boolean(permitScope?.hoaReviewRequired ?? false),
      estimatedTimeline: String(co.projectTimeline ?? permitScope?.timeline ?? '4–8 weeks'),
      estimatedCostRange: [500, 3500] as [number, number],
      keyConsiderations: Array.isArray(permitScope?.considerations)
        ? (permitScope!.considerations as string[])
        : ['Verify with local AHJ before submission'],
      disclaimer: 'Permit requirements vary by jurisdiction. This is not legal advice.',
    },
    visuals: {
      midjourneyPrompts: renderUrls.slice(0, 3),
      stableDiffusionPrompts: [],
      descriptions: renderUrls.map((_, i) => `Concept rendering ${i + 1}`),
      roomFocus: [intake.project_path.replace(/_/g, ' ')],
      styleKeywords: [style],
    },
    nextSteps: {
      recommendedService: 'Permit-ready design plans',
      architectUpsell: 'Licensed architect of record for stamped drawings',
      actionItems: [
        'Review renderings and scope',
        'Confirm budget range with your contractor',
        'Order permit drawings when ready to build',
      ],
    },
  }
}
