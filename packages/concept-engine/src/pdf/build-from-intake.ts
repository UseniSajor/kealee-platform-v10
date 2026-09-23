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

  const pkg = asRecord(co.packageJson) as unknown as HomeownerDeliverables | null
  if (pkg?.version && pkg.project) return pkg

  const design = asRecord(co.designConcept)
  const permitScope = asRecord(co.permitScope)
  const bom = Array.isArray(co.billOfMaterials) ? co.billOfMaterials : []
  const renderUrls = Array.isArray(co.renderUrls) ? (co.renderUrls as string[]) : []
  const beforeUrls = Array.isArray(co.beforeUrls) ? (co.beforeUrls as string[]) : []

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

  const likelyPermits = Array.isArray(permitScope?.permitTypes)
    ? (permitScope!.permitTypes as string[])
    : Array.isArray(permitScope?.permitsRequired)
      ? (permitScope!.permitsRequired as string[])
      : Array.isArray(permitScope?.likelyPermits)
        ? (permitScope!.likelyPermits as string[])
        : ['Building permit']

  const pkgPartial = asRecord(co.packageJson)
  const fpFromPkg = asRecord(pkgPartial?.floorPlan)
  const floorPlanBlock = fpFromPkg && Number(fpFromPkg.roomCount ?? 0) > 0
    ? {
        floorplanId: String(fpFromPkg.floorplanId ?? `intake-${intake.id}`),
        totalAreaFt2: Number(fpFromPkg.totalAreaFt2 ?? 0),
        roomCount: Number(fpFromPkg.roomCount ?? 0),
        totalWidthFt: fpFromPkg.totalWidthFt != null ? Number(fpFromPkg.totalWidthFt) : undefined,
        totalDepthFt: fpFromPkg.totalDepthFt != null ? Number(fpFromPkg.totalDepthFt) : undefined,
        rooms: Array.isArray(fpFromPkg.rooms)
          ? (fpFromPkg.rooms as Array<Record<string, unknown>>).map((r) => ({
              label: String(r.label ?? ''),
              widthFt: Number(r.widthFt ?? 0),
              depthFt: Number(r.depthFt ?? 0),
              areaFt2: Number(r.areaFt2 ?? 0),
              type: r.type != null ? String(r.type) : undefined,
            }))
          : [],
        layoutNotes: Array.isArray(fpFromPkg.layoutNotes)
          ? (fpFromPkg.layoutNotes as string[])
          : [],
        layoutIssues: Array.isArray(fpFromPkg.layoutIssues)
          ? (fpFromPkg.layoutIssues as string[])
          : undefined,
        svgUrl: typeof fpFromPkg.svgUrl === 'string' ? fpFromPkg.svgUrl : undefined,
      }
    : {
        floorplanId: `intake-${intake.id}`,
        totalAreaFt2: 0,
        roomCount: 0,
        rooms: [],
        layoutNotes: ['See concept renderings and scope sections for spatial direction.'],
      }

  const estimatedPermitFee = Number(permitScope?.estimatedPermitFee ?? 0)
  const estimatedProcessingDays = Number(permitScope?.estimatedProcessingDays ?? 0)
  const permitNotes = String(permitScope?.notes ?? '').trim()
  const zoningNotes = String(co.zoningNotes ?? '').trim()
  const requiresPE = Boolean(permitScope?.requiresPE ?? false)

  const now = new Date().toISOString()

  // ── The purchaser-facing sections ─────────────────────────────────────────
  const fdStr = (k: string) => { const v = formData[k]; return typeof v === 'string' ? v.trim() : '' }
  const fdList = (k: string) => { const v = formData[k]; return Array.isArray(v) ? (v as unknown[]).map(String).filter(Boolean) : fdStr(k) ? [fdStr(k)] : [] }
  const uploaded = Array.isArray(formData.uploadedFileMeta) ? (formData.uploadedFileMeta as Array<Record<string, unknown>>) : []
  const photos = uploaded
    .filter((f) => typeof f.url === 'string' && /^https?:\/\//i.test(String(f.url)))
    .map((f, i) => ({
      url: String(f.url),
      label: String(f.label ?? f.name ?? `Photo ${i + 1}`),
      area: f.area != null ? String(f.area) : undefined,
      viewpoint: f.viewpoint != null ? String(f.viewpoint) : undefined,
      kind: (f.type === 'video' ? 'video' : f.type === 'document' ? 'document' : 'photo') as 'photo' | 'video' | 'document',
    }))
  const directionsRaw = Array.isArray(co.conceptDirections) ? (co.conceptDirections as Array<Record<string, unknown>>) : []
  const conceptDirections = directionsRaw.map((c, i) => ({
    id: String(c.id ?? `concept-${i + 1}`), name: String(c.name ?? `Concept ${i + 1}`), description: String(c.description ?? ''),
    styleMatch: Number(c.styleMatch ?? 0), estimatedCost: Number(c.estimatedCost ?? 0),
    materials: Array.isArray(c.materials) ? (c.materials as string[]) : [], keyFeatures: Array.isArray(c.keyFeatures) ? (c.keyFeatures as string[]) : [],
    recommended: Boolean(c.recommended),
  }))
  const rec = asRecord(co.recommendation)
  const beforeAfterPairs = (Array.isArray(co.beforeAfterPairs) ? (co.beforeAfterPairs as Array<Record<string, unknown>>) : [])
    .filter((p) => typeof p.beforeUrl === 'string' && typeof p.afterUrl === 'string')
    .map((p) => ({ beforeUrl: String(p.beforeUrl), afterUrl: String(p.afterUrl), label: String(p.label ?? 'Existing'), area: p.area != null ? String(p.area) : undefined, viewpoint: p.viewpoint != null ? String(p.viewpoint) : undefined }))
  const recommendedDirection = conceptDirections.find((c) => c.recommended)
  const paletteSource = Array.isArray(design?.colorPalette) ? (design!.colorPalette as string[]) : []
  const materialsPalette = paletteSource.map((sel, i) => ({ item: bom[i] && asRecord(bom[i])?.item ? String(asRecord(bom[i])!.item) : `Selection ${i + 1}`, selection: String(sel) }))
  const jurisdiction = asRecord(formData.jurisdictionData) ?? asRecord(co.jurisdictionData)
  const zoneCode = String(jurisdiction?.zoneCode ?? jurisdiction?.zone ?? '')
  const allowedUses = Array.isArray(jurisdiction?.allowedUses)
    ? (jurisdiction!.allowedUses as unknown[]).map(String).filter(Boolean)
    : typeof jurisdiction?.allowedUses === 'string' && jurisdiction.allowedUses.trim()
      ? [jurisdiction.allowedUses.trim()]
    : Array.isArray(asRecord(formData.zoningResult)?.allowedUses)
      ? (asRecord(formData.zoningResult)!.allowedUses as unknown[]).map(String).filter(Boolean)
      : []
  const siteClaims: NonNullable<HomeownerDeliverables['siteZoning']>['claims'] = [
    { claim: 'Property address', value: intake.project_address ?? '—', source: 'Customer intake', confidence: 'high', status: 'existing' },
    ...(zoneCode ? [{ claim: 'Zoning district', value: zoneCode, source: String(jurisdiction?.source ?? 'County GIS (PGAtlas / jurisdiction lookup)'), confidence: 'high' as const, status: 'existing' as const }] : []),
    ...(allowedUses.length ? [{ claim: 'Preliminary allowed uses', value: allowedUses.join(', '), source: String(jurisdiction?.source ?? 'Jurisdiction zoning data / Kealee zoning lookup'), confidence: 'medium' as const, status: 'requires-verification' as const }] : []),
    { claim: 'Permit required', value: permitScope?.requiresPermit === false ? 'No (replace-in-kind expected)' : 'Yes — ' + likelyPermits.join(', '), source: jurisdiction ? String(jurisdiction.name ?? 'Jurisdiction fee schedule') : 'Kealee permit rules (Sec. by service type)', confidence: jurisdiction ? 'high' : 'medium', status: 'requires-verification' },
    ...(zoningNotes ? [{ claim: 'Zoning notes', value: zoningNotes, source: 'Kealee zoning check', confidence: 'medium' as const, status: 'requires-verification' as const }] : []),
    { claim: 'Estimated permit fee', value: estimatedPermitFee > 0 ? `$${estimatedPermitFee.toLocaleString()}` : 'Not yet established', source: jurisdiction ? String(jurisdiction.name ?? 'Jurisdiction fee schedule') : 'Kealee default range', confidence: jurisdiction ? 'medium' : 'low', status: 'requires-verification' },
  ]
  const architectReview = asRecord(formData.architectReview)
  const customerConfirm = formData.conceptConfirmedAt ?? formData.v30ConceptConfirmedAt ?? null

  return {
    version: '1.1',
    existingConditions: {
      summary: fdStr('existingConditions') || fdStr('propertyDetails') || 'Existing conditions as described and photographed by the customer at intake.',
      mustStay: fdList('mustStay'),
      problems: fdList('problemsToSolve'),
      photos,
    },
    conceptDirections,
    recommendation: {
      conceptName: String(rec?.conceptName ?? recommendedDirection?.name ?? style),
      rationale: Array.isArray(rec?.rationale) ? (rec!.rationale as string[]) : [],
      costRange: [Math.round(estimatedCost * 0.85), Math.round(estimatedCost * 1.15)],
      nextStep: 'Approve the recommended direction in your portal; permit drawings by a licensed professional follow.',
    },
    beforeAfterPairs,
    materialsPalette,
    siteZoning: { claims: siteClaims, disclaimer: 'Site and zoning facts are preliminary and marked with their source and confidence. Items marked "requires verification" are confirmed by a licensed professional and the jurisdiction before permit drawings.' },
    packageStatus: {
      professionallyReviewed: architectReview ? { by: String(asRecord(architectReview.reviewer)?.displayName ?? 'architect'), state: String(architectReview.state ?? ''), at: String(architectReview.decidedAt ?? '') } : null,
      approvedByCustomer: customerConfirm ? { at: String(customerConfirm) } : null,
      generation: Number(formData.conceptGeneration ?? 0),
    },
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
      budgetRange: intake.budget_range ?? fdStr('budgetComfort') ?? '—',
      stylePreferences: [...new Set([style, ...fdList('stylePreferences')])],
      goals: [...fdList('description'), ...fdList('priorities')],
      knownConstraints: [...fdList('mustStay'), ...fdList('problemsToSolve')],
      address: intake.project_address ?? undefined,
    },
    floorPlan: floorPlanBlock,
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
      likelyTradePermits: Array.isArray(permitScope?.likelyTradePermits)
        ? (permitScope!.likelyTradePermits as string[])
        : [],
      hoaReviewRequired: Boolean(permitScope?.hoaReviewRequired ?? false),
      estimatedTimeline: String(co.projectTimeline ?? permitScope?.timeline ?? '4–8 weeks'),
      estimatedCostRange: estimatedPermitFee > 0
        ? ([Math.round(estimatedPermitFee * 0.85), Math.round(estimatedPermitFee * 1.15)] as [number, number])
        : ([500, 3500] as [number, number]),
      keyConsiderations: [
        ...(Array.isArray(permitScope?.considerations)
          ? (permitScope!.considerations as string[])
          : []),
        ...(permitNotes ? [permitNotes] : []),
        ...(zoningNotes ? [zoningNotes] : []),
        'Verify with local AHJ before submission',
      ].filter((v, i, a) => a.indexOf(v) === i),
      disclaimer: zoningNotes
        ? `${zoningNotes} Permit requirements vary by jurisdiction. This is not legal advice.`
        : 'Permit requirements vary by jurisdiction. This is not legal advice.',
    },
    permitPath: {
      requiresPermit: Boolean(permitScope?.requiresPermit ?? true),
      likelyPermits,
      estimatedTimeline: String(co.projectTimeline ?? '4–8 weeks'),
      estimatedCost:
        estimatedPermitFee > 0
          ? `$${estimatedPermitFee.toLocaleString()}`
          : '$500–$3,500 (estimated range)',
      permits: likelyPermits,
      tradeLicenses: Array.isArray(permitScope?.likelyTradePermits)
        ? (permitScope!.likelyTradePermits as string[])
        : [],
      structuralReviewRequired: requiresPE,
      designReviewRequired: requiresPE,
      notes: [
        ...(permitNotes ? [permitNotes] : []),
        ...(zoningNotes ? [`Zoning: ${zoningNotes}`] : []),
      ],
      disclaimer:
        'Permit and zoning guidance are informational — not agency filing or stamped drawings.',
    },
    visuals: {
      midjourneyPrompts: renderUrls.slice(0, 6),
      // The PDF renderer recognizes source/render URLs and embeds the actual
      // project images. Existing prompt-based packages remain supported.
      stableDiffusionPrompts: beforeUrls.slice(0, 6),
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
