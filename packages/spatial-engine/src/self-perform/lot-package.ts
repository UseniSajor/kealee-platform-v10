/**
 * Self-perform lot packages.
 *
 * The customer path runs through an order, a payment and a webhook. None of
 * that is needed to use the engine on your own lots, and for infill work the
 * fastest route to value is to skip it: describe the lot, get the permit path,
 * the zoning envelope, the disturbance determination, the list of what a
 * professional will still need, and a drawable sheet set.
 *
 * What this CANNOT do, stated once here so it is never implied elsewhere: it
 * does not make a lot permit-ready. Prince George's County will not accept a
 * plan drawn off a tax map, and the platform drafts while a licensed
 * professional seals. What it removes is the repeated research — and across
 * several lots in one jurisdiction, that research happens once.
 */

import { createSiteTwin, addFeatures, addSource, ringAreaSqFt, type SiteTwin, type Ring } from '../site-plan/site-twin'
import { gisSourceRecord, LEVEL_1_DISCLOSURE, type ReliabilityLevel } from '../site-plan/reliability'
import { classifyProject, type ApplicabilityReport } from '../site-plan/classification'
import { calculateDisturbance, type DisturbanceComponents, type DisturbanceResult } from '../site-plan/disturbance'
import { buildMissingInformationReport, type MissingInformationReport } from '../site-plan/reports'
import { buildCountyChecklist, type CountyChecklist } from '../review/checklist'
import { composeSheets, blocksFromFeatures, type CompositionResult } from '../sheets/composer'
import { buildResponsibilityBlock, type DividedResponsibilityBlock } from '../review/content-scope'
import { getPgDimensionalStandards, parsePgStandardValue } from '../jurisdictions/pg-overlays-and-dimensions'
import type { SheetId } from '../sheets/sheet-template'

/** Everything you know about a lot before a surveyor has been out. */
export interface LotInput {
  name: string
  address: string
  jurisdictionCode: string
  zoneCode: string
  overlayCodes?: string[]

  /** Supply a ring in EPSG:2248 if you have one. */
  boundary?: Ring
  /** Otherwise a rectangle is assumed, purely so a sheet can be laid out. */
  lotWidthFt?: number
  lotDepthFt?: number
  lotAreaSqFt?: number

  proposedUse?: string
  dwellingUnitCount?: number
  isResidentialSingleFamily?: boolean
  demolition?: boolean
  createsNewLots?: boolean
  newLotCount?: number

  /** Disturbance components in sq ft. Omit a value you do not know. */
  disturbance?: Partial<DisturbanceComponents>
}

export interface ZoningEnvelope {
  zone: string
  found: boolean
  standards: { standard: string; useColumn: string; printed: string; numeric: number | null; footnotes: string[] }[]
  section: string | null
  citation: string | null
  caution: string
}

export interface LotPackage {
  lot: string
  address: string
  jurisdiction: string
  twin: SiteTwin
  governingLevel: ReliabilityLevel
  disclosure: string | null

  permitPath: ApplicabilityReport
  disturbance: DisturbanceResult
  envelope: ZoningEnvelope
  missingInformation: MissingInformationReport
  checklist: CountyChecklist
  sheets: CompositionResult
  responsibility: DividedResponsibilityBlock[]

  /** What must happen before a professional will seal this. */
  beforeSeal: string[]
  summary: string
}

/**
 * Where a lot's boundary may come from.
 *
 * There is deliberately no fourth option. An earlier version of this file
 * synthesised a rectangle from lot width and depth when nothing else was
 * available, which was wrong: the area was whatever you typed and the position
 * and shape were invented, yet it drew on the sheet looking exactly like a
 * parcel boundary. Fabricated geometry that renders as authoritative is worse
 * than no geometry, because nothing downstream can tell the difference.
 */
export type BoundaryProvenance = 'survey' | 'jurisdiction_gis' | 'none'

export interface ResolvedBoundary {
  ring: Ring
  provenance: BoundaryProvenance
  /** Who published it and when, for the source-and-accuracy note. */
  authority: string
  retrievedAt: string
}

/**
 * Resolves a parcel boundary from a jurisdiction GIS service.
 *
 * NOT WIRED YET, and the reason is worth recording. PGAtlas
 * (gisdata.pgplanning.org) publishes zoning, address points and overlays but no
 * parcel service — checked across its Layers and Map_Services folders. Maryland
 * parcel geometry is statewide MD iMAP property data, and the endpoint has not
 * been confirmed. Until one is, this returns null and the caller gets no parcel
 * rather than a plausible-looking rectangle.
 */
export async function resolveParcelBoundary(
  _lot: Pick<LotInput, 'address' | 'jurisdictionCode'>,
  resolver?: (lot: Pick<LotInput, 'address' | 'jurisdictionCode'>) => Promise<ResolvedBoundary | null>,
): Promise<ResolvedBoundary | null> {
  if (!resolver) return null
  return resolver(_lot)
}

/** Reads the published envelope for a zone, keeping footnotes attached. */
export function readZoningEnvelope(zoneCode: string): ZoningEnvelope {
  const lookup = getPgDimensionalStandards(zoneCode)
  if (!lookup.table) {
    return {
      zone: zoneCode, found: false, standards: [], section: null, citation: null,
      caution:
        `No published dimensional table for ${zoneCode}. Sec. 27-4205 publishes none for the legacy ` +
        'comprehensive-design zones — the envelope comes from the parcel\'s prior approved plan, not ' +
        'from the ordinance.',
    }
  }

  const standards: ZoningEnvelope['standards'] = []
  for (const row of lookup.table.rows) {
    row.values.forEach((printed, i) => {
      const v = (printed ?? '').trim()
      if (!v || v === '—' || v === '-') return
      const parsed = parsePgStandardValue(v)
      standards.push({
        standard: row.standard,
        useColumn: lookup.table!.useColumns[i] ?? `column ${i + 1}`,
        printed: v,
        numeric: parsed.numeric,
        footnotes: parsed.footnotes,
      })
    })
  }

  const withFootnotes = standards.filter(s => s.footnotes.length > 0).length
  return {
    zone: zoneCode,
    found: true,
    standards,
    section: lookup.table.section,
    citation: lookup.provenance?.citation ?? null,
    caution:
      withFootnotes > 0
        ? `${withFootnotes} of ${standards.length} published values carry a footnote. A footnote can ` +
          'replace the table value outright, so none of these is the requirement for a specific lot ' +
          'until the footnote is read.'
        : 'No footnotes on the published values for this zone.',
  }
}

/**
 * Builds a package for one lot.
 *
 * Everything rests on Level 1 GIS unless a surveyed boundary is supplied, and
 * the package says so. That is not a hedge — it is the reason DPIE would reject
 * the drawing, and stating it is what keeps the output honest enough to hand to
 * a professional.
 */
export function buildLotPackage(lot: LotInput, resolved?: ResolvedBoundary | null): LotPackage {
  // A survey wins; a GIS parcel is second; nothing is third. Nothing is a real
  // and common answer and it produces a package with no drawn boundary.
  const boundary: ResolvedBoundary | null = lot.boundary
    ? { ring: lot.boundary, provenance: 'survey', authority: 'Supplied with the lot', retrievedAt: new Date().toISOString() }
    : resolved ?? null
  const surveyed = boundary?.provenance === 'survey'
  const ring = boundary?.ring ?? null
  const areaSqFt = lot.lotAreaSqFt ?? (ring ? ringAreaSqFt(ring) : null)

  let twin = createSiteTwin({
    siteId: lot.name, projectId: lot.name, organizationId: 'self-perform',
    address: lot.address, jurisdictionCode: lot.jurisdictionCode,
    crs: 'EPSG:2248', horizontalDatum: 'NAD83', verticalDatum: null,
  })
  twin = addSource(twin, gisSourceRecord({
    sourceId: 'gis1',
    authority: boundary?.authority ?? 'No boundary source',
    dataset: boundary
      ? `Parcel boundary — ${boundary.provenance.replace(/_/g, ' ')}`
      : 'No parcel boundary obtained',
    crs: 'EPSG:2248', horizontalDatum: 'NAD83',
  }))
  twin = { ...twin, zoneCode: lot.zoneCode, overlayCodes: lot.overlayCodes ?? [] }

  const base = { sourceId: 'gis1', reliabilityLevel: 1 as const, crs: 'EPSG:2248', revision: 1 }
  if (ring) {
    twin = addFeatures(twin, [
      { kind: 'Parcel', id: 'parcel', parcelId: lot.name, ring, areaSqFt, ...base } as never,
    ])
  }

  const permitPath = classifyProject({
    zoneCode: lot.zoneCode,
    overlayCodes: lot.overlayCodes,
    proposedUse: lot.proposedUse,
    dwellingUnitCount: lot.dwellingUnitCount,
    isResidentialSingleFamily: lot.isResidentialSingleFamily,
    demolition: lot.demolition,
    createsNewLots: lot.createsNewLots,
    newLotCount: lot.newLotCount,
    disturbance: lot.disturbance,
  })

  const disturbance = calculateDisturbance(lot.disturbance ?? {})
  const envelope = readZoningEnvelope(lot.zoneCode)
  const missingInformation = buildMissingInformationReport(twin, permitPath)

  const blocks = blocksFromFeatures(twin.features)
  const sheets = composeSheets({ blocks })
  const coveredSheets = [...new Set(sheets.sheets.flatMap(s => s.covers))] as SheetId[]
  const checklist = buildCountyChecklist({ twin, applicability: permitPath, sheets: coveredSheets })

  const responsibility = sheets.sheets.map(s =>
    buildResponsibilityBlock({
      sheet: s.covers[0] as SheetId,
      features: s.blocks.flatMap(b => b.features),
    }),
  )

  const beforeSeal: string[] = []
  if (!ring) {
    beforeSeal.push(
      'No parcel boundary. Nothing is drawn, because a boundary invented from a lot width and depth ' +
      'renders exactly like a real one and nothing downstream could tell them apart. Supply a survey, ' +
      'or wire a jurisdiction GIS parcel service — PGAtlas publishes zoning and address points but no ' +
      'parcel layer, so Maryland parcels come from statewide MD iMAP property data.',
    )
  }
  if (ring && !surveyed) {
    beforeSeal.push(
      'A boundary and topographic survey by a Maryland licensed surveyor. The boundary here is GIS, ' +
      'which is compiled rather than surveyed. In testing, county GIS was 4.3 ft off the surveyed ' +
      'boundary and a front setback flipped from compliant to non-compliant once corrected.',
    )
  }
  if (disturbance.indeterminate) {
    beforeSeal.push(
      `Quantify the unknown disturbance components (${disturbance.unknownComponents.join(', ')}). ` +
      'Until then the 5,000 sq ft determination is not defensible either way, and it decides whether ' +
      'sediment control and stormwater management review apply.',
    )
  }
  if (envelope.found && envelope.standards.some(s => s.footnotes.length > 0)) {
    beforeSeal.push(
      'Read the footnotes on the dimensional table. A footnote can replace the printed value outright ' +
      'for a specific use or lot type.',
    )
  }
  if (!envelope.found) beforeSeal.push(envelope.caution)
  for (const item of missingInformation.items.slice(0, 5)) {
    beforeSeal.push(`${item.label} (${item.responsible}): ${item.why}`)
  }
  beforeSeal.push(
    'Review and seal by the professionals responsible for each subject. The platform drafts; it does ' +
    'not certify, and nothing here implies county approval.',
  )

  return {
    lot: lot.name,
    address: lot.address,
    jurisdiction: lot.jurisdictionCode,
    twin,
    governingLevel: 1,
    disclosure: LEVEL_1_DISCLOSURE,
    permitPath,
    disturbance,
    envelope,
    missingInformation,
    checklist,
    sheets,
    responsibility,
    beforeSeal,
    summary:
      `${lot.name} — ${lot.zoneCode}, ` +
      (areaSqFt != null ? `${Math.round(areaSqFt).toLocaleString()} sq ft. ` : 'area unknown (no boundary). ') +
      `Disturbance ${Math.round(disturbance.knownTotalSqFt).toLocaleString()} sq ft (` +
      (disturbance.meetsThreshold ? 'EXCEEDS' : disturbance.indeterminate ? 'INDETERMINATE against' : 'under') +
      ` the ${disturbance.thresholdSqFt.toLocaleString()} sq ft threshold). ` +
      `${sheets.sheets.length} sheet(s) at ${sheets.sheets[0]?.scaleLabel ?? 'n/a'}. ` +
      `${beforeSeal.length} item(s) outstanding before a seal.`,
  }
}

/** Builds packages for several lots, which is where the shared research shows. */
export function buildLotPackages(
  lots: LotInput[],
  /** Resolved boundaries by lot name, where any were obtained. */
  boundaries: Record<string, ResolvedBoundary | null> = {},
): {
  packages: LotPackage[]
  sharedZones: { zone: string; lots: string[] }[]
  summary: string
} {
  const packages = lots.map(l => buildLotPackage(l, boundaries[l.name] ?? null))
  const byZone = new Map<string, string[]>()
  for (const p of packages) byZone.set(p.envelope.zone, [...(byZone.get(p.envelope.zone) ?? []), p.lot])
  const sharedZones = [...byZone.entries()]
    .filter(([, l]) => l.length > 1)
    .map(([zone, lots]) => ({ zone, lots }))

  const reused = sharedZones.reduce((n, z) => n + z.lots.length - 1, 0)
  return {
    packages,
    sharedZones,
    summary:
      `${packages.length} lot(s) across ${byZone.size} zone(s). ` +
      (reused > 0
        ? `${reused} lot(s) reuse zoning research already done for another lot in the same zone.`
        : 'Every lot is in a different zone, so no zoning research is shared.'),
  }
}
