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
export const SIDEWALK_WIDTH_FT = 3
/**
 * The frontage section, given: 3 ft of concrete walk and a 4 ft planting strip
 * between the walk and the street — 7 ft in all across the property line.
 *
 * The walk sits INSIDE the line and the strip OUTSIDE it, which is what "the
 * land strip between the street and the sidewalk" describes.
 */
export const SIDEWALK_OFFSET_FT = 0
export const VERGE_WIDTH_FT = 4
/**
 * Length of the apron, measured ON THE LOT from the front property line.
 *
 * The apron is the flared head of the driveway and it STOPS AT THE PROPERTY
 * LINE — nothing here is drawn into the public street. Whatever is built beyond
 * that line is DPW&T's, to their standard detail, and is not this drawing's to
 * show.
 */
export const APRON_LENGTH_FT = 10

/**
 * Width of the curb and gutter section, ft.
 *
 * It was the literal 1.5 in the band call and the same 1.5 in the apron's
 * outward reach, so the two agreed only by coincidence. The apron has to land
 * ON the curb, which means one figure describes both.
 */
export const CURB_WIDTH_FT = 1.5

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
/**
 * Front stoop, 8'-0" x 4'-0", dimensioned on the architectural plan. The plan
 * letters 14'-0" | 8'-0" | 14'-0" across the 36 ft main house, so the stoop is
 * CENTRED ON THE MAIN HOUSE — not on the whole footprint, which includes the
 * garage at one end.
 */
export const STOOP_WIDTH_FT = 8
/**
 * 4'-0" deep, from the architectural plan's front concrete stoop detail. It
 * was 5 ft here, which is a guess where a dimension exists.
 */
export const STOOP_DEPTH_FT = 4

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

/** Even-odd point-in-polygon. EPSG:2248 feet. */
function pointInPoly(p: Position, poly: readonly Position[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > p[1]) !== (yj > p[1])
        && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi || 1e-9) + xi) inside = !inside
  }
  return inside
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
  /** Overall footprint width along the front, ft — from the architecture. */
  footprintWidthFt?: number | null
  /** Attached garage width, ft. The driveway is centred on it. */
  garageWidthFt?: number | null
  dedicationWidthFt?: number | null
  /**
   * The curb, gutter and walk are ALREADY BUILT on this frontage.
   *
   * Drawn as PROPOSED they read as work in this contract, which on a built
   * street is wrong twice over: it prices work nobody is doing and it invites a
   * reviewer to check a DPW&T determination that has already been made on the
   * ground. Set, they are lettered EXISTING and the apron is described as tying
   * into them rather than as building them.
   */
  frontageExisting?: boolean | null
  /**
   * Distance from the front property line OUT to the gutter face, where the
   * sheet draws its own frontage section instead of this module's.
   *
   * The subdivision sheet drops the walk, strip and curb derived here and draws
   * one continuous section across all the lots — and it lays that section out
   * differently: the walk goes OUTSIDE the front property line there, so its
   * gutter face is 8.5 ft out rather than the 5.5 ft this module's own bands
   * put it at.
   *
   * The apron used to reach 8.5 ft by adding the sidewalk width to its outward
   * run, which happened to agree with the subdivision sheet and disagreed with
   * this module's own drawing by the same 3 ft. Two definitions of one section
   * that match only by arithmetic coincidence will come apart, and they did.
   * Whoever draws the curb now states where it is, and the apron ends there.
   */
  frontageOutFt?: number | null
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

  // THE FRONT LOT LINE IS THE WHOLE FRONTAGE RUN, NOT ITS FIRST EDGE.
  //
  // This took `edgeYards.indexOf('front')` and built every axis on that one
  // edge. Where the frontage is an arc the boundary of record carries it as a
  // chain of short chords — 11.4 ft each on the Fort Foote Road curve — so the
  // driveway, the apron and the frontage bands were all squared to an 11 ft
  // fragment whose normal is degrees off the frontage it belongs to, and the
  // bands spanned 11 ft of a 130 ft frontage.
  //
  // The run is walked from that edge in both directions while the neighbour is
  // also front, and the axis is the CHORD ACROSS THE RUN. Its normal is the
  // frontage's own direction rather than one chord's.
  const nEdges = lot.length
  let runStart = frontIdx, runEnd = frontIdx
  for (let k = 1; k < nEdges; k++) {
    const i = ((frontIdx - k) % nEdges + nEdges) % nEdges
    if (edgeYards[i] !== 'front') break
    runStart = i
  }
  for (let k = 1; k < nEdges; k++) {
    const i = (frontIdx + k) % nEdges
    if (edgeYards[i] !== 'front') break
    runEnd = i
  }
  // The vertices of the run, in order — the frontage as drawn, arc and all.
  const frontPts: Position[] = []
  for (let k = 0; ; k++) {
    const i = (runStart + k) % nEdges
    frontPts.push(lot[i])
    if (i === runEnd) { frontPts.push(lot[(i + 1) % nEdges]); break }
    if (k > nEdges) break
  }
  const a = frontPts[0], b = frontPts[frontPts.length - 1]
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  const inX = -dy / len, inY = dx / len
  /**
   * The point ON THE BOUNDARY at a given distance along the frontage.
   *
   * The chord cuts inside the arc — 3.4 ft at the middle of Lot 55's 130 ft
   * frontage on a 623 ft radius — so a driveway started on the chord begins
   * that far inside the lot and its apron starts inside the property line
   * instead of at it. Started on the boundary itself, the pavement meets the
   * lot line wherever the line actually runs.
   */
  const frontSegAt = (d: number): { point: Position; ux: number; uy: number } => {
    const along = (p: Position) => ((p[0] - a[0]) * (dx / len)) + ((p[1] - a[1]) * (dy / len))
    for (let i = 0; i < frontPts.length - 1; i++) {
      const p0 = frontPts[i], p1 = frontPts[i + 1]
      const s0 = along(p0), s1 = along(p1)
      if (d >= Math.min(s0, s1) - 1e-9 && d <= Math.max(s0, s1) + 1e-9) {
        const t = Math.abs(s1 - s0) < 1e-9 ? 0 : (d - s0) / (s1 - s0)
        const el = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1
        return {
          point: [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t],
          ux: (p1[0] - p0[0]) / el, uy: (p1[1] - p0[1]) / el,
        }
      }
    }
    return { point: [a[0] + (dx / len) * d, a[1] + (dy / len) * d], ux: dx / len, uy: dy / len }
  }
  const frontAt = (d: number): Position => frontSegAt(d).point

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
  // THE ENTRANCE AND THE DRIVEWAY ARE PLACED FROM THE ARCHITECTURE.
  //
  // Both were offsets picked to look right: the door at three-quarters of a
  // driveway width off centre, the driveway at one width off centre. The
  // architectural plan dimensions them.
  //
  //   46 ft footprint = 36 ft main house + 10 ft attached garage
  //   stoop  centred on the MAIN HOUSE      → 18 ft from its open end
  //   drive  centred on the GARAGE          → 41 ft from that same end
  //   footprint centre                       → 23 ft
  //
  // so the stoop sits 5 ft off centre away from the garage and the driveway
  // 18 ft off centre toward it. That is also what puts a usable gap between
  // them: at the old offsets they were two feet apart and the leadwalk kept
  // being clipped out of existence.
  const garageWidthFt = input.garageWidthFt ?? (hasGarage ? 10 : 0)
  const footWidthFt = input.footprintWidthFt ?? null
  const mainWidthFt = footWidthFt != null ? Math.max(0, footWidthFt - garageWidthFt) : null
  const doorOffset = mainWidthFt != null && footWidthFt != null
    ? mainWidthFt / 2 - footWidthFt / 2 + centreOffset
    : centreOffset - (hasGarage ? DRIVEWAY_WIDTH_FT * 0.75 : 0)
  const garageCentreOffset = mainWidthFt != null && footWidthFt != null
    ? mainWidthFt + garageWidthFt / 2 - footWidthFt / 2 + centreOffset
    : centreOffset + (hasGarage ? DRIVEWAY_WIDTH_FT : 0)
  // THE DRIVEWAY POSITION IS THE ONE SOURCE OF TRUTH, and everything at the
  // frontage follows IT.
  //
  // I moved it onto the garage centre, reasoning from the architecture, and it
  // had been in the right place before — the reasoning was sound and the result
  // was worse. What was actually wrong was that the apron and the gaps cut in
  // the walk and strip were keyed to the garage while the driveway was keyed to
  // the elevation, so the two disagreed by six feet.
  //
  // The fix is to key all of them to the same value, not to move the driveway.
  // THE DRIVEWAY IS AT LEAST AS WIDE AS THE DOOR IT SERVES.
  //
  // This was a flat 12 ft regardless of the garage, so a two-car garage got a
  // one-car driveway and an apron flared from it — 12 ft of pavement in front
  // of a 20 ft door, with the outer car crossing grass to reach its bay. The
  // apron, the curb depression and the gaps cut in the walk and strip all key
  // off this width, so widening it here widens all of them together, which is
  // the whole point of there being one value.
  //
  // `bandCentre` is a POSITION and is deliberately left alone: the comment
  // above records that moving the driveway to the garage centre was tried and
  // made things worse. Only the width changes.
  const driveWidthFt = hasGarage
    ? Math.max(DRIVEWAY_WIDTH_FT, garageWidthFt)
    : DRIVEWAY_WIDTH_FT
  // THE DRIVEWAY AND ITS FLARE STAY ON THE FRONTAGE.
  //
  // `centreOffset` follows the dwelling, and the dwelling can sit near one end
  // of a lot. On Lot 55 that put the driveway centre 123.9 ft along a 130.9 ft
  // frontage, so its right-hand edge and the apron flare beyond it crossed the
  // side lot line onto the neighbour — and the head corner, having no frontage
  // left to sit on, fell back to the chord 2.7 ft outside the boundary.
  //
  // Clamped to leave room for the flare at both ends. Where the frontage is too
  // narrow even for that, the centre stays put and the caller sees a driveway
  // that does not fit rather than one silently moved.
  const flareHalfFt = driveWidthFt / 2 + APRON_FLARE_FT
  const bandCentre = 2 * flareHalfFt <= len
    ? Math.min(Math.max(centreOffset + (hasGarage ? DRIVEWAY_WIDTH_FT : 0), flareHalfFt),
               len - flareHalfFt)
    : centreOffset + (hasGarage ? DRIVEWAY_WIDTH_FT : 0)
  void garageCentreOffset
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
  const faceDepth = faceDepthAt(bandCentre, driveWidthFt)

  const improvements: SiteImprovement[] = []

  // ── Driveway: front lot line to the dwelling face ────────────────────────
  //
  // Measured from where the driveway ACTUALLY STARTS. `faceDepth` is an offset
  // from the chord across the frontage, and on a curve the boundary stands
  // outside that chord, so a driveway that begins on the boundary and runs the
  // full `faceDepth` overruns the wall it is supposed to stop at by however far
  // the arc bulges.
  // THE DRIVEWAY IS ON `bandCentre` — the same line as the apron and the curb
  // depression.
  //
  // It was centred at the footprint centre plus one driveway width, while the
  // apron and the gaps cut in the sidewalk and planting strip were centred on
  // the GARAGE. On a 46 ft house with a 10 ft garage those are six feet apart,
  // so the apron sat beside the driveway instead of on the end of it and the
  // pavement never reached the street. One value now places all three.
  const driveStart: Position = frontAt(bandCentre)
  // THE HEAD OF THE DRIVEWAY SITS ON THE FRONT LOT LINE, WHEREVER IT RUNS.
  //
  // A rectangle laid on the chord's normal has a straight head, and a straight
  // head across a curved frontage puts corners on the wrong side of the
  // property line — two of them on Lot 54 and three on Lot 55, out in the
  // right-of-way where a private driveway is not this application's to build.
  //
  // So the head takes its two corners FROM THE BOUNDARY and the far end stays
  // square to the dwelling at the garage face. The result is a trapezium, which
  // is what a driveway meeting a curved street actually is.
  const driveHalfW = driveWidthFt / 2
  const head0 = frontAt(bandCentre - driveHalfW)
  const head1 = frontAt(bandCentre + driveHalfW)
  // At least 8 ft of driveway, measured from the deeper of the two head corners.
  const faceAt = Math.max(faceDepth, Math.max(proj(head0), proj(head1)) + 8)
  // ── THE HEAD OF THE DRIVEWAY LANDS ON THE WALL IT SERVES ─────────────────
  //
  // `faceDepth` is the SHALLOWEST point of the dwelling inside the driveway's
  // band, and squaring the far end off at that one depth is safe — it can never
  // clip the building — but on a house that is not parallel to the frontage it
  // only ever touches at a single corner. Everything either side of that corner
  // is a wedge of grass between the pavement and the garage door. Lot 55 held
  // its driveway ONE FOOT TEN INCHES off the wall at the right-hand corner,
  // Lot 54 eleven inches, and on a drawing at 1" = 20' that is a visible gap
  // between a car and the door it is supposed to drive through.
  //
  // So each far corner is found by walking IN from its own head corner until it
  // meets the footprint. The two corners land at different depths, the head
  // follows the wall, and the driveway abuts the house the whole way across.
  // Where a corner misses the building altogether — a driveway wider than the
  // face it serves — that corner keeps the old squared-off depth, which is the
  // right answer for pavement that is running past the house rather than into
  // it.
  const hitFootprint = (origin: Position): number | null => {
    let best: number | null = null
    for (let i = 0; i < fp.length; i++) {
      const p0 = fp[i], p1 = fp[(i + 1) % fp.length]
      const ex = p1[0] - p0[0], ey = p1[1] - p0[1]
      // origin + in*t = p0 + e*u  →  solve the 2x2.
      const den = inX * (-ey) - inY * (-ex)
      if (Math.abs(den) < 1e-9) continue
      const rx = p0[0] - origin[0], ry = p0[1] - origin[1]
      const t = (rx * (-ey) - ry * (-ex)) / den
      const u = (inX * ry - inY * rx) / den
      if (t <= 0 || u < -1e-9 || u > 1 + 1e-9) continue
      if (best == null || t < best) best = t
    }
    return best
  }
  const farCorner = (head: Position): Position => {
    const hit = hitFootprint(head)
    const depth = hit == null ? faceAt : Math.max(proj(head) + hit, proj(head) + 8)
    const run = depth - proj(head)
    return [head[0] + inX * run, head[1] + inY * run]
  }
  const drive: Ring = { coordinates: [
    head0, head1,
    farCorner(head1), farCorner(head0),
    head0,
  ] }
  improvements.push({
    id: 'driveway', kind: 'Driveway',
    label: `PROPOSED DRIVEWAY  ${driveWidthFt}' WIDE`,
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
  // THE WALK RUNS EDGE TO EDGE, ENTERING NEITHER.
  //
  // It was measured from the driveway's CENTRELINE to the door, so half the
  // driveway width of concrete was drawn over the asphalt, and it ran under the
  // stoop at the other end. A leadwalk starts where the driveway stops and ends
  // where the stoop starts; if those two touch there is nothing to draw.
  const driveHalf = driveWidthFt / 2
  const stoopHalf = STOOP_WIDTH_FT / 2
  const driveLo = bandCentre - driveHalf, driveHi = bandCentre + driveHalf
  const stoopLo = doorOffset - stoopHalf, stoopHi = doorOffset + stoopHalf
  // Which side of the driveway the entrance is on decides the direction, and
  // the walk spans the GAP between them exactly.
  //
  // Iterating a clip against the driveway rectangle suppressed the walk on both
  // lots: the two abut at a shared coordinate and a point-in-polygon test on a
  // shared vertex is a coin toss. The gap is arithmetic — stoop edge to
  // driveway edge — so it is computed once and inset a hair at each end.
  const doorLeftOfDrive = doorOffset < bandCentre
  const driveEdgeNear = doorLeftOfDrive ? driveLo : driveHi
  const stoopEdgeNear = doorLeftOfDrive ? stoopHi : stoopLo
  const gapFt = Math.abs(driveEdgeNear - stoopEdgeNear)
  const faceAtDoor = faceDepthAt(doorOffset, WALK_WIDTH_FT)

  if (gapFt >= 1.5) {
    const INSET = 0.1
    const dir = driveEdgeNear > stoopEdgeNear ? 1 : -1
    const lo = stoopEdgeNear + dir * INSET
    const hi = driveEdgeNear - dir * INSET
    const span = Math.abs(hi - lo)
    const midAlong = (lo + hi) / 2
    // At the STOOP's depth, so the walk meets the stoop and does not straddle
    // the wall it runs past.
    const standoff = faceAtDoor - STOOP_DEPTH_FT / 2
    const wCentre: Position = [
      a[0] + (dx / len) * midAlong + inX * standoff,
      a[1] + (dy / len) * midAlong + inY * standoff,
    ]
    const walk = rectFromAxis(wCentre, dx / len, dy / len, span, WALK_WIDTH_FT)
    improvements.push({
      id: 'walk', kind: 'Walk',
      label: `CONCRETE WALK  ${WALK_WIDTH_FT}' WIDE`,
      ring: walk, areaSqFt: ringArea(walk.coordinates.slice(0, -1)), impervious: true,
      note:
        `Leadwalk from the edge of the driveway to the stoop, ${span.toFixed(0)} ft. Lateral ` +
        `pitch ${TABLE_4_SLOPES.walkLateralMax} max, longitudinal ` +
        `${TABLE_4_SLOPES.walkLongitudinalMax} max. ${TABLE_4_SLOPES.citation}.`,
    })
  } else {
    assumptions.push(
      'No leadwalk is drawn: the driveway reaches the stoop, so there is no gap for a walk.')
  }
  // The stoop sits OUTSIDE the front wall, abutting it — centred on the wall
  // line it pushed half its depth into the dwelling and double-counted its area
  // as both building footprint and paving.
  {
    const stoop = rectFromAxis(
      [a[0] + (dx / len) * doorOffset + inX * (faceAtDoor - STOOP_DEPTH_FT),
       a[1] + (dy / len) * doorOffset + inY * (faceAtDoor - STOOP_DEPTH_FT)],
      inX, inY, STOOP_DEPTH_FT, STOOP_WIDTH_FT)
    improvements.push({
      id: 'stoop', kind: 'Stoop',
      label: `CONCRETE STOOP  ${STOOP_WIDTH_FT}' x ${STOOP_DEPTH_FT}'`,
      ring: stoop, areaSqFt: ringArea(stoop.coordinates.slice(0, -1)), impervious: true,
      note:
        'Front concrete stoop at the entrance, met by the leadwalk. Riser count and handrail per ' +
        'the architectural plans and the building code.',
    })
  }
  // ── The frontage ─────────────────────────────────────────────────────────
  //
  // THE SECTION AS THE PLAT TRANSCRIPTION GIVES IT — walk in, strip out.
  //
  //   0 … 3 ft IN     concrete sidewalk, inside the front property line
  //   0 … 4 ft OUT    planting strip, between the walk and the street
  //   4 … 5.5 ft OUT  curb and gutter, then the travelled way
  //
  // Both bands were built INWARD, which put the walk and the strip 4 to 7 ft
  // inside the lot — in the 10 ft public utility easement, where neither
  // belongs — and left the 20 ft strip dedicated to public use as bare paper.
  // The curb then sat 1.5 ft off the LOT line rather than at the street, and
  // the apron, reaching 1.5 ft out and 2.5 ft in, spanned neither: it stopped
  // short of the curb at one end and short of the walk at the other, so a car
  // left the driveway and crossed grass to reach the road.
  //
  // The frontage section is a GIVEN dimension on the plat record — 3 ft walk,
  // 4 ft strip, 7 ft overall — and the apron is now sized from it rather than
  // from a pair of independent constants.
  const outX = -inX, outY = -inY
  {
    const ux = dx / len, uy = dy / len
    // `from` is measured INWARD from the property line; negative runs out.
    const band = (from: number, width: number, id: string,
                  kind: SiteImprovement['kind'], label: string,
                  impervious: boolean, note: string) => {
      const ring: Ring = { coordinates: [
        [a[0] + inX * from, a[1] + inY * from],
        [b[0] + inX * from, b[1] + inY * from],
        [b[0] + inX * (from + width), b[1] + inY * (from + width)],
        [a[0] + inX * (from + width), a[1] + inY * (from + width)],
        [a[0] + inX * from, a[1] + inY * from],
      ] }
      improvements.push({
        id, kind, label, ring,
        areaSqFt: ringArea(ring.coordinates.slice(0, -1)), impervious, note,
      })
    }
    const ex = input.frontageExisting ? 'EXISTING ' : ''
    band(0, SIDEWALK_WIDTH_FT, 'sidewalk', 'Sidewalk',
      `${ex}CONCRETE SIDEWALK  ${SIDEWALK_WIDTH_FT}' WIDE`, true,
      input.frontageExisting
        ? 'Existing public sidewalk across the frontage. Protect in place; where it is disturbed '
          + 'by the driveway apron it is reconstructed to DPW&T standard in line and grade.'
        : 'Public sidewalk across the frontage, inside the front property line. Whether it is to '
          + 'be built, reconstructed or waived is a DPW&T determination at street construction '
          + 'permit.')
    band(-VERGE_WIDTH_FT, VERGE_WIDTH_FT, 'verge', 'Verge',
      `${ex}PLANTING STRIP  ${VERGE_WIDTH_FT}' WIDE  (STREET TREES)`, false,
      'Landscaped strip between the sidewalk and the curb, in the strip dedicated to public use. ' +
      'Street tree species, spacing and clear distances are set by the Landscape Manual and by ' +
      'DPW&T; this shows the STRIP, not a planting schedule.')
    band(-(VERGE_WIDTH_FT + CURB_WIDTH_FT), CURB_WIDTH_FT, 'curb', 'Sidewalk',
      `${ex}CURB AND GUTTER`, true,
      `Curb and gutter at the street face of the planting strip, ${VERGE_WIDTH_FT} ft outside the ` +
      'front property line, where the frontage meets the travelled way. Depressed through every ' +
      'driveway apron per DPW&T STD. 300.01 note 6.')

    // The apron: at the curb it is the full flared width, narrowing inward to
    // the driveway it meets.
    //
    // AN APRON MEETS THE KERB SQUARE, so it is built on the LOCAL direction of
    // the front lot line where the driveway crosses it — not on the chord that
    // spans the whole frontage. On Lot 54 the chord spans 173 ft of Fort Foote
    // Road, an 87 ft tangent and nine chords of the curve, and its normal is
    // far enough off the line at the driveway that the apron finished 4.7 ft
    // shy of the gutter: a car left the pavement onto the planting strip.
    //
    // The driveway keeps the chord's normal, because it has to arrive square at
    // a garage door that is set out from the envelope. An apron slightly skewed
    // to the driveway it serves is what a real one does on a curve.
    const alongPt: Position = driveStart
    const localSeg = frontSegAt(bandCentre)
    const apUx = localSeg.ux, apUy = localSeg.uy
    // Inward, on the same side of the line as the lot: the run chord's inward
    // normal decides the sign, so a reversed segment cannot flip the apron.
    const flip = (-apUy * inX + apUx * inY) < 0 ? -1 : 1
    const apInX = -apUy * flip, apInY = apUx * flip
    const apOutX = -apInX, apOutY = -apInY
    const hw = driveWidthFt / 2, hwFlared = hw + APRON_FLARE_FT
    // THE APRON SPANS THE SECTION — gutter face to the driveway — AND STOPS
    // AT THE GUTTER.
    //
    // A car must never leave the driveway onto grass, but neither may the apron
    // be drawn into the travelled way: past the gutter the surface is the
    // county's road, not this contract's apron, and a paved rectangle lapping
    // the street reads as a proposed widening nobody applied for.
    //
    // The outward reach is the part of the section that lies OUTSIDE the front
    // property line, and only two bands do:
    //
    //   0 … 3 ft IN     concrete sidewalk   ← INSIDE the line
    //   0 … 4 ft OUT    planting strip
    //   4 … 5.5 ft OUT  curb and gutter, then the travelled way
    //
    // It read `SIDEWALK_WIDTH_FT + VERGE_WIDTH_FT + CURB_WIDTH_FT` — 8.5 ft —
    // which counted the sidewalk twice: once inward, where it belongs and where
    // `APRON_IN_FT` already laps it, and again outward, where there is no
    // sidewalk to cross. That put the apron 3 ft past the gutter face and into
    // Fort Foote Road. The outward reach is the verge and the curb, 5.5 ft, so
    // the apron ends exactly at the edge of pavement.
    const APRON_OUT_FT = input.frontageOutFt ?? (VERGE_WIDTH_FT + CURB_WIDTH_FT)
    const APRON_IN_FT = SIDEWALK_WIDTH_FT
    const apron: Ring = { coordinates: [
      [alongPt[0] + apUx * hwFlared + apOutX * APRON_OUT_FT,
       alongPt[1] + apUy * hwFlared + apOutY * APRON_OUT_FT],
      [alongPt[0] - apUx * hwFlared + apOutX * APRON_OUT_FT,
       alongPt[1] - apUy * hwFlared + apOutY * APRON_OUT_FT],
      [alongPt[0] - apUx * hw + apInX * APRON_IN_FT, alongPt[1] - apUy * hw + apInY * APRON_IN_FT],
      [alongPt[0] + apUx * hw + apInX * APRON_IN_FT, alongPt[1] + apUy * hw + apInY * APRON_IN_FT],
      [alongPt[0] + apUx * hwFlared + apOutX * APRON_OUT_FT,
       alongPt[1] + apUy * hwFlared + apOutY * APRON_OUT_FT],
    ] }
    improvements.push({
      id: 'apron', kind: 'Apron',
      label: input.frontageExisting
        ? `PROPOSED ${(driveWidthFt + 2 * APRON_FLARE_FT).toFixed(0)}' DRIVEWAY APRON — TIE TO `
          + 'EXISTING CURB, GUTTER AND STREET IN LINE AND GRADE'
        : `PROPOSED ${(driveWidthFt + 2 * APRON_FLARE_FT).toFixed(0)}' DRIVEWAY APRON  `
          + 'PER DPW&T STANDARD',
      ring: apron, areaSqFt: ringArea(apron.coordinates.slice(0, -1)), impervious: true,
      note:
        'Driveway apron at the front property line, at street level, between the curb and the ' +
        'driveway. DPW&T standard detail governs the depression, jointing and curb cut; the ' +
        'depressed curb section applies here per STD. 300.01 note 6.',
    })

    assumptions.push(
      `Frontage section: ${SIDEWALK_WIDTH_FT} ft concrete walk INSIDE the front property line, ` +
      `${VERGE_WIDTH_FT} ft planting strip OUTSIDE it between the walk and the street, then curb ` +
      'and gutter — all within the 20 ft strip dedicated to public use. Given dimensions, not ' +
      'derived from a published standard.',
      `The apron spans the frontage section — ${APRON_OUT_FT} ft out across the planting strip ` +
      `and the curb and gutter to the edge of pavement, and ${APRON_IN_FT} ft in across the walk ` +
      `to the driveway — flaring ${APRON_FLARE_FT} ft each side at the curb, so the paved surface ` +
      'is continuous from the travelled way to the garage and stops at it.',
      'The walk, strip and apron are inside the property line, so their area is impervious AND ' +
      'counts toward lot coverage. The planting strip is not impervious.')
  }
  assumptions.push(
    `Driveway ${driveWidthFt} ft and walk ${WALK_WIDTH_FT} ft wide. The driveway is sized to the ` +
    `${garageWidthFt} ft garage door it serves, not to a fixed width. Prince George's County ` +
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
