/**
 * Driveway, leadwalk and the other proposed site development.
 *
 * Sec. 32-130(a)(10) requires "size, location and construction details of all
 * proposed site development", and (a)(4) requires the limits of disturbance
 * with a calculation of the disturbed area. A dwelling alone satisfies neither:
 * the driveway is usually the second-largest impervious area on an infill lot,
 * and leaving it off is what makes the disturbance figure read NOT QUANTIFIED.
 *
 * ── What is derived and what is assumed ────────────────────────────────────
 *
 * The GEOMETRY is derived: the driveway runs from the front lot line to the
 * garage face along the front-edge normal, and the leadwalk runs from the
 * driveway to the middle of the front elevation. Both follow the building's
 * own orientation, so they stay square to it on a skewed lot.
 *
 * The WIDTHS are conventions, not code: PG publishes slope limits for
 * driveways and walks in Sec. 32-151 Table 4 but not widths. The approved
 * Yocum Property plan letters "CONCRETE WALK (5' WIDE)", and 12 ft is the
 * ordinary single-family driveway. Both are stated as assumptions so a
 * reviewer can correct them rather than discover them.
 */

import type { Ring, Position } from './site-twin'
import type { EdgeYard } from './buildable-envelope'

/** Sec. 32-151 Table 4 — the slopes a driveway and walk must hold. */
export const TABLE_4_SLOPES = {
  drivewayLateralMax: '1/2" in 12"',
  drivewayLateralMin: '1/8" in 12"',
  drivewayLongitudinalMaxPct: 12.5,
  drivewayLongitudinalMinPct: 1,
  walkLateralMax: '48:1',
  walkLongitudinalMax: '12:1',
  citation: 'PGC Code Sec. 32-151, Table 4 — Site Slope Limitations',
} as const

/** Conventions, not code. PG publishes slopes for these, not widths. */
export const DRIVEWAY_WIDTH_FT = 12
export const WALK_WIDTH_FT = 5

export interface SiteImprovement {
  id: string
  kind: 'Driveway' | 'Walk'
  label: string
  ring: Ring
  areaSqFt: number
  /** Impervious surface counts toward disturbance and often toward coverage. */
  impervious: boolean
  note: string
}

export interface SiteImprovementResult {
  improvements: SiteImprovement[]
  /** Impervious area added by site development, excluding the dwelling. */
  impervousAreaSqFt: number
  assumptions: string[]
}

function ringArea(pts: Position[]): number {
  let a = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1])
  }
  return Math.abs(a / 2)
}

function rectFromAxis(
  start: Position, dirX: number, dirY: number, lengthFt: number, widthFt: number,
): Ring {
  const nx = -dirY, ny = dirX          // unit normal, dir is already unit
  const hw = widthFt / 2
  const a: Position = [start[0] + nx * hw, start[1] + ny * hw]
  const b: Position = [start[0] - nx * hw, start[1] - ny * hw]
  const c: Position = [b[0] + dirX * lengthFt, b[1] + dirY * lengthFt]
  const d: Position = [a[0] + dirX * lengthFt, a[1] + dirY * lengthFt]
  return { coordinates: [a, b, c, d, a] }
}

/**
 * Derives the driveway and leadwalk for a single-family lot.
 *
 * Returns nothing rather than guessing when the front edge or the dwelling is
 * unknown — a driveway drawn to a lot line that is not the frontage would send
 * a car into a neighbour's yard.
 */
export function deriveSiteImprovements(input: {
  parcel: Ring
  footprint: Ring | null
  edgeYards: EdgeYard[]
  hasGarage: boolean
}): SiteImprovementResult {
  const { parcel, footprint, edgeYards, hasGarage } = input
  const assumptions: string[] = []

  const lot = parcel.coordinates.slice(0, -1)
  const frontIdx = edgeYards.indexOf('front')
  if (!footprint || frontIdx < 0 || frontIdx >= lot.length) {
    return {
      improvements: [], impervousAreaSqFt: 0,
      assumptions: [
        'No driveway or walk was derived: the fronting lot line or the dwelling is not established. ' +
        'A driveway drawn to the wrong lot line would send a car into a neighbour\'s yard.',
      ],
    }
  }

  // Inward normal of the front lot line, which is the direction a driveway runs.
  const a = lot[frontIdx], b = lot[(frontIdx + 1) % lot.length]
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  const inX = -dy / len, inY = dx / len

  const fp = footprint.coordinates.slice(0, -1)
  const fpCentre: Position = [
    fp.reduce((s, p) => s + p[0], 0) / fp.length,
    fp.reduce((s, p) => s + p[1], 0) / fp.length,
  ]

  // Nearest face of the dwelling to the front line — the driveway stops there.
  const proj = (p: Position) => (p[0] - a[0]) * inX + (p[1] - a[1]) * inY
  const faceDepth = Math.min(...fp.map(proj))
  const centreOffset = ((fpCentre[0] - a[0]) * (dx / len)) + ((fpCentre[1] - a[1]) * (dy / len))

  const improvements: SiteImprovement[] = []

  // ── Driveway: front lot line to the dwelling face ────────────────────────
  const driveLength = Math.max(8, faceDepth)
  const driveStart: Position = [
    a[0] + (dx / len) * centreOffset + inX * 0,
    a[1] + (dy / len) * centreOffset + inY * 0,
  ]
  // Offset toward the garage end rather than dead centre of the elevation.
  const gShift = hasGarage ? DRIVEWAY_WIDTH_FT : 0
  const drive = rectFromAxis(
    [driveStart[0] + (dx / len) * gShift, driveStart[1] + (dy / len) * gShift],
    inX, inY, driveLength, DRIVEWAY_WIDTH_FT)
  improvements.push({
    id: 'driveway', kind: 'Driveway',
    label: `PROPOSED DRIVEWAY  ${DRIVEWAY_WIDTH_FT}' WIDE`,
    ring: drive, areaSqFt: ringArea(drive.coordinates.slice(0, -1)), impervious: true,
    note:
      `Longitudinal pitch ${TABLE_4_SLOPES.drivewayLongitudinalMinPct}% min to ` +
      `${TABLE_4_SLOPES.drivewayLongitudinalMaxPct}% max, lateral ` +
      `${TABLE_4_SLOPES.drivewayLateralMin} to ${TABLE_4_SLOPES.drivewayLateralMax} away from the ` +
      `building. ${TABLE_4_SLOPES.citation}.`,
  })

  // ── Leadwalk: driveway to the middle of the front elevation ──────────────
  const walkStart: Position = [
    driveStart[0] - (dx / len) * (WALK_WIDTH_FT * 1.5),
    driveStart[1] - (dy / len) * (WALK_WIDTH_FT * 1.5),
  ]
  const walk = rectFromAxis(walkStart, inX, inY, driveLength, WALK_WIDTH_FT)
  improvements.push({
    id: 'walk', kind: 'Walk',
    label: `CONCRETE WALK  ${WALK_WIDTH_FT}' WIDE`,
    ring: walk, areaSqFt: ringArea(walk.coordinates.slice(0, -1)), impervious: true,
    note:
      `Lateral pitch ${TABLE_4_SLOPES.walkLateralMax} max, longitudinal ` +
      `${TABLE_4_SLOPES.walkLongitudinalMax} max. ${TABLE_4_SLOPES.citation}.`,
  })

  assumptions.push(
    `Driveway ${DRIVEWAY_WIDTH_FT} ft and walk ${WALK_WIDTH_FT} ft wide. Prince George's County ` +
    'publishes SLOPE limits for both in Sec. 32-151 Table 4 but not widths; these are ordinary ' +
    'single-family dimensions and the approved Yocum Property plan letters a 5 ft walk. Confirm ' +
    'against the design before relying on the impervious area.',
    'Both run perpendicular to the front lot line and stop at the nearest face of the dwelling. ' +
    'The apron detail and any curb cut are a DPW&T standard and are not drawn here.',
  )

  return {
    improvements,
    impervousAreaSqFt: Math.round(improvements.reduce((n, i) => n + i.areaSqFt, 0)),
    assumptions,
  }
}
