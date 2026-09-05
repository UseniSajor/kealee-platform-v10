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
/** Set-in from the front property line to the front edge of the walk. */
export const SIDEWALK_OFFSET_FT = 1
/**
 * Half the travelled way, assumed.
 *
 * The apron ends at the EDGE OF PAVEMENT — it is the entrance to the driveway,
 * not a strip of the road — and the centreline layer is the only street
 * geometry the county publishes. `Transportation/MapServer/2` carries name,
 * class, speed and address ranges and NO pavement width, so the edge is placed
 * at an assumed half-width off the measured centreline. 15 ft suits an ordinary
 * 30 ft residential street; it is stated on the sheet and a survey replaces it.
 */
export const ASSUMED_PAVEMENT_HALF_WIDTH_FT = 15
/** Front stoop, from the architectural plans this engine has been given. */
export const STOOP_WIDTH_FT = 8
export const STOOP_DEPTH_FT = 5

export interface SiteImprovement {
  id: string
  kind: 'Driveway' | 'Walk' | 'Apron' | 'Sidewalk' | 'Verge' | 'Stoop'
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
  /**
   * Width of the strip dedicated to public use, from the RECORDED PLAT.
   *
   * When the plat dimensions it, this is the distance from the front property
   * line to the right-of-way line and the apron runs exactly that far. It
   * replaces the assumed pavement half-width, which was the one figure on these
   * sheets with nothing behind it. The plat draws the existing pavement
   * centreline but does not dimension its offset, so the apron ends at the
   * right-of-way line — which is where a private apron ends in any case.
   */
  dedicationWidthFt?: number | null
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

  // ── Leadwalk: DRIVEWAY to the front door ─────────────────────────────────
  //
  // This ran from the STREET to the house, parallel to the driveway and beside
  // it — two separate paved strips reaching the road, one of which nobody
  // walks. A leadwalk connects where you park to where you go in. It now
  // starts at the edge of the driveway and runs ACROSS the frontage to the
  // middle of the front elevation, at the depth of the house face.
  const doorOffset = centreOffset
  const driveEdge = bandCentre - (DRIVEWAY_WIDTH_FT / 2) * Math.sign(bandCentre - doorOffset || 1)
  const runFt = Math.abs(doorOffset - driveEdge)
  const faceAtDoor = faceDepthAt(doorOffset, WALK_WIDTH_FT)
  if (runFt >= 1) {
    // Set the walk just outside the wall so it abuts the elevation rather than
    // running under it.
    const standoff = faceAtDoor - WALK_WIDTH_FT / 2
    const startAlong = Math.min(driveEdge, doorOffset)
    const wStart: Position = [
      a[0] + (dx / len) * startAlong + inX * standoff,
      a[1] + (dy / len) * startAlong + inY * standoff,
    ]
    const walk = rectFromAxis(
      [wStart[0] + (dx / len) * (runFt / 2), wStart[1] + (dy / len) * (runFt / 2)],
      dx / len, dy / len, runFt, WALK_WIDTH_FT)
    improvements.push({
      id: 'walk', kind: 'Walk',
      label: `CONCRETE WALK  ${WALK_WIDTH_FT}' WIDE`,
      ring: walk, areaSqFt: ringArea(walk.coordinates.slice(0, -1)), impervious: true,
      note:
        `Leadwalk from the driveway to the front entrance. Lateral pitch ` +
        `${TABLE_4_SLOPES.walkLateralMax} max, longitudinal ` +
        `${TABLE_4_SLOPES.walkLongitudinalMax} max. ${TABLE_4_SLOPES.citation}.`,
    })
    // The STOOP at the entrance. A leadwalk that stops at a blank wall is not
    // a route into the house; the plans letter a front concrete stoop.
    const stoop = rectFromAxis(
      [a[0] + (dx / len) * doorOffset + inX * (faceAtDoor - STOOP_DEPTH_FT / 2),
       a[1] + (dy / len) * doorOffset + inY * (faceAtDoor - STOOP_DEPTH_FT / 2)],
      inX, inY, STOOP_DEPTH_FT, STOOP_WIDTH_FT)
    improvements.push({
      id: 'stoop', kind: 'Stoop',
      label: `CONCRETE STOOP  ${STOOP_WIDTH_FT}' x ${STOOP_DEPTH_FT}'`,
      ring: stoop, areaSqFt: ringArea(stoop.coordinates.slice(0, -1)), impervious: true,
      note:
        'Front concrete stoop at the entrance, on the leadwalk. Riser count and handrail per the ' +
        'architectural plans and the building code.',
    })
  } else {
    assumptions.push(
      'No leadwalk is drawn: the driveway already meets the entrance, so there is nothing for a ' +
      'walk to connect.')
  }
  // ── The public frontage: apron and sidewalk ──────────────────────────────
  //
  // The apron sits outside the property line and the walk just inside it. The
  // distance from the front lot line
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
    // To the EDGE OF PAVEMENT, not toward the centreline. The apron is the
    // entrance to the driveway: it crosses the ground between the property
    // line and the street and stops where the road surface begins. Running it
    // to within a flare of the centreline drew it out across half the
    // travelled way.
    const dedicated = input.dedicationWidthFt ?? null
    const apronRun = dedicated != null && dedicated > 0
      ? dedicated
      : Math.max(4, toCentrelineFt - ASSUMED_PAVEMENT_HALF_WIDTH_FT)
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
    // INSIDE the front lot line, not in the right-of-way. It was placed out in
    // the public strip on the reasoning that a public walk lives there; on this
    // frontage it belongs on the lot, set in from the property line.
    const walkOff = SIDEWALK_OFFSET_FT + SIDEWALK_WIDTH_FT / 2
    const swStart: Position = [a[0] + inX * walkOff, a[1] + inY * walkOff]
    const sidewalk = rectFromAxis(swStart, ux, uy, len, SIDEWALK_WIDTH_FT)
    // The VERGE — the planting strip between the sidewalk and the street. The
    // plat shows it and it is where street trees go; without it the sidewalk
    // reads as abutting the kerb, which is a different street section.
    const vergeWidth = Math.max(0, apronRun - SIDEWALK_OFFSET_FT - SIDEWALK_WIDTH_FT)
    if (vergeWidth > 0.5) {
      const vStart: Position = [
        a[0] + outX * (vergeWidth / 2), a[1] + outY * (vergeWidth / 2),
      ]
      const verge = rectFromAxis(
        [vStart[0] + (dx / len) * (len / 2), vStart[1] + (dy / len) * (len / 2)],
        dx / len, dy / len, len, vergeWidth)
      improvements.push({
        id: 'verge', kind: 'Verge',
        label: `PLANTING STRIP  ${vergeWidth.toFixed(1)}' WIDE  (STREET TREES)`,
        ring: verge, areaSqFt: ringArea(verge.coordinates.slice(0, -1)), impervious: false,
        note:
          'Landscaped strip between the back of kerb and the sidewalk, within the dedicated ' +
          'right-of-way. Street tree species, spacing and clear distances are set by the ' +
          "Landscape Manual and by DPW&T; this shows the STRIP, not a planting schedule.",
      })
    }

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
      dedicated != null && dedicated > 0
        ? `The apron runs ${apronRun.toFixed(2)} ft from the front property line to the `
          + `right-of-way line — the strip DEDICATED TO PUBLIC USE, dimensioned on the recorded `
          + `plat — and flares ${APRON_FLARE_FT} ft each side. The plat draws the existing `
          + `pavement centreline but does not dimension its offset, so the edge of pavement is not `
          + `transcribed and the apron ends at the right-of-way line.`
        : `The front lot line is ${toCentrelineFt.toFixed(0)} ft from the county street centreline, `
          + `measured. NO DEDICATION WIDTH WAS SUPPLIED, so the apron runs `
          + `${apronRun.toFixed(0)} ft to an ASSUMED edge of pavement `
          + `${ASSUMED_PAVEMENT_HALF_WIDTH_FT} ft off that centreline — an assumption with no `
          + `published source. Supply the plat's dedication width to replace it.`,
      `The sidewalk is ${SIDEWALK_WIDTH_FT} ft wide, set ${SIDEWALK_OFFSET_FT} ft INSIDE the front ` +
      'property line. Widths, flare and the pavement half-width are ordinary residential ' +
      'dimensions, NOT county-published values — the county publishes no pavement width and the ' +
      'DPW&T standard detail governs the apron.',
      'The apron is in the public right-of-way, so its area is impervious and counted but is not ' +
      'lot coverage. The sidewalk is on the lot and counts as both.')
  }

  assumptions.push(
    `Driveway ${DRIVEWAY_WIDTH_FT} ft and walk ${WALK_WIDTH_FT} ft wide. Prince George's County ` +
    'publishes SLOPE limits for both in Sec. 32-151 Table 4 but not widths; these are ordinary ' +
    'single-family dimensions and the approved Yocum Property plan letters a 5 ft walk. Confirm ' +
    'against the design before relying on the impervious area.',
    'The driveway runs perpendicular to the front lot line and stops at the wall in front of it. ' +
    'The leadwalk runs across the frontage from the driveway edge to the entrance.',
  )

  return {
    improvements,
    impervousAreaSqFt: Math.round(improvements.reduce((n, i) => n + i.areaSqFt, 0)),
    assumptions,
  }
}
