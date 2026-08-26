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
import { deriveBuildableEnvelope, extractLotCoveragePct, type BuildableEnvelope } from '../site-plan/buildable-envelope'
import { estimateFootprint, type FootprintEstimate, type HouseProgramme } from '../site-plan/footprint-programme'
import { fetchMdParcelAtPoint } from '../jurisdictions/md-imap'

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

  /**
   * Existing contours, already in EPSG:2248. Supplied BEFORE composition so the
   * composer sees the terrain and lays out the sheet set accordingly — adding
   * them afterwards produces a bare existing-conditions sheet and hides the
   * grading content the set is supposed to carry.
   */
  contours?: { elevationFt: number; path: [number, number][]; weight?: string; hidden?: boolean }[]
  verticalDatum?: string | null
  contourSourceAuthority?: string
  /** What the customer wants to build. Drives the proposed footprint. */
  programme?: HouseProgramme
  /** A point on the fronting street — identifies the front lot line. */
  streetPoint?: [number, number] | null
  /** Street centrelines to draw and letter in the right-of-way. */
  streets?: { name: string | null; paths: [number, number][][] }[]
  /** USDA soil map units, Sec. 32-130(a)(13). */
  soils?: { mapUnitSymbol: string; mapUnitName: string; kFactor: string | null
            hydricRating: string | null; hydrologicGroup: string | null
            drainageClass: string | null }[]
  /** Jurisdiction parcel identifier, printed in the SITE DATA table. */
  parcelId?: string | null
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

  /** Setback envelope, binding constraint and the drawn footprint. */
  buildable: BuildableEnvelope | null
  /** How the footprint was estimated, when the customer had no plans. */
  footprintEstimate: FootprintEstimate | null
  /**
   * The plan is ALWAYS generated and delivered. Constant `true`, stated in the
   * type so the guarantee is explicit rather than implied by the absence of a
   * gate. Nothing in generation is withheld for want of a seal.
   */
  delivered: true
  /**
   * What a licensed professional does AFTER delivery, in order to seal.
   * A worklist for the reviewer — never a precondition for producing the plan.
   */
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
  lot: Pick<LotInput, 'address' | 'jurisdictionCode'>,
  resolver?: (lot: Pick<LotInput, 'address' | 'jurisdictionCode'>) => Promise<ResolvedBoundary | null>,
): Promise<ResolvedBoundary | null> {
  if (!resolver) return null
  return resolver(lot)
}

/**
 * Resolves a Maryland lot boundary from state parcel data.
 *
 * This is what makes a survey unnecessary to RENDER. The drawing is produced
 * from the state cadastral record and labelled Level 1 throughout; a survey is
 * what makes it permit-grade, not what makes it exist.
 *
 * Takes a point already in EPSG:2248 — geocoding is the caller's job, and it
 * belongs there because the address-to-point step has its own failure modes.
 */
export async function resolveMarylandParcel(
  easting2248: number,
  northing2248: number,
  opts: { fetchImpl?: typeof fetch } = {},
): Promise<{ boundary: ResolvedBoundary | null; attributes: Awaited<ReturnType<typeof fetchMdParcelAtPoint>>['attributes']; caveat: string; candidateCount: number }> {
  const r = await fetchMdParcelAtPoint(easting2248, northing2248, opts)
  return {
    boundary: r.ring
      ? {
          ring: r.ring,
          provenance: 'jurisdiction_gis',
          authority: r.source.authority,
          retrievedAt: r.source.retrievedAt,
        }
      : null,
    attributes: r.attributes,
    caveat: r.caveat,
    candidateCount: r.candidateCount,
  }
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
      { kind: 'Parcel', id: 'parcel', parcelId: lot.parcelId ?? lot.name, ring, areaSqFt, ...base } as never,
    ])
  }

  // ── Terrain ───────────────────────────────────────────────────────────────
  if (lot.contours?.length && ring) {
    // Clip terrain to the lot plus the twenty-foot adjacent peripheral strip
    // that Sec. 32-130(a)(5) requires. Contours are fetched over a wider radius
    // so the surface is complete at the boundary; drawing all of it puts the
    // neighbourhood on the sheet and buries the lot.
    const cx = ring.coordinates.map(c => c[0]), cy = ring.coordinates.map(c => c[1])
    const PERIPHERAL_FT = 20
    const bx0 = Math.min(...cx) - PERIPHERAL_FT, bx1 = Math.max(...cx) + PERIPHERAL_FT
    const by0 = Math.min(...cy) - PERIPHERAL_FT, by1 = Math.max(...cy) + PERIPHERAL_FT
    const near = (p: [number, number]) => p[0] >= bx0 && p[0] <= bx1 && p[1] >= by0 && p[1] <= by1
    lot = {
      ...lot,
      contours: lot.contours
        .map(c => ({ ...c, path: c.path.filter(near) }))
        .filter(c => c.path.length >= 2),
    }
  }

  if (lot.contours?.length) {
    twin = addSource(twin, gisSourceRecord({
      sourceId: 'contours',
      authority: lot.contourSourceAuthority ?? 'Jurisdiction GIS',
      dataset: 'Existing contours',
      crs: 'EPSG:2248', horizontalDatum: 'NAD83',
    }))
    if (lot.verticalDatum) twin = { ...twin, verticalDatum: lot.verticalDatum }
    twin = addFeatures(twin, lot.contours.map((c, i) => ({
      kind: 'Contour', id: `ct-${i}`,
      line: c.path.map(([x, y]) => [x, y, c.elevationFt]),
      attributes: { elevationFt: c.elevationFt, weight: c.weight, hidden: c.hidden },
      ...base, sourceId: 'contours',
    })) as never[])
  }

  // ── Buildable envelope and proposed footprint ─────────────────────────────
  const zoningEnvelope = readZoningEnvelope(lot.zoneCode)
  let footprintEstimate: FootprintEstimate | null = null
  let buildable: BuildableEnvelope | null = null
  if (ring) {
    footprintEstimate = lot.programme ? estimateFootprint(lot.programme) : null
    buildable = deriveBuildableEnvelope({
      parcel: ring,
      standards: zoningEnvelope.standards,
      citation: zoningEnvelope.citation ?? 'Sec. 27-4202',
      netLotAreaSqFt: areaSqFt ?? undefined,
      streetPoint: lot.streetPoint ?? null,
      // No programme means no requested size, so only zoning limits the box.
      maxFootprintSqFt: footprintEstimate?.footprintSqFt ?? Number.POSITIVE_INFINITY,
    })
    const feats: unknown[] = []
    if (buildable.ring) {
      feats.push({ kind: 'ProposedFeature', id: 'buildable-envelope', ring: buildable.ring,
        attributes: { label: 'Buildable envelope', setbacks: buildable.setbacks }, ...base })
    }
    if (buildable.footprint) {
      feats.push({ kind: 'Building', id: 'proposed-building', existing: false, ring: buildable.footprint,
        attributes: { areaSqFt: buildable.footprintAreaSqFt, estimated: true }, ...base })
    }
    if (feats.length) twin = addFeatures(twin, feats as never[])
    // Carried on the twin so the sheet's SITE DATA table can print required
    // versus provided without re-deriving anything.
    if (lot.soils?.length) twin = { ...twin, soils: lot.soils } as typeof twin
    if (lot.streets?.length) twin = { ...twin, streets: lot.streets } as typeof twin
    twin = { ...twin, buildableEnvelope: {
      setbacks: buildable.setbacks,
      coveragePct: extractLotCoveragePct(zoningEnvelope.standards),
      allowedFootprintSqFt: buildable.allowedFootprintSqFt,
      hasStreetFrontage: buildable.hasStreetFrontage,
    } } as typeof twin
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
  const envelope = zoningEnvelope
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
      'No parcel boundary resolved for this address, so the lot outline is absent from the drawing. ' +
      'A boundary invented from a lot width and depth would render exactly like a real one and ' +
      'nothing downstream could tell them apart, so none is invented. Parcel geometry is available ' +
      'from PGAtlas (gis.pgatlas.com Property/MapServer/15) and from statewide MD iMAP; check the ' +
      'address geocoded inside the lot.',
    )
  }
  if (ring && !surveyed) {
    beforeSeal.push(
      'Certification of the boundary and topography by a Maryland licensed surveyor. The plan is ' +
      'complete and delivered; this is the review step that follows. The boundary shown is GIS, ' +
      'compiled rather than surveyed — in testing, county GIS was 4.3 ft off the surveyed line and ' +
      'a front setback flipped from compliant to non-compliant once corrected.',
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
    'Review and seal by the professionals responsible for each subject. The platform drafts a ' +
    'complete plan; the seal is a human act that follows delivery. Nothing here implies county approval.',
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
    buildable,
    footprintEstimate,
    delivered: true,
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
