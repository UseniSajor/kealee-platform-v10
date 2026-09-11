/**
 * Natural cross section — geometry, conveyance and critical depth.
 *
 * This is the unit a one-dimensional water-surface profile is built from. A
 * section is a list of (station, elevation) ground points looking DOWNSTREAM,
 * station increasing left-to-right, plus the two bank stations that separate
 * the main channel from its overbanks and a roughness for each of the three
 * parts.
 *
 * ── Why conveyance is subdivided ────────────────────────────────────────────
 *
 * Manning applied to a whole compound section as if it were one channel is
 * wrong, and wrong in the unsafe direction. The overbanks are shallow and
 * rough; the channel is deep and smooth. Lumping them produces a hydraulic
 * radius that belongs to neither and a discharge that can be tens of percent
 * high. The standard treatment — HEC-RAS Hydraulic Reference, Chapter 2, and
 * before it the Corps' HEC-2 — is to compute conveyance separately for left
 * overbank, channel and right overbank and add them:
 *
 *     K_total = K_lob + K_chan + K_rob        K_i = (1.486 / n_i) · A_i · R_i^(2/3)
 *
 * and then Q = K_total · sqrt(S_f). Every friction slope in the profile solver
 * comes out of this function, so the subdivision is not a refinement — it is
 * the definition of the model.
 *
 * ── Velocity head and alpha ─────────────────────────────────────────────────
 *
 * Because velocity differs across a compound section, the mean velocity head
 * V²/2g understates the true kinetic energy. The energy coefficient
 *
 *     alpha = (sum K_i³ / A_i²) · A_total² / K_total³
 *
 * corrects it. On a section where the flow is all in the channel alpha is 1;
 * where a wide shallow overbank carries part of the flow it can exceed 2, and
 * the profile is visibly different if it is ignored.
 *
 * Units are US customary throughout: feet, seconds, cubic feet per second.
 */

/** Acceleration of gravity, ft/s². */
export const G_FT_S2 = 32.174

/** Manning's equation constant in US customary units. */
export const MANNING_K_US = 1.486

export interface StationElevation {
  /** Station across the section, ft, increasing left to right looking downstream. */
  stationFt: number
  /** Ground elevation, ft, in the study datum. */
  elevationFt: number
}

export interface CrossSection {
  /** Identifier used in the profile table and on the plan. */
  id: string
  /**
   * River station — distance upstream of the model's downstream end, ft.
   * HEC-RAS convention: station INCREASES going upstream.
   */
  riverStationFt: number
  /** Ground points, station increasing. */
  points: readonly StationElevation[]
  /** Station of the left bank of the main channel. */
  leftBankStationFt: number
  /** Station of the right bank of the main channel. */
  rightBankStationFt: number
  manningNLeft: number
  manningNChannel: number
  manningNRight: number
  /**
   * Reach length to the NEXT SECTION DOWNSTREAM, ft, for each flow path.
   * The channel length is the thalweg distance; the overbank lengths follow the
   * centre of mass of overbank flow and are normally longer on the inside of a
   * bend. Null on the most downstream section, which has no reach below it.
   */
  downstreamReachLengthFt: {
    left: number
    channel: number
    right: number
  } | null
  /**
   * Stations beyond which flow is ineffective — water is present but not
   * conveying, so its area counts for storage but its conveyance does not.
   * A blocked obstruction (a road embankment, a building pad) is the usual
   * reason. Null where the whole section conveys.
   */
  ineffective?: { leftOfFt?: number; rightOfFt?: number } | null
  /** Free-text note carried onto the profile table. */
  note?: string
}

export interface SectionHydraulics {
  /** Water-surface elevation this was evaluated at. */
  wselFt: number
  /** Total flow area, ft². */
  areaSqFt: number
  /** Area that conveys — excludes ineffective flow areas, ft². */
  effectiveAreaSqFt: number
  /** Total conveyance, ft³/s per sqrt(ft/ft). */
  conveyance: number
  /** Top width of the water surface, ft. */
  topWidthFt: number
  /** Wetted perimeter, ft. */
  wettedPerimeterFt: number
  /** Energy (Coriolis) coefficient. */
  alpha: number
  /** Hydraulic depth A/T, ft. */
  hydraulicDepthFt: number
  /** Conveyance by subsection, for the output table. */
  parts: { left: number; channel: number; right: number }
}

/** Lowest ground point in the section — the invert. */
export function invertOf(xs: CrossSection): number {
  return Math.min(...xs.points.map((p) => p.elevationFt))
}

/** Highest ground point — above this the section cannot contain the flow. */
export function maxGroundOf(xs: CrossSection): number {
  return Math.max(...xs.points.map((p) => p.elevationFt))
}

/**
 * Wetted area and perimeter of one station range at a water-surface elevation.
 *
 * Walks the ground polyline between `fromSt` and `toSt`, clipping each segment
 * to the part below the water surface. Partly-submerged segments are cut at the
 * waterline by linear interpolation, which is exact for a piecewise-linear
 * ground line. The perimeter counts the wetted GROUND only — the water surface
 * itself is not a boundary and contributes no friction.
 */
function wettedPart(
  xs: CrossSection,
  wselFt: number,
  fromSt: number,
  toSt: number,
): { area: number; perimeter: number; topWidth: number } {
  let area = 0
  let perimeter = 0
  let topWidth = 0
  const pts = xs.points
  const left = pts[0].stationFt
  const right = pts[pts.length - 1].stationFt
  for (let i = 0; i < pts.length - 1; i++) {
    let x1 = pts[i].stationFt
    let z1 = pts[i].elevationFt
    let x2 = pts[i + 1].stationFt
    let z2 = pts[i + 1].elevationFt

    // A VERTICAL FACE — a cut bank, a wall, a bulkhead — has no width, so the
    // horizontal clipping below would drop it and with it its share of the
    // wetted perimeter. Dropping it makes the hydraulic radius too large and
    // the conveyance too high, in the unsafe direction. It carries no area and
    // no top width; it is perimeter only.
    if (x1 === x2) {
      const lo = Math.min(z1, z2)
      const hi = Math.max(z1, z2)
      if (wselFt <= lo) continue
      if (x1 < fromSt || x1 > toSt) continue
      const wetted = Math.min(wselFt, hi) - lo
      // A face sitting exactly on an interior boundary between two subsections
      // belongs to both of them; it is split so the parts still sum to the whole.
      const onInterior =
        (x1 === fromSt && fromSt !== left) || (x1 === toSt && toSt !== right)
      perimeter += wetted * (onInterior ? 0.5 : 1)
      continue
    }

    if (x2 <= fromSt || x1 >= toSt) continue
    // Clip the segment horizontally to the subsection.
    if (x1 < fromSt) {
      z1 = z1 + ((z2 - z1) * (fromSt - x1)) / (x2 - x1)
      x1 = fromSt
    }
    if (x2 > toSt) {
      z2 = z1 + ((z2 - z1) * (toSt - x1)) / (x2 - x1)
      x2 = toSt
    }
    if (x2 <= x1) continue

    const d1 = wselFt - z1
    const d2 = wselFt - z2
    if (d1 <= 0 && d2 <= 0) continue

    if (d1 > 0 && d2 > 0) {
      area += ((d1 + d2) / 2) * (x2 - x1)
      perimeter += Math.hypot(x2 - x1, z2 - z1)
      topWidth += x2 - x1
    } else {
      // One end dry: cut at the waterline.
      const t = d1 / (d1 - d2)
      const xc = x1 + (x2 - x1) * t
      if (d1 > 0) {
        area += (d1 / 2) * (xc - x1)
        perimeter += Math.hypot(xc - x1, wselFt - z1)
        topWidth += xc - x1
      } else {
        area += (d2 / 2) * (x2 - xc)
        perimeter += Math.hypot(x2 - xc, wselFt - z2)
        topWidth += x2 - xc
      }
    }
  }
  return { area, perimeter, topWidth }
}

/** Conveyance of one subsection. Zero where it is dry. */
function conveyanceOf(area: number, perimeter: number, n: number): number {
  if (area <= 0 || perimeter <= 0 || n <= 0) return 0
  const r = area / perimeter
  return (MANNING_K_US / n) * area * Math.pow(r, 2 / 3)
}

/**
 * Full hydraulic properties of a section at a water-surface elevation.
 *
 * Conveyance is subdivided at the bank stations. Ineffective flow areas are
 * removed from conveyance but kept in total area, because they still store
 * water even though they do not carry it.
 */
export function hydraulicsAt(xs: CrossSection, wselFt: number): SectionHydraulics {
  const left = xs.points[0].stationFt
  const right = xs.points[xs.points.length - 1].stationFt
  const lb = xs.leftBankStationFt
  const rb = xs.rightBankStationFt

  const total = wettedPart(xs, wselFt, left, right)

  // Conveying limits: the ineffective bounds pull the outer edges inward.
  const effLeft = Math.max(left, xs.ineffective?.leftOfFt ?? left)
  const effRight = Math.min(right, xs.ineffective?.rightOfFt ?? right)

  const pL = wettedPart(xs, wselFt, Math.min(effLeft, lb), lb)
  const pC = wettedPart(xs, wselFt, lb, rb)
  const pR = wettedPart(xs, wselFt, rb, Math.max(effRight, rb))

  const kL = conveyanceOf(pL.area, pL.perimeter, xs.manningNLeft)
  const kC = conveyanceOf(pC.area, pC.perimeter, xs.manningNChannel)
  const kR = conveyanceOf(pR.area, pR.perimeter, xs.manningNRight)
  const kT = kL + kC + kR

  const aEff = pL.area + pC.area + pR.area

  // alpha = (sum K_i^3 / A_i^2) * A^2 / K^3
  let alpha = 1
  if (kT > 0 && aEff > 0) {
    let s = 0
    for (const [k, a] of [
      [kL, pL.area],
      [kC, pC.area],
      [kR, pR.area],
    ] as const) {
      if (k > 0 && a > 0) s += (k * k * k) / (a * a)
    }
    alpha = (s * aEff * aEff) / (kT * kT * kT)
    if (!Number.isFinite(alpha) || alpha < 1) alpha = 1
  }

  return {
    wselFt,
    areaSqFt: total.area,
    effectiveAreaSqFt: aEff,
    conveyance: kT,
    topWidthFt: total.topWidth,
    wettedPerimeterFt: total.perimeter,
    alpha,
    hydraulicDepthFt: total.topWidth > 0 ? total.area / total.topWidth : 0,
    parts: { left: kL, channel: kC, right: kR },
  }
}

/**
 * Water-surface elevation at which the section conveys a given discharge under
 * normal (uniform) flow on a given slope. Bisection on a monotonic function.
 *
 * This is what sets the downstream boundary when no tailwater is known — the
 * "normal depth" boundary condition of HEC-RAS, and the honest choice when the
 * model ends on an open reach rather than at a structure.
 */
export function normalWsel(xs: CrossSection, qCfs: number, slopeFtPerFt: number): number {
  if (qCfs <= 0 || slopeFtPerFt <= 0) return invertOf(xs)
  const lo0 = invertOf(xs)
  let lo = lo0
  let hi = maxGroundOf(xs) + 20
  const q = (w: number) => hydraulicsAt(xs, w).conveyance * Math.sqrt(slopeFtPerFt)
  if (q(hi) < qCfs) return hi
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    if (q(mid) < qCfs) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/**
 * Critical water-surface elevation — the depth at which specific energy is a
 * minimum for the given discharge.
 *
 * Found by minimising E = WS + alpha·V²/2g directly rather than by solving the
 * Froude relation, because a compound section can have more than one local
 * minimum and the energy form is the one that generalises. The search is a
 * scan-then-refine over the full depth range of the section: coarse enough to
 * find the global minimum, then golden-section to converge on it.
 *
 * The profile solver needs this for two things — to detect that a subcritical
 * assumption has failed, and to place the critical-depth control at a culvert
 * or a steep reach.
 */
export function criticalWsel(xs: CrossSection, qCfs: number): number {
  const lo = invertOf(xs)
  const hi = maxGroundOf(xs) + 20
  const energy = (w: number): number => {
    const h = hydraulicsAt(xs, w)
    if (h.effectiveAreaSqFt <= 0.01) return Number.POSITIVE_INFINITY
    const v = qCfs / h.effectiveAreaSqFt
    return w + (h.alpha * v * v) / (2 * G_FT_S2)
  }
  const N = 400
  let bestW = lo + (hi - lo) / N
  let bestE = Number.POSITIVE_INFINITY
  for (let i = 1; i <= N; i++) {
    const w = lo + ((hi - lo) * i) / N
    const e = energy(w)
    if (e < bestE) {
      bestE = e
      bestW = w
    }
  }
  // Golden-section refine in the bracket either side of the scan minimum.
  let a = Math.max(lo + 1e-4, bestW - (hi - lo) / N)
  let b = Math.min(hi, bestW + (hi - lo) / N)
  const gr = (Math.sqrt(5) - 1) / 2
  let c = b - gr * (b - a)
  let d = a + gr * (b - a)
  for (let i = 0; i < 60; i++) {
    if (energy(c) < energy(d)) b = d
    else a = c
    c = b - gr * (b - a)
    d = a + gr * (b - a)
  }
  return (a + b) / 2
}

/** Froude number at a water surface. Above 1 the flow is supercritical. */
export function froudeAt(xs: CrossSection, wselFt: number, qCfs: number): number {
  const h = hydraulicsAt(xs, wselFt)
  if (h.effectiveAreaSqFt <= 0 || h.hydraulicDepthFt <= 0) return 0
  const v = qCfs / h.effectiveAreaSqFt
  return v / Math.sqrt(G_FT_S2 * h.hydraulicDepthFt)
}

/**
 * Where the water surface meets the ground, left and right of the channel.
 *
 * These two stations ARE the floodplain limit at this section. Everything the
 * delineation draws is this function evaluated at each section and joined up,
 * so the mapped limit and the modelled profile cannot disagree.
 *
 * Returns null on a side where the water overtops the end of the section —
 * the section is too short to contain the flow and the limit is unknown rather
 * than at the edge of the survey.
 */
export function waterEdges(
  xs: CrossSection,
  wselFt: number,
): { leftFt: number | null; rightFt: number | null } {
  const pts = xs.points

  const cross = (from: number, to: number): number | null => {
    const step = to > from ? 1 : -1
    for (let i = from; i !== to; i += step) {
      const a = pts[i]
      const b = pts[i + (step > 0 ? 1 : -1)]
      if (!b) break
      const da = wselFt - a.elevationFt
      const db = wselFt - b.elevationFt
      if (da > 0 && db <= 0) {
        const t = da / (da - db)
        return a.stationFt + (b.stationFt - a.stationFt) * t
      }
    }
    return null
  }

  // Start from the LOWEST point in the main channel and walk outward. Starting
  // from the point nearest the channel centre is wrong on a section whose
  // centre lands on a vertical bank face, where the nearest point is the TOP of
  // the bank and the search reports a dry section that is plainly wet.
  let ci = -1
  let cz = Infinity
  for (let i = 0; i < pts.length; i++) {
    const inChannel =
      pts[i].stationFt >= xs.leftBankStationFt && pts[i].stationFt <= xs.rightBankStationFt
    if (!inChannel) continue
    if (pts[i].elevationFt < cz) {
      cz = pts[i].elevationFt
      ci = i
    }
  }
  if (ci < 0) {
    // No point falls between the bank stations — fall back to the section low.
    cz = Infinity
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].elevationFt < cz) {
        cz = pts[i].elevationFt
        ci = i
      }
    }
  }
  if (ci < 0 || pts[ci].elevationFt >= wselFt) return { leftFt: null, rightFt: null }

  return {
    leftFt: cross(ci, 0),
    rightFt: cross(ci, pts.length - 1),
  }
}
