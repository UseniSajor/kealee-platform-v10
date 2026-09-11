/**
 * One-dimensional steady gradually-varied flow — the standard step method.
 *
 * This is the water-surface profile engine. It is the same formulation HEC-RAS
 * uses for a steady subcritical profile (HEC-RAS Hydraulic Reference Manual,
 * Chapter 2, "Theoretical Basis for One-Dimensional Flow Calculations"), and it
 * is written out here rather than wrapped around a black box so that every
 * number on the profile table can be traced to the line that produced it.
 *
 * ── The equation being solved ───────────────────────────────────────────────
 *
 * Between two sections, energy is conserved less losses:
 *
 *     WS2 + a2·V2²/2g  =  WS1 + a1·V1²/2g  +  h_e
 *
 * with 2 upstream, 1 downstream, and the energy loss
 *
 *     h_e = L·S_f_bar + C·| a2·V2²/2g − a1·V1²/2g |
 *
 * L        discharge-weighted reach length across channel and overbanks
 * S_f_bar  representative friction slope for the reach
 * C        expansion or contraction coefficient
 *
 * Given the downstream water surface, the upstream one appears on both sides
 * (it sets A2, hence V2, hence S_f). So each step is a root-find: guess WS2,
 * compute the energy balance, correct, repeat. That is the "standard step".
 *
 * ── Friction slope averaging ────────────────────────────────────────────────
 *
 * S_f = (Q / K)². Which K to use over a reach where conveyance changes is a
 * real modelling choice, not a detail. The default here — and HEC-RAS's — is
 * AVERAGE CONVEYANCE:
 *
 *     S_f_bar = ( (Q1 + Q2) / (K1 + K2) )²
 *
 * It is the most stable of the four common forms across the widest range of
 * profiles, which matters on a reach like this one where a road embankment
 * makes conveyance change by an order of magnitude between adjacent sections.
 *
 * ── Direction, and why subcritical runs upstream ────────────────────────────
 *
 * Subcritical flow is controlled from downstream: a disturbance propagates
 * upstream, so the profile is computed from the downstream boundary upward.
 * That is why a tailwater assumption at the bottom of the model matters at the
 * top of it, and why the downstream boundary condition is stated in the report
 * rather than buried in an input file.
 *
 * Where the computed surface falls below critical depth the subcritical
 * assumption has failed at that section. Rather than silently return a
 * physically impossible answer, the solver sets the surface to critical, flags
 * the section, and carries on — the same defaulting HEC-RAS does, and the flag
 * is reported.
 */

import {
  type CrossSection,
  criticalWsel,
  froudeAt,
  G_FT_S2,
  hydraulicsAt,
  invertOf,
  maxGroundOf,
  normalWsel,
  waterEdges,
} from './cross-section'

/**
 * Expansion and contraction coefficients for a gradual transition.
 *
 * HEC-RAS Table 2-2 gives 0.1/0.3 for gradual transitions and 0.3/0.5 at
 * bridges. The larger pair belongs at an abrupt change — a road embankment or
 * a culvert — and the solver applies it automatically where conveyance between
 * adjacent sections changes by more than the ratio below.
 */
export const CONTRACTION_GRADUAL = 0.1
export const EXPANSION_GRADUAL = 0.3
export const CONTRACTION_ABRUPT = 0.3
export const EXPANSION_ABRUPT = 0.5

/** Conveyance ratio above which a transition is treated as abrupt. */
export const ABRUPT_CONVEYANCE_RATIO = 2.0

export interface ProfilePoint {
  sectionId: string
  riverStationFt: number
  /** Channel invert, ft. */
  invertFt: number
  /** Water-surface elevation, ft. */
  wselFt: number
  /** Energy grade line, ft. */
  energyGradeFt: number
  /** Critical water-surface elevation, ft. */
  criticalWselFt: number
  /** Mean velocity through the effective area, fps. */
  velocityFps: number
  /** Velocity head, alpha·V²/2g, ft. */
  velocityHeadFt: number
  /** Flow area, ft². */
  areaSqFt: number
  /** Top width at the water surface, ft. */
  topWidthFt: number
  /** Friction slope at this section, ft/ft. */
  frictionSlope: number
  /** Froude number. */
  froude: number
  /** Maximum depth in the section, ft. */
  maxDepthFt: number
  /** Left and right station where the water surface meets ground. */
  leftEdgeFt: number | null
  rightEdgeFt: number | null
  /** Set where the subcritical assumption failed and critical depth was used. */
  criticalDefault: boolean
  /** Set where the water surface exceeds the highest ground in the section. */
  overtopped: boolean
  /** Energy loss from the section below, ft. Null at the boundary. */
  energyLossFt: number | null
}

export interface ProfileResult {
  /** Discharge this profile was run at, cfs. */
  dischargeCfs: number
  /** Label — "100-yr", "10-yr". */
  label: string
  points: ProfilePoint[]
  /** Sections where the solver had to default to critical depth. */
  criticalDefaults: string[]
  /** Sections where the water surface exceeded the section's highest ground. */
  overtopped: string[]
  /** Description of the downstream boundary condition used. */
  boundaryCondition: string
}

export type DownstreamBoundary =
  | { kind: 'known-wsel'; wselFt: number; note: string }
  | { kind: 'normal-depth'; slopeFtPerFt: number; note: string }
  | { kind: 'critical-depth'; note: string }

/** Discharge-weighted reach length — HEC-RAS eq. 2-3. */
function weightedReachLength(xs: CrossSection, hyd: ReturnType<typeof hydraulicsAt>): number {
  const L = xs.downstreamReachLengthFt
  if (!L) return 0
  const qL = hyd.parts.left
  const qC = hyd.parts.channel
  const qR = hyd.parts.right
  const sum = qL + qC + qR
  if (sum <= 0) return L.channel
  return (L.left * qL + L.channel * qC + L.right * qR) / sum
}

/**
 * Solve a steady water-surface profile.
 *
 * `sections` must be ordered DOWNSTREAM FIRST — index 0 is the downstream
 * boundary and river station increases with index. `dischargeCfs` may be a
 * single number or one per section, which is how a lateral inflow between two
 * sections is represented.
 */
export function solveProfile(input: {
  sections: readonly CrossSection[]
  dischargeCfs: number | readonly number[]
  boundary: DownstreamBoundary
  label: string
}): ProfileResult {
  const { sections, boundary, label } = input
  if (sections.length < 2) throw new Error('a profile needs at least two cross sections')

  const qAt = (i: number): number =>
    typeof input.dischargeCfs === 'number' ? input.dischargeCfs : input.dischargeCfs[i]

  const points: ProfilePoint[] = []
  const criticalDefaults: string[] = []
  const overtopped: string[] = []

  const describe = (i: number, wsel: number, lossFt: number | null): ProfilePoint => {
    const xs = sections[i]
    const q = qAt(i)
    const h = hydraulicsAt(xs, wsel)
    const inv = invertOf(xs)
    const v = h.effectiveAreaSqFt > 0 ? q / h.effectiveAreaSqFt : 0
    const vh = (h.alpha * v * v) / (2 * G_FT_S2)
    const sf = h.conveyance > 0 ? Math.pow(q / h.conveyance, 2) : 0
    const crit = criticalWsel(xs, q)
    const edges = waterEdges(xs, wsel)
    const over = wsel > maxGroundOf(xs)
    if (over && !overtopped.includes(xs.id)) overtopped.push(xs.id)
    return {
      sectionId: xs.id,
      riverStationFt: xs.riverStationFt,
      invertFt: inv,
      wselFt: wsel,
      energyGradeFt: wsel + vh,
      criticalWselFt: crit,
      velocityFps: v,
      velocityHeadFt: vh,
      areaSqFt: h.areaSqFt,
      topWidthFt: h.topWidthFt,
      frictionSlope: sf,
      froude: froudeAt(xs, wsel, q),
      maxDepthFt: wsel - inv,
      leftEdgeFt: edges.leftFt,
      rightEdgeFt: edges.rightFt,
      criticalDefault: false,
      overtopped: over,
      energyLossFt: lossFt,
    }
  }

  // ── Downstream boundary ──────────────────────────────────────────────────
  let wsel0: number
  let boundaryNote: string
  const q0 = qAt(0)
  if (boundary.kind === 'known-wsel') {
    wsel0 = boundary.wselFt
    boundaryNote = boundary.note
  } else if (boundary.kind === 'normal-depth') {
    wsel0 = normalWsel(sections[0], q0, boundary.slopeFtPerFt)
    boundaryNote = boundary.note
  } else {
    wsel0 = criticalWsel(sections[0], q0)
    boundaryNote = boundary.note
  }
  const crit0 = criticalWsel(sections[0], q0)
  if (wsel0 < crit0) {
    wsel0 = crit0
    criticalDefaults.push(sections[0].id)
  }
  points.push(describe(0, wsel0, null))
  if (criticalDefaults.includes(sections[0].id)) points[0].criticalDefault = true

  // ── March upstream ───────────────────────────────────────────────────────
  for (let i = 1; i < sections.length; i++) {
    const dn = sections[i - 1]
    const up = sections[i]
    const qDn = qAt(i - 1)
    const qUp = qAt(i)
    const wsDn = points[i - 1].wselFt
    const hDn = hydraulicsAt(dn, wsDn)
    const vhDn = points[i - 1].velocityHeadFt
    const egDn = wsDn + vhDn
    const kDn = hDn.conveyance
    // Reach length belongs to the DOWNSTREAM section, which carries the
    // distance to the next section below it — so the reach between i-1 and i
    // is described by section i's downstream lengths.
    const critUp = criticalWsel(up, qUp)

    // Residual of the energy balance for a trial upstream water surface.
    const residual = (ws: number): number => {
      const hUp = hydraulicsAt(up, ws)
      if (hUp.effectiveAreaSqFt <= 0.01 || hUp.conveyance <= 0) return 1e6
      const vUp = qUp / hUp.effectiveAreaSqFt
      const vhUp = (hUp.alpha * vUp * vUp) / (2 * G_FT_S2)
      const L = weightedReachLength(up, hUp)
      const sfBar = Math.pow((qDn + qUp) / (kDn + hUp.conveyance), 2)
      const hf = L * sfBar
      const ratio =
        kDn > 0 && hUp.conveyance > 0
          ? Math.max(kDn / hUp.conveyance, hUp.conveyance / kDn)
          : 1
      const abrupt = ratio > ABRUPT_CONVEYANCE_RATIO
      const cExp = abrupt ? EXPANSION_ABRUPT : EXPANSION_GRADUAL
      const cCon = abrupt ? CONTRACTION_ABRUPT : CONTRACTION_GRADUAL
      const dVh = vhUp - vhDn
      // Velocity head increasing upstream = the flow is contracting as it goes
      // downstream... no: going upstream, a rise in velocity head means the
      // section is contracting, so the contraction coefficient applies.
      const hLocal = dVh > 0 ? cCon * dVh : cExp * -dVh
      return ws + vhUp - (egDn + hf + hLocal)
    }

    // Bracket between critical depth and a surface well above the section.
    let lo = critUp
    let hi = Math.max(maxGroundOf(up), wsDn) + 40
    let fLo = residual(lo)
    let fHi = residual(hi)
    let ws: number
    if (fLo > 0) {
      // Even at critical depth the upstream energy exceeds what is available:
      // the subcritical profile cannot be maintained. Default to critical.
      ws = critUp
      criticalDefaults.push(up.id)
    } else if (fHi < 0) {
      ws = hi
    } else {
      for (let k = 0; k < 100; k++) {
        const mid = (lo + hi) / 2
        const fm = residual(mid)
        if (fm < 0) {
          lo = mid
          fLo = fm
        } else {
          hi = mid
          fHi = fm
        }
      }
      ws = (lo + hi) / 2
    }

    const hUp = hydraulicsAt(up, ws)
    const L = weightedReachLength(up, hUp)
    const sfBar = Math.pow((qDn + qUp) / (kDn + hUp.conveyance), 2)
    const loss = L * sfBar
    const pt = describe(i, ws, loss)
    pt.criticalDefault = criticalDefaults.includes(up.id)
    points.push(pt)
  }

  return {
    dischargeCfs: typeof input.dischargeCfs === 'number' ? input.dischargeCfs : qAt(sections.length - 1),
    label,
    points,
    criticalDefaults,
    overtopped,
    boundaryCondition: boundaryNote,
  }
}

/**
 * Compare two profiles section by section — the no-rise table.
 *
 * A positive rise means the proposed condition raises the water surface, which
 * is the finding that stops a floodplain permit. The comparison is done on the
 * SAME sections, so a proposed model that has re-cut a section still reports
 * against its existing twin by river station.
 */
export interface RiseRow {
  sectionId: string
  riverStationFt: number
  existingWselFt: number
  proposedWselFt: number
  /** Proposed minus existing, ft. Positive is a rise. */
  riseFt: number
}

export function compareProfiles(existing: ProfileResult, proposed: ProfileResult): {
  rows: RiseRow[]
  maxRiseFt: number
  maxRiseSection: string | null
  noRise: boolean
} {
  const byId = new Map(proposed.points.map((p) => [p.sectionId, p]))
  const rows: RiseRow[] = []
  for (const e of existing.points) {
    const p = byId.get(e.sectionId)
    if (!p) continue
    rows.push({
      sectionId: e.sectionId,
      riverStationFt: e.riverStationFt,
      existingWselFt: e.wselFt,
      proposedWselFt: p.wselFt,
      riseFt: p.wselFt - e.wselFt,
    })
  }
  let maxRiseFt = -Infinity
  let maxRiseSection: string | null = null
  for (const r of rows) {
    if (r.riseFt > maxRiseFt) {
      maxRiseFt = r.riseFt
      maxRiseSection = r.sectionId
    }
  }
  if (!Number.isFinite(maxRiseFt)) maxRiseFt = 0
  return {
    rows,
    maxRiseFt,
    maxRiseSection,
    // Prince George's County and FEMA both work to 0.00 ft as surveyed and
    // reported to two decimals. Anything that rounds to 0.00 is a no-rise.
    noRise: maxRiseFt < 0.005,
  }
}
