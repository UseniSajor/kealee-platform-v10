/**
 * FP-101 — Floodplain Study and Delineation, Existing and Proposed.
 *
 * A study exhibit, separate from the permit set. It carries the plan with both
 * delineations, the water-surface profile, the modelled cross sections, and the
 * tables a reviewer reads first. Everything is drawn from the computed results,
 * so the sheet cannot disagree with the report.
 *
 *   npx tsx packages/spatial-engine/scripts/floodplain-sheet.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import PDFDocument from 'pdfkit'
import { ARCH_D } from '../src/sheets/viewport'

const PROJ = join(process.cwd(), 'projects', 'indian-queen')
const MODEL_DIR = join(PROJ, 'model')
const OUT = join(PROJ, 'drawings')
const R = JSON.parse(readFileSync(join(MODEL_DIR, 'indian-queen.floodplain-study-results.json'), 'utf8'))
const INU = JSON.parse(readFileSync(join(MODEL_DIR, 'indian-queen.floodplain-inundation.json'), 'utf8'))
const MODEL = JSON.parse(readFileSync(join(MODEL_DIR, 'indian-queen.floodplain-model-input.json'), 'utf8'))
const GEO = JSON.parse(readFileSync(join(PROJ, 'drawings', 'indian-queen-floodplain-delineation.geojson'), 'utf8'))
const TWIN = JSON.parse(readFileSync(join(PROJ, 'drawings', 'indian-queen-lots-53-56.twin.json'), 'utf8'))
const MIT = JSON.parse(readFileSync(join(PROJ, 'model', 'indian-queen.mitigation-analysis.json'), 'utf8'))
const CS = JSON.parse(readFileSync(join(PROJ, 'model', 'indian-queen.compensatory-storage.json'), 'utf8'))
const ES = JSON.parse(readFileSync(join(PROJ, 'model', 'indian-queen.easement-storage.json'), 'utf8'))
const FB = JSON.parse(readFileSync(join(PROJ, 'model', 'indian-queen.fill-breakdown.json'), 'utf8'))

const S = ARCH_D
const M = S.marginPt
const TB = S.titleBlockWidthPt
const f = (n: number, d = 2) => n.toFixed(d)
const n0 = (n: number) => Math.round(n).toLocaleString('en-US')

// ── drawing helpers ────────────────────────────────────────────────────────
type Doc = InstanceType<typeof PDFDocument>
const PEN = {
  frame: { color: '#000000', width: 1.2 },
  existingFp: { color: '#1565c0', width: 1.6, dash: [7, 3, 2, 3] },
  proposedFp: { color: '#0d47a1', width: 1.2 },
  lot: { color: '#000000', width: 1.0 },
  contour: { color: '#9e9e9e', width: 0.4 },
  section: { color: '#c62828', width: 0.9 },
  road: { color: '#616161', width: 1.4 },
  building: { color: '#000000', width: 0.9 },
  ground: { color: '#000000', width: 1.0 },
  groundProp: { color: '#8d6e63', width: 1.0, dash: [4, 2] },
  water: { color: '#1565c0', width: 1.2 },
}
function line(doc: Doc, pts: [number, number][], pen: { color: string; width: number; dash?: number[] }) {
  if (pts.length < 2) return
  doc.save().lineWidth(pen.width).strokeColor(pen.color)
  if (pen.dash) doc.dash(pen.dash[0], { space: pen.dash[1] })
  doc.moveTo(pts[0][0], pts[0][1])
  for (const p of pts.slice(1)) doc.lineTo(p[0], p[1])
  doc.stroke().undash().restore()
}
function poly(doc: Doc, pts: [number, number][], fill: string, opacity: number) {
  if (pts.length < 3) return
  doc.save().fillOpacity(opacity).fillColor(fill)
  doc.moveTo(pts[0][0], pts[0][1])
  for (const p of pts.slice(1)) doc.lineTo(p[0], p[1])
  doc.closePath().fill().restore()
}
function text(doc: Doc, x: number, y: number, s: string, size = 8, opts: { bold?: boolean; color?: string; align?: 'left' | 'right' | 'center'; width?: number } = {}) {
  doc.save().fontSize(size).fillColor(opts.color ?? '#000000')
    .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
    .text(s, x, y, { lineBreak: false, align: opts.align, width: opts.width })
  doc.restore()
}
function box(doc: Doc, x: number, y: number, w: number, h: number, pen = PEN.frame) {
  doc.save().lineWidth(pen.width).strokeColor(pen.color).rect(x, y, w, h).stroke().restore()
}

const doc = new PDFDocument({
  size: [S.widthPt, S.heightPt],
  margin: 0,
  autoFirstPage: true,
  info: {
    Title: 'FP-101 Floodplain Study and Delineation — Indian Queen East Lots 53-56',
    Author: 'Kealee',
    Subject: 'Preliminary floodplain study exhibit — NOT FOR CONSTRUCTION',
  },
})
const chunks: Buffer[] = []
doc.on('data', (c: Buffer) => chunks.push(c))

// ── frame ──────────────────────────────────────────────────────────────────
box(doc, M, M, S.widthPt - 2 * M, S.heightPt - 2 * M)
const DRAW_X = M + 10
const DRAW_W = S.widthPt - 2 * M - TB - 20
const DRAW_Y = M + 10
const DRAW_H = S.heightPt - 2 * M - 20

// PRELIMINARY watermark
doc.save().rotate(-24, { origin: [S.widthPt / 2 - 300, S.heightPt / 2 - 120] })
  .fontSize(34).fillColor('#d32f2f').fillOpacity(0.07).font('Helvetica-Bold')
  .text('PRELIMINARY — NOT FOR CONSTRUCTION', S.widthPt / 2 - 640, S.heightPt / 2 - 140, { lineBreak: false })
doc.restore()

// ── title block ────────────────────────────────────────────────────────────
const tbx = S.widthPt - M - TB
box(doc, tbx, M, TB, S.heightPt - 2 * M)
let cy = M + 12
text(doc, tbx + 8, cy, 'KEALEE', 15, { bold: true }); cy += 18
text(doc, tbx + 8, cy, 'design, build, deliver', 7, { color: '#666666' }); cy += 20
const row = (k: string, v: string, size = 8) => {
  text(doc, tbx + 8, cy, k, 6, { color: '#666666' }); cy += 8
  doc.save().fontSize(size).font('Helvetica').fillColor('#000000')
    .text(v, tbx + 8, cy, { width: TB - 16 })
  cy += doc.heightOfString(v, { width: TB - 16 }) + 6
  doc.restore()
}
row('PROJECT', 'Indian Queen East — Lots 53, 54, 55 and 56')
row('ADDRESS', '9588  ·  9584  ·  9580  ·  9576 Fort Foote Road')
row('JURISDICTION', "Prince George's County, Maryland")
row('ZONE', 'RSF-95')
row('PLAT OF RECORD', 'Plat Book WWW 65, folio 60')
row('SHEET', 'FP-101 — FLOODPLAIN STUDY AND DELINEATION, EXISTING AND PROPOSED')
row('DISCIPLINE', 'Maryland Professional Engineer')
row('HORIZONTAL DATUM', 'NAD 83, Maryland State Plane, US survey feet (EPSG:2248)')
row('VERTICAL DATUM', 'NAVD 88')
row('DATE', new Date(R.generatedAt).toISOString().slice(0, 10))

cy += 4
box(doc, tbx + 6, cy, TB - 12, 74)
text(doc, tbx + 12, cy + 6, 'STATUS', 6, { color: '#666666' })
doc.save().fontSize(7.4).font('Helvetica-Bold').fillColor('#b71c1c')
  .text('PRELIMINARY FEASIBILITY. NOT A SEALED FLOODPLAIN STUDY. ' +
    'No field survey. Culvert never measured. HEC-RAS not run. ' +
    'FPS 200546, the controlling study of record, not obtained. ' +
    'No professional engineer has reviewed or sealed this sheet.',
    tbx + 12, cy + 16, { width: TB - 24 })
doc.restore()
cy += 82

// seal box
box(doc, tbx + 6, cy, TB - 12, 96)
text(doc, tbx + 12, cy + 6, 'PROFESSIONAL CERTIFICATION', 6, { color: '#666666' })
text(doc, tbx + 12, cy + 74, 'Maryland P.E. No. ________  Date __________', 7, { color: '#999999' })
cy += 104

// ── key findings panel ─────────────────────────────────────────────────────
const kf = [
  ['Contributing drainage area', `${f(R.hydrology.watershed.areaAc, 0)} ac (${f(R.hydrology.watershed.sqMi, 3)} sq mi)`],
  ['Composite curve number', f(R.hydrology.curveNumber.curveNumber, 1)],
  ['Time of concentration', `${f(R.hydrology.timeOfConcentration.tcHr, 2)} hr`],
  ['Q100 at the crossing', `${n0(R.hydrology.flows[3].peakCfs)} cfs`],
  ['Fort Foote Road sag', `EL ${f(R.crossing.roadSagElFt)}`],
  ['100-yr water surface, existing', `EL ${f(R.existing[3].headwaterElFt)}`],
  ['100-yr water surface, proposed', `EL ${f(INU['100'].wselProposed)}`],
  ['Max rise, proposed vs existing', `+${f(R.rise[3].upstream.maxRiseFt, 2)} ft — NOT no-rise`],
  ['Flood storage removed by fill', `${n0(INU['100'].reachLostStorageCy)} cy`],
  ['Road overtops at Q100', `${n0(R.existing[3].culvert.overtoppingCfs)} cfs over the pavement`],
]
text(doc, tbx + 8, cy, 'KEY FINDINGS', 7, { bold: true }); cy += 11
for (const [k, v] of kf) {
  text(doc, tbx + 8, cy, k, 6.4, { color: '#555555' })
  text(doc, tbx + 8, cy, v, 6.4, { bold: true, align: 'right', width: TB - 16 })
  cy += 9.4
}
cy += 6

// ── legend ─────────────────────────────────────────────────────────────────
text(doc, tbx + 8, cy, 'LEGEND', 7, { bold: true }); cy += 11
const leg: [string, { color: string; width: number; dash?: number[] }][] = [
  ['100-yr floodplain limit, EXISTING', PEN.existingFp],
  ['100-yr floodplain limit, PROPOSED', PEN.proposedFp],
  ['Modelled cross section', PEN.section],
  ['Lot boundary of record', PEN.lot],
  ['Existing contour (2 ft, county LiDAR)', PEN.contour],
]
for (const [lab, pen] of leg) {
  line(doc, [[tbx + 8, cy + 3], [tbx + 42, cy + 3]], pen)
  text(doc, tbx + 48, cy, lab, 6.4)
  cy += 11
}

// ══ PLAN ═══════════════════════════════════════════════════════════════════
const PLAN_H = DRAW_H * 0.56
const PLAN_Y = DRAW_Y
const PLAN_W = DRAW_W
box(doc, DRAW_X, PLAN_Y, PLAN_W, PLAN_H)
text(doc, DRAW_X + 8, PLAN_Y + 6, 'FLOODPLAIN DELINEATION — EXISTING AND PROPOSED, 100-YEAR', 11, { bold: true })

// bounds from the 100-yr existing polygon plus the lots
// Frame on the LOTS plus a working margin. Framing on the whole 100-year
// polygon put four lots in the bottom third of the sheet under 900 ft of empty
// pond — a true picture at a scale nobody can read the lots at.
const allPts: [number, number][] = []
for (const ring of Object.values(MODEL.lots as Record<string, [number, number][]>)) allPts.push(...ring)
const PAD_FT = 150
const bx0 = Math.min(...allPts.map(p => p[0])) - PAD_FT
const bx1 = Math.max(...allPts.map(p => p[0])) + PAD_FT
const by0 = Math.min(...allPts.map(p => p[1])) - PAD_FT
const by1 = Math.max(...allPts.map(p => p[1])) + PAD_FT
const padT = 26
const sc = Math.min((PLAN_W - 30) / (bx1 - bx0), (PLAN_H - padT - 20) / (by1 - by0))
const ox = DRAW_X + 15 + ((PLAN_W - 30) - (bx1 - bx0) * sc) / 2
const oy = PLAN_Y + padT + ((PLAN_H - padT - 20) - (by1 - by0) * sc) / 2
const T = (p: number[]): [number, number] => [ox + (p[0] - bx0) * sc, oy + (by1 - p[1]) * sc]

// clip to the plan box
doc.save().rect(DRAW_X + 2, PLAN_Y + padT - 6, PLAN_W - 4, PLAN_H - padT).clip()

// existing contours
for (const ftr of TWIN.features) {
  if (ftr.kind !== 'Contour') continue
  if ((ftr.attributes ?? {}).proposed) continue
  line(doc, (ftr.line as number[][]).map(T), PEN.contour)
}
// floodplain polygons
for (const ftr of GEO.features) {
  if (ftr.properties.returnPeriod !== 100) continue
  const isEx = ftr.properties.condition === 'existing'
  for (const ring of ftr.geometry.coordinates) {
    const pts = (ring as number[][]).map(T)
    if (isEx) poly(doc, pts, '#1565c0', 0.10)
    line(doc, pts, isEx ? PEN.existingFp : PEN.proposedFp)
  }
}
// lots + buildings
for (const [addr, ring] of Object.entries(MODEL.lots as Record<string, [number, number][]>)) {
  const pts = (ring as number[][]).map(T)
  line(doc, [...pts, pts[0]], PEN.lot)
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const cyy = pts.reduce((s, p) => s + p[1], 0) / pts.length
  const lot = { '9588 Fort Foote Rd': '53', '9584 Fort Foote Rd': '54', '9580 Fort Foote Rd': '55', '9576 Fort Foote Rd': '56' }[addr]
  text(doc, cx - 16, cyy - 18, `LOT ${lot}`, 9, { bold: true })
  const d = INU['100'].lots[addr]
  text(doc, cx - 30, cyy - 6, `${f(d.floodedExistingPct, 0)}% to ${f(d.floodedProposedPct, 0)}% flooded`, 6, { color: '#b71c1c' })
}
for (const b of TWIN.features.filter((x: any) => x.kind === 'Building')) {
  const r = (b.ring?.coordinates ?? b.ring) as number[][]
  const pts = r.map(T)
  line(doc, [...pts, pts[0]], PEN.building)
  const a = b.attributes ?? {}
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const cyy = pts.reduce((s, p) => s + p[1], 0) / pts.length
  if (a.finishedFloorElevFt) {
    text(doc, cx - 22, cyy - 4, `FF ${f(a.finishedFloorElevFt)}`, 5.6, { bold: true })
    text(doc, cx - 22, cyy + 3, a.basementElevFt == null ? 'NO BASEMENT' : `BSMT ${f(a.basementElevFt)}`,
      5.6, { color: '#b71c1c' })
  }
}
// cross-section lines
// Section lines are drawn to the width the section is USED over, not to the
// full 900 ft the data was cut across, and ticked at each end so they read as
// section cuts rather than as construction lines running off the sheet.
const wsPts100 = [...R.existing[3].downstream.points, ...R.existing[3].upstream.points]
for (const s of MODEL.sections) {
  if (s.rs < -120 || s.rs > 400) continue
  // Draw the cut only as wide as the 100-year water at that section, plus a
  // short run-out onto dry ground. A section line drawn to the full width the
  // data was cut across says nothing and crosses everything else on the sheet.
  const wp = wsPts100.find((q: any) => q.riverStationFt === s.rs)
  const half =
    wp && wp.leftEdgeFt != null && wp.rightEdgeFt != null
      ? Math.min(210, Math.max(Math.abs(wp.leftEdgeFt), Math.abs(wp.rightEdgeFt)) + 30)
      : 130
  const a = T([s.x - s.nx * half, s.y - s.ny * half])
  const b = T([s.x + s.nx * half, s.y + s.ny * half])
  line(doc, [a, b], PEN.section)
  const tx = -s.ny * 7 * sc * 0 + 0
  for (const e of [a, b]) {
    const dx = (b[0] - a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1])
    const dy = (b[1] - a[1]) / Math.hypot(b[0] - a[0], b[1] - a[1])
    line(doc, [[e[0] - dy * 5, e[1] + dx * 5], [e[0] + dy * 5, e[1] - dx * 5]], PEN.section)
  }
  text(doc, a[0] - 30, a[1] - 4, `RS ${s.rs >= 0 ? '+' : ''}${s.rs}`, 5.6, { color: '#c62828', bold: true })
}
// road sag marker
const sag = T(MODEL.roadSagXY)
doc.save().lineWidth(1.6).strokeColor('#b71c1c').moveTo(sag[0] - 9, sag[1] - 9).lineTo(sag[0] + 9, sag[1] + 9)
  .moveTo(sag[0] + 9, sag[1] - 9).lineTo(sag[0] - 9, sag[1] + 9).stroke().restore()
text(doc, sag[0] + 12, sag[1] - 4, `FORT FOOTE RD SAG EL ${f(MODEL.roadSagEl)} — OVERTOPS`, 7, { bold: true, color: '#b71c1c' })
doc.restore()

// scale bar
const barFt = 100
const barPt = barFt * sc
const bx = DRAW_X + 16
const byy = PLAN_Y + PLAN_H - 22
line(doc, [[bx, byy], [bx + barPt, byy]], { color: '#000', width: 1.2 })
for (let i = 0; i <= 4; i++) {
  const x = bx + (barPt * i) / 4
  line(doc, [[x, byy - 4], [x, byy + 4]], { color: '#000', width: 1 })
}
text(doc, bx, byy + 6, `0${' '.repeat(20)}${barFt} FT`, 6.5)
text(doc, bx + barPt + 12, byy - 3, `1 in = ${f(72 / sc, 0)} ft`, 7)
{
  // Drawn, not typed: the arrow glyph is not in the base font and printed as
  // stray punctuation on the first plot.
  const nx0 = DRAW_X + PLAN_W - 70
  const ny0 = PLAN_Y + 34
  line(doc, [[nx0, ny0], [nx0, ny0 - 20]], { color: '#000000', width: 1.3 })
  doc.save().fillColor('#000000').moveTo(nx0, ny0 - 25).lineTo(nx0 - 4.5, ny0 - 16)
    .lineTo(nx0 + 4.5, ny0 - 16).closePath().fill().restore()
  text(doc, nx0 - 12, ny0 + 3, 'NORTH', 8, { bold: true })
}

// ══ PROFILE ════════════════════════════════════════════════════════════════
const PROF_Y = PLAN_Y + PLAN_H + 10
const PROF_H = (DRAW_H - PLAN_H - 30) * 0.52
const PROF_W = DRAW_W * 0.52
box(doc, DRAW_X, PROF_Y, PROF_W, PROF_H)
text(doc, DRAW_X + 8, PROF_Y + 6, 'WATER-SURFACE PROFILE ALONG NORTH BRANCH BROAD CREEK', 10, { bold: true })
text(doc, DRAW_X + 8, PROF_Y + 19, 'Station in feet from the Fort Foote Road sag; + is upstream', 6.5, { color: '#666666' })
{
  const pts: { rs: number; inv: number }[] = []
  for (const c of [R.existing[3].downstream, R.existing[3].upstream]) {
    for (const p of c.points) pts.push({ rs: p.riverStationFt, inv: p.invertFt })
  }
  pts.sort((a, b) => a.rs - b.rs)
  const rs0 = Math.min(...pts.map(p => p.rs))
  const rs1 = Math.max(...pts.map(p => p.rs))
  const el0 = 34
  const el1 = 60
  const px0 = DRAW_X + 40
  const px1 = DRAW_X + PROF_W - 14
  const py0 = PROF_Y + PROF_H - 26
  const py1 = PROF_Y + 30
  const X = (rs: number) => px0 + ((rs - rs0) / (rs1 - rs0)) * (px1 - px0)
  const Y = (el: number) => py0 - ((el - el0) / (el1 - el0)) * (py0 - py1)
  // grid
  for (let e = el0; e <= el1; e += 4) {
    line(doc, [[px0, Y(e)], [px1, Y(e)]], { color: '#e0e0e0', width: 0.4 })
    text(doc, px0 - 24, Y(e) - 3, String(e), 6)
  }
  for (let s = -400; s <= 400; s += 200) {
    if (s < rs0 || s > rs1) continue
    line(doc, [[X(s), py1], [X(s), py0]], { color: '#e0e0e0', width: 0.4 })
    text(doc, X(s) - 10, py0 + 4, (s > 0 ? '+' : '') + s, 6)
  }
  // road
  line(doc, [[X(-25), Y(MODEL.roadSagEl)], [X(25), Y(MODEL.roadSagEl)]], { color: '#b71c1c', width: 2 })
  text(doc, X(30), Y(MODEL.roadSagEl) - 9, `ROAD EL ${f(MODEL.roadSagEl)}`, 6.5, { bold: true, color: '#b71c1c' })
  // channel invert
  line(doc, pts.map(p => [X(p.rs), Y(p.inv)] as [number, number]), PEN.ground)
  text(doc, X(rs0) + 4, Y(pts[0].inv) + 4, 'CHANNEL INVERT', 6, { color: '#444' })
  // water surfaces
  const periods = [10, 100]
  for (const per of periods) {
    const i = [10, 25, 50, 100].indexOf(per)
    const wp: [number, number][] = []
    for (const c of [R.existing[i].downstream, R.existing[i].upstream]) {
      for (const p of c.points) wp.push([X(p.riverStationFt), Y(p.wselFt)])
    }
    wp.sort((a, b) => a[0] - b[0])
    line(doc, wp, { color: per === 100 ? '#1565c0' : '#64b5f6', width: per === 100 ? 1.5 : 1 })
    const last = wp[wp.length - 1]
    text(doc, last[0] - 58, last[1] - 9, `${per}-YR EL ${f(R.existing[i].headwaterElFt)}`, 6.4,
      { bold: per === 100, color: per === 100 ? '#1565c0' : '#64b5f6' })
  }
  text(doc, px0 - 34, py1 - 12, 'ELEV (NAVD 88)', 6, { bold: true })
  text(doc, px1 - 60, py0 + 13, 'STATION (FT)', 6, { bold: true })
}

// ══ CROSS SECTIONS ═════════════════════════════════════════════════════════
const XS_X = DRAW_X + PROF_W + 10
const XS_W = DRAW_W - PROF_W - 10
box(doc, XS_X, PROF_Y, XS_W, PROF_H)
text(doc, XS_X + 8, PROF_Y + 6, 'MODELLED CROSS SECTIONS — EXISTING AND PROPOSED', 10, { bold: true })
{
  const want = [40, 120, 240]
  const cw = (XS_W - 20) / want.length
  want.forEach((rs, k) => {
    const raw = MODEL.sections.find((s: any) => s.rs === rs)
    if (!raw) return
    const i = 3
    const pp = R.existing[i].upstream.points.find((p: any) => p.riverStationFt === rs)
    const ppP = R.proposed[i].upstream.points.find((p: any) => p.riverStationFt === rs)
    const x0 = XS_X + 10 + k * cw
    const w = cw - 12
    const y0 = PROF_Y + PROF_H - 30
    const y1 = PROF_Y + 34
    // Plot only the part of the section the flood actually occupies, plus a
    // margin. Cutting 900 ft of valley wall into a 4 in panel drew two near
    // vertical lines off the top of the box and told the reader nothing.
    const wl0 = pp ? pp.wselFt : 55
    const inWater = raw.existing.filter((q: number[]) => q[1] <= wl0 + 6).map((q: number[]) => q[0])
    const s0 = (inWater.length ? Math.min(...inWater) : -120) - 40
    const s1 = (inWater.length ? Math.max(...inWater) : 120) + 40
    const inv = Math.min(...raw.existing.map((q: number[]) => q[1]))
    const e0 = Math.floor((inv - 2) / 2) * 2
    const e1 = e0 + 22
    const X = (s: number) => x0 + ((s - s0) / (s1 - s0)) * w
    const Y = (e: number) => y0 - ((e - e0) / (e1 - e0)) * (y0 - y1)
    doc.save().rect(x0 - 1, y1 - 2, w + 2, y0 - y1 + 4).clip()
    for (let e = e0; e <= e1; e += 4) {
      line(doc, [[x0, Y(e)], [x0 + w, Y(e)]], { color: '#eeeeee', width: 0.4 })
    }
    // water
    if (pp) {
      const wl = pp.wselFt
      doc.save().fillOpacity(0.16).fillColor('#1565c0')
        .rect(x0, Y(wl), w, y0 - Y(wl)).fill().restore()
      line(doc, [[x0, Y(wl)], [x0 + w, Y(wl)]], PEN.water)
      text(doc, x0 + 2, Y(wl) - 9, `100-YR WS ${f(wl)}`, 5.6, { bold: true, color: '#1565c0' })
    }
    line(doc, raw.existing.map((q: number[]) => [X(q[0]), Y(q[1])] as [number, number]), PEN.ground)
    const changed = raw.proposed.some((q: number[], j: number) => Math.abs(q[1] - raw.existing[j][1]) > 0.05)
    if (changed) line(doc, raw.proposed.map((q: number[]) => [X(q[0]), Y(q[1])] as [number, number]), PEN.groundProp)
    doc.restore()
    for (let e = e0; e <= e1; e += 4) text(doc, x0 - 17, Y(e) - 3, String(e), 5.5)
    text(doc, x0, PROF_Y + 22, `RS ${rs >= 0 ? '+' : ''}${rs}`, 7.5, { bold: true })
    if (ppP && pp) {
      text(doc, x0 + 42, PROF_Y + 22, `rise +${f(ppP.wselFt - pp.wselFt, 3)} ft`, 6, { color: '#b71c1c' })
    }
    text(doc, x0, y0 + 5, `${f(s0, 0)}`, 5.5)
    text(doc, x0 + w - 18, y0 + 5, `${f(s1, 0)}`, 5.5)
  })
  text(doc, XS_X + 8, PROF_Y + PROF_H - 18,
    'Solid = existing ground.  Dashed brown = proposed grading.  Shaded = 100-year water.  ' +
    'Vertical exaggeration applies; stations in feet from the thalweg.', 6, { color: '#666666' })
}

// ══ TABLES ═════════════════════════════════════════════════════════════════
const TAB_Y = PROF_Y + PROF_H + 10
const TAB_H = DRAW_Y + DRAW_H - TAB_Y
const colW = DRAW_W / 3 - 7
const tcol = (i: number) => DRAW_X + i * (colW + 10)

function table(x: number, y: number, w: number, title: string, head: string[], rows: string[][], widths: number[]) {
  box(doc, x, y, w, TAB_H)
  text(doc, x + 6, y + 5, title, 8, { bold: true })
  let ty = y + 18
  const cx = (i: number) => x + 6 + widths.slice(0, i).reduce((a, b) => a + b, 0) * w
  head.forEach((h, i) => text(doc, cx(i), ty, h, 5.8, { bold: true, color: '#555555' }))
  ty += 8
  line(doc, [[x + 5, ty], [x + w - 5, ty]], { color: '#999999', width: 0.5 })
  ty += 3
  for (const r of rows) {
    r.forEach((c, i) => text(doc, cx(i), ty, c, 6.2, { bold: i === 0 && c.startsWith('**') }))
    ty += 9
  }
}

table(tcol(0), TAB_Y, colW, 'DESIGN DISCHARGES — NRCS TR-55, TYPE II',
  ['STORM', 'P24 (IN)', 'Q (IN)', 'qu', 'PEAK (CFS)'],
  R.hydrology.flows.map((fl: any) => [fl.label, f(fl.rainfallIn), f(fl.runoffIn), f(fl.quCsmIn, 0), n0(fl.peakCfs)])
    .concat([['', '', '', '', ''],
      ['Area', `${f(R.hydrology.watershed.areaAc, 0)} ac`, 'CN', f(R.hydrology.curveNumber.curveNumber, 1), `Tc ${f(R.hydrology.timeOfConcentration.tcHr, 2)} hr`],
      ['', '', '', '', ''],
      ['CULVERT AT Q100', '', '', '', ''],
      ...R.crossing.alternatives.map((a: any) => [`${a.sizeIn} in`, a.governing, `HW ${f(a.headwaterElFt)}`, `HW/D ${f(a.hwOverD, 1)}`, `${n0(a.overtoppingCfs)} over rd`])]),
  [0.17, 0.19, 0.19, 0.2, 0.25])

table(tcol(1), TAB_Y, colW, 'EXISTING vs PROPOSED WATER SURFACE — 100-YEAR',
  ['SECTION', 'EXISTING', 'PROPOSED', 'RISE (FT)', ''],
  R.rise[3].upstream.rows.map((r: any) => [r.sectionId, f(r.existingWselFt), f(r.proposedWselFt),
    `${r.riseFt >= 0 ? '+' : ''}${f(r.riseFt, 3)}`, r.riseFt >= 0.005 ? 'RISE' : ''])
    .concat([['', '', '', '', ''],
      ['MAXIMUM', '', '', `+${f(R.rise[3].upstream.maxRiseFt, 3)}`, 'NOT NO-RISE'],
      ['', '', '', '', ''],
      ['Storage removed below the 100-yr surface', '', '', `${n0(INU['100'].reachLostStorageCy)} cy`, ''],
      ['Total fill in the modelled reach', '', '', `${n0(INU['100'].reachTotalFillCy)} cy`, ''],
      ['Compensatory storage', '', '', 'REQUIRED', '']]),
  [0.22, 0.2, 0.2, 0.2, 0.18])

const lotRows = Object.entries(INU['100'].lots as Record<string, any>).map(([addr, d]) => {
  const lot = { '9588 Fort Foote Rd': '53', '9584 Fort Foote Rd': '54', '9580 Fort Foote Rd': '55', '9576 Fort Foote Rd': '56' }[addr]!
  return [`LOT ${lot}`, n0(d.lotAreaSf), `${n0(d.floodedExistingSf)} (${f(d.floodedExistingPct, 0)}%)`,
    `${n0(d.floodedProposedSf)} (${f(d.floodedProposedPct, 0)}%)`, `${n0(d.lostStorageCy)} cy`]
})
const bldg = TWIN.features.filter((x: any) => x.kind === 'Building')
  .map((b: any) => {
    const r = (b.ring?.coordinates ?? b.ring) as number[][]
    const cx = r.reduce((s: number, q: number[]) => s + q[0], 0) / r.length
    return { cx, ...b.attributes }
  })
  .sort((a: any, b: any) => b.cx - a.cx)
const wsel100 = INU['100'].wselProposed
table(tcol(2), TAB_Y, colW, 'FLOODPLAIN ON THE LOTS, AND FREEBOARD — 100-YEAR',
  ['LOT', 'AREA (SF)', 'FLOODED EXIST', 'FLOODED PROP', 'FILL < FLOOD'],
  (lotRows as string[][]).concat([['', '', '', '', ''],
    [`LOWEST FLOOR CHECK AGAINST WS EL ${f(wsel100)}`, '', '', '', ''],
    ['LOT', 'FIN FLOOR', 'FREEBOARD', 'BASEMENT', 'FOUNDATION'],
    ...bldg.map((b: any, i: number) => {
      const lot = ['53', '54', '55', '56'][i]
      const fb = b.finishedFloorElevFt - wsel100
      return [`LOT ${lot}`, f(b.finishedFloorElevFt), `${fb >= 0 ? '+' : ''}${f(fb)}${fb < 2 ? ' LOW' : ''}`,
        b.basementElevFt == null ? 'none' : f(b.basementElevFt), b.foundationType ?? 'slab']
    })]),
  [0.17, 0.19, 0.23, 0.23, 0.18])

// ── basis and limitations, in the space the tables leave ───────────────────
{
  const bx2 = tcol(2) + 6
  const by2 = TAB_Y + 134
  const bw = colW - 12
  box(doc, bx2, by2, bw, TAB_H - 140)
  text(doc, bx2 + 6, by2 + 5, 'BASIS, METHOD AND LIMITATIONS', 7.5, { bold: true })
  const notes = [
    'HYDROLOGY  NRCS TR-55 graphical peak discharge, Type II distribution. Drainage area delineated by ' +
      'D8 routing on the USGS 3DEP bare-earth DEM. Curve number composited from the county 2023 ' +
      'impervious-surface and tree-canopy layers and the NRCS soil survey. Rainfall from NOAA Atlas 14 ' +
      'Vol. 2 Ver. 3, partial duration series, at 38.7611 N 77.0115 W.',
    'HYDRAULICS  One-dimensional steady gradually-varied flow, standard step, conveyance subdivided at ' +
      'the bank stations, average-conveyance friction slope. Crossing analysed to FHWA HDS-5 with both ' +
      'controls computed and the roadway treated as a broad-crested weir.',
    'TERRAIN  PGAtlas Contour 2 Ft (2023), NAVD 88, interpolated to a 10 ft grid. THIS IS NOT A FIELD SURVEY.',
    'DATUM  NAVD 88 = NGVD 29 - 0.66 ft here, from NGS marks HV4762, HV4763 and HV4728. On that basis ' +
      'the 57 ft WSSC of FPS-770017 is about EL 56.3 NAVD 88, against EL 55.47 computed. To be confirmed ' +
      'by levelling to benchmarks H31A, H32A and H32B on the field topographic survey.',
    'NOT DONE  No field survey. The existing culvert has never been measured and its size, inverts and ' +
      'entrance are assumed. HEC-RAS was not run and no HEC-RAS files exist. FPS 200546, the controlling ' +
      'study of record, has not been obtained. Upstream stormwater facilities were not inventoried. ' +
      'No floodway was delineated and none exists on current mapping. No unsteady or storage routing.',
    'FLOODPLAIN OF RECORD  FEMA FIRM panel 24033C0220E eff. 2016-09-16 maps these lots Zone X, outside ' +
      'the special flood hazard area, with no BFE and no floodway. That is a statement about FEMA mapping, ' +
      'not about flood risk. The county regulates this floodplain through the FPS series regardless.',
    'EASEMENT  The only platted floodplain easement in Indian Queen East (Plat 118-083, recorded ' +
      '17 January 1984, 5.32 ac) lies entirely south of Fort Foote Road and covers none of Lots 53-56.',
  ]
  let ny = by2 + 17
  for (const n of notes) {
    doc.save().fontSize(5.9).font('Helvetica').fillColor('#333333')
      .text(n, bx2 + 6, ny, { width: bw - 12, align: 'left' })
    ny += doc.heightOfString(n, { width: bw - 12 }) + 4
    doc.restore()
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FP-102 — MITIGATION AND COMPENSATORY STORAGE DESIGN
// ═══════════════════════════════════════════════════════════════════════════
doc.addPage({ size: [S.widthPt, S.heightPt], margin: 0 })
box(doc, M, M, S.widthPt - 2 * M, S.heightPt - 2 * M)
doc.save().rotate(-24, { origin: [S.widthPt / 2 - 300, S.heightPt / 2 - 120] })
  .fontSize(34).fillColor('#d32f2f').fillOpacity(0.07).font('Helvetica-Bold')
  .text('PRELIMINARY — NOT FOR CONSTRUCTION', S.widthPt / 2 - 640, S.heightPt / 2 - 140, { lineBreak: false })
doc.restore()

// title block
box(doc, tbx, M, TB, S.heightPt - 2 * M)
cy = M + 12
text(doc, tbx + 8, cy, 'KEALEE', 15, { bold: true }); cy += 18
text(doc, tbx + 8, cy, 'design, build, deliver', 7, { color: '#666666' }); cy += 20
row('PROJECT', 'Indian Queen East — Lots 53, 54, 55 and 56')
row('ADDRESS', '9588  ·  9584  ·  9580  ·  9576 Fort Foote Road')
row('JURISDICTION', "Prince George's County, Maryland")
row('SHEET', 'FP-102 — MITIGATION ANALYSIS AND COMPENSATORY STORAGE DESIGN')
row('DISCIPLINE', 'Maryland Professional Engineer')
row('VERTICAL DATUM', 'NAVD 88')
row('DATE', new Date(R.generatedAt).toISOString().slice(0, 10))
cy += 4
box(doc, tbx + 6, cy, TB - 12, 66)
text(doc, tbx + 12, cy + 6, 'STATUS', 6, { color: '#666666' })
doc.save().fontSize(7.4).font('Helvetica-Bold').fillColor('#b71c1c')
  .text('PRELIMINARY FEASIBILITY. NOT A SEALED FLOODPLAIN STUDY. ' +
    'Quantities are for concept evaluation and are not construction quantities. ' +
    'No professional engineer has reviewed or sealed this sheet.',
    tbx + 12, cy + 16, { width: TB - 24 })
doc.restore()
cy += 74
box(doc, tbx + 6, cy, TB - 12, 88)
text(doc, tbx + 12, cy + 6, 'PROFESSIONAL CERTIFICATION', 6, { color: '#666666' })
text(doc, tbx + 12, cy + 66, 'Maryland P.E. No. ________  Date __________', 7, { color: '#999999' })
cy += 96

text(doc, tbx + 8, cy, 'DETERMINATIONS', 7, { bold: true }); cy += 11
const dets: [string, string][] = [
  ['Removal of all lots from floodplain', 'NOT ACHIEVABLE'],
  ['Controlling tailwater, lower bound', `EL ${f(MIT.tailwaterFloorFt)}`],
  ['Lowest ground, Lot 55', `EL ${f(Math.min(...Object.values(MIT.lotLowestGroundFt as Record<string, number>) as number[]))}`],
  ['Basements', 'NOT PERMISSIBLE, ALL LOTS'],
  ['Required lowest floor', `EL ${f(wsel100 + 2)}`],
  ['Compensation required', `${n0(CS.requiredCurrentGradingCy)} cy`],
  ['Compensation available on site', `${n0(CS.totalProvidedCy + ES.cutByFloor['48.0'])} cy`],
  ['Crossing enlargement', 'NOT RECOMMENDED'],
]
for (const [k, v] of dets) {
  text(doc, tbx + 8, cy, k, 6.4, { color: '#555555' })
  text(doc, tbx + 8, cy, v, 6.4, { bold: true, align: 'right', width: TB - 16 })
  cy += 9.6
}
cy += 8
text(doc, tbx + 8, cy, 'DESIGN CRITERIA — COMPENSATORY STORAGE', 7, { bold: true }); cy += 11
const crit = [
  `1  Excavation floor EL ${f(CS.floorElFt)}, above the invert of the receiving channel, so each cell drains by gravity.`,
  '2  Cells located within the existing-condition 100-year floodplain limit, being the area to be placed under floodplain easement.',
  '3  Side slopes no steeper than 3:1, stabilised and mowable, no retaining structure.',
  `4  Minimum ${f(CS.standoffFt, 0)} ft from every property line and 20 ft from every structure.`,
  '5  Positive hydraulic connection to the recorded storm drain easement corridor at the cell invert.',
  '6  Volume provided at the same elevation increments from which it is taken; stage-by-stage comparison required at final design.',
]
for (const c of crit) {
  doc.save().fontSize(6).font('Helvetica').fillColor('#333333').text(c, tbx + 8, cy, { width: TB - 16 })
  cy += doc.heightOfString(c, { width: TB - 16 }) + 3.5
  doc.restore()
}

// ── PLAN: storage design ───────────────────────────────────────────────────
const P2H = DRAW_H * 0.60
box(doc, DRAW_X, DRAW_Y, DRAW_W, P2H)
text(doc, DRAW_X + 8, DRAW_Y + 6, 'COMPENSATORY STORAGE DESIGN — PLAN', 11, { bold: true })
text(doc, DRAW_X + 8, DRAW_Y + 20,
  `Cells CS-53 to CS-56 excavated to EL ${f(CS.floorElFt)}; cell CS-E within the recorded 60 ft storm drain easement`,
  7, { color: '#555555' })

const p2pad = 34
const sc2 = Math.min((DRAW_W - 30) / (bx1 - bx0), (P2H - p2pad - 20) / (by1 - by0))
const ox2 = DRAW_X + 15 + ((DRAW_W - 30) - (bx1 - bx0) * sc2) / 2
const oy2 = DRAW_Y + p2pad + ((P2H - p2pad - 20) - (by1 - by0) * sc2) / 2
const T2 = (p: number[]): [number, number] => [ox2 + (p[0] - bx0) * sc2, oy2 + (by1 - p[1]) * sc2]

doc.save().rect(DRAW_X + 2, DRAW_Y + p2pad - 6, DRAW_W - 4, P2H - p2pad).clip()
for (const ftr of TWIN.features) {
  if (ftr.kind !== 'Contour' || (ftr.attributes ?? {}).proposed) continue
  line(doc, (ftr.line as number[][]).map(T2), PEN.contour)
}
for (const ftr of GEO.features) {
  if (ftr.properties.returnPeriod !== 100 || ftr.properties.condition !== 'existing') continue
  for (const ring of ftr.geometry.coordinates) {
    const pts = (ring as number[][]).map(T2)
    poly(doc, pts, '#1565c0', 0.07)
    line(doc, pts, PEN.existingFp)
  }
}
// recorded storm drain easement
{
  const ering = (ES.easement.ring as number[][]).map(T2)
  poly(doc, ering, '#7b1fa2', 0.10)
  line(doc, [...ering, ering[0]], { color: '#6a1b9a', width: 1.4, dash: [8, 3] })
  const cxE = ering.reduce((s2, p) => s2 + p[0], 0) / ering.length
  const cyE = ering.reduce((s2, p) => s2 + p[1], 0) / ering.length
  text(doc, cxE - 44, cyE - 8, 'CS-E', 8, { bold: true, color: '#4a148c' })
  text(doc, cxE - 44, cyE + 2, `RECORDED 60' STORM DRAIN ESMT`, 5.4, { color: '#4a148c' })
  text(doc, cxE - 44, cyE + 9, `${n0(ES.cutByFloor['48.0'])} cy @ EL 48.0`, 5.4, { color: '#4a148c' })
}
// storage cells
for (const c of CS.cells) {
  for (const ring of c.rings as number[][][]) {
    const pts = ring.map(T2)
    poly(doc, pts, '#00897b', 0.28)
    line(doc, pts, { color: '#00695c', width: 1.5 })
  }
  const all = (c.rings as number[][][]).flat().map(T2)
  const cxc = all.reduce((s2, p) => s2 + p[0], 0) / all.length
  const cyc = all.reduce((s2, p) => s2 + p[1], 0) / all.length
  text(doc, cxc - 16, cyc - 9, `CS-${c.lot}`, 8, { bold: true, color: '#00695c' })
  text(doc, cxc - 16, cyc + 1, `${n0(c.volumeCy)} cy`, 6, { bold: true, color: '#00695c' })
  text(doc, cxc - 16, cyc + 8, `${n0(c.areaSqFt)} sf`, 5.4, { color: '#00695c' })
}
for (const [addr, ring] of Object.entries(MODEL.lots as Record<string, [number, number][]>)) {
  const pts = (ring as number[][]).map(T2)
  line(doc, [...pts, pts[0]], PEN.lot)
  const cxl = pts.reduce((s2, p) => s2 + p[0], 0) / pts.length
  const cyl = pts.reduce((s2, p) => s2 + p[1], 0) / pts.length
  const lot = { '9588 Fort Foote Rd': '53', '9584 Fort Foote Rd': '54', '9580 Fort Foote Rd': '55', '9576 Fort Foote Rd': '56' }[addr]
  text(doc, cxl - 14, cyl - 32, `LOT ${lot}`, 9, { bold: true })
}
for (const b of TWIN.features.filter((x: any) => x.kind === 'Building')) {
  const r = (b.ring?.coordinates ?? b.ring) as number[][]
  const pts = r.map(T2)
  line(doc, [...pts, pts[0]], PEN.building)
  const a = b.attributes ?? {}
  const cxb = pts.reduce((s2, p) => s2 + p[0], 0) / pts.length
  const cyb = pts.reduce((s2, p) => s2 + p[1], 0) / pts.length
  text(doc, cxb - 26, cyb - 4, `REQ LF ${f(wsel100 + 2)}`, 5.6, { bold: true, color: '#b71c1c' })
  text(doc, cxb - 26, cyb + 3, 'NO BASEMENT', 5.6, { color: '#b71c1c' })
}
doc.restore()
{
  const bar = 100 * sc2
  const bxx = DRAW_X + 16
  const byy2 = DRAW_Y + P2H - 20
  line(doc, [[bxx, byy2], [bxx + bar, byy2]], { color: '#000', width: 1.2 })
  for (let i = 0; i <= 4; i++) line(doc, [[bxx + (bar * i) / 4, byy2 - 4], [bxx + (bar * i) / 4, byy2 + 4]], { color: '#000', width: 1 })
  text(doc, bxx, byy2 + 6, `0${' '.repeat(20)}100 FT`, 6.5)
  text(doc, bxx + bar + 12, byy2 - 3, `1 in = ${f(72 / sc2, 0)} ft`, 7)
  const nx2 = DRAW_X + DRAW_W - 70
  const ny2 = DRAW_Y + 44
  line(doc, [[nx2, ny2], [nx2, ny2 - 20]], { color: '#000000', width: 1.3 })
  doc.save().fillColor('#000000').moveTo(nx2, ny2 - 25).lineTo(nx2 - 4.5, ny2 - 16)
    .lineTo(nx2 + 4.5, ny2 - 16).closePath().fill().restore()
  text(doc, nx2 - 12, ny2 + 3, 'NORTH', 8, { bold: true })
}

// ── tables row ─────────────────────────────────────────────────────────────
const T2Y = DRAW_Y + P2H + 10
const T2H = DRAW_Y + DRAW_H - T2Y
const cw2 = DRAW_W / 3 - 7
const tc2 = (i: number) => DRAW_X + i * (cw2 + 10)
function table2(x: number, y: number, w: number, h: number, title: string, head: string[], rows: string[][], widths: number[]) {
  box(doc, x, y, w, h)
  text(doc, x + 6, y + 5, title, 8, { bold: true })
  let ty = y + 18
  const cxf = (i: number) => x + 6 + widths.slice(0, i).reduce((a, b) => a + b, 0) * w
  head.forEach((hh, i) => text(doc, cxf(i), ty, hh, 5.8, { bold: true, color: '#555555' }))
  ty += 8
  line(doc, [[x + 5, ty], [x + w - 5, ty]], { color: '#999999', width: 0.5 })
  ty += 3
  for (const r of rows) { r.forEach((c, i) => text(doc, cxf(i), ty, c, 6.2)); ty += 9 }
}
const exR = MIT.routed['EXISTING 36 in RCP (assumed)']
table2(tc2(0), T2Y, cw2, T2H, 'RESERVOIR ROUTING — EXISTING CROSSING',
  ['STORM', 'INFLOW', 'OUTFLOW', 'ATTENUATED', 'PEAK STAGE'],
  [10, 25, 50, 100].map(p => {
    const r = exR[String(p)]
    return [`${p}-year`, `${n0(r.inflowPeakCfs)} cfs`, `${n0(r.outflowPeakCfs)} cfs`,
      `${f(100 * (1 - r.attenuation), 1)}%`, `EL ${f(r.peakStageFt)}`]
  }).concat([['', '', '', '', ''],
    ['CROSSING ALTERNATIVES — DOWNSTREAM TRANSFER', '', '', '', ''],
    ['OPTION', '10-YR OUT', 'CHANGE', '100-YR OUT', 'CHANGE'],
    ...Object.entries(MIT.routed as Record<string, any>).map(([k, v]) => [
      k.replace(' (assumed)', '').replace('EXISTING 36 in RCP', 'existing 36 in'),
      `${n0(v['10'].outflowPeakCfs)}`,
      `${v['10'].outflowPeakCfs - exR['10'].outflowPeakCfs >= 0 ? '+' : ''}${n0(v['10'].outflowPeakCfs - exR['10'].outflowPeakCfs)}`,
      `${n0(v['100'].outflowPeakCfs)}`,
      `${v['100'].outflowPeakCfs - exR['100'].outflowPeakCfs >= 0 ? '+' : ''}${n0(v['100'].outflowPeakCfs - exR['100'].outflowPeakCfs)}`,
    ])]),
  [0.34, 0.17, 0.16, 0.17, 0.16])

table2(tc2(1), T2Y, cw2, T2H, 'COMPENSATORY STORAGE SCHEDULE',
  ['CELL', 'LOT', 'AREA (SF)', 'MEAN DEPTH', 'VOLUME'],
  (CS.cells as any[]).map(c => [`CS-${c.lot}`, c.lot, n0(c.areaSqFt), `${f(c.meanDepthFt)} ft`, `${n0(c.volumeCy)} cy`])
    .concat([['CS-E', '54/55', n0(ES.easement.areaSqFt), 'to EL 48.0', `${n0(ES.cutByFloor['48.0'])} cy`],
      ['', '', '', '', ''],
      ['PROVIDED', '', '', '', `${n0(CS.totalProvidedCy + ES.cutByFloor['48.0'])} cy`],
      ['REQUIRED by proposed grading', '', '', '', `${n0(CS.requiredCurrentGradingCy)} cy`],
      ['DEFICIT', '', '', '', `${n0(CS.requiredCurrentGradingCy - CS.totalProvidedCy - ES.cutByFloor['48.0'])} cy`],
      ['', '', '', '', ''],
      ['FILL BELOW EL ' + f(FB.bfe) + ' — DISTRIBUTION', '', '', '', ''],
      ['beneath dwelling footprints', '', '', '', `${n0(FB.belowBfeCy.underFootprints)} cy`],
      ['within 10 ft of a dwelling', '', '', '', `${n0(FB.belowBfeCy.within10ft)} cy`],
      ['driveways, aprons, tie-out', '', '', '', `${n0(FB.belowBfeCy.drivewaysAndTieOut)} cy`],
      ['', '', '', '', ''],
      ['RESOLUTION: reduce fill. Vented stem-wall or', '', '', '', ''],
      ['pier foundations and driveways at existing grade', '', '', '', ''],
      ['bring the balance within the volume provided.', '', '', '', '']]),
  [0.34, 0.12, 0.18, 0.19, 0.17])

table2(tc2(2), T2Y, cw2, T2H, 'FLOODPLAIN REMOVAL AND FOUNDATION DETERMINATION',
  ['LOT', 'LOWEST GROUND', 'WS MUST FALL BELOW', 'REQUIRED DROP', 'ACHIEVABLE'],
  Object.entries(MIT.lotLowestGroundFt as Record<string, number>).map(([addr, lo]) => {
    const lot = { '9588 Fort Foote Rd': '53', '9584 Fort Foote Rd': '54', '9580 Fort Foote Rd': '55', '9576 Fort Foote Rd': '56' }[addr]!
    return [`LOT ${lot}`, `EL ${f(lo)}`, `EL ${f(lo)}`, `${f(R.existing[3].headwaterElFt - lo)} ft`,
      lo > MIT.tailwaterFloorFt ? 'partial' : 'NO']
  }).concat([['', '', '', '', ''],
    [`Controlling tailwater lower bound: EL ${f(MIT.tailwaterFloorFt)}`, '', '', '', ''],
    ['The upstream water surface cannot be lowered', '', '', '', ''],
    ['below the downstream water surface.', '', '', '', ''],
    ['', '', '', '', ''],
    ['LOWEST FLOOR DETERMINATION', '', '', '', ''],
    ['LOT', 'PROPOSED FF', 'BASEMENT', 'REQ LOWEST FLOOR', 'STATUS'],
    ...bldg.map((b: any, i: number) => {
      const lot = ['53', '54', '55', '56'][i]
      return [`LOT ${lot}`, f(b.finishedFloorElevFt),
        b.basementElevFt == null ? 'none' : f(b.basementElevFt), f(wsel100 + 2),
        b.finishedFloorElevFt >= wsel100 + 2 ? 'COMPLIES' : 'LOW']
    }),
    ['', '', '', '', ''],
    ['Basements are not permissible on any lot.', '', '', '', ''],
    ['Vented stem-wall or pier foundations required', '', '', '', ''],
    ['on Lots 54 and 55 per ASCE 24 and 44 CFR 60.3.', '', '', '', '']]),
  [0.3, 0.18, 0.2, 0.16, 0.16])

doc.end()
doc.on('end', () => {
  const buf = Buffer.concat(chunks)
  const p = join(OUT, 'indian-queen-FP-101-floodplain-study.pdf')
  writeFileSync(p, buf)
  console.log(`wrote ${p} — ${(buf.length / 1024).toFixed(0)} kB`)
})
