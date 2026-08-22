/**
 * Sheet set to PDF.
 *
 * The SVG renderer already projects site coordinates onto the sheet; this draws
 * the same geometry through the SAME viewport with pdfkit rather than
 * converting the SVG. That matters for one reason: a plan reviewer scales
 * measurements off these drawings with an engineer's scale, so the mapping
 * between ground feet and paper points has to be exact and identical across
 * both outputs. Converting SVG would put a second transform in the path, and a
 * second transform is a second chance to be quietly wrong.
 *
 * A PDF point is 1/72 inch, which is the unit `fitViewport` already works in,
 * so the projection carries over unchanged.
 */

import PDFDocument from 'pdfkit'
import type { SiteTwin, SiteFeature, GenericFeature, Ring, Position } from '../site-plan/site-twin'
import { featuresOfKind } from '../site-plan/site-twin'
import {
  ARCH_D, boundsOf, fitViewport, project, projectRing, graphicScaleTicks,
  type SheetSize, type Viewport, type Bounds,
} from './viewport'
import type { SheetContext, SheetId } from './sheet-template'
import { SHEET_TITLES, auditSheetFrame } from './sheet-template'
import type { DividedResponsibilityBlock } from '../review/content-scope'

const PAD_FT = 20

/** Line weights in points, following normal civil drafting hierarchy. */
const PEN = {
  boundary: { width: 1.6, color: '#000000', dash: undefined as number[] | undefined },
  setback: { width: 0.7, color: '#555555', dash: [4, 3] },
  building: { width: 1.0, color: '#000000', dash: undefined },
  proposed: { width: 1.2, color: '#000000', dash: undefined },
  easement: { width: 0.7, color: '#777777', dash: [6, 2, 1, 2] },
  contour: { width: 0.4, color: '#8a6d3b', dash: undefined },
  frame: { width: 0.8, color: '#000000', dash: undefined },
  hair: { width: 0.35, color: '#000000', dash: undefined },
}
type Pen = typeof PEN[keyof typeof PEN]

type Doc = InstanceType<typeof PDFDocument>

function stroke(doc: Doc, pen: Pen): void {
  doc.lineWidth(pen.width).strokeColor(pen.color)
  if (pen.dash) doc.dash(pen.dash[0], { space: pen.dash[1] ?? pen.dash[0] })
  else doc.undash()
  doc.stroke()
}

function polyline(doc: Doc, pts: [number, number][], pen: Pen, close = false): void {
  if (pts.length < 2) return
  doc.moveTo(pts[0][0], pts[0][1])
  for (const p of pts.slice(1)) doc.lineTo(p[0], p[1])
  if (close) doc.closePath()
  stroke(doc, pen)
}

function box(doc: Doc, x: number, y: number, w: number, h: number, pen: Pen): void {
  doc.rect(x, y, w, h)
  stroke(doc, pen)
}

function label(doc: Doc, x: number, y: number, s: string, size = 8, opts: { bold?: boolean; color?: string } = {}): void {
  doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
     .fontSize(size)
     .fillColor(opts.color ?? '#000000')
     .text(s, x, y, { lineBreak: false })
}

// ── Frame ───────────────────────────────────────────────────────────────────

function northArrow(doc: Doc, x: number, y: number): void {
  doc.moveTo(x, y + 26).lineTo(x, y).lineTo(x - 5, y + 8).moveTo(x, y).lineTo(x + 5, y + 8)
  stroke(doc, PEN.frame)
  label(doc, x - 3, y + 30, 'N', 9, { bold: true })
}

/**
 * A graphic scale bar. Printed alongside the ratio because a PDF can be printed
 * at the wrong size — the bar survives that, the "1 inch = 20 feet" note does not.
 */
function graphicScale(doc: Doc, x: number, y: number, vp: Viewport): void {
  const ticks = graphicScaleTicks(vp)
  const end = ticks[ticks.length - 1]
  doc.moveTo(x, y).lineTo(x + end.pt, y)
  stroke(doc, PEN.hair)
  for (const t of ticks) {
    doc.moveTo(x + t.pt, y - 4).lineTo(x + t.pt, y + 4)
    stroke(doc, PEN.hair)
    label(doc, x + t.pt - 6, y + 7, `${t.ft}`, 6)
  }
  label(doc, x, y - 14, `GRAPHIC SCALE — ${vp.label}`, 7, { bold: true })
  label(doc, x + end.pt + 8, y + 7, 'FEET', 6)
}

function titleBlock(
  doc: Doc,
  ctx: SheetContext,
  sheet: SheetSize,
  responsibility?: DividedResponsibilityBlock,
): void {
  const x = sheet.widthPt - sheet.marginPt - sheet.titleBlockWidthPt
  const y = sheet.marginPt
  const w = sheet.titleBlockWidthPt
  const h = sheet.heightPt - sheet.marginPt * 2
  box(doc, x, y, w, h, PEN.frame)

  let cy = y + 12
  label(doc, x + 8, cy, 'KEALEE', 15, { bold: true }); cy += 18
  label(doc, x + 8, cy, 'design, build, deliver', 7, { color: '#666666' }); cy += 18

  const row = (k: string, v: string) => {
    label(doc, x + 8, cy, k, 6, { color: '#666666' }); cy += 8
    label(doc, x + 8, cy, v, 8); cy += 13
  }
  row('PROJECT', ctx.projectName)
  row('ADDRESS', ctx.twin.address)
  row('JURISDICTION', ctx.twin.jurisdictionCode.replace(/_/g, ' '))
  row('ZONE', ctx.twin.zoneCode ?? 'Not determined')
  row('SHEET', `${ctx.sheet} — ${SHEET_TITLES[ctx.sheet]}`)
  row('SCALE', ctx.scale)
  row('STATUS', ctx.status.replace(/_/g, ' '))
  row('SHEET NO.', `${ctx.sheetIndex} OF ${ctx.sheetCount}`)

  // Coordinate and datum notes. A sheet without them cannot be tied to
  // anything, and a reviewer will ask.
  cy += 4
  label(doc, x + 8, cy, 'COORDINATES', 6, { color: '#666666' }); cy += 8
  label(doc, x + 8, cy, ctx.twin.crs || 'CRS NOT ESTABLISHED', 7); cy += 10
  label(doc, x + 8, cy, `H: ${ctx.twin.horizontalDatum ?? 'not established'}`, 7); cy += 10
  label(doc, x + 8, cy, `V: ${ctx.twin.verticalDatum ?? 'NOT ESTABLISHED'}`, 7); cy += 16

  // Divided responsibility. A sheet routinely carries more than one
  // profession's content, and each seal covers only its own subjects.
  if (responsibility && responsibility.rows.length) {
    label(doc, x + 8, cy, 'PROFESSIONAL RESPONSIBILITY', 6, { color: '#666666' }); cy += 10
    for (const r of responsibility.rows) {
      label(doc, x + 8, cy, r.title, 7, { bold: true }); cy += 9
      doc.font('Helvetica').fontSize(6).fillColor('#444444')
         .text(`certifies: ${r.certifies.join(', ')}`, x + 8, cy, { width: w - 16 })
      cy = doc.y + 3
      box(doc, x + 8, cy, w - 16, 34, PEN.hair)
      label(doc, x + 12, cy + 13, 'SEAL AND SIGNATURE', 5, { color: '#999999' })
      cy += 40
    }
    doc.font('Helvetica').fontSize(5).fillColor('#666666')
       .text(responsibility.divisionNote, x + 8, cy, { width: w - 16 })
    cy = doc.y + 6
  }

  // Revisions, bottom-anchored.
  const revY = y + h - 16 - Math.max(1, ctx.revisions.length) * 10
  label(doc, x + 8, revY - 10, 'REVISIONS', 6, { color: '#666666' })
  if (ctx.revisions.length === 0) {
    label(doc, x + 8, revY, '— none —', 7, { color: '#999999' })
  } else {
    ctx.revisions.forEach((r, i) => {
      label(doc, x + 8, revY + i * 10, `${r.number}  ${r.date}  ${r.description.slice(0, 34)}`, 6)
    })
  }
}

/**
 * The reliability disclosure, printed across the drawing area.
 *
 * Deliberately unmissable. A plan drawn from GIS that reads as a survey is the
 * single most damaging thing this system could produce, so the wording is fixed
 * and the placement is across the middle of the sheet rather than tucked in a
 * corner.
 */
function watermark(doc: Doc, ctx: SheetContext, sheet: SheetSize): void {
  if (!ctx.disclosure) return
  const cx = (sheet.widthPt - sheet.titleBlockWidthPt) / 2
  const cy = sheet.heightPt / 2
  doc.save()
  doc.rotate(-22, { origin: [cx, cy] })
  doc.font('Helvetica-Bold').fontSize(26).fillColor('#d92b2b').opacity(0.16)
     .text(ctx.disclosure, cx - 380, cy - 16, { width: 760, align: 'center' })
  doc.opacity(1).restore()
}

// ── Geometry ────────────────────────────────────────────────────────────────

function ringsFor(twin: SiteTwin): Ring[] {
  return twin.features.flatMap(f => ('ring' in f && f.ring ? [f.ring] : []))
}

/**
 * `featuresOfKind` cannot narrow the GenericFeature kinds: they all share one
 * interface whose `kind` is a union, so Extract collapses to never. They also
 * all share the same shape, which is what makes this cast safe rather than
 * merely convenient.
 */
function genericOfKind(twin: SiteTwin, kind: GenericFeature['kind']): GenericFeature[] {
  return twin.features.filter(f => f.kind === kind) as GenericFeature[]
}

function drawGeometry(doc: Doc, ctx: SheetContext, vp: Viewport, b: Bounds): void {
  const t = ctx.twin

  for (const p of featuresOfKind(t, 'Parcel')) {
    polyline(doc, projectRing(p.ring, vp, b, PAD_FT), PEN.boundary, true)
  }
  for (const e of featuresOfKind(t, 'Easement')) {
    polyline(doc, projectRing(e.ring, vp, b, PAD_FT), PEN.easement, true)
  }
  for (const s of featuresOfKind(t, 'Setback')) {
    if (s.ring) polyline(doc, projectRing(s.ring, vp, b, PAD_FT), PEN.setback, true)
  }
  for (const bl of featuresOfKind(t, 'Building')) {
    polyline(doc, projectRing(bl.ring, vp, b, PAD_FT), bl.existing ? PEN.building : PEN.proposed, true)
  }
  for (const c of genericOfKind(t, 'Contour')) {
    if (c.line?.length) polyline(doc, c.line.map((p: Position) => project(p, vp, b, PAD_FT)), PEN.contour)
  }
  for (const seg of featuresOfKind(t, 'BoundarySegment')) {
    polyline(doc, [project(seg.from, vp, b, PAD_FT), project(seg.to, vp, b, PAD_FT)], PEN.boundary)
  }
}

// ── Sheets ──────────────────────────────────────────────────────────────────

export interface RenderPdfInput {
  sheets: SheetContext[]
  sheetSize?: SheetSize
  /** Title-block responsibility rows, keyed by sheet id. */
  responsibility?: Partial<Record<SheetId, DividedResponsibilityBlock>>
  /** Printed on the cover as the source-and-accuracy note. */
  sourceNotes?: string[]
}

export interface RenderedPdf {
  buffer: Buffer
  pageCount: number
  /** Frame elements missing on any sheet — an issuance blocker, not a warning. */
  frameFailures: { sheet: SheetId; missing: string[] }[]
}

/**
 * Renders the sheet set.
 *
 * Frame completeness is audited per sheet and reported rather than enforced:
 * the caller decides whether an incomplete sheet may be issued, and the QC gate
 * already treats a missing frame element as blocking. Refusing to render here
 * would leave nobody able to see what is wrong.
 */
export function renderSheetSetPdf(input: RenderPdfInput): Promise<RenderedPdf> {
  const sheetSize = input.sheetSize ?? ARCH_D
  const frameFailures: RenderedPdf['frameFailures'] = []

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [sheetSize.widthPt, sheetSize.heightPt],
      margin: 0,
      autoFirstPage: false,
      info: {
        Title: `Site Plan — ${input.sheets[0]?.twin.address ?? 'Kealee'}`,
        Author: 'Kealee',
        Subject: 'Preliminary site plan set',
      },
    })

    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve({ buffer: Buffer.concat(chunks), pageCount: input.sheets.length, frameFailures }))
    doc.on('error', reject)

    for (const ctx of input.sheets) {
      const audit = auditSheetFrame(ctx)
      if (!audit.complete) frameFailures.push({ sheet: ctx.sheet, missing: [...audit.missing] })

      doc.addPage({ size: [sheetSize.widthPt, sheetSize.heightPt], margin: 0 })

      const rings = ringsFor(ctx.twin)
      const b = boundsOf(rings)
      const vp = fitViewport(b, sheetSize, PAD_FT)

      // Sheet border and drawing area
      box(doc, sheetSize.marginPt / 2, sheetSize.marginPt / 2,
          sheetSize.widthPt - sheetSize.marginPt, sheetSize.heightPt - sheetSize.marginPt, PEN.frame)

      drawGeometry(doc, ctx, vp, b)

      const drawRight = sheetSize.widthPt - sheetSize.marginPt - sheetSize.titleBlockWidthPt
      northArrow(doc, drawRight - 40, sheetSize.marginPt + 24)
      graphicScale(doc, sheetSize.marginPt + 16, sheetSize.heightPt - sheetSize.marginPt - 26, vp)

      // Source and accuracy note — where every number on the sheet came from.
      if (input.sourceNotes?.length) {
        let ny = sheetSize.heightPt - sheetSize.marginPt - 96
        label(doc, sheetSize.marginPt + 16, ny, 'SOURCE AND ACCURACY', 6, { color: '#666666' })
        for (const n of input.sourceNotes.slice(0, 4)) {
          ny += 9
          doc.font('Helvetica').fontSize(6).fillColor('#444444')
             .text(n, sheetSize.marginPt + 16, ny, { width: 380, lineBreak: false, ellipsis: true })
        }
      }

      titleBlock(doc, ctx, sheetSize, input.responsibility?.[ctx.sheet])
      watermark(doc, ctx, sheetSize)
    }

    doc.end()
  })
}
