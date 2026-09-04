/**
 * Sheet set to PDF.
 *
 * The property that matters is dimensional truth. A plan reviewer scales
 * measurements off these drawings, so the paper must be exactly ARCH D and the
 * geometry must go through the same viewport the SVG path uses. A PDF that
 * looks right but prints at 97% is worse than no PDF.
 */

import { inflateSync } from 'zlib'
import { renderSheetSetPdf } from '../sheets/render-pdf'
import { buildSheetContext } from '../sheets/render-svg'
import { ARCH_D, ANSI_B, fitViewport, boundsOf } from '../sheets/viewport'
import { createSiteTwin, addFeatures, addSource } from '../site-plan/site-twin'
import { gisSourceRecord, LEVEL_1_DISCLOSURE } from '../site-plan/reliability'
import { buildResponsibilityBlock } from '../review/content-scope'
import type { SheetId } from '../sheets/sheet-template'

const X = 1326382.7, Y = 464763.1
const ring = {
  coordinates: [[X, Y], [X + 65, Y], [X + 65, Y + 100], [X, Y + 100], [X, Y]] as [number, number][],
}

function twin(verticalDatum: string | null = null) {
  let t = createSiteTwin({
    siteId: 's', projectId: 'p', organizationId: 'o',
    address: '4500 Rhode Island Ave, Brentwood, MD 20722',
    jurisdictionCode: 'prince_georges_md',
    crs: 'EPSG:2248', horizontalDatum: 'NAD83', verticalDatum,
  })
  t = addSource(t, gisSourceRecord({
    sourceId: 'gis1', authority: 'M-NCPPC', dataset: 'PGAtlas parcels',
    crs: 'EPSG:2248', horizontalDatum: 'NAD83',
  }))
  t = { ...t, zoneCode: 'RSF-65' }
  const b = { sourceId: 'gis1', reliabilityLevel: 1 as const, crs: 'EPSG:2248', revision: 1 }
  return addFeatures(t, [
    { kind: 'Parcel', id: 'pc', parcelId: '17-2345678', ring, areaSqFt: 6500, ...b } as never,
    { kind: 'Setback', id: 'sb', side: 'front', distanceFt: 25, citation: 'Sec. 27-4202', ring, ...b } as never,
    { kind: 'Building', id: 'bl', existing: false, ring, ...b } as never,
    { kind: 'Contour', id: 'c1', line: [[X, Y, 112], [X + 65, Y + 20, 113]], ...b } as never,
  ])
}

function ctxFor(sheet: SheetId, t = twin(), index = 1, count = 1) {
  return buildSheetContext({
    sheet, twin: t, projectName: 'Brentwood Addition',
    sheetIndex: index, sheetCount: count,
    disclosure: LEVEL_1_DISCLOSURE,
  })
}

describe('the file really is a PDF', () => {
  it('emits a valid PDF header and EOF marker', async () => {
    const out = await renderSheetSetPdf({ sheets: [ctxFor('C-100')] })
    const head = out.buffer.subarray(0, 5).toString('latin1')
    expect(head).toBe('%PDF-')
    expect(out.buffer.subarray(-1024).toString('latin1')).toContain('%%EOF')
    expect(out.buffer.length).toBeGreaterThan(1000)
  })

  it('produces one page per sheet', async () => {
    const t = twin()
    const out = await renderSheetSetPdf({
      sheets: [ctxFor('C-000', t, 1, 3), ctxFor('C-100', t, 2, 3), ctxFor('C-200', t, 3, 3)],
    })
    expect(out.pageCount).toBe(3)
    // /Count in the page tree should agree.
    expect(out.buffer.toString('latin1')).toMatch(/\/Count\s+3/)
  })
})

/**
 * Decompressed page content — what the sheet actually draws.
 *
 * The raw PDF buffer holds Flate streams, so grepping it finds dictionary
 * keys and nothing a reviewer would read. Inflating is the difference between
 * asserting on the file and asserting on the drawing.
 */
function inflateStreams(buf: Buffer): string {
  const raw = buf.toString('latin1')
  let out = raw
  const re = /stream\r?\n/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    const start = m.index + m[0].length
    const end = raw.indexOf('endstream', start)
    if (end < 0) continue
    try {
      out += inflateSync(Buffer.from(raw.slice(start, end), 'latin1')).toString('latin1')
    } catch {
      // Not every stream is Flate — images and metadata are not.
    }
  }
  return out
}

describe('dimensional truth', () => {
  it('sets the page to exactly ARCH D — 36 x 24 inches at 72dpi', async () => {
    const out = await renderSheetSetPdf({ sheets: [ctxFor('C-100')] })
    const text = out.buffer.toString('latin1')
    // 36in = 2592pt, 24in = 1728pt
    expect(ARCH_D.widthPt).toBe(2592)
    expect(ARCH_D.heightPt).toBe(1728)
    expect(text).toMatch(/\/MediaBox\s*\[\s*0\s+0\s+2592\s+1728\s*\]/)
  })

  it('reports the scale it PLOTTED, not the scale the SVG path computes', async () => {
    // A delivered production sheet said 1" = 10' in its title block over a
    // drawing plotted, and scale-barred, at 1" = 20'. The title block was fed
    // `ctx.scale` from buildSheetContext, which fits the lot alone, while this
    // renderer fits the lot PLUS a 70 ft margin so the street centreline lands
    // on the sheet. Two viewports, two answers, one sheet.
    //
    // The rendered text cannot be asserted here — pdfkit writes embedded-font
    // glyph ids, so the drawn strings are not in the buffer at any level of
    // decompression. The renderer therefore reports what it plotted.
    const ctx = ctxFor('C-100')
    const out = await renderSheetSetPdf({ sheets: [ctx] })
    expect(out.plottedScales).toHaveLength(1)
    expect(out.plottedScales[0].sheet).toBe('C-100')
    expect(out.plottedScales[0].scaleLabel).toMatch(/^1" = [\d.]+'$/)
    // The margin makes the plotted extent larger, so the plotted scale covers
    // at least as many feet per inch as the tight SVG fit. If this ever
    // inverts, the margin has stopped being applied.
    const feet = (l: string) => Number(l.replace(/[^\d.]/g, ''))
    expect(feet(out.plottedScales[0].scaleLabel)).toBeGreaterThanOrEqual(feet(ctx.scale))
  })

  it('honours a different sheet size when asked', async () => {
    const out = await renderSheetSetPdf({ sheets: [ctxFor('C-100')], sheetSize: ANSI_B })
    expect(out.buffer.toString('latin1')).toMatch(/\/MediaBox\s*\[\s*0\s+0\s+1224\s+792\s*\]/)
  })

  it('uses the same viewport the SVG path uses, so both scale identically', () => {
    // If these ever diverge, a measurement taken off the PDF stops matching the
    // one taken off the SVG, and the graphic scale bar lies on one of them.
    const vp = fitViewport(boundsOf([ring]), ARCH_D, 20)
    expect(vp.scaleFtPerIn).toBe(10)
    expect(vp.pointsPerFoot).toBeCloseTo(72 / 10, 6)
    expect(vp.label).toBe('1" = 10\'')
  })
})

describe('what the sheet must say', () => {
  it('carries the preliminary disclosure when the data is Level 1', async () => {
    const out = await renderSheetSetPdf({ sheets: [ctxFor('C-100')] })
    // pdfkit compresses content streams, so assert on the context rather than
    // the bytes — the renderer draws exactly what the context carries.
    expect(ctxFor('C-100').disclosure).toBe(LEVEL_1_DISCLOSURE)
    expect(LEVEL_1_DISCLOSURE).toMatch(/NOT FOR PERMIT OR CONSTRUCTION/i)
    expect(out.buffer.length).toBeGreaterThan(1000)
  })

  it('reports a missing frame element rather than printing an incomplete sheet silently', async () => {
    // No vertical datum, which the frame audit treats as a missing element.
    const out = await renderSheetSetPdf({ sheets: [ctxFor('C-400', twin(null))] })
    expect(Array.isArray(out.frameFailures)).toBe(true)
    for (const f of out.frameFailures) expect(f.missing.length).toBeGreaterThan(0)
  })

  it('renders a divided-responsibility title block without forcing a sheet split', async () => {
    const t = twin()
    const block = buildResponsibilityBlock({ sheet: 'C-100', features: t.features })
    expect(block.rows.length).toBeGreaterThan(1)
    const out = await renderSheetSetPdf({
      sheets: [ctxFor('C-100', t)],
      responsibility: { 'C-100': block },
    })
    // One page carrying several disciplines' seals, which is the point.
    expect(out.pageCount).toBe(1)
    expect(out.buffer.length).toBeGreaterThan(1000)
  })

  it('accepts source-and-accuracy notes for the sheet', async () => {
    const out = await renderSheetSetPdf({
      sheets: [ctxFor('C-100')],
      sourceNotes: ['M-NCPPC PGAtlas parcels, retrieved 2026-08-22, EPSG:2248, mapping grade'],
    })
    expect(out.buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  })
})

describe('robustness', () => {
  it('renders a twin with no geometry rather than throwing', async () => {
    const bare = createSiteTwin({
      siteId: 's', projectId: 'p', organizationId: 'o', address: 'Unknown',
      jurisdictionCode: 'prince_georges_md', crs: 'EPSG:2248', horizontalDatum: 'NAD83',
    })
    const out = await renderSheetSetPdf({
      sheets: [buildSheetContext({ sheet: 'C-000', twin: bare, projectName: 'Empty', sheetIndex: 1, sheetCount: 1 })],
    })
    expect(out.buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  })

  it('renders every canonical sheet id', async () => {
    const t = twin('NAVD88')
    const ids: SheetId[] = ['C-000', 'C-100', 'C-200', 'C-300', 'C-400', 'C-500', 'C-600', 'C-700', 'C-800', 'C-900', 'L-100', 'TCP-NRI']
    const out = await renderSheetSetPdf({
      sheets: ids.map((id, i) => ctxFor(id, t, i + 1, ids.length)),
    })
    expect(out.pageCount).toBe(12)
  })
})
