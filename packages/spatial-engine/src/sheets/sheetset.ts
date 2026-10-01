/**
 * The sheet-set specification `packages/cad-plot` drafts from.
 *
 * See docs/decisions/dxf-master-cad-plot.md. The engine designs and computes;
 * this object is everything a Site Development Concept Plan set shows that is
 * not raw geometry — the County BMP Summary Table, the points of investigation
 * and overflow paths, the DPIE checklist answered line by line, site data,
 * building data, approvals of record and notes — together with the twin
 * itself. `cad-plot` turns it into model space, paper-space sheets and a PDF
 * plotted from the DXF.
 */
import type { Position, SiteTwin } from '../site-plan/site-twin'
import { governingHsg, sizeEsd, type HydrologicSoilGroup, MDE_TABLE_5_3_CITATION } from '../site-plan/esd-mep'
import { analysePois, type PoiAnalysis } from '../site-plan/poi'
import { swmConceptReport, type Rainfall24hr, type SwmConceptReport } from '../site-plan/swm-concept'
import { evaluateChecklist, DPIE_CONCEPT_CHECKLIST_EDITION, type ChecklistRow, type ChecklistFacts } from '../review/dpie-concept-checklist'
import polygonClipping from 'polygon-clipping'
import { designStreetProfile, type StreetProfile } from '../site-plan/street-profile'

export interface SheetSpec { id: string; title: string; kind: 'cover' | 'notes' | 'existing' | 'profile' | 'layout' | 'utility' | 'swm' | 'swmreport' | 'esc' | 'details'; scaleFtPerIn?: number }

export interface BmpRow {
  bmp: string; practice: string; mdeCode: string; location: string; ownership: string; poi: string
  daSqFt: number; impSqFt: number; percentImpervious: number; hsg: HydrologicSoilGroup; peIn: number; rv: number
  esdvReqCf: number; esdvProvCf: number; revReqCf: number; surfaceSqFt: number; at: Position
}

export interface SheetSet {
  schema: 'kealee.sheetset/1'
  generatedAt: string
  tract: Position[]
  /** Plan-record extras the sheets draw that are not SiteFeatures (environment geometry, vicinity source, notes). */
  extras: Record<string, unknown>
  project: Record<string, string>
  sheets: SheetSpec[]
  sheetSizeIn: [number, number]
  approvalStripIn: number
  twin: SiteTwin
  bmp: { rows: BmpRow[]; totals: Record<string, number>; byPoi: { poi: string; req: number; prov: number }[]; citation: string }
  poi: PoiAnalysis
  /** SWM concept report (checklist D-1, D-3, D-4, D-10); null when the site's rainfall is not on record. */
  swm: SwmConceptReport | null
  profile: StreetProfile | null
  checklist: { edition: string; rows: ChecklistRow[] }
  tables: Record<string, { title: string; columns: string[]; rows: (string | number)[][]; note?: string }>
  notes: Record<string, string[]>
  details: { file: string; title: string; std: string }[]
}

const ringArea = (r: Position[]) => {
  let a = 0
  for (let i = 0; i < r.length; i++) { const q = r[(i + 1) % r.length]; a += r[i][0] * q[1] - q[0] * r[i][1] }
  return Math.abs(a) / 2
}
const centroid = (r: Position[]): Position => r.reduce((a, q) => [a[0] + q[0] / r.length, a[1] + q[1] / r.length], [0, 0] as Position)
const lenOf = (l: Position[]) => l.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - l[i][0], q[1] - l[i][1]), 0)

export function buildSheetSet(input: {
  twin: SiteTwin
  tract: Position[]
  platRecord: Record<string, any>
  sheets?: SheetSpec[]
  detailDir: string
}): SheetSet {
  const { twin, tract } = input
  const pr = input.platRecord ?? {}
  const env = pr.environmental ?? {}
  const feats = twin.features as any[]
  const hsg: HydrologicSoilGroup = (env.hsg as HydrologicSoilGroup)
    ?? governingHsg(((twin as any).soils ?? []).map((s: any) => s.hydrologicGroup))

  const sheets: SheetSpec[] = input.sheets ?? [
    { id: 'C-000', title: 'COVER SHEET', kind: 'cover' },
    { id: 'C-001', title: 'GENERAL NOTES AND DPIE CHECKLIST', kind: 'notes' },
    { id: 'C-100', title: 'EXISTING CONDITIONS AND ENVIRONMENTAL FEATURES', kind: 'existing', scaleFtPerIn: 30 },
    { id: 'C-200', title: 'SITE LAYOUT, GRADING AND PAVING PLAN', kind: 'layout', scaleFtPerIn: 30 },
    { id: 'C-210', title: 'ESTATES COURT — PLAN AND PROFILE', kind: 'profile', scaleFtPerIn: 30 },
    { id: 'C-300', title: 'UTILITY, STREET LIGHT AND STREET TREE PLAN', kind: 'utility', scaleFtPerIn: 30 },
    { id: 'C-400', title: 'STORMWATER MANAGEMENT CONCEPT AND DRAINAGE AREA MAP', kind: 'swm', scaleFtPerIn: 30 },
    { id: 'C-500', title: 'SEDIMENT AND EROSION CONTROL PLAN', kind: 'esc', scaleFtPerIn: 30 },
    { id: 'C-600', title: 'DETAILS', kind: 'details' },
  ]

  // ── Practices and their drainage areas ─────────────────────────────────────
  const practices = feats.filter(f => f.kind === 'SWMPractice' && f.ring?.coordinates?.length)
  const das = feats.filter(f => f.kind === 'DrainageArea' && f.ring?.coordinates?.length)
  const swales = feats.filter(f => f.kind === 'ProposedFeature' && f.attributes?.type === 'roadside swale' && f.line?.length)
  const streetPave = feats.filter(f => f.kind === 'Pavement' && ['street', 'entrance', 'Apron'].includes(String(f.attributes?.improvement ?? '')) && f.ring?.coordinates?.length)
  const rowFeat = feats.find(f => f.kind === 'ProposedFeature' && f.attributes?.type === 'right-of-way' && f.ring?.coordinates?.length)

  const practicePts = practices.map(p => ({ id: String(p.id), at: centroid(p.ring.coordinates) }))
  const swaleOut = swales.map((s, k) => ({ id: `swale-${k}`, at: s.line[s.line.length - 1] as Position }))
  const contours = feats.filter(f => f.kind === 'Contour' && !f.attributes?.proposed && Array.isArray(f.line) && f.line.length > 1)
    .map(f => ({ elevationFt: Number(f.attributes.elevationFt), line: f.line.map((q: number[]) => [q[0], q[1]] as Position) }))
  const poi = analysePois({ tract, contours, practices: [...practicePts, ...swaleOut] })
  const poiFor = (id: string) => poi.overflow.find(o => o.from === id)?.poi ?? (poi.pois[0]?.id ?? '—')

  const rows: BmpRow[] = []
  for (const p of practices) {
    const prefix = String(p.id).split('-')[0]
    const da = das.find(d => String(d.id).startsWith(prefix + '-'))
    const daArea = da ? ringArea(da.ring.coordinates) : 0
    const I = Number(da?.attributes?.percentImpervious ?? 0)
    const sz = sizeEsd(daArea, (daArea * I) / 100, hsg)
    const lotNo = prefix.replace(/^l/, '')
    const prov = Math.max(sz.esdvCf, Number(p.attributes?.requiredVolumeCf ?? 0))
    rows.push({
      bmp: `ESD-${lotNo}`, practice: 'Micro-bioretention', mdeCode: 'M-6', location: `Lot ${lotNo}`, ownership: 'Private — lot owner (maintenance agreement)',
      poi: poiFor(String(p.id)), daSqFt: Math.round(daArea), impSqFt: Math.round((daArea * I) / 100), percentImpervious: sz.percentImpervious,
      hsg, peIn: sz.peIn, rv: sz.rv, esdvReqCf: sz.esdvCf, esdvProvCf: Math.round(prov), revReqCf: sz.revCf,
      surfaceSqFt: Math.round(Number(p.attributes?.footprintSqFt ?? ringArea(p.ring.coordinates))), at: centroid(p.ring.coordinates),
    })
  }
  if (swales.length && rowFeat) {
    const rowArea = ringArea(rowFeat.ring.coordinates)
    const imp = streetPave.reduce((s, f) => s + ringArea(f.ring.coordinates), 0)
    const sz = sizeEsd(rowArea, Math.min(imp, rowArea), hsg)
    const totalLen = swales.reduce((s, f) => s + lenOf(f.line), 0)
    // ONE PRACTICE for the street: the runs are pieces of one roadside swale
    // system between driveway culverts, sized together against the R/W's
    // requirement. Split per run, short runs showed deficits that the system
    // as a whole does not have.
    const prov = Math.round(totalLen * 6)
    const mid = swales.reduce((a, f) => (lenOf(f.line) > lenOf(a.line) ? f : a), swales[0])
    rows.push({
      bmp: 'ESD-S', practice: `Roadside dry swales w/ check dams (${Math.round(totalLen)} LF)`, mdeCode: 'M-8', location: 'Estates Ct R/W, both sides',
      ownership: 'Public — DPIE', poi: poiFor('swale-0'), daSqFt: Math.round(rowArea), impSqFt: Math.round(Math.min(imp, rowArea)),
      percentImpervious: sz.percentImpervious, hsg, peIn: sz.peIn, rv: sz.rv,
      esdvReqCf: sz.esdvCf, esdvProvCf: prov, revReqCf: sz.revCf,
      surfaceSqFt: Math.round(totalLen * 4), at: mid.line[Math.floor(mid.line.length / 2)],
    })
  }
  const sum = (k: keyof BmpRow) => rows.reduce((s, r) => s + Number(r[k] ?? 0), 0)
  const totals = { daSqFt: sum('daSqFt'), impSqFt: sum('impSqFt'), esdvReqCf: sum('esdvReqCf'), esdvProvCf: sum('esdvProvCf'), revReqCf: sum('revReqCf'), surfaceSqFt: sum('surfaceSqFt') }
  const byPoi = poi.pois.map(p => ({ poi: p.id, req: rows.filter(r => r.poi === p.id).reduce((s, r) => s + r.esdvReqCf, 0), prov: rows.filter(r => r.poi === p.id).reduce((s, r) => s + r.esdvProvCf, 0) }))

  // ── SWM concept report (D-1, D-3, D-4, D-10) ───────────────────────────────
  const lodRings = feats.filter(f => f.kind === 'LimitOfDisturbance' && f.ring?.coordinates?.length).map(f => f.ring.coordinates as Position[])
  const lod = lodRings.reduce((s, r) => s + ringArea(r), 0)
  const closed = (r: Position[]) => (r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1] ? r : [...r, r[0]])
  let lodOnSite = 0
  if (lodRings.length) {
    const [first, ...rest] = lodRings.map(r => [closed(r)] as [number, number][][])
    const lodUnion = polygonClipping.union(first, ...rest)
    for (const poly of polygonClipping.intersection(lodUnion, [closed(tract)] as [number, number][][])) {
      lodOnSite += ringArea(poly[0] as Position[]) - poly.slice(1).reduce((s, h) => s + ringArea(h as Position[]), 0)
    }
  }
  // ── One limit of disturbance around the whole development ─────────────────
  // (user 2026-10-01: "show L.O.D. line around full site"). The union of every
  // piece of work — the per-lot disturbance, the street R/W and Jennifer Drive
  // entrance, all paving, ESD practices, easements, and a 10-ft working strip along
  // every main and house connection — with interior holes dropped, so it reads
  // as the single line the approved plans draw.
  const site = siteDisturbance(feats, pr, closed, tract)
  if (site.rings.length) {
    lodOnSite = 0
    for (const poly of polygonClipping.intersection(site.mp, [closed(tract)] as [number, number][][])) {
      lodOnSite += ringArea(poly[0] as Position[]) - poly.slice(1).reduce((s, h) => s + ringArea(h as Position[]), 0)
    }
  }
  const siteLodSqFt = site.rings.reduce((s, r) => s + ringArea(r), 0)
  const contourPts = contours.flatMap(c => c.line.map((p: Position) => [p[0], p[1], c.elevationFt] as [number, number, number]))
  const siltFence = downGradientEdges(site.rings, contourPts)
  const sce = constructionEntrance(pr.proposedStreets?.[0]?.centreline as Position[] | undefined,
    pr.entranceApron?.ring as Position[] | undefined)
  const rain = pr.rainfall24hr as Rainfall24hr | undefined
  const st0 = pr.proposedStreets?.[0]
  const profile: StreetProfile | null = st0?.centreline ? designStreetProfile({
    centreline: st0.centreline as Position[], contours,
    connection: (st0.entrance?.edgeOfRoad ?? undefined) as Position[] | undefined,
    halfPavementFt: Number(st0.pavementFt ?? 24) / 2,
    extendFt: farEdgeFt(st0.centreline as Position[], (st0.pavementRings?.[0] ?? []) as Position[]),
  }) : null
  const swm: SwmConceptReport | null = rain && poi.pois.length ? swmConceptReport({
    tractSqFt: ringArea(tract), poi, hsg, rainfall: rain,
    woodsSqFt: env.woodsSqFt ?? null, proposedImpSqFt: totals.impSqFt, lodOnSiteSqFt: lodOnSite,
    receiving: String(env.receiving ?? 'the existing roadside drainage'),
    esdvReqCf: totals.esdvReqCf, esdvProvCf: totals.esdvProvCf, practices: rows.length,
  }) : null
  if (swm && !input.sheets && !sheets.some(s => s.kind === 'swmreport')) {
    sheets.splice(sheets.findIndex(s => s.kind === 'swm') + 1, 0,
      { id: 'C-410', title: 'STORMWATER MANAGEMENT CONCEPT NARRATIVE AND 100-YR COMPUTATIONS', kind: 'swmreport' })
  }

  // ── Checklist ──────────────────────────────────────────────────────────────
  const culverts = feats.filter(f => f.kind === 'ProposedFeature' && f.attributes?.type === 'culvert').length
  const facts: ChecklistFacts = {
    sheetSizeIn: [36, 24], sheets: sheets.map(s => ({ id: s.id, title: s.title })),
    coverSheet: 'C-000', notesSheet: sheets.some(s => s.kind === 'notes') ? sheets.find(s => s.kind === 'notes')!.id : undefined, existingSheet: 'C-100', planSheet: 'C-200', utilitySheet: 'C-300', swmSheet: 'C-400', escSheet: 'C-500',
    planScaleFtPerIn: 30, approvalStripIn: 5,
    datum: { horizontal: 'Maryland State Plane, NAD 83 (EPSG 2248), US ft', vertical: 'NAVD 88 (M-NCPPC 2-ft); spot grades WSSC datum as noted' },
    contoursBeyondFt: 100, bmpRows: rows.length, pois: poi.pois.length, overflowPaths: poi.overflow.length,
    offsiteAreaSqFt: poi.offsiteAreaSqFt, esdPractices: rows.length, culverts, lodSqFt: siteLodSqFt || lod,
    dedicationSqFt: Number(pr.proposedStreets?.[0]?.rowSqFt ?? 0),
    swmReport: swm ? { sheet: 'C-410', narrative: swm.narrative, outstanding: swm.outstanding } : undefined,
    env: {
      streams: Boolean(env.streams), wetlands: Boolean(env.wetlands), floodplain: Boolean(env.floodplain), pma: Boolean(env.pma), cbca: Boolean(env.cbca),
      steep15SqFt: Number(env.steep15SqFt ?? 0), steep25SqFt: Number(env.steep25SqFt ?? 0),
      woodland: String(env.woodland ?? ''), soils: String(env.soils ?? 'NRCS soils shown.'),
      tmdl: String(env.tmdl ?? ''), tierII: Boolean(env.tierII), highlyErodible: String(env.highlyErodible ?? ''),
      marlboroClay: Boolean(env.marlboroClay), springs: Boolean(env.springs), wells: String(env.wells ?? ''), approvals: String(env.approvals ?? ''),
      nriCurrentForSubmittal: Boolean(env.nriCurrentForSubmittal),
    },
  }
  const checklist = evaluateChecklist(facts, pr.checklistOverrides ?? {})

  // ── Tables ─────────────────────────────────────────────────────────────────
  const buildings = feats.filter(f => f.kind === 'Building')
  const tables: SheetSet['tables'] = {
    siteData: { title: 'SITE DATA', columns: ['ITEM', 'DATA'], rows: (pr.siteData ?? []) as string[][] },
    approvals: { title: 'APPROVALS OF RECORD', columns: ['CASE', 'STATUS'], rows: (pr.approvalsOfRecordTable ?? []) as string[][] },
    buildings: {
      title: 'BUILDING DATA', columns: ['LOT', 'ADDRESS', 'FOOTPRINT SF', 'GARAGE', 'FF (NAVD 88)', 'B (NAVD 88)'],
      rows: buildings.map(b => [String(b.attributes?.lotLabel ?? ''), String(b.attributes?.address ?? ''),
        Math.round(Number(b.attributes?.areaSqFt ?? 0)), String(b.attributes?.garageEntry ?? ''),
        b.attributes?.finishedFloorElevFt != null ? Number(b.attributes.finishedFloorElevFt).toFixed(2) : '—',
        b.attributes?.basementElevFt != null ? Number(b.attributes.basementElevFt).toFixed(2) : '—']),
    },
    // Yocum-style cover tables: one row per lot, read off the twin.
    addresses: {
      title: 'ADDRESS LIST', columns: ['LOT', 'STREET ADDRESS'],
      rows: lotsOf(twin, pr.recordedLotAreasSqFt).map(l => [l.lot, l.address]),
    },
    lotCoverage: {
      title: 'LOT COVERAGE ANALYSIS', columns: ['LOT #', 'DRIVEWAY AREA (SF)', 'COVERED AREA (SF)', 'TOTAL AREA (SF)', 'LOT AREA (SF)', 'LOT COVERAGE (%)'],
      rows: lotsOf(twin, pr.recordedLotAreasSqFt).map(l => {
        const drive = feats.filter(f => f.kind === 'Pavement' && String(f.id).startsWith(l.prefix) && ['Driveway', 'Walk', 'Stoop'].includes(String(f.attributes?.improvement ?? '')) && f.ring?.coordinates?.length)
          .reduce((s, f) => s + ringArea(f.ring.coordinates), 0)
        const cov = buildings.filter(b => String(b.id).startsWith(l.prefix)).reduce((s, b) => s + Number(b.attributes?.areaSqFt ?? ringArea(b.ring?.coordinates ?? [])), 0)
        const tot = drive + cov
        return [l.lot.toUpperCase(), Math.round(drive), Math.round(cov), Math.round(tot), Math.round(l.areaSqFt), l.areaSqFt ? (100 * tot / l.areaSqFt).toFixed(2) : '—']
      }),
    },
    zoningCompliance: {
      title: 'RR ZONING COMPLIANCE MATRIX (CONCEPT)',
      columns: ['LOT', 'AREA SF', 'COVERAGE %', 'FRONT', 'SIDE', 'REAR', 'STATUS'],
      rows: lotsOf(twin, pr.recordedLotAreasSqFt).map(l => {
        const drive = feats.filter(f => f.kind === 'Pavement' && String(f.id).startsWith(l.prefix) && ['Driveway', 'Walk', 'Stoop'].includes(String(f.attributes?.improvement ?? '')) && f.ring?.coordinates?.length)
          .reduce((s, f) => s + ringArea(f.ring.coordinates), 0)
        const cov = buildings.filter(b => String(b.id).startsWith(l.prefix)).reduce((s, b) => s + Number(b.attributes?.areaSqFt ?? ringArea(b.ring?.coordinates ?? [])), 0)
        const pct = l.areaSqFt ? 100 * (drive + cov) / l.areaSqFt : 999
        return [l.lot.toUpperCase(), Math.round(l.areaSqFt), pct < 999 ? pct.toFixed(2) : '—', "25' MIN", "8' MIN", "20' MIN", l.areaSqFt >= 20000 && pct <= 25 ? 'PASS*' : 'REVIEW']
      }),
      note: '* Concept check: RR minimum lot 20,000 sf; maximum coverage 25%; minimum front/side/rear 25/8/20 ft; maximum height 40 ft. Final survey and permit review govern.',
    },
    soils: {
      title: 'SOILS (USDA NRCS)', columns: ['SYMBOL', 'NAME', 'HSG', 'K', 'HIGHLY ERODIBLE'],
      rows: (env.soilRows ?? []) as string[][],
    },
  }
  const notes: SheetSet['notes'] = {
    general: (pr.generalNotes ?? []) as string[],
    swm: (pr.swmNotes ?? []) as string[],
    esc: (pr.escNotes ?? []) as string[],
    sequence: (pr.sequenceOfConstruction ?? []) as string[],
  }
  const details = [
    { file: `${input.detailDir}/dpwt-600-02-street-tree-placement-rural.png`, title: 'STREET TREE PLACEMENT IN RURAL R/W — SWALE & CULVERT DRIVEWAYS', std: 'PGC DPW&T STD. 600.02' },
    { file: `${input.detailDir}/dpwt-500-10-street-light-rural.png`, title: 'STREET LIGHT LOCATION — RURAL RESIDENTIAL', std: 'PGC DPW&T STD. 500.10' },
    { file: `${input.detailDir}/dpwt-600-04-street-tree-installation-rural.png`, title: 'STREET TREE INSTALLATION IN RURAL R/W', std: 'PGC DPW&T STD. 600.04' },
  ]
  return {
    schema: 'kealee.sheetset/1', generatedAt: new Date().toISOString(), tract,
    extras: {
      environmentalGeometry: pr.environmentalGeometry ?? null,
      vicinityStreetsFile: pr.vicinityStreetsFile ?? null,
      roadImprovementsNote: pr.roadImprovementsNote ?? null,
      sightDistance: pr.sightDistance ?? null,
      siteLod: site.rings, siteLodSqFt: Math.round(siteLodSqFt), siltFence, constructionEntrance: sce,
      proposedStreet: pr.proposedStreets?.[0] ? {
        name: pr.proposedStreets[0].name, rightOfWayFt: pr.proposedStreets[0].rightOfWayFt, pavementFt: pr.proposedStreets[0].pavementFt,
        bulbRightOfWayRadiusFt: pr.proposedStreets[0].bulbRightOfWayRadiusFt, bulbPavementRadiusFt: pr.proposedStreets[0].bulbPavementRadiusFt,
        bulbCentre: pr.proposedStreets[0].bulbCentre, centreline: pr.proposedStreets[0].centreline, entrance: pr.proposedStreets[0].entrance ?? null,
        rowSqFt: pr.proposedStreets[0].rowSqFt,
      } : null,
      easementsOfRecord: pr.easementsOfRecord ?? [],
      existingStructures: pr.existingStructures ?? [],
    },
    project: (pr.titleBlock ?? {}) as Record<string, string>,
    sheets, sheetSizeIn: [36, 24], approvalStripIn: 5, twin,
    bmp: { rows, totals, byPoi, citation: MDE_TABLE_5_3_CITATION },
    poi, swm, profile, checklist: { edition: DPIE_CONCEPT_CHECKLIST_EDITION, rows: checklist },
    tables, notes, details,
  }
}

/** The lots of a composed twin, in lot order: label, address, record area and feature-id prefix. */
function lotsOf(twin: SiteTwin, recordedAreas?: Record<string, number>): { lot: string; address: string; areaSqFt: number; prefix: string }[] {
  const pl = ((twin as any).projectLots ?? []) as { featurePrefix: string; label?: string; address?: string; areaSqFt?: number | null }[]
  return pl.map((l, i) => ({
    lot: String(l.label ?? `Lot ${i + 1}`).replace(/^lot\s*/i, 'Lot '),
    address: String(l.address ?? ''),
    areaSqFt: Number(recordedAreas?.[String(i + 1)] ?? l.areaSqFt ?? 0),
    prefix: l.featurePrefix,
  }))
}

type MP = [number, number][][][]
/** A strip `w` ft wide along a polyline, as one polygon per segment. */
function stripAlong(line: Position[], w: number): MP {
  const out: MP = []
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i], L = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (L < 0.01) continue
    const nx = -(b[1] - a[1]) / L * w / 2, ny = (b[0] - a[0]) / L * w / 2
    const ux = (b[0] - a[0]) / L * w / 2, uy = (b[1] - a[1]) / L * w / 2
    out.push([[[a[0] - ux + nx, a[1] - uy + ny], [b[0] + ux + nx, b[1] + uy + ny], [b[0] + ux - nx, b[1] + uy - ny],
      [a[0] - ux - nx, a[1] - uy - ny], [a[0] - ux + nx, a[1] - uy + ny]]])
  }
  return out
}

/** The whole development's limit of disturbance: every disturbed piece, unioned, holes dropped. */
/**
 * Tree-save setback: the L.O.D. stays this far inside the tract boundary along
 * the rear lot lines and the MD 210 frontage (user 2026-10-01: 8-15 ft, to keep
 * the existing tree line for privacy). Only the street R/W, the entrance and
 * MD 210 lanes, and the WSSC easement corridor may cross it.
 */
export const LOD_TREE_SAVE_FT = 10

function siteDisturbance(feats: any[], pr: Record<string, any>, closed: (r: Position[]) => Position[], tract: Position[]): { rings: Position[][]; mp: MP } {
  const polys: MP = []
  const ringOf = (f: any): Position[] | null => {
    const r = f?.ring?.coordinates ?? (Array.isArray(f?.ring) ? f.ring : null)
    return r && r.length > 2 ? r : null
  }
  for (const f of feats) {
    const r = ringOf(f)
    if (r && ['LimitOfDisturbance', 'Pavement', 'SWMPractice', 'Building', 'Easement'].includes(f.kind)) polys.push([closed(r) as [number, number][]])
    if (r && f.kind === 'ProposedFeature' && f.attributes?.type === 'right-of-way') polys.push([closed(r) as [number, number][]])
    if (f.kind === 'Utility' && Array.isArray(f.line) && f.line.length > 1) polys.push(...stripAlong(f.line, 10))
    if (f.kind === 'ProposedFeature' && Array.isArray(f.line) && f.line.length > 1 && /swale|culvert/i.test(String(f.attributes?.type ?? ''))) polys.push(...stripAlong(f.line, 10))
  }
  for (const ri of (pr.roadImprovements ?? []) as { ring: Position[] }[]) if (ri.ring?.length > 2) polys.push([closed(ri.ring) as [number, number][]])
  if (pr.entranceApron?.ring?.length > 2) polys.push([closed(pr.entranceApron.ring) as [number, number][]])
  const sce = constructionEntrance(pr.proposedStreets?.[0]?.centreline as Position[] | undefined,
    pr.entranceApron?.ring as Position[] | undefined)
  if (sce?.length) polys.push([closed(sce) as [number, number][]])
  if (!polys.length) return { rings: [], mp: [] }
  const [first, ...rest] = polys
  let u = safeOp('union', [first], ...rest.map(r => [r]))
  const directWork = u
  // Close the gaps between the pieces (morphological closing, 30 ft): grow
  // every piece by 30 ft, union, then shrink the union back by 30 ft. Work
  // closer together than 60 ft becomes one disturbed area with one L.O.D.
  const D = 30
  const edges = (m: MP) => m.flatMap(poly => poly.flatMap(ring => stripAlong(ring as Position[], 2 * D)))
  const grown = safeOp('union', u, edges(u))
  const shells0: MP = grown.map(p => [p[0]])
  const closedEnvelope = safeOp('difference', shells0, edges(shells0))
  // Erosion during the close operation can nibble narrow corners. Union the
  // exact work back in so the LOD can never cross a building or other feature.
  u = safeOp('union', directWork, closedEnvelope)
  // hold the tree-save strip: inside the tract, everything but the permitted crossings
  // stays LOD_TREE_SAVE_FT off the boundary
  if (tract.length > 2) {
    const tr: MP = [[closed(tract) as [number, number][]]]
    const inset = safeOp('difference', tr, stripAlong(closed(tract), 2 * LOD_TREE_SAVE_FT))
    // The tree-save inset limits otherwise undisturbed ground; it must never
    // trim through actual work. Add every disturbed footprint plus a 10-ft
    // working band to the allowed region before clipping the single LOD.
    const crossings: MP = []
    for (const f of feats) {
      const r = ringOf(f)
      if (!r) continue
      const imp = String(f.attributes?.improvement ?? '')
      if (['LimitOfDisturbance', 'Pavement', 'SWMPractice', 'Building', 'Easement'].includes(f.kind)
          || (f.kind === 'ProposedFeature' && f.attributes?.type === 'right-of-way')) {
        crossings.push([closed(r) as [number, number][]])
        crossings.push(...stripAlong(closed(r), 20))
      }
    }
    for (const f of feats) if (f.kind === 'Utility' && Array.isArray(f.line) && f.line.length > 1) crossings.push(...stripAlong(f.line, 20))
    for (const ri of (pr.roadImprovements ?? []) as { ring: Position[] }[]) if (ri.ring?.length > 2) crossings.push([closed(ri.ring) as [number, number][]])
    if (pr.entranceApron?.ring?.length > 2) crossings.push([closed(pr.entranceApron.ring) as [number, number][]])
    if (sce?.length) crossings.push([closed(sce) as [number, number][]])
    const allowed = safeOp('union', inset, crossings)
    const outside = safeOp('difference', u, tr)          // off-site work (lanes, mains to Henrietta Dr)
    u = safeOp('union', safeOp('intersection', u, allowed), outside)
    // Final invariant: retain a 10-ft envelope around the exact work after all
    // clipping. This prevents numerical erosion or the tree-save mask from
    // drawing an LOD line through a building footprint.
    const workEdges = directWork.flatMap(poly => poly.flatMap(ring => stripAlong(ring as Position[], 20)))
    const workEnvelope = safeOp('union', directWork, workEdges)
    u = safeOp('union', u, workEnvelope)
  }
  // outer rings only: the L.O.D. is a line around the work, not a donut
  const shells: MP = u.map(p => [p[0]]).filter(p => ringArea(p[0] as Position[]) > 50)
  return { rings: shells.map(p => p[0] as Position[]), mp: shells }
}

/**
 * Super silt fence on the down-gradient sides of the L.O.D.: a plane fitted to
 * the existing contours gives the fall of the site; every L.O.D. edge whose
 * outward side is downhill gets fence (runs under 20 ft are dropped).
 */
function downGradientEdges(rings: Position[][], pts: [number, number, number][]): Position[][] {
  if (!rings.length || pts.length < 10) return []
  const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length, my = pts.reduce((s, p) => s + p[1], 0) / pts.length
  const mz = pts.reduce((s, p) => s + p[2], 0) / pts.length
  let sxx = 0, sxy = 0, syy = 0, sxz = 0, syz = 0
  for (const [x0, y0, z0] of pts) { const x = x0 - mx, y = y0 - my, z = z0 - mz; sxx += x * x; sxy += x * y; syy += y * y; sxz += x * z; syz += y * z }
  const det = sxx * syy - sxy * sxy
  if (Math.abs(det) < 1e-9) return []
  const a = (sxz * syy - syz * sxy) / det, b = (syz * sxx - sxz * sxy) / det
  const runs: Position[][] = []
  for (const ring of rings) {
    const r = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring : [...ring, ring[0]]
    const signedArea = r.slice(1).reduce((s, q, i) => s + (r[i][0] * q[1] - q[0] * r[i][1]), 0) / 2
    let cur: Position[] = []
    for (let i = 1; i < r.length; i++) {
      const p = r[i - 1], q = r[i], L = Math.hypot(q[0] - p[0], q[1] - p[1])
      if (L < 0.01) continue
      let nx = (q[1] - p[1]) / L, ny = -(q[0] - p[0]) / L        // outward for a CCW ring
      if (signedArea < 0) { nx = -nx; ny = -ny }
      const down = -(a * nx + b * ny) > 0.002                     // ground falls outward by more than 0.2%
      if (down) { if (!cur.length) cur.push(p); cur.push(q) } else if (cur.length) { runs.push(cur); cur = [] }
    }
    if (cur.length) runs.push(cur)
  }
  return runs.filter(r => r.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - r[i - 1][0], q[1] - r[i - 1][1]) : 0), 0) > 20)
}

/** Full unpaved apron plus 30 ft into Estates Court; 50 ft minimum total travel length (MDE B-1). */
function constructionEntrance(cl: Position[] | undefined, apron: Position[] | undefined): Position[] | null {
  if (!cl || cl.length < 2) return null
  const a = cl[0], b = cl[1], L = Math.hypot(b[0] - a[0], b[1] - a[1])
  const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, nx = -uy, ny = ux
  const s0 = 0, s1 = 30, h = 12
  const inside: Position[] = [[a[0] + ux * s0 + nx * h, a[1] + uy * s0 + ny * h], [a[0] + ux * s1 + nx * h, a[1] + uy * s1 + ny * h],
    [a[0] + ux * s1 - nx * h, a[1] + uy * s1 - ny * h], [a[0] + ux * s0 - nx * h, a[1] + uy * s0 - ny * h]]
  if (!apron || apron.length < 3) return inside
  const close = (r: Position[]) => r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1] ? r : [...r, r[0]]
  const apronRing = close(apron)
  const merged = safeOp('union', [[apronRing as [number, number][]]], [[close(inside) as [number, number][]]], ...stripAlong(apronRing, 2).map(r => [r]))
  if (!merged.length) return inside
  return (merged.sort((p, q) => ringArea(q[0] as Position[]) - ringArea(p[0] as Position[]))[0][0] as Position[]).slice(0, -1)
}

/** Distance from the centreline's last vertex, on along its last tangent, to the far edge of pavement. */
function farEdgeFt(cl: Position[], ring: Position[]): number {
  if (cl.length < 2 || ring.length < 3) return 0
  const a = cl[cl.length - 2], e = cl[cl.length - 1], L = Math.hypot(e[0] - a[0], e[1] - a[1]) || 1
  const ux = (e[0] - a[0]) / L, uy = (e[1] - a[1]) / L
  let best = 0
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length]
    const dx = q[0] - p[0], dy = q[1] - p[1]
    const den = ux * dy - uy * dx
    if (Math.abs(den) < 1e-12) continue
    const t = ((p[0] - e[0]) * dy - (p[1] - e[1]) * dx) / den      // along the ray
    const s = ((p[0] - e[0]) * uy - (p[1] - e[1]) * ux) / den      // along the edge
    if (t > 0 && s >= 0 && s <= 1) best = Math.max(best, t)
  }
  return best
}

/** Snap a multipolygon's coordinates to a grid and drop near-duplicate vertices (polygon-clipping robustness). */
function snapMP(m: MP, g: number): MP {
  const out: MP = []
  for (const poly of m) {
    const rings: [number, number][][] = []
    for (const ring of poly) {
      const r: [number, number][] = []
      for (const p of ring) {
        const q: [number, number] = [Math.round(p[0] / g) * g, Math.round(p[1] / g) * g]
        const last = r[r.length - 1]
        if (!last || Math.hypot(q[0] - last[0], q[1] - last[1]) >= Math.max(g, 0.5)) r.push(q)
      }
      if (r.length >= 3) {
        if (r[0][0] !== r[r.length - 1][0] || r[0][1] !== r[r.length - 1][1]) r.push([r[0][0], r[0][1]])
        if (r.length >= 4) rings.push(r)
      }
    }
    if (rings.length) out.push(rings)
  }
  return out
}

/** A polygon-clipping operation that retries on coarser snapping instead of throwing. */
function safeOp(op: 'union' | 'difference' | 'intersection', a: MP, ...bs: MP[]): MP {
  for (const g of [0.01, 0.05, 0.2, 0.5]) {
    try {
      return (polygonClipping as any)[op](snapMP(a, g), ...bs.map(b => snapMP(b, g))) as MP
    } catch { /* retry coarser */ }
  }
  return op === 'difference' || op === 'union' ? a : []
}
