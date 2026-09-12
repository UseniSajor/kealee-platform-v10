/**
 * FP-103 — Floodplain Delineation. One subject, nothing else.
 *
 * A delineation exhibit exists to answer one question: where is the line. Every
 * layer that is not the line, the ground it was derived from, and the parcels
 * it crosses, is removed — no grading, no utilities, no landscape, no details,
 * no schedules, no cross sections, no design. What remains is the boundary of
 * record, the existing contours the surface was cut from, the water-surface
 * elevations, and the limits themselves.
 *
 *   npx tsx packages/spatial-engine/scripts/floodplain-delineation-sheet.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import PDFDocument from 'pdfkit'
import { ARCH_D } from '../src/sheets/viewport'

const PROJ = join(process.cwd(), 'projects', 'indian-queen')
const R = JSON.parse(readFileSync(join(PROJ, 'model', 'indian-queen.floodplain-study-results.json'), 'utf8'))
const INU = JSON.parse(readFileSync(join(PROJ, 'model', 'indian-queen.floodplain-inundation.json'), 'utf8'))
const MODEL = JSON.parse(readFileSync(join(PROJ, 'model', 'indian-queen.floodplain-model-input.json'), 'utf8'))
const GEO = JSON.parse(readFileSync(join(PROJ, 'drawings', 'indian-queen-floodplain-delineation.geojson'), 'utf8'))
const TWIN = JSON.parse(readFileSync(join(PROJ, 'drawings', 'indian-queen-lots-53-56.twin.json'), 'utf8'))

const S = ARCH_D
const M = S.marginPt
const TB = S.titleBlockWidthPt
const f = (n: number, d = 2) => n.toFixed(d)
const n0 = (n: number) => Math.round(n).toLocaleString('en-US')
const LOT: Record<string, string> = {
  '9588 Fort Foote Rd': '53', '9584 Fort Foote Rd': '54',
  '9580 Fort Foote Rd': '55', '9576 Fort Foote Rd': '56',
}

type Doc = InstanceType<typeof PDFDocument>
type Pen = { color: string; width: number; dash?: number[] }
const line = (doc: Doc, pts: [number, number][], p: Pen) => {
  if (pts.length < 2) return
  doc.save().lineWidth(p.width).strokeColor(p.color)
  if (p.dash) doc.dash(p.dash[0], { space: p.dash[1] })
  doc.moveTo(pts[0][0], pts[0][1])
  for (const q of pts.slice(1)) doc.lineTo(q[0], q[1])
  doc.stroke().undash().restore()
}
const poly = (doc: Doc, pts: [number, number][], fill: string, op: number) => {
  if (pts.length < 3) return
  doc.save().fillOpacity(op).fillColor(fill)
  doc.moveTo(pts[0][0], pts[0][1])
  for (const q of pts.slice(1)) doc.lineTo(q[0], q[1])
  doc.closePath().fill().restore()
}
const text = (doc: Doc, x: number, y: number, s: string, size = 8,
  o: { bold?: boolean; color?: string; align?: 'left' | 'right'; width?: number } = {}) => {
  doc.save().fontSize(size).fillColor(o.color ?? '#000')
    .font(o.bold ? 'Helvetica-Bold' : 'Helvetica')
    .text(s, x, y, { lineBreak: false, align: o.align, width: o.width }).restore()
}
const box = (doc: Doc, x: number, y: number, w: number, h: number, c = '#000', lw = 1.2) =>
  doc.save().lineWidth(lw).strokeColor(c).rect(x, y, w, h).stroke().restore()

const doc = new PDFDocument({
  size: [S.widthPt, S.heightPt], margin: 0, autoFirstPage: true,
  info: { Title: 'FP-103 Floodplain Delineation — Indian Queen East Lots 53-56',
    Author: 'Kealee', Subject: 'Floodplain delineation exhibit — PRELIMINARY' },
})
const chunks: Buffer[] = []
doc.on('data', (c: Buffer) => chunks.push(c))

box(doc, M, M, S.widthPt - 2 * M, S.heightPt - 2 * M)
const DX = M + 10, DY = M + 10
const DW = S.widthPt - 2 * M - TB - 20, DH = S.heightPt - 2 * M - 20

// ── title block ────────────────────────────────────────────────────────────
const tbx = S.widthPt - M - TB
box(doc, tbx, M, TB, S.heightPt - 2 * M)
let cy = M + 12
text(doc, tbx + 8, cy, 'KEALEE', 15, { bold: true }); cy += 18
text(doc, tbx + 8, cy, 'design, build, deliver', 7, { color: '#666' }); cy += 20
const row = (k: string, v: string) => {
  text(doc, tbx + 8, cy, k, 6, { color: '#666' }); cy += 8
  doc.save().fontSize(8).font('Helvetica').fillColor('#000').text(v, tbx + 8, cy, { width: TB - 16 })
  cy += doc.heightOfString(v, { width: TB - 16 }) + 6; doc.restore()
}
row('PROJECT', 'Indian Queen East — Lots 53, 54, 55 and 56')
row('ADDRESS', '9588  ·  9584  ·  9580  ·  9576 Fort Foote Road')
row('JURISDICTION', "Prince George's County, Maryland")
row('SHEET', 'FP-103 — FLOODPLAIN DELINEATION')
row('DISCIPLINE', 'Maryland Professional Engineer')
row('HORIZONTAL DATUM', 'NAD 83, Maryland State Plane, US survey feet (EPSG:2248)')
row('VERTICAL DATUM', 'NAVD 88')
row('WATERCOURSE', 'North Branch Broad Creek')
row('CONTROLLING STRUCTURE', 'Fort Foote Road crossing, sag EL ' + f(R.crossing.roadSagElFt))
row('DATE', new Date(R.generatedAt).toISOString().slice(0, 10))
cy += 4
box(doc, tbx + 6, cy, TB - 12, 62)
text(doc, tbx + 12, cy + 6, 'STATUS', 6, { color: '#666' })
doc.save().fontSize(7.4).font('Helvetica-Bold').fillColor('#b71c1c')
  .text('PRELIMINARY. This delineation is derived from published county LiDAR '
    + 'terrain, not from a field survey, and is not a sealed floodplain study.',
    tbx + 12, cy + 16, { width: TB - 24 }).restore()
cy += 70
box(doc, tbx + 6, cy, TB - 12, 86)
text(doc, tbx + 12, cy + 6, 'PROFESSIONAL CERTIFICATION', 6, { color: '#666' })
text(doc, tbx + 12, cy + 64, 'Maryland P.E. No. ________  Date __________', 7, { color: '#999' })
cy += 94

// ── water-surface elevation schedule ───────────────────────────────────────
text(doc, tbx + 8, cy, 'WATER-SURFACE ELEVATIONS', 8, { bold: true }); cy += 12
text(doc, tbx + 8, cy, 'EVENT', 6, { color: '#666' })
text(doc, tbx + 76, cy, 'EXISTING', 6, { color: '#666' })
text(doc, tbx + 150, cy, 'PROPOSED', 6, { color: '#666' })
text(doc, tbx + 228, cy, 'AREA', 6, { color: '#666' })
cy += 9
line(doc, [[tbx + 8, cy], [tbx + TB - 14, cy]], { color: '#999', width: 0.5 }); cy += 4
for (const p of [10, 25, 50, 100]) {
  const v = INU[String(p)]
  text(doc, tbx + 8, cy, `${p}-year`, 7.5, { bold: p === 100 })
  text(doc, tbx + 76, cy, `EL ${f(v.wselExisting)}`, 7.5, { bold: p === 100 })
  text(doc, tbx + 150, cy, `EL ${f(v.wselProposed)}`, 7.5, { bold: p === 100 })
  text(doc, tbx + 228, cy, `${f(v.inundatedExistingAc, 2)} ac`, 7.5)
  cy += 11
}
cy += 8

// ── per-lot schedule ───────────────────────────────────────────────────────
text(doc, tbx + 8, cy, 'AREA BELOW THE 100-YEAR SURFACE', 8, { bold: true }); cy += 12
text(doc, tbx + 8, cy, 'LOT', 6, { color: '#666' })
text(doc, tbx + 52, cy, 'LOT AREA', 6, { color: '#666' })
text(doc, tbx + 126, cy, 'EXISTING', 6, { color: '#666' })
text(doc, tbx + 214, cy, 'PROPOSED', 6, { color: '#666' })
cy += 9
line(doc, [[tbx + 8, cy], [tbx + TB - 14, cy]], { color: '#999', width: 0.5 }); cy += 4
for (const [addr, d] of Object.entries(INU['100'].lots as Record<string, any>)) {
  text(doc, tbx + 8, cy, `LOT ${LOT[addr]}`, 7.5, { bold: true })
  text(doc, tbx + 52, cy, `${n0(d.lotAreaSf)} sf`, 7.5)
  text(doc, tbx + 126, cy, `${n0(d.floodedExistingSf)} sf (${f(d.floodedExistingPct, 0)}%)`, 7.5)
  text(doc, tbx + 214, cy, `${n0(d.floodedProposedSf)} sf (${f(d.floodedProposedPct, 0)}%)`, 7.5)
  cy += 11
}
cy += 10

// ── legend ─────────────────────────────────────────────────────────────────
const EX: Pen = { color: '#1565c0', width: 2.0, dash: [8, 3, 2, 3] }
const PR: Pen = { color: '#0d47a1', width: 1.5 }
const LOTPEN: Pen = { color: '#000', width: 1.1 }
const CONT: Pen = { color: '#b0b0b0', width: 0.35 }
text(doc, tbx + 8, cy, 'LEGEND', 8, { bold: true }); cy += 12
for (const [lab, pen] of [
  ['100-year floodplain limit — EXISTING condition', EX],
  ['100-year floodplain limit — PROPOSED condition', PR],
  ['Lot boundary of record, Plat Book WWW 65 f. 60', LOTPEN],
  ['Existing contour, 2 ft, county LiDAR (2023)', CONT],
] as [string, Pen][]) {
  line(doc, [[tbx + 8, cy + 3], [tbx + 46, cy + 3]], pen)
  text(doc, tbx + 52, cy, lab, 6.6)
  cy += 12
}
doc.save().fillOpacity(0.12).fillColor('#1565c0').rect(tbx + 8, cy, 38, 8).fill().restore()
text(doc, tbx + 52, cy, 'Area below the 100-year water surface', 6.6)
cy += 18

// ── basis note ─────────────────────────────────────────────────────────────
box(doc, tbx + 6, cy, TB - 12, 132)
text(doc, tbx + 12, cy + 6, 'BASIS OF DELINEATION', 7.5, { bold: true })
doc.save().fontSize(6.2).font('Helvetica').fillColor('#333').text(
  'The limits shown are the intersection of the modelled water surface with the '
  + 'terrain, flood-filled from the watercourse so that depressions not connected '
  + 'to it are excluded. Water-surface elevations are from a one-dimensional steady '
  + 'standard-step model of North Branch Broad Creek through the Fort Foote Road '
  + 'crossing, with the crossing analysed to FHWA HDS-5 and the roadway treated as '
  + 'a broad-crested weir. Discharges are by NRCS TR-55 on a '
  + f(R.hydrology.watershed.areaAc, 0) + '-acre contributing area. '
  + 'Terrain is PGAtlas Contour 2 Ft (2023), NAVD 88. NOT A FIELD SURVEY. '
  + 'The existing culvert has not been measured. FPS 200546, the controlling county '
  + 'study of record, has not been obtained. See the floodplain study for the full '
  + 'basis, assumptions and limitations.',
  tbx + 12, cy + 18, { width: TB - 24 }).restore()

// ── THE DRAWING ────────────────────────────────────────────────────────────
box(doc, DX, DY, DW, DH)
text(doc, DX + 10, DY + 8, '100-YEAR FLOODPLAIN DELINEATION — EXISTING AND PROPOSED CONDITIONS', 13, { bold: true })
text(doc, DX + 10, DY + 26, 'North Branch Broad Creek at Fort Foote Road', 8.5, { color: '#555' })

const pts: [number, number][] = []
for (const ft of GEO.features) {
  if (ft.properties.returnPeriod !== 100) continue
  for (const r of ft.geometry.coordinates) for (const q of r) pts.push(q as [number, number])
}
for (const r of Object.values(MODEL.lots as Record<string, [number, number][]>)) pts.push(...r)
const PAD = 60
const x0 = Math.min(...pts.map(p => p[0])) - PAD, x1 = Math.max(...pts.map(p => p[0])) + PAD
const y0 = Math.min(...pts.map(p => p[1])) - PAD, y1 = Math.max(...pts.map(p => p[1])) + PAD
const top = 44
const sc = Math.min((DW - 40) / (x1 - x0), (DH - top - 46) / (y1 - y0))
const ox = DX + 20 + ((DW - 40) - (x1 - x0) * sc) / 2
const oy = DY + top + ((DH - top - 46) - (y1 - y0) * sc) / 2
const T = (p: number[]): [number, number] => [ox + (p[0] - x0) * sc, oy + (y1 - p[1]) * sc]

doc.save().rect(DX + 2, DY + top - 8, DW - 4, DH - top - 2).clip()
for (const ftr of TWIN.features) {
  if (ftr.kind !== 'Contour' || (ftr.attributes ?? {}).proposed) continue
  line(doc, (ftr.line as number[][]).map(T), CONT)
}
for (const ftr of GEO.features) {
  if (ftr.properties.returnPeriod !== 100) continue
  const isEx = ftr.properties.condition === 'existing'
  for (const r of ftr.geometry.coordinates) {
    const p = (r as number[][]).map(T)
    if (isEx) poly(doc, p, '#1565c0', 0.12)
    line(doc, p, isEx ? EX : PR)
  }
}
for (const [addr, r] of Object.entries(MODEL.lots as Record<string, [number, number][]>)) {
  const p = (r as number[][]).map(T)
  line(doc, [...p, p[0]], LOTPEN)
  const cx = p.reduce((s2, q) => s2 + q[0], 0) / p.length
  const cyy = p.reduce((s2, q) => s2 + q[1], 0) / p.length
  const d = INU['100'].lots[addr]
  text(doc, cx - 18, cyy - 14, `LOT ${LOT[addr]}`, 11, { bold: true })
  text(doc, cx - 30, cyy, `${f(d.floodedExistingPct, 0)}% existing`, 6.4, { color: '#1565c0' })
  text(doc, cx - 30, cyy + 8, `${f(d.floodedProposedPct, 0)}% proposed`, 6.4, { color: '#0d47a1' })
}
// water-surface annotations along the limit
for (const st of [-300, 100, 300]) {
  const sec = MODEL.sections.find((s2: any) => s2.rs === st)
  if (!sec) continue
  const p = T([sec.x, sec.y])
  text(doc, p[0] + 6, p[1] - 4, `WS EL ${f(INU['100'].wselExisting)}`, 7, { bold: true, color: '#1565c0' })
}
const sag = T(MODEL.roadSagXY)
doc.save().lineWidth(1.8).strokeColor('#b71c1c')
  .moveTo(sag[0] - 10, sag[1] - 10).lineTo(sag[0] + 10, sag[1] + 10)
  .moveTo(sag[0] + 10, sag[1] - 10).lineTo(sag[0] - 10, sag[1] + 10).stroke().restore()
text(doc, sag[0] + 14, sag[1] - 4, `FORT FOOTE RD — CONTROLLING SECTION, SAG EL ${f(R.crossing.roadSagElFt)}`,
  7.5, { bold: true, color: '#b71c1c' })
doc.restore()

const bar = 100 * sc
const bx = DX + 20, by = DY + DH - 26
line(doc, [[bx, by], [bx + bar, by]], { color: '#000', width: 1.3 })
for (let i = 0; i <= 4; i++) line(doc, [[bx + bar * i / 4, by - 5], [bx + bar * i / 4, by + 5]], { color: '#000', width: 1 })
text(doc, bx, by + 8, `0${' '.repeat(22)}100 FEET`, 7)
text(doc, bx + bar + 14, by - 3, `1 in = ${f(72 / sc, 0)} ft`, 8, { bold: true })
{
  const nx = DX + DW - 60, ny = DY + 66
  line(doc, [[nx, ny], [nx, ny - 24]], { color: '#000', width: 1.5 })
  doc.save().fillColor('#000').moveTo(nx, ny - 30).lineTo(nx - 5, ny - 19).lineTo(nx + 5, ny - 19).closePath().fill().restore()
  text(doc, nx - 14, ny + 4, 'NORTH', 8.5, { bold: true })
}

doc.end()
doc.on('end', () => {
  const p = join(PROJ, 'drawings', 'indian-queen-FP-103-floodplain-delineation.pdf')
  writeFileSync(p, Buffer.concat(chunks))
  console.log(`wrote ${p}`)
})
