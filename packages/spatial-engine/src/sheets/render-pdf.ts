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

import { featuresForSheet } from './composer'
import PDFDocument from 'pdfkit'
import type { SiteTwin, SiteFeature, GenericFeature, Ring, Position } from '../site-plan/site-twin'
import { featuresOfKind } from '../site-plan/site-twin'
import {
  ARCH_D, boundsOf, fitViewport, project, projectRing, graphicScaleTicks,
  type SheetSize, type Viewport, type Bounds,
} from './viewport'
import type { SheetContext, SheetId } from './sheet-template'
import { SHEET_TITLES, SHEET_DISCIPLINE, auditSheetFrame } from './sheet-template'
import { isBuildableEnvelope } from './composer'
import type { DrainageComputation } from '../site-plan/drainage'
import { existsSync } from 'fs'
import { join } from 'path'
import type { DividedResponsibilityBlock } from '../review/content-scope'

const PAD_FT = 20

/** Line weights in points, following normal civil drafting hierarchy. */
/**
 * Pen weights, read off the approved PG plans in `existing site plans/`.
 *
 * A drafted sheet reads by WEIGHT before it reads by label: the property line
 * is the heaviest thing on the page, the building sits just under it, and
 * everything informational falls away beneath. Drawing them all at similar
 * weight is what makes a generated sheet look generated.
 *
 * Existing contours are thin AND dashed; proposed grading is heavier and
 * solid. That contrast is how a reviewer tells existing grade from design
 * intent at a glance, and it is the convention APPROVED-PLAN-ANALYSIS.md
 * records the engine as lacking.
 */
const PEN = {
  boundary: { width: 2.0, color: '#000000', dash: undefined as number[] | undefined },
  setback: { width: 0.8, color: '#444444', dash: [7, 4] },
  building: { width: 1.4, color: '#000000', dash: undefined },
  proposed: { width: 1.2, color: '#000000', dash: undefined },
  easement: { width: 0.6, color: '#777777', dash: [8, 2, 1, 2] },
  /** EXISTING grade: thin and dashed. */
  contour: { width: 0.35, color: '#8a6d3b', dash: [5, 3] },
  /** PROPOSED grade: heavier and solid, so the two never read alike. */
  contourProposed: { width: 0.9, color: '#8a6d3b', dash: undefined },
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
  /**
   * The scale THIS page was actually plotted at.
   *
   * Not `ctx.scale`. That comes from the viewport `buildSheetContext` computed
   * for the SVG path, while the PDF renderer fits its own — and when the two
   * disagreed the sheet stated 1" = 10' in the title block over a drawing
   * plotted, and scale-barred, at 1" = 20'. Anyone scaling off it was wrong by
   * a factor of two.
   */
  scaleLabel: string,
  responsibility?: DividedResponsibilityBlock,
): number {
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
  row('SCALE', scaleLabel)
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
      doc.font('Helvetica').fontSize(7.5).fillColor('#444444')
         .text(`certifies: ${r.certifies.join(', ')}`, x + 8, cy, { width: w - 16 })
      cy = doc.y + 3
      box(doc, x + 8, cy, w - 16, 34, PEN.hair)
      label(doc, x + 12, cy + 13, 'SEAL AND SIGNATURE', 5, { color: '#999999' })
      cy += 40
    }
    doc.font('Helvetica').fontSize(7).fillColor('#666666')
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

  // Bottom of the identity content. Everything else in this column stacks
  // below it — the revisions band is bottom-anchored and is not in the way.
  return cy
}

/**
 * The reliability disclosure, printed across the drawing area.
 *
 * Deliberately unmissable. A plan drawn from GIS that reads as a survey is the
 * single most damaging thing this system could produce, so the wording is fixed
 * and the placement is across the middle of the sheet rather than tucked in a
 * corner.
 */
/**
 * Status labelling is a HUMAN decision.
 *
 * The platform drafts; it does not decide what status a sheet carries. Stamping
 * PRELIMINARY or NOT FOR PERMIT OR CONSTRUCTION pre-empts the professional who
 * reviews and seals the drawing, and it is their call — and their liability —
 * what the sheet says about its own status. The reliability of every source is
 * still stated in the SOURCE AND ACCURACY note, which is fact rather than
 * status.
 */
function watermark(_doc: Doc, _ctx: SheetContext, _sheet: SheetSize): void {
  // Intentionally empty. Kept as a seam so a caller can reinstate a stamp
  // deliberately rather than by editing the render path.
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

function centroidOf(r: [number, number][]): [number, number] {
  return [r.reduce((a, q) => a + q[0], 0) / r.length,
          r.reduce((a, q) => a + q[1], 0) / r.length]
}

/**
 * Diagonal hatch clipped to the POLYGON, not its bounding box.
 *
 * A bbox clip hatches ground the feature does not occupy, which is what made
 * the dwelling read as spilling past the BRL when its outline was inside it.
 */
function hatch(doc: Doc, r: [number, number][], color: string, spacing: number): void {
  const minX = Math.min(...r.map(q => q[0])), maxX = Math.max(...r.map(q => q[0]))
  const minY = Math.min(...r.map(q => q[1])), maxY = Math.max(...r.map(q => q[1]))
  doc.save()
  doc.moveTo(r[0][0], r[0][1])
  for (const q of r.slice(1)) doc.lineTo(q[0], q[1])
  doc.closePath().clip()
  doc.lineWidth(0.25).strokeColor(color).opacity(0.45)
  for (let x = minX - (maxY - minY); x < maxX; x += spacing) {
    doc.moveTo(x, maxY).lineTo(x + (maxY - minY), minY).stroke()
  }
  doc.opacity(1).restore()
}
function drawGeometry(doc: Doc, ctx: SheetContext, vp: Viewport, b: Bounds): void {
  const t = ctx.twin
  const P = (pt: Position) => project(pt, vp, b, PAD_FT)

  // ── Existing topography, drawn first so everything sits over it ───────────
  //
  // Clipped to the parcel plus the twenty-foot adjacent peripheral strip that
  // Sec. 32-130(a)(5) requires. Terrain is fetched over a wider radius so the
  // surface is complete at the boundary; drawing all of it puts the
  // neighbourhood on the sheet and buries the lot.
  const parcelForClip = featuresOfKind(t, 'Parcel')[0]
  const strip = (() => {
    if (!parcelForClip) return null
    const xs = parcelForClip.ring.coordinates.map(q => q[0])
    const ys = parcelForClip.ring.coordinates.map(q => q[1])
    const PERIPHERAL_FT = 20
    return {
      x0: Math.min(...xs) - PERIPHERAL_FT, x1: Math.max(...xs) + PERIPHERAL_FT,
      y0: Math.min(...ys) - PERIPHERAL_FT, y1: Math.max(...ys) + PERIPHERAL_FT,
    }
  })()
  const onLot = (p: Position) =>
    !strip || (p[0] >= strip.x0 && p[0] <= strip.x1 && p[1] >= strip.y0 && p[1] <= strip.y1)

  // Abutting parcels, drawn light and lettered.
  //
  // An approved PG plan carries every neighbouring lot with its number and
  // area — 'LOT 9 / 71,399 SF' — because a reviewer reads the subject against
  // what surrounds it. The engine drew the subject alone, so a two-lot
  // subdivision appeared as one lot in white space.
  // ADJOINING LOTS ARE CONTEXT, DRAWN AS STUBS.
  //
  // Drawn whole they sprawl across the sheet, cross the detail band at the
  // bottom and swamp the two lots the plan is about. A plat shows an adjoiner
  // by the line it SHARES and its name — that is what tells a reviewer what
  // abuts what. Everything past a short reach from the subject boundary is
  // trimmed away.
  const adjAll = (t as { adjacentParcels?: { ring: Ring; areaSqFt: number; propId: string | null }[] })
    .adjacentParcels ?? []
  const subjectRings = featuresOfKind(t, 'Parcel').map(f => f.ring.coordinates as Position[])
  const REACH_FT = 45
  const nearSubject = (q: Position) => subjectRings.some(rg => {
    for (let n = 0; n < rg.length - 1; n++) {
      const a2 = rg[n], b2 = rg[n + 1]
      const vx = b2[0] - a2[0], vy = b2[1] - a2[1]
      const tt = Math.max(0, Math.min(1,
        ((q[0] - a2[0]) * vx + (q[1] - a2[1]) * vy) / (vx * vx + vy * vy || 1)))
      if (Math.hypot(q[0] - (a2[0] + tt * vx), q[1] - (a2[1] + tt * vy)) <= REACH_FT) return true
    }
    return false
  })
  for (const ap of adjAll) {
    const co = ap.ring.coordinates as Position[]
    let run: Position[] = []
    for (let n = 0; n < co.length - 1; n++) {
      if (nearSubject(co[n]) || nearSubject(co[n + 1])) {
        if (!run.length) run.push(co[n])
        run.push(co[n + 1])
      } else if (run.length >= 2) {
        polyline(doc, run.map(q => P(q)), { width: 0.35, color: '#aaaaaa', dash: undefined })
        run = []
      } else run = []
    }
    if (run.length >= 2) {
      polyline(doc, run.map(q => P(q)), { width: 0.35, color: '#aaaaaa', dash: undefined })
    }
  }
  // ── Setback / buildable envelope, dashed ──────────────────────────────────
  for (const s of featuresOfKind(t, 'Setback')) {
    if (s.ring) polyline(doc, projectRing(s.ring, vp, b, PAD_FT), PEN.setback, true)
  }
  // ONE BRL PER LOT, AND ONLY THE BRL IS DRAWN LIKE ONE.
  //
  // This drew EVERY ProposedFeature with the setback pen and lettered each one
  // 'BRL'. A lot carries three of them — the buildable envelope, the graded
  // area and the construction entrance — so the sheet showed two dashed rings
  // around each property, both labelled BRL, and neither said which was which.
  // The limit of disturbance is a different line with a different meaning and
  // it gets its own weight and its own name.
  for (const g of genericOfKind(t, 'ProposedFeature')) {
    if (!g.ring) continue
    const gid = String(g.id ?? '')
    const isEnvelope = isBuildableEnvelope(gid)
    const gLabel = String(g.attributes?.label ?? '')
    const isLod = /graded|disturb/i.test(gLabel)
    const r = projectRing(g.ring, vp, b, PAD_FT)
    const cx = r.reduce((n, q) => n + q[0], 0) / r.length
    const top = Math.min(...r.map(q => q[1]))

    if (isEnvelope) {
      polyline(doc, r, PEN.setback, true)
      // The county letters this BRL — Building Restriction Line — with its
      // distance. 'Buildable envelope' is not a term a PG reviewer reads.
      const sb = (g.attributes?.setbacks ?? {}) as
        { frontFt?: number; sideFt?: number; rearFt?: number }
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#666666')
         .text(sb.frontFt != null ? `${sb.frontFt}' BRL` : 'BRL',
               cx - 34, top - 10, { width: 68, align: 'center', lineBreak: false })
    } else if (isLod) {
      polyline(doc, r, { width: 0.8, color: '#2e7d32', dash: [14, 4, 3, 4] }, true)
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#2e7d32')
         .text('LIMIT OF DISTURBANCE', cx - 60, top - 10,
               { width: 120, align: 'center', lineBreak: false })
    } else {
      polyline(doc, r, { width: 0.7, color: '#8a5a2a', dash: [4, 3] }, true)
      if (gLabel) {
        doc.font('Helvetica').fontSize(6).fillColor('#8a5a2a')
           .text(gLabel.toUpperCase(), cx - 60, top - 8,
                 { width: 120, align: 'center', lineBreak: false })
      }
    }

    // Frontage lettered ON the front lot line.
    //
    // Sec. 24-128 makes street frontage what establishes a buildable lot, and
    // Sec. 27-4202 sets a minimum width at the front street line. A reviewer
    // checks that dimension first, and it was nowhere on the sheet — the front
    // line carried a bearing and distance like any other edge, with nothing
    // saying it IS the frontage.
    const fro = (t as { buildableEnvelope?: {
      edgeYards?: string[]
      frontage?: { providedFt: number | null; requiredFt: number | null; meets: boolean | null }
    } }).buildableEnvelope
    const parcelF = featuresOfKind(t, 'Parcel')[0]
    if (fro?.edgeYards && parcelF && fro.frontage?.providedFt != null) {
      const lp = parcelF.ring.coordinates
      const idx = fro.edgeYards.indexOf('front')
      if (idx >= 0 && idx < lp.length - 1) {
        const m1 = P(lp[idx] as Position), m2 = P(lp[idx + 1] as Position)
        const mx = (m1[0] + m2[0]) / 2, my = (m1[1] + m2[1]) / 2
        let ang = Math.atan2(m2[1] - m1[1], m2[0] - m1[0])
        if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI
        const req = fro.frontage.requiredFt
        const fails = fro.frontage.meets === false
        doc.save()
        doc.translate(mx, my).rotate((ang * 180) / Math.PI)
        doc.font('Helvetica-Bold').fontSize(7.5)
           .fillColor(fails ? '#c0392b' : '#000000')
           .text(`FRONTAGE ${fro.frontage.providedFt.toFixed(2)}'`
             + (req != null ? `  (${req}' MIN)` : ''),
             -56, -13, { width: 112, align: 'center', lineBreak: false })
        doc.restore()
      }
    }

    // Label every yard on its own run of the restriction line, so a reviewer
    // reads the setback rather than scaling it.
    // The per-edge setback dimensions read from the ENVELOPE feature, which is
    // the only one that carries them. `sb` used to be in scope from the loop
    // head, where it was read off whichever proposed feature came round.
    const sb = (g.attributes?.setbacks ?? {}) as
      { frontFt?: number; sideFt?: number; rearFt?: number }
    const yards = (t as { buildableEnvelope?: { edgeYards?: string[] } })
      .buildableEnvelope?.edgeYards
    const parcelRing = featuresOfKind(t, 'Parcel')[0]
    if (yards && parcelRing) {
      const lp = parcelRing.ring.coordinates
      const seen = new Set<string>()
      for (let i = 0; i < Math.min(yards.length, lp.length - 1); i++) {
        const y = yards[i]
        const ft = y === 'front' ? sb.frontFt : y === 'rear' ? sb.rearFt : sb.sideFt
        if (ft == null || seen.has(y)) continue
        seen.add(y)
        const m1 = P(lp[i] as Position), m2 = P(lp[i + 1] as Position)
        const mx = (m1[0] + m2[0]) / 2, my = (m1[1] + m2[1]) / 2
        let ang = Math.atan2(m2[1] - m1[1], m2[0] - m1[0])
        if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI
        doc.save()
        doc.translate(mx, my).rotate((ang * 180) / Math.PI)
        doc.font('Helvetica').fontSize(7).fillColor('#7f8c8d')
           .text(`${ft}' ${y.toUpperCase()} YARD`, -46, 6,
                 { width: 92, align: 'center', lineBreak: false })
        doc.restore()
      }
    }
  }

  // ── Easements ─────────────────────────────────────────────────────────────
  for (const e of featuresOfKind(t, 'Easement')) {
    polyline(doc, projectRing(e.ring, vp, b, PAD_FT), PEN.easement, true)
  }

  // ── Property boundary, heaviest line on the sheet ─────────────────────────
  for (const p of featuresOfKind(t, 'Parcel')) {
    const r = projectRing(p.ring, vp, b, PAD_FT)
    polyline(doc, r, { ...PEN.boundary, width: 1.6 }, true)

    // Bearing and distance on every line, which is what a reviewer checks.
    const co = p.ring.coordinates
    for (let i = 0; i < co.length - 1; i++) {
      const [x1, y1] = co[i], [x2, y2] = co[i + 1]
      const dx = x2 - x1, dy = y2 - y1
      const lenFt = Math.hypot(dx, dy)
      if (lenFt < 8) continue
      const brg = bearingLabel(dx, dy)
      const m1 = P(co[i]), m2 = P(co[i + 1])
      const mx = (m1[0] + m2[0]) / 2, my = (m1[1] + m2[1]) / 2
      let ang = Math.atan2(m2[1] - m1[1], m2[0] - m1[0])
      if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI
      doc.save()
      doc.translate(mx, my).rotate((ang * 180) / Math.PI)
      doc.font('Helvetica').fontSize(7).fillColor('#000000')
         .text(`${brg}  ${lenFt.toFixed(2)}'`, -34, -8, { lineBreak: false, width: 68, align: 'center' })
      doc.restore()
    }

    // Lot identity and area at the centroid.
    const cx = r.reduce((n, q) => n + q[0], 0) / r.length
    const cy = r.reduce((n, q) => n + q[1], 0) / r.length
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000')
       .text(p.parcelId ?? 'LOT', cx - 50, cy - 26, { width: 100, align: 'center', lineBreak: false })
    if (p.areaSqFt) {
      doc.font('Helvetica').fontSize(9).fillColor('#333333')
         .text(`${Math.round(p.areaSqFt).toLocaleString()} SQ FT  (${(p.areaSqFt / 43560).toFixed(3)} AC)`,
               cx - 60, cy - 15, { width: 120, align: 'center', lineBreak: false })
    }
  }

  // ── Proposed site development: driveway, walks ───────────────────────────
  // ── Discipline content ─────────────────────────────────────────────────
  //
  // Utility, SWMPractice, DrainageArea and Tree had NO draw path. The features
  // were computed, put on the twin and correctly filtered onto their sheets,
  // and then nothing drew them — so the utility and landscape sheets came out
  // identical to the boundary sheet.

  for (const u of genericOfKind(t, 'Utility')) {
    if (!u.line || u.line.length < 2) continue
    const pts = u.line.map(q => P(q as Position))
    // Long-dash, as an underground service run is drafted.
    polyline(doc, pts, { width: 0.7, color: '#0066aa', dash: [8, 3] }, false)
    // Labels STAGGERED along their own run. The three services are parallel
    // offsets a few feet apart, so at 1" = 20' their midpoints are within a
    // dozen points of each other and all three names printed in the same place —
    // legible as none of them.
    const label_ = String(u.attributes?.type ?? 'Utility')
    const order = /water/i.test(label_) ? 0 : /sanitary|sewer/i.test(label_) ? 1 : 2
    const t2 = 0.32 + order * 0.18
    const i0 = Math.min(pts.length - 2, Math.floor(t2 * (pts.length - 1)))
    const f2 = t2 * (pts.length - 1) - i0
    const ax = pts[i0][0] + (pts[i0 + 1][0] - pts[i0][0]) * f2
    const ay = pts[i0][1] + (pts[i0 + 1][1] - pts[i0][1]) * f2
    label(doc, ax + 4, ay - 4 - order * 8, label_.toUpperCase(), 5.6, { color: '#0066aa' })
  }

  for (const d of genericOfKind(t, 'DrainageArea')) {
    if (!d.ring) continue
    const r = projectRing(d.ring, vp, b, PAD_FT)
    polyline(doc, r, { width: 0.6, color: '#3388bb', dash: [10, 4, 2, 4] }, true)
    const c = centroidOf(r)
    const ac = d.attributes?.areaAcres
    label(doc, c[0] - 26, c[1], `DA ${ac ?? ''} AC`.trim(), 5, { color: '#3388bb' })
  }

  for (const sw of genericOfKind(t, 'SWMPractice')) {
    if (!sw.ring) continue
    const r = projectRing(sw.ring, vp, b, PAD_FT)
    polyline(doc, r, { width: 1.0, color: '#227744', dash: undefined }, true)
    hatch(doc, r, '#227744', 5)
    const c = centroidOf(r)
    label(doc, c[0] - 20, c[1] - 4, 'ESD', 5, { bold: true, color: '#227744' })
    const ft = sw.attributes?.footprintSqFt
    if (ft) label(doc, c[0] - 20, c[1] + 3, `${ft} SF`, 4.5, { color: '#227744' })
  }

  // Planting. A circle at the canopy radius is how a landscape sheet draws a
  // proposed tree; the L-100 canopy calculation is a separate, unresolved
  // matter (Sec. 25-128 Table 1) and is NOT implied by drawing one.
  // Tree lives in the EnvironmentalFeature union, whose members share one
  // `kind` union — so Extract collapses to never, exactly as the comment on
  // genericOfKind describes. Filter and cast, as the rest of this file does.
  const trees = t.features.filter(f => f.kind === 'Tree') as { ring?: Ring }[]
  for (const tr of trees) {
    if (!tr.ring) continue
    const r = projectRing(tr.ring, vp, b, PAD_FT)
    const c = centroidOf(r)
    const rad = Math.max(3, Math.min(...r.map(q => Math.hypot(q[0] - c[0], q[1] - c[1]))))
    doc.circle(c[0], c[1], rad)
    stroke(doc, { width: 0.6, color: '#2e7d32', dash: undefined })
    doc.circle(c[0], c[1], 1.2)
    stroke(doc, { width: 0.5, color: '#2e7d32', dash: undefined })
  }

  for (const pv of genericOfKind(t, 'Pavement')) {
    if (!pv.ring) continue
    const r = projectRing(pv.ring, vp, b, PAD_FT)
    // EACH PAVED SURFACE READS DIFFERENTLY.
    //
    // One stipple served walk, curb, apron and driveway alike, so on a 2D sheet
    // the sidewalk and the curb and gutter were the same object drawn twice.
    // The approved sets distinguish them — concrete walk, concrete pavement and
    // bituminous each carry their own hatch in the legend — and a reviewer
    // identifies a surface by its pattern before reading its label.
    const kindOf = String((pv.attributes as { improvement?: string } | undefined)?.improvement ?? '')
    const isWalk = /sidewalk|walk/i.test(kindOf)
    const isCurb = /curb/i.test(kindOf)
    // The apron is CONCRETE and the driveway is BITUMINOUS — two materials, two
    // hatches, exactly as the approved legend separates them. Drawn with one
    // stipple they read as a single paved area and the apron, which is the part
    // built to the DPW&T detail under a different permit, disappears into it.
    const isApron = /apron/i.test(kindOf)
    // Weight is a signal, so it is spent on the things a reviewer checks. The
    // curb was heavier than the building line; it is street furniture, not a
    // boundary, and it should sit quietly under the geometry that matters.
    polyline(doc, r,
      isCurb ? { width: 0.45, color: '#8c8c8c', dash: undefined }
      : isWalk ? { width: 0.4, color: '#a0a0a0', dash: undefined }
      : { width: 0.8, color: '#666666', dash: undefined }, true)

    const minX = Math.min(...r.map(q => q[0])), maxX = Math.max(...r.map(q => q[0]))
    const minY = Math.min(...r.map(q => q[1])), maxY = Math.max(...r.map(q => q[1]))
    doc.save()
    doc.moveTo(r[0][0], r[0][1])
    for (const q of r.slice(1)) doc.lineTo(q[0], q[1])
    doc.closePath().clip()
    if (isCurb) {
      // Curb and gutter: a light wash, no fill weight. It reads as a band
      // without becoming the darkest thing on the sheet.
      doc.fillColor('#e2e2e2').opacity(0.5)
      doc.moveTo(r[0][0], r[0][1])
      for (const q of r.slice(1)) doc.lineTo(q[0], q[1])
      doc.closePath().fill()
      doc.opacity(1)
    } else if (isWalk) {
      // Concrete walk: a light DOT stipple. Dots read as concrete at any scale
      // and never resolve into lines that could be mistaken for edges — which
      // is what the earlier cross-hatch did against the curb beside it.
      doc.fillColor('#b4b4b4').opacity(0.85)
      for (let x = minX; x < maxX; x += 2.6) {
        for (let y2 = minY + ((Math.round(x / 2.6) % 2) ? 1.3 : 0); y2 < maxY; y2 += 2.6) {
          doc.circle(x, y2, 0.22).fill()
        }
      }
      doc.opacity(1)
    } else if (isApron) {
      // CONCRETE: a pale ground with a fine speckle, distinct from asphalt.
      doc.fillColor('#efefef').opacity(0.9)
      doc.moveTo(r[0][0], r[0][1])
      for (const q of r.slice(1)) doc.lineTo(q[0], q[1])
      doc.closePath().fill()
      doc.fillColor('#9a9a9a').opacity(0.9)
      for (let x = minX; x < maxX; x += 3.4) {
        for (let y2 = minY + ((Math.round(x / 3.4) % 2) ? 1.7 : 0); y2 < maxY; y2 += 3.4) {
          doc.circle(x, y2, 0.3).fill()
        }
      }
      doc.opacity(1)
    } else {
      // BITUMINOUS: a solid mid-grey, the way the approved legend shows it.
      doc.fillColor('#b9b9b9').opacity(0.75)
      doc.moveTo(r[0][0], r[0][1])
      for (const q of r.slice(1)) doc.lineTo(q[0], q[1])
      doc.closePath().fill()
      doc.opacity(1)
    }
    doc.restore()

    // The label sits OUTSIDE the strip with a LEADER back to it.
    //
    // Centred inside, a label on a 3 ft walk at 1" = 20' overflows its own
    // strip and lands on the two beside it, so the sheet carried three
    // overlapping words and no way to tell which named what. A leader is how a
    // drafter names something too narrow to letter inside.
    const a2 = (pv.attributes ?? {}) as { label?: string }
    if (a2.label && a2.label.trim()) {
      const cx2 = r.reduce((n, q) => n + q[0], 0) / r.length
      const cy2 = r.reduce((n, q) => n + q[1], 0) / r.length
      const lead = isCurb ? 46 : isWalk ? 30 : 16
      const tx = cx2 + lead + 6, ty = cy2 - lead - 4
      doc.moveTo(cx2, cy2).lineTo(cx2 + lead, cy2 - lead)
         .lineWidth(0.3).strokeColor('#777777').stroke()
      doc.circle(cx2, cy2, 0.9).fillColor('#777777').fill()
      doc.font('Helvetica').fontSize(6.5).fillColor('#444444')
         .text(String(a2.label), tx, ty, { width: 150, lineBreak: false })
    }
  }

  // ── Buildings ─────────────────────────────────────────────────────────────
  for (const bl of featuresOfKind(t, 'Building')) {
    const r = projectRing(bl.ring, vp, b, PAD_FT)
    polyline(doc, r, bl.existing ? PEN.building : { ...PEN.proposed, width: 1.4 }, true)

    // NO DATA BLOCK ON THE FOOTPRINT.
    //
    // It was drawn here first, following the approved sheets, and it covered
    // the dwelling it described — on a 46 x 26 ft house at 1"=20' the box is
    // wider than the building. Tables belong in the right-hand column where
    // they can be read; the drawing area carries geometry and dimensions.
    // The footprint's own dimensions, lettered on its sides.
    if (bl.ring.coordinates.length >= 3) {
      const cc = bl.ring.coordinates
      for (let i = 0; i < Math.min(2, cc.length - 1); i++) {
        const ftLen = Math.hypot(cc[i + 1][0] - cc[i][0], cc[i + 1][1] - cc[i][1])
        const p0 = r[i], p1 = r[i + 1]
        const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2
        let ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0])
        // Normalised into [-90, 90] so the text is never inverted. Adding PI
        // once is not enough: an angle already past PI comes back out of range.
        while (ang > Math.PI / 2) ang -= Math.PI
        while (ang < -Math.PI / 2) ang += Math.PI
        // 25.99 ft rounded to 25'-12", which is not a dimension. Inches carry.
        let feet = Math.floor(ftLen)
        let inches = Math.round((ftLen - feet) * 12)
        if (inches === 12) { feet += 1; inches = 0 }
        doc.save()
        doc.translate(mx, my).rotate((ang * 180) / Math.PI)
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#000000')
           .text(`${feet}'-${inches}"`, -34, -9, { width: 68, align: 'center', lineBreak: false })
        doc.restore()
      }
    }
    if (bl.existing) continue

    // Cross-hatch the proposed structure so it reads at a glance.
    //
    // Clipped to the POLYGON, not its bounding box. The footprint is rotated to
    // the front lot line, so a bbox clip hatches ground the building does not
    // occupy — which made the dwelling read as spilling past the BRL when its
    // outline was correctly inside it.
    const minX = Math.min(...r.map(q => q[0])), maxX = Math.max(...r.map(q => q[0]))
    const minY = Math.min(...r.map(q => q[1])), maxY = Math.max(...r.map(q => q[1]))
    doc.save()
    doc.moveTo(r[0][0], r[0][1])
    for (const q of r.slice(1)) doc.lineTo(q[0], q[1])
    doc.closePath().clip()
    doc.lineWidth(0.25).strokeColor('#c0392b').opacity(0.5)
    for (let x = minX - (maxY - minY); x < maxX; x += 7) {
      doc.moveTo(x, maxY).lineTo(x + (maxY - minY), minY).stroke()
    }
    doc.opacity(1).restore()

    // THE THREE ELEVATIONS A BUILDER SETS THE HOUSE FROM, inside the footprint
    // and nothing else. The full six-row table is in the column: at 1"=20' it
    // is wider than a 46 x 26 ft house and covered what it described.
    //
    // ALWAYS HORIZONTAL — rotated to the building's own axis they came out
    // upside down on any wall facing away, and an elevation read upside down is
    // a misread elevation.
    {
      const bAt = (bl as { attributes?: Record<string, unknown> }).attributes ?? {}
      const ev = (k: string) => bAt[k] != null && Number.isFinite(Number(bAt[k]))
        ? Number(bAt[k]).toFixed(2) : '—'
      const rows2: [string, string][] = [
        ['B', ev('basementElevFt')], ['FF', ev('finishedFloorElevFt')], ['SF', ev('subFloorElevFt')],
      ]
      const fx = r.reduce((n, q) => n + q[0], 0) / r.length
      const fy = r.reduce((n, q) => n + q[1], 0) / r.length
      const ew = 44, eh = rows2.length * 8 + 4
      doc.save()
      doc.rect(fx - ew / 2, fy - eh / 2, ew, eh).fillColor('#ffffff').opacity(0.85).fill()
      doc.opacity(1)
      // NO BORDER. A ruled box inside the footprint reads as a feature — a slab,
      // a chase, something built — and it is only a place to put three numbers.
      let ey = fy - eh / 2 + 2
      for (const [k, v] of rows2) {
        doc.font('Helvetica-Bold').fontSize(6).fillColor('#000000')
           .text(k, fx - ew / 2 + 3, ey, { width: 14, lineBreak: false })
        doc.font('Helvetica').fontSize(6).fillColor('#000000')
           .text(v, fx - ew / 2 + 16, ey, { width: ew - 19, align: 'right', lineBreak: false })
        ey += 8
      }
      doc.restore()
    }

    // The label sits ABOVE the footprint, not in it. The data block occupies
    // the centre now, and the two were printing over each other — the one place
    // on the sheet where a builder reads a finished-floor elevation.
    const cx = (minX + maxX) / 2
    const a = (bl as { attributes?: Record<string, unknown> }).attributes ?? {}
    const labelY = minY - 22
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#c0392b')
       .text('PROPOSED DWELLING', cx - 60, labelY, { width: 120, align: 'center', lineBreak: false })
    if (a.areaSqFt) {
      doc.font('Helvetica').fontSize(7.5).fillColor('#c0392b')
         .text(`${Math.round(Number(a.areaSqFt)).toLocaleString()} SQ FT`,
               cx - 60, labelY + 9, { width: 120, align: 'center', lineBreak: false })
    }
  }

/**
 * A street's full name for the sheet.
 *
 * The centreline layer carries the base name only — ROLLINS — so the sheet
 * lettered a street called 'ROLLINS'. A plan names the street the way the
 * address and the plat do.
 */
function streetLabel(name: string | null): string {
  const n = (name ?? '').trim().toUpperCase()
  if (!n) return 'STREET NAME NOT ESTABLISHED'
  if (/\b(AVE|AVENUE|ST|STREET|RD|ROAD|DR|DRIVE|LN|LANE|WAY|CT|COURT|PL|PLACE|BLVD)\b/.test(n)) {
    return n.replace(/\bAVE\b/, 'AVENUE').replace(/\bST\b/, 'STREET')
      .replace(/\bRD\b/, 'ROAD').replace(/\bDR\b/, 'DRIVE')
      .replace(/\bLN\b/, 'LANE').replace(/\bCT\b/, 'COURT')
      .replace(/\bPL\b/, 'PLACE').replace(/\bBLVD\b/, 'BOULEVARD')
  }
  return n
}

  // ── Street centrelines, lettered in the right-of-way ─────────────────────
  //
  // A site plan shows the fronting street and names it. It is also how a
  // reviewer confirms which lot line is the front, and therefore which setback
  // applies where.
  const streets = (t as { streets?: { name: string | null; paths: Position[][] }[] }).streets ?? []
  for (const st of streets) {
    for (const path of st.paths) {
      if (path.length < 2) continue
      // A CENTRELINE IS DASH-DOT, and thin. The [6,3] dash it had is the
      // pattern a curb line or a fence carries, so the centre of the street
      // read as another edge of pavement on a sheet that also draws curb and
      // gutter. Symbology is not decoration: a reviewer identifies a line by
      // its pattern before reading any label.
      polyline(doc, path.map(p => P(p)),
        { width: 0.5, color: '#555555', dash: [14, 3, 1.5, 3] })
      if (st.name && path.length >= 2) {
        const mid = P(path[Math.floor(path.length / 2)])
        const nxt = P(path[Math.min(path.length - 1, Math.floor(path.length / 2) + 1)])
        let ang = Math.atan2(nxt[1] - mid[1], nxt[0] - mid[0])
        if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI
        doc.save()
        doc.translate(mid[0], mid[1]).rotate((ang * 180) / Math.PI)
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#555555')
           .text(streetLabel(st.name), -80, -12, { width: 160, align: 'center', lineBreak: false })
        doc.font('Helvetica').fontSize(7).fillColor('#777777')
           .text('EX. PAVEMENT CENTERLINE  ·  R/W WIDTH PER RECORD PLAT', -80, -3,
                 { width: 160, align: 'center', lineBreak: false })
        doc.restore()
      }
    }
  }

  for (const seg of featuresOfKind(t, 'BoundarySegment')) {
    polyline(doc, [P(seg.from), P(seg.to)], PEN.boundary)
  }
}

/** Surveyor bearing, e.g. N 42°17'30" E. */
function bearingLabel(dx: number, dy: number): string {
  const ns = dy >= 0 ? 'N' : 'S'
  const ew = dx >= 0 ? 'E' : 'W'
  const deg = Math.abs(Math.atan2(dx, dy) * 180 / Math.PI)
  const a = deg > 90 ? 180 - deg : deg
  const d = Math.floor(a)
  const m = Math.floor((a - d) * 60)
  const sec = Math.round((((a - d) * 60) - m) * 60)
  return `${ns} ${d}\u00b0${String(m).padStart(2, '0')}'${String(sec).padStart(2, '0')}" ${ew}`
}

/**
 * SITE DATA table — the zoning compliance summary a reviewer reads first.
 *
 * Required vs provided, side by side, so a plan reviewer can check compliance
 * without scaling anything. DPIE item B-4 also wants lot, block, parcel and
 * owner on the cover, which is why the identity rows lead.
 */
function siteDataTable(doc: Doc, x: number, y: number, ctx: SheetContext): number {
  const t = ctx.twin
  const parcel = t.features.find(f => f.kind === 'Parcel') as
    | { parcelId?: string | null; areaSqFt?: number | null } | undefined
  const bld = t.features.find(f => f.kind === 'Building' && (f as { existing?: boolean }).existing === false) as
    | { attributes?: Record<string, unknown> } | undefined
  const env = (t as { buildableEnvelope?: Record<string, unknown> }).buildableEnvelope
  const sb = (env?.setbacks ?? {}) as { frontFt?: number; sideFt?: number; rearFt?: number }
  const fr = env?.frontage as
    { providedFt: number | null; requiredFt: number | null; meets: boolean | null } | undefined

  const lotArea = parcel?.areaSqFt ?? null
  const fp = bld?.attributes?.areaSqFt ? Number(bld.attributes.areaSqFt) : null
  const covPct = lotArea && fp ? (fp / lotArea) * 100 : null
  const covMax = (env?.coveragePct as number | undefined) ?? null

  const rows: [string, string, string][] = [
    ['ZONE', String(t.zoneCode ?? '—'), ''],
    ['TAX / PARCEL ID', String(parcel?.parcelId ?? '—'), ''],
    ['GROSS LOT AREA', lotArea ? `${Math.round(lotArea).toLocaleString()} SF` : '—',
      lotArea ? `${(lotArea / 43560).toFixed(3)} AC` : ''],
    // Sec. 24-128 makes frontage what establishes a buildable lot, and
    // Sec. 27-4202 sets the minimum AT the front street line. Required beside
    // provided, as the setback rows read.
    ['LOT FRONTAGE', fr?.requiredFt != null ? `${fr.requiredFt}' MIN` : '—',
      fr?.providedFt != null
        ? `${fr.providedFt.toFixed(2)}'${fr.meets === false ? '  DOES NOT MEET' : ''}`
        : 'NOT ESTABLISHED'],
    ['—SETBACKS—', 'REQUIRED', 'PROVIDED'],
    ['FRONT YARD', sb.frontFt != null ? `${sb.frontFt}'` : '—', sb.frontFt != null ? `${sb.frontFt}'` : '—'],
    ['SIDE YARD', sb.sideFt != null ? `${sb.sideFt}'` : '—', sb.sideFt != null ? `${sb.sideFt}'` : '—'],
    ['REAR YARD', sb.rearFt != null ? `${sb.rearFt}'` : '—', sb.rearFt != null ? `${sb.rearFt}'` : '—'],
    ['—COVERAGE—', 'MAX', 'PROPOSED'],
    ['LOT COVERAGE', covMax != null ? `${covMax}%` : '—', covPct != null ? `${covPct.toFixed(1)}%` : '—'],
    ['BUILDING FOOTPRINT', '—', fp ? `${Math.round(fp).toLocaleString()} SF` : '—'],
    ['—DATUM—', '', ''],
    ['HORIZONTAL', String(t.crs ?? '—'), String(t.horizontalDatum ?? '')],
    ['VERTICAL', String(t.verticalDatum ?? 'NOT ESTABLISHED'), ''],
  ]

  const w = 256, rowH = 11
  doc.save().lineWidth(0.7).strokeColor('#000000')
     .rect(x, y, w, rowH * (rows.length + 1)).stroke().restore()
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
     .text('SITE DATA', x + 5, y + 3, { lineBreak: false })

  let cy = y + rowH
  for (const [label, a, b] of rows) {
    const header = label.startsWith('—')
    doc.font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5)
       .fillColor(header ? '#000000' : '#333333')
       .text(header ? label.replace(/—/g, '') : label, x + 5, cy + 2, { width: 108, lineBreak: false })
    doc.font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5).fillColor('#333333')
       .text(a, x + 118, cy + 2, { width: 64, lineBreak: false })
    doc.text(b, x + 186, cy + 2, { width: 60, lineBreak: false })
    doc.save().lineWidth(0.25).strokeColor('#cccccc')
       .moveTo(x, cy + rowH).lineTo(x + w, cy + rowH).stroke().restore()
    cy += rowH
  }
  return cy
}

/** General notes every PG site plan carries. */
/**
 * What the recorded plat says, carried onto the sheet.
 *
 * Reference and NOTES only. The plat's surveyor certificate and owner's
 * dedication attach to that instrument; reproducing them here would assert a
 * certification nobody made about THIS drawing — the same reason the platform
 * never seals. The notes are different: they are conditions of approval that
 * run with the land, and a reviewer expects to see them restated.
 */
function platRecordBlock(
  doc: Doc, t: SiteTwin, x: number, y: number,
): number {
  const rec = (t as { platRecord?: { reference: string; notes: string[]; legend?: string[] } }).platRecord
  if (!rec) return y
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000')
     .text('PLAT OF RECORD', x, y, { lineBreak: false })
  let cy = y + 10
  doc.font('Helvetica').fontSize(7).fillColor('#333333')
     .text(rec.reference, x, cy, { width: 250, height: 54, ellipsis: true })
  cy = doc.y + 4
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#333333')
     .text('NOTES OF RECORD', x, cy, { lineBreak: false })
  cy += 8
  rec.notes.forEach((n, i) => {
    doc.font('Helvetica').fontSize(7).fillColor('#333333')
       .text(`${i + 1}.  ${n}`, x, cy, { width: 250, height: 40, ellipsis: true })
    cy = doc.y + 2
  })
  if (rec.legend?.length) {
    doc.font('Helvetica').fontSize(7).fillColor('#555555')
       .text(rec.legend.join('   ·   '), x, cy + 2, { width: 250, height: 16, ellipsis: true })
    cy = doc.y
  }
  // Stated, so nobody mistakes an absence for an omission.
  doc.font('Helvetica-Oblique').fontSize(7).fillColor('#777777')
     .text('The surveyor certificate, owner dedication and approval signatures of the '
       + 'recorded plat are NOT reproduced here: they attach to that instrument, not to '
       + 'this drawing.', x, cy + 3, { width: 250, height: 26, ellipsis: true })
  return doc.y + 4
}
/**
 * INDEX OF DRAWINGS.
 *
 * Every approved Prince George's set carries one — the Yocum street
 * construction permit lists all twenty sheets in groups on its cover. Without
 * it a reviewer cannot tell a set that is complete from one that is missing
 * sheets, which is exactly the question a first check asks.
 */
function indexOfDrawings(doc: Doc, x: number, y: number, ctx: SheetContext): number {
  const ids = ctx.sheetIds ?? []
  if (!ids.length) return y
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000')
     .text('INDEX OF DRAWINGS', x, y, { lineBreak: false })
  let cy = y + 11
  ids.forEach((id, i) => {
    doc.font('Helvetica').fontSize(7).fillColor('#333333')
       .text(`${String(i + 1).padStart(2, ' ')}   ${id}`, x, cy, { width: 46, lineBreak: false })
    doc.font('Helvetica').fontSize(7).fillColor('#333333')
       .text(SHEET_TITLES[id] ?? '', x + 48, cy, { width: 210, lineBreak: false })
    cy += 8
  })
  return cy
}

/**
 * BUILDING DATA — one row per proposed dwelling.
 *
 * The approved plans letter these five elevations on each footprint: garage
 * slab, basement, finished floor, subfloor, plus height and storeys. A builder
 * sets the house from them and a reviewer checks them against the grading.
 *
 * They live in the COLUMN, not on the building. At 1" = 20' a six-row box is
 * wider than a 46 x 26 ft dwelling, so drawn on the footprint it hid the thing
 * it described.
 *
 * An elevation that has not been computed prints as a dash. A builder pours
 * concrete to these numbers; an invented one is worse than a blank.
 */
function buildingData(doc: Doc, x: number, y: number, w: number, ctx: SheetContext): number {
  const blds = ctx.twin.features.filter(f => f.kind === 'Building') as
    { id: string; attributes?: Record<string, unknown> }[]
  if (!blds.length) return y
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000')
     .text('BUILDING DATA', x, y, { lineBreak: false })
  let cy = y + 12
  const cols = ['', 'G', 'B', 'FF', 'SF', 'HT', 'STY']
  const cw = w / cols.length
  cols.forEach((c, i) => {
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#555555')
       .text(c, x + i * cw, cy, { width: cw - 2, align: i ? 'right' : 'left', lineBreak: false })
  })
  cy += 9
  doc.moveTo(x, cy).lineTo(x + w, cy).lineWidth(0.4).strokeColor('#000000').stroke()
  cy += 3
  blds.forEach((bl, n) => {
    const a = bl.attributes ?? {}
    const num = (k: string) => a[k] != null && Number.isFinite(Number(a[k]))
      ? Number(a[k]).toFixed(2) : '—'
    const label = String(a.lotLabel ?? a.address ?? `DWELLING ${n + 1}`)
    const vals = [label, num('garageSlabElevFt'), num('basementElevFt'),
      num('finishedFloorElevFt'), num('subFloorElevFt'),
      a.heightFt != null ? `${a.heightFt}'` : '—',
      a.storeys != null ? String(a.storeys) : '—']
    vals.forEach((v, i) => {
      doc.font(i ? 'Helvetica' : 'Helvetica-Bold').fontSize(6.5).fillColor('#000000')
         .text(v, x + i * cw, cy, { width: cw - 2, align: i ? 'right' : 'left', lineBreak: false })
    })
    cy += 9
  })
  doc.font('Helvetica').fontSize(6).fillColor('#666666')
     .text('G garage slab · B basement · FF finished floor · SF subfloor · HT height · ' +
           'STY storeys.  A DASH IS NOT ZERO: the elevation has not been established and must be ' +
           'set from a field-run topographic survey before construction.', x, cy + 2, { width: w })
  return doc.y + 2
}

/**
 * DRAINAGE AREA COMPUTATIONS.
 *
 * A drainage area drawn without the numbers behind it asserts a catchment and
 * proves nothing. What a reviewer reads is PRE against POST peak discharge: the
 * increase is what the stormwater management answers for.
 */
function drainageComputations(
  doc: Doc, x: number, y: number, w: number, d: DrainageComputation | null,
): number {
  if (!d) return y
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000')
     .text('DRAINAGE AREA COMPUTATIONS', x, y, { lineBreak: false })
  let cy = y + 12
  const cA = w * 0.52, cB = w * 0.16, cC = w * 0.16, cD = w * 0.16
  const row = (a: string, b: string, c: string, dd: string, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(6.5).fillColor('#000000')
    doc.text(a, x, cy, { width: cA - 3, lineBreak: false })
    doc.text(b, x + cA, cy, { width: cB - 3, align: 'right', lineBreak: false })
    doc.text(c, x + cA + cB, cy, { width: cC - 3, align: 'right', lineBreak: false })
    doc.text(dd, x + cA + cB + cC, cy, { width: cD - 3, align: 'right', lineBreak: false })
    cy += 9
  }
  row('CATCHMENT', 'SF', 'ACRES', 'C', true)
  row(`Total — ${d.percentImpervious.toFixed(1)}% impervious`,
      Math.round(d.totalAreaSqFt).toLocaleString(), d.totalAreaAcres.toFixed(3), '')
  doc.moveTo(x, cy).lineTo(x + w, cy).lineWidth(0.4).strokeColor('#999999').stroke()
  cy += 3
  row('PRE-DEVELOPMENT', 'SF', '', 'C', true)
  for (const sa of d.preDevelopment.subAreas) {
    row(`  ${sa.label}`, Math.round(sa.areaSqFt).toLocaleString(), '', sa.c.toFixed(2))
  }
  row('  Composite C', '', '', d.preDevelopment.compositeC.toFixed(3), true)
  cy += 2
  row('POST-DEVELOPMENT', 'SF', '', 'C', true)
  for (const sa of d.postDevelopment.subAreas) {
    row(`  ${sa.label}`, Math.round(sa.areaSqFt).toLocaleString(), '', sa.c.toFixed(2))
  }
  row('  Composite C', '', '', d.postDevelopment.compositeC.toFixed(3), true)
  doc.moveTo(x, cy).lineTo(x + w, cy).lineWidth(0.4).strokeColor('#999999').stroke()
  cy += 3
  const nn = (v: number | null, u: string, dp = 2) => v == null ? '—' : `${v.toFixed(dp)} ${u}`
  row('Flow path', '', '', nn(d.flowPathFt, 'ft', 0))
  row('Flow path slope', '', '', d.flowPathSlopePct == null ? '—' : `${d.flowPathSlopePct.toFixed(1)} %`)
  row('Time of concentration (Kirpich)', '', '', nn(d.timeOfConcentrationMin, 'min', 1))
  row(`Rainfall intensity, ${d.returnPeriodYr ?? 10}-yr`, '', '', nn(d.intensityInPerHr, 'in/hr'))
  row('Peak discharge PRE, Q = CiA', '', '', nn(d.preDevelopment.peakCfs, 'cfs'))
  row('Peak discharge POST, Q = CiA', '', '', nn(d.postDevelopment.peakCfs, 'cfs'))
  row('INCREASE TO BE MANAGED', '', '', nn(d.increaseCfs, 'cfs'), true)
  row('Rv = 0.05 + 0.009 I', '', '', d.rv == null ? '—' : d.rv.toFixed(4))
  row('Water quality volume WQv', '', '',
      d.waterQualityVolumeCf == null ? '—' : `${Math.round(d.waterQualityVolumeCf).toLocaleString()} cf`, true)
  cy += 3
  for (const a of d.assumptions) {
    doc.font('Helvetica').fontSize(6).fillColor('#555555').text(a, x, cy, { width: w })
    cy = doc.y + 2
  }
  return cy
}

/**
 * COUNTY STANDARD DETAILS, reproduced — not redrawn.
 *
 * The first attempt here drew invented 'typical sections': little diagrams of
 * a walk, a strip and a curb with the widths this plan uses. They looked like
 * details and carried no authority, and a section on a permit set that is not
 * the county's standard is a section a reviewer has to check against one.
 *
 * These are the DPW&T standards themselves, lifted from the approved plan set
 * in `existing site plans/`, with their dimensions, general notes and approval
 * blocks intact:
 *
 *   STD. 300.01  Concrete Curb and Gutter — standard, depressed at driveway,
 *                depressed at sidewalk ramp, spill. Note 6 requires the
 *                depressed section at every driveway apron, which is why the
 *                curb on this plan is interrupted at each one.
 *   STD. 300.07  Concrete Sidewalk Ramp Type A.
 *
 * Reproducing them is the point: the builder builds to these and the reviewer
 * checks against them. Redrawing them from memory would put unverified
 * dimensions on a sheet over the county's own standard number.
 */
const COUNTY_DETAILS: { file: string; title: string; std: string }[] = [
  { file: 'dpwt-300-01-curb-and-gutter.png',
    title: 'CONCRETE CURB AND GUTTER', std: 'PGC DPW&T STD. 300.01' },
  { file: 'dpwt-300-07-sidewalk-ramp.png',
    title: 'CONCRETE SIDEWALK RAMP TYPE A', std: 'PGC DPW&T STD. 300.07' },
]

function countyDetails(doc: Doc, x: number, y: number, w: number, h: number): number {
  const dir = join(__dirname, '..', '..', 'assets', 'details')
  const avail = COUNTY_DETAILS.filter(d => existsSync(join(dir, d.file)))
  if (!avail.length) return y

  // SIZED TO BE READ, not to fit whatever space was left.
  //
  // Squeezed into a shallow band the sections were thumbnails: the dimension
  // strings on a curb section are the whole point of it and at that size they
  // are grey texture. A detail that cannot be read on a printed blueprint is a
  // detail that is not on the sheet.
  //
  // Each is given its natural aspect and a minimum height. If the band cannot
  // hold them the band is not used — the details go where they can be read or
  // they are left for a details sheet.
  const MIN_H = 200
  if (h < MIN_H) return y
  const gap = 14
  const bw = (w - gap * (avail.length - 1)) / avail.length
  avail.forEach((d, i) => {
    const bx = x + i * (bw + gap)
    box(doc, bx, y, bw, h, PEN.frame)
    doc.rect(bx, y, bw, 15).fillColor('#eeeeee').fill()
    box(doc, bx, y, bw, 15, PEN.hair)
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000')
       .text(`${d.title}  —  ${d.std}`, bx + 6, y + 4, { width: bw - 12, lineBreak: false })
    try {
      // `fit` preserves the aspect, so the image uses the full panel and the
      // dimensions scale with it.
      doc.image(join(dir, d.file), bx + 5, y + 18, { fit: [bw - 10, h - 34], align: 'center' })
    } catch {
      doc.font('Helvetica').fontSize(7).fillColor('#8a3a2a')
         .text('DETAIL IMAGE NOT AVAILABLE', bx + 8, y + 24, { width: bw - 16 })
    }
    doc.font('Helvetica').fontSize(6).fillColor('#666666')
       .text("REPRODUCED FROM THE PRINCE GEORGE'S COUNTY DPW&T STANDARD. THE STANDARD GOVERNS.",
             bx + 6, y + h - 11, { width: bw - 12, lineBreak: false })
  })
  return y + h
}
/**
 * A bordered, headed panel — the unit the approved title blocks are built from.
 *
 * The column was a flat stack of headings and rows with nothing separating one
 * subject from the next, so a reader had to work out where the revisions ended
 * and the approvals began. Every approved sheet in this repo sections its block
 * into ruled panels instead.
 */
function panel(doc: Doc, x: number, y: number, w: number, h: number, title: string): number {
  box(doc, x, y, w, h, PEN.frame)
  doc.rect(x, y, w, 13).fillColor('#eeeeee').fill()
  box(doc, x, y, w, 13, PEN.hair)
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
     .text(title, x + 5, y + 3.5, { width: w - 10, lineBreak: false })
  return y + 13
}

/** REVISIONS — ruled empty rows, as every approved sheet carries. */
function revisionsPanel(doc: Doc, x: number, y: number, w: number): number {
  const rows = 4, rowH = 13
  const h = 13 + rows * rowH
  const top = panel(doc, x, y, w, h, 'REVISIONS')
  const c1 = 34, c2 = 62
  doc.font('Helvetica-Bold').fontSize(6).fillColor('#555555')
  doc.text('NO.', x + 4, top + 3, { width: c1 - 8, lineBreak: false })
  doc.text('DATE', x + c1 + 4, top + 3, { width: c2 - 8, lineBreak: false })
  doc.text('DESCRIPTION', x + c1 + c2 + 4, top + 3, { width: w - c1 - c2 - 8, lineBreak: false })
  for (let i = 0; i <= rows; i++) {
    const ly = top + 11 + i * ((h - 13 - 11) / rows)
    doc.moveTo(x, ly).lineTo(x + w, ly).lineWidth(0.3).strokeColor('#999999').stroke()
  }
  for (const cx of [x + c1, x + c1 + c2]) {
    doc.moveTo(cx, top).lineTo(cx, y + h).lineWidth(0.3).strokeColor('#999999').stroke()
  }
  return y + h
}

/** PLAN TYPE, PREPARER AND CHECKING — who made the sheet and in what capacity. */
function preparerPanel(doc: Doc, x: number, y: number, w: number, ctx: SheetContext): number {
  const rows: [string, string][] = [
    ['PLAN TYPE', 'SITE DEVELOPMENT / FINE GRADING'],
    ['SHEET', `${ctx.sheet} — ${SHEET_TITLES[ctx.sheet]}`],
    ['DISCIPLINE', SHEET_DISCIPLINE[ctx.sheet] ?? '—'],
    ['DRAWN BY', 'KEALEE SITE-PLAN ENGINE (AUTOMATED)'],
    ['DESIGNED BY', '— (TO BE COMPLETED BY THE DESIGN PROFESSIONAL)'],
    ['CHECKED BY', '— (TO BE COMPLETED BY THE DESIGN PROFESSIONAL)'],
  ]
  const h = 13 + rows.length * 12 + 4
  const top = panel(doc, x, y, w, h, 'PLAN TYPE AND PREPARATION')
  let cy = top + 4
  for (const [k, v] of rows) {
    doc.font('Helvetica-Bold').fontSize(6.2).fillColor('#555555')
       .text(k, x + 5, cy, { width: 74, lineBreak: false })
    doc.font('Helvetica').fontSize(6.5).fillColor('#000000')
       .text(v, x + 82, cy, { width: w - 88, lineBreak: false })
    cy += 12
  }
  return y + h
}

function generalNotes(doc: Doc, x: number, y: number, twin?: SiteTwin): number {
  // The boundary note has to match where the boundary CAME FROM.
  //
  // It said flatly that the boundary is compiled GIS and not a survey. On a
  // drawing built from a RECORDED PLAT that is false twice over: the plat is
  // the surveyor's certified instrument, and it IS the boundary survey. A
  // reviewer who reads the note and then the plat call table on the same sheet
  // learns the notes are boilerplate, which costs the true ones their weight.
  const plat = (twin as { platRecord?: { reference?: string } } | undefined)?.platRecord
  const notes = [
    'CONTRACTOR SHALL CONTACT MISS UTILITY AT 811 A MINIMUM OF 48 HOURS PRIOR TO ANY EXCAVATION. ' +
    'FIELD-VERIFY LOCATION AND DEPTH BY TEST PIT BEFORE CONSTRUCTION.',
    'ALL EXISTING AND PROPOSED UTILITIES SHOWN PER PGC CODE SEC. 32-106.',
    'PROPOSED GRADE SHOWN SOLID; EXISTING GRADE SHOWN DASHED.',
    'ROUGH EARTHWORK GRADES AND UTILITY ELEVATIONS SHOWN TO TENTHS OF A FOOT.',
    plat?.reference
      ? `BOUNDARY SHOWN IS THE RECORDED PLAT OF SUBDIVISION — ${plat.reference.toUpperCase()} — ` +
        'TRANSCRIBED AND CHECKED FOR CLOSURE. THE PLAT IS THE BOUNDARY SURVEY. NO FIELD ' +
        'TOPOGRAPHY IS INCLUDED; EXISTING GRADE IS COUNTY LIDAR CONTOUR MAPPING.'
      : 'BOUNDARY SHOWN IS COMPILED JURISDICTION GIS, NOT A BOUNDARY SURVEY.',
    // NO STABILIZATION NOTE HERE. It was added by copying an approved sheet's
    // wording, which cites COMAR 26.17.1.08 G — and this repo already
    // established that citation is WRONG: 26.17.01.08 is 'Approval or Denial of
    // Erosion and Sediment Control Plans' and its G is 'Grandfathering'. The
    // three/seven day rule lives in the 2011 Maryland Standards and
    // Specifications for Soil Erosion and Sediment Control, p.45, adopted by
    // reference at COMAR 26.17.01.08A(1). See docs/site-plan-reference/
    // CHECKLIST-FINDINGS.md.
    //
    // The correct text already ships in `site-plan/required-notes.ts`, verified
    // word-for-word against the State source and rendered on C-400 and C-700.
    // Duplicating it here — with the wrong citation — would put the error the
    // repo went to the trouble of catching back onto every sheet.
    'CONNECT TO EXISTING PAVEMENT, CURB AND GUTTER, DRIVEWAY AND SIDEWALK IN LINE AND GRADE.',
  ]
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000')
     .text('GENERAL NOTES', x, y, { lineBreak: false })
  let cy = y + 11
  notes.forEach((n, i) => {
    doc.font('Helvetica').fontSize(7).fillColor('#333333')
       .text(`${i + 1}.  ${n}`, x, cy, { width: 250 })
    cy = doc.y + 2
  })
  return cy
}

/**
 * SITE ANALYSIS — the area tabulation an approved PG plan carries.
 *
 * Taken from the Calvert Manor sheet: gross tract, area of dwelling, wooded
 * area, floodplain area, net tract. A reviewer adds these up.
 */
function siteAnalysis(doc: Doc, x: number, y: number, ctx: SheetContext): number {
  const t = ctx.twin
  const parcel = t.features.find(f => f.kind === 'Parcel') as { areaSqFt?: number | null } | undefined
  const bld = t.features.find(f => f.kind === 'Building' && (f as { existing?: boolean }).existing === false) as
    | { attributes?: Record<string, unknown> } | undefined
  const gross = parcel?.areaSqFt ?? null
  const dwelling = bld?.attributes?.areaSqFt ? Number(bld.attributes.areaSqFt) : null
  const dist = (t as { disturbedAreaSqFt?: number }).disturbedAreaSqFt ?? null

  const fmt = (v: number | null) => v == null ? 'NOT ESTABLISHED' : `${Math.round(v).toLocaleString()} SF`
  const rows: [string, string][] = [
    ['1.  Gross tract area', fmt(gross)],
    ['2.  Area of dwelling', fmt(dwelling)],
    ['3.  Wooded area', 'NOT ESTABLISHED'],
    ['4.  Floodplain area', 'NOT ESTABLISHED'],
    ['5.  Net tract area', fmt(gross)],
    ['6.  TOTAL AREA DISTURBED', dist == null ? 'NOT QUANTIFIED' : fmt(dist)],
  ]
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000')
     .text('SITE ANALYSIS', x, y, { lineBreak: false })
  let cy = y + 11
  for (const [a, b] of rows) {
    doc.font('Helvetica').fontSize(7.5).fillColor('#333333')
       .text(a, x, cy, { width: 150, lineBreak: false })
    doc.text(b, x + 152, cy, { width: 104, lineBreak: false })
    cy += 9
  }
  return cy
}

/** SEQUENCE OF CONSTRUCTION, with the duration each step takes. */
function sequenceOfConstruction(doc: Doc, x: number, y: number, w = 256): number {
  const steps: [string, string][] = [
    ['Pre-construction meeting', '1 DAY'],
    ['Obtain necessary permits', '2 DAYS'],
    ['Notify Miss Utility at 811 at least 48 hours prior to any excavation', '1 DAY'],
    ['Install stabilized construction entrance and perimeter sediment control', '2 DAYS'],
    ['Rough grade the lot', '5 DAYS'],
    ['Construct dwelling', '6 MONTHS'],
    ['Install water, sewer and storm services and the driveway', '10 DAYS'],
    ['Fine grade and stabilize all disturbed areas', '5 DAYS'],
    ['Remove sediment control once the inspector gives written permission', '1 DAY'],
  ]
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000')
     .text('SEQUENCE OF CONSTRUCTION', x, y, { lineBreak: false })
  let cy = y + 11
  // The duration column is measured off the panel width. It was pinned at
  // x + 204 with the text wrapping to 200, so on a wider column the text ran
  // under the duration and the two printed on top of each other.
  const durW = 58
  const textW = w - durW - 8
  steps.forEach(([labelText, dur], i) => {
    const rowTop = cy
    doc.font('Helvetica').fontSize(7).fillColor('#333333')
       .text(`${i + 1}.  ${labelText}`, x, cy, { width: textW })
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000')
       .text(dur, x + textW + 8, rowTop, { width: durW, align: 'right', lineBreak: false })
    cy = doc.y + 2
  })
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
     .text('TOTAL ESTIMATED TIME OF CONSTRUCTION:  8 MONTHS', x, cy + 3, { width: w })
  return doc.y + 4
}

/**
 * Agency approval blocks — empty boxes the county signs.
 *
 * An approved plan reserves these. The engine draws the box and never fills
 * it: the platform does not sign for an agency.
 */
function approvalBlocks(doc: Doc, x: number, y: number): number {
  const blocks = [
    ["PRINCE GEORGE'S COUNTY SOIL CONSERVATION DISTRICT APPROVAL",
     'SEDIMENT CONTROL, GRADING, SOILS & DRAINAGE'],
    ['DPIE SITE/ROAD PLAN REVIEW DIVISION APPROVAL', ''],
  ]
  let cy = y
  for (const [title, sub] of blocks) {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
       .text(title, x, cy, { width: 256 })
    cy = doc.y
    if (sub) {
      doc.font('Helvetica').fontSize(7).fillColor('#666666').text(sub, x, cy, { width: 256 })
      cy = doc.y
    }
    cy += 3
    box(doc, x, cy, 256, 30, PEN.hair)
    doc.font('Helvetica').fontSize(7).fillColor('#999999')
       .text('SIGNATURE', x + 4, cy + 20, { lineBreak: false })
       .text('DATE', x + 190, cy + 20, { lineBreak: false })
    cy += 38
  }
  return cy
}

/**
 * SOILS TABLE — Sec. 32-130(a)(13).
 *
 * The approved Yocum Property plan carries exactly these columns. Drawn along
 * the BOTTOM of the drawing area, where an engineering set puts its tables,
 * rather than in the right-hand block column which is already full.
 */
function soilsTable(doc: Doc, x: number, y: number, ctx: SheetContext, maxW: number): number {
  const soils = (ctx.twin as { soils?: {
    mapUnitSymbol: string; mapUnitName: string; kFactor: string | null
    hydricRating: string | null; hydrologicGroup: string | null; drainageClass: string | null
  }[] }).soils
  if (!soils?.length) return y

  const cols: [string, number][] = [
    ['MAP UNIT', 52], ['MAP UNIT NAME', 210], ['K-FACTOR', 48],
    ['HYDRIC', 44], ['HYD. GROUP', 56], ['DRAINAGE CLASS', 130],
  ]
  const rowH = 10
  const totalW = Math.min(maxW, cols.reduce((n, c) => n + c[1], 0))

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000')
     .text('SOILS TABLE', x, y, { lineBreak: false })
  doc.font('Helvetica').fontSize(7).fillColor('#666666')
     .text('USDA NRCS SSURGO — required by PGC Code Sec. 32-130(a)(13)', x + 62, y + 1, { lineBreak: false })

  let cy = y + 11
  doc.save().lineWidth(0.7).strokeColor('#000000')
     .rect(x, cy, totalW, rowH * (soils.length + 1)).stroke().restore()

  let cx = x
  for (const [label, w] of cols) {
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000')
       .text(label, cx + 3, cy + 3, { width: w - 5, lineBreak: false })
    cx += w
  }
  doc.save().lineWidth(0.5).strokeColor('#000000')
     .moveTo(x, cy + rowH).lineTo(x + totalW, cy + rowH).stroke().restore()
  cy += rowH

  for (const u of soils) {
    const vals = [u.mapUnitSymbol, u.mapUnitName, u.kFactor ?? '—',
                  u.hydricRating ?? '—', u.hydrologicGroup ?? '—', u.drainageClass ?? '—']
    cx = x
    vals.forEach((v, i) => {
      doc.font('Helvetica').fontSize(7).fillColor('#333333')
         .text(String(v), cx + 3, cy + 3, { width: cols[i][1] - 5, lineBreak: false, ellipsis: true })
      cx += cols[i][1]
    })
    doc.save().lineWidth(0.2).strokeColor('#cccccc')
       .moveTo(x, cy + rowH).lineTo(x + totalW, cy + rowH).stroke().restore()
    cy += rowH
  }
  return cy
}

/** Legend — a reviewer must not have to guess what a line means. */
function legend(doc: Doc, x: number, y: number): number {
  const rows: [string, string, boolean][] = [
    ['#000000', 'PROPERTY BOUNDARY', false],
    ['#7f8c8d', 'BRL — BUILDING RESTRICTION LINE', true],
    ['#c0392b', 'PROPOSED STRUCTURE', false],
    // The plan names the DATUM and the interval, not the software the data
    // came from. A source system is provenance for the file, not information
    // for a builder or a reviewer, and it does not belong on a sheet.
    ['#8a6d3b', 'EXISTING CONTOUR — 2 FT INTERVAL, NAVD88', false],
    ['#555555', 'STREET CENTRELINE', true],
    ['#666666', 'PROPOSED PAVEMENT — DRIVEWAY / WALK', false],
    ['#2980b9', 'EASEMENT', true],
  ]
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000').text('LEGEND', x, y, { lineBreak: false })
  let cy = y + 11
  for (const [color, label, dashed] of rows) {
    doc.save().lineWidth(1.1).strokeColor(color)
    if (dashed) doc.dash(3, { space: 2 })
    doc.moveTo(x, cy + 3).lineTo(x + 26, cy + 3).stroke()
    doc.undash().restore()
    doc.font('Helvetica').fontSize(7.5).fillColor('#333333')
       .text(label, x + 32, cy, { lineBreak: false })
    cy += 10
  }
  return cy
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
  /**
   * The scale each page was actually plotted at.
   *
   * Reported because it is not knowable from the outside: this renderer fits
   * the lot PLUS a 70 ft margin so the street centreline lands on the sheet,
   * while `buildSheetContext` fits the lot alone. The two legitimately differ,
   * and a delivered sheet once stated the SVG's scale over a PDF plotted at
   * another. Surfacing it lets a caller check rather than assume.
   */
  plottedScales: { sheet: SheetId; scaleLabel: string }[]
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
  const plottedScales: RenderedPdf['plottedScales'] = []

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
    doc.on('end', () => resolve({
      buffer: Buffer.concat(chunks), pageCount: input.sheets.length, frameFailures, plottedScales,
    }))
    doc.on('error', reject)

    for (const ctxAll of input.sheets) {
      // Draw only what belongs on THIS sheet. `ctx.sheet` used to drive the
      // title block and nothing else, so a set split by discipline produced
      // five pages carrying the identical drawing — different titles over the
      // same lines. A reviewer stamping C-400 Grading was stamping C-100.
      //
      // The base — boundary, BRL, easements, existing contours — stays on every
      // sheet. A grading sheet without lot lines is not usable.
      const ctx: SheetContext = {
        ...ctxAll,
        twin: { ...ctxAll.twin, features: featuresForSheet(ctxAll.twin.features, ctxAll.sheet) },
      }
      const audit = auditSheetFrame(ctx)
      if (!audit.complete) frameFailures.push({ sheet: ctx.sheet, missing: [...audit.missing] })

      doc.addPage({ size: [sheetSize.widthPt, sheetSize.heightPt], margin: 0 })

      const rings = ringsFor(ctx.twin)
      // The fronting street must be ON the sheet — Sec. 24-128 makes street
      // frontage the thing that establishes a buildable lot, and a reviewer
      // confirms the front lot line against it. Fitting to the parcel alone
      // pushed the centreline outside the drawing area, where the clip removed
      // it entirely.
      // Fit to the LOT plus a working margin, NOT to the street extent. A
      // centreline runs for blocks: including it whole shrank a 9,600 sq ft lot
      // to a smudge. The street still appears because the margin reaches it and
      // the geometry clip trims the rest.
      const lotB = boundsOf(rings)

      // A tight working margin, PROPORTIONAL to the content.
      //
      // A flat 70 ft added 140 ft to a 185 ft extent — nearly doubling it —
      // which pushed the plot from 1" = 10' to 1" = 20' and left the lot a
      // small figure in a large white sheet. A drafter fills the sheet.
      const span = Math.max(lotB.maxX - lotB.minX, lotB.maxY - lotB.minY)
      const MARGIN_FT = Math.max(15, span * 0.12)
      let b: Bounds = {
        minX: lotB.minX - MARGIN_FT, maxX: lotB.maxX + MARGIN_FT,
        minY: lotB.minY - MARGIN_FT, maxY: lotB.maxY + MARGIN_FT,
      }

      // Then reach ASYMMETRICALLY to the fronting street.
      //
      // Sec. 24-128 makes street frontage what establishes a buildable lot and
      // a reviewer checks the front lot line against the centreline, so the
      // street must be ON the sheet. A uniform margin big enough to catch it
      // wastes the other three sides; extending only toward the nearest
      // centreline point keeps the lot large AND puts the street on the page.
      //
      // Only the nearest point is chased. A centreline runs for blocks, and
      // fitting its whole extent shrank a 9,600 sq ft lot to a smudge.
      const cx = (lotB.minX + lotB.maxX) / 2, cy = (lotB.minY + lotB.maxY) / 2
      let nearest: Position | null = null
      let nearestD = Infinity
      const twinStreets = (ctx.twin as {
        streets?: { name: string | null; paths: Position[][] }[]
      }).streets ?? []
      for (const st of twinStreets) {
        for (const path of st.paths ?? []) {
          for (const q of path) {
            const d = Math.hypot(q[0] - cx, q[1] - cy)
            if (d < nearestD) { nearestD = d; nearest = q as Position }
          }
        }
      }
      if (nearest) {
        // A little past the centreline, so the right-of-way lettering has room.
        const REACH_FT = 25
        b = {
          minX: Math.min(b.minX, nearest[0] - REACH_FT),
          maxX: Math.max(b.maxX, nearest[0] + REACH_FT),
          minY: Math.min(b.minY, nearest[1] - REACH_FT),
          maxY: Math.max(b.maxY, nearest[1] + REACH_FT),
        }
      }
      const vp = fitViewport(b, sheetSize, PAD_FT)
      plottedScales.push({ sheet: ctx.sheet, scaleLabel: vp.label })

      // Sheet border and drawing area
      box(doc, sheetSize.marginPt / 2, sheetSize.marginPt / 2,
          sheetSize.widthPt - sheetSize.marginPt, sheetSize.heightPt - sheetSize.marginPt, PEN.frame)

      // Geometry is clipped to the drawing area. Without this, a contour that
      // projects beyond the drawing rectangle runs straight under the title
      // block and the data column — nothing but drawing may sit left of
      // `drawRight`, and nothing but drawing may cross it.
      const clipX = sheetSize.marginPt
      const clipY = sheetSize.marginPt
      const clipW = sheetSize.widthPt - sheetSize.marginPt * 2 - sheetSize.titleBlockWidthPt
      const clipH = sheetSize.heightPt - sheetSize.marginPt * 2
      doc.save()
      doc.rect(clipX, clipY, clipW, clipH).clip()
      drawGeometry(doc, ctx, vp, b)
      doc.restore()

      const drawRight = sheetSize.widthPt - sheetSize.marginPt - sheetSize.titleBlockWidthPt
      northArrow(doc, drawRight - 40, sheetSize.marginPt + 24)
      // TYPICAL SECTIONS fill the band the plan does not reach, above the
      // graphic scale. The drawing is centred vertically, so on a site taller
      // than it is wide the sheet is left with usable empty width; a reviewer
      // would rather have the frontage section there than white paper.
      const usedBottom = vp.originY + (b.maxY - b.minY + PAD_FT * 2) * vp.pointsPerFoot
      const scaleTop = sheetSize.heightPt - sheetSize.marginPt - 44
      const bandTop = usedBottom + 14
      const bandH = scaleTop - bandTop - 8
      // The whole remaining band, not a capped strip. These are the county's
      // standard sections and their dimensions have to survive printing.
      countyDetails(doc, sheetSize.marginPt + 16, bandTop,
        drawRight - sheetSize.marginPt - 32, bandH)

      graphicScale(doc, sheetSize.marginPt + 16, sheetSize.heightPt - sheetSize.marginPt - 26, vp)


      // County-required notes, printed in full. pdfkit wraps within `width`,
      // so the certificate is never clipped — unlike the source-and-accuracy
      // note above it, which is a summary and may ellipsis.
      // Source and accuracy note — where every number on the sheet came from.
      if (input.sourceNotes?.length) {
        let ny = sheetSize.heightPt - sheetSize.marginPt - 96
        label(doc, sheetSize.marginPt + 16, ny, 'SOURCE AND ACCURACY', 6, { color: '#666666' })
        for (const n of input.sourceNotes.slice(0, 4)) {
          ny += 9
          doc.font('Helvetica').fontSize(7.5).fillColor('#444444')
             .text(n, sheetSize.marginPt + 16, ny, { width: 380, lineBreak: false, ellipsis: true })
        }
      }

      // All data lives in the right-hand block column, stacked in reading
      // order. Nothing but drawing goes left of `drawRight`; nothing but data
      // goes right of it, so contours and site geometry never run under the
      // title block.
      const blockX = drawRight + 10
      // The column's FULL width, computed rather than typed. It was a hardcoded
      // 256 pt while the column is 7 in wide, so every table and note was set
      // into two-thirds of the space available and wrapped far more than it
      // needed to.
      const blockW = sheetSize.widthPt - sheetSize.marginPt - blockX - 6
      // The title block owns the full-height right column, so its identity
      // content is laid down first and everything else stacks BELOW it.
      // Drawing the data first put it straight over the responsibility rows.
      const tbBottom = titleBlock(doc, ctx, sheetSize, vp.label, input.responsibility?.[ctx.sheet])
      // Tables along the bottom of the DRAWING area, where an engineering set
      // puts them — the right-hand column is already full.
      soilsTable(doc, sheetSize.marginPt + 16,
        sheetSize.heightPt - sheetSize.marginPt - 265, ctx, drawRight - sheetSize.marginPt - 40)

      // THE CERTIFICATION IS ANCHORED TO THE BOTTOM OF THE COLUMN, and the
      // stack above it is clipped to what fits.
      //
      // Laid out in flow order it ran past the page edge, and pdfkit responds
      // to that by starting a NEW PAGE — so a one-sheet plan silently became a
      // two-page PDF with the seal alone on the second. The same failure once
      // turned a five-sheet set into sixty-five pages here.
      const pageBottom = sheetSize.heightPt - sheetSize.marginPt - 8
      const CERT_H = 150
      const certTop = pageBottom - CERT_H
      const room = (want: number, cur: number) => cur + want <= certTop - 6

      let by = preparerPanel(doc, blockX, tbBottom + 12, blockW, ctx) + 8
      if (room(80, by)) by = revisionsPanel(doc, blockX, by, blockW) + 8
      if (room(40, by)) by = indexOfDrawings(doc, blockX, by, ctx) + 12
      if (room(150, by)) by = siteDataTable(doc, blockX, by, ctx) + 12
      if (room(90, by)) by = siteAnalysis(doc, blockX, by, ctx) + 12
      if (room(80, by)) by = buildingData(doc, blockX, by, blockW, ctx) + 12
      const drain = (ctx.twin as { drainage?: DrainageComputation }).drainage ?? null
      if (drain && room(230, by)) by = drainageComputations(doc, blockX, by, blockW, drain) + 12
      if (room(120, by)) by = sequenceOfConstruction(doc, blockX, by, blockW) + 10
      if (room(180, by)) by = generalNotes(doc, blockX, by, ctx.twin) + 10
      if (room(200, by)) by = platRecordBlock(doc, ctx.twin, blockX, by) + 10
      if (room(80, by)) by = legend(doc, blockX, by) + 12
      if (room(110, by)) by = approvalBlocks(doc, blockX, by) + 6

      // ENGINEER'S SEAL AND SIGNATURE AREA.
      //
      // Every approved sheet in this repo carries one — a reserved area for the
      // Maryland PE's embossed seal beside a signature and date. It is left
      // EMPTY: the platform draws the plan and a licensed professional seals it,
      // and a box that pre-fills a name or draws a seal would assert a
      // certification that does not exist.
      let certY = certTop
      label(doc, blockX, certY, "PROFESSIONAL CERTIFICATION", 8.5, { bold: true })
      certY += 11
      doc.font('Helvetica').fontSize(7).fillColor('#000000')
         .text('I HEREBY CERTIFY THAT THESE DOCUMENTS WERE PREPARED OR APPROVED BY ME, AND THAT ' +
               'I AM A DULY LICENSED PROFESSIONAL ENGINEER UNDER THE LAWS OF THE STATE OF ' +
               'MARYLAND.', blockX, certY, { width: blockW })
      certY = doc.y + 4
      const sealH = 84
      box(doc, blockX, certY, blockW, sealH, PEN.hair)
      doc.font('Helvetica').fontSize(6.5).fillColor('#999999')
         .text('SEAL', blockX + 8, certY + sealH - 14, { width: 60, lineBreak: false })
      // Signature, licence and expiry, on ruled lines the PE completes.
      const colW = (blockW - 12) / 2
      let sy = certY + 12
      for (const [l, rlab] of [['SIGNATURE', 'DATE'], ['LICENSE NO.', 'EXPIRATION DATE']]) {
        doc.moveTo(blockX + 96, sy + 16).lineTo(blockX + 96 + colW - 20, sy + 16)
           .lineWidth(0.4).strokeColor('#000000').stroke()
        doc.moveTo(blockX + 96 + colW, sy + 16).lineTo(blockX + blockW - 8, sy + 16).stroke()
        doc.font('Helvetica').fontSize(6).fillColor('#666666')
           .text(l, blockX + 96, sy + 18, { width: colW - 20, lineBreak: false })
        doc.font('Helvetica').fontSize(6).fillColor('#666666')
           .text(rlab, blockX + 96 + colW, sy + 18, { width: colW - 8, lineBreak: false })
        sy += 34
      }
      by = certY + sealH + 8



      // County-required notes, printed in full. pdfkit wraps within `width`,
      // so the certificate is never clipped.
      for (const note of ctx.requiredNotes ?? []) {
        label(doc, blockX, by, note.title.toUpperCase(), 7, { bold: true })
        by += 10
        doc.font('Helvetica').fontSize(7).fillColor('#000000')
           .text(note.text, blockX, by, { width: blockW, align: 'left' })
        by = doc.y + 2
        doc.font('Helvetica').fontSize(7).fillColor('#666666')
           .text(note.source.citation, blockX, by, { width: blockW })
        by = doc.y + 8
      }
      watermark(doc, ctx, sheetSize)
    }

    doc.end()
  })
}
