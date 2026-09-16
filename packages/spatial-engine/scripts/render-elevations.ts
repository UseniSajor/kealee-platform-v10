/**
 * Schematic building elevations for a yield study's unit types.
 *
 *   pnpm tsx scripts/render-elevations.ts <study.yield.json> <out.pdf>
 *
 * Front elevations drawn parametrically from the same numbers the study uses
 * — bay width, footprint, storeys, floor-to-floor, height against the zone's
 * cap — plus a street elevation of the frontage row. They are massing
 * elevations for a concept: openings, materials and roof form are placeholders
 * an architect replaces; the dimensions are the ones the site plan relies on.
 */
import { createWriteStream, readFileSync } from 'fs'
import PDFDocument from 'pdfkit'

type Facade = {
  key: string; label: string; bayWidthFt: number; bays: number; storeys: number; groundFt: number; upperFt: number
  heightFt: number; heightCapFt: number | null; groundUse: 'retail' | 'garage' | 'living'; roof: 'flat' | 'pitched'
  unitsPerBay: number; note: string
}
type Study = {
  name: string; zone: string
  standards: { perType: Record<string, { maxHeightFt: number | null }> }
  unitTypes: Record<string, { label: string; lotWidthFt: number; footprintFt: [number, number]; unitsPerBay: number; stickMaxUnits: number; storeys?: number; heightFt?: number; retailSqFtPerBay?: number }>
  yield: { byType: { type: string; bays: number; dwellingUnits: number }[] }
  layout: { units: { type: string }[] }
}

function facadesOf(y: Study): Facade[] {
  const out: Facade[] = []
  const has = (k: string) => y.yield.byType.find(t => t.type === k && t.bays > 0)
  const cap = (k: string) => y.standards.perType[k]?.maxHeightFt ?? null
  if (has('mixedUse')) {
    const u = y.unitTypes.mixedUse
    out.push({ key: 'mixedUse', label: 'MIXED USE — RETAIL AT GRADE, DWELLINGS ABOVE', bayWidthFt: u.footprintFt[0], bays: 3, storeys: u.storeys ?? 5, groundFt: 14, upperFt: 12,
      heightFt: u.heightFt ?? 62, heightCapFt: cap('mixedUse'), groundUse: 'retail', roof: 'flat', unitsPerBay: u.unitsPerBay,
      note: `Three of the ${has('mixedUse')!.bays} party-wall buildings on the street line of Gunpowder Drive; ${u.retailSqFtPerBay?.toLocaleString()} sf retail at grade, four residential floors (${u.unitsPerBay} du) each; 14-ft ground floor, 12-ft floors above.` })
  }
  if (has('twoOverTwo')) {
    const u = y.unitTypes.twoOverTwo
    out.push({ key: 'twoOverTwo', label: 'TWO-OVER-TWO — STACKED, TWO DWELLINGS PER BAY', bayWidthFt: u.lotWidthFt, bays: 4, storeys: 4, groundFt: 10, upperFt: 10,
      heightFt: 44, heightCapFt: cap('twoOverTwo'), groundUse: 'garage', roof: 'flat', unitsPerBay: 2,
      note: `Four of ${u.stickMaxUnits} bays; a lower two-storey dwelling over its garage and an upper two-storey dwelling, ${u.lotWidthFt}-ft bays, 44 ft to the parapet.` })
  }
  if (has('townhouse')) {
    const u = y.unitTypes.townhouse
    out.push({ key: 'townhouse', label: 'TOWNHOUSE — STICK OF SIX', bayWidthFt: u.lotWidthFt, bays: Math.min(6, u.stickMaxUnits), storeys: 3, groundFt: 10, upperFt: 10,
      heightFt: 38, heightCapFt: cap('townhouse'), groundUse: 'garage', roof: 'pitched', unitsPerBay: 1,
      note: `${u.lotWidthFt}-ft units, three storeys with a front-load garage, 38 ft to the ridge.` })
  }
  if (has('twoFamily')) {
    const u = y.unitTypes.twoFamily
    out.push({ key: 'twoFamily', label: 'TWO-FAMILY (DUPLEX) — SIDE BY SIDE', bayWidthFt: u.lotWidthFt, bays: 2, storeys: 2, groundFt: 10, upperFt: 10,
      heightFt: 32, heightCapFt: cap('twoFamily'), groundUse: 'living', roof: 'pitched', unitsPerBay: 1,
      note: `Two ${u.lotWidthFt}-ft dwellings under one roof, two storeys, 32 ft to the ridge.` })
  }
  return out
}

async function main() {
  const [src, out] = process.argv.slice(2)
  if (!src || !out) { console.error('usage: render-elevations.ts <study.yield.json> <out.pdf>'); process.exit(1) }
  const y = JSON.parse(readFileSync(src, 'utf8')) as Study
  const facades = facadesOf(y)
  const W = 36 * 72, H = 24 * 72, M = 36
  const doc = new PDFDocument({ size: [W, H], margin: 0, info: { Title: `${y.name} — building elevations` } })
  const stream = createWriteStream(out); doc.pipe(stream)
  doc.rect(M / 2, M / 2, W - M, H - M).lineWidth(1.5).stroke('#000')
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#000').text('BUILDING ELEVATIONS — CONCEPT MASSING', M + 8, M + 6)
  doc.font('Helvetica').fontSize(9).fillColor('#333').text(`${y.name} · zone ${y.zone} · drawn from the yield study's dimensions; openings, materials and roof form are placeholders for the architect. Heights are to the parapet or ridge, measured from average grade at the building.`, M + 8, M + 26, { width: W - 2 * M - 16 })

  // Layout: elevations stacked, scale chosen so the widest fits the sheet width.
  const ppfCandidates = [72 / 8, 72 / 10, 72 / 16, 72 / 20]   // 1/8", 1/10", 1/16", 1/20" per ft
  const widest = Math.max(...facades.map(f => f.bayWidthFt * f.bays)) + 40
  const ppf = ppfCandidates.find(p => widest * p <= W - 2 * M - 40) ?? 72 / 20
  const scaleLabel = ppf === 9 ? '1/8" = 1\'' : ppf === 7.2 ? '1/10" = 1\'' : ppf === 4.5 ? '1/16" = 1\'' : '1/20" = 1\''
  let top = M + 54
  const drawFacade = (f: Facade, x0: number, gradeY: number, ppfIn = ppf) => {
    const ppf = ppfIn
    const wPt = f.bayWidthFt * f.bays * ppf
    const hPt = f.heightFt * ppf
    // ground line
    doc.moveTo(x0 - 20, gradeY).lineTo(x0 + wPt + 20, gradeY).lineWidth(1.2).stroke('#000')
    doc.font('Helvetica').fontSize(6).fillColor('#000').text('GRADE', x0 - 20, gradeY + 2)
    // body
    const bodyTop = gradeY - (f.roof === 'pitched' ? (f.heightFt - 8) * ppf : hPt)
    doc.rect(x0, bodyTop, wPt, gradeY - bodyTop).lineWidth(0.9).fillAndStroke('#f4f0ea', '#000')
    // floor lines
    let yy = gradeY - f.groundFt * ppf
    for (let s = 1; s < f.storeys; s++) { doc.moveTo(x0, yy).lineTo(x0 + wPt, yy).lineWidth(0.4).dash(3, { space: 2 }).stroke('#666').undash(); yy -= f.upperFt * ppf }
    // bays and openings
    for (let b = 0; b < f.bays; b++) {
      const bx = x0 + b * f.bayWidthFt * ppf, bw = f.bayWidthFt * ppf
      if (b > 0) doc.moveTo(bx, bodyTop).lineTo(bx, gradeY).lineWidth(0.6).stroke('#000')   // party wall
      // ground floor
      const g0 = gradeY - f.groundFt * ppf
      if (f.groundUse === 'retail') {
        doc.rect(bx + bw * 0.06, g0 + 1.5 * ppf, bw * 0.88, (f.groundFt - 2.5) * ppf).lineWidth(0.6).fillAndStroke('#d6e8f5', '#245')   // storefront
        doc.rect(bx + bw * 0.42, gradeY - 8 * ppf, bw * 0.16, 8 * ppf).lineWidth(0.6).fillAndStroke('#fff', '#245')                  // door
        doc.moveTo(bx, g0 - 0.2 * ppf).lineTo(bx + bw, g0 - 0.2 * ppf).lineWidth(1.4).stroke('#000')                                  // canopy line
      } else if (f.groundUse === 'garage') {
        doc.rect(bx + bw * 0.1, gradeY - 8 * ppf, bw * 0.45, 8 * ppf).lineWidth(0.6).fillAndStroke('#e0e0e0', '#333')             // garage door
        doc.rect(bx + bw * 0.65, gradeY - 7 * ppf, bw * 0.15, 7 * ppf).lineWidth(0.6).fillAndStroke('#fff', '#333')                 // entry door
      } else {
        doc.rect(bx + bw * 0.12, gradeY - 7 * ppf, bw * 0.14, 7 * ppf).lineWidth(0.6).fillAndStroke('#fff', '#333')                 // door
        doc.rect(bx + bw * 0.45, gradeY - 8 * ppf, bw * 0.35, 5 * ppf).lineWidth(0.6).fillAndStroke('#d6e8f5', '#333')             // window
      }
      // upper floors: windows
      let fy = g0
      for (let s = 1; s < f.storeys; s++) {
        const nWin = f.bayWidthFt >= 60 ? 6 : f.bayWidthFt >= 40 ? 3 : 2
        for (let k = 0; k < nWin; k++) {
          const ww = bw / nWin * 0.45, wx = bx + bw / nWin * (k + 0.275)
          doc.rect(wx, fy - (f.upperFt - 2.5) * ppf, ww, 5.5 * ppf).lineWidth(0.5).fillAndStroke('#d6e8f5', '#333')
        }
        fy -= f.upperFt * ppf
      }
    }
    // roof
    if (f.roof === 'pitched') {
      doc.moveTo(x0 - 4, bodyTop).lineTo(x0 + wPt / 2, gradeY - hPt).lineTo(x0 + wPt + 4, bodyTop).lineWidth(0.9).stroke('#000')
      for (let b = 1; b < f.bays; b++) { /* gable per pair is a placeholder; one ridge drawn */ }
    } else {
      doc.rect(x0, bodyTop - 2, wPt, 2).fill('#000')   // parapet cap
    }
    // height dimension
    const dx = x0 + wPt + 30
    doc.moveTo(dx, gradeY).lineTo(dx, gradeY - hPt).lineWidth(0.5).stroke('#900')
    doc.moveTo(dx - 4, gradeY).lineTo(dx + 4, gradeY).stroke('#900'); doc.moveTo(dx - 4, gradeY - hPt).lineTo(dx + 4, gradeY - hPt).stroke('#900')
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#900').text(`${f.heightFt}'-0"${f.heightCapFt != null ? `  (cap ${f.heightCapFt}')` : ''}`, dx + 6, gradeY - hPt / 2 - 4)
    // bay width dimension
    doc.moveTo(x0, gradeY + 14).lineTo(x0 + f.bayWidthFt * ppf, gradeY + 14).lineWidth(0.5).stroke('#900')
    doc.font('Helvetica').fontSize(6.5).fillColor('#900').text(`${f.bayWidthFt}'-0" BAY`, x0, gradeY + 16)
    return { wPt, hPt }
  }
  for (const f of facades) {
    const hPt = f.heightFt * ppf + 30
    if (top + hPt + 60 > H - M) break
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#000').text(`${f.label} — FRONT ELEVATION   ·   ${scaleLabel}`, M + 8, top)
    doc.font('Helvetica').fontSize(6.5).fillColor('#333').text(f.note, M + 8, top + 12, { width: W - 2 * M - 16 })
    drawFacade(f, M + 40, top + 30 + hPt - 30)
    top += hPt + 60
  }
  // street elevation of the frontage row, if there is one
  const mu = facades.find(f => f.key === 'mixedUse')
  const muCount = y.yield.byType.find(t => t.type === 'mixedUse')?.bays ?? 0
  if (mu && muCount > 0 && top + 120 < H - M) {
    const ppf2 = Math.min(ppf, (W - 2 * M - 80) / (muCount * mu.bayWidthFt + 60))
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#000').text(`STREET ELEVATION — GUNPOWDER DRIVE FRONTAGE, ${muCount} BUILDINGS   ·   1" = ${Math.round(72 / ppf2)}'`, M + 8, top)
    const f2: Facade = { ...mu, bays: muCount }
    drawFacade(f2, M + 40, top + 30 + mu.heightFt * ppf2, ppf2)
    top += mu.heightFt * ppf2 + 70
  }
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#900').text('CONCEPT MASSING ONLY — not construction documents. Storey heights 14 ft (retail) / 12 ft (residential over retail) / 10 ft (townhouse, two-over-two, duplex) are assumptions; the zone cap is the certified Sec. 27-4203 figure.', M + 8, H - M - 14, { width: W - 2 * M - 16 })
  doc.end()
  await new Promise<void>((res, rej) => { stream.on('finish', () => res()); stream.on('error', rej) })
  console.log(`wrote ${out}: ${facades.map(f => f.key).join(', ')}`)
}
main().catch(e => { console.error(e); process.exit(1) })
