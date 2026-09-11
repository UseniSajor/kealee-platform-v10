/**
 * Culvert hydraulics — FHWA HDS-5, inlet control and outlet control.
 *
 * "Hydraulic Design of Highway Culverts", FHWA-HIF-12-026, Third Edition,
 * April 2012. The design headwater is the HIGHER of the two controls, because
 * the culvert is a system in series and whichever component is the constriction
 * sets the upstream water surface. Reporting one without the other is the most
 * common way a culvert calculation is wrong.
 *
 * ── Inlet control ───────────────────────────────────────────────────────────
 *
 * The barrel can carry more than the entrance will admit; the entrance is the
 * constriction and the barrel flows part full. Three regimes, HDS-5 Appendix A:
 *
 *   unsubmerged, form 1 (weir-like, with a critical-depth term):
 *       HW_i/D = HW_c/D + K·[Q/(A·D^0.5)]^M − 0.5·S
 *   unsubmerged, form 2:
 *       HW_i/D = K·[Q/(A·D^0.5)]^M
 *   submerged (orifice-like):
 *       HW_i/D = c·[Q/(A·D^0.5)]² + Y − 0.5·S
 *
 * The unsubmerged forms hold to Q/(A·D^0.5) = 3.5 and the submerged form from
 * 4.0; between them HDS-5 draws the curve by hand and this implementation
 * interpolates linearly, which is what the published nomographs do to within
 * their own reading accuracy.
 *
 * The −0.5·S term is the slope correction. It is dropped for a mitred inlet,
 * where it becomes +0.7·S.
 *
 * ── Outlet control ──────────────────────────────────────────────────────────
 *
 * The barrel and the tailwater govern. Energy from the outlet back to the
 * inlet:
 *
 *     HW_o = TW_eff + H − S0·L
 *     H = (1 + k_e + 29·n²·L / R^1.33) · V²/2g
 *
 * where the bracket is entrance loss, velocity head and friction expressed as
 * a multiple of the velocity head, and R is the full-barrel hydraulic radius.
 *
 * TW_eff is the greater of the actual tailwater and (d_c + D)/2 — the HDS-5
 * approximation to the hydraulic grade line where the barrel does not flow
 * full at the outlet. This is the standard simplification and it is stated
 * because it is an approximation, not a computation.
 *
 * ── Roadway overtopping ─────────────────────────────────────────────────────
 *
 * Once the headwater reaches the low point of the road, the road becomes a
 * broad-crested weir and the crossing's capacity is the culvert plus the weir.
 * A model that stops at the culvert will report a headwater far above the road
 * and call it a flood depth. The performance curve here balances both.
 */

import { G_FT_S2 } from './cross-section'

export type CulvertShape = 'circular' | 'box'

export interface InletCoefficients {
  /** Description as it appears in HDS-5 Table A.1. */
  label: string
  /** Chart/scale reference in HDS-5. */
  chart: string
  /** Unsubmerged equation form, 1 or 2. */
  form: 1 | 2
  K: number
  M: number
  c: number
  Y: number
  /** Entrance loss coefficient k_e for outlet control, HDS-5 Table 12. */
  ke: number
  /** Mitred inlets take +0.7·S instead of −0.5·S. */
  mitred?: boolean
}

/**
 * Inlet configurations for circular concrete pipe — HDS-5 Chart 1, Table A.1.
 *
 * The entrance treatment is worth between a third and a half of the headwater
 * at a given flow. It is a design decision with a number attached, not a
 * detail for the contractor.
 */
export const RCP_SQUARE_EDGE_HEADWALL: InletCoefficients = {
  label: 'Square edge with headwall',
  chart: 'HDS-5 Chart 1, scale 1',
  form: 1,
  K: 0.0098,
  M: 2.0,
  c: 0.0398,
  Y: 0.67,
  ke: 0.5,
}

export const RCP_GROOVE_END_HEADWALL: InletCoefficients = {
  label: 'Groove end with headwall',
  chart: 'HDS-5 Chart 1, scale 2',
  form: 1,
  K: 0.0078,
  M: 2.0,
  c: 0.0292,
  Y: 0.74,
  ke: 0.2,
}

export const RCP_GROOVE_END_PROJECTING: InletCoefficients = {
  label: 'Groove end projecting',
  chart: 'HDS-5 Chart 1, scale 3',
  form: 1,
  K: 0.0045,
  M: 2.0,
  c: 0.0317,
  Y: 0.69,
  ke: 0.2,
}

/** Concrete box, 90-degree headwall, square-edged on three sides. */
export const BOX_SQUARE_EDGE_HEADWALL: InletCoefficients = {
  label: '90-degree headwall, square-edged',
  chart: 'HDS-5 Chart 8, scale 1',
  form: 1,
  K: 0.0098,
  M: 2.0,
  c: 0.0398,
  Y: 0.67,
  ke: 0.5,
}

export interface CulvertBarrel {
  shape: CulvertShape
  /** Diameter for circular, or rise for a box, ft. */
  riseFt: number
  /** Span for a box, ft. Ignored for circular. */
  spanFt?: number
  /** Number of identical barrels. */
  barrels: number
  lengthFt: number
  manningN: number
  inletInvertFt: number
  outletInvertFt: number
  inlet: InletCoefficients
}

/** Full-barrel cross-sectional area of ONE barrel, ft². */
export function barrelArea(b: CulvertBarrel): number {
  return b.shape === 'circular'
    ? (Math.PI * b.riseFt * b.riseFt) / 4
    : b.riseFt * (b.spanFt ?? b.riseFt)
}

/** Full-barrel wetted perimeter of ONE barrel, ft. */
export function barrelPerimeter(b: CulvertBarrel): number {
  return b.shape === 'circular'
    ? Math.PI * b.riseFt
    : 2 * (b.riseFt + (b.spanFt ?? b.riseFt))
}

/** Barrel slope, ft/ft. Positive falling toward the outlet. */
export function barrelSlope(b: CulvertBarrel): number {
  return b.lengthFt > 0 ? (b.inletInvertFt - b.outletInvertFt) / b.lengthFt : 0
}

/** Area of flow in a circular pipe at depth d, ft². */
export function circularAreaAt(d: number, D: number): number {
  if (d <= 0) return 0
  if (d >= D) return (Math.PI * D * D) / 4
  const theta = 2 * Math.acos(1 - (2 * d) / D)
  return ((D * D) / 8) * (theta - Math.sin(theta))
}

/** Top width of flow in a circular pipe at depth d, ft. */
export function circularTopWidthAt(d: number, D: number): number {
  if (d <= 0 || d >= D) return 0
  return 2 * Math.sqrt(d * (D - d))
}

/**
 * Critical depth in the barrel, ft.
 *
 * Solves Q²·T / (g·A³) = 1 by bisection on depth. Capped at the barrel rise,
 * because a full barrel has no free surface and critical depth has no meaning
 * above it — HDS-5 makes the same cap when reading d_c off its charts.
 */
export function criticalDepth(b: CulvertBarrel, qPerBarrel: number): number {
  if (qPerBarrel <= 0) return 0
  const D = b.riseFt
  const f = (d: number): number => {
    const a = b.shape === 'circular' ? circularAreaAt(d, D) : d * (b.spanFt ?? D)
    const t = b.shape === 'circular' ? circularTopWidthAt(d, D) : (b.spanFt ?? D)
    if (a <= 0 || t <= 0) return -1
    return (qPerBarrel * qPerBarrel * t) / (G_FT_S2 * a * a * a) - 1
  }
  let lo = 1e-5
  let hi = D * 0.999
  if (f(hi) > 0) return D
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    if (f(mid) > 0) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export interface ControlResult {
  /** Headwater elevation, ft. */
  hwElFt: number
  /** Headwater depth above the inlet invert, ft. */
  hwDepthFt: number
  /** Regime description for the output table. */
  regime: string
}

/**
 * Inlet control headwater. HDS-5 Appendix A, equations A.1 to A.3.
 */
export function inletControl(b: CulvertBarrel, qTotal: number): ControlResult {
  const q = qTotal / Math.max(1, b.barrels)
  const D = b.riseFt
  const A = barrelArea(b)
  const S = barrelSlope(b)
  const slopeTerm = b.inlet.mitred ? +0.7 * S : -0.5 * S
  if (q <= 0) return { hwElFt: b.inletInvertFt, hwDepthFt: 0, regime: 'no flow' }

  const x = q / (A * Math.sqrt(D))
  const dc = criticalDepth(b, q)

  const unsubmerged = (): number => {
    if (b.inlet.form === 1) {
      // HW_c/D is the critical-depth specific energy over D.
      const ac = b.shape === 'circular' ? circularAreaAt(dc, D) : dc * (b.spanFt ?? D)
      const vc = ac > 0 ? q / ac : 0
      const hwc = dc + (vc * vc) / (2 * G_FT_S2)
      return hwc / D + b.inlet.K * Math.pow(x, b.inlet.M) + slopeTerm
    }
    return b.inlet.K * Math.pow(x, b.inlet.M)
  }
  const submerged = (): number => b.inlet.c * x * x + b.inlet.Y + slopeTerm

  let ratio: number
  let regime: string
  if (x <= 3.5) {
    ratio = unsubmerged()
    regime = `inlet control, unsubmerged (form ${b.inlet.form}), Q/AD^0.5 = ${x.toFixed(2)}`
  } else if (x >= 4.0) {
    ratio = submerged()
    regime = `inlet control, submerged, Q/AD^0.5 = ${x.toFixed(2)}`
  } else {
    const t = (x - 3.5) / 0.5
    ratio = unsubmerged() * (1 - t) + submerged() * t
    regime = `inlet control, transition, Q/AD^0.5 = ${x.toFixed(2)}`
  }
  const hwDepth = Math.max(0, ratio * D)
  return { hwElFt: b.inletInvertFt + hwDepth, hwDepthFt: hwDepth, regime }
}

/**
 * Outlet control headwater. HDS-5 Chapter 3 and equation 3.1.
 *
 * `tailwaterElFt` is the water-surface elevation downstream of the outlet. It
 * comes from the receiving channel — on this project, from the standard-step
 * profile of the reach below, which is the only defensible source for it.
 */
export function outletControl(
  b: CulvertBarrel,
  qTotal: number,
  tailwaterElFt: number,
): ControlResult {
  const q = qTotal / Math.max(1, b.barrels)
  if (q <= 0) return { hwElFt: b.inletInvertFt, hwDepthFt: 0, regime: 'no flow' }
  const D = b.riseFt
  const A = barrelArea(b)
  const P = barrelPerimeter(b)
  const R = A / P
  const V = q / A
  const vh = (V * V) / (2 * G_FT_S2)

  const kFriction = (29 * b.manningN * b.manningN * b.lengthFt) / Math.pow(R, 4 / 3)
  const H = (1 + b.inlet.ke + kFriction) * vh

  const dc = criticalDepth(b, q)
  const hydraulicGradeApprox = b.outletInvertFt + (dc + D) / 2
  const tw = Math.max(tailwaterElFt, hydraulicGradeApprox)
  const usedApprox = hydraulicGradeApprox > tailwaterElFt

  const hwEl = tw + H - barrelSlope(b) * b.lengthFt
  return {
    hwElFt: hwEl,
    hwDepthFt: hwEl - b.inletInvertFt,
    regime:
      `outlet control, H = ${H.toFixed(2)} ft` +
      (usedApprox
        ? `, TW set by (dc+D)/2 = ${((dc + D) / 2).toFixed(2)} ft above the outlet invert`
        : `, TW = channel ${tailwaterElFt.toFixed(2)} ft`),
  }
}

export interface CulvertResult {
  dischargeCfs: number
  inlet: ControlResult
  outlet: ControlResult
  /** The governing headwater — the higher of the two. */
  headwaterElFt: number
  headwaterDepthFt: number
  governing: 'inlet' | 'outlet'
  /** HW/D, the ratio a reviewer looks at first. */
  hwOverD: number
  /** Full-barrel velocity, fps. */
  barrelVelocityFps: number
  /** Outlet velocity at the computed condition, fps. */
  outletVelocityFps: number
  criticalDepthFt: number
  /** Discharge carried over the roadway, cfs. Zero where it does not overtop. */
  overtoppingCfs: number
  notes: string[]
}

export interface RoadwayOvertopping {
  /** Low point of the roadway profile over the crossing, ft. */
  crestElFt: number
  /** Length of roadway available to pass flow, ft. */
  crestLengthFt: number
  /**
   * Broad-crested weir coefficient. HDS-5 Figure 7 gives about 3.0 for a
   * gravel-surfaced or paved roadway at small heads, falling as the road
   * becomes deeply submerged.
   */
  weirCoefficient: number
}

/**
 * Analyse a culvert at one discharge, balancing roadway overtopping.
 *
 * With a road overtopping, the headwater is whatever elevation makes the
 * culvert and the weir together carry the total flow. That balance is solved
 * by bisection on the headwater elevation, which is the same thing the HDS-5
 * performance-curve procedure does graphically.
 */
export function analyseCulvert(input: {
  barrel: CulvertBarrel
  dischargeCfs: number
  tailwaterElFt: number
  roadway?: RoadwayOvertopping | null
}): CulvertResult {
  const { barrel: b, dischargeCfs: Q, tailwaterElFt, roadway } = input
  const notes: string[] = []

  const culvertHw = (q: number): { hw: number; ic: ControlResult; oc: ControlResult } => {
    const ic = inletControl(b, q)
    const oc = outletControl(b, q, tailwaterElFt)
    return { hw: Math.max(ic.hwElFt, oc.hwElFt), ic, oc }
  }

  let qCulvert = Q
  let overtopping = 0

  if (roadway && culvertHw(Q).hw > roadway.crestElFt) {
    // Balance: find HW such that culvert(HW) + weir(HW) = Q.
    const weirQ = (hw: number): number => {
      const head = hw - roadway.crestElFt
      if (head <= 0) return 0
      return roadway.weirCoefficient * roadway.crestLengthFt * Math.pow(head, 1.5)
    }
    // Culvert capacity as a function of headwater: invert by bisection.
    const culvertQAt = (hw: number): number => {
      let lo = 0
      let hi = Q * 4 + 10
      for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2
        if (culvertHw(mid).hw < hw) lo = mid
        else hi = mid
      }
      return (lo + hi) / 2
    }
    let lo = roadway.crestElFt
    let hi = culvertHw(Q).hw + 5
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2
      const total = culvertQAt(mid) + weirQ(mid)
      if (total < Q) lo = mid
      else hi = mid
    }
    const hwBal = (lo + hi) / 2
    overtopping = Math.min(Q, weirQ(hwBal))
    qCulvert = Math.max(0, Q - overtopping)
    notes.push(
      `The roadway overtops. At the balance point the culvert carries ` +
        `${qCulvert.toFixed(1)} cfs and ${overtopping.toFixed(1)} cfs passes over the road ` +
        `on ${roadway.crestLengthFt.toFixed(0)} ft of crest at EL ${roadway.crestElFt.toFixed(2)}.`,
    )
  }

  const ic = inletControl(b, qCulvert)
  const oc = outletControl(b, qCulvert, tailwaterElFt)
  const governing = ic.hwElFt >= oc.hwElFt ? 'inlet' : 'outlet'
  const hwEl = Math.max(ic.hwElFt, oc.hwElFt)
  const A = barrelArea(b)
  const qPer = qCulvert / Math.max(1, b.barrels)
  const dc = criticalDepth(b, qPer)

  // Outlet velocity: full barrel if the barrel is full at the outlet, else at
  // normal depth in the barrel, capped at full.
  const dOut = Math.min(b.riseFt, Math.max(dc, 0))
  const aOut = b.shape === 'circular' ? circularAreaAt(dOut, b.riseFt) : dOut * (b.spanFt ?? b.riseFt)
  const outletV = aOut > 0 ? qPer / aOut : 0

  if (governing === 'inlet') {
    notes.push(
      'INLET CONTROL GOVERNS. The entrance is the constriction, so the barrel ' +
        'is not being used to capacity and enlarging the pipe alone will not ' +
        'lower the headwater — the inlet has to be enlarged with it.',
    )
  } else {
    notes.push(
      'OUTLET CONTROL GOVERNS. The barrel and the tailwater set the headwater, ' +
        'so barrel size, roughness and the downstream water surface are all live ' +
        'variables in the answer.',
    )
  }

  return {
    dischargeCfs: Q,
    inlet: ic,
    outlet: oc,
    headwaterElFt: hwEl,
    headwaterDepthFt: hwEl - b.inletInvertFt,
    governing,
    hwOverD: (hwEl - b.inletInvertFt) / b.riseFt,
    barrelVelocityFps: qPer / A,
    outletVelocityFps: outletV,
    criticalDepthFt: dc,
    overtoppingCfs: overtopping,
    notes,
  }
}

/** A performance curve — headwater against discharge, for the report. */
export function performanceCurve(input: {
  barrel: CulvertBarrel
  tailwaterElFt: number | ((q: number) => number)
  roadway?: RoadwayOvertopping | null
  dischargesCfs: readonly number[]
}): CulvertResult[] {
  return input.dischargesCfs.map((q) =>
    analyseCulvert({
      barrel: input.barrel,
      dischargeCfs: q,
      tailwaterElFt:
        typeof input.tailwaterElFt === 'function' ? input.tailwaterElFt(q) : input.tailwaterElFt,
      roadway: input.roadway,
    }),
  )
}

/**
 * Outlet scour check — FHWA HEC-14 screening.
 *
 * Not a riprap design. It reports the outlet velocity against the permissible
 * velocity for the receiving material and says whether protection is required,
 * which is the level a concept study can support. Sizing the apron needs the
 * tailwater and the bed gradation, and both come from the field.
 */
export function outletScourCheck(
  outletVelocityFps: number,
  receiving: { label: string; permissibleFps: number },
): { adequate: boolean; finding: string } {
  const ok = outletVelocityFps <= receiving.permissibleFps
  return {
    adequate: ok,
    finding: ok
      ? `Outlet velocity ${outletVelocityFps.toFixed(2)} fps is within the ` +
        `${receiving.permissibleFps.toFixed(1)} fps permissible for ${receiving.label}. ` +
        'A standard endwall and a short stone apron suffice.'
      : `Outlet velocity ${outletVelocityFps.toFixed(2)} fps EXCEEDS the ` +
        `${receiving.permissibleFps.toFixed(1)} fps permissible for ${receiving.label}. ` +
        'An energy dissipator or riprap apron designed to HEC-14 is required, ' +
        'sized on the field-surveyed tailwater and a bed gradation.',
  }
}
