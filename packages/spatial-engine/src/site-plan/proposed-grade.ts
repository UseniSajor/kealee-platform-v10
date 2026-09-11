/**
 * The proposed ground surface, and the contours that describe it.
 *
 * ── What is being designed ──────────────────────────────────────────────────
 *
 * A grading plan is a SURFACE, and every proposed contour on the sheet is a
 * level line cut through it. Drawing proposed contours by hand — sketching
 * plausible curves near the existing ones — produces a picture of a grading
 * plan and not a grading plan: the lines do not close, they do not agree with
 * the spot elevations, and no volume can be taken off them.
 *
 * So the surface is defined first, as a function of position, and the contours
 * are extracted from it. They agree with the finished floor elevations, with
 * the swale invert and with each other by construction, because all of them are
 * readings of the same surface.
 *
 * ── The design ──────────────────────────────────────────────────────────────
 *
 *   front lot line                    street grade
 *   → face of house                   RISES to the pad, so the front yard drains
 *   across the dwelling               level pad, 0.5 ft below the finished floor
 *   → 10 ft behind it                 falls 2%, positive drainage off the walls
 *   → tie line at the rear            a single gradual slope to existing ground
 *   beyond the tie line               existing ground, untouched
 *
 * THE FRONT YARD IS NOT FLAT. It was built dead level at street grade in the
 * first version, on a literal reading of "street level up to the face of the
 * house", and that is not a grading plan: a level front yard sheds nowhere, and
 * a level surface produces NO CONTOURS, so the front two-thirds of every lot
 * came out blank while the proposed contours bunched at the rear.
 *
 * The front of the dwelling stands 2 ft above the street — the finished floor —
 * and the ground falls from the house to the street across the front yard. That
 * is where the drainage comes from, and it is what puts contours across the
 * front of the lot where a reviewer expects to read them.
 *
 * It also costs far less fill: the level pad only spans the dwelling and its
 * drainage apron, instead of a plateau carried 60 to 90 ft into ground that
 * falls away beneath it.
 *
 * ── What this needs, and what it does not ───────────────────────────────────
 *
 * It does NOT need a field survey. A survey fixes where the EXISTING ground is;
 * the proposed surface is a design decision and can be made now. What the
 * survey changes is the tie: the line where proposed meets existing, and the
 * cut and fill either side of it. Those are reported as computed FROM COUNTY
 * MAPPING, so a reviewer knows which half of the drawing is design and which
 * half is a measurement waiting to be refined.
 */

import type { Position, Ring } from './site-twin'

export interface ProposedGradeInput {
  /** The lot, as a closed or open ring. */
  lot: Position[]
  /** The front lot line, vertex by vertex. */
  frontPath: Position[]
  /** The dwelling footprint, so the pad can reach its rear face. */
  footprint: Position[] | null
  /** Street grade at this lot's frontage, ft. The pad is built at it. */
  streetElFt: number
  /** Existing ground elevation anywhere on the lot. */
  existingElAt: (p: Position) => number | null
  /**
   * Where the proposed surface must return to existing ground, measured inward
   * from the front lot line, ft. The rear easement's near edge: the swale is
   * built in that strip and the ground behind it is not this project's.
   */
  tieDepthFt: number
  /** Positive drainage away from the dwelling before the slope starts, ft. */
  apronFt?: number
  /**
   * The graded bench in the REAR yard, ft measured out from the dwelling.
   *
   * The drainage apron is 10 ft all round, which is what a foundation needs and
   * is nobody's back garden: behind the house the ground starts falling to meet
   * existing grade 10 ft off the wall, and on a lot that drops 8 ft to the rear
   * that is the whole rear yard gone to slope.
   *
   * This carries the apron OUT on the rear side — level within its 2% fall,
   * usable, and tying out beyond it instead of against the house. It widens
   * from the front face of the dwelling to the rear face, so the bench wraps
   * the back and the rear halves of both side yards rather than appearing at a
   * step somewhere behind the building line.
   *
   * It costs fill, and the fill is at the far end where the ground is lowest.
   * The caller sizes it: how far out it can go before the remaining ground
   * cannot tie out at 3:1, and how close it may come to a recorded easement,
   * are both decisions about a particular lot.
   */
  rearBenchFt?: number
  /**
   * How far the REAR grading is carried out from the dwelling, ft.
   *
   * The transition off the back of the pad is run out to this distance instead
   * of the 40 ft default, so the same drop is spread over more ground. On the
   * drawing that is the whole point of it: the proposed contours behind the
   * house stop being a tight band a few feet off the wall and open out across
   * the rear yard, which is what a flatter grade looks like when it is drawn.
   *
   * It does not change WHERE the ground has to end up — existing grade at the
   * tie is existing grade — only how gently it gets there, and the extra ground
   * held up on the way is fill.
   */
  rearGradeExtentFt?: number
  /**
   * A low retaining wall behind the dwelling, taking the drop a 3:1 slope
   * cannot.
   *
   * Where the ground falls away faster than a lawn can be graded there are
   * three answers: run the slope out further (more fill and more disturbed
   * area), plant a ground cover instead of grass, or retain it. A wall is the
   * one that keeps the graded area small, and on a lot whose rear falls 7 to 9
   * ft off the pad it is usually the right one.
   *
   * `atFt` is measured from the FOOTPRINT, so the wall follows the house.
   * Keep `heightFt` at or under 4 ft: past that Prince George's County wants a
   * separate building permit and an engineered design, which is a different
   * deliverable from a grading plan.
   */
  retainingWall?: { atFt: number; heightFt: number } | null
  /**
   * Finished floor elevation, ft. The pad is set just below it.
   *
   * Without this the pad has nothing to be level AT: the street grade is the
   * datum for the front lot line, not for the ground the house stands on.
   */
  finishedFloorElFt: number

  /**
   * The elevation of the graded pad, overriding the default of finished floor
   * less 0.5 ft.
   *
   * ── Why a floodplain needs this ─────────────────────────────────────────
   *
   * The default couples the pad to the finished floor, which is correct for
   * slab-on-grade: raise the floor and the ground under it comes with it. In a
   * floodplain that coupling is the problem. The floor has to be raised above
   * the base flood elevation, and if the pad follows it up, every cubic yard
   * of that lift is fill placed below the flood surface — displacing storage,
   * raising the water on the neighbours, and requiring compensatory excavation
   * that a lot of this size cannot supply.
   *
   * An elevated foundation — a vented crawlspace, a stem wall with flood
   * openings, or piers — puts the floor where the code requires it and leaves
   * the ground where it is. Passing the existing grade here is what lets the
   * surface model that, so the earthwork and the floodplain impact reported
   * downstream of this function are the ones the design actually produces.
   */
  padElFt?: number
}

export interface ProposedSurface {
  elevationAt: (p: Position) => number | null
  /** Elevation of the level pad the dwelling stands on, ft. */
  padElFt: number
  /** Where the pad starts — the front face of the dwelling, ft in from the front. */
  padStartFt: number
  /** Where the pad ends, ft in from the front line. */
  padDepthFt: number
  tieDepthFt: number
  /** Fall across the front yard, from the pad to the street, as a percentage. */
  frontYardSlopePct: number
  /**
   * Steepest slope anywhere the design moves the ground by more than 0.5 ft,
   * as a percentage.
   */
  maxSlopePct: number
  /** The wall as designed, for drawing and for the schedule. */
  retainingWall: { atFt: number; heightFt: number } | null
  /**
   * Fall built into the toe of the drainage apron, end to end, ft.
   *
   * The apron sheds water off the walls; this is what carries it AWAY once it
   * gets there. Zero means the toe is a level ring and anything arriving in it
   * from uphill has no outlet.
   */
  toeRingFallFt: number
  /** Where that steepest slope is, so it can be looked at rather than guessed. */
  maxSlopeAt: {
    depthFt: number; distToHouseFt: number; proposedEl: number; existingEl: number
  } | null
  /** Slope expressed the way a grading note does: n:1 horizontal to vertical. */
  maxSlopeRatio: string
  findings: string[]
}

/**
 * Maximum graded slope.
 *
 * 3:1 (33%) is the steepest a lawn is mown safely and the ordinary limit on a
 * residential grading plan. 2:1 is the absolute for a stabilised slope and
 * needs a note saying how it is held. Anything past that is a wall.
 */
export const MAX_MOWABLE_SLOPE_PCT = 33.3
export const MAX_STABILISED_SLOPE_PCT = 50

/** Even-odd point-in-polygon, EPSG:2248 feet. */
function inPoly(p: Position, poly: Position[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > p[1]) !== (yj > p[1])
        && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi || 1e-9) + xi) inside = !inside
  }
  return inside
}

function frontFrame(frontPath: Position[], lot: Position[]): {
  origin: Position; ux: number; uy: number; inX: number; inY: number
} | null {
  if (frontPath.length < 2) return null
  const a = frontPath[0], b = frontPath[frontPath.length - 1]
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  let inX = -dy / len, inY = dx / len
  // Inward is toward the lot's centroid, whichever way the front line runs.
  const n = lot.length
  const cx = lot.reduce((s, p) => s + p[0], 0) / n
  const cy = lot.reduce((s, p) => s + p[1], 0) / n
  if ((cx - a[0]) * inX + (cy - a[1]) * inY < 0) { inX = -inX; inY = -inY }
  return { origin: a, ux: dx / len, uy: dy / len, inX, inY }
}

export function buildProposedSurface(input: ProposedGradeInput): ProposedSurface | null {
  const lot = input.lot[0] === input.lot[input.lot.length - 1] ? input.lot.slice(0, -1) : input.lot
  const frame = frontFrame(input.frontPath, lot)
  if (!frame) return null
  const { origin, inX, inY } = frame
  const depthOf = (p: Position) => (p[0] - origin[0]) * inX + (p[1] - origin[1]) * inY

  const apron = input.apronFt ?? 10
  // The pad sits 0.5 ft below the finished floor: enough exposed foundation to
  // keep the sill plate clear of the ground and to flash the wall, and not so
  // much that the front steps become a flight.
  const PAD_BELOW_FF_FT = 0.5
  const padElFt = input.padElFt ?? input.finishedFloorElFt - PAD_BELOW_FF_FT
  const padStartFt = input.footprint?.length ? Math.min(...input.footprint.map(depthOf)) : 0
  const padDepthFt = input.footprint?.length
    ? Math.max(...input.footprint.map(depthOf)) + apron
    : apron
  const tieDepthFt = Math.max(padDepthFt + 5, input.tieDepthFt)

  const findings: string[] = []
  let maxSlopePct = 0
  let maxSlopeAt: {
    depthFt: number; distToHouseFt: number; proposedEl: number; existingEl: number
  } | null = null

  // 2% fall across the drainage apron behind the dwelling — the figure the
  // design notes already carry for the first 10 ft off a wall.
  const APRON_FALL_PCT = 2
  const apronFall = (apron * APRON_FALL_PCT) / 100
  // THE FALL THE FRONT YARD ACTUALLY GETS BUILT AT.
  //
  // This read the pad top against the front lot line over the full depth, which
  // is not the surface anybody stands on: the first 10 ft off the wall is the
  // drainage apron and the yard proper starts at its edge, one apron-fall lower
  // and that much less far to run. Reported off the pad it said 5.0% on Lot 53
  // where the built plane is 6.5%, and the number that has to clear 2% is the
  // built one.
  const frontYardRunFt = Math.max(1, padStartFt - apron)

  // THE PAD IS A SKIRT AROUND THE DWELLING, NOT A TERRACE ACROSS THE LOT.
  //
  // Built as a depth band — level from the front face to the rear face of the
  // house — the pad ran the FULL WIDTH of every lot, so a 173 ft wide lot got a
  // 173 ft wide level platform on ground falling 4 to 5 ft beneath it. That is
  // where the 11,000 cubic yards of import came from, and it is not what a
  // grading plan does: a house is padded, a lot is not terraced.
  //
  // The pad now follows the FOOTPRINT — level under the dwelling, falling 2%
  // across a 10 ft drainage apron around it, then blended out to the natural
  // surface over a skirt. Everything beyond the skirt keeps its own grade.
  const BLEND_FT = 40
  const footprint = input.footprint?.length
    ? (input.footprint[0] === input.footprint[input.footprint.length - 1]
        ? input.footprint.slice(0, -1) : input.footprint)
    : null
  const distToFootprint = (p: Position): number => {
    if (!footprint) return Infinity
    let inside = false
    for (let i = 0, j = footprint.length - 1; i < footprint.length; j = i++) {
      const [xi, yi] = footprint[i], [xj, yj] = footprint[j]
      if ((yi > p[1]) !== (yj > p[1])
          && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi || 1e-9) + xi) inside = !inside
    }
    if (inside) return 0
    let best = Infinity
    for (let i = 0; i < footprint.length; i++) {
      const a2 = footprint[i], b2 = footprint[(i + 1) % footprint.length]
      const vx = b2[0] - a2[0], vy = b2[1] - a2[1]
      const L2 = vx * vx + vy * vy || 1
      const tt = Math.max(0, Math.min(1, ((p[0] - a2[0]) * vx + (p[1] - a2[1]) * vy) / L2))
      best = Math.min(best, Math.hypot(p[0] - (a2[0] + vx * tt), p[1] - (a2[1] + vy * tt)))
    }
    return best
  }

  /** The point on the footprint nearest p — the wall this point drains off. */
  const nearestOnFootprint = (p: Position): Position | null => {
    if (!footprint) return null
    let best: Position = footprint[0], bd = Infinity
    for (let i = 0; i < footprint.length; i++) {
      const a2 = footprint[i], b2 = footprint[(i + 1) % footprint.length]
      const vx = b2[0] - a2[0], vy = b2[1] - a2[1]
      const L2 = vx * vx + vy * vy || 1
      const tt = Math.max(0, Math.min(1, ((p[0] - a2[0]) * vx + (p[1] - a2[1]) * vy) / L2))
      const c: Position = [a2[0] + vx * tt, a2[1] + vy * tt]
      const dd = Math.hypot(p[0] - c[0], p[1] - c[1])
      if (dd < bd) { bd = dd; best = c }
    }
    return best
  }

  // How far a point lies OUTSIDE the dwelling's span along the frontage, ft.
  // Zero anywhere within its width; grows to either side.
  const alongOf = (p: Position) => (p[0] - origin[0]) * frame.ux + (p[1] - origin[1]) * frame.uy
  const fpAlong = footprint?.map(alongOf) ?? null
  const fpLo = fpAlong ? Math.min(...fpAlong) : 0
  const fpHi = fpAlong ? Math.max(...fpAlong) : 0
  const lateralOutside = (p: Position): number => {
    if (!fpAlong) return 0
    const a2 = alongOf(p)
    return a2 < fpLo ? fpLo - a2 : a2 > fpHi ? a2 - fpHi : 0
  }

  // ── THE PAD SLOPES. IT IS NOT A TABLE ────────────────────────────────────
  //
  // The pad was one level plane at finished floor minus 0.5 ft, and the apron
  // fell 2% off it as a cone. Two things followed from that and both were bad.
  //
  // The first is the fill. A level pad on a lot that drops 6 to 9 ft to the
  // rear has to be built up to its own high corner everywhere, and this set was
  // importing 4,740 cubic yards over four lots to do it.
  //
  // The second is subtler and it is what put water against these houses. A cone
  // measured off a level pad has ONE ELEVATION the whole way round its toe — a
  // level ring, 10 ft off the walls. It sheds water off the house perfectly and
  // then has nowhere to send it, so on every lot with ground standing above the
  // pad the runoff off that bank arrived in the ring and stood there.
  //
  // Both go away if the pad is a PLANE THAT FALLS. It falls at 2% down the
  // lot's own fall line, so the house steps down with the ground instead of
  // standing on a plinth cut out of it, the toe of the apron inherits that fall
  // and drains to the low corner, and the exposed foundation on the low side is
  // the walk-out this ground was always going to want.
  //
  // Which way the ground falls is MEASURED, not assumed to be the rear. Lot 56
  // falls sideways and Lot 54 falls back; a rule that said "toward the rear"
  // would have tilted one pad in four the wrong way, uphill.
  const PAD_FALL_PCT = 2
  const fpCentre: Position | null = footprint
    ? [footprint.reduce((s, q) => s + q[0], 0) / footprint.length,
       footprint.reduce((s, q) => s + q[1], 0) / footprint.length]
    : null
  /** The apron toe ring, used to read the fall line off existing ground. */
  const toeRing: Position[] = []
  if (footprint && fpCentre) {
    for (let i = 0; i < footprint.length; i++) {
      const a2 = footprint[i], b2 = footprint[(i + 1) % footprint.length]
      const ex = b2[0] - a2[0], ey = b2[1] - a2[1]
      const el = Math.hypot(ex, ey) || 1
      // Outward normal: the one pointing away from the centroid.
      let nx = -ey / el, ny = ex / el
      const mx = (a2[0] + b2[0]) / 2, my = (a2[1] + b2[1]) / 2
      if ((mx - fpCentre[0]) * nx + (my - fpCentre[1]) * ny < 0) { nx = -nx; ny = -ny }
      for (let t = 0; t <= 1.0001; t += 0.1) {
        toeRing.push([a2[0] + ex * t + nx * apron, a2[1] + ey * t + ny * apron])
      }
    }
  }
  // ── THE PAD FALLS FRONT TO REAR, SQUARE TO THE HOUSE ──────────────────────
  //
  // The direction was first taken from a plane fitted to existing ground round
  // the toe ring — the true fall line — and that is the wrong axis even though
  // it is the honest one. A fall line that runs diagonally across the house
  // tilts the FRONT WALL of the pad, and the front yard is referenced to the
  // pad edge at that wall: the datum then changed sideways along the frontage
  // faster than the yard fell toward the street, and 28 of 93 sampled points on
  // Lot 55 turned back at the house. The lot's fall line and the house's own
  // axes are two different frames and the pad has to be built in the latter.
  //
  // Square to the dwelling, the front wall sits at ONE elevation, the yard in
  // front of it is a clean plane to the street, and the pad still falls the
  // full depth of the house so the toe ring has its outlet at the low end.
  //
  // Which end is low is measured, not assumed. These four lots all drop to the
  // rear, which is also where the drainage easement is, but a lot that rises
  // behind the house wants the fall the other way and gets it.
  const padAxis = (() => {
    if (!footprint?.length || !fpCentre) return null
    // The front face: the footprint edge whose midpoint lies nearest the front
    // lot line. Its inward normal is the axis the pad falls along.
    let bestMid: Position | null = null, bestN: [number, number] | null = null, bd = Infinity
    for (let i = 0; i < footprint.length; i++) {
      const a2 = footprint[i], b2 = footprint[(i + 1) % footprint.length]
      const m: Position = [(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2]
      const dm = depthOf(m)
      if (dm < bd) {
        bd = dm
        const ex = b2[0] - a2[0], ey = b2[1] - a2[1]
        const el = Math.hypot(ex, ey) || 1
        let nx = -ey / el, ny = ex / el
        if ((fpCentre[0] - m[0]) * nx + (fpCentre[1] - m[1]) * ny < 0) { nx = -nx; ny = -ny }
        bestMid = m; bestN = [nx, ny]
      }
    }
    if (!bestMid || !bestN) return null
    const runs = footprint.map(q =>
      (q[0] - bestMid![0]) * bestN![0] + (q[1] - bestMid![1]) * bestN![1])
    const depth = Math.max(...runs)
    if (depth < 1) return null
    // Fall toward whichever end of the house the ground is already lower at.
    const rearMid: Position = [bestMid[0] + bestN[0] * depth, bestMid[1] + bestN[1] * depth]
    const zf = input.existingElAt(bestMid), zr = input.existingElAt(rearMid)
    const toRear = zf == null || zr == null ? true : zr <= zf
    return { mid: bestMid, nx: bestN[0], ny: bestN[1], depth, toRear }
  })()
  /**
   * The pad under a given point.
   *
   * `padElFt` — finished floor less 0.5 ft — governs at the HIGH end of the
   * pad, and it falls from there. Clamped to the footprint's own depth: past
   * the house the pad has ended and the plane must not carry on across the lot.
   */
  const padElAt = (p: Position): number => {
    if (!padAxis) return padElFt
    const r = (p[0] - padAxis.mid[0]) * padAxis.nx + (p[1] - padAxis.mid[1]) * padAxis.ny
    const rc = Math.max(0, Math.min(padAxis.depth, r))
    const from = padAxis.toRear ? rc : padAxis.depth - rc
    return padElFt - (PAD_FALL_PCT / 100) * from
  }

  /** Fall built into the pad end to end, ft — and so into the apron toe. */
  const padFallFt = padAxis ? (PAD_FALL_PCT / 100) * padAxis.depth : 0
  const toeRingFallFt = padFallFt

  // Measured at the pad edge IN FRONT OF THE DWELLING, which is where the yard
  // actually starts. With a sloping pad `padElFt` is the elevation at the
  // footprint's uphill corner, and on a lot that falls to the rear that corner
  // is not the front one — reading the yard's grade off it would report a fall
  // the ground in front of the house never gets built to.
  const padFrontEl = (() => {
    if (!footprint?.length) return padElFt
    let best = footprint[0], bd = Infinity
    for (const q of footprint) { const dq = depthOf(q); if (dq < bd) { bd = dq; best = q } }
    return padElAt(best)
  })()
  const frontYardSlopePct = padStartFt > 0
    ? ((padFrontEl - apronFall - input.streetElFt) / frontYardRunFt) * 100
    : 0
  const frontYardFallPerFt = frontYardSlopePct / 100

  const benchFt = Math.max(apron, input.rearBenchFt ?? apron)
  const reachFt = Math.max(0, input.rearGradeExtentFt ?? 0)
  const rearFaceForBenchFt = padDepthFt - apron
  const elevationAt = (p: Position): number | null => {
    const dp = distToFootprint(p)
    // Under the dwelling the pad IS the plane.
    if (dp <= 0) return padElAt(p)
    const d = depthOf(p)
    // ── HOW WIDE THE APRON IS HERE ───────────────────────────────────────────
    //
    // Ten feet at the front of the house, widening to the rear bench by the
    // back wall and staying there behind it. Ramped over the depth of the
    // dwelling rather than switched on at the rear face: a step in the apron
    // width is a step in the ground, and it would have run along the side yards
    // exactly where people walk.
    const wBench = benchFt <= apron ? 0
      : Math.max(0, Math.min(1,
          (d - padStartFt) / Math.max(1, rearFaceForBenchFt - padStartFt)))
    const apronHere = apron + (benchFt - apron) * wBench
    // ── THE APRON IS MEASURED FROM THE WALL, NOT FROM THE PAD PLANE ──────────
    //
    // `padElAt(p) - 2% x dp` looks right and cancels itself. The pad falls at 2%
    // down the fall line, so on the UPHILL face of the house the plane extended
    // outward RISES at 2% — exactly the rate the apron is falling — and the two
    // met at zero. Measured on the built surface the apron came out at 0.1% on
    // Lot 54, on a strip whose entire purpose is 2%.
    //
    // The pad elevation that governs an apron is the one at the WALL the water
    // is leaving, held fixed all the way out. Then the fall away from the house
    // is exactly 2% on every ray, and the toe still inherits the pad's tilt —
    // because the wall elevation itself changes as you walk round the house.
    // Both properties at once, which is what the tilt was for.
    const wall0 = nearestOnFootprint(p)
    const padHere = padElAt(wall0 ?? p)
    const padEdgeEl = padHere - (APRON_FALL_PCT / 100) * apronHere
    if (dp <= apronHere) return padHere - (APRON_FALL_PCT / 100) * dp

    const existing = input.existingElAt(p)
    if (existing == null) return null
    // ── ONE SURFACE, BLENDED BETWEEN TWO ENDS ────────────────────────────────
    //
    // Everything outside the drainage apron is a mix of exactly two things:
    //
    //   designEl   the graded yard — falls away from the apron toe at the
    //              front-yard grade, in every direction, never below the street
    //   tieEl      the pad let out to whatever the ground already is
    //
    // and `w` says how much of this particular spot is yard. In front of the
    // dwelling and within its own width it is all yard; behind it and out to
    // the sides it fades to the tie. Both ends equal the apron toe elevation at
    // dp = apron, so the surface is continuous there whatever `w` happens to be
    // — which is the property the previous arrangement did not have. Written as
    // a front branch and a rear branch, the two disagreed by 0.39 ft along the
    // line d = padStart beside every house, and the proposed contours crossing
    // that line came out of the extractor with a kink in them.
    const FRONT_TRANSITION_FT = 20
    // THE TAPER RAN THE WRONG WAY, AND IT RAN AGAINST THE HOUSE.
    //
    // It was `(padStart - d) / 20`: full design grade 20 ft out from the front
    // lot line, fading to EXISTING GROUND at the face of the dwelling. That is
    // backwards. Existing ground in front of these houses sits 5 to 7 ft below
    // the pad, so the fade pulled the finished surface DOWN as it approached
    // the wall and left a trough against the foundation — 14 of 124 sampled
    // points on Lot 54 drained back at the house from exactly this, all of them
    // on the line 15 ft out where the fade first bit.
    //
    // The yard holds full strength up to the face of the dwelling and fades out
    // BEHIND it, which is where existing ground should be taking over anyway.
    const wDepth = padStartFt > 0
      ? Math.max(0, Math.min(1, (padStartFt + FRONT_TRANSITION_FT - d) / FRONT_TRANSITION_FT))
      : 0
    // THE TAPER STARTS OUTSIDE THE YARD, NOT AT THE CORNER OF THE HOUSE.
    //
    // Two rules were tried here and both were wrong at one end. Tapering from
    // the corner of the dwelling let existing ground back in a few feet off the
    // wall, and existing ground can rise toward the street — that is what put
    // water back against Lots 53 and 56, at 32 and 33 ft off centre on houses
    // 46 ft wide. Switching the taper off in front of the house instead graded
    // the whole frontage: on Lot 55 that filled 13 ft of ground EIGHTY-ONE FEET
    // sideways from the dwelling and read as a 68% slope, on a lot 170 ft wide.
    //
    // The yard graded with the house is the dwelling's own width plus a margin
    // either side of it; the taper runs out from THERE.
    const FRONT_LATERAL_FT = 40
    const FRONT_YARD_MARGIN_FT = 15
    const wLateral = footprint
      ? Math.max(0, Math.min(1,
          1 - (Math.max(0, lateralOutside(p) - FRONT_YARD_MARGIN_FT) / FRONT_LATERAL_FT)))
      : 1

    // THE GRADED YARD IS A PLANE, NOT A BLEND.
    //
    // Reaching the front-yard grade by blending the pad out to a target left
    // the yard nearly level where it mattered most: the blend starts at the
    // apron toe with its target only inches below it, so the first stretch off
    // the foundation came out at 0.2% on Lot 54 — draining, but nothing a lawn
    // sheds water at, and under the 2% the notes on this sheet promise.
    //
    // Measured on `dp`, the distance to the dwelling, rather than on depth from
    // the front line: it then meets the apron exactly at its toe on every side
    // of the house, including round the front corners, where a plane measured
    // on depth alone goes flat.
    const designEl = Math.max(input.streetElFt,
      padEdgeEl - frontYardFallPerFt * (dp - apronHere))

    // THE TIE, run out as far as the drop requires. Held at a fixed 40 ft it
    // produced 58% and 69% slopes behind Lots 54 and 55, where the ground falls
    // 7 to 9 ft off the back of the pad — steeper than 2:1, which is a wall and
    // not a lawn. Running the transition out far enough to hold 3:1 costs fill
    // and buys a slope somebody can mow; a retaining structure is the other
    // answer and it is a decision for the designer, not a default.
    const drop = Math.abs(padEdgeEl - existing)
    // THE REAR TRANSITION IS RUN OUT AS FAR AS THE LOT IS ASKED TO GIVE IT.
    //
    // Ramped on the same weight as the bench, so it develops toward the rear
    // and leaves the front yard — which has its own designed grade to the
    // street — alone.
    const reachHere = reachFt > 0 ? apron + (reachFt - apron) * wBench : 0
    const blendFt = Math.max(BLEND_FT, drop * (100 / MAX_MOWABLE_SLOPE_PCT),
                             reachHere - apronHere)
    const t = Math.min(1, (dp - apronHere) / blendFt)
    const tieEl = padEdgeEl + (existing - padEdgeEl) * t

    // A LOW RETAINING WALL, where one is specified.
    //
    // Uphill of the wall the ground is held one wall-height above the natural
    // surface, so the slope from the pad down to the wall top is gentle.
    // Downhill of it the ground is the natural surface. The wall itself is the
    // step between them, which is exactly the discontinuity a wall IS — and it
    // is why the graded area stops at the wall instead of running out across
    // the lot.
    //
    // IT RETAINS BEHIND THE DWELLING AND NOWHERE ELSE.
    //
    // `dp` is the distance to the footprint in EVERY direction, so this branch
    // ringed the house: Lot 55's 3 ft wall was lifting the FRONT yard a foot
    // above the pad, 15 ft out from the front wall, and 23 of 107 sampled
    // points there drained straight back at the dwelling — the worst readings
    // on the whole set, at 25 to 31% the wrong way. The drawn wall never went
    // there. `THE WALL, DRAWN` keeps only the faces where the design is
    // actually holding ground up, so the line on the sheet ran along the rear
    // while the surface behaved as though it ran all the way round, and the
    // two disagreed by three feet of fill.
    //
    // The wall is behind the house. So is the ground it retains.
    const wall = input.retainingWall
    const rearFaceFt = padDepthFt - apron
    if (wall && wall.heightFt > 0 && d >= rearFaceFt) {
      if (dp <= wall.atFt) {
        const top = existing + wall.heightFt
        const t2 = Math.min(1, (dp - apronHere) / Math.max(1, wall.atFt - apronHere))
        return padEdgeEl + (top - padEdgeEl) * t2
      }
      return existing
    }

    return tieEl + (designEl - tieEl) * (wDepth * wLateral)
  }

  if (frontYardSlopePct < 2) {
    findings.push(
      `Front yard falls ${frontYardSlopePct.toFixed(1)}% from the dwelling to the street, under `
      + 'the 2% a graded lawn needs to drain. Either the finished floor comes up or the dwelling '
      + 'moves forward.')
  } else if (frontYardSlopePct > 10) {
    findings.push(
      `Front yard falls ${frontYardSlopePct.toFixed(1)}% from the dwelling to the street. It `
      + 'drains, but it is steep for a front lawn and a walk across it will want steps.')
  }

  // The steepest the transition gets, sampled across the lot rather than
  // assumed from the end points: a lot whose ground falls unevenly can be
  // gentle at the edges and steep in the middle.
  {
    const xs = lot.map(p => p[0]), ys = lot.map(p => p[1])
    const x0 = Math.min(...xs), x1 = Math.max(...xs)
    const y0 = Math.min(...ys), y1 = Math.max(...ys)
    // Sampled as an actual gradient on the finished surface, rather than
    // inferred from the end points of a band that no longer exists.
    const STEP = 8
    for (let gx = x0; gx <= x1; gx += STEP) {
      for (let gy = y0; gy <= y1; gy += STEP) {
        const p: Position = [gx, gy]
        if (!inPoly(p, lot)) continue
        const z0 = elevationAt(p)
        const zx = elevationAt([gx + STEP, gy])
        const zy = elevationAt([gx, gy + STEP])
        if (z0 == null || zx == null || zy == null) continue
        // ONLY WHERE THE GROUND IS ACTUALLY BEING REGRADED.
        //
        // Sampled across the whole lot this measured the EXISTING hillside —
        // the county mapping shows contours tightly packed along parts of this
        // frontage, so the natural ground reaches 55% in places and the metric
        // reported it as a graded slope that had to be retained. The number
        // that matters is the steepest slope THIS DESIGN creates.
        // Half a foot, not a tenth. Where the proposed surface only grazes the
        // existing one it INHERITS the natural gradient, and parts of this
        // frontage are a steep bank — the county mapping shows the contours
        // packed tight against the road. Counting those points reported the
        // hillside as a slope this design had cut, which it had not. The number
        // wanted here is the steepest slope on ground the design actually
        // MOVES.
        const e0 = input.existingElAt(p)
        if (e0 == null || Math.abs(z0 - e0) < 0.5) continue
        // A WALL IS NOT A SLOPE. The retained face is a vertical step by
        // design, and sampling a gradient across it reports the wall — which
        // is the whole point of building one. The face is excluded and the
        // wall is reported on its own terms: height, top and bottom.
        if (input.retainingWall) {
          const dw = Math.abs(distToFootprint(p) - input.retainingWall.atFt)
          if (dw <= 8) continue
        }
        const g = Math.hypot(zx - z0, zy - z0) / STEP
        const pct = g * 100
        if (pct > maxSlopePct) {
          maxSlopePct = pct
          maxSlopeAt = { depthFt: depthOf(p), distToHouseFt: distToFootprint(p),
                         proposedEl: z0, existingEl: e0 }
        }
      }
    }
  }

  if (maxSlopePct > MAX_STABILISED_SLOPE_PCT) {
    findings.push(
      `Graded slope reaches ${maxSlopePct.toFixed(0)}% (steeper than 2:1). A slope this steep is `
      + 'not a graded lawn — it needs a retaining structure or the tie line has to move back into '
      + 'the lot. Do not issue this grading without resolving it.')
  } else if (maxSlopePct > MAX_MOWABLE_SLOPE_PCT) {
    // STATED, NOT ASKED. Ground cover is the answer this set specifies for a
    // slope between 3:1 and 2:1, the limit is drawn on the sheet, and the note
    // goes with it — so this reports the decision rather than repeating the
    // question every run.
    findings.push(
      `Graded slope reaches ${maxSlopePct.toFixed(0)}% (${(100 / maxSlopePct).toFixed(1)}:1), `
      + 'steeper than the 3:1 a lawn is mown at and flatter than the 2:1 limit for a stabilised '
      + 'slope. GROUND COVER is specified on the slope side of the limit line drawn on the plan; '
      + 'it is not turf and it is not mown.')
  }

  const ratio = maxSlopePct > 0 ? (100 / maxSlopePct).toFixed(1) : '—'
  return {
    elevationAt,
    padElFt,
    padStartFt,
    padDepthFt,
    tieDepthFt,
    frontYardSlopePct,
    retainingWall: input.retainingWall ?? null,
    toeRingFallFt,
    maxSlopePct,
    maxSlopeAt,
    maxSlopeRatio: `${ratio}:1`,
    findings,
  }
}


export interface ExtractedContour {
  elevationFt: number
  path: Position[]
}

/**
 * Contours of a surface, by marching squares.
 *
 * The grid is sampled, each cell is tested against the contour level, and the
 * crossing segments are chained into polylines. Segments are joined end to end
 * with a tolerance of half a cell, which is what turns a cloud of little
 * segments into lines a drafter would recognise.
 *
 * Cells with any corner outside the clip polygon are skipped, so contours stop
 * at the lot line rather than being drawn across a neighbour's garden.
 */
export function extractContours(
  elevationAt: (p: Position) => number | null,
  clip: Position[],
  opts: { intervalFt?: number; cellFt?: number } = {},
): ExtractedContour[] {
  const interval = opts.intervalFt ?? 2
  const cell = opts.cellFt ?? 3
  const poly = clip[0] === clip[clip.length - 1] ? clip.slice(0, -1) : clip
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1])
  const x0 = Math.min(...xs), x1 = Math.max(...xs)
  const y0 = Math.min(...ys), y1 = Math.max(...ys)
  const nx = Math.max(2, Math.ceil((x1 - x0) / cell))
  const ny = Math.max(2, Math.ceil((y1 - y0) / cell))
  const dx = (x1 - x0) / nx, dy = (y1 - y0) / ny

  const z: (number | null)[][] = []
  for (let i = 0; i <= nx; i++) {
    z[i] = []
    for (let j = 0; j <= ny; j++) {
      const p: Position = [x0 + i * dx, y0 + j * dy]
      z[i][j] = inPoly(p, poly) ? elevationAt(p) : null
    }
  }

  const all: number[] = []
  for (const row of z) for (const v of row) if (v != null) all.push(v)
  if (!all.length) return []
  const lo = Math.ceil(Math.min(...all) / interval) * interval
  const hi = Math.floor(Math.max(...all) / interval) * interval

  const out: ExtractedContour[] = []
  for (let level = lo; level <= hi; level += interval) {
    const segs: [Position, Position][] = []
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const a = z[i][j], b = z[i + 1][j], c = z[i + 1][j + 1], d = z[i][j + 1]
        if (a == null || b == null || c == null || d == null) continue
        const px = x0 + i * dx, py = y0 + j * dy
        const corners: [Position, number][] = [
          [[px, py], a], [[px + dx, py], b], [[px + dx, py + dy], c], [[px, py + dy], d],
        ]
        const cross: Position[] = []
        for (let k = 0; k < 4; k++) {
          const [p1, v1] = corners[k], [p2, v2] = corners[(k + 1) % 4]
          if ((v1 < level) === (v2 < level)) continue
          const t = (level - v1) / (v2 - v1 || 1e-9)
          cross.push([p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t])
        }
        // Two crossings is the ordinary case.
        //
        // FOUR IS A SADDLE, AND IT HAS TO BE RESOLVED, NOT PAIRED IN ORDER.
        // `cross` comes out in edge order — bottom, right, top, left — so
        // joining 0-1 and 2-3 connects bottom to right and top to left whether
        // or not that is the way the surface actually runs. Half the time it is
        // the other diagonal, and the two segments drawn then CROSS EACH OTHER
        // inside the cell. That is one of the two things making these contours
        // criss-cross.
        //
        // The centre of the cell decides it, which is the standard resolution:
        // if the middle is above the level the high ground is joined, if below
        // the low ground is.
        if (cross.length === 2) segs.push([cross[0], cross[1]])
        else if (cross.length === 4) {
          const mid = (a + b + c + d) / 4
          if ((mid >= level) === (a >= level)) {
            segs.push([cross[0], cross[3]])
            segs.push([cross[1], cross[2]])
          } else {
            segs.push([cross[0], cross[1]])
            segs.push([cross[2], cross[3]])
          }
        }
      }
    }
    if (!segs.length) continue

    // Chain the segments into polylines.
    //
    // THE TOLERANCE IS AN EPSILON, NOT A FRACTION OF THE CELL.
    //
    // It was `max(dx, dy) * 0.6` — nearly four feet at a 6 ft cell. Marching
    // squares emits segments whose ends fall EXACTLY on the shared edge of two
    // cells, so the join needs no tolerance at all; what four feet of slack
    // bought was the chain jumping onto a DIFFERENT STRAND of the same contour
    // running through a neighbouring cell. That is the other reason these lines
    // criss-crossed, and it is where the right-angled Z-jogs came from: the
    // path ran out to one branch, hopped the gap, and came back.
    //
    // Exact ends want an exact test. A thousandth of a foot covers the
    // arithmetic and nothing else.
    const TOL = 1e-3
    // Endpoints are bucketed so a chain finds its neighbour by lookup instead of
    // rescanning every segment. The old loop restarted a full scan each time it
    // grew a path, which is fine at a 6 ft cell and quadratic-then-some at the
    // finer one this now runs at.
    const key = (p: Position) => `${Math.round(p[0] / TOL)}:${Math.round(p[1] / TOL)}`
    const ends = new Map<string, number[]>()
    const push = (p: Position, i: number) => {
      // Neighbouring buckets too: the two cells sharing an edge compute the
      // same crossing by different arithmetic, so the values agree to about a
      // part in 10^12 but need not land in the same bucket.
      const k = key(p)
      const list = ends.get(k)
      if (list) list.push(i)
      else ends.set(k, [i])
    }
    segs.forEach(([p, q], i) => { push(p, i); push(q, i) })
    const lookup = (p: Position): number[] => {
      const bx = Math.round(p[0] / TOL), by = Math.round(p[1] / TOL)
      const hits: number[] = []
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const l = ends.get(`${bx + ox}:${by + oy}`)
          if (l) hits.push(...l)
        }
      }
      return hits
    }
    const near = (p: Position, q: Position) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= TOL
    const used = new Array(segs.length).fill(false)
    for (let sIdx = 0; sIdx < segs.length; sIdx++) {
      if (used[sIdx]) continue
      used[sIdx] = true
      const path: Position[] = [segs[sIdx][0], segs[sIdx][1]]
      // Grow the tail, then the head. One pass each way: a contour is a simple
      // curve, so once neither end finds an unused neighbour it is complete.
      for (const atTail of [true, false]) {
        for (;;) {
          const endPt = atTail ? path[path.length - 1] : path[0]
          let found = -1, other: Position | null = null
          for (const k of lookup(endPt)) {
            if (used[k]) continue
            const [p, q] = segs[k]
            if (near(endPt, p)) { found = k; other = q; break }
            if (near(endPt, q)) { found = k; other = p; break }
          }
          if (found < 0 || !other) break
          used[found] = true
          if (atTail) path.push(other)
          else path.unshift(other)
        }
      }
      // A two-point stub is a rendering artefact, not a contour.
      if (path.length >= 3) out.push({ elevationFt: level, path: smooth(path) })
    }
  }
  return out
}

/**
 * Take the staircase off a marching-squares contour.
 *
 * The extractor walks a square grid, so every line it returns is built from
 * pieces of cell edges and reads as a flight of steps — which is what these
 * sheets were showing, right-angled jogs at the cell pitch, on a drawing whose
 * whole subject is a smooth surface. Existing county contours beside them are
 * smooth, and the difference is obvious and looks like a defect because it is.
 *
 * Chaikin's corner cut, twice. Each pass replaces every interior vertex with
 * two points a quarter and three quarters along its neighbours, which pulls the
 * line toward the curve the grid was sampling. It moves no point by more than
 * half a cell, so the contour stays where the surface put it: this is drafting,
 * not a change to the model, and the elevations, the earthwork and the checks
 * are all read off `elevationAt` rather than off these lines.
 *
 * Closed loops cycle so the join gets cut like any other corner. Open lines
 * keep their first and last point, which are on the clip boundary and belong
 * exactly where the extractor put them.
 */
function smooth(path: Position[], passes = 2): Position[] {
  const closed = path.length > 3
    && Math.hypot(path[0][0] - path[path.length - 1][0],
                  path[0][1] - path[path.length - 1][1]) <= 1e-3
  let pts = closed ? path.slice(0, -1) : path.slice()
  for (let n = 0; n < passes; n++) {
    if (pts.length < 3) break
    const next: Position[] = []
    if (!closed) next.push(pts[0])
    const last = closed ? pts.length : pts.length - 1
    for (let i = 0; i < last; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length]
      next.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25])
      next.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75])
    }
    if (!closed) next.push(pts[pts.length - 1])
    pts = next
  }
  return closed ? [...pts, pts[0]] : pts
}

export interface EarthworkResult {
  cutCubicYd: number
  fillCubicYd: number
  netCubicYd: number
  /** Area actually regraded, sq ft. */
  gradedAreaSqFt: number
}

/**
 * Cut and fill by grid summation.
 *
 * Every cell where proposed differs from existing contributes its depth times
 * its area. It is the ordinary average-end-area method reduced to a grid, and
 * at a 6 ft cell it is accurate enough to size a cost estimate and to say
 * whether the site balances — which is the question a grading plan is asked.
 */
export function earthwork(
  proposedAt: (p: Position) => number | null,
  existingAt: (p: Position) => number | null,
  clip: Position[],
  cellFt = 6,
  /**
   * The building footprint, EXCLUDED from the earthwork.
   *
   * The ground under a dwelling with a basement is not filled — it is
   * excavated, and the building occupies the void. Counting the volume between
   * existing grade and the pad beneath the footprint as site fill double-counts
   * it against the basement dig and overstates the import by the size of the
   * house.
   */
  exclude: Position[] | null = null,
): EarthworkResult {
  const poly = clip[0] === clip[clip.length - 1] ? clip.slice(0, -1) : clip
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1])
  const x0 = Math.min(...xs), x1 = Math.max(...xs)
  const y0 = Math.min(...ys), y1 = Math.max(...ys)
  let cut = 0, fill = 0, area = 0
  const cellArea = cellFt * cellFt
  for (let gx = x0; gx <= x1; gx += cellFt) {
    for (let gy = y0; gy <= y1; gy += cellFt) {
      const p: Position = [gx + cellFt / 2, gy + cellFt / 2]
      if (!inPoly(p, poly)) continue
      if (exclude?.length && inPoly(p, exclude)) continue
      const pz = proposedAt(p), ez = existingAt(p)
      if (pz == null || ez == null) continue
      const diff = pz - ez
      if (Math.abs(diff) < 0.05) continue
      area += cellArea
      if (diff > 0) fill += diff * cellArea
      else cut += -diff * cellArea
    }
  }
  return {
    cutCubicYd: Math.round(cut / 27),
    fillCubicYd: Math.round(fill / 27),
    netCubicYd: Math.round((fill - cut) / 27),
    gradedAreaSqFt: Math.round(area),
  }
}

/** A ring's area, sq ft. Shoelace. */
export function ringAreaSqFt(r: Ring): number {
  const c = r.coordinates
  let a = 0
  for (let i = 0, j = c.length - 1; i < c.length; j = i++) {
    a += (c[j][0] + c[i][0]) * (c[j][1] - c[i][1])
  }
  return Math.abs(a / 2)
}
