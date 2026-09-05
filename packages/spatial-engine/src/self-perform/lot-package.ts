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

import { createSiteTwin, addFeatures, addSource, ringAreaSqFt, type SiteTwin, type Ring, type Position } from '../site-plan/site-twin'
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
import { generateDesign } from '../site-plan/design'
import { deriveSiteImprovements, type SiteImprovementResult } from '../site-plan/site-improvements'
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
  /** Abutting parcels, lettered with number and area as an approved plan does. */
  adjacentParcels?: { ring: Ring; areaSqFt: number; propId: string | null }[]
  /**
   * What the recorded plat says, carried onto the sheet.
   *
   * Reference and NOTES only. A surveyor's certificate and an owner's
   * dedication attach to THAT instrument — reproducing them here would assert
   * a certification nobody made about this drawing, which is the same reason
   * the platform never seals. The notes are different: they are conditions of
   * approval that run with the land, and a reviewer expects to see them.
   */
  platRecord?: {
    reference: string
    notes: string[]
    legend?: string[]
  }
  /** USDA soil map units, Sec. 32-130(a)(13). */
  soils?: { mapUnitSymbol: string; mapUnitName: string; kFactor: string | null
            hydricRating: string | null; hydrologicGroup: string | null
            drainageClass: string | null }[]
  /**
   * Recorded easements burdening the lot, Sec. 32-130(a)(6).
   *
   * `undefined` means NOT ASKED and `[]` means asked and none found — the
   * missing-information report tells them apart, because 'no easements' is a
   * statement a permit set carries and an unasked question is not one.
   */
  easements?: {
    ring: Ring
    easementType: string
    beneficiary?: string
    recordReference?: string
    widthFt?: number
  }[]
  /**
   * On a triangular lot, treat every non-front boundary as a SIDE yard.
   *
   * A determination made by a person, carried into the drawing and labelled as
   * such. See `triangleRearAsSide` on the envelope.
   */
  triangleRearAsSide?: boolean
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

  /** Driveway, walks and other proposed site development. */
  siteImprovements: SiteImprovementResult | null
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
/**
 * Ray casting, with boundary points counted as inside.
 *
 * A design feature that shares a vertex with the lot line — a drainage area
 * drawn to the parcel, say — must not be discarded for touching it.
 */
function pointInPolygon(pt: Position, poly: Position[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    // On an edge, within a hair's breadth: treat as inside.
    const onEdge = Math.abs((xj - xi) * (pt[1] - yi) - (pt[0] - xi) * (yj - yi)) < 1e-6
      && Math.min(xi, xj) - 1e-6 <= pt[0] && pt[0] <= Math.max(xi, xj) + 1e-6
      && Math.min(yi, yj) - 1e-6 <= pt[1] && pt[1] <= Math.max(yi, yj) + 1e-6
    if (onEdge) return true
    if ((yi > pt[1]) !== (yj > pt[1])
      && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Andrew's monotone chain. */
function convexHull(pts: Position[]): Position[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (p.length < 3) return p
  const cross = (o: Position, a: Position, b: Position) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (src: Position[]) => {
    const out: Position[] = []
    for (const q of src) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop()
      out.push(q)
    }
    out.pop()
    return out
  }
  return [...half(p), ...half([...p].reverse())]
}

/**
 * Limits of disturbance around the proposed work.
 *
 * Sec. 32-130(a)(4) requires the limits AND the disturbed-area calculation, and
 * the 5,000 sq ft threshold decides whether sediment-control and stormwater
 * review apply at all. With no polygon the disturbance read NOT QUANTIFIED and
 * the gate sat INDETERMINATE forever.
 *
 * The hull of the proposed work, pushed out by a working margin. Vertices are
 * offset from the hull centroid, which OVER-states slightly at corners — and
 * over-stating is the safe direction here, the same reasoning that makes an
 * indeterminate disturbance count as triggered. Clipped to the parcel, because
 * disturbance beyond the property is a different permit.
 */
function limitsOfDisturbance(
  work: Position[], parcel: Position[], marginFt: number,
): Ring | null {
  if (work.length < 3) return null
  const hull = convexHull(work)
  if (hull.length < 3) return null
  const cx = hull.reduce((a, q) => a + q[0], 0) / hull.length
  const cy = hull.reduce((a, q) => a + q[1], 0) / hull.length
  const grown = hull.map(q => {
    const dx = q[0] - cx, dy = q[1] - cy
    const d = Math.hypot(dx, dy) || 1
    const k = (d + marginFt) / d
    return [cx + dx * k, cy + dy * k] as Position
  })
  // Never past the property line.
  const clipped = grown.map(q => (pointInPolygon(q, parcel) ? q : null))
  if (clipped.some(q => q === null)) {
    const safe = grown.filter(q => pointInPolygon(q, parcel))
    if (safe.length < 3) return { coordinates: [...hull, hull[0]] }
    return { coordinates: [...safe, safe[0]] }
  }
  return { coordinates: [...grown, grown[0]] }
}

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
    // A recorded plat names itself in the source table. `provenance` only
    // distinguishes surveyed from compiled, so a plat-derived boundary and a
    // field survey both printed "Parcel boundary — survey" and the sheet gave
    // no way to tell which one a reviewer was holding.
    authority: lot.platRecord?.reference ?? boundary?.authority ?? 'No boundary source',
    dataset: lot.platRecord
      ? 'Parcel boundary — recorded plat'
      : boundary
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
    // Clipped SEGMENT-BY-SEGMENT. A vertex filter drops the far end of any
    // segment that crosses the boundary, so a contour entering the lot appears
    // to stop short and the surface reads as incomplete. Keeping a segment when
    // EITHER end is inside carries the line to the edge of the strip.
    const clip = (path: [number, number][]): [number, number][][] => {
      const out: [number, number][][] = []
      let run: [number, number][] = []
      for (let i = 0; i < path.length - 1; i++) {
        const A = path[i], B = path[i + 1]
        if (near(A) || near(B)) {
          if (run.length === 0) run.push(A)
          run.push(B)
        } else if (run.length) { out.push(run); run = [] }
      }
      if (run.length >= 2) out.push(run)
      return out
    }
    lot = {
      ...lot,
      contours: lot.contours.flatMap(c =>
        clip(c.path).map(path => ({ ...c, path }))),
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
  let siteImprovements: SiteImprovementResult | null = null
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
      // Classify against the ADDRESS street, not every centreline in range.
      // A cross street a block away pulled the front-lot-line assignment onto
      // the wrong edge and put the dwelling 21.7 ft from a line needing 25.
      streetPaths: (() => {
        const all = lot.streets ?? []
        if (!all.length) return null
        const token = lot.address.replace(/^[0-9]+\s+/, '').split(/\s+/)[0]?.toUpperCase() ?? ''
        const onAddress = token
          ? all.filter(s => (s.name ?? '').toUpperCase().includes(token))
          : []
        return (onAddress.length ? onAddress : all).flatMap(s => s.paths)
      })(),
      // No programme means no requested size, so only zoning limits the box.
      maxFootprintSqFt: footprintEstimate?.footprintSqFt ?? Number.POSITIVE_INFINITY,
      // A stated width x depth carries its PROPORTION through, not just its
      // area. Area alone let the envelope reshape the house.
      footprintAspect: lot.programme?.footprintWidthFt && lot.programme?.footprintDepthFt
        ? lot.programme.footprintWidthFt / lot.programme.footprintDepthFt
        : undefined,
      footprintStated: Boolean(lot.programme?.footprintWidthFt && lot.programme?.footprintDepthFt),
      triangleRearAsSide: lot.triangleRearAsSide,
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
    // ── Proposed site development ─────────────────────────────────────────
    // Sec. 32-130(a)(10) requires the size and location of all proposed site
    // development, and (a)(4) the disturbed-area calculation. A dwelling alone
    // satisfies neither — the driveway is usually the second-largest
    // impervious area on an infill lot.
    if (buildable.footprint) {
      siteImprovements = deriveSiteImprovements({
        parcel: ring,
        footprint: buildable.footprint,
        edgeYards: buildable.edgeYards,
        hasGarage: Boolean(lot.programme?.garage && lot.programme.garage !== 'none'),
        // The apron and the public walk are outside the property line and
        // cannot be placed without the street.
        streetPaths: lot.streets?.flatMap(st => st.paths) ?? null,
      })
      for (const imp of siteImprovements.improvements) {
        feats.push({
          kind: 'Pavement', id: imp.id, ring: imp.ring,
          attributes: { label: imp.label, areaSqFt: imp.areaSqFt, note: imp.note, improvement: imp.kind },
          ...base,
        })
      }
    }

    if (feats.length) twin = addFeatures(twin, feats as never[])

    // Proposed design — grading, drainage, stormwater, sediment control,
    // utilities, paving and planting.
    //
    // `blocksFromFeatures` maps FEATURES to canonical sheets, so a discipline
    // with nothing on the twin produces no sheet. That is why a permit set
    // arrived as C-100 and C-200 alone while the engine had already computed
    // the rest and discarded it. PG requires those sheets, so the design
    // belongs in the package. Every generated feature carries sourceId
    // 'design', so a reviewer can still tell what Kealee drew from what was
    // measured.
    // The front lot line, from the STREET-based edge classification. Service
    // runs and the driveway start here rather than at an arbitrary vertex.
    const frontEdge = buildable.edgeYards?.indexOf('front') ?? -1
    const frontPoint = frontEdge >= 0
      ? ((): Position => {
          const pts = ring.coordinates
          const a = pts[frontEdge], b = pts[(frontEdge + 1) % pts.length]
          return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
        })()
      : undefined
    // Limits of disturbance around the proposed work.
    //
    // Sec. 32-130(a)(4) requires the limits AND the disturbed-area figure. With
    // no polygon the disturbance read NOT QUANTIFIED and the 5,000 sq ft gate
    // sat INDETERMINATE forever — and the sediment-control sheet had nothing to
    // draw, because `generateDesign` keys silt fence and the stabilized
    // construction entrance off this feature.
    const workPts: Position[] = [
      ...(buildable?.footprint?.coordinates ?? []),
      ...(siteImprovements?.improvements.flatMap(i => i.ring.coordinates) ?? []),
    ] as Position[]
    const lodRing = limitsOfDisturbance(workPts, ring.coordinates as Position[], 10)
    if (lodRing) {
      twin = addFeatures(twin, [{
        kind: 'LimitOfDisturbance', id: 'lod', ring: lodRing,
        attributes: { note: 'Limits of disturbance — proposed work plus a 10 ft working margin, clipped to the property line.' },
        ...base,
      }] as never[])
    }

    const design = generateDesign({
      twin,
      contourIntervalFt: lot.contours?.length ? 2 : undefined,
      frontPoint,
      envelope: buildable.ring ?? undefined,
    })

    // Two filters, both about not drawing something wrong on a sheet a
    // reviewer reads.
    //
    // PAVEMENT is dropped because `deriveSiteImprovements` above already
    // derives the driveway and leadwalk from the front edge normal and the
    // garage face. The design module places its driveway from
    // `site.coordinates[0]` — an arbitrary parcel VERTEX — so merging both put
    // two driveways on the lot and ran one of them off the property.
    //
    // CONTAINMENT is required because the remaining placements are heuristics:
    // a practice at the low corner plus an offset, trees at the centroid plus
    // 30 ft. On a small infill lot those land outside the boundary. A feature
    // drawn past the lot line is worse than an absent one — it is a defect a
    // reviewer rejects, and the missing-information report already records
    // what is not yet designed.
    const parcelRing = ring.coordinates
    const contained = (f: { ring?: Ring; line?: Position[]; point?: Position }): boolean => {
      const pts = f.ring?.coordinates ?? f.line ?? (f.point ? [f.point] : [])
      return pts.every(pt => pointInPolygon(pt, parcelRing))
    }
    const drawable = design.features.filter(
      f => f.kind !== 'Pavement' && contained(f as never),
    )
    if (drawable.length) twin = addFeatures(twin, drawable as never[])
    // Carried on the twin so the sheet's SITE DATA table can print required
    // versus provided without re-deriving anything.
    // The SOURCE is recorded whenever the layer was queried, including when it
    // came back empty. `undefined` is not asked and `[]` is asked-and-clear;
    // without the source record the report cannot tell them apart, and 'no
    // easements of record' is a much stronger statement than 'we did not look'.
    if (lot.easements !== undefined) {
      twin = addSource(twin, gisSourceRecord({
        sourceId: 'easements',
        authority: 'PGAtlas Easement (platted)',
        dataset: 'Recorded easements — platted',
        crs: 'EPSG:2248', horizontalDatum: 'NAD83',
      }))
      if (lot.easements.length) twin = addFeatures(twin, lot.easements.map((e, i) => ({
        kind: 'Easement', id: `esmt-${i}`,
        ring: e.ring,
        easementType: e.easementType,
        ...(e.beneficiary ? { beneficiary: e.beneficiary } : {}),
        ...(e.recordReference ? { recordReference: e.recordReference } : {}),
        ...(e.widthFt != null ? { widthFt: e.widthFt } : {}),
      })) as never[])
    }
    if (lot.soils?.length) twin = { ...twin, soils: lot.soils } as typeof twin
    if (lot.streets?.length) twin = { ...twin, streets: lot.streets } as typeof twin
    if (lot.adjacentParcels?.length) {
      twin = { ...twin, adjacentParcels: lot.adjacentParcels } as typeof twin
    }
    if (lot.platRecord) twin = { ...twin, platRecord: lot.platRecord } as typeof twin
    twin = { ...twin, buildableEnvelope: {
      setbacks: buildable.setbacks,
      coveragePct: extractLotCoveragePct(zoningEnvelope.standards),
      allowedFootprintSqFt: buildable.allowedFootprintSqFt,
      hasStreetFrontage: buildable.hasStreetFrontage,
      frontage: buildable.frontage,
      edgeYards: buildable.edgeYards,
    } } as typeof twin
  }

  // Quantify what the engine has ALREADY COMPUTED.
  //
  // This took `lot.disturbance ?? {}` — nothing — so every component read null
  // and the total read NOT QUANTIFIED, while the footprint and the driveway
  // were sitting in this same function. Sec. 32-130(a)(4) requires the
  // disturbed-area calculation, and the 5,000 sq ft threshold decides whether
  // sediment-control and stormwater review apply at all.
  //
  // A caller's explicit figure still wins: it may come from a designer who
  // knows the staging and stockpile areas this cannot see. What stays null
  // stays null — null means NOT YET KNOWN and is not the same as zero, which
  // is why an indeterminate total still counts as over the threshold.
  const lodFeature = twin.features.find(f => f.kind === 'LimitOfDisturbance') as
    { ring?: Ring } | undefined
  const swmFeature = twin.features.find(f => f.kind === 'SWMPractice') as
    { attributes?: Record<string, unknown> } | undefined
  const utilityLengthFt = twin.features
    .filter(f => f.kind === 'Utility')
    .reduce((sum, f) => {
      const l = (f as { line?: Position[] }).line ?? []
      let d = 0
      for (let i = 1; i < l.length; i++) d += Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1])
      return sum + d
    }, 0)

  const derivedDisturbance: Partial<DisturbanceComponents> = {
    buildingFootprintSqFt: buildable?.footprintAreaSqFt ?? null,
    drivewaySqFt: siteImprovements
      ? siteImprovements.improvements.reduce((sum, i) => sum + i.areaSqFt, 0)
      : null,
    // The graded area is the limit of disturbance itself.
    gradingSqFt: lodFeature?.ring ? ringAreaSqFt(lodFeature.ring) : null,
    // A 3 ft trench is the ordinary residential service width. Stated, not
    // measured — a designer's figure replaces it.
    utilityTrenchesSqFt: utilityLengthFt > 0 ? Math.round(utilityLengthFt * 3) : null,
    stormwaterFacilitiesSqFt: swmFeature?.attributes?.footprintSqFt != null
      ? Number(swmFeature.attributes.footprintSqFt)
      : null,
  }
  const disturbanceComponents = {
    ...derivedDisturbance,
    ...(lot.disturbance ?? {}),
  }
  const disturbance = calculateDisturbance(disturbanceComponents)
  const permitPath = classifyProject({
    zoneCode: lot.zoneCode,
    overlayCodes: lot.overlayCodes,
    proposedUse: lot.proposedUse,
    dwellingUnitCount: lot.dwellingUnitCount,
    isResidentialSingleFamily: lot.isResidentialSingleFamily,
    demolition: lot.demolition,
    createsNewLots: lot.createsNewLots,
    newLotCount: lot.newLotCount,
    // The SAME disturbance the report and the drawing use. This read
    // `lot.disturbance` — the caller's figure alone — so the permit path was
    // classified against an unquantified project while `disturbance` above
    // held real numbers. The two then disagreed: the drawing printed a
    // quantified total and the missing-information report went on demanding
    // the components it had just been given.
    disturbance: disturbanceComponents,
  })

  const envelope = zoningEnvelope
  const missingInformation = buildMissingInformationReport(twin, permitPath)

  const blocks = blocksFromFeatures(twin.features)
  // One sheet per discipline. A permit submission is read by a different
  // reviewer per subject — DPIE Site/Road for grading and drainage, the Soil
  // Conservation District for sediment control, M-NCPPC for landscape — and
  // each signs the sheet carrying their scope. Merging five disciplines onto
  // one page saves paper and costs the reviewer the sheet they are meant to
  // stamp.
  //
  // The composer's greedy merge stays available for a diagnostic or a quick
  // look; it is not what a jurisdiction receives.
  const sheets = composeSheets({ blocks, forceFullSet: true })
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
  // A FOOTPRINT ON AN EASEMENT.
  //
  // The buildable envelope is cut from setbacks alone, so an easement crossing
  // the envelope does not move the building — and a dwelling drawn over a
  // public utility easement renders exactly like a compliant one. The placement
  // is not silently changed here, because which way a building shifts is a
  // design decision; the conflict is stated instead, before anyone seals it.
  const footprintRing = buildable?.footprint?.coordinates
  if (footprintRing) {
    for (const e of twin.features.filter(f => f.kind === 'Easement')) {
      const er = (e as { ring?: Ring }).ring?.coordinates
      if (!er) continue
      const hits = footprintRing.filter(pt => pointInPolygon(pt, er)).length
      if (hits === 0) continue
      const kind = (e as { easementType?: string }).easementType ?? 'easement'
      const ref = (e as { recordReference?: string }).recordReference
      beforeSeal.push(
        `The building footprint encroaches on a ${kind} easement` +
        `${ref ? ` (${ref})` : ''}. Relocate the dwelling clear of it, or obtain a release ` +
        'from the beneficiary. An easement runs with the land and survives a building permit.',
      )
    }
  }
  if (!envelope.found) beforeSeal.push(envelope.caution)
  // Envelope caveats that a REVIEWER must act on, not just read on the sheet.
  // The triangular-lot rear line decides how much of the lot is buildable and
  // the engine has taken the restrictive reading; that belongs in front of
  // whoever seals the drawing, not only in the caveat block.
  for (const c of buildable?.caveats ?? []) {
    if (/TRIANGULAR LOT|DOES NOT FIT/.test(c)) beforeSeal.push(c)
  }
  // Every REQUIRED item, not the first five. This was sliced to 5, so a list
  // longer than that dropped its tail silently — and the tail is not the
  // unimportant end, it is whatever the report happened to append last. An
  // omitted easement or an unquantified component reads identically to one
  // that was never raised. Recommended items stay out of the seal list; they
  // are in `missingInformation` for anyone who wants them.
  //
  // The unquantified components are named ONCE, by the summary above. Three
  // sources describe the same five unknowns — the summary, one
  // `Disturbance area — X` per component from the report, and one
  // `Quantify: X` per component from the applicability review — so an
  // unfiltered list read as fifteen problems when there are four, and the
  // repetition trains a reader to skim exactly the list that must be read.
  const namedByTheSummary = disturbance.indeterminate
  for (const item of missingInformation.items) {
    if (item.severity !== 'required') continue
    if (namedByTheSummary && item.key.startsWith('disturbance:')) continue
    if (namedByTheSummary && /^open:Quantify:/.test(item.key)) continue
    beforeSeal.push(`${item.label} (${item.responsible}): ${item.why}`)
  }  beforeSeal.push(
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
    siteImprovements,
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
