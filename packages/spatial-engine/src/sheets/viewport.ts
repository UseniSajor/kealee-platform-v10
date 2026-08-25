/**
 * Projects site-model coordinates onto a sheet.
 *
 * Site geometry is in a projected CRS in feet (EPSG:2248 for Prince George's
 * County). A sheet is in points at 72 dpi. The mapping between them IS the
 * drawing scale, so it is computed here once and every sheet uses it — which is
 * why the graphic scale bar on the sheet is guaranteed to agree with the
 * geometry rather than being decorative.
 *
 * Y is flipped: survey northing increases upward, sheet Y increases downward.
 */

import type { Position, Ring } from '../site-plan/site-twin'

/** Common civil drawing scales, as feet per inch. */
export const STANDARD_SCALES_FT_PER_IN = [10, 20, 30, 40, 50, 60, 100, 200] as const
export type StandardScale = (typeof STANDARD_SCALES_FT_PER_IN)[number]

// ── Plan scale, as Subtitle 32 actually writes it ───────────────────────────

/**
 * Sec. 32-130(a)(5) and (a)(6), Prince George's County Code, Subtitle 32
 * (Water Resources Protection and Grading Code).
 *
 * The general rule caps how SMALL the scale may be — "a scale no smaller than
 * one (1) inch equals fifty (50) feet of the entire site, plus a minimum
 * twenty (20) foot adjacent peripheral strip". Feet-per-inch therefore has a
 * MAXIMUM: 1"=60' is a smaller scale than 1"=50' and does not comply.
 *
 * Two things stop this from being a hard clamp, and both are in the code:
 *
 *   (a)(6) surplus earth disposal on sites of ten (10) acres or larger may be
 *          drawn at no smaller than 1"=200' with contours at no greater than
 *          five (5) foot intervals — EXCEPT that work within fifty (50) feet
 *          of any property line reverts to (a)(5).
 *
 *   (a)(5) any other interval and scale is permissible "provided that such
 *          other interval and scale has the Director's approval IN ADVANCE of
 *          plan preparation".
 *
 * The Director's approval is a real-world event, not something the engine may
 * infer. It is carried as evidence or it does not exist.
 */
export interface DirectorScaleApproval {
  /** Who at DPIE approved it, and the reference they gave. */
  reference: string
  /** Must predate plan preparation — (a)(5) says "in advance". */
  approvedOn: string
  approvedMaxFtPerIn: number
}

export interface ScaleConstraint {
  /** Largest permissible feet-per-inch. Bigger number = smaller scale. */
  maxFtPerIn: number
  /** Permitted contour intervals, feet. */
  contourIntervalsFt: number[]
  /** Minimum strip beyond the site that must appear, feet. */
  peripheralStripFt: number
  /** The provision this comes from. */
  citation: string
  directorApproval?: DirectorScaleApproval
}

/** Sec. 32-130(a)(5) — the case nearly every site plan falls under. */
export const PG_SCALE_GENERAL: ScaleConstraint = {
  maxFtPerIn: 50,
  contourIntervalsFt: [1, 2],
  peripheralStripFt: 20,
  citation: "PGC Code Sec. 32-130(a)(5)",
}

/** Sec. 32-130(a)(6) — surplus earth disposal, sites 10 acres or larger. */
export const PG_SCALE_SURPLUS_EARTH_10AC: ScaleConstraint = {
  maxFtPerIn: 200,
  contourIntervalsFt: [1, 2, 5],
  peripheralStripFt: 20,
  citation: "PGC Code Sec. 32-130(a)(6)",
}

/**
 * Picks the governing constraint.
 *
 * (a)(6) is narrow and self-limiting: it applies only to surplus earth disposal
 * on ten acres or more, and any work within fifty feet of a property line falls
 * back to (a)(5). Because a grading plan almost always touches its own property
 * line, the fallback is the default and (a)(6) must be asked for explicitly.
 */
export function scaleConstraintFor(input: {
  surplusEarthDisposal?: boolean
  siteAreaAcres?: number
  workWithin50FtOfPropertyLine?: boolean
  directorApproval?: DirectorScaleApproval
} = {}): ScaleConstraint {
  const base =
    input.surplusEarthDisposal === true &&
    (input.siteAreaAcres ?? 0) >= 10 &&
    input.workWithin50FtOfPropertyLine === false
      ? PG_SCALE_SURPLUS_EARTH_10AC
      : PG_SCALE_GENERAL

  return input.directorApproval ? { ...base, directorApproval: input.directorApproval } : base
}

/** The effective cap, after any Director approval. */
export function effectiveMaxFtPerIn(c: ScaleConstraint): number {
  const approved = c.directorApproval?.approvedMaxFtPerIn
  return approved !== undefined && approved > c.maxFtPerIn ? approved : c.maxFtPerIn
}

export interface ScaleCompliance {
  compliant: boolean
  /** The cap that applied, after any Director approval. */
  limitFtPerIn: number
  citation: string
  /** Present only when non-compliant — what a drafter must actually do. */
  remedy?: string
}

export interface SheetSize {
  widthPt: number
  heightPt: number
  marginPt: number
  /** Reserved on the right for the title block. */
  titleBlockWidthPt: number
}

/** ARCH D, 24 x 36 in at 72 dpi — the usual civil sheet. */
export const ARCH_D: SheetSize = {
  widthPt: 36 * 72,
  heightPt: 24 * 72,
  marginPt: 36,
  // Wide enough for the SITE DATA table, general notes and legend. Nothing but
  // drawing goes left of this column; nothing but data goes right of it.
  titleBlockWidthPt: 5.2 * 72,
}

/** ANSI B, 11 x 17 in — for check prints. */
export const ANSI_B: SheetSize = {
  widthPt: 17 * 72,
  heightPt: 11 * 72,
  marginPt: 18,
  titleBlockWidthPt: 3 * 72,
}

export interface Viewport {
  scaleFtPerIn: StandardScale
  /** Points per foot of ground distance. */
  pointsPerFoot: number
  originX: number
  originY: number
  drawWidthPt: number
  drawHeightPt: number
  sheet: SheetSize
  label: string
  /**
   * Whether the chosen scale satisfies Sec. 32-130. Never silently true — a
   * drawing that cannot fit within the permitted scale is still produced, but
   * it is produced with this flag down so issuance QC can block it.
   */
  scaleCompliance: ScaleCompliance
}

export interface Bounds { minX: number; minY: number; maxX: number; maxY: number }

export function boundsOf(rings: Ring[]): Bounds {
  const pts = rings.flatMap(r => r.coordinates)
  if (pts.length === 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1 }
  return {
    minX: Math.min(...pts.map(p => p[0])),
    minY: Math.min(...pts.map(p => p[1])),
    maxX: Math.max(...pts.map(p => p[0])),
    maxY: Math.max(...pts.map(p => p[1])),
  }
}

/**
 * Chooses the largest standard scale at which the content still fits, so the
 * drawing is as legible as the sheet allows. Never invents a non-standard scale
 * — a plan reviewer scales off these drawings with an engineer's scale.
 */
export function fitViewport(
  bounds: Bounds,
  sheet: SheetSize = ARCH_D,
  paddingFt = 20,
  constraint: ScaleConstraint = PG_SCALE_GENERAL,
): Viewport {
  const drawWidthPt = sheet.widthPt - sheet.marginPt * 2 - sheet.titleBlockWidthPt
  const drawHeightPt = sheet.heightPt - sheet.marginPt * 2

  const contentWidthFt = bounds.maxX - bounds.minX + paddingFt * 2
  const contentHeightFt = bounds.maxY - bounds.minY + paddingFt * 2

  const limit = effectiveMaxFtPerIn(constraint)
  const fits = (s: number) => {
    const ppf = 72 / s
    return contentWidthFt * ppf <= drawWidthPt && contentHeightFt * ppf <= drawHeightPt
  }

  // Only scales the code actually permits are candidates. Previously the loop
  // fell through to the last entry of the table — 1"=200' — whenever nothing
  // fitted, which silently produced a sheet DPIE would reject.
  const permitted = STANDARD_SCALES_FT_PER_IN.filter(s => s <= limit)
  const chosenPermitted = permitted.find(fits)

  let chosen: StandardScale
  let compliance: ScaleCompliance

  if (chosenPermitted !== undefined) {
    chosen = chosenPermitted
    compliance = { compliant: true, limitFtPerIn: limit, citation: constraint.citation }
  } else {
    // The site does not fit at any permitted scale. Draw it at the smallest
    // scale that does fit so the geometry is still inspectable, and say so.
    const fallback = STANDARD_SCALES_FT_PER_IN.find(fits)
      ?? STANDARD_SCALES_FT_PER_IN[STANDARD_SCALES_FT_PER_IN.length - 1]
    chosen = fallback
    compliance = {
      compliant: false,
      limitFtPerIn: limit,
      citation: constraint.citation,
      remedy:
        `Site does not fit on ${sheet.widthPt / 72}" x ${sheet.heightPt / 72}" at 1"=${limit}' ` +
        `(would need 1"=${fallback}'). ${constraint.citation} caps the scale at 1"=${limit}'. ` +
        'Resolve by splitting the site across match-lined sheets, or obtain the Director\'s ' +
        'approval of a smaller scale IN ADVANCE of plan preparation per Sec. 32-130(a)(5) and ' +
        'record it as DirectorScaleApproval. Do not simply draw at the smaller scale.',
    }
  }

  const pointsPerFoot = 72 / chosen
  // Centre the content in the drawing area.
  const usedW = contentWidthFt * pointsPerFoot
  const usedH = contentHeightFt * pointsPerFoot
  const originX = sheet.marginPt + Math.max(0, (drawWidthPt - usedW) / 2)
  const originY = sheet.marginPt + Math.max(0, (drawHeightPt - usedH) / 2)

  return {
    scaleFtPerIn: chosen,
    scaleCompliance: compliance,
    pointsPerFoot,
    originX,
    originY,
    drawWidthPt,
    drawHeightPt,
    sheet,
    label: `1" = ${chosen}'`,
  }
}

/** Site coordinate to sheet point. */
export function project(p: Position, vp: Viewport, bounds: Bounds, paddingFt = 20): [number, number] {
  const x = vp.originX + (p[0] - bounds.minX + paddingFt) * vp.pointsPerFoot
  // Flip Y — northing up, sheet down.
  const contentHeightFt = bounds.maxY - bounds.minY + paddingFt * 2
  const y = vp.originY + (contentHeightFt - (p[1] - bounds.minY + paddingFt)) * vp.pointsPerFoot
  return [round(x), round(y)]
}

export function projectRing(ring: Ring, vp: Viewport, bounds: Bounds, paddingFt = 20): [number, number][] {
  return ring.coordinates.map(p => project(p, vp, bounds, paddingFt))
}

/** Graphic scale bar ticks, in feet, sized to the chosen scale. */
export function graphicScaleTicks(vp: Viewport): { ft: number; pt: number }[] {
  const step = vp.scaleFtPerIn // one inch per tick
  return [0, 1, 2, 3, 4].map(i => ({ ft: step * i, pt: round(step * i * vp.pointsPerFoot) }))
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
