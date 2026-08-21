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
  titleBlockWidthPt: 4.5 * 72,
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
): Viewport {
  const drawWidthPt = sheet.widthPt - sheet.marginPt * 2 - sheet.titleBlockWidthPt
  const drawHeightPt = sheet.heightPt - sheet.marginPt * 2

  const contentWidthFt = bounds.maxX - bounds.minX + paddingFt * 2
  const contentHeightFt = bounds.maxY - bounds.minY + paddingFt * 2

  let chosen: StandardScale = STANDARD_SCALES_FT_PER_IN[STANDARD_SCALES_FT_PER_IN.length - 1]
  for (const s of STANDARD_SCALES_FT_PER_IN) {
    const ppf = 72 / s
    if (contentWidthFt * ppf <= drawWidthPt && contentHeightFt * ppf <= drawHeightPt) {
      chosen = s
      break
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
