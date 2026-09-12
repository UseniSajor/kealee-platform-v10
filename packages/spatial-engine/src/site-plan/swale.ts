/**
 * Grass drainage swale — normal depth, velocity and capacity.
 *
 * ── Why a swale and not a pipe ──────────────────────────────────────────────
 *
 * The Maryland Stormwater Management Act of 2007 requires environmental site
 * design to the MAXIMUM EXTENT PRACTICABLE before structural conveyance is
 * used. A grass swale is an ESD conveyance under the MDE Design Manual; a
 * reinforced concrete trunk is not, and a designer who reaches for the pipe
 * first has to explain why the swale was impracticable.
 *
 * On this site the pipe was also the worse engineering. The four-lot system
 * delivers Q100 = 4.71 cfs at its low point, against a county MINIMUM pipe of
 * 15 in that Manning fills at under 12 in — and the two upper reaches ran at
 * 0.63 and 0.70 fps at the 100-year flow, far below the 2.5 to 3 fps a storm
 * drain needs to stay self-cleansing. A pipe that never runs full enough to
 * scour itself silts, and a silted pipe in a rear-yard easement is the one
 * nobody visits until it surcharges.
 *
 * A swale carries the same flow at a velocity that suits it, costs a fraction
 * of the pipe, is inspectable from the surface, and — unlike the pipe — is a
 * practice the stormwater concept can count.
 *
 * ── The hydraulics ──────────────────────────────────────────────────────────
 *
 * Trapezoidal section, normal depth by Manning:
 *
 *     Q = (1.49 / n) · A · R^(2/3) · S^(1/2)      (US customary)
 *
 * with A the flow area, P the wetted perimeter, R = A/P, and S the longitudinal
 * slope. Normal depth is solved by bisection because Manning has no closed form
 * in depth for a trapezoid.
 *
 * Roughness: n = 0.041 for a mown grass channel at the shallow depths these
 * flows produce. It is the ordinary value for the condition and it is STATED,
 * not buried — n is the single assumption a reviewer will want to see, since
 * capacity scales inversely with it.
 */

/** Mown grass, shallow flow. Stated on the sheet with the computation. */
export const SWALE_MANNING_N = 0.041

/**
 * Permissible velocity for an established grass channel on this soil.
 *
 * The MDE and NRCS ranges for a sod-forming grass on an erosion-resistant soil
 * sit around 4 to 5 fps. Five is the number this design is checked against, and
 * a reach that exceeds it needs lining rather than a bigger cross-section.
 */
export const SWALE_PERMISSIBLE_VELOCITY_FPS = 5.0

/**
 * The floor under a swale's longitudinal slope.
 *
 * Below about half a percent a grass channel ponds and becomes a wet swale,
 * which is a different practice with different maintenance. Where the ground
 * gives less than this the design says so instead of reporting a depth computed
 * from a slope the site does not have.
 */
export const SWALE_MIN_SLOPE_PCT = 0.5

export interface SwaleSection {
  /** Bottom width, ft. */
  bottomWidthFt: number
  /** Side slope, horizontal : 1 vertical. */
  sideSlopeZ: number
  manningN: number
}

export interface SwaleReachInput {
  id: string
  fromId: string
  toId: string
  lengthFt: number
  /** Cumulative drainage area at the downstream end, acres. */
  daCumAc: number
  q10Cfs: number
  q100Cfs: number
  /** Ground elevation at each end, ft. Slope is taken from these. */
  upstreamEl: number
  downstreamEl: number
  section?: Partial<SwaleSection>
}

export interface SwaleReachResult extends SwaleReachInput {
  section: SwaleSection
  slopePct: number
  /** Normal depth at the 100-year flow, ft. */
  depth100Ft: number
  velocity100Fps: number
  /** Water-surface width at the 100-year flow, ft. */
  topWidth100Ft: number
  /** Total width of the graded section including freeboard, ft. */
  sectionWidthFt: number
  /** Capacity at the design depth of the section, cfs. */
  capacityCfs: number
  /** Freeboard above the 100-year water surface, ft. */
  freeboardFt: number
  adequate: boolean
  /**
   * Invert of the swale bottom at each end, ft.
   *
   * Set by `designSwaleSystem` across the whole network, not by the reach: an
   * invert only means anything relative to the reach below it, and two reaches
   * meeting at a structure have to agree there or the profile has a step in it.
   * Undefined until the system has been solved.
   */
  invertUpFt?: number
  invertDownFt?: number
  /** Depth of cut from existing ground to the invert at each end, ft. */
  cutUpFt?: number
  cutDownFt?: number
  findings: string[]
}

/** Flow area of a trapezoid at depth d. */
function areaAt(d: number, s: SwaleSection): number {
  return d * (s.bottomWidthFt + s.sideSlopeZ * d)
}

/** Wetted perimeter of a trapezoid at depth d. */
function perimeterAt(d: number, s: SwaleSection): number {
  return s.bottomWidthFt + 2 * d * Math.sqrt(1 + s.sideSlopeZ * s.sideSlopeZ)
}

/** Manning discharge at depth d, cfs. */
export function dischargeAt(d: number, s: SwaleSection, slopeFtPerFt: number): number {
  if (d <= 0 || slopeFtPerFt <= 0) return 0
  const a = areaAt(d, s)
  const r = a / perimeterAt(d, s)
  return (1.49 / s.manningN) * a * Math.pow(r, 2 / 3) * Math.sqrt(slopeFtPerFt)
}

/**
 * Normal depth for a given discharge, ft.
 *
 * Bisection on a monotonic function — discharge rises with depth — over a range
 * wide enough for any residential swale. Returns the upper bound where the
 * section cannot pass the flow at all, so the caller sees an inadequate section
 * rather than a quietly clamped one.
 */
export function normalDepth(qCfs: number, s: SwaleSection, slopeFtPerFt: number): number {
  if (qCfs <= 0) return 0
  let lo = 0, hi = 6
  if (dischargeAt(hi, s, slopeFtPerFt) < qCfs) return hi
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (dischargeAt(mid, s, slopeFtPerFt) < qCfs) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export const DEFAULT_SWALE_SECTION: SwaleSection = {
  // 2 ft bottom: wide enough to mow and to keep the flow shallow, narrow enough
  // that the whole section — 5.2 ft of water surface at the design flow, plus
  // freeboard — sits inside a 10 ft easement with room to work either side.
  bottomWidthFt: 2,
  // 3:1 sides are mowable with ordinary equipment and stable in grass. Steeper
  // than that and the sides are maintained by hand or they are not maintained.
  sideSlopeZ: 3,
  manningN: SWALE_MANNING_N,
}

/** Freeboard above the 100-year water surface, ft. Ordinary practice. */
export const SWALE_FREEBOARD_FT = 0.5

export function designSwaleReach(input: SwaleReachInput): SwaleReachResult {
  const section: SwaleSection = { ...DEFAULT_SWALE_SECTION, ...input.section }
  const findings: string[] = []

  const fall = input.upstreamEl - input.downstreamEl
  const rawSlopePct = input.lengthFt > 0 ? (fall / input.lengthFt) * 100 : 0
  let slopePct = rawSlopePct
  if (rawSlopePct < SWALE_MIN_SLOPE_PCT) {
    // NOT SILENTLY RAISED. The reach is designed at the minimum AND the
    // shortfall is reported, because holding half a percent over a reach the
    // ground does not fall means regrading it — a real item of work, not an
    // adjustment to a spreadsheet.
    slopePct = SWALE_MIN_SLOPE_PCT
    findings.push(
      `Ground falls ${fall.toFixed(1)} ft over ${input.lengthFt.toFixed(0)} ft `
      + `(${rawSlopePct.toFixed(2)}%), below the ${SWALE_MIN_SLOPE_PCT}% minimum. The reach is `
      + `designed at ${SWALE_MIN_SLOPE_PCT}% and MUST BE REGRADED to hold it, or it becomes a wet `
      + 'swale and is a different practice.')
  }

  const s = slopePct / 100
  const depth100Ft = normalDepth(input.q100Cfs, section, s)
  const area = areaAt(depth100Ft, section)
  const velocity100Fps = area > 0 ? input.q100Cfs / area : 0
  const topWidth100Ft = section.bottomWidthFt + 2 * section.sideSlopeZ * depth100Ft
  const designDepth = depth100Ft + SWALE_FREEBOARD_FT
  const sectionWidthFt = section.bottomWidthFt + 2 * section.sideSlopeZ * designDepth
  const capacityCfs = dischargeAt(designDepth, section, s)

  if (velocity100Fps > SWALE_PERMISSIBLE_VELOCITY_FPS) {
    findings.push(
      `Velocity ${velocity100Fps.toFixed(2)} fps at the 100-year flow exceeds the `
      + `${SWALE_PERMISSIBLE_VELOCITY_FPS} fps permissible for established grass. This reach needs `
      + 'a turf reinforcement mat or a riprap lining — a larger section will not fix a velocity '
      + 'problem, it makes it worse by steepening the flow.')
  }
  if (depth100Ft >= 5.9) {
    findings.push('The section cannot pass the 100-year flow at any reasonable depth. Widen the '
      + 'bottom or take this reach in pipe.')
  }

  return {
    ...input,
    section,
    slopePct,
    depth100Ft,
    velocity100Fps,
    topWidth100Ft,
    sectionWidthFt,
    capacityCfs,
    freeboardFt: SWALE_FREEBOARD_FT,
    adequate: findings.length === 0,
    findings,
  }
}

/** The whole rear-yard system, reach by reach. */
/**
 * Minimum cut from existing ground to the swale invert at the outlet, ft.
 *
 * The swale has to be a channel, not a line painted on the ground. Half the
 * design depth plus the freeboard puts the bottom far enough below grade that
 * the section is a section; shallower than this and the 100-year flow leaves
 * the channel across the lawn either side of it.
 */
export const SWALE_MIN_OUTLET_CUT_FT = 1.0

export function designSwaleSystem(reaches: SwaleReachInput[]): {
  reaches: SwaleReachResult[]
  maxSectionWidthFt: number
  findings: string[]
} {
  const out = reaches.map(designSwaleReach)

  // ── THE INVERT PROFILE ────────────────────────────────────────────────────
  //
  // A grade in percent is not a grade a contractor can build. What goes on a
  // sheet is the INVERT AT EACH END OF EACH REACH, and those elevations have to
  // be one connected profile: the reach above and the reach below meet at a
  // structure and must arrive at the same number, or the swale has a waterfall
  // in it that nobody drew.
  //
  // So it is solved as a network rather than reach by reach. The outlet is the
  // node nothing drains out of; its invert is set a cut below existing ground,
  // and every reach above it is lifted by its own design fall. Working UPWARDS
  // from the outlet is the only direction that terminates correctly: the outlet
  // is the one elevation fixed by something outside the design.
  const byTo = new Map<string, SwaleReachResult[]>()
  const fromIds = new Set(out.map(r => r.fromId))
  for (const r of out) {
    const list = byTo.get(r.toId)
    if (list) list.push(r)
    else byTo.set(r.toId, [r])
  }
  // The outlet: a node that reaches arrive at and none leave.
  const outlets = [...byTo.keys()].filter(id => !fromIds.has(id))
  const invertAt = new Map<string, number>()
  for (const id of outlets) {
    const arriving = byTo.get(id) ?? []
    const groundEl = Math.min(...arriving.map(r => r.downstreamEl))
    invertAt.set(id, groundEl - SWALE_MIN_OUTLET_CUT_FT)
  }
  // Breadth-first upstream. A reach is solved once its downstream node is.
  const queue = [...outlets]
  const solved = new Set<string>()
  while (queue.length) {
    const node = queue.shift()
    if (node == null || solved.has(node)) continue
    solved.add(node)
    const down = invertAt.get(node)
    if (down == null) continue
    for (const r of byTo.get(node) ?? []) {
      r.invertDownFt = down
      r.invertUpFt = down + (r.slopePct / 100) * r.lengthFt
      r.cutDownFt = r.downstreamEl - r.invertDownFt
      r.cutUpFt = r.upstreamEl - r.invertUpFt
      // Two reaches meeting at the same upstream node take the LOWER invert, so
      // the one that needs to be deeper governs and neither is left perched.
      const prev = invertAt.get(r.fromId)
      invertAt.set(r.fromId, prev == null ? r.invertUpFt : Math.min(prev, r.invertUpFt))
      queue.push(r.fromId)
    }
  }
  // Re-read the upstream inverts after every branch has had its say, so a node
  // shared by two reaches carries one elevation on the sheet.
  for (const r of out) {
    const up = invertAt.get(r.fromId)
    if (up != null && r.invertDownFt != null) {
      r.invertUpFt = up
      r.cutUpFt = r.upstreamEl - up
    }
  }

  const systemFindings: string[] = []
  if (!outlets.length && out.length) {
    systemFindings.push(
      'The swale network has no outlet — every node it reaches also drains onward, so there is '
      + 'nowhere to set an invert from. No invert profile is published for this system.')
  }
  for (const r of out) {
    if (r.cutUpFt == null || r.cutDownFt == null) continue
    const need = r.depth100Ft + r.freeboardFt
    if (r.cutUpFt < need - 1e-6 || r.cutDownFt < need - 1e-6) {
      systemFindings.push(
        `${r.fromId}-${r.toId}: the invert sits ${Math.min(r.cutUpFt, r.cutDownFt).toFixed(2)} ft `
        + `below existing ground where the section needs ${need.toFixed(2)} ft to hold the `
        + '100-year flow with freeboard. The ground either side is cut to suit, and that cut is '
        + 'part of the earthwork.')
    }
  }

  return {
    reaches: out,
    maxSectionWidthFt: out.reduce((n, r) => Math.max(n, r.sectionWidthFt), 0),
    findings: [
      ...out.flatMap(r => r.findings.map(f => `${r.fromId}-${r.toId}: ${f}`)),
      ...systemFindings,
    ],
  }
}
