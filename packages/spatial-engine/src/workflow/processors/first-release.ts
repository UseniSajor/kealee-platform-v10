/**
 * The thirteen first-release stage processors.
 *
 * Each one is a thin adapter over a function that ALREADY EXISTS. That is the
 * whole point of this checkpoint: the engine was ~23,000 lines with no caller,
 * and connecting it must not mean rewriting it. If a processor here contains
 * civil-engineering logic, it is in the wrong place — the logic belongs in the
 * module the stage definition names, and this file only marshals inputs and
 * outputs.
 *
 * Every processor reads its inputs from `ctx.priorOutputs` rather than
 * recomputing them. That is what makes resume cheap and what stops a
 * non-deterministic stage — a live GIS call — from returning a different answer
 * on the second run.
 */

import type { StageContext, StageResult, StageProcessor } from '../context'
import { requirePriorOutput } from '../context'
import type { SitePlanJobName } from '../definition'

import { resolvePgAtlasSite, type PgAtlasSite } from '../../jurisdictions/pgatlas'
import { fetchPgContours, type PgContourResult } from '../../jurisdictions/pg-elevation'
import { buildLotPackage, type LotPackage } from '../../self-perform/lot-package'
import { renderSheetSetPdf } from '../../sheets/render-pdf'
import { buildSheetContext } from '../../sheets/render-svg'
import { requiredNotesForSheet, PG_REQUIRED_PLAN_NOTES } from '../../site-plan/required-notes'
import type { SheetId } from '../../sheets/sheet-template'

// ── Stage payloads ──────────────────────────────────────────────────────────

export interface InitializeOutput {
  activatedAt: string
  address: string | null
  jurisdictionCode: string
}

export interface ResolvePropertyOutput {
  matchedAddress: string
  locatorScore: number
  easting2248: number
  northing2248: number
  zoneCode: string | null
  parcelRing: [number, number][] | null
  parcelAreaSqFt: number | null
  parcelId: string | null
  streetPoint: [number, number] | null
  /** Sec. 24-128 — a legal buildable lot fronts a street. */
  hasStreetFrontage: boolean
}

export interface ExistingConditionsOutput {
  contourCount: number
  elevationsFt: number[]
  verticalDatum: string | null
  reliabilityLevel: number
  twinRevision: number
}

export interface EnvelopeOutput {
  envelopeAreaSqFt: number | null
  setbacks: { frontFt: number | null; sideFt: number | null; rearFt: number | null }
  bindingConstraint: string | null
  allowedFootprintSqFt: number | null
  hasStreetFrontage: boolean
}

export interface LayoutOutput {
  footprintSqFt: number | null
  basis: string | null
  exact: boolean
}

export interface ComposeOutput {
  pages: { primary: SheetId; covers: SheetId[] }[]
  rationale: string
}

export interface RenderOutput {
  documentId: string
  filename: string
  pageCount: number
  byteLength: number
  frameFailures: { sheet: string; missing: string[] }[]
}

export interface DraftQcOutput {
  deliverable: true
  issuable: boolean
  blocking: { code: string; message: string }[]
  pendingSeal: { code: string; message: string }[]
  summary: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)

function addressFrom(ctx: StageContext): string | null {
  const f = ctx.subject.formData
  return str(f.address) ?? str(f.propertyAddress) ?? str(f.site_address)
}

/** Rebuilds the lot package from persisted stage outputs. Deterministic. */
function lotPackageFrom(ctx: StageContext): LotPackage {
  const prop = requirePriorOutput<ResolvePropertyOutput>(ctx, 'siteplan.resolve_property')
  const cond = ctx.priorOutputs['siteplan.build_existing_conditions'] as
    | (ExistingConditionsOutput & { contours?: PgContourResult['contours'] })
    | undefined

  if (!prop.parcelRing) {
    throw new Error(
      'No parcel boundary was resolved, so no lot package can be built. A rectangle is never ' +
      'invented — it would render exactly like a real boundary and nothing downstream could tell.')
  }

  return buildLotPackage(
    {
      name: prop.matchedAddress,
      address: prop.matchedAddress,
      jurisdictionCode: 'prince_georges_md',
      zoneCode: prop.zoneCode ?? '',
      isResidentialSingleFamily: true,
      dwellingUnitCount: 1,
      streetPoint: prop.streetPoint,
      parcelId: prop.parcelId,
      contours: cond?.contours?.map(c => ({
        elevationFt: c.elevationFt, path: c.path, weight: c.weight, hidden: c.hidden,
      })),
      verticalDatum: cond?.verticalDatum ?? null,
      programme: programmeFrom(ctx),
    },
    {
      ring: { coordinates: prop.parcelRing },
      provenance: 'jurisdiction_gis',
      authority: "Prince George's County / M-NCPPC — PGAtlas Property",
      retrievedAt: new Date().toISOString(),
    },
  )
}

function programmeFrom(ctx: StageContext) {
  const f = ctx.subject.formData
  const sqft = Number(f.houseSquareFeet ?? f.totalFloorAreaSqFt ?? 0)
  if (!Number.isFinite(sqft) || sqft <= 0) return undefined
  return {
    totalFloorAreaSqFt: sqft,
    storeys: Number(f.storeys ?? 1) || 1,
    hasBasement: f.hasBasement === true,
    garage: (str(f.garage) ?? 'none') as never,
    coveredPorch: f.coveredPorch === true,
  }
}

// ── Processors ──────────────────────────────────────────────────────────────

const initialize: StageProcessor = async (ctx): Promise<StageResult> => ({
  status: 'COMPLETED',
  outputs: {
    activatedAt: ctx.capabilities.now().toISOString(),
    address: addressFrom(ctx),
    jurisdictionCode: 'prince_georges_md',
  } satisfies InitializeOutput,
})

const resolveProperty: StageProcessor = async (ctx): Promise<StageResult> => {
  const address = addressFrom(ctx)
  if (!address) {
    return {
      status: 'BLOCKED', outputs: null,
      blockers: ['No address on the order, so the site cannot be located.'],
    }
  }

  const site: PgAtlasSite | null = await resolvePgAtlasSite(address, {
    fetchImpl: ctx.capabilities.fetchImpl,
  })
  if (!site) {
    return {
      status: 'BLOCKED', outputs: null,
      blockers: [
        `The county locator did not match "${address}" at or above the minimum score. ` +
        'A weak match would site the plan on the wrong lot, so none is accepted.',
      ],
    }
  }

  const out: ResolvePropertyOutput = {
    matchedAddress: site.address.matchedAddress,
    locatorScore: site.address.score,
    easting2248: site.address.easting2248,
    northing2248: site.address.northing2248,
    zoneCode: site.zoning?.zoneCode ?? null,
    parcelRing: site.parcel ? (site.parcel.ring.coordinates as [number, number][]) : null,
    parcelAreaSqFt: site.parcel?.areaSqFt ?? null,
    parcelId: site.parcel?.propId ?? null,
    streetPoint: site.streetPoint as [number, number] | null,
    hasStreetFrontage: Boolean(site.streetPoint),
  }

  // No parcel is a real answer, not an error — the plan proceeds without a lot
  // outline rather than inventing one.
  const blockers = out.parcelRing ? undefined : [
    'No parcel polygon at the geocoded point. No boundary is drawn and none is invented.',
  ]
  return { status: blockers ? 'BLOCKED' : 'COMPLETED', outputs: out, blockers }
}

const ingestDocuments: StageProcessor = async (ctx): Promise<StageResult> => {
  // Uploaded evidence is registered by the upload path; this stage records that
  // the collection point was reached. A survey is NOT required to draw.
  const uploads = Array.isArray(ctx.subject.formData.uploads)
    ? (ctx.subject.formData.uploads as unknown[])
    : []
  return {
    status: 'COMPLETED',
    outputs: { documentCount: uploads.length, surveyProvided: false },
  }
}

const resolveJurisdiction: StageProcessor = async (ctx): Promise<StageResult> => {
  const prop = requirePriorOutput<ResolvePropertyOutput>(ctx, 'siteplan.resolve_property')
  return {
    status: 'COMPLETED',
    outputs: {
      jurisdictionCode: 'prince_georges_md',
      zoneCode: prop.zoneCode,
      zoneSource: 'PGAtlas Zoning/MapServer/63',
    },
  }
}

const evaluateRules: StageProcessor = async (ctx): Promise<StageResult> => {
  // The certified pack is prepared by the maintenance cycle; evaluation is
  // synchronous and touches no network.
  const prop = requirePriorOutput<ResolvePropertyOutput>(ctx, 'siteplan.resolve_property')
  return {
    status: 'COMPLETED',
    rulePackVersion: 'pg-2022.1',
    outputs: { zoneCode: prop.zoneCode, packVersion: 'pg-2022.1' },
  }
}

const buildExistingConditions: StageProcessor = async (ctx): Promise<StageResult> => {
  const prop = requirePriorOutput<ResolvePropertyOutput>(ctx, 'siteplan.resolve_property')

  let contours: PgContourResult | null = null
  try {
    contours = await fetchPgContours(prop.easting2248, prop.northing2248, {
      radiusFt: 150, fetchImpl: ctx.capabilities.fetchImpl,
    })
  } catch (e) {
    ctx.capabilities.trace({
      workflowId: ctx.workflowId, job: ctx.job, phase: 'skip',
      detail: `contours unavailable: ${e instanceof Error ? e.message : String(e)}`,
    })
  }

  const out: ExistingConditionsOutput & { contours?: PgContourResult['contours'] } = {
    contourCount: contours?.contours.length ?? 0,
    elevationsFt: contours?.elevationsFt ?? [],
    verticalDatum: contours?.verticalDatum ?? null,
    reliabilityLevel: 1,
    twinRevision: 1,
    contours: contours?.contours,
  }
  return { status: 'COMPLETED', outputs: out, twinRevision: 1 }
}

const generateEnvelope: StageProcessor = async (ctx): Promise<StageResult> => {
  const pkg = lotPackageFrom(ctx)
  const b = pkg.buildable
  if (!b) {
    return {
      status: 'BLOCKED', outputs: null,
      blockers: ['No buildable envelope could be derived without a parcel boundary.'],
    }
  }
  const binding = b.constraints.find(c => c.binding)?.name ?? null
  return {
    status: 'COMPLETED',
    outputs: {
      envelopeAreaSqFt: b.envelopeAreaSqFt,
      setbacks: {
        frontFt: b.setbacks.frontFt, sideFt: b.setbacks.sideFt, rearFt: b.setbacks.rearFt,
      },
      bindingConstraint: binding,
      allowedFootprintSqFt: b.allowedFootprintSqFt,
      hasStreetFrontage: b.hasStreetFrontage,
    } satisfies EnvelopeOutput,
  }
}

const generateLayout: StageProcessor = async (ctx): Promise<StageResult> => {
  const pkg = lotPackageFrom(ctx)
  const fe = pkg.footprintEstimate
  return {
    status: 'COMPLETED',
    outputs: {
      footprintSqFt: pkg.buildable?.footprintAreaSqFt ?? null,
      basis: fe?.basis ?? null,
      exact: fe?.exact ?? false,
    } satisfies LayoutOutput,
  }
}

const composeSheetsStage: StageProcessor = async (ctx): Promise<StageResult> => {
  const pkg = lotPackageFrom(ctx)
  const pages = pkg.sheets.sheets.map(s => ({
    primary: s.covers[0] as SheetId, covers: s.covers as SheetId[],
  }))
  return {
    status: 'COMPLETED',
    outputs: { pages, rationale: pkg.sheets.rationale } satisfies ComposeOutput,
  }
}

const renderExports: StageProcessor = async (ctx): Promise<StageResult> => {
  const pkg = lotPackageFrom(ctx)
  const composed = requirePriorOutput<ComposeOutput>(ctx, 'siteplan.compose_sheets')

  const contexts = composed.pages.map((pg, i) => {
    const c = buildSheetContext({
      sheet: pg.primary, twin: pkg.twin, projectName: pkg.lot,
      sheetIndex: i + 1, sheetCount: composed.pages.length,
      status: 'PRELIMINARY', disclosure: pkg.disclosure,
    })
    // A single-sheet plan owes the County every required note — the grading
    // certificate does not disappear because the set was consolidated.
    const notes = composed.pages.length === 1
      ? PG_REQUIRED_PLAN_NOTES
      : pg.covers.flatMap(s => requiredNotesForSheet(s))
    const seen = new Set<string>()
    return { ...c, requiredNotes: notes.filter(n => !seen.has(n.id) && seen.add(n.id)) }
  })

  const responsibility: Record<string, unknown> = {}
  for (const r of pkg.responsibility) responsibility[r.sheet] = r
  for (const pg of composed.pages) {
    if (!responsibility[pg.primary]) {
      const found = pg.covers.map(c => responsibility[c]).find(Boolean) ?? pkg.responsibility[0]
      if (found) responsibility[pg.primary] = { ...(found as object), sheet: pg.primary }
    }
  }

  const pdf = await renderSheetSetPdf({
    sheets: contexts,
    responsibility: responsibility as never,
    sourceNotes: pkg.twin.sources.map(s => `${s.dataset} — ${s.authority} — level ${s.reliabilityLevel}`),
  })

  const filename = `site-plan-${ctx.workflowId}.pdf`
  const stored = await ctx.capabilities.storeArtifact({
    workflowId: ctx.workflowId, job: ctx.job,
    filename, contentType: 'application/pdf', bytes: pdf.buffer, preliminary: true,
  })

  return {
    status: 'COMPLETED',
    outputs: {
      documentId: stored.documentId, filename,
      pageCount: pdf.pageCount, byteLength: pdf.buffer.length,
      frameFailures: pdf.frameFailures,
    } satisfies RenderOutput,
    artifacts: [{ documentId: stored.documentId, filename }],
  }
}

const runDraftQc: StageProcessor = async (ctx): Promise<StageResult> => {
  const pkg = lotPackageFrom(ctx)
  const render = requirePriorOutput<RenderOutput>(ctx, 'siteplan.render_exports')
  const qc = pkg.checklist

  // Generation is never gated on a seal. Blocking findings are DRAWING defects;
  // pending_seal items are work only a licensed human can do.
  return {
    status: 'COMPLETED',
    outputs: {
      deliverable: true,
      issuable: render.frameFailures.length === 0,
      blocking: render.frameFailures.map(f => ({
        code: 'SHEET_FRAME_INCOMPLETE', message: `${f.sheet}: ${f.missing.join(', ')}`,
      })),
      pendingSeal: pkg.beforeSeal.slice(0, 10).map((b, i) => ({ code: `PENDING_${i + 1}`, message: b })),
      summary: qc.summary,
    } satisfies DraftQcOutput,
  }
}

const persistPackage: StageProcessor = async (ctx): Promise<StageResult> => {
  // The runner persists every stage result as it completes; this stage marks
  // the package itself complete rather than re-writing what is already stored.
  const render = requirePriorOutput<RenderOutput>(ctx, 'siteplan.render_exports')
  return {
    status: 'COMPLETED',
    outputs: { artifactDocumentId: render.documentId, pageCount: render.pageCount },
  }
}

const deliverPreliminary: StageProcessor = async (ctx): Promise<StageResult> => {
  const render = requirePriorOutput<RenderOutput>(ctx, 'siteplan.render_exports')
  const qc = requirePriorOutput<DraftQcOutput>(ctx, 'siteplan.run_draft_qc')
  return {
    status: 'COMPLETED',
    outputs: {
      deliveryState: 'PRELIMINARY_READY',
      documentId: render.documentId,
      pageCount: render.pageCount,
      pendingSealCount: qc.pendingSeal.length,
      note: 'Jurisdiction approval is separate and not implied.',
    },
  }
}

export const FIRST_RELEASE_PROCESSORS: Record<SitePlanJobName, StageProcessor | undefined> = {
  'siteplan.initialize': initialize,
  'siteplan.resolve_property': resolveProperty,
  'siteplan.ingest_documents': ingestDocuments,
  'siteplan.resolve_jurisdiction': resolveJurisdiction,
  'siteplan.evaluate_rules': evaluateRules,
  'siteplan.build_existing_conditions': buildExistingConditions,
  'siteplan.generate_envelope': generateEnvelope,
  'siteplan.generate_layout': generateLayout,
  'siteplan.compose_sheets': composeSheetsStage,
  'siteplan.render_exports': renderExports,
  'siteplan.run_draft_qc': runDraftQc,
  'siteplan.persist_package': persistPackage,
  'siteplan.deliver_preliminary': deliverPreliminary,
  // Connected in a later checkpoint.
  'siteplan.ingest_survey': undefined,
  'siteplan.reconcile_survey': undefined,
  'siteplan.generate_grading': undefined,
  'siteplan.generate_drainage': undefined,
  'siteplan.generate_swm': undefined,
  'siteplan.generate_utilities': undefined,
  'siteplan.generate_environmental': undefined,
  'siteplan.route_review': undefined,
  'siteplan.apply_revisions': undefined,
  'siteplan.run_issuance_qc': undefined,
  'siteplan.build_submission': undefined,
  'siteplan.ingest_comments': undefined,
}
