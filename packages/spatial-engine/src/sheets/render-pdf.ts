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
// `edgeYards` is indexed against the NORMALISED ring, so anything that reads it
// has to normalise too. See the two uses below.
import { normaliseRing } from '../site-plan/buildable-envelope'
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
  // An easement is a RIGHT, not a pipe, and it has to be findable: at 0.6 pt in
  // mid-grey it disappeared among the service runs it exists to permit.
  easement: { width: 1.2, color: '#6a1b9a', dash: [16, 3, 3, 3] },
  /** EXISTING grade: thin and dashed. */
  // EXISTING grade: dashed and lighter than proposed, but it has to be VISIBLE.
  // At 0.35 pt in a pale brown the contours were on the sheet and could not be
  // seen — which is the same as not drawing them. A drafter draws existing
  // contours thin, not invisible.
  contour: { width: 0.6, color: '#7a5c2e', dash: [6, 3] },
  /** PROPOSED grade: heavier and solid, so the two never read alike. */
  // PROPOSED GRADE IS THE HEAVIEST LINE ON THE GRADING SHEET.
  //
  // The approved Yocum Property plan in this repo draws proposed contours bold
  // and solid against a thin dashed existing — the proposed surface is what the
  // sheet is FOR, and it should be the first thing the eye lands on. At 0.9 pt
  // in a mid brown it sat under the existing index contours instead.
  // BOLD, SOLID, BLACK — the convention every approved plan in this repo uses,
  // the Yocum set included. Proposed grade is the subject of a grading sheet
  // and it is drawn as the heaviest line on it; existing grade stays thin,
  // dashed and brown behind it.
  contourProposed: { width: 1.8, color: '#000000', dash: undefined },
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

/**
 * Trims a string to a length that can actually sit on the graphic.
 *
 * Everything lettered on the plan is set with `lineBreak: false` so it follows
 * the feature it names, which means PDFKit will not wrap it — a long value runs
 * off the drawing and over whatever it crosses. Anything that does not fit at
 * the feature belongs in a table or a note, so a caller that hits this cap is
 * passing the wrong field.
 */
function clampLabel(s: string | undefined, max: number): string | undefined {
  if (!s) return undefined
  const one = s.replace(/\s+/g, ' ').trim()
  if (!one) return undefined
  // Cut at the citation, not mid-word: the first sentence or clause is the
  // part a reviewer reads off the line.
  if (one.length <= max) return one
  const cut = one.slice(0, max)
  const brk = Math.max(cut.lastIndexOf(' '), cut.lastIndexOf(','), cut.lastIndexOf(';'))
  return (brk > max * 0.5 ? cut.slice(0, brk) : cut).replace(/[,;]$/, '') + '…'
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

/**
 * The jurisdiction, spelled the way it is spelled.
 *
 * `jurisdictionCode` is a slug — `prince_georges_md` — and the block printed it
 * with the underscores swapped for spaces, so the sheet read "prince georges
 * md" in the field naming the county that will review it.
 */
function jurisdictionName(code: string): string {
  const words = code.replace(/_/g, ' ').trim()
  if (/^prince\s+georges\s+md$/i.test(words)) return "Prince George's County, Maryland"
  return words
    .split(/\s+/)
    .map(w => (/^[a-z]{2}$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
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
  // EVERY ADDRESS IN THE SET, not just the first.
  //
  // `twin.address` is the subject address, which on a four-lot subdivision is
  // one of four — the block said 9588 Fort Foote Rd over a drawing of 9588,
  // 9584, 9580 and 9576, so three of the four dwellings on the sheet were not
  // named anywhere a reviewer looks first.
  const lotAddresses = ((ctx.twin as unknown as {
    projectLots?: Array<{ address?: string }>
  }).projectLots ?? []).map(l => l.address).filter((a): a is string => Boolean(a))
  row('ADDRESS', lotAddresses.length ? lotAddresses.join('  ·  ') : ctx.twin.address)
  row('JURISDICTION', jurisdictionName(ctx.twin.jurisdictionCode))
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

/** True when the point lies inside the ring. Ray casting. */
function pointInRing(p: Position, ring: readonly Position[]): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > p[1]) !== (yj > p[1]) &&
        p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi || Number.EPSILON) + xi) hit = !hit
  }
  return hit
}

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
/**
 * Diagonal hatch, clipped to the ring.
 *
 * MONOCHROME SAFETY. Every hatched area used the same 45 degree pattern at the
 * same weight and told itself apart by hue: the easement purple, the practice
 * green, the dwelling red. On a mono plot those are luma 90, 97 and 85 — within
 * twelve levels of one another out of 255 — so the easement and the stormwater
 * practice became the same grey fill and a reviewer could not say which area
 * was which. `down` flips the direction and `weight` sets the pen, so each
 * area now carries a pattern that survives with no colour at all.
 */
function hatch(doc: Doc, r: [number, number][], color: string, spacing: number,
               opts: { down?: boolean; weight?: number; opacity?: number } = {}): void {
  const minX = Math.min(...r.map(q => q[0])), maxX = Math.max(...r.map(q => q[0]))
  const minY = Math.min(...r.map(q => q[1])), maxY = Math.max(...r.map(q => q[1]))
  const span = maxY - minY
  doc.save()
  doc.moveTo(r[0][0], r[0][1])
  for (const q of r.slice(1)) doc.lineTo(q[0], q[1])
  doc.closePath().clip()
  doc.lineWidth(opts.weight ?? 0.25).strokeColor(color).opacity(opts.opacity ?? 0.45)
  for (let x = minX - span; x < maxX; x += spacing) {
    if (opts.down) doc.moveTo(x, minY).lineTo(x + span, maxY).stroke()
    else doc.moveTo(x, maxY).lineTo(x + span, minY).stroke()
  }
  doc.opacity(1).restore()
}
/**
 * ── LABEL PLACEMENT ────────────────────────────────────────────────────────
 *
 * Every annotation on the drawing used to be written the instant its geometry
 * was drawn, at a fixed offset from whatever it described. That is fine for one
 * label and it does not survive four lots on one sheet: the lot name landed on
 * the easement text, the frontage dimension on the bearing, the planting-strip
 * note on the setback callout, the apron note on the front yard. Type printed
 * over type is not a drafting blemish — a dimension a reviewer cannot read is a
 * dimension that is not on the drawing.
 *
 * So labels are no longer drawn where they are made. They are QUEUED with an
 * anchor, a preferred position and a list of fallbacks, and a single pass at
 * the end places them: highest priority first, each one taking the first
 * candidate position that does not overlap something already placed. What still
 * cannot fit is either shifted onto a leader line or, for the lowest ranks,
 * dropped — and dropping is reported, because a sheet quietly missing a label
 * is the failure this whole mechanism exists to prevent.
 *
 * Deferring them has a second benefit that was worth having on its own: text is
 * now drawn AFTER all geometry, so nothing is ever overprinted by a contour or
 * a hatch drawn later.
 */
interface LabelRequest {
  text: string
  /** Page-space point the label belongs to. */
  at: [number, number]
  /** Rotation about `at`, radians. Zero is horizontal. */
  angle: number
  /** Preferred offset from `at`, in the rotated frame. */
  dx: number
  dy: number
  /** Box the text is set in, points. */
  width: number
  align: 'left' | 'center' | 'right'
  size: number
  font: string
  color: string
  /**
   * Higher wins a contested position. A dimension a lot cannot be checked
   * without outranks a note that repeats what a table already says.
   */
  priority: number
  /** Extra offsets to try, in the rotated frame, if the preferred one collides. */
  shifts: Array<[number, number]>
  /** Never dropped, whatever it collides with. */
  required: boolean
  /** Draw a leader back to `at` when the label ends up more than this far off. */
  leaderBeyond: number
  /** Lines the text wraps to, if it wraps. */
  lines: number
  /**
   * Keep the label inside this ring, in page coordinates.
   *
   * An adjoining lot's name belongs IN the adjoining lot. Free to move, the
   * placer put it wherever it found room, and the emptiest ground on a site
   * plan is the STREET — so half the neighbours on this sheet ended up lettered
   * out in the right-of-way, which reads as naming the road. A candidate
   * position whose centre falls outside this ring is refused however clear the
   * paper there is.
   */
  within?: Array<[number, number]>
  /**
   * Paint a white pad under the text before setting it.
   *
   * Contour numbers and service sizes sit ON the line they belong to, and the
   * knockout is what makes them readable there. It has to travel with the label
   * — painted at the position the placer chose, not at the one the caller
   * guessed — or it ends up masking a piece of drawing with nothing on it.
   */
  knockout: boolean
}

type Box = [number, number, number, number]

function boxesOverlap(a: Box, c: Box): boolean {
  return !(a[2] <= c[0] || c[2] <= a[0] || a[3] <= c[1] || c[3] <= a[1])
}

class Labeller {
  private readonly reqs: LabelRequest[] = []
  private readonly taken: Box[] = []
  private dropped = 0
  private forced = 0

  constructor(private readonly doc: Doc, private readonly frame: Box) {}

  /** Reserve a region no label may cover — the title block, a detail panel. */
  reserve(bx: Box): void { this.taken.push(bx) }

  add(r: Partial<LabelRequest> & { text: string; at: [number, number] }): void {
    if (!r.text) return
    this.reqs.push({
      angle: 0, dx: 0, dy: 0, width: 120, align: 'left',
      size: 7, font: 'Helvetica', color: '#000000',
      priority: 50, shifts: [], required: false, leaderBeyond: 26, lines: 1,
      knockout: false,
      ...r,
    })
  }

  /** The page-space box a request would occupy at a given offset. */
  private boxFor(r: LabelRequest, dx: number, dy: number): Box {
    this.doc.font(r.font).fontSize(r.size)
    // THE BOX IS WHAT THE TEXT ACTUALLY OCCUPIES, not what was asked for.
    //
    // A single-line label is set with `lineBreak: false`, so it runs to its
    // natural width and OVERFLOWS the `width` box if it is longer — clamping to
    // `width` under-measured every long caption on the sheet and let other
    // labels be placed straight over their tails. A wrapping label is the
    // opposite case: it is held to `width` and grows downward instead, so its
    // height is however many lines that takes.
    const natural = this.doc.widthOfString(r.text)
    const wraps = r.lines > 1
    const measured = wraps ? r.width : natural
    const lines = wraps ? Math.max(r.lines, Math.ceil(natural / Math.max(1, r.width))) : 1
    const h = r.size * 1.18 * lines
    // Where the glyphs actually start inside the `width` box.
    const inset = r.align === 'center' ? (r.width - measured) / 2
      : r.align === 'right' ? r.width - measured : 0
    const x0 = dx + inset, y0 = dy, x1 = x0 + measured, y1 = dy + h
    const ca = Math.cos(r.angle), sa = Math.sin(r.angle)
    const pts: Array<[number, number]> = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
      .map(([px, py]) => [r.at[0] + px * ca - py * sa, r.at[1] + px * sa + py * ca])
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1])
    // A hair of padding: type that merely touches still reads as collided.
    const PAD = 1.2
    return [Math.min(...xs) - PAD, Math.min(...ys) - PAD,
            Math.max(...xs) + PAD, Math.max(...ys) + PAD]
  }

  private inFrame(bx: Box): boolean {
    return bx[0] >= this.frame[0] && bx[1] >= this.frame[1]
      && bx[2] <= this.frame[2] && bx[3] <= this.frame[3]
  }

  /** Place everything queued, and report what would not fit. */
  flush(): { placed: number; dropped: number; forced: number } {
    let placedCount = 0
    // Priority first; then the longer label, which is the harder one to fit and
    // should get its pick of the space while there is some.
    const order = [...this.reqs].sort((a, c) =>
      c.priority - a.priority || c.text.length - a.text.length)
    for (const r of order) {
      // ── WHERE A LABEL IS ALLOWED TO GO ──────────────────────────────────
      //
      // The preferred spot, then whatever the caller listed, then a ladder
      // outward from the preferred spot in every direction. Hand-listed shifts
      // encode drafting intent — a yard dimension prefers to move ALONG its
      // line, not across it — and the ladder is what stops the whole thing
      // falling back to overprinting once those few are used up. Without it,
      // required labels were still landing on top of each other: the bearing
      // and the easement name on Lot 55 both insisted on the same inch of
      // paper because neither had anywhere else to be.
      const ladder: Array<[number, number]> = []
      for (const rad of [9, 17, 25, 34, 44, 56, 70]) {
        for (const [ox, oy] of [[0, -1], [0, 1], [-1, 0], [1, 0],
                                [-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) {
          ladder.push([r.dx + ox * rad, r.dy + oy * rad])
        }
      }
      const candidates: Array<[number, number]> = [[r.dx, r.dy], ...r.shifts, ...ladder]
      let chosen: [number, number] | null = null
      let chosenBox: Box | null = null
      for (const [cdx, cdy] of candidates) {
        const bx = this.boxFor(r, cdx, cdy)
        if (!this.inFrame(bx)) continue
        if (r.within && !pointInRing(
          [(bx[0] + bx[2]) / 2, (bx[1] + bx[3]) / 2] as Position,
          r.within as unknown as Position[])) continue
        if (this.taken.some(o => boxesOverlap(bx, o))) continue
        chosen = [cdx, cdy]; chosenBox = bx
        break
      }
      if (!chosen || !chosenBox) {
        if (!r.required) { this.dropped++; continue }
        // Nowhere clear anywhere on the ladder. A required label is placed
        // regardless — the drawing needs it more than it needs to be tidy —
        // but it is counted, because it IS an overprint and the sheet should
        // not pretend otherwise.
        this.forced++
        chosen = [r.dx, r.dy]
        chosenBox = this.boxFor(r, r.dx, r.dy)
      }
      this.taken.push(chosenBox)
      placedCount++
      // A leader, when the label had to move far enough that which feature it
      // belongs to stops being obvious.
      const moved = Math.hypot(chosen[0] - r.dx, chosen[1] - r.dy)
      if (moved > r.leaderBeyond) {
        const ca = Math.cos(r.angle), sa = Math.sin(r.angle)
        const tip: [number, number] = [
          r.at[0] + r.dx * ca - r.dy * sa, r.at[1] + r.dx * sa + r.dy * ca]
        const end: [number, number] = [
          r.at[0] + chosen[0] * ca - chosen[1] * sa,
          r.at[1] + chosen[0] * sa + chosen[1] * ca]
        this.doc.save().lineWidth(0.35).strokeColor('#999999')
            .moveTo(tip[0], tip[1]).lineTo(end[0], end[1]).stroke().restore()
      }
      this.doc.save()
      if (r.angle) this.doc.translate(r.at[0], r.at[1]).rotate((r.angle * 180) / Math.PI)
      else this.doc.translate(r.at[0], r.at[1])
      if (r.knockout) {
        this.doc.font(r.font).fontSize(r.size)
        const kNat = this.doc.widthOfString(r.text)
        const kWraps = r.lines > 1
        const kw = kWraps ? r.width : kNat
        const kLines = kWraps
          ? Math.max(r.lines, Math.ceil(kNat / Math.max(1, r.width))) : 1
        const inset = r.align === 'center' ? (r.width - kw) / 2
          : r.align === 'right' ? r.width - kw : 0
        this.doc.rect(chosen[0] + inset - 1.5, chosen[1] - 1.2,
                      kw + 3, r.size * 1.2 * kLines)
            .fillColor('#ffffff').opacity(0.88).fill()
        this.doc.opacity(1)
      }
      this.doc.font(r.font).fontSize(r.size).fillColor(r.color)
          .text(r.text, chosen[0], chosen[1],
                { width: r.width, align: r.align, lineBreak: r.lines > 1 })
      this.doc.restore()
    }
    return { placed: placedCount, dropped: this.dropped, forced: this.forced }
  }
}

function drawGeometry(doc: Doc, ctx: SheetContext, vp: Viewport, b: Bounds): void {
  const t = ctx.twin
  const P = (pt: Position) => project(pt, vp, b, PAD_FT)
  // Labels are queued here and placed in one pass at the end of this function.
  // The frame is the drawing area itself, with a small margin: a label that
  // would hang off the edge of the plan is no better placed than one that
  // overprints, and on a sheet with a right-hand block column it would run
  // straight into the tables.
  const FRAME_PAD = 4
  const L = new Labeller(doc, [
    vp.originX - FRAME_PAD, vp.originY - FRAME_PAD,
    vp.originX + vp.drawWidthPt + FRAME_PAD, vp.originY + vp.drawHeightPt + FRAME_PAD,
  ])

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
  // Far enough to reach ACROSS THE STREET. The plat shows the lots opposite —
  // Dade, Ferrell, Valle Gargan, Rollins — and at 45 ft the right-of-way is 57
  // ft wide, so every one of them was trimmed away and Rollins Avenue had
  // nothing on its far side.
  //
  // 95 ft was the figure while the reach was applied to a segment's ENDS, and it
  // was doing two jobs: saying how much of a neighbour to show, and keeping the
  // long calls from running down the sheet into the schedules. It is only doing
  // the first job now — the drawing is clipped to its own viewport, so the table
  // and detail bands are protected whatever this number is — and at 95 ft
  // measured ALONG the line the lots across Fort Foote Road were cut back to
  // stubs a few feet past their own frontage.
  //
  // 220 ft carries the far side of the right-of-way plus a readable depth of the
  // lots beyond it, which is what an adjoiner is on the sheet for.
  const REACH_FT = 220
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
  // THE SUBJECT LOTS ARE IN THE COUNTY PARCEL LAYER TOO.
  //
  // `subjectRings` was built and then used only for the proximity test, so the
  // county's own outlines of Porter Lots 1 and 2 came back as adjoiners and
  // were lettered — 'LOT 348854 / 9,596 SF' — directly over each lot's platted
  // label and area. Three captions for one lot, two of them from a compiled
  // source the plat supersedes. An adjoiner whose centre lies inside a subject
  // lot IS that lot.
  const adj = adjAll.filter(ap => {
    const co = ap.ring.coordinates as Position[]
    const cx0 = co.reduce((n, q) => n + q[0], 0) / co.length
    const cy0 = co.reduce((n, q) => n + q[1], 0) / co.length
    return !subjectRings.some(rg => pointInRing([cx0, cy0] as Position, rg))
  })
  for (const ap of adj) {
    const co = ap.ring.coordinates as Position[]
    // EVERY ADJOINER IS LETTERED. An approved plan names each neighbouring lot
    // with its number and area — 'LOT 9 / 71,399 SF' on the Yocum sheet —
    // because a reviewer reads the subject against what surrounds it and a
    // builder needs to know whose line they are working to. An unlabelled
    // outline says only that something is there.
    const nearPts = co.filter(q => nearSubject(q))
    if (nearPts.length) {
      // ── THE NAME GOES IN THE LOT ────────────────────────────────────────
      //
      // The anchor was the centroid of the points within reach of the subject
      // — a cluster along the shared line, which for a lot across the road sits
      // ON the frontage. From there the placer was free to move, and the
      // clearest paper on a site plan is the carriageway, so neighbours were
      // being lettered in the middle of the street.
      //
      // The anchor is now the most interior point of the adjoiner's OWN ring
      // that is still on the sheet — the visible point furthest from any of its
      // boundaries — and the label is confined to that ring. Where a lot is
      // only a sliver at the edge of the frame that sliver is where its name
      // goes; where none of it is visible it is not lettered at all, which is
      // correct, because there is nothing there to name.
      const ringPt = co.map(q => P(q))
      const rxs = ringPt.map(q => q[0]), rys = ringPt.map(q => q[1])
      const fx0 = Math.max(Math.min(...rxs), vp.originX)
      const fx1 = Math.min(Math.max(...rxs), vp.originX + vp.drawWidthPt)
      const fy0 = Math.max(Math.min(...rys), vp.originY)
      const fy1 = Math.min(Math.max(...rys), vp.originY + vp.drawHeightPt)
      const edgeDist = (q: [number, number]) => {
        let best = Infinity
        for (let n = 0; n < ringPt.length - 1; n++) {
          const a3 = ringPt[n], b3 = ringPt[n + 1]
          const vx = b3[0] - a3[0], vy = b3[1] - a3[1]
          const tt = Math.max(0, Math.min(1,
            ((q[0] - a3[0]) * vx + (q[1] - a3[1]) * vy) / (vx * vx + vy * vy || 1)))
          best = Math.min(best, Math.hypot(q[0] - (a3[0] + tt * vx), q[1] - (a3[1] + tt * vy)))
        }
        return best
      }
      let at: [number, number] | null = null
      let bestDist = -1
      const STEPS = 14
      for (let gi = 0; gi <= STEPS && fx1 >= fx0; gi++) {
        for (let gj = 0; gj <= STEPS && fy1 >= fy0; gj++) {
          const q: [number, number] = [
            fx0 + ((fx1 - fx0) * gi) / STEPS, fy0 + ((fy1 - fy0) * gj) / STEPS]
          if (!pointInRing(q as Position, ringPt as unknown as Position[])) continue
          const dd = edgeDist(q)
          if (dd > bestDist) { bestDist = dd; at = q }
        }
      }
      if (!at) continue
      const pid = ap.propId ? `LOT ${ap.propId}` : 'ADJOINING LOT'
      const acre = ap.areaSqFt > 0 ? `${(ap.areaSqFt / 43_560).toFixed(3)} AC` : ''
      // DARKENED FOR MONO. These were #777777 and #888888. A flat grey that
      // light survives a threshold, but 5.6 pt text does not: the glyph strokes
      // are about a pixel wide, antialiasing blends them toward white, and the
      // area lines came out of a 1-bit plot as broken fragments —
      // '9,098 SF (0.209 AC)' was unreadable. Darker values keep the edge
      // pixels under the threshold while still reading as subordinate on
      // screen and in colour.
      // An adjoining parcel is context. It yields to everything on the subject
      // property, and its area yields before its identity.
      L.add({
        text: `${pid}\n${ap.areaSqFt > 0
          ? `${Math.round(ap.areaSqFt).toLocaleString()} SF  (${acre})` : 'AREA NOT PUBLISHED'}`,
        at: [at[0], at[1]], dx: -46, dy: -8, width: 92, align: 'center', lines: 2,
        size: 6, font: 'Helvetica-Bold', color: '#4a4a4a', priority: 34,
        within: ringPt,
      })
    }
    // ── TRIMMED ALONG THE LINE, NOT BY ITS ENDS ─────────────────────────────
    //
    // A segment was kept whole if EITHER end was near the subject, and an
    // adjoining parcel's boundary is not made of short segments: one call
    // running three hundred feet south-west from a corner beside the frontage
    // was drawn in full, straight down the sheet and through the schedules in
    // the bottom band. The reach has to be applied ALONG the line.
    //
    // So each call is walked at a few feet a step and only the part actually
    // within reach is kept. What is drawn is the piece of the neighbour's line
    // that runs beside this project, which is the piece that means anything.
    const STEP_FT = 5
    let run: Position[] = []
    const flushRun = () => {
      // #aaaaaa at 0.35 pt is luma 170 on a hairline: it vanished from a
      // mono plot and the adjoining lots lost their outlines entirely.
      if (run.length >= 2) {
        polyline(doc, run.map(q => P(q)), { width: 0.45, color: '#8a8a8a', dash: undefined })
      }
      run = []
    }
    for (let n = 0; n < co.length - 1; n++) {
      const a3 = co[n], b3 = co[n + 1]
      const segLen = Math.hypot(b3[0] - a3[0], b3[1] - a3[1])
      const steps = Math.max(1, Math.ceil(segLen / STEP_FT))
      for (let k = 0; k <= steps; k++) {
        const u = k / steps
        const q: Position = [a3[0] + (b3[0] - a3[0]) * u, a3[1] + (b3[1] - a3[1]) * u]
        if (nearSubject(q)) run.push(q)
        else flushRun()
      }
    }
    flushRun()
  }
  // ── Existing contours ─────────────────────────────────────────────────────
  //
  // RESTORED. An edit to the adjoining-parcel block above cut from that block
  // to the next section comment, and this loop was between them — so the sheet
  // stopped drawing existing grade entirely while the model still carried it.
  // A whole layer went missing and every check still passed, because nothing
  // tests that a feature present in the twin reaches the paper.
  //
  // CLIPPED TO THE DRAWING FRAME, not to the lot: the lots fall about four feet
  // and the interval is two, so lot-only clipping left two lines. Existing
  // ground does not stop at a property line.
  // EXISTING FIRST, PROPOSED SECOND. The proposed surface was drawn before the
  // existing one and buried under 39 thin dashed lines — the bold black
  // contours were on the sheet and could not be seen for the mapping laid over
  // them. Whatever is drawn last is on top, and on a grading sheet that is the
  // proposed grade.
  const contourFeatures = [...genericOfKind(t, 'Contour')].sort((a2, b2) =>
    Number((a2.attributes as { proposed?: boolean } | undefined)?.proposed ?? false)
    - Number((b2.attributes as { proposed?: boolean } | undefined)?.proposed ?? false))
  for (const c of contourFeatures) {
    if (!c.line?.length) continue
    const inFrame = (q: Position) =>
      q[0] >= b.minX - PAD_FT && q[0] <= b.maxX + PAD_FT &&
      q[1] >= b.minY - PAD_FT && q[1] <= b.maxY + PAD_FT
    const src = c.line as Position[]
    const runs: Position[][] = []
    let cur: Position[] = []
    for (let i = 0; i < src.length - 1; i++) {
      if (inFrame(src[i]) || inFrame(src[i + 1])) {
        if (cur.length === 0) cur.push(src[i])
        cur.push(src[i + 1])
      } else if (cur.length) { runs.push(cur); cur = [] }
    }
    if (cur.length) runs.push(cur)
    const a = c.attributes ?? {}
    const index = a.weight === 'index'
    const el = a.elevationFt
    // PROPOSED GRADE IS SOLID AND HEAVIER; EXISTING IS THIN AND DASHED.
    //
    // Every contour was drawn with the existing pen, so the proposed surface —
    // the whole point of a grading plan — was indistinguishable from the ground
    // it replaces. The two pens have existed side by side in `PEN` since they
    // were written; only one was ever used.
    const proposed = a.proposed === true
    for (const kept of runs) {
      if (kept.length < 2) continue
      polyline(doc, kept.map((q: Position) => P(q)),
        proposed
          ? { ...PEN.contourProposed, width: index ? 2.6 : 1.8, dash: undefined }
          : { ...PEN.contour, width: index ? 1.1 : 0.55, dash: index ? [10, 4] : [6, 3] })
      // Lettered REPEATEDLY along the line: one label at a midpoint leaves a
      // contour crossing the sheet unnamed where a reviewer is actually
      // reading it.
      if (el == null || kept.length < 3) continue
      const pj = kept.map((q: Position) => P(q))
      let run = 0
      for (let i = 1; i < pj.length; i++) {
        run += Math.hypot(pj[i][0] - pj[i - 1][0], pj[i][1] - pj[i - 1][1])
      }
      const marks = Math.max(1, Math.min(5, Math.floor(run / 190)))
      for (let m = 1; m <= marks; m++) {
        const at = Math.floor((pj.length - 1) * (m / (marks + 1)))
        const q = pj[at]
        // The knockout stays where it is — it belongs to the contour, which is
        // drawn here. Only the number is deferred, and if it cannot be placed
        // the contour simply carries one fewer of its five repeats.
        doc.save()
        doc.rect(q[0] - 9, q[1] - 4, 18, 8).fillColor('#ffffff').opacity(0.9).fill()
        doc.opacity(1)
        doc.restore()
        L.add({
          text: String(el), at: [q[0], q[1]], dx: -8, dy: -3, width: 16,
          align: 'center', size: index ? 6.5 : 5.8,
          font: index ? 'Helvetica-Bold' : 'Helvetica', color: '#7a5c2e',
          priority: index ? 70 : 62,
        })
      }
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
      L.add({
        text: sb.frontFt != null ? `${sb.frontFt}' BRL` : 'BRL', at: [cx, top],
        dx: -34, dy: -10, width: 68, align: 'center', size: 8,
        font: 'Helvetica-Bold', color: '#666666', priority: 80, required: true,
        shifts: [[-34, -20], [-34, 2], [-34, -30], [-34, 12]],
      })
    } else if (isLod) {
      polyline(doc, r, { width: 0.8, color: '#2e7d32', dash: [14, 4, 3, 4] }, true)
      L.add({
        text: 'LIMIT OF DISTURBANCE', at: [cx, top], dx: -60, dy: -10, width: 120,
        align: 'center', size: 7, font: 'Helvetica-Bold', color: '#2e7d32',
        priority: 72,
        shifts: [[-60, -20], [-60, 2], [-60, -30], [-60, 12]],
      })
    } else {
      polyline(doc, r, { width: 0.7, color: '#8a5a2a', dash: [4, 3] }, true)
      if (gLabel) {
        L.add({
          text: gLabel.toUpperCase(), at: [cx, top], dx: -60, dy: -8, width: 120,
          align: 'center', size: 6, color: '#8a5a2a', priority: 44,
          shifts: [[-60, -18], [-60, 4], [-60, 14]],
        })
      }
    }

    // Label every yard on its own run of the restriction line, so a reviewer
    // reads the setback rather than scaling it.
    // The per-edge setback dimensions read from the ENVELOPE feature, which is
    // the only one that carries them. `sb` used to be in scope from the loop
    // head, where it was read off whichever proposed feature came round.
    const sb = (g.attributes?.setbacks ?? {}) as
      { frontFt?: number; sideFt?: number; rearFt?: number }
    // EACH ENVELOPE LABELS ITS OWN LOT.
    //
    // Both of these were taken from the SUBDIVISION: `featuresOfKind(t,
    // 'Parcel')[0]` is the outer boundary and `t.buildableEnvelope` is lot 1's.
    // So all four lots' envelopes lettered the same three yards, on the same
    // ring, at the same three points — measured on the sheet, "30' FRONT YARD"
    // printed four times at (751,877) and "20' REAR YARD" four times at
    // (806,898), each stack 100% overlapping. Four labels in one place is not
    // four labels; it is a smudge, and it hid the fact that Lot 54's side yard
    // is 20 ft where the others are 8.
    const lotPrefix = String(g.id ?? '').match(/^(l\d+)-/)?.[1] ?? null
    const lotMeta = lotPrefix
      ? (t as { projectLots?: Array<{ featurePrefix: string
          buildableEnvelope?: { edgeYards?: string[] } | null }> }).projectLots
          ?.find(l => l.featurePrefix === `${lotPrefix}-`)
      : undefined
    const yards = lotMeta?.buildableEnvelope?.edgeYards
      ?? (t as { buildableEnvelope?: { edgeYards?: string[] } }).buildableEnvelope?.edgeYards
    const parcelRing = lotPrefix
      ? featuresOfKind(t, 'Parcel').find(f => String(f.id).startsWith(`${lotPrefix}-`))
      : featuresOfKind(t, 'Parcel')[0]
    if (yards && parcelRing) {
      // THE SAME RING `edgeYards` WAS BUILT ON — the winding trap, again.
      //
      // This read the RAW coordinates and indexed them with `i`, which is an
      // index into the NORMALISED ring that `deriveBuildableEnvelope` classified.
      // The recorded plat traverses clockwise, `normaliseRing` forces
      // counter-clockwise, and the two orders disagree — so on 9588 Fort Foote
      // Rd the sheet lettered 25' FRONT YARD on the rear line, 189 ft from the
      // street, and 20' REAR YARD on the frontage 39 ft from it. Exactly
      // swapped, and the setback table still read 25/8/20 so nothing looked
      // wrong.
      const lp = normaliseRing(parcelRing.ring)
      const seen = new Set<string>()
      for (let i = 0; i < Math.min(yards.length, lp.length); i++) {
        const y = yards[i]
        const ft = y === 'front' ? sb.frontFt : y === 'rear' ? sb.rearFt : sb.sideFt
        if (ft == null || seen.has(y)) continue
        seen.add(y)
        const m1 = P(lp[i] as Position), m2 = P(lp[(i + 1) % lp.length] as Position)
        const mx = (m1[0] + m2[0]) / 2, my = (m1[1] + m2[1]) / 2
        let ang = Math.atan2(m2[1] - m1[1], m2[0] - m1[0])
        if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI
        L.add({
          text: `${ft}' ${y.toUpperCase()} YARD`, at: [mx, my], angle: ang,
          dx: -46, dy: 6, width: 92, align: 'center', size: 7, color: '#7f8c8d',
          priority: 74,
          shifts: [[-46, 14], [-46, -14], [-46, 22], [-46, -22]],
        })
      }
    }
  }

  // Frontage is a lot-level annotation, not a proposed-feature annotation.
  // Draw it exactly once for each lot after all proposed geometry is rendered.
  const projectLots = (t as { projectLots?: Array<{
    featurePrefix: string
    buildableEnvelope?: {
      edgeYards?: string[]
      frontage?: { providedFt: number | null; requiredFt: number | null; meets: boolean | null }
    } | null
  }> }).projectLots
  const frontageLots = projectLots?.length
    ? projectLots.map(lot => ({
        parcel: featuresOfKind(t, 'Parcel').find(f => String(f.id).startsWith(lot.featurePrefix)),
        envelope: lot.buildableEnvelope,
      }))
    : [{
        parcel: featuresOfKind(t, 'Parcel')[0],
        envelope: (t as { buildableEnvelope?: {
          edgeYards?: string[]
          frontage?: { providedFt: number | null; requiredFt: number | null; meets: boolean | null }
        } }).buildableEnvelope,
      }]
  for (const { parcel, envelope } of frontageLots) {
    const frontage = envelope?.frontage
    if (!parcel || !envelope?.edgeYards || frontage?.providedFt == null) continue
    // NORMALISED, for the same reason as the yard labels above: `edgeYards` is
    // indexed against the normalised ring, and this lettered FRONTAGE on the
    // rear line of every clockwise-traversed plat.
    const lp = normaliseRing(parcel.ring)
    const idx = envelope.edgeYards.indexOf('front')
    if (idx < 0 || idx >= lp.length) continue
    const m1 = P(lp[idx] as Position), m2 = P(lp[(idx + 1) % lp.length] as Position)
    const mx = (m1[0] + m2[0]) / 2, my = (m1[1] + m2[1]) / 2
    let ang = Math.atan2(m2[1] - m1[1], m2[0] - m1[0])
    if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI
    // Frontage is what makes the lot buildable under Sec. 24-128. It is never
    // dropped; it moves off the line before it goes.
    L.add({
      text: `FRONTAGE ${frontage.providedFt.toFixed(2)}'`
        + (frontage.requiredFt != null ? `  (${frontage.requiredFt}' MIN)` : ''),
      at: [mx, my], angle: ang, dx: -56, dy: -13, width: 112, align: 'center',
      size: 7.5, font: 'Helvetica-Bold',
      color: frontage.meets === false ? '#c0392b' : '#000000',
      priority: 90, required: true,
      shifts: [[-56, -22], [-56, -31], [-56, 4], [-56, 13]],
    })
  }

  // ── Easements ─────────────────────────────────────────────────────────────
  for (const e of featuresOfKind(t, 'Easement')) {
    const r = projectRing(e.ring, vp, b, PAD_FT)
    // A light wash inside the strip, so the easement reads as an AREA a right
    // covers rather than as another line among the services.
    doc.save()
    doc.moveTo(r[0][0], r[0][1])
    for (const q of r.slice(1)) doc.lineTo(q[0], q[1])
    doc.closePath().fillColor('#6a1b9a').opacity(0.16).fill()
    doc.opacity(1).restore()
    // THE WHOLE EASEMENT AREA IS HIGHLIGHTED, not just outlined.
    //
    // A 7% wash inside a dashed outline disappeared against the contours and
    // the service runs crossing it, so the extent of the right — which is the
    // question a reviewer asks of an easement — had to be traced by eye along a
    // broken line. A stronger wash plus a hatch in the same colour reads as one
    // area at a glance, and the hatch survives a monochrome plot where a light
    // tint does not.
    hatch(doc, r, '#6a1b9a', 6, { weight: 0.3 })
    polyline(doc, r, PEN.easement, true)

    // LETTERED with what it is, how wide, and for whom. An easement nobody can
    // name is a hatched strip: the reviewer's question is always whose right it
    // is and over what.
    const et = (e as { easementType?: string }).easementType ?? 'Easement'
    const wf = (e as { widthFt?: number }).widthFt
    // CLAMPED, because these are drawn with `lineBreak: false` and a rotation.
    // `recordReference` was carrying the whole plat transcription — book, page,
    // district, tax map, scale, basis of bearings and both lot areas — and
    // PDFKit set it as ONE unwrapped line down the frontage, straight across
    // the driveways, the stoops and the walk. A citation is a citation; the
    // full reference belongs in the title block and general note 5.
    const ben = clampLabel((e as { beneficiary?: string }).beneficiary, 44)
    const ref = clampLabel((e as { recordReference?: string }).recordReference, 44)
    const cx = r.reduce((n, q) => n + q[0], 0) / r.length
    const cy = r.reduce((n, q) => n + q[1], 0) / r.length
    // Along the strip, so the text lies in it rather than across the drawing.
    let ang = Math.atan2(r[1][1] - r[0][1], r[1][0] - r[0][0])
    while (ang > Math.PI / 2) ang -= Math.PI
    while (ang < -Math.PI / 2) ang += Math.PI
    // The easement's own identity is required — it is a right of record and it
    // governs what may be built. Its beneficiary and book-and-page are useful
    // and are also in the title block, so they yield first.
    L.add({
      text: `${wf ? `${wf}' ` : ''}${et.toUpperCase()} EASEMENT`,
      at: [cx, cy], angle: ang, dx: -80, dy: -8, width: 160, align: 'center',
      size: 6, font: 'Helvetica-Bold', color: '#6a1b9a',
      priority: 82, required: true,
      shifts: [[-80, -16], [-80, 2], [-80, -24], [-80, 10]],
    })
    if (ben) {
      L.add({
        text: ben.toUpperCase(), at: [cx, cy], angle: ang, dx: -90, dy: -1,
        width: 180, align: 'center', size: 5.2, color: '#6a1b9a', priority: 40,
        shifts: [[-90, 6], [-90, -9], [-90, 13]],
      })
    }
    if (ref) {
      L.add({
        text: ref.toUpperCase(), at: [cx, cy], angle: ang, dx: -90, dy: 5,
        width: 180, align: 'center', size: 5, color: '#7b4a9a', priority: 38,
        shifts: [[-90, 12], [-90, -14], [-90, 19]],
      })
    }
  }

  // ── Property boundary, heaviest line on the sheet ─────────────────────────
  //
  // ONE LINE OF RECORD, ONE CALL. The sheet carries three Parcel features — the
  // subdivision tract and the two lots — and each lettered every one of its own
  // edges. Where a lot line IS the tract boundary the same ground got two
  // calls: the north line came out 'N 79°29'04"E 196.38'' and
  // 'N 79°29'04"E 176.38'' printed over each other, the second being Lot 1's
  // share of the first, short by the 20 ft dedication. Along the south-west
  // line it was three. A reviewer checking a closure reads the boundary of
  // record, so the longest edge covering a piece of ground carries the call and
  // the edges lying within it are left to the lot lines they actually are.
  const parcels = featuresOfKind(t, 'Parcel')
  type Cand = { key: string; a: Position; b: Position; lenFt: number }
  const cands: Cand[] = []
  parcels.forEach((p, pi) => {
    const co = p.ring.coordinates as Position[]
    for (let i = 0; i < co.length - 1; i++) {
      const lenFt = Math.hypot(co[i + 1][0] - co[i][0], co[i + 1][1] - co[i][1])
      if (lenFt >= 8) cands.push({ key: `${pi}:${i}`, a: co[i], b: co[i + 1], lenFt })
    }
  })
  // Distance from a point to a segment, in feet of model space.
  const gapToSeg = (q: Position, a: Position, b2: Position) => {
    const vx = b2[0] - a[0], vy = b2[1] - a[1]
    const tt = Math.max(0, Math.min(1,
      ((q[0] - a[0]) * vx + (q[1] - a[1]) * vy) / (vx * vx + vy * vy || 1)))
    return Math.hypot(q[0] - (a[0] + tt * vx), q[1] - (a[1] + tt * vy))
  }
  const TOL_FT = 1.5
  const kept: Cand[] = []
  for (const c of [...cands].sort((m, n) => n.lenFt - m.lenFt)) {
    const covered = kept.some(k =>
      gapToSeg(c.a, k.a, k.b) <= TOL_FT && gapToSeg(c.b, k.a, k.b) <= TOL_FT)
    if (!covered) kept.push(c)
  }
  const letterEdge = new Set(kept.map(k => k.key))

  // A parcel that ENCLOSES another does not caption itself: its centroid falls
  // inside the lots it contains, so the tract's 'LOT / 21,826 SQ FT' printed on
  // top of Lot 1's own label. The tract area is site data, and it is in the
  // table under that name.
  const centroids = parcels.map(p => {
    const co = p.ring.coordinates as Position[]
    return [co.reduce((n, q) => n + q[0], 0) / co.length,
            co.reduce((n, q) => n + q[1], 0) / co.length] as Position
  })
  const encloses = parcels.map((p, pi) =>
    centroids.some((c, ci) => ci !== pi && pointInRing(c, p.ring.coordinates as Position[])))

  parcels.forEach((p, pi) => {
    const r = projectRing(p.ring, vp, b, PAD_FT)
    polyline(doc, r, { ...PEN.boundary, width: 1.6 }, true)

    // Bearing and distance on every line, which is what a reviewer checks.
    const co = p.ring.coordinates
    for (let i = 0; i < co.length - 1; i++) {
      const [x1, y1] = co[i], [x2, y2] = co[i + 1]
      const dx = x2 - x1, dy = y2 - y1
      const lenFt = Math.hypot(dx, dy)
      if (lenFt < 8) continue
      if (!letterEdge.has(`${pi}:${i}`)) continue
      // AN EDGE IS LETTERED ONLY IF IT CAN HOLD ITS OWN LABEL.
      //
      // A bearing and distance is set in a 68 pt box. Where the boundary comes
      // from county GIS a curved frontage arrives as a dozen short chords, and
      // every one of them took a label — so the Fort Foote frontage carried
      // 'N 88°31'52"E 11.38'' and its neighbours stacked on top of each other
      // in a band nobody could read. Measured on the DRAWN length, not the
      // ground length, because it is the paper that runs out of room.
      const drawnPt = Math.hypot(P(co[i + 1] as Position)[0] - P(co[i] as Position)[0],
                                 P(co[i + 1] as Position)[1] - P(co[i] as Position)[1])
      if (drawnPt < 60) continue
      const brg = bearingLabel(dx, dy)
      const m1 = P(co[i]), m2 = P(co[i + 1])
      const mx = (m1[0] + m2[0]) / 2, my = (m1[1] + m2[1]) / 2
      let ang = Math.atan2(m2[1] - m1[1], m2[0] - m1[0])
      if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI
      // A BEARING AND DISTANCE IS THE SURVEY. Nothing on this drawing outranks
      // it, and it is never dropped: a boundary line without its call is a line
      // a reviewer cannot check the closure of.
      L.add({
        text: `${brg}  ${lenFt.toFixed(2)}'`, at: [mx, my], angle: ang,
        dx: -34, dy: -8, width: 68, align: 'center', size: 7, color: '#000000',
        priority: 100, required: true,
        shifts: [[-34, 1], [-34, -15], [-34, 8], [-34, -22]],
      })
    }

    // Lot identity and area at the centroid.
    if (!encloses[pi]) {
      const cx = r.reduce((n, q) => n + q[0], 0) / r.length
      const cy = r.reduce((n, q) => n + q[1], 0) / r.length
      L.add({
        text: p.areaSqFt
          ? `${p.parcelId ?? 'LOT'}\n${Math.round(p.areaSqFt).toLocaleString()} SQ FT  `
            + `(${(p.areaSqFt / 43560).toFixed(3)} AC)`
          : (p.parcelId ?? 'LOT'),
        at: [cx, cy], dx: -60, dy: -26, width: 120, lines: p.areaSqFt ? 2 : 1,
        align: 'center', size: 8, font: 'Helvetica-Bold', color: '#000000',
        priority: 88, required: true,
      })
    }
  })

  // ── Proposed site development: driveway, walks ───────────────────────────
  // ── Discipline content ─────────────────────────────────────────────────
  //
  // Utility, SWMPractice, DrainageArea and Tree had NO draw path. The features
  // were computed, put on the twin and correctly filtered onto their sheets,
  // and then nothing drew them — so the utility and landscape sheets came out
  // identical to the boundary sheet.

  // ONE CAPTION PER PAIR OF RUNS, not one per line.
  //
  // The staggering below assumes a single run per service, and the easements
  // now carry four parallel lines each — two WHC and two SHC, as the connection
  // sketch draws them. Four runs with the same service therefore staggered to
  // the same offset and printed on top of each other, twice over, inside a
  // 10 ft strip. A drafter letters the PAIR and lets the W and S ticks identify
  // the individual lines, which is what the ticks are for. The first run of
  // each service within each easement carries the caption; the rest are drawn
  // and ticked without one, and the caption index staggers by group so the
  // groups do not collide either.
  const utilRuns = genericOfKind(t, 'Utility').filter(u => u.line && u.line.length >= 2)
  const captionOf = new Map<string, number>()
  const groupSeen = new Map<string, string>()
  // ONE MAIN LABEL PER DISTINCT MAIN, keyed on the label itself.
  //
  // This was first gated on `captionOf`, whose groups are keyed `from|service`
  // and are shared with the house connections — a lateral claimed
  // `offsite|W` before the corridor run did, so the corridor run was not first
  // in its group and 'EX. 8" WATER' vanished from the circle altogether. There
  // are exactly two mains; the label text is the thing to deduplicate on.
  const mainLabelAt = new Map<string, string>()
  utilRuns.forEach((u, ui) => {
    const ty = String(u.attributes?.type ?? '')
    const svc = /water/i.test(ty) ? 'W' : /sanitary|sewer/i.test(ty) ? 'S' : 'D'
    // ONE CAPTION PER RUN PER LOT.
    //
    // The key was `from|service`, which is right for the two shared MAINS —
    // 'EX. 8" WATER' should be lettered once — and wrong for everything else.
    // All four storm house connections carry from='rear', so three of the four
    // went unlabelled: the sheet showed a pipe from each dwelling to the rear
    // trunk and named one of them.
    //
    // The lot prefix joins the key, so each lot's own runs are captioned and
    // the shared mains still are not repeated.
    const lotKey = String(u.id ?? '').match(/^(l\d+)-/)?.[1] ?? 'x'
    const key = `${lotKey}|${String(u.attributes?.from ?? '')}|${svc}`
    if (!groupSeen.has(key)) {
      groupSeen.set(key, String(u.id ?? ui))
      captionOf.set(String(u.id ?? ui), captionOf.size)
    }
    const mn = u.attributes?.sizeAtMain ? String(u.attributes.sizeAtMain) : ''
    if (mn && !mainLabelAt.has(mn)) mainLabelAt.set(mn, String(u.id ?? ui))
  })

  for (const u of utilRuns) {
    if (!u.line || u.line.length < 2) continue
    const pts = u.line.map(q => P(q as Position))
    // EACH SERVICE HAS ITS OWN LINE TYPE AND COLOUR.
    //
    // All three were one blue long-dash, so water, sewer and storm were the
    // same line drawn three times and told apart only by a label that a reader
    // has to find. The trade conventions are: water blue, sanitary green with
    // a dash-dot, storm a short dash. A reviewer identifies a service by its
    // line before reading anything.
    const kind_ = String(u.attributes?.type ?? '')
    const isWater = /water/i.test(kind_)
    const isSan = /sanitary|sewer/i.test(kind_)
    // WEIGHT AND DASH CARRY THE SERVICE, not the colour.
    //
    // Water and sanitary were both 0.9 pt and told apart by hue — #1565c0
    // against #2e7d32, which are luma 90 and 103. On a mono plot they were the
    // same line, and the only thing left distinguishing a water service from a
    // sewer lateral was the W or S tick. On a permit set that is not enough.
    //
    // Sanitary is now the heaviest of the three, as a gravity main is drafted;
    // water sits under it; storm is the finest. Each keeps a distinct dash. A
    // reader has three independent cues — weight, dash and tick — and all three
    // survive with no colour.
    // STORM WAS A THIN BROWN SHORT-DASH — the same pen as the contours it runs
    // across (#7a5c2e, [6,3], 0.6 pt) and near enough to the building
    // restriction line ([7,4], 0.8 pt) to be mistaken for it. Three different
    // things drawn as one thin dashed line is not symbology, it is noise.
    //
    // A storm drain is a PIPE, and a main is drafted heavy and SOLID. Solid is
    // the cue that does the work: nothing else on this sheet is both heavy and
    // unbroken except the boundary, which is black and heavier still. The
    // teal separates it from the sanitary green at the same time.
    const isStormMain = Boolean((u.attributes as { main?: boolean } | undefined)?.main)
    const pen = isWater
      ? { width: 0.85, color: '#1565c0', dash: [14, 5] as number[] }
      : isSan
        ? { width: 1.35, color: '#2e7d32', dash: [16, 3, 2, 3, 2, 3] as number[] }
        : isStormMain
          // The trunk: the largest pipe on the sheet, drawn like it.
          ? { width: 2.1, color: '#00695c', dash: undefined as number[] | undefined }
          // A house connection to it: the same family — teal, and drawn with the
          // same round-capped pipe profile — but half the weight and dashed, so
          // the main and the connection to it are told apart at a glance.
          //
          // It was 0.8 pt, which put it under the water service and near enough
          // to the contours to be lost among them. At 1.25 pt it is heavier
          // than every service on the sheet except the sanitary and the trunk.
          : { width: 1.25, color: '#00695c', dash: [9, 3] as number[] }
    const isStormLateral = !isWater && !isSan && !isStormMain
    if (isStormMain || isStormLateral) {
      // A PIPE IS ROUND, and the drawing should say so.
      //
      // Drawn as a plain heavy line it was still a line — the same kind of mark
      // as every other line on the sheet, told apart only by weight. Round caps
      // and joins give the run the profile of a pipe: it ends in a semicircle
      // at each structure and turns without a mitred corner, which is what a
      // reinforced concrete pipe run looks like drafted at this scale, and it
      // is a cue no dash pattern on the sheet can be confused with.
      //
      // Casing lines: a hairline of white either side turns the single stroke
      // into a tube with visible walls, and stops the contours it crosses from
      // reading through the middle of it.
      doc.save()
      doc.lineCap('round').lineJoin('round')
      polyline(doc, pts, { width: pen.width + (isStormMain ? 1.6 : 1.1), color: '#ffffff',
                           dash: undefined }, false)
      polyline(doc, pts, pen, false)
      doc.restore()
    } else {
      polyline(doc, pts, pen, false)
    }
    // A letter on the run, the way a utility is marked in the field: W water,
    // S sanitary, D storm.
    const tick = isWater ? 'W' : isSan ? 'S' : 'D'
    // THE TICKS ARE STAGGERED ALONG THE RUN, not all at the midpoint.
    //
    // Water and sanitary are parallel offsets a foot or two apart, so at
    // 1" = 20' their segment midpoints are within a couple of points of each
    // other — the W and the S were printed on the same spot, each with an
    // opaque white patch behind it, so the one drawn second erased the first.
    // Measured on the sheet, "W" and "S" overlapped 94%.
    //
    // Each service takes its own fraction along the segment, and its own side
    // of the line, so the two never land together.
    const tickAt = isWater ? 0.38 : isSan ? 0.62 : 0.5
    const tickSide = isWater ? -1 : isSan ? 1 : 0
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1][0], ay = pts[i - 1][1], bx2 = pts[i][0], by2 = pts[i][1]
      const dx3 = bx2 - ax, dy3 = by2 - ay
      const ln3 = Math.hypot(dx3, dy3) || 1
      const mx = ax + dx3 * tickAt - (dy3 / ln3) * 4 * tickSide
      const my = ay + dy3 * tickAt + (dx3 / ln3) * 4 * tickSide
      L.add({
        text: tick, at: [mx, my], dx: -3, dy: -2.4, width: 6, align: 'center',
        size: 5.4, font: 'Helvetica-Bold', color: pen.color, priority: 58,
        knockout: true,
      })
    }
    // Labels STAGGERED along their own run. The three services are parallel
    // offsets a few feet apart, so at 1" = 20' their midpoints are within a
    // dozen points of each other and all three names printed in the same place —
    // legible as none of them.
    // The size is appended ONLY when it adds something. `type` is already
    // 'Water service (WHC)' and `size` was 'WHC', so the run was lettered
    // 'WATER SERVICE (WHC) WHC'; the sanitary came out '… (SHC) 4" SHC'.
    const type_ = String(u.attributes?.type ?? 'Utility')
    const sizeRaw = u.attributes?.size ? String(u.attributes.size) : ''
    const size_ = sizeRaw && !type_.toUpperCase().includes(sizeRaw.toUpperCase())
      ? ` ${sizeRaw}` : ''
    const label_ = `${type_}${size_}`
    // SIZE AT THE CONNECTIONS — at the main and at the dwelling.
    //
    // The run carried one caption at its midpoint and nothing at either end, so
    // the size a connection is actually made to had to be read off a label
    // somewhere along the line. Each end is lettered where the connection is.
    // The two services enter the dwelling a foot apart, so a single side
    // offset printed '1" COPPER' and '4" PVC' on top of each other. Water is
    // thrown to one side of the run and sanitary to the other.
    const sideSign = isWater ? -1 : 1
    const endLabel = (at: [number, number], text: string, away: [number, number]) => {
      const dx2 = away[0] - at[0], dy2 = away[1] - at[1]
      const ln2 = Math.hypot(dx2, dy2) || 1
      // Pushed a little back along the run and off to one side of it.
      // Pushed further apart than the 5 pt this had: the two services enter the
      // dwelling within a foot of each other and '1" COPPER' still landed on
      // '4" PVC'. They are thrown to opposite sides AND staggered back along
      // their own runs, so neither cue has to do the work alone.
      const bx = at[0] + (dx2 / ln2) * (isWater ? 7 : 16) - (dy2 / ln2) * 9 * sideSign
      const by = at[1] + (dy2 / ln2) * (isWater ? 7 : 16) + (dx2 / ln2) * 9 * sideSign
      doc.font('Helvetica-Bold').fontSize(5)
      L.add({
        text, at: [bx, by], dx: 0, dy: 0, width: doc.widthOfString(text) + 1,
        size: 5, font: 'Helvetica-Bold', color: pen.color, priority: 54,
        knockout: true,
        shifts: [[0, -7], [0, 7], [0, -14], [0, 14]],
      })
    }
    const atMain = u.attributes?.sizeAtMain ? String(u.attributes.sizeAtMain) : ''
    const atHouse = u.attributes?.sizeAtHouse ? String(u.attributes.sizeAtHouse) : ''
    const slot = captionOf.get(String(u.id ?? ''))
    // ONE MAIN LABEL PER SERVICE at the circle. Four runs share two mains, so
    // 'EX. 8" WATER' and 'EX. 8" SEWER' each printed twice, over the easement's
    // own caption. The house label is NOT gated: every dwelling has its own
    // connection and its own end to letter.
    if (atMain && mainLabelAt.get(atMain) === String(u.id ?? '')) {
      endLabel(pts[0], atMain.toUpperCase(), pts[1])
    }
    if (atHouse) endLabel(pts[pts.length - 1], atHouse.toUpperCase(), pts[pts.length - 2])

    if (slot !== undefined) {
      const t2 = 0.30 + (slot % 4) * 0.15
      const i0 = Math.min(pts.length - 2, Math.floor(t2 * (pts.length - 1)))
      const f2 = t2 * (pts.length - 1) - i0
      const ax = pts[i0][0] + (pts[i0 + 1][0] - pts[i0][0]) * f2
      const ay = pts[i0][1] + (pts[i0 + 1][1] - pts[i0][1]) * f2
      label(doc, ax + 4, ay - 4 - (slot % 4) * 8, label_.toUpperCase(), 5.6, { color: pen.color })
    }

    // THE EASEMENT LETTERS ITSELF.
    //
    // Two labels were hung off the sanitary run — UTILITY EASEMENT and PRIVATE
    // UTILITY EASEMENT with their record notes — from the days when the
    // easement had no ring of its own. It has one now, and the Easement block
    // above letters it with its width, beneficiary and citation. Both fired
    // together and printed four captions and two record notes on top of each
    // other and on top of the run labels, in the one place on the sheet where a
    // reviewer has to read which right covers which pipe.
  }

  for (const d of genericOfKind(t, 'DrainageArea')) {
    if (!d.ring) continue
    const r = projectRing(d.ring, vp, b, PAD_FT)
    // #3388bb is luma 122 at 0.6 pt — faint in mono against the heavier
    // service runs it crosses. Darkened, with its long dash-dot kept distinct.
    polyline(doc, r, { width: 0.7, color: '#1f5f86', dash: [10, 4, 2, 4] }, true)
    const c = centroidOf(r)
    const ac = d.attributes?.areaAcres
    label(doc, c[0] - 26, c[1], `DA ${ac ?? ''} AC`.trim(), 5, { color: '#1f5f86' })
  }

  for (const sw of genericOfKind(t, 'SWMPractice')) {
    if (!sw.ring) continue
    const r = projectRing(sw.ring, vp, b, PAD_FT)
    polyline(doc, r, { width: 1.2, color: '#227744', dash: undefined }, true)
    // DOWN-RIGHT, tighter and heavier — the opposite hand to the easement, so
    // the two never read as the same fill. At 0.25 pt and 45% this hatch
    // thresholded away almost completely and the practice printed as an empty
    // rectangle.
    hatch(doc, r, '#227744', 3.5, { down: true, weight: 0.45, opacity: 0.7 })
    const c = centroidOf(r)
    label(doc, c[0] - 20, c[1] - 4, 'ESD', 5, { bold: true, color: '#227744' })
    const ft = sw.attributes?.footprintSqFt
    if (ft) label(doc, c[0] - 20, c[1] + 3, `${ft} SF`, 5, { bold: true, color: '#1b5e34' })
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

  // ONE LABEL PER SURFACE TYPE ACROSS THE SHEET.
  //
  // The leader tiers below stagger a driveway, its apron and the walk beside
  // them so one lot reads cleanly. On a four-lot sheet every one of those names
  // repeated four times inside the same frontage band — 'CONCRETE SIDEWALK
  // 3' WIDE' four times, 'CURB AND GUTTER' four times, 'PROPOSED DRIVEWAY
  // 12' WIDE' four times — and the band became unreadable. A drafter letters a
  // surface once and lets the hatch carry it everywhere else, which is what the
  // per-surface patterns above are for. The largest instance takes the label so
  // the leader lands on the piece most likely to be visible.
  const pavements = genericOfKind(t, 'Pavement')
  const ringAreaOf = (f: { ring?: Ring }) => {
    const c = (f.ring?.coordinates ?? []) as Position[]
    return c.length < 4 ? 0
      : Math.abs(c.slice(0, -1).reduce((n, q, i, arr) => {
          const w = arr[(i + 1) % arr.length]; return n + (q[0] * w[1] - w[0] * q[1])
        }, 0) / 2)
  }
  const labelBearer = new Map<string, string>()
  for (const pv of pavements) {
    const lb = String((pv.attributes as { label?: string } | undefined)?.label ?? '').trim()
    if (!lb) continue
    const cur = labelBearer.get(lb)
    if (!cur || ringAreaOf(pv as never) > ringAreaOf(
      pavements.find(x => String(x.id) === cur) as never ?? {})) {
      labelBearer.set(lb, String(pv.id))
    }
  }

  for (const pv of pavements) {
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
    if (a2.label && a2.label.trim()
        && labelBearer.get(a2.label.trim()) === String(pv.id)) {
      const cx2 = r.reduce((n, q) => n + q[0], 0) / r.length
      const cy2 = r.reduce((n, q) => n + q[1], 0) / r.length
      // Leader lengths staggered per surface AND per label, so the driveway,
      // its apron and the walk beside them do not letter into one another.
      // Three names printed at nearly the same point is three names nobody can
      // read.
      const isApronLbl = /apron/i.test(String(a2.label))
      const lead = isCurb ? 54 : isWalk ? 36 : isApronLbl ? 22 : 8
      const tier = isCurb ? 0 : isWalk ? 1 : isApronLbl ? 2 : 3
      const tx = cx2 + lead + 6, ty = cy2 - lead - 4 - tier * 9
      doc.moveTo(cx2, cy2).lineTo(cx2 + lead, cy2 - lead)
         .lineWidth(0.3).strokeColor('#777777').stroke()
      doc.circle(cx2, cy2, 0.9).fillColor('#777777').fill()
      // These already stagger themselves by tier. The placer is the backstop
      // for what the tiers cannot separate — a curb note on one lot landing on
      // the apron note of the next.
      L.add({
        text: String(a2.label), at: [tx, ty], dx: 0, dy: 0, width: 150, lines: 2,
        size: 6.5, color: '#444444', priority: 48,
        shifts: [[0, -9], [0, -18], [0, 9], [0, 18], [0, -27]],
      })
    }
  }

  // ── Landscaped surfaces — the planting strip ──────────────────────────────
  //
  // THE VERGE WAS ON THE MODEL AND ON NO SHEET.
  //
  // It is filed as `Surface` rather than `Pavement` deliberately, so it is not
  // stippled as paving — a landscaped strip and a paved one are different
  // surfaces. But nothing here drew `Surface` at all, so the frontage went out
  // as a walk and a curb with a 4 ft blank between them, and the street trees
  // stood in a strip the drawing did not show. A band the plan relies on for
  // its canopy is not optional.
  //
  // Drawn light and unhatched, which is what it is: ground, not construction.
  // ONE LABEL FOR THE STRIP, on the longest run of it.
  //
  // The planting strip is built as one band per frontage edge, and the frontage
  // is a curve carried as twenty-odd short chords, so labelling each band put
  // "PLANTING STRIP 4' WIDE (STREET TREES)" on the sheet TWENTY-ONE TIMES along
  // 400 ft of frontage — the single worst source of congestion on the drawing,
  // and it landed on top of the drainage-area callouts as well. It is one strip
  // and it takes one name, on the longest piece of it.
  const surfaces = genericOfKind(t, 'Surface').filter(sf => sf.ring)
  const surfaceLabelBearer = new Map<string, string>()
  for (const sf of surfaces) {
    const lb = String((sf.attributes as { label?: string } | undefined)?.label ?? '').trim()
    if (!lb) continue
    const cur = surfaceLabelBearer.get(lb)
    const areaOf = (f: typeof sf) => {
      const c = (f.ring?.coordinates ?? []) as Position[]
      return c.length < 4 ? 0 : Math.abs(c.slice(0, -1).reduce((n, q, i, arr) => {
        const w = arr[(i + 1) % arr.length]; return n + (q[0] * w[1] - w[0] * q[1])
      }, 0) / 2)
    }
    if (!cur || areaOf(sf) > areaOf(surfaces.find(x => String(x.id) === cur) ?? sf)) {
      surfaceLabelBearer.set(lb, String(sf.id))
    }
  }
  for (const sf of surfaces) {
    if (!sf.ring) continue
    const r = projectRing(sf.ring, vp, b, PAD_FT)
    doc.save()
    polyline(doc, r, { width: 0.4, color: '#6d8b56', dash: [2, 2] }, true)
    doc.restore()
    const lb = String((sf.attributes as { label?: string } | undefined)?.label ?? '').trim()
    if (!lb || surfaceLabelBearer.get(lb) !== String(sf.id)) continue
    const cx2 = r.reduce((n, q) => n + q[0], 0) / r.length
    const cy2 = r.reduce((n, q) => n + q[1], 0) / r.length
    // Tier 4, below the curb, walk, apron and driveway leaders above it, so the
    // five names along one frontage do not letter into one another.
    const lead = 68
    const tx = cx2 + lead + 6, ty = cy2 - lead - 4 - 4 * 9
    doc.moveTo(cx2, cy2).lineTo(cx2 + lead, cy2 - lead)
       .lineWidth(0.3).strokeColor('#777777').stroke()
    doc.circle(cx2, cy2, 0.9).fillColor('#777777').fill()
    L.add({
      text: lb, at: [tx, ty], dx: 0, dy: 0, width: 170, lines: 2,
      size: 6.5, color: '#444444', priority: 46,
      shifts: [[0, -9], [0, -18], [0, 9], [0, 18]],
    })
  }

  // ── Retaining walls ───────────────────────────────────────────────────────
  //
  // A wall is a STRUCTURE and is drafted as one: a heavy solid line with tick
  // marks on the retained side, which is how a drafter shows which way a wall
  // holds. Drawn as a plain line it reads as a fence or a property line.
  for (const w of genericOfKind(t, 'ProposedFeature')) {
    const ty = String((w.attributes as { type?: string } | undefined)?.type ?? '')
    if (!/retaining wall/i.test(ty) || !w.line?.length) continue
    const pts = (w.line as Position[]).map(q => P(q))
    if (pts.length < 2) continue
    doc.save()
    doc.lineCap('butt')
    polyline(doc, pts, { width: 2.0, color: '#000000', dash: undefined }, false)
    // Ticks on the high side — the side the wall retains.
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1][0], ay = pts[i - 1][1]
      const dx2 = pts[i][0] - ax, dy2 = pts[i][1] - ay
      const l2 = Math.hypot(dx2, dy2) || 1
      for (let f = 0.15; f < 1; f += 0.3) {
        const mx = ax + dx2 * f, my = ay + dy2 * f
        doc.moveTo(mx, my)
           .lineTo(mx - (dy2 / l2) * 4, my + (dx2 / l2) * 4)
           .lineWidth(0.9).strokeColor('#000000').stroke()
      }
    }
    doc.restore()
    const lb = String((w.attributes as { label?: string } | undefined)?.label ?? '')
    if (lb) {
      const mid = pts[Math.floor(pts.length / 2)]
      L.add({
        text: lb, at: [mid[0], mid[1]], dx: 7, dy: -12, width: 170,
        size: 6.5, font: 'Helvetica-Bold', color: '#000000', priority: 76,
        required: true, shifts: [[7, -22], [7, 4], [7, -32], [7, 14]],
      })
    }
  }

  // ── Floodplain limit on existing ground ───────────────────────────────────
  //
  // Drafted the way a flood limit is: a heavy dash-dot line in blue, ticks on
  // the WET side, and the elevation lettered on it. Blue because nothing else
  // on these sheets is blue except the water service, which is thin and dashed
  // and nowhere near it.
  const floodLabelled = new Set<string>()
  for (const fpf of featuresOfKind(t, 'Floodplain')) {
    const co = (fpf as unknown as { ring?: { coordinates: Position[] } }).ring?.coordinates
    if (!co?.length) continue
    const pts = co.map(q => P(q))
    if (pts.length < 2) continue
    // EXISTING AND PROPOSED ARE TOLD APART BY LINE, NOT BY LABEL.
    //
    // Two limits of the same elevation on one drawing, a few feet apart in
    // places, cannot be distinguished by a caption — a reviewer tracing one of
    // them along the sheet has to know which is which at every point on it.
    // Existing is the heavier dash-dot in the established blue; proposed is a
    // finer solid line in a deeper blue, which is the convention this set
    // already uses for existing against proposed everywhere else.
    const cond = String((fpf as unknown as {
      attributes?: { condition?: string }
    }).attributes?.condition ?? 'existing')
    const isProposed = cond === 'proposed'
    doc.save()
    polyline(doc, pts, isProposed
      ? { width: 1.2, color: '#0d47a1', dash: undefined }
      : { width: 1.6, color: '#1565c0', dash: [12, 3, 3, 3] }, false)
    for (let i = 1; i < pts.length; i += 4) {
      const ax = pts[i - 1][0], ay = pts[i - 1][1]
      const dx2 = pts[i][0] - ax, dy2 = pts[i][1] - ay
      const l2 = Math.hypot(dx2, dy2) || 1
      const mx = ax + dx2 * 0.5, my = ay + dy2 * 0.5
      doc.moveTo(mx, my).lineTo(mx - (dy2 / l2) * (isProposed ? 3 : 4),
                                my + (dx2 / l2) * (isProposed ? 3 : 4))
         .lineWidth(isProposed ? 0.8 : 1.0).strokeColor(isProposed ? '#0d47a1' : '#1565c0').stroke()
    }
    doc.restore()
    // ── ONE LABEL PER LOT, AND SHORT ────────────────────────────────────────
    //
    // This was lettered once per LINE, in two lines of type carrying the
    // citation and the datum caveat, and marked required. Lot 55 alone throws
    // two limit lines, so four long required labels landed in the most
    // contour-dense part of the sheet: one overprinted and seven lesser labels
    // were pushed off. The citation and the caveat belong in the legend and in
    // the findings column, where they are already stated. On the line itself
    // the elevation is the whole message.
    const a2 = (fpf as unknown as { attributes?: { elevationFt?: number } }).attributes ?? {}
    const lotKey = String((fpf as { id?: string }).id ?? '').split('-').slice(0, 3).join('-')
    if (!floodLabelled.has(lotKey)) {
      floodLabelled.add(lotKey)
      const mid = pts[Math.floor(pts.length / 2)]
      L.add({
        text: `100-YR FLOODPLAIN LIMIT, ${isProposed ? 'PROPOSED' : 'EXISTING'} — `
          + `EL ${Number(a2.elevationFt ?? 0).toFixed(0)}`,
        at: [mid[0], mid[1]], dx: 8, dy: -10, width: 152,
        size: 6, font: 'Helvetica-Bold', color: isProposed ? '#0d47a1' : '#1565c0',
        priority: isProposed ? 93 : 94, required: true,
        shifts: [[8, -20], [8, 4], [-162, -10], [8, -30], [-162, 4], [8, 14]],
      })
    }
  }

  // ── Ground cover limit ────────────────────────────────────────────────────
  //
  // The line between what gets mown and what gets planted. It is drafted the
  // way a limit line is — a dashed run with short ticks on the STEEP side, the
  // side the ground cover goes — so which side is which is on the drawing and
  // not left to the note.
  for (const g of genericOfKind(t, 'ProposedFeature')) {
    const ty = String((g.attributes as { type?: string } | undefined)?.type ?? '')
    if (!/ground cover limit/i.test(ty) || !g.line?.length) continue
    const pts = (g.line as Position[]).map(q => P(q))
    if (pts.length < 2) continue
    doc.save()
    polyline(doc, pts, { width: 0.8, color: '#c2185b', dash: [6, 2, 1.5, 2] }, false)
    for (let i = 1; i < pts.length; i += 3) {
      const ax = pts[i - 1][0], ay = pts[i - 1][1]
      const dx2 = pts[i][0] - ax, dy2 = pts[i][1] - ay
      const l2 = Math.hypot(dx2, dy2) || 1
      const mx = ax + dx2 * 0.5, my = ay + dy2 * 0.5
      doc.moveTo(mx, my)
         .lineTo(mx - (dy2 / l2) * 3, my + (dx2 / l2) * 3)
         .lineWidth(0.6).strokeColor('#c2185b').stroke()
    }
    doc.restore()
  }
  {
    const gcs = genericOfKind(t, 'ProposedFeature')
      .filter(g => /ground cover limit/i.test(
        String((g.attributes as { type?: string } | undefined)?.type ?? '')) && g.line?.length)
    // ONE LABEL PER LOT, not per line. A 3:1 limit comes out of the extractor
    // as three to five separate strands round one slope, and labelling each one
    // buries the drawing in the same six words repeated.
    const seen = new Set<string>()
    for (const g of gcs) {
      // `gc-lot55-0` — the LOT is the first two parts. Taking three kept the
      // strand index, so every strand was its own "lot" and the label printed
      // once per line after all: three copies of the same sentence stacked on
      // one slope.
      const lot = String(g.id ?? '').split('-').slice(0, 2).join('-')
      if (seen.has(lot)) continue
      seen.add(lot)
      const pts = (g.line as Position[]).map(q => P(q))
      const mid = pts[Math.floor(pts.length / 2)]
      const lb = String((g.attributes as { label?: string } | undefined)?.label ?? '')
      if (lb) {
        L.add({
          text: lb, at: [mid[0], mid[1]], dx: 6, dy: -10, width: 150, lines: 2,
          size: 5.8, font: 'Helvetica-Bold', color: '#c2185b', priority: 66,
          shifts: [[6, -24], [6, 6], [6, -38], [6, 20], [-150, -10]],
        })
      }
    }
  }

  // ── Drainage swales ───────────────────────────────────────────────────────
  //
  // A swale is a GRADED SECTION, not a line, so it is drawn as one: the graded
  // width to scale in a light band, a centre line for the invert, and flow
  // arrows. Drawn as a single stroke it would be one more line among the
  // services and the contours, and a reviewer could not see that it is 5 ft
  // wide and holds the flow.
  {
    const swales = genericOfKind(t, 'ProposedFeature')
      .filter(g => (g.attributes as { swale?: boolean } | undefined)?.swale && g.line?.length)
    let labelled = false
    for (const sw of swales) {
      const pts = (sw.line as Position[]).map(q => P(q))
      if (pts.length < 2) continue
      // Section width, ft, taken from the design note rather than assumed.
      const note = String((sw.attributes as { note?: string } | undefined)?.note ?? '')
      const secFt = Number(/section ([\d.]+) ft overall/.exec(note)?.[1] ?? 5)
      const halfPt = Math.max(1.2, (secFt / 2) * vp.pointsPerFoot)
      // The band: the graded section, drawn once as a soft fill either side of
      // the invert.
      for (const side of [1, -1]) {
        const off: [number, number][] = pts.map((q, i) => {
          const a2 = pts[Math.max(0, i - 1)], b2 = pts[Math.min(pts.length - 1, i + 1)]
          const dx2 = b2[0] - a2[0], dy2 = b2[1] - a2[1]
          const l2 = Math.hypot(dx2, dy2) || 1
          return [q[0] - (dy2 / l2) * halfPt * side, q[1] + (dx2 / l2) * halfPt * side]
        })
        polyline(doc, off, { width: 0.45, color: '#4f8a5b', dash: [5, 3] }, false)
      }
      // The invert.
      doc.save()
      doc.lineCap('round')
      polyline(doc, pts, { width: 1.0, color: '#2e7d32', dash: undefined }, false)
      doc.restore()
      // Flow arrows along the run, so the direction of fall is on the drawing
      // rather than inferred from two spot elevations.
      for (let i = 1; i < pts.length; i++) {
        const ax = pts[i - 1][0], ay = pts[i - 1][1]
        const dx2 = pts[i][0] - ax, dy2 = pts[i][1] - ay
        const l2 = Math.hypot(dx2, dy2) || 1
        for (const f of [0.3, 0.7]) {
          const mx = ax + dx2 * f, my = ay + dy2 * f
          const ux = dx2 / l2, uy = dy2 / l2
          doc.save().lineWidth(0.8).strokeColor('#2e7d32')
             .moveTo(mx - ux * 4 - uy * 2.6, my - uy * 4 + ux * 2.6)
             .lineTo(mx, my)
             .lineTo(mx - ux * 4 + uy * 2.6, my - uy * 4 - ux * 2.6)
             .stroke().restore()
        }
      }
      // EVERY REACH IS LABELLED, because every reach has its own grade and its
      // own two inverts. One label for the whole system said 3.01% and INV OUT
      // 46.90 over a run that also contains a 4.98% reach starting at 60.30,
      // and a contractor setting the upper swale from the only label on the
      // drawing would have built it ten feet too low.
      void labelled
      {
        const mid = pts[Math.floor(pts.length / 2)]
        const lb = String((sw.attributes as { label?: string } | undefined)?.label ?? '')
        if (lb) {
          // Grade and inverts. A contractor stakes the swale from these, so the
          // label is required — it moves before it goes.
          L.add({
            text: lb, at: [mid[0], mid[1]], dx: 8, dy: -14, width: 200, lines: 2,
            size: 6, font: 'Helvetica-Bold', color: '#2e7d32', priority: 84,
            required: true,
            shifts: [[8, -28], [8, 6], [8, -42], [8, 20], [-208, -14], [-208, -28]],
          })
        }
      }
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
        L.add({
          text: `${feet}'-${inches}"`, at: [mx, my], angle: ang, dx: -34, dy: -9,
          width: 68, align: 'center', size: 6.5, font: 'Helvetica-Bold',
          color: '#000000', priority: 92, required: true,
          shifts: [[-34, 2], [-34, -18], [-34, 11]],
        })
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
    // The dwelling hatch is the WIDEST spacing of the three hatched areas —
    // easement 6, practice 3.5, dwelling 7 — and it runs up-right like the
    // easement but far more open, so the three stay distinct with no colour.
    // #c0392b is luma 85, so red carries no emphasis in mono at all; the
    // emphasis has to come from weight.
    doc.lineWidth(0.35).strokeColor('#c0392b').opacity(0.65)
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
      // BASEMENT, FINISHED FLOOR AND SUBFLOOR ARE GRADING DATA.
      //
      // They belong on the sheet a builder sets the house from, and they were
      // printing in the middle of every dwelling on the LANDSCAPE plan as well —
      // three elevations, in the one place on that sheet a planting plan wants
      // clear. The address stays: it says which house this is, which every
      // discipline needs.
      const gradingSheet = ctx.sheet === 'C-001' || ctx.sheet === 'C-400'
      const rows2: [string, string][] = gradingSheet ? [
        ['B', ev('basementElevFt')], ['FF', ev('finishedFloorElevFt')], ['SF', ev('subFloorElevFt')],
      ] : []
      // THE ADDRESS GOES ON THE HOUSE. It was lettered out on the lot beside
      // the area, which is where a lot label belongs and not where a builder
      // looks to see which dwelling they are standing in.
      const addr = String(bAt.address ?? bAt.lotLabel ?? '')
      const fx = r.reduce((n, q) => n + q[0], 0) / r.length
      const fy = r.reduce((n, q) => n + q[1], 0) / r.length
      const ew = 56, eh = rows2.length * 8 + (addr ? 13 : 0) + 4
      // FIXED, AND RESERVED. This block belongs at the centre of the dwelling it
      // describes — it does not move — so instead of being placed it claims its
      // space, and everything the placer handles keeps off it.
      L.reserve([fx - ew / 2 - 2, fy - eh / 2 - 2, fx + ew / 2 + 2, fy + eh / 2 + 2])
      doc.save()
      doc.rect(fx - ew / 2, fy - eh / 2, ew, eh).fillColor('#ffffff').opacity(0.85).fill()
      doc.opacity(1)
      // NO BORDER. A ruled box inside the footprint reads as a feature — a slab,
      // a chase, something built — and it is only a place to put three numbers.
      let ey = fy - eh / 2 + 2
      if (addr) {
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000')
           .text(addr, fx - ew / 2, ey, { width: ew, align: 'center', lineBreak: false })
        ey += 11
      }
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
    // ONE LABEL, TWO LINES. Queued separately they were placed separately, and
    // the placer — quite correctly, by its own rules — put the area ABOVE the
    // name on Lot 55 because that was the first clear slot. A caption and the
    // figure it belongs to are one object and have to move as one.
    L.add({
      text: a.areaSqFt
        ? `PROPOSED DWELLING\n${Math.round(Number(a.areaSqFt)).toLocaleString()} SQ FT`
        : 'PROPOSED DWELLING',
      at: [cx, labelY], dx: -60, dy: 0, width: 120, lines: a.areaSqFt ? 2 : 1,
      align: 'center', size: 7.5, font: 'Helvetica-Bold', color: '#a5261b',
      priority: 78, required: true,
    })
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
  if (n === 'ROLLINS') return 'ROLLINS AVENUE'
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
        L.add({
          text: streetLabel(st.name), at: [mid[0], mid[1]], angle: ang,
          dx: -80, dy: -12, width: 160, align: 'center', size: 9,
          font: 'Helvetica-Bold', color: '#555555', priority: 86, required: true,
          shifts: [[-80, -24], [-80, 2], [-80, -36]],
        })
        L.add({
          text: 'EX. PAVEMENT CENTERLINE  ·  R/W WIDTH PER RECORD PLAT',
          at: [mid[0], mid[1]], angle: ang, dx: -80, dy: -3, width: 160,
          align: 'center', size: 7, color: '#777777', priority: 42,
          shifts: [[-80, 6], [-80, -15], [-80, 15]],
        })
      }
    }
  }

  for (const seg of featuresOfKind(t, 'BoundarySegment')) {
    polyline(doc, [P(seg.from), P(seg.to)], PEN.boundary)
  }

  // ── PLACE EVERY LABEL ─────────────────────────────────────────────────────
  //
  // One pass, after all geometry, so text sits over the drawing and each label
  // knows what is already on the paper.
  const report = L.flush()
  if (report.forced > 0) {
    console.error(`  !! ${report.forced} REQUIRED label(s) on ${ctx.sheet} had nowhere clear to go `
      + 'and were placed over other content. That is an overprint on the sheet.')
  }
  if (report.dropped > 0) {
    // NOT SILENT. A label that would not fit is content missing from the sheet,
    // and the only thing worse than a crowded drawing is a tidy one that has
    // quietly stopped saying something. Everything ranked as required is placed
    // regardless, so anything counted here is subordinate — an adjoining
    // parcel's area, an easement's beneficiary — but it is still reported.
    console.error(`  !! ${report.dropped} label(s) could not be placed on `
      + `${ctx.sheet} without overprinting and were dropped `
      + `(${report.placed} placed). Everything required was placed.`)
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
  const buildings = t.features.filter(f => f.kind === 'Building' && (f as { existing?: boolean }).existing === false) as
    Array<{ attributes?: Record<string, unknown> }>
  const projectLots = (t as { projectLots?: Array<{
    label: string
    areaSqFt: number | null
    buildableEnvelope?: {
      setbacks?: { frontFt?: number; sideFt?: number; rearFt?: number }
      coveragePct?: number | null
      frontage?: { providedFt: number | null; requiredFt: number | null; meets: boolean | null }
    } | null
  }> }).projectLots ?? []
  const env = (t as { buildableEnvelope?: Record<string, unknown> }).buildableEnvelope
  const sb = (env?.setbacks ?? {}) as { frontFt?: number; sideFt?: number; rearFt?: number }
  const fr = env?.frontage as
    { providedFt: number | null; requiredFt: number | null; meets: boolean | null } | undefined

  const grossArea = parcel?.areaSqFt ?? null
  const netLotArea = projectLots.length
    ? projectLots.reduce((sum, lot) => sum + (lot.areaSqFt ?? 0), 0)
    : grossArea
  const fp = buildings.reduce((sum, bld) => sum + Number(bld.attributes?.areaSqFt ?? 0), 0) || null
  const covPct = netLotArea && fp ? (fp / netLotArea) * 100 : null
  const covMax = (env?.coveragePct as number | undefined) ?? null
  const lotAreaRows: [string, string, string][] = projectLots.map(lot => [
    `${lot.label} AREA`,
    lot.areaSqFt ? `${Math.round(lot.areaSqFt).toLocaleString()} SF` : '—',
    lot.areaSqFt ? `${(lot.areaSqFt / 43560).toFixed(3)} AC` : '',
  ])
  const frontageValues = projectLots
    .map(lot => lot.buildableEnvelope?.frontage?.providedFt)
    .filter((v): v is number => v != null)
  const requiredFrontage = projectLots
    .map(lot => lot.buildableEnvelope?.frontage?.requiredFt)
    .find((v): v is number => v != null) ?? fr?.requiredFt ?? null
  void frontageValues
  const frontageRows: [string, string, string][] = projectLots
    .filter(lot => lot.buildableEnvelope?.frontage?.providedFt != null)
    .map(lot => [
      `${lot.label} FRONTAGE`,
      requiredFrontage != null ? `${requiredFrontage}' MIN` : '—',
      `${lot.buildableEnvelope!.frontage!.providedFt!.toFixed(2)}'`,
    ])

  const rows: [string, string, string][] = [
    ['ZONE', String(t.zoneCode ?? '—'), ''],
    ['TAX / PARCEL ID', String(parcel?.parcelId ?? '—'), ''],
    ['GROSS TRACT AREA', grossArea ? `${Math.round(grossArea).toLocaleString()} SF` : '—',
      grossArea ? `${(grossArea / 43560).toFixed(3)} AC` : ''],
    ...lotAreaRows,
    ...(projectLots.length ? [[
      'NET LOT AREA',
      netLotArea ? `${Math.round(netLotArea).toLocaleString()} SF` : '—',
      netLotArea ? `${(netLotArea / 43560).toFixed(3)} AC` : '',
    ] as [string, string, string]] : []),
    // Sec. 24-128 makes frontage what establishes a buildable lot, and
    // Sec. 27-4202 sets the minimum AT the front street line. Required beside
    // provided, as the setback rows read.
    //
    // ONE ROW PER LOT. Four frontages joined with slashes ran to 33 characters
    // in a 60 pt cell set `lineBreak: false`, so it overran its column and
    // printed straight through the SETBACKS header underneath it — two lines of
    // type on top of each other in the middle of the site data block, which is
    // the first thing a reviewer reads. It also asked them to match four
    // unlabelled numbers to four lots by position. The lot areas above already
    // take a row each; frontage does the same.
    ...(frontageRows.length ? frontageRows : [[
      'LOT FRONTAGE', requiredFrontage != null ? `${requiredFrontage}' MIN` : '—',
      fr?.providedFt != null ? `${fr.providedFt.toFixed(2)}'` : 'NOT ESTABLISHED',
    ] as [string, string, string]]),
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
  doc: Doc, x: number, y: number, w: number,
  input: DrainageComputation | Array<{ label: string; drainage: DrainageComputation }> | null,
): number {
  if (!input) return y
  if (Array.isArray(input)) {
    if (!input.length) return y
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000')
       .text('DRAINAGE AREA COMPUTATIONS', x, y, { lineBreak: false })
    let cy = y + 13
    const widths = [w * 0.25, w * 0.125, w * 0.125, w * 0.13, w * 0.13, w * 0.13, w * 0.11]
    const row = (values: string[], bold = false) => {
      let cx = x
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(6.2).fillColor('#000000')
      values.forEach((value, index) => {
        doc.text(value, cx, cy, { width: widths[index] - 3, align: index ? 'right' : 'left', lineBreak: false })
        cx += widths[index]
      })
      cy += 9
    }
    row(['CATCHMENT', 'AREA SF', 'IMPERV.', 'PRE Q', 'POST Q', 'INCREASE', 'WQv CF'], true)
    for (const { label: lotLabel, drainage: d } of input) {
      row([
        lotLabel,
        Math.round(d.totalAreaSqFt).toLocaleString(),
        `${d.percentImpervious.toFixed(1)}%`,
        d.preDevelopment.peakCfs?.toFixed(2) ?? '—',
        d.postDevelopment.peakCfs?.toFixed(2) ?? '—',
        d.increaseCfs?.toFixed(2) ?? '—',
        d.waterQualityVolumeCf == null ? '—' : Math.round(d.waterQualityVolumeCf).toLocaleString(),
      ])
    }
    const total = input.reduce((sum, item) => ({
      area: sum.area + item.drainage.totalAreaSqFt,
      impervious: sum.impervious + item.drainage.totalAreaSqFt * item.drainage.percentImpervious / 100,
      pre: sum.pre + (item.drainage.preDevelopment.peakCfs ?? 0),
      post: sum.post + (item.drainage.postDevelopment.peakCfs ?? 0),
      increase: sum.increase + (item.drainage.increaseCfs ?? 0),
      wqv: sum.wqv + (item.drainage.waterQualityVolumeCf ?? 0),
    }), { area: 0, impervious: 0, pre: 0, post: 0, increase: 0, wqv: 0 })
    doc.moveTo(x, cy).lineTo(x + w, cy).lineWidth(0.4).strokeColor('#999999').stroke()
    cy += 3
    row([
      'PROJECT TOTAL', Math.round(total.area).toLocaleString(),
      total.area ? `${(total.impervious / total.area * 100).toFixed(1)}%` : '—',
      total.pre.toFixed(2), total.post.toFixed(2), total.increase.toFixed(2),
      Math.round(total.wqv).toLocaleString(),
    ], true)
    doc.font('Helvetica').fontSize(6).fillColor('#555555')
       .text('Peak flows are summed lot catchments; Q in cfs. WQv is the required water-quality volume.', x, cy + 2, { width: w })
    return doc.y + 2
  }
  const d = input
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
// SHORT ENOUGH FOR ONE LINE in the narrowest panel. The long form wrapped and
// the second line was cut off by the panel border — 'THE STANDARD GOVERNS'
// sliced in half across the bottom of both county details.
const DPWT_CREDIT = 'REPRODUCED FROM THE PGC DPW&T STANDARD. THE STANDARD GOVERNS.'

const COUNTY_DETAILS: { file: string; title: string; std: string; credit?: string }[] = [
  { file: 'dpwt-300-01-curb-and-gutter.png',
    title: 'CONCRETE CURB AND GUTTER', std: 'PGC DPW&T STD. 300.01' },
  { file: 'dpwt-300-07-sidewalk-ramp.png',
    title: 'CONCRETE SIDEWALK RAMP TYPE A', std: 'PGC DPW&T STD. 300.07' },
]

/**
 * Project-specific exhibits, keyed by the project they belong to.
 *
 * The WSSC water and sewer connection sketch was added straight into
 * COUNTY_DETAILS, which is a GLOBAL list — so a recorded easement document for
 * Rollins Avenue printed on the Fort Foote Road sheets, where it describes
 * neither the lots nor the easements nor the mains. A county standard detail is
 * general and belongs in that list; a recorded instrument for one property does
 * not. It is drawn only when the caller names it.
 */
const PROJECT_EXHIBITS: Record<string, { file: string; title: string; std: string; credit?: string }> = {
  // The FIELD topographic survey, reproduced. The contours drawn on the plan
  // are county lidar mapping at 2 ft; this sheet is the surveyed original, with
  // its own spot elevations and benchmarks, and a reviewer checking existing
  // grade should be able to see it rather than take the lidar on trust.
  'indian-queen-field-topo': {
    file: 'indian-queen-field-topo.png',
    title: 'FIELD TOPOGRAPHIC SURVEY — EXISTING CONTOURS',
    std: 'SURVEYED — BM H31A EL 61.09',
    credit: 'REPRODUCED FROM THE FIELD TOPOGRAPHIC SURVEY. THE SURVEY GOVERNS.',
  },
  'wssc-connection-sketch': {
    file: 'wssc-water-sewer-connection-sketch.png',
    title: 'WATER & SEWER CONNECTION SKETCH', std: 'RECORDED — SCALE 1" = 60\'',
    credit: 'REPRODUCED FROM THE RECORDED SKETCH. THE RECORDED DOCUMENT GOVERNS.',
  },
}

function countyDetails(
  doc: Doc, x: number, y: number, w: number, h: number, exhibits: string[] = [],
): number {
  const dir = join(__dirname, '..', '..', 'assets', 'details')
  const extra = exhibits.map(k => PROJECT_EXHIBITS[k]).filter(Boolean)
  const avail = [...COUNTY_DETAILS, ...extra].filter(d => existsSync(join(dir, d.file)))
  if (!avail.length) return y

  // EACH PANEL IS SIZED TO ITS DETAIL, not to an equal share of the band.
  //
  // The county sheets are portrait — a curb section stacked over its general
  // notes over the DPW&T approval block, about 0.65 wide to tall. Given an
  // equal slice of a wide band, `fit` scaled each to the band's HEIGHT and left
  // two thirds of every panel empty, so the details printed as thumbnails in
  // large boxes. Asking for them bigger could not help: the height was the
  // constraint and the width was being wasted.
  //
  // The panel takes the image's own aspect at the full band height, so the
  // detail fills it and the dimensions come up as large as the band allows.
  const HEAD = 15, FOOT = 12
  const imgH = h - HEAD - FOOT - 6
  let cx = x
  for (const d of avail) {
    const file = join(dir, d.file)
    let aspect = 0.7
    try {
      const img = (doc as unknown as { openImage: (f: string) => { width: number; height: number } })
        .openImage(file)
      if (img?.width && img?.height) aspect = img.width / img.height
    } catch { /* fall back to the portrait default */ }
    const bw = Math.min(imgH * aspect + 10, w - (cx - x))
    if (bw < 60) break
    box(doc, cx, y, bw, h, PEN.frame)
    doc.rect(cx, y, bw, HEAD).fillColor('#eeeeee').fill()
    box(doc, cx, y, bw, HEAD, PEN.hair)
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
       .text(`${d.title} — ${d.std}`, cx + 5, y + 4, { width: bw - 10, lineBreak: false })
    try {
      doc.image(file, cx + 5, y + HEAD + 3, { fit: [bw - 10, imgH], align: 'center' })
    } catch {
      doc.font('Helvetica').fontSize(7).fillColor('#8a3a2a')
         .text('DETAIL IMAGE NOT AVAILABLE', cx + 8, y + HEAD + 8, { width: bw - 16 })
    }
    doc.font('Helvetica').fontSize(5.6).fillColor('#666666')
       .text(d.credit ?? DPWT_CREDIT,
             cx + 5, y + h - 9, { width: bw - 10, lineBreak: false, ellipsis: true })
    cx += bw + 12
  }
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
    ['DRAWN BY', 'KEALEE SITE-PLAN ENGINE'],
    // DESIGNED BY and CHECKED BY are left EMPTY, not annotated.
    //
    // They carried '(TO BE COMPLETED BY THE DESIGN PROFESSIONAL)', which is an
    // instruction to the reader printed in a field that exists to hold a name.
    // A title block's blank lines are already understood — the seal panel
    // below does not explain itself either.
    ['DESIGNED BY', ''],
    ['CHECKED BY', ''],
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
    // THE CULVERT QUESTION, ANSWERED ON THE SHEET.
    //
    // "Is there a culvert under the driveway" is one of the first things a
    // reviewer asks of a residential entrance, and a sheet that simply does not
    // draw one has not answered it — absence reads as an omission. It is a
    // question about the ROAD SECTION: a driveway crossing an open roadside
    // ditch needs a pipe under it, and a driveway crossing a curb-and-gutter
    // section does not, because the gutter carries the flow through the
    // depressed apron. This frontage is the second kind, the gutter is
    // existing, and the on-lot drainage runs the other way — to the swale in
    // the rear easement, which crosses no driveway on any of the four lots.
    'NO DRIVEWAY CULVERT IS REQUIRED. THIS FRONTAGE IS AN EXISTING CURB AND GUTTER SECTION, NOT ' +
    'AN OPEN DITCH SECTION: GUTTER FLOW IS CARRIED THROUGH EACH ENTRANCE BY THE DEPRESSED CURB ' +
    'AT THE APRON PER DPW&T STD. 300.01 NOTE 6. ON-LOT DRAINAGE IS COLLECTED BY THE REAR-YARD ' +
    'SWALE IN THE REAR DRAINAGE EASEMENT AND CROSSES NO DRIVEWAY OR APRON.',
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
  const buildings = t.features.filter(f => f.kind === 'Building' && (f as { existing?: boolean }).existing === false) as
    Array<{ attributes?: Record<string, unknown> }>
  const projectLots = (t as { projectLots?: Array<{
    areaSqFt: number | null
    disturbedAreaSqFt?: number | null
    disturbanceHasUnknowns?: boolean
  }> }).projectLots ?? []
  const gross = parcel?.areaSqFt ?? null
  const net = projectLots.length
    ? projectLots.reduce((sum, lot) => sum + (lot.areaSqFt ?? 0), 0)
    : gross
  const dwelling = buildings.reduce((sum, bld) => sum + Number(bld.attributes?.areaSqFt ?? 0), 0) || null
  const dt = t as {
    disturbedAreaSqFt?: number; disturbanceHasUnknowns?: boolean
    disturbanceMeetsThreshold?: boolean
  }
  const dist = projectLots.length
    ? projectLots.reduce((sum, lot) => sum + (lot.disturbedAreaSqFt ?? 0), 0)
    : dt.disturbedAreaSqFt ?? null
  const disturbanceHasUnknowns = projectLots.length
    ? projectLots.some(lot => lot.disturbanceHasUnknowns)
    : dt.disturbanceHasUnknowns

  const fmt = (v: number | null) => v == null ? 'NOT ESTABLISHED' : `${Math.round(v).toLocaleString()} SF`
  const rows: [string, string][] = [
    ['1.  Gross tract area', fmt(gross)],
    ['2.  Area of dwelling', fmt(dwelling)],
    ['3.  Wooded area', 'NOT ESTABLISHED'],
    ['4.  Floodplain area', 'NOT ESTABLISHED'],
    ['5.  Net lot area', fmt(net)],
    // A KNOWN SUM WITH COMPONENTS OUTSTANDING IS 'AT LEAST', NOT 'UNKNOWN'.
    // Printing NOT QUANTIFIED beside a figure the package had computed told a
    // reviewer nothing was known when in fact the threshold was already
    // cleared, which is the determination the whole sheet turns on.
    ['6.  TOTAL AREA DISTURBED',
      dist == null ? 'NOT QUANTIFIED'
        : disturbanceHasUnknowns ? `${fmt(dist)} (AT LEAST)` : fmt(dist)],
    ['7.  SWM REQUIRED — Sec. 32-174(a)(3)',
      dist == null ? 'UNDETERMINED'
        : dist > 5000
          ? 'YES — DISTURBANCE EXCEEDS 5,000 SF'
          : 'EXEMPT — 5,000 SF OR LESS'],
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
/**
 * ONE TABLE RENDERER FOR EVERY SCHEDULE ON THE SHEET.
 *
 * The soils table and the storm drain schedule were written separately and drew
 * differently — their own row heights, their own header treatment, their own
 * rules — so two tables side by side on one sheet did not look like two tables
 * from one drawing office. Worse, neither measured itself, so both ran wherever
 * their rows took them and landed on the county standard details beneath.
 *
 * This draws to a HEIGHT BUDGET and reports what it used. A table that cannot
 * fit its rows prints the rows that fit and says how many it dropped, which is
 * a legible table plus a known omission — rather than an illegible one, or an
 * extra page.
 */
function dataTable(doc: Doc, x: number, y: number, o: {
  title: string
  subtitle?: string
  columns: [string, number][]
  rows: string[][]
  maxW: number
  maxH: number
}): number {
  const ROW_H = 11
  const FS = 7
  const totalW = Math.min(o.maxW, o.columns.reduce((n, c) => n + c[1], 0))
  // ── THE SUBTITLE GETS ITS OWN LINE WHEN IT NEEDS ONE ──────────────────────
  //
  // It was set on the title's baseline, `lineBreak: false`, starting just past
  // the title — so a subtitle longer than the space beside the title ran
  // straight over it and on past the end of the table. The canopy schedule's
  // citation is a sentence and a half; it printed through the words TREE CANOPY
  // SCHEDULE and out into the drawing.
  const totalW0 = Math.min(o.maxW, o.columns.reduce((n, c) => n + c[1], 0))
  doc.font('Helvetica-Bold').fontSize(8.5)
  const titleW = doc.widthOfString(o.title)
  doc.font('Helvetica').fontSize(6.5)
  const subW = o.subtitle ? doc.widthOfString(o.subtitle) : 0
  const subInline = !o.subtitle || titleW + 8 + subW <= totalW0
  const subLines = o.subtitle && !subInline
    ? Math.max(1, Math.ceil(subW / Math.max(1, totalW0))) : 0
  const headerH = 12 + subLines * 8
  const roomRows = Math.max(0, Math.floor((o.maxH - headerH - ROW_H) / ROW_H))
  const shown = o.rows.slice(0, roomRows)
  const dropped = o.rows.length - shown.length
  if (!shown.length) return y

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000')
     .text(o.title, x, y, { lineBreak: false })
  if (o.subtitle) {
    doc.font('Helvetica').fontSize(6.5).fillColor('#666666')
    if (subInline) {
      doc.text(o.subtitle, x + titleW + 8, y + 1.5, { lineBreak: false })
    } else {
      doc.text(o.subtitle, x, y + 11, { width: totalW0 })
    }
  }
  let cy = y + headerH
  doc.save().lineWidth(0.7).strokeColor('#000000')
     .rect(x, cy, totalW, ROW_H * (shown.length + 1)).stroke().restore()
  let cx = x
  for (const [lab, w] of o.columns) {
    doc.font('Helvetica-Bold').fontSize(FS).fillColor('#000000')
       .text(lab, cx + 3, cy + 3, { width: w - 5, lineBreak: false, ellipsis: true })
    cx += w
  }
  doc.save().lineWidth(0.5).strokeColor('#000000')
     .moveTo(x, cy + ROW_H).lineTo(x + totalW, cy + ROW_H).stroke().restore()
  cy += ROW_H
  for (const row of shown) {
    cx = x
    row.forEach((v, i) => {
      if (i >= o.columns.length) return
      doc.font('Helvetica').fontSize(FS).fillColor('#333333')
         .text(v, cx + 3, cy + 3, { width: o.columns[i][1] - 5, lineBreak: false, ellipsis: true })
      cx += o.columns[i][1]
    })
    doc.save().lineWidth(0.2).strokeColor('#cccccc')
       .moveTo(x, cy + ROW_H).lineTo(x + totalW, cy + ROW_H).stroke().restore()
    cy += ROW_H
  }
  if (dropped > 0) {
    doc.font('Helvetica-Oblique').fontSize(6).fillColor('#777777')
       .text(`+ ${dropped} further row(s) — see the accompanying schedule`, x, cy + 2,
             { width: totalW, lineBreak: false })
    cy += 9
  }
  return cy
}

function soilsTable(
  doc: Doc, x: number, y: number, ctx: SheetContext, maxW: number, maxH: number,
): number {
  let soils = (ctx.twin as { soils?: {
    mapUnitSymbol: string; mapUnitName: string; kFactor: string | null
    hydricRating: string | null; hydrologicGroup: string | null; drainageClass: string | null
  }[] }).soils
  if (!soils?.length) return y
  // ONE ROW PER MAP UNIT. SSURGO returns a row per major component, so a unit
  // with two of them printed twice — "Adelphia-Holmdel complex, 0 to 2 percent
  // slopes" appeared on the sheet under two different drainage classes, which
  // reads as a contradiction rather than as two components of one unit.
  const bySymbol = new Map<string, typeof soils[number]>()
  for (const u of soils) if (!bySymbol.has(u.mapUnitSymbol)) bySymbol.set(u.mapUnitSymbol, u)
  soils = [...bySymbol.values()]

  return dataTable(doc, x, y, {
    title: 'SOILS TABLE',
    subtitle: 'USDA NRCS SSURGO — PGC Code Sec. 32-130(a)(13)',
    columns: [['MAP UNIT', 52], ['MAP UNIT NAME', 196], ['K-FACT', 44],
              ['HYDRIC', 42], ['HYD. GRP', 48], ['DRAINAGE CLASS', 118]],
    rows: soils.map(u => [u.mapUnitSymbol, u.mapUnitName, u.kFactor ?? '—',
                          u.hydricRating ?? '—', u.hydrologicGroup ?? '—',
                          u.drainageClass ?? '—']),
    maxW, maxH,
  })
}

/**
 * STORM DRAIN SCHEDULE — the structures, the pipes and the flows they carry.
 *
 * An approved county storm drain plan carries this table; without it the sizes
 * and flows exist only inside CAD object notes, which is to say nowhere a
 * reviewer with a printed sheet can read them. Every figure comes from the
 * computed trunk — nothing is restated by hand.
 */
/**
 * TREE CANOPY SCHEDULE — Subtitle 25, Sec. 25-128.
 *
 * The canopy requirement is the reason L-100 exists, and up to now it lived
 * only in the outstanding-items list: the sheet drew trees and never said how
 * much canopy the county wants or how much these provide. A landscape plan that
 * does not carry its own arithmetic is a planting sketch.
 *
 * The REQUIREMENT is settled and is computed here — 20% of net tract area on
 * RSF-95, per Table 1. What is provided is NOT: ten-year canopy is read per
 * species out of the Prince George's County Landscape Manual, and no species
 * has been selected on this set. So the count of trees is stated, the canopy
 * they will be credited with is stated as NOT ESTABLISHED, and the schedule
 * says which document settles it. Putting a plausible number there would be
 * inventing the one figure the whole sheet is judged on.
 */
function canopySchedule(
  doc: Doc, x: number, y: number, ctx: SheetContext, maxW: number, maxH: number,
): number {
  const t = ctx.twin as unknown as {
    projectLots?: Array<{ label: string; areaSqFt?: number }>
    features?: Array<{ kind: string; id?: string; designation?: string }>
  }
  const lots = t.projectLots ?? []
  if (!lots.length) return y
  const trees = (t.features ?? []).filter(f => f.kind === 'Tree')
  // 20% of NET tract area on RSF-95, per Sec. 25-128 Table 1 as amended by
  // CB-021-2024. The 2018 Environmental Technical Manual Part D still says 15%
  // of GROSS and is superseded on both counts — see
  // docs/site-plan-reference/landscape/SOURCES.md.
  const CANOPY_PCT = 20
  const countFor = (prefixIndex: number, street: boolean) => trees.filter(f => {
    const id = String(f.id ?? '')
    if (!id.startsWith(`l${prefixIndex + 1}-`)) return false
    return /street-tree/.test(id) === street
  }).length
  // ── AND THE PER-LOT PLANTING REQUIREMENT ────────────────────────────────
  //
  // Sec. 25-128 asks for a percentage of the tract in canopy. Landscape Manual
  // Sec. 4.1(c)(1) asks for a COUNT OF TREES on each individual lot, graded by
  // lot size, and both apply. The sheet was carrying only the first, so four
  // lots that owe 3 or 4 major shade trees and 2 or 3 ornamental or evergreen
  // trees apiece were being drawn with three shade trees and no ornamentals and
  // nothing on the drawing said so.
  const tierFor = (sqFt: number) => sqFt >= 20_000 ? { shade: 4, orn: 3 }
    : sqFt >= 9_500 ? { shade: 3, orn: 2 } : { shade: 2, orn: 2 }
  const rows = lots.map((lot, i) => {
    const net = lot.areaSqFt ?? 0
    const need = tierFor(net)
    const shade = countFor(i, false)
    const short = shade < need.shade
    return [
      lot.label,
      net ? Math.round(net).toLocaleString() : '—',
      net ? Math.round(net * CANOPY_PCT / 100).toLocaleString() : '—',
      `${shade} / ${need.shade}${short ? '  SHORT' : ''}`,
      `0 / ${need.orn}  SHORT`,
      String(countFor(i, true)),
      'NOT ESTABLISHED',
    ]
  })
  const totalNet = lots.reduce((n, l) => n + (l.areaSqFt ?? 0), 0)
  const needShade = lots.reduce((n, l) => n + tierFor(l.areaSqFt ?? 0).shade, 0)
  const needOrn = lots.reduce((n, l) => n + tierFor(l.areaSqFt ?? 0).orn, 0)
  rows.push([
    // 'PROJECT TOTAL' is wider than the 60 pt LOT column and wrapped out of the
    // table and into the notes under it, despite lineBreak:false.
    'TOTAL',
    Math.round(totalNet).toLocaleString(),
    Math.round(totalNet * CANOPY_PCT / 100).toLocaleString(),
    `${trees.filter(f => !/street-tree/.test(String(f.id ?? ''))).length} / ${needShade}`,
    `0 / ${needOrn}`,
    String(trees.filter(f => /street-tree/.test(String(f.id ?? ''))).length),
    '—',
  ])
  const cy = dataTable(doc, x, y, {
    title: 'TREE CANOPY SCHEDULE',
    subtitle: `Sec. 25-128 Table 1 as amended by CB-021-2024 — ${CANOPY_PCT}% of NET tract area on `
      + 'RSF-95, met within it. Per-lot planting per Landscape Manual Sec. 4.1(c)(1). Street trees '
      + 'in the right-of-way count toward canopy under Sec. 25-129.',
    columns: [['LOT', 60], ['NET AREA SF', 68], [`CANOPY REQ ${CANOPY_PCT}% SF`, 84],
              ['SHADE PROV / REQ', 92], ['ORN-EVGN PROV / REQ', 104],
              ['STREET TREES', 66], ['10-YR CANOPY PROVIDED', 106]],
    rows,
    maxW, maxH: maxH - 42,
  })
  const notes = [
    'TEN-YEAR CANOPY IS CREDITED PER SPECIES FROM THE PRINCE GEORGE\'S COUNTY LANDSCAPE MANUAL. '
    + 'NO SPECIES HAS BEEN SELECTED ON THIS SET, SO THE CANOPY PROVIDED IS NOT ESTABLISHED AND THE '
    + 'SCHEDULE IS NOT YET BALANCED. EXISTING TREES PRESERVED ALSO COUNT.',
    'NO TREE IS PLANTED WITHIN A STORM DRAIN EASEMENT. THE 60 FT 54/55 EASEMENT CARRIES THE '
    + `${mainSizeIn(ctx)} IN RCP MAIN AND THE 10 FT REAR EASEMENT CARRIES THE DRAINAGE SWALE; `
    + 'BOTH ARE SHOWN ON THIS SHEET AND BOTH ARE EXCLUDED FROM PLANTABLE AREA.',
    'A WAIVER OF THE CANOPY REQUIREMENT IS AVAILABLE UNDER SEC. 25-130.',
    'PER-LOT PLANTING IS SHORT ON EVERY LOT AS DRAWN. LANDSCAPE MANUAL SEC. 4.1(c)(1) REQUIRES 4 '
    + 'MAJOR SHADE AND 3 ORNAMENTAL OR EVERGREEN TREES ON A LOT OF 20,000 SF OR MORE, AND 3 AND 2 '
    + 'ON A LOT OF 9,500 TO 19,999 SF. NO ORNAMENTAL OR EVERGREEN TREES ARE DRAWN. AT LEAST ONE '
    + 'SHADE TREE MUST STAND ON THE SOUTH OR WEST SIDE WITHIN 30 FT OF THE DWELLING, AND AT LEAST '
    + 'ONE REQUIRED TREE IN THE FRONT YARD. SPECIES AND FINAL LOCATIONS BY THE LANDSCAPE ARCHITECT.',
    'THE CANOPY REQUIREMENT MUST BE MET ON-SITE UNLESS A VARIANCE IS APPROVED, AND WHERE A GRADING '
    + 'PERMIT IS THE ONLY APPLICATION THE CANOPY NOTES BELONG ON THE GRADING PLAN — ENVIRONMENTAL '
    + 'TECHNICAL MANUAL PART D, SEC. 3.0.',
  ]
  let ny = cy + 4
  for (const n of notes) {
    doc.font('Helvetica').fontSize(5.4).fillColor('#555555').text(n, x, ny, { width: maxW })
    ny = doc.y + 1.5
  }
  return ny
}

/**
 * FLOODPLAIN CONCEPT — the study, on the sheet.
 *
 * A concept study for county review has to say four things and be readable
 * without an accompanying report: what the flood elevation of record is and
 * where it came from, what lies below it, what is proposed about it, and what
 * the analysis does NOT cover. The fourth is the one that gets left off, and it
 * is the one a reviewer needs most — a concept sheet that does not state its
 * own limits invites being relied on as a determination.
 */
/**
 * CROSS SECTIONS, PLOTTED.
 *
 * A section is the only view that shows depth, and on a floodplain question
 * depth is the question. FPS-770017 carries none — its own county comment says
 * so — and that omission is half of why the floodplain of record cannot be
 * relied on. Repeating it on a study drawn to replace it would be indefensible.
 *
 * Existing ground solid, proposed ground dashed, the stated flood elevation as
 * a horizontal datum line across every panel so the four lots are read against
 * one another. Vertical exaggeration is stated on the panel, because a section
 * whose exaggeration is not stated is a section that can be misread.
 */
function crossSectionPanel(
  doc: Doc, x: number, y: number, ctx: SheetContext, maxW: number, maxH: number,
): number {
  const secs = (ctx.twin as unknown as {
    crossSections?: Array<{
      lot: string; floodElFt: number
      stations: Array<{ staFt: number; existingFt: number; proposedFt: number | null }>
    }>
  }).crossSections ?? []
  if (!secs.length) return y

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000')
     .text('CROSS SECTIONS — FRONT LOT LINE TO REAR, PERPENDICULAR TO THE OVERFLOW', x, y,
           { lineBreak: false })
  let cy = y + 11
  doc.font('Helvetica').fontSize(6).fillColor('#666666')
     .text('Existing ground SOLID from county 2 ft contour mapping, NAVD88 — not a field-run '
       + 'survey. Proposed ground DASHED. The flood elevation is the FPS-770017 figure in the '
       + 'WSSC datum, plotted at its numeric value pending the tie.', x, cy, { width: maxW })
  cy = doc.y + 4

  const cols = Math.min(secs.length, 4)
  const gut = 14
  const panelW = (maxW - gut * (cols - 1)) / cols
  const panelH = Math.max(90, Math.min(190, maxH - (cy - y) - 14))

  // ONE VERTICAL SCALE ACROSS ALL PANELS. Scaled per panel, four sections of
  // different relief would each fill their box and look alike; the lot that
  // drops eleven feet has to LOOK different from the one that drops three.
  let zMin = Infinity, zMax = -Infinity, staMax = 0
  for (const sec of secs) {
    for (const st of sec.stations) {
      zMin = Math.min(zMin, st.existingFt, st.proposedFt ?? st.existingFt)
      zMax = Math.max(zMax, st.existingFt, st.proposedFt ?? st.existingFt, sec.floodElFt)
      staMax = Math.max(staMax, st.staFt)
    }
  }
  zMin = Math.floor((zMin - 2) / 2) * 2
  zMax = Math.ceil((zMax + 2) / 2) * 2
  const zSpan = Math.max(1, zMax - zMin)

  secs.slice(0, cols).forEach((sec, i) => {
    const px = x + i * (panelW + gut)
    const py = cy
    const plotH = panelH - 22
    const X = (sta: number) => px + (sta / Math.max(1, staMax)) * panelW
    const Y = (z: number) => py + plotH - ((z - zMin) / zSpan) * plotH
    doc.save().lineWidth(0.5).strokeColor('#000000').rect(px, py, panelW, plotH).stroke().restore()
    // Elevation grid at 2 ft, lettered on the first panel only.
    for (let z = zMin; z <= zMax; z += 2) {
      doc.save().lineWidth(0.2).strokeColor('#dddddd')
         .moveTo(px, Y(z)).lineTo(px + panelW, Y(z)).stroke().restore()
      if (i === 0) {
        doc.font('Helvetica').fontSize(4.6).fillColor('#777777')
           .text(String(z), px - 13, Y(z) - 2, { width: 11, align: 'right', lineBreak: false })
      }
    }
    // The flood elevation, across every panel at the same height.
    doc.save().lineWidth(1.1).strokeColor('#1565c0').dash(7, { space: 3 })
       .moveTo(px, Y(sec.floodElFt)).lineTo(px + panelW, Y(sec.floodElFt)).stroke()
       .undash().restore()
    const line = (key: 'existingFt' | 'proposedFt', pen: Pen) => {
      const pts: [number, number][] = []
      for (const st of sec.stations) {
        const z = key === 'existingFt' ? st.existingFt : st.proposedFt
        if (z == null) continue
        pts.push([X(st.staFt), Y(z)])
      }
      if (pts.length >= 2) polyline(doc, pts, pen, false)
    }
    line('proposedFt', { width: 0.9, color: '#a5261b', dash: [4, 2] })
    line('existingFt', { width: 1.1, color: '#7a5c2e', dash: undefined })
    doc.font('Helvetica-Bold').fontSize(6).fillColor('#000000')
       .text(sec.lot, px, py + plotH + 3, { width: panelW, align: 'center', lineBreak: false })
    const depth = Math.max(0, sec.floodElFt - Math.min(...sec.stations.map(t2 => t2.existingFt)))
    doc.font('Helvetica').fontSize(5).fillColor('#1565c0')
       .text(`max ${depth.toFixed(1)} ft below EL ${sec.floodElFt.toFixed(0)}`,
             px, py + plotH + 11, { width: panelW, align: 'center', lineBreak: false })
  })
  cy += panelH
  const vx = (panelH - 22) / Math.max(1, zSpan)
  const hx = panelW / Math.max(1, staMax)
  doc.font('Helvetica').fontSize(5).fillColor('#666666')
     .text(`Horizontal 1" = ${(72 / hx).toFixed(0)}' · vertical 1" = ${(72 / vx).toFixed(0)}' · `
       + `vertical exaggeration ${(vx / hx).toFixed(1)}x. Stations at 5 ft from the front lot line.`,
       x, cy + 2, { width: maxW })
  return doc.y + 2
}

/**
 * The floodplain concept findings, as printed on FP-100.
 *
 * Held here rather than inside a drawing function because two blocks need the
 * same text — the column prints it and the band's table is sized around it —
 * and a study whose findings differ between two places on one sheet is worse
 * than one that states them once.
 */
function floodplainConceptNotesText(ctx: SheetContext): [string, string][] {
  return [

    ['HOW TO READ THE TWO LIMIT LINES',
      'THE DASH-DOT LINE IS THE STATED FLOOD ELEVATION CUT THROUGH EXISTING GROUND. THE FINER '
      + 'SOLID LINE IS THE SAME ELEVATION CUT THROUGH THE PROPOSED REGRADED SURFACE. TICKS ON THE '
      + 'WET SIDE OF BOTH. THE ELEVATION DOES NOT MOVE BETWEEN THEM — ONLY THE GROUND DOES, AND '
      + 'THE DIFFERENCE IS THE FLOODPLAIN IMPACT OF THE GRADING. A LOT LYING WHOLLY BELOW THE '
      + 'ELEVATION IN A GIVEN CONDITION CARRIES NO LINE FOR IT, BECAUSE THERE IS NO CROSSING TO '
      + 'DRAW — LOT 54 IS 100% BELOW EXISTING AND HAS NONE. READ THE TABLE, NOT THE ABSENCE OF A '
      + 'LINE.'],
    ['NEITHER LINE IS A DELINEATION',
      'BOTH ARE A STATED ELEVATION CUT THROUGH A SURFACE BUILT FROM COUNTY 2 FT LIDAR CONTOUR '
      + 'MAPPING. A DELINEATION UNDER DPIE SUBMITTAL ITEMS 18 AND 19 REQUIRES HYDRAULIC MODELLING '
      + 'ON FIELD-RUN CROSS SECTIONS, TIED TO A DATUM, SEALED BY A LICENSED PROFESSIONAL ENGINEER '
      + 'AND APPROVED BY THE COUNTY. THESE ARE THE EXHIBITS THAT SCOPE THAT WORK, NOT A SUBSTITUTE '
      + 'FOR IT.'],
    ['MITIGATION CONCEPT — RECOMMENDED',
      '1. TIE BENCHMARKS H31A (61.09), H32A (74.37), H32B (66.41) TO NAVD88 AND ESTABLISH THE WSSC '
      + 'OFFSET. EVERY VOLUME BELOW IS SIZED OFF IT.  '
      + `2. EXTEND THE EXISTING FORT FOOTE ROAD CULVERT WITH ${mainSizeIn(ctx)} IN RCP CL IV, `
      + '162 FT, WITHIN THE '
      + 'RECORDED 60 FT STORM DRAIN EASEMENT ON THE LOT 54 / LOT 55 PARTY LINE, AND ENLARGE OR '
      + 'REPLACE THE INLET. THE EXISTING 36 IN RUNS AT 104% OF CAPACITY AT Q10 ON 39.1 AC; THE '
      + `${mainSizeIn(ctx)} IN CARRIES ${mainSizeIn(ctx) >= 48 ? '149.3' : '104.6'} CFS AGAINST A `
      + '100-YEAR DEMAND OF 94.9 CFS, AND AT 48 IN CONTROL PASSES FROM THE INLET TO THE OUTLET — '
      + 'THE POINT AT WHICH THE BARREL IS ACTUALLY BEING USED. THIS IS THE ONLY MEASURE '
      + 'THAT CAN LOWER THE WATER SURFACE RATHER THAN DISPLACE IT.  '
      + '3. RAISE THE LOT 54 AND LOT 55 PADS 3.0 FT — APPROXIMATELY 1,000 CY.  '
      + '4. SLAB-ON-GRADE OR VENTED CRAWLSPACE ON LOTS 54 AND 55; NO HABITABLE SPACE BELOW THE '
      + 'FLOOD ELEVATION.  '
      + '5. COMPENSATORY STORAGE CUT FROM THE REAR OF LOTS 54 AND 55.  '
      + '6. LEAVE THE REAR OVERFLOW CORRIDOR AT EXISTING GRADE.  '
      + '7. RESOLVE THE FLOODPLAIN EASEMENT ON LOTS 53 AND 54.'],
    ['BLANKET FILL WAS CONSIDERED AND IS NOT RECOMMENDED',
      'FILLING THE TRACT TO EL 58 IS 19,212 CY AND TO EL 60 IS 24,062 CY — FOUR TO FIVE TIMES THE '
      + 'ENTIRE PROJECT EARTHWORK. IT WOULD FILL THE OVERFLOW SWALE THAT FPS-770017 RECORDS RUNNING '
      + 'WITH THE STORM DRAIN EASEMENT ACROSS THE REAR OF LOTS 50 TO 53, WHICH IS CONVEYANCE AND '
      + 'NOT MERELY STORAGE, AND WOULD REQUIRE COMPENSATORY STORAGE THERE IS NO ROOM FOR ON A '
      + '1.7 AC TRACT. GRADING DOES NOT LOWER A FLOOD ELEVATION; IT RAISES THE GROUND AND MOVES '
      + 'THE WATER.'],
    ['FEMA STATUS',
      'ALL FOUR LOTS ARE ZONE X, AREA OF MINIMAL FLOOD HAZARD, OUTSIDE THE SFHA, WITH NO PUBLISHED '
      + 'BASE FLOOD ELEVATION — FEMA NFHL QUERIED 2026-09-10 AT EACH ADDRESS POINT AND OVER THE '
      + 'WHOLE TRACT. FIRM PANEL 24033C0220E, EFFECTIVE 2016-09-16. THE EXPOSURE ON THIS SITE IS '
      + "THE COUNTY'S OWN FLOODPLAIN OF RECORD, NOT FEMA'S."],
    ['LIMITS OF THIS ANALYSIS — READ BEFORE RELYING ON THIS SHEET',
      'THIS IS A CONCEPT STUDY. IT IS NOT A FLOODPLAIN DELINEATION, NOT A NO-RISE CERTIFICATION '
      + 'AND NOT A DETERMINATION. EXISTING GRADE IS COUNTY 2 FT LIDAR CONTOUR MAPPING, NOT A '
      + 'FIELD-RUN SURVEY. THE EL LINE IS DRAWN AT THE NUMERIC VALUE OF A WSSC-DATUM ELEVATION ON '
      + 'AN NAVD88 SURFACE AND ITS TRUE POSITION DEPENDS ON A TIE NOT YET MADE — NOTE THAT FORT '
      + 'FOOTE ROAD ITSELF READS EL 54.0 NAVD88 AT LOTS 54 AND 55, BELOW THE STATED ELEVATION, '
      + 'WHICH INDICATES THE OFFSET IS MATERIAL. FPS-770017 CARRIES NO CROSS SECTIONS AND ITS '
      + 'CONTROLLING REVISION FPS 960004 IS NOT IN THE RECORD. HYDRAULICS SHOWN ARE RATIONAL '
      + 'METHOD AND MANNING FOR CONVEYANCE SIZING — NO BACKWATER, NO WATER-SURFACE PROFILE, NO '
      + 'HEC-RAS. EXCLUDED UNLESS SEPARATELY AUTHORISED: NEW TOPOGRAPHIC OR BOUNDARY SURVEY, FEMA '
      + 'CLOMR OR LOMR, FULL FLOODPLAIN STUDY, DETAILED HEC-RAS MODELING, GEOTECHNICAL OR '
      + 'INFILTRATION TESTING, WETLAND DELINEATION, FINAL SWM DESIGN, FINAL SEDIMENT AND EROSION '
      + 'CONTROL, CONSTRUCTION DOCUMENTS, UTILITY RELOCATION, CONSTRUCTION COST, AGENCY FEES, MORE '
      + 'THAN ONE REVISION CYCLE, AND ANY GUARANTEE THAT THE LOTS WILL BE REMOVED FROM THE '
      + 'FLOODPLAIN.'],
    ['CONCLUSION',
      'FEASIBLE WITH MODIFICATIONS, SUBJECT TO TWO VERIFICATION GATES — (1) THE DATUM TIE, AND '
      + '(2) A NO-RISE DEMONSTRATION FOR THE CULVERT UPGRADE AND THE PAD FILL. IF GATE 2 CANNOT BE '
      + 'MET, THE FALLBACK IS TO RAISE THE FLOORS AND PLACE NO FILL BELOW THE FLOOD ELEVATION. THE '
      + 'FLOODPLAIN EASEMENT QUESTION ON LOTS 53 AND 54 IS INDEPENDENT OF THE HYDRAULICS AND MAY '
      + 'GOVERN REGARDLESS.'],
  ]
}

/** The main's barrel size, read from the model rather than typed into prose. */
function mainSizeIn(ctx: SheetContext): number {
  const ep = (ctx.twin as unknown as {
    stormTrunk?: { easementPipe5455?: { sizeIn?: number } }
  }).stormTrunk?.easementPipe5455
  return Number(ep?.sizeIn ?? 42)
}

function floodplainConcept(
  doc: Doc, x: number, y: number, ctx: SheetContext, maxW: number, maxH: number,
): number {
  const t = ctx.twin as unknown as {
    projectLots?: Array<{ label: string; areaSqFt?: number }>
    features?: Array<{ kind: string; id?: string; attributes?: Record<string, unknown> }>
  }
  const lots = t.projectLots ?? []
  const feats = (t.features ?? []).filter(f => f.kind === 'Floodplain')
  const elFt = Number((feats[0]?.attributes as { elevationFt?: number } | undefined)?.elevationFt ?? 57)
  const statFor = (i: number) => {
    const tag = `lot${['53', '54', '55', '56'][i]}`
    const pick = (cond: string) => feats.find(q => String(q.id ?? '').includes(`-${tag}-`)
      && String((q.attributes as { condition?: string } | undefined)?.condition ?? 'existing') === cond)
    const ex = (pick('existing')?.attributes ?? {}) as
      { pctLotBelow?: number; areaBelowSqFt?: number; areaBelowProposedSqFt?: number }
    const pr = (pick('proposed')?.attributes ?? {}) as
      { pctLotBelow?: number; areaBelowSqFt?: number; areaBelowExistingSqFt?: number }
    // A lot wholly below the elevation throws no limit line in that condition,
    // so its figures survive on the OTHER condition's feature. Either carries
    // both numbers for exactly this reason.
    return {
      pctEx: ex.pctLotBelow,
      areaEx: ex.areaBelowSqFt ?? pr.areaBelowExistingSqFt,
      pctPr: pr.pctLotBelow,
      areaPr: pr.areaBelowSqFt ?? ex.areaBelowProposedSqFt,
    }
  }
  const buildings = (t.features ?? []).filter(f => f.kind === 'Building')
  const ffFor = (i: number) => {
    const b = buildings.find(q => String(q.id ?? '').startsWith(`l${i + 1}-`))
    const a = (b?.attributes ?? {}) as { finishedFloorElevFt?: number; basementElevFt?: number }
    return a
  }
  const rows = lots.map((lot, i) => {
    const st = statFor(i)
    const ff = ffFor(i)
    const f = ff.finishedFloorElevFt
    const lift = f == null ? null : Math.max(0, elFt + 1.5 - (f - 0.5))
    const delta = st.areaEx != null && st.areaPr != null ? st.areaPr - st.areaEx : null
    return [
      lot.label,
      lot.areaSqFt ? Math.round(lot.areaSqFt).toLocaleString() : '—',
      st.areaEx != null ? st.areaEx.toLocaleString() : '—',
      st.areaPr != null ? st.areaPr.toLocaleString() : '—',
      delta == null ? '—' : `${delta >= 0 ? '+' : ''}${delta.toLocaleString()}`,
      f == null ? '—' : f.toFixed(2),
      f == null ? '—' : `${(f - elFt >= 0 ? '+' : '')}${(f - elFt).toFixed(2)}`,
      ff.basementElevFt == null ? '—' : ff.basementElevFt.toFixed(2),
      lift == null ? '—' : (lift > 0.05 ? `${lift.toFixed(1)} ft` : 'none'),
    ]
  })
  let cy = dataTable(doc, x, y, {
    title: 'FLOODPLAIN — EXISTING AND PROPOSED DELINEATION, AND IMPACT BY LOT',
    subtitle: `Flood elevation of record EL ${elFt.toFixed(0)} ft, FPS-770017 (PG County DPW&T, `
      + '16 July 1979) — stated IN THE WSSC DATUM. Design elevations are NAVD88. THE TWO ARE NOT '
      + 'TIED. Lift is to EL + 1.5 ft freeboard.',
    columns: [['LOT', 50], ['LOT AREA SF', 64],
              [`BELOW EL ${elFt.toFixed(0)} — EXISTING SF`, 96],
              [`BELOW EL ${elFt.toFixed(0)} — PROPOSED SF`, 96], ['CHANGE SF', 60],
              ['FIN FLOOR', 56], [`FF vs EL ${elFt.toFixed(0)}`, 58],
              ['BASEMENT', 56], ['PAD LIFT REQ', 62]],
    rows,
    // BUDGETED FOR THE SUBTITLE. The citation here runs to three lines, and
    // `dataTable` grows its header to fit it — so a budget computed from the
    // row count alone left room for three lots out of four and silently
    // dropped LOT 56. The header allowance is counted in.
    maxW, maxH: Math.min(40 + 11 * (rows.length + 2), maxH - 86),
  })

  const notes: [string, string][] = floodplainConceptNotesText(ctx)
  // THE NOTES ARE NOT IN THIS BAND ANY MORE — see `floodplainConceptNotes`.
  //
  // Keeping them here forced the table band to 470 pt to hold them, which took
  // 270 pt off the drawing, which took the room the label placer needs: one
  // REQUIRED label overprinted and seven were dropped. Prose belongs in the
  // right-hand column, which is tall and empty; the bottom band keeps the
  // table and the sections, which have to be wide.
  void notes
  return cy
}

/**
 * The concept notes, set in the right-hand data column.
 *
 * Same text, better place. The column is 7 in wide and full height, it is where
 * a reviewer already reads the site data and the general notes, and putting the
 * prose there leaves the bottom band for the two things that genuinely need the
 * full sheet width — the impact table and the cross sections.
 */
function floodplainConceptNotes(
  doc: Doc, x: number, y: number, w: number, ctx: SheetContext,
): number {
  const notes: [string, string][] = floodplainConceptNotesText(ctx)
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000')
     .text('FLOODPLAIN CONCEPT — FINDINGS AND LIMITS', x, y, { lineBreak: false })
  let cy = y + 12
  for (const [head, body] of notes) {
    doc.font('Helvetica-Bold').fontSize(6.4).fillColor('#000000').text(head, x, cy, { width: w })
    cy = doc.y + 1
    doc.font('Helvetica').fontSize(5.8).fillColor('#333333').text(body, x, cy, { width: w })
    cy = doc.y + 5
  }
  return cy
}

function stormDrainSchedule(
  doc: Doc, x: number, y: number, ctx: SheetContext, maxW: number, maxH: number,
): number {
  const trunk = (ctx.twin as { stormTrunk?: {
    totalDaAc?: number; q10AtOutfall?: number; q100AtOutfall?: number
    outfallEl?: number
    easementPipe5455?: { sizeIn: number; material: string; pipeClass: string; lengthFt: number }
    structures?: { id: string; lot: string | null; gradeEl: number; type: string }[]
  } }).stormTrunk
  const swale = (ctx.twin as { swaleDesign?: { reaches?: {
    fromId: string; toId: string; lengthFt: number; daCumAc: number
    q10Cfs: number; q100Cfs: number; slopePct: number
    depth100Ft: number; velocity100Fps: number; sectionWidthFt: number
    invertUpFt?: number; invertDownFt?: number; cutUpFt?: number; cutDownFt?: number
    section: { bottomWidthFt: number; sideSlopeZ: number; manningN: number }
  }[] } }).swaleDesign
  const reaches = swale?.reaches ?? []
  if (!reaches.length && !trunk?.easementPipe5455) return y

  const SUMMARY_H = 34
  let cy = y
  if (reaches.length) {
    const sec = reaches[0].section
    cy = dataTable(doc, x, y, {
      title: 'DRAINAGE SWALE SCHEDULE',
      subtitle: `Rational method, NOAA Atlas 14 · Manning n = ${sec.manningN}, `
        + `${sec.bottomWidthFt}' bottom, ${sec.sideSlopeZ}:1 sides`,
      // INVERT IN AND INVERT OUT ARE THE COLUMNS THAT MAKE THIS BUILDABLE.
      //
      // The schedule carried grade in percent and no elevation, which is a
      // hydraulic summary rather than a construction schedule — the approved
      // county storm drain plans this set is drawn against carry an invert at
      // each end of every run, and a swale is staked exactly the way a pipe is.
      // The depth of cut goes with them, because an invert nobody can reach
      // without excavating four feet of somebody's lawn is a different job.
      columns: [['REACH', 56], ['LENGTH', 38], ['GRADE', 38], ['D.A. (AC)', 44],
                ['Q10 (CFS)', 42], ['Q100 (CFS)', 46], ['DEPTH', 36],
                ['V100 (FPS)', 44], ['INV IN', 44], ['INV OUT', 46], ['CUT', 36]],
      rows: reaches.map(r => [
        `${r.fromId} — ${r.toId}`, `${r.lengthFt.toFixed(0)}'`, `${r.slopePct.toFixed(2)}%`,
        r.daCumAc.toFixed(4), r.q10Cfs.toFixed(2), r.q100Cfs.toFixed(2),
        `${r.depth100Ft.toFixed(2)}'`, r.velocity100Fps.toFixed(2),
        r.invertUpFt == null ? '—' : r.invertUpFt.toFixed(2),
        r.invertDownFt == null ? '—' : r.invertDownFt.toFixed(2),
        r.cutDownFt == null ? '—' : `${r.cutDownFt.toFixed(1)}'`,
      ]),
      maxW, maxH: Math.min(12 + 11 * (reaches.length + 1), maxH - SUMMARY_H),
    })
  }

  const strs = trunk?.structures ?? []
  if (strs.length) {
    cy = dataTable(doc, x, cy + 8, {
      // GROUND AND INVERT ARE TWO DIFFERENT ELEVATIONS.
      //
      // This column was headed GRADE, filled with the structure's GROUND
      // elevation, and described as "swale grade break / invert control" — so
      // the one number on the sheet a builder would have set the swale bottom
      // to was the elevation of the lawn above it. They are separated here and
      // both are printed.
      title: 'GRADE CONTROL SCHEDULE',
      columns: [['POINT', 44], ['LOT', 44], ['DESCRIPTION', 168],
                ['GROUND', 48], ['SWALE INV', 48]],
      rows: strs.map(st => {
        const at = reaches.find(r => r.fromId === st.id)?.invertUpFt
          ?? reaches.find(r => r.toId === st.id)?.invertDownFt
        return [st.id, st.lot ? `LOT ${st.lot}` : '—',
                'Swale grade break / invert control',
                st.gradeEl.toFixed(2), at == null ? '—' : at.toFixed(2)]
      }),
      maxW, maxH: Math.max(0, y + maxH - SUMMARY_H - (cy + 8)),
    })
  }

  const ep = trunk?.easementPipe5455
  const worst = reaches.length
    ? reaches.reduce((a, b) => a.velocity100Fps > b.velocity100Fps ? a : b)
    : null
  const lines = [
    `SYSTEM AT THE LOW POINT: ${(trunk?.totalDaAc ?? 0).toFixed(4)} AC, `
      + `Q10 ${(trunk?.q10AtOutfall ?? 0).toFixed(2)} CFS, `
      + `Q100 ${(trunk?.q100AtOutfall ?? 0).toFixed(2)} CFS.`,
    worst
      ? `MAX VELOCITY ${worst.velocity100Fps.toFixed(2)} FPS AT Q100 — WITHIN THE 5 FPS `
        + 'PERMISSIBLE FOR ESTABLISHED GRASS. 0.5 FT FREEBOARD THROUGHOUT.'
      : '',
    ep
      ? `THE SWALE DISCHARGES TO THE RECORDED 54/55 STORM DRAIN EASEMENT, ALONGSIDE THE `
        + `${ep.sizeIn}" ${ep.material} ${ep.pipeClass} EXTENDING THE FORT FOOTE ROAD CULVERT INLET.`
      : '',
    ep
      ? `THAT MAIN IS BURIED: OD ${((ep.sizeIn + 8) / 12).toFixed(2)} FT, 1.5 FT MIN COVER OVER `
        + `THE CROWN — FINISHED GRADE OVER IT SHALL BE NO LOWER THAN INVERT + `
        + `${((ep.sizeIn + 8) / 12 + 1.5).toFixed(2)} FT. FILL WHERE EXISTING GROUND IS LOWER.`
      : '',
    'SWALE GRADES AND INVERTS TO BE SET FROM THE FIELD-RUN TOPOGRAPHIC SURVEY. '
      + 'ESTABLISH SOD BEFORE THE CONTRIBUTING AREA IS STABILISED.',
    (() => {
      const ew = (ctx.twin as { earthwork?: {
        cutCubicYd: number; fillCubicYd: number; netCubicYd: number; gradedAreaSqFt: number
      } }).earthwork
      return ew
        ? `EARTHWORK: ${ew.cutCubicYd.toLocaleString()} CY CUT, `
          + `${ew.fillCubicYd.toLocaleString()} CY FILL, NET `
          + `${Math.abs(ew.netCubicYd).toLocaleString()} CY `
          + `${ew.netCubicYd >= 0 ? 'IMPORT' : 'EXPORT'} OVER `
          + `${ew.gradedAreaSqFt.toLocaleString()} SQ FT REGRADED. GRID SUMMATION AT 6 FT ON `
          + 'COUNTY 2 FT CONTOUR MAPPING; CONFIRM AGAINST THE FIELD-RUN SURVEY.'
        : ''
    })(),
  ].filter(Boolean)
  cy += 3
  for (const ln of lines) {
    if (cy > y + maxH - 8) break
    doc.font('Helvetica').fontSize(6.5).fillColor('#333333').text(ln, x, cy, { width: maxW })
    cy = doc.y + 1
  }
  return cy
}

/** Legend — a reviewer must not have to guess what a line means. */
function legend(doc: Doc, x: number, y: number): number {
  // EVERY SWATCH IS THE PEN THE DRAWING USES.
  //
  // The swatches were all stroked at 1.1 pt with a single 3/2 dash, so a
  // legend entry did not look like the line it named — and EASEMENT was drawn
  // here in #2980b9 while the sheet draws easements in #6a1b9a, a blue key for
  // a purple line. The three services were not listed at all, which is the one
  // set a reader most needs now that they are told apart by WEIGHT and DASH
  // rather than by hue: the key has to show that difference to be usable on a
  // mono plot.
  type Row = { color: string; label: string; width: number; dash?: number[] }
  const rows: Row[] = [
    { color: '#000000', label: 'PROPERTY BOUNDARY', width: 2.0 },
    { color: '#7f8c8d', label: 'BRL — BUILDING RESTRICTION LINE', width: 0.8, dash: [7, 4] },
    { color: '#a5261b', label: 'PROPOSED STRUCTURE', width: 1.4 },
    // The plan names the DATUM and the interval, not the software the data
    // came from. A source system is provenance for the file, not information
    // for a builder or a reviewer, and it does not belong on a sheet.
    { color: '#7a5c2e', label: 'EXISTING CONTOUR — 2 FT INTERVAL, NAVD88', width: 0.6, dash: [6, 3] },
    { color: '#000000', label: 'PROPOSED CONTOUR — 2 FT INTERVAL', width: 1.8 },
    { color: '#555555', label: 'STREET CENTRELINE', width: 0.6, dash: [9, 3, 2, 3] },
    { color: '#666666', label: 'PROPOSED PAVEMENT — DRIVEWAY / WALK', width: 1.0 },
    { color: '#6a1b9a', label: 'EASEMENT', width: 1.2, dash: [16, 3, 3, 3] },
    { color: '#2e7d32', label: 'SANITARY LATERAL (SHC) — HEAVIEST', width: 1.35,
      dash: [16, 3, 2, 3, 2, 3] },
    { color: '#1565c0', label: 'WATER SERVICE (WHC)', width: 0.85, dash: [14, 5] },
    { color: '#00695c', label: 'STORM DRAIN — TRUNK, RCP', width: 2.1 },
    { color: '#00695c', label: 'STORM — HOUSE CONNECTION TO TRUNK', width: 1.25, dash: [9, 3] },
    { color: '#2e7d32', label: 'DRAINAGE SWALE — INVERT AND GRADED SECTION', width: 1.0 },
    { color: '#000000', label: 'RETAINING WALL — TICKS ON THE RETAINED SIDE', width: 2.0 },
    { color: '#c2185b', label: 'LIMIT OF GROUND COVER — TICKS ON THE STEEP SIDE', width: 0.8,
      dash: [6, 2] },
    { color: '#1565c0', width: 1.6, dash: [12, 3],
      label: '100-YR FLOODPLAIN LIMIT, EXISTING GROUND — FPS-770017, WSSC DATUM, UNTIED' },
    { color: '#0d47a1', width: 1.2,
      label: '100-YR FLOODPLAIN LIMIT, PROPOSED GROUND — SAME ELEVATION, REGRADED SURFACE' },
    { color: '#227744', label: 'ESD — STORMWATER PRACTICE', width: 1.2 },
  ]
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000').text('LEGEND', x, y, { lineBreak: false })
  let cy = y + 11
  for (const r of rows) {
    doc.save().lineWidth(r.width).strokeColor(r.color)
    if (r.dash) doc.dash(r.dash[0], { space: r.dash[1] ?? r.dash[0] })
    doc.moveTo(x, cy + 3).lineTo(x + 26, cy + 3).stroke()
    doc.undash().restore()
    doc.font('Helvetica').fontSize(7.5).fillColor('#333333')
       .text(r.label, x + 32, cy, { lineBreak: false })
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
/**
 * The cover plate — what stands in the drawing area of C-000.
 *
 * A cover sheet's job is to say what the set is, what is in it, who is
 * responsible for each part and what has been approved. It is the one page a
 * reviewer reads before anything else, and it is the one page that must not
 * carry a drawing, because a drawing on it invites the reader to start
 * reviewing before they know what they are reviewing.
 */
function coverPlate(doc: Doc, ctx: SheetContext, vp: Viewport, sheet: SheetSize): void {
  const x = vp.originX
  const y = vp.originY
  const w = vp.drawWidthPt
  const h = vp.drawHeightPt

  label(doc, x + 24, y + 40, 'SITE DEVELOPMENT PLANS', 30, { bold: true })
  label(doc, x + 24, y + 78, ctx.projectName.toUpperCase(), 17)
  const lotAddresses = ((ctx.twin as unknown as {
    projectLots?: Array<{ address?: string }>
  }).projectLots ?? []).map(l => l.address).filter((a): a is string => Boolean(a))
  label(doc, x + 24, y + 102, lotAddresses.length ? lotAddresses.join('   ·   ') : ctx.twin.address, 11)
  label(doc, x + 24, y + 120, jurisdictionName(ctx.twin.jurisdictionCode), 11)
  doc.save().lineWidth(1.4).strokeColor('#000000')
    .moveTo(x + 24, y + 140).lineTo(x + w - 24, y + 140).stroke().restore()

  // ── SHEET INDEX ─────────────────────────────────────────────────────────
  const ids = ((ctx as unknown as { sheetIds?: SheetId[] }).sheetIds ?? [ctx.sheet])
  let cy = y + 164
  label(doc, x + 24, cy, 'INDEX OF DRAWINGS', 11, { bold: true })
  cy += 18
  label(doc, x + 24, cy, 'SHEET', 7, { color: '#666666' })
  label(doc, x + 92, cy, 'TITLE', 7, { color: '#666666' })
  label(doc, x + w * 0.62, cy, 'LEAD DISCIPLINE', 7, { color: '#666666' })
  cy += 10
  doc.save().lineWidth(0.6).strokeColor('#999999')
    .moveTo(x + 24, cy).lineTo(x + w - 24, cy).stroke().restore()
  cy += 8
  for (const id of ids) {
    label(doc, x + 24, cy, id, 9, { bold: true })
    label(doc, x + 92, cy, SHEET_TITLES[id] ?? '', 9)
    label(doc, x + w * 0.62, cy, SHEET_DISCIPLINE[id] ?? '', 8, { color: '#444444' })
    cy += 14
  }

  // ── VICINITY ────────────────────────────────────────────────────────────
  const vx = x + w * 0.66
  const vy = y + 164
  const vw = w * 0.3
  const vh = 210
  box(doc, vx, vy, vw, vh, PEN.frame)
  label(doc, vx + 8, vy + 8, 'VICINITY MAP', 8, { bold: true })
  const par = (ctx.twin.features ?? []).filter(f => f.kind === 'Parcel')
  if (par.length) {
    const pts: number[][] = []
    for (const f of par) {
      const r = (f as unknown as { ring?: { coordinates?: number[][] } }).ring?.coordinates
      if (r) pts.push(...r)
    }
    if (pts.length) {
      const xs = pts.map(p => p[0]); const ys = pts.map(p => p[1])
      const x0 = Math.min(...xs) - 900, x1 = Math.max(...xs) + 900
      const y0 = Math.min(...ys) - 900, y1 = Math.max(...ys) + 900
      const s = Math.min((vw - 20) / (x1 - x0), (vh - 40) / (y1 - y0))
      const ox = vx + 10 + ((vw - 20) - (x1 - x0) * s) / 2
      const oy = vy + 28 + ((vh - 40) - (y1 - y0) * s) / 2
      const T = (p: number[]): [number, number] => [ox + (p[0] - x0) * s, oy + (y1 - p[1]) * s]
      for (const f of ctx.twin.features ?? []) {
        if (f.kind !== 'ExistingFeature') continue
        const ln = (f as unknown as { line?: number[][] }).line
        if (ln && ln.length > 1) {
          doc.save().lineWidth(0.4).strokeColor('#bbbbbb')
          const a = T(ln[0]); doc.moveTo(a[0], a[1])
          for (const q of ln.slice(1)) { const t = T(q); doc.lineTo(t[0], t[1]) }
          doc.stroke().restore()
        }
      }
      for (const f of par) {
        const r = (f as unknown as { ring?: { coordinates?: number[][] } }).ring?.coordinates
        if (!r) continue
        doc.save().lineWidth(1.1).strokeColor('#b71c1c')
        const a = T(r[0]); doc.moveTo(a[0], a[1])
        for (const q of r.slice(1)) { const t = T(q); doc.lineTo(t[0], t[1]) }
        doc.closePath().stroke().restore()
      }
      label(doc, vx + 8, vy + vh - 14, 'SUBJECT PROPERTY SHOWN IN RED. NOT TO SCALE.', 6, { color: '#666666' })
    }
  }

  // ── RESPONSIBILITY AND STATUS ───────────────────────────────────────────
  const ry = vy + vh + 16
  box(doc, vx, ry, vw, 132, PEN.frame)
  label(doc, vx + 8, ry + 8, 'STATUS OF THIS SET', 8, { bold: true })
  doc.save().fontSize(7.6).font('Helvetica').fillColor('#b71c1c')
    .text('PRELIMINARY. NOT FOR CONSTRUCTION. NOT RELEASED FOR PERMIT. '
      + 'No sheet in this set bears a professional seal. Each discipline '
      + 'certifies only the subjects and objects within its own scope; see the '
      + 'divided responsibility block on each sheet.',
      vx + 8, ry + 22, { width: vw - 16 })
  doc.restore()
  label(doc, vx + 8, ry + 104, 'Issued ' + new Date().toISOString().slice(0, 10), 7, { color: '#666666' })
}

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
      // THE DETAIL BAND IS RESERVED BEFORE THE PLAN IS FITTED.
      //
      // It was given whatever height the drawing happened to leave, and then a
      // minimum-height guard dropped the details entirely when that was too
      // little — so asking for them to be LARGER removed them. Reserving the
      // band first means the plan is fitted into what remains and the county
      // sections are always on the sheet at a size that can be read.
      // ── PLAN ONLY ────────────────────────────────────────────────────────
      //
      // PLAN_ONLY=1 renders the DRAWING and nothing else: no title block, no
      // data column, no schedules, no county details, no certificate. The whole
      // sheet becomes drawing area and the plan is refitted to it, so it is not
      // the usual sheet with the furniture erased — it is plotted larger.
      //
      // What stays is the north arrow, the graphic scale and the status. A plan
      // with no orientation and no scale cannot be measured off, and one with
      // no status invites being read as issued. Those three are the drawing's
      // own, not the title block's.
      const planOnly = process.env.PLAN_ONLY === '1'
      // THE CONCEPT SHEET TRADES THE DETAILS FOR ITS OWN TEXT.
      //
      // DPW&T curb-and-gutter and sidewalk-ramp standards are not what a
      // floodplain concept study is read for, and the band they occupy is
      // exactly what the study's findings and limits need. The clamp reported
      // that the LIMITS OF THIS ANALYSIS note — the one paragraph a concept
      // sheet must never be missing — would not fit; this is where the room
      // comes from.
      // SECTIONS AND DETAILS BOTH STAY. Dropping the county standard details to
      // make room for the concept text was the wrong trade and it was made
      // once, under a brief that asked for a bare plan. A submission sheet
      // carries its sections and it carries the standards it is built to; the
      // concept sheet gets a deeper table band for its own content INSTEAD of
      // taking the details' room.
      const conceptSheet = ctx.sheet === 'FP-100'
      const DETAILS_BAND_PT = planOnly ? 0 : 430
      /** Reserved for the schedules and, on the concept sheet, the sections. */
      const TABLES_BAND_PT = planOnly ? 0 : conceptSheet ? 300 : 200
      const titleColW = planOnly ? 0 : sheetSize.titleBlockWidthPt
      const planSheet: SheetSize = {
        ...sheetSize,
        titleBlockWidthPt: titleColW,
        heightPt: sheetSize.heightPt - DETAILS_BAND_PT - TABLES_BAND_PT,
      }
      const vp = fitViewport(b, planSheet, PAD_FT)
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
      const clipW = sheetSize.widthPt - sheetSize.marginPt * 2 - titleColW
      const clipH = sheetSize.heightPt - sheetSize.marginPt * 2
      doc.save()
      doc.rect(clipX, clipY, clipW, clipH).clip()
      // ── NOTHING LEAVES THE DRAWING ──────────────────────────────────────
      //
      // The viewport is already shortened to sit above the table and detail
      // bands, but nothing was enforcing it: geometry projected outside the
      // frame was simply drawn there, so adjoining lot lines ran down across
      // the tree canopy schedule and the county standard details. A drawing
      // frame that only advises is not a frame.
      doc.save()
      doc.rect(vp.originX, vp.originY, vp.drawWidthPt, vp.drawHeightPt).clip()
      // ── A COVER SHEET CARRIES NO PLAN ──────────────────────────────────
      //
      // C-000 is the cover: index, approvals, general notes, vicinity map and
      // the plat record. It was drawing the site plan as well, so the first
      // page of a set was a fourth copy of a drawing that appears, properly
      // titled, three more times behind it. A reviewer opening the set met the
      // plan before the index that tells them what the plan is.
      if (ctx.sheet !== 'C-000') drawGeometry(doc, ctx, vp, b)
      doc.restore()
      doc.restore()
      if (ctx.sheet === 'C-000') coverPlate(doc, ctx, vp, sheetSize)

      const drawRight = sheetSize.widthPt - sheetSize.marginPt - titleColW
      northArrow(doc, drawRight - 40, sheetSize.marginPt + 24)
      // The reserved band, at the foot of the drawing column.
      const bandTop = sheetSize.heightPt - sheetSize.marginPt - DETAILS_BAND_PT
      if (!planOnly) {
        countyDetails(doc, sheetSize.marginPt + 16, bandTop,
          drawRight - sheetSize.marginPt - 32, DETAILS_BAND_PT - 46,
          (ctx as { exhibits?: string[] }).exhibits ?? [])
      }
      graphicScale(doc, sheetSize.marginPt + 16, sheetSize.heightPt - sheetSize.marginPt - 26, vp)
      if (planOnly) {
        // THE STATUS STAYS. A drawing with no title block has nothing else
        // saying what it is, and an unlabelled plan gets read as an issued one.
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#a5261b')
           .text(String(ctx.status ?? 'PRELIMINARY').toUpperCase(),
                 sheetSize.marginPt + 16, sheetSize.marginPt + 16,
                 { width: 400, lineBreak: false })
        doc.font('Helvetica').fontSize(8).fillColor('#666666')
           .text('NOT FOR CONSTRUCTION — NOT REVIEWED OR APPROVED BY PRINCE GEORGE\'S COUNTY',
                 sheetSize.marginPt + 16, sheetSize.marginPt + 36,
                 { width: 460, lineBreak: false })
      }


      // County-required notes, printed in full. pdfkit wraps within `width`,
      // so the certificate is never clipped — unlike the source-and-accuracy
      // note above it, which is a summary and may ellipsis.
      // Source and accuracy note — where every number on the sheet came from.
      if (!planOnly && input.sourceNotes?.length) {
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
      if (planOnly) { watermark(doc, ctx, sheetSize); continue }
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
      // THE BOTTOM BAND IS WIDE, NOT TALL — so the tables sit SIDE BY SIDE.
      //
      // Stacked, the soils table's eight SSURGO rows left 144 pt for a schedule
      // that needs about 175, and the height guard below then silently dropped
      // it: the sheet went out with no storm drain schedule and nothing said
      // so. The band is 265 pt deep and most of a 36 in sheet wide, so the
      // space that was missing vertically was there horizontally all along.
      // THE TABLES HAVE THEIR OWN BAND, ABOVE THE DETAILS.
      //
      // They were placed at `height - margin - 265` while the details band
      // starts at `height - margin - 430`, so both tables were drawn 165 pt
      // INSIDE it — the soils table and the storm drain schedule printed on top
      // of the county standard details, and neither was readable.
      //
      // Bands do not overlap, and each is measured: TABLES_BAND_PT sits
      // directly above DETAILS_BAND_PT, the drawing viewport is shortened by
      // both (see the `heightPt` above), and every table is given an explicit
      // height budget it cannot exceed.
      const tablesTop = bandTop - TABLES_BAND_PT
      const tablesH = TABLES_BAND_PT - 10
      const tableBandW = drawRight - sheetSize.marginPt - 40
      const GUTTER = 24
      const SOILS_W = Math.min(500, Math.round((tableBandW - GUTTER) * 0.48))
      // THE BOTTOM BAND BELONGS TO THE SHEET IT IS ON.
      //
      // Every sheet was getting the same two tables, so the LANDSCAPE plan
      // carried a soils table and a storm drain schedule and no canopy
      // schedule — the one calculation Sec. 25-128 asks it for. A reviewer
      // reads a sheet for its own subject; the swale inverts are on C-400
      // where they are stamped.
      const scheduleX0 = sheetSize.marginPt + 16 + SOILS_W + GUTTER
      const scheduleW0 = drawRight - 32 - scheduleX0
      if (ctx.sheet === 'FP-100') {
        const fullW = SOILS_W + GUTTER + Math.max(0, scheduleW0)
        const afterTable = floodplainConcept(doc, sheetSize.marginPt + 16, tablesTop, ctx,
                                             fullW, 96)
        crossSectionPanel(doc, sheetSize.marginPt + 16, afterTable + 8, ctx,
                          fullW, tablesTop + tablesH - (afterTable + 8))
      } else if (ctx.sheet === 'L-100') {
        canopySchedule(doc, sheetSize.marginPt + 16, tablesTop, ctx,
                       SOILS_W + GUTTER + Math.max(0, scheduleW0), tablesH)
      } else {
        soilsTable(doc, sheetSize.marginPt + 16, tablesTop, ctx, SOILS_W, tablesH)
        if (scheduleW0 >= 380) {
          stormDrainSchedule(doc, scheduleX0, tablesTop, ctx, scheduleW0, tablesH)
        } else {
          console.warn('[sheet] STORM DRAIN SCHEDULE omitted: the table band is only '
            + `${Math.round(scheduleW0)} pt wide beside the soils table`)
        }
      }

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
      if (conceptSheet) {
        // THE STUDY LEADS THE COLUMN. On a concept sheet the findings are the
        // subject, not an appendix to the site data.
        if (room(240, by)) by = floodplainConceptNotes(doc, blockX, by, blockW, ctx) + 10
      }
      if (room(80, by)) by = revisionsPanel(doc, blockX, by, blockW) + 8
      if (room(40, by)) by = indexOfDrawings(doc, blockX, by, ctx) + 12
      if (room(150, by)) by = siteDataTable(doc, blockX, by, ctx) + 12
      if (room(90, by)) by = siteAnalysis(doc, blockX, by, ctx) + 12
      if (room(80, by)) by = buildingData(doc, blockX, by, blockW, ctx) + 12
      const projectDrainage = (ctx.twin as { projectLots?: Array<{
        label: string
        drainage?: DrainageComputation | null
      }> }).projectLots
        ?.filter((lot): lot is { label: string; drainage: DrainageComputation } => Boolean(lot.drainage))
        .map(lot => ({ label: lot.label, drainage: lot.drainage }))
      const drain = projectDrainage?.length
        ? projectDrainage
        : (ctx.twin as { drainage?: DrainageComputation }).drainage ?? null
      if (drain && room(230, by)) by = drainageComputations(doc, blockX, by, blockW, drain) + 12
      if (!conceptSheet && room(120, by)) {
        by = sequenceOfConstruction(doc, blockX, by, blockW) + 10
      }
      if (room(180, by)) by = generalNotes(doc, blockX, by, ctx.twin) + 10
      // THE LEGEND COMES BEFORE THE PLAT PROSE, and it asks for the space it
      // actually needs.
      //
      // It asked for 80 pt and needs about 131 — a heading and eleven rows —
      // and it sat AFTER the plat-of-record block, so on this sheet the column
      // ran out and the legend was dropped altogether. The sheet went out with
      // no key at all while the services are told apart by weight and dash,
      // which is precisely what a key exists to explain, and doubly so on a
      // mono plot. The plat text is reference a reviewer can also read from
      // general note 5, which carries the same transcription; the key is not
      // available anywhere else.
      if (room(135, by)) by = legend(doc, blockX, by) + 12
      if (room(200, by)) by = platRecordBlock(doc, ctx.twin, blockX, by) + 10
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



      // County-required notes, printed in full — AND KEPT ON THIS SHEET.
      //
      // The loop grew `by` with no page-bottom check, so once the notes ran
      // past the frame PDFKit auto-added a page for the overflow. That page
      // has no title block, no sheet number and no certificate: a five-sheet
      // set came out as six PDF pages, the sixth being an orphan carrying the
      // tail of the stabilization note. An untitled page is not a sheet, and a
      // reviewer receiving one cannot tell what it belongs to. The previous
      // comment here only ever addressed HORIZONTAL clipping.
      //
      // Each note is measured before it is placed. What does not fit is not
      // half-printed and not silently dropped — it is reported, so the caller
      // learns the sheet is over-full instead of the set quietly gaining a
      // page.
      const notesBottom = sheetSize.heightPt - sheetSize.marginPt - 12
      const overflowed: string[] = []
      // SIZED TO FIT, because these are REQUIRED.
      //
      // At a flat 7 pt the three stabilization notes did not fit C-400 at all
      // and were reported as missing. A required note that is absent is a
      // deficiency; a required note at 6 pt is a required note. The type is
      // stepped down only as far as it must be, and only the notes are
      // affected — the tables and the certificate keep their sizes.
      const notesFit = (size: number) => {
        doc.font('Helvetica').fontSize(size)
        let h = 0
        for (const n of ctx.requiredNotes ?? []) {
          h += size + 3
            + doc.heightOfString(n.text, { width: blockW, align: 'left' })
            + 2 + doc.heightOfString(n.source.citation, { width: blockW }) + 6
        }
        return by + h <= notesBottom
      }
      const noteSize = [7, 6.5, 6, 5.5, 5].find(notesFit) ?? 5
      for (const note of ctx.requiredNotes ?? []) {
        doc.font('Helvetica').fontSize(noteSize)
        const hText = doc.heightOfString(note.text, { width: blockW, align: 'left' })
        const hCite = doc.heightOfString(note.source.citation, { width: blockW })
        const needed = noteSize + 3 + hText + 2 + hCite + 6
        if (by + needed > notesBottom) { overflowed.push(note.title); continue }
        label(doc, blockX, by, note.title.toUpperCase(), noteSize, { bold: true })
        by += noteSize + 3
        doc.font('Helvetica').fontSize(noteSize).fillColor('#000000')
           .text(note.text, blockX, by, { width: blockW, align: 'left' })
        by = doc.y + 2
        doc.font('Helvetica').fontSize(noteSize).fillColor('#666666')
           .text(note.source.citation, blockX, by, { width: blockW })
        by = doc.y + 6
      }
      if (overflowed.length) {
        // Say it ON THE SHEET as well as to the caller: a required note that is
        // not printed is a deficiency, and hiding it in a log would be worse
        // than the orphan page this replaced.
        // A CROSS-REFERENCE, not an apology. These notes are also assigned to
        // C-000, the cover and notes sheet, whose column has room for them, so
        // on a set that includes C-000 they are present and this line tells the
        // reviewer where. On a set without C-000 the wording still reads as the
        // deficiency it would be.
        const onCover = (ctx.sheetIds ?? []).includes('C-000')
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor(onCover ? '#555555' : '#8a3a2a')
           .text(onCover
             ? `${overflowed.length} REQUIRED NOTE(S) — `
               + `${overflowed.join('; ').toUpperCase()} — ARE CARRIED IN FULL ON SHEET C-000.`
             : `${overflowed.length} REQUIRED NOTE(S) DO NOT FIT THIS SHEET: `
               + `${overflowed.join('; ').toUpperCase()}. THEY ARE REQUIRED AND ARE NOT ON ANY `
               + 'SHEET IN THIS SET.', blockX, Math.min(by, notesBottom - 22),
             { width: blockW })
        console.error(`  !! ${overflowed.length} required note(s) did not fit sheet `
          + `${ctx.sheet}: ${overflowed.join('; ')}`)
      }
      watermark(doc, ctx, sheetSize)
    }

    doc.end()
  })
}
