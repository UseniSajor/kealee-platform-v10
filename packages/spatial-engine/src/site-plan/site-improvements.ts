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
import { normaliseRing } from './buildable-envelope'
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
/**
 * Public frontage conventions. Also not code.
 *
 * The apron is REQUIRED here, not optional: the recorded plat's own note says
 * "Separate, standard residential driveway aprons shall be provided along
 * Rollins Avenue" and requires an abutting driveway design per DPW&T standards.
 * A plan that stops the driveway at the property line leaves out the one piece
 * of work the plat conditions the approval on.
 *
 * The DPW&T standard detail governs the actual dimensions. What is drawn here
 * is the LOCATION and EXTENT so the sheet shows the connection and the
 * impervious area is counted; the detail is called out, not redrawn.
 */
export const APRON_FLARE_FT = 3
export const SIDEWALK_WIDTH_FT = 4
/** Green strip between the back of walk and the property line. */
export const SIDEWALK_OFFSET_FT = 1

export interface SiteImprovement {
  id: string
  kind: 'Driveway' | 'Walk' | 'Apron' | 'Sidewalk'
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
  /**
   * Street centrelines, for the work in the public frontage.
   *
   * The apron and the sidewalk sit OUTSIDE the property line, between it and
   * the street, so neither can be placed from the lot alone. Without a
   * centreline they are omitted and said to be omitted — an apron drawn to a
   * guessed right-of-way width is a connection to nowhere.
   */
  streetPaths?: Position[][] | null
}): SiteImprovementResult {
  const { parcel, footprint, edgeYards, hasGarage } = input
  const assumptions: string[] = []

  // THE SAME RING `edgeYards` WAS BUILT ON.
  //
  // This took the raw coordinates. `deriveBuildableEnvelope` normalises first —
  // drops the closing point and forces counter-clockwise — so on a clockwise
  // ring the two disagreed twice over: `frontIdx` indexed a different edge, and
  // the normal built from it pointed OUT of the lot instead of in.
  //
  // The recorded plat rings are clockwise. Every driveway and walk drawn from a
  // plat therefore ran the wrong way, landing 0% inside the property — out in
  // the right-of-way, where it read as a plausible driveway and nothing
  // downstream disagreed. It surfaced only when the apron, which runs the
  // opposite way by design, came out through the house.
  const lot = normaliseRing(parcel)
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
  const centreOffset = ((fpCentre[0] - a[0]) * (dx / len)) + ((fpCentre[1] - a[1]) * (dy / len))
  // How far in the house is AT THE DRIVEWAY, not at its nearest corner.
  //
  // `Math.min` over the corners takes the closest point of the whole footprint,
  // which is a different place on a rotated house: the driveway then runs past
  // the face it should stop at and clips the building. Sampling the edges
  // inside the driveway's own lateral band answers the question actually being
  // asked — where is the wall in front of this driveway.
  const alongAxis = (p: Position) => ((p[0] - a[0]) * (dx / len)) + ((p[1] - a[1]) * (dy / len))
  const bandCentre = centreOffset + (hasGarage ? DRIVEWAY_WIDTH_FT : 0)
  const faceDepthAt = (centre: number, widthFt: number): number => {
    const banded: number[] = []
    for (let i = 0; i < fp.length; i++) {
      const p0 = fp[i], p1 = fp[(i + 1) % fp.length]
      for (let t = 0; t <= 1.0001; t += 0.02) {
        const q: Position = [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]
        if (Math.abs(alongAxis(q) - centre) <= widthFt / 2 + 0.5) banded.push(proj(q))
      }
    }
    return banded.length ? Math.min(...banded) : Math.min(...fp.map(proj))
  }
  const faceDepth = faceDepthAt(bandCentre, DRIVEWAY_WIDTH_FT)

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
  // The walk stops at the wall in front of the WALK, which is not where the
  // driveway stops once the house is rotated.
  const walkLength = Math.max(4, faceDepthAt(centreOffset - WALK_WIDTH_FT * 1.5, WALK_WIDTH_FT))
  const walk = rectFromAxis(walkStart, inX, inY, walkLength, WALK_WIDTH_FT)
  improvements.push({
    id: 'walk', kind: 'Walk',
    label: `CONCRETE WALK  ${WALK_WIDTH_FT}' WIDE`,
    ring: walk, areaSqFt: ringArea(walk.coordinates.slice(0, -1)), impervious: true,
    note:
      `Lateral pitch ${TABLE_4_SLOPES.walkLateralMax} max, longitudinal ` +
      `${TABLE_4_SLOPES.walkLongitudinalMax} max. ${TABLE_4_SLOPES.citation}.`,
  })

  // ── The public frontage: apron and sidewalk ──────────────────────────────
  //
  // Both sit outside the property line. The distance from the front lot line
  // to the street is MEASURED against the centreline rather than assumed from
  // a right-of-way width, because the dedication varies lot by lot and this
  // subdivision's is 20 ft where the county's default is not.
  const streetPaths = input.streetPaths ?? []
  const frontMid: Position = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  let toCentrelineFt = Infinity
  for (const path of streetPaths) {
    for (let i = 0; i < path.length - 1; i++) {
      const p0 = path[i], p1 = path[i + 1]
      const vx = p1[0] - p0[0], vy = p1[1] - p0[1]
      const t = Math.max(0, Math.min(1,
        ((frontMid[0] - p0[0]) * vx + (frontMid[1] - p0[1]) * vy) / (vx * vx + vy * vy || 1)))
      const d = Math.hypot(frontMid[0] - (p0[0] + t * vx), frontMid[1] - (p0[1] + t * vy))
      if (d < toCentrelineFt) toCentrelineFt = d
    }
  }

  if (!Number.isFinite(toCentrelineFt)) {
    assumptions.push(
      'NO DRIVEWAY APRON OR PUBLIC SIDEWALK IS DRAWN: no street centreline was available, so the ' +
      'distance from the front lot line to the street is unknown. The recorded plat requires an ' +
      'apron along the fronting street, so this is a gap in the drawing, not an omission by design.')
  } else {
    // The apron runs from the front lot line OUT to the street, the opposite
    // direction to everything else here, and flares as it goes — the flare is
    // what a DPW&T standard apron has and what makes it read as an apron
    // rather than a driveway that overshot the property line.
    const apronRun = Math.max(4, toCentrelineFt - APRON_FLARE_FT * 2)
    const outX = -inX, outY = -inY
    const along: Position = [
      a[0] + (dx / len) * (centreOffset + (hasGarage ? DRIVEWAY_WIDTH_FT : 0)),
      a[1] + (dy / len) * (centreOffset + (hasGarage ? DRIVEWAY_WIDTH_FT : 0)),
    ]
    const hw = DRIVEWAY_WIDTH_FT / 2, hwFlared = hw + APRON_FLARE_FT
    const ux = dx / len, uy = dy / len
    const apron: Ring = { coordinates: [
      [along[0] + ux * hw, along[1] + uy * hw],
      [along[0] - ux * hw, along[1] - uy * hw],
      [along[0] - ux * hwFlared + outX * apronRun, along[1] - uy * hwFlared + outY * apronRun],
      [along[0] + ux * hwFlared + outX * apronRun, along[1] + uy * hwFlared + outY * apronRun],
      [along[0] + ux * hw, along[1] + uy * hw],
    ] }
    improvements.push({
      id: 'apron', kind: 'Apron',
      label: `PROPOSED DRIVEWAY APRON  PER DPW&T STANDARD`,
      ring: apron, areaSqFt: ringArea(apron.coordinates.slice(0, -1)), impervious: true,
      note:
        'Standard residential driveway apron, constructed to the DPW&T standard detail and to the ' +
        'abutting driveway design the recorded plat requires. Extent shown; the detail governs the ' +
        'dimensions, jointing and depression. Curb cut per the same detail.',
    })

    // The public walk runs ALONG the frontage, inside the right-of-way, set
    // off the property line by a green strip.
    const walkOff = SIDEWALK_OFFSET_FT + SIDEWALK_WIDTH_FT / 2
    const swStart: Position = [a[0] + outX * walkOff, a[1] + outY * walkOff]
    const sidewalk = rectFromAxis(swStart, ux, uy, len, SIDEWALK_WIDTH_FT)
    improvements.push({
      id: 'sidewalk', kind: 'Sidewalk',
      label: `PUBLIC SIDEWALK  ${SIDEWALK_WIDTH_FT}' WIDE`,
      ring: sidewalk, areaSqFt: ringArea(sidewalk.coordinates.slice(0, -1)), impervious: true,
      note:
        'Public sidewalk across the frontage, within the right-of-way. Shown for the full frontage ' +
        'width; whether it is to be built, reconstructed or already exists is a DPW&T determination ' +
        'at street construction permit.',
    })

    assumptions.push(
      `The front lot line is ${toCentrelineFt.toFixed(0)} ft from the street centreline, measured. ` +
      `The apron runs ${apronRun.toFixed(0)} ft from the property line toward the street and flares ` +
      `${APRON_FLARE_FT} ft each side; the sidewalk is ${SIDEWALK_WIDTH_FT} ft wide, set ` +
      `${SIDEWALK_OFFSET_FT} ft off the property line. Widths and flare are ordinary residential ` +
      'dimensions, NOT county-published values — the DPW&T standard detail governs.',
      'The apron and sidewalk are in the PUBLIC right-of-way. Their area is impervious and is ' +
      'counted, but it is not lot coverage and does not count against the zone maximum.')
  }

  assumptions.push(
    `Driveway ${DRIVEWAY_WIDTH_FT} ft and walk ${WALK_WIDTH_FT} ft wide. Prince George's County ` +
    'publishes SLOPE limits for both in Sec. 32-151 Table 4 but not widths; these are ordinary ' +
    'single-family dimensions and the approved Yocum Property plan letters a 5 ft walk. Confirm ' +
    'against the design before relying on the impervious area.',
    'Both run perpendicular to the front lot line and stop at the nearest face of the dwelling.',
  )

  return {
    improvements,
    impervousAreaSqFt: Math.round(improvements.reduce((n, i) => n + i.areaSqFt, 0)),
    assumptions,
  }
}
