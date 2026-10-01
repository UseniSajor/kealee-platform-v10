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

export interface SheetSpec { id: string; title: string; kind: 'cover' | 'existing' | 'layout' | 'utility' | 'swm' | 'swmreport' | 'esc' | 'details'; scaleFtPerIn?: number }

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
    { id: 'C-000', title: 'COVER SHEET — BMP SUMMARY, DPIE CHECKLIST AND NOTES', kind: 'cover' },
    { id: 'C-100', title: 'EXISTING CONDITIONS AND ENVIRONMENTAL FEATURES', kind: 'existing', scaleFtPerIn: 30 },
    { id: 'C-200', title: 'SITE LAYOUT, GRADING AND PAVING PLAN', kind: 'layout', scaleFtPerIn: 30 },
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
  const rain = pr.rainfall24hr as Rainfall24hr | undefined
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
    coverSheet: 'C-000', existingSheet: 'C-100', planSheet: 'C-200', utilitySheet: 'C-300', swmSheet: 'C-400', escSheet: 'C-500',
    planScaleFtPerIn: 30, approvalStripIn: 5,
    datum: { horizontal: 'Maryland State Plane, NAD 83 (EPSG 2248), US ft', vertical: 'NAVD 88 (M-NCPPC 2-ft); 2009 spot grades WSSC datum as noted' },
    contoursBeyondFt: 100, bmpRows: rows.length, pois: poi.pois.length, overflowPaths: poi.overflow.length,
    offsiteAreaSqFt: poi.offsiteAreaSqFt, esdPractices: rows.length, culverts, lodSqFt: lod,
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
      proposedStreet: pr.proposedStreets?.[0] ? {
        name: pr.proposedStreets[0].name, rightOfWayFt: pr.proposedStreets[0].rightOfWayFt, pavementFt: pr.proposedStreets[0].pavementFt,
        bulbRightOfWayRadiusFt: pr.proposedStreets[0].bulbRightOfWayRadiusFt, bulbPavementRadiusFt: pr.proposedStreets[0].bulbPavementRadiusFt,
        bulbCentre: pr.proposedStreets[0].bulbCentre, centreline: pr.proposedStreets[0].centreline, entrance: pr.proposedStreets[0].entrance ?? null,
        rowSqFt: pr.proposedStreets[0].rowSqFt,
      } : null,
      easementsOfRecord: pr.easementsOfRecord ?? [],
    },
    project: (pr.titleBlock ?? {}) as Record<string, string>,
    sheets, sheetSizeIn: [36, 24], approvalStripIn: 5, twin,
    bmp: { rows, totals, byPoi, citation: MDE_TABLE_5_3_CITATION },
    poi, swm, checklist: { edition: DPIE_CONCEPT_CHECKLIST_EDITION, rows: checklist },
    tables, notes, details,
  }
}
