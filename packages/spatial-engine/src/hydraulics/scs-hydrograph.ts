/**
 * SCS runoff hydrograph and level-pool routing.
 *
 * A peak discharge is a single number and it cannot answer the question that
 * matters most at a road crossing: where does the water GO. For that you need
 * volume against time on the way in, a stage-storage relation for what the
 * embankment impounds, and a stage-discharge relation for what leaves through
 * the culvert and over the road. Route the one through the other two and the
 * answer falls out.
 *
 * This matters here because the Fort Foote Road embankment is, in hydraulic
 * fact, an unregulated detention dam. It ponds twenty-one acre-feet across the
 * rear of these four lots and it releases far less than it receives. Any
 * proposal that fills the pond, or that enlarges the culvert, changes that —
 * and changes it for somebody downstream.
 *
 * ── Rainfall ────────────────────────────────────────────────────────────────
 *
 * NRCS 24-hour Type II distribution, which covers all of Maryland. Cumulative
 * fraction of the 24-hour depth against time, interpolated linearly between
 * the published breakpoints. The distribution is deliberately front-loaded to
 * a single sharp burst at hour 12; that burst is what sets the peak.
 *
 * ── Losses ──────────────────────────────────────────────────────────────────
 *
 * Curve number, applied to CUMULATIVE rainfall and differenced, which is the
 * correct way round. Applying the CN relation to each increment separately
 * double-counts the initial abstraction and understates runoff badly.
 *
 * ── Unit hydrograph ─────────────────────────────────────────────────────────
 *
 * NRCS dimensionless unit hydrograph, peak rate factor 484, with
 *
 *     Tp = D/2 + 0.6 * Tc          qp = 484 * A * Q / Tp
 *
 * PRF 484 is the national default. Flat coastal watersheds are sometimes run at
 * 300 or lower, which would reduce the peak; 484 is the conservative choice and
 * the one a Prince George's County reviewer expects unless told otherwise.
 *
 * ── Routing ─────────────────────────────────────────────────────────────────
 *
 * Storage indication (modified Puls):
 *
 *     (2*S2/dt + O2) = (I1 + I2) + (2*S1/dt - O1)
 *
 * The left side is a monotonic function of stage, so each step is one lookup
 * against a pre-built indication curve. No iteration, no instability.
 */

/** NRCS 24-hour Type II cumulative rainfall, fraction of the 24-hour depth. */
const TYPE_II_24HR: readonly (readonly [number, number])[] = [
  [0, 0], [2, 0.022], [4, 0.048], [6, 0.08], [7, 0.098], [8, 0.12],
  [8.5, 0.133], [9, 0.147], [9.5, 0.163], [9.75, 0.172], [10, 0.181],
  [10.5, 0.204], [11, 0.235], [11.5, 0.283], [11.75, 0.357], [12, 0.663],
  [12.5, 0.735], [13, 0.772], [13.5, 0.799], [14, 0.82], [16, 0.88],
  [20, 0.952], [24, 1.0],
]

/** NRCS dimensionless unit hydrograph, peak rate factor 484. */
const DIMENSIONLESS_UH: readonly (readonly [number, number])[] = [
  [0, 0], [0.1, 0.03], [0.2, 0.1], [0.3, 0.19], [0.4, 0.31], [0.5, 0.47],
  [0.6, 0.66], [0.7, 0.82], [0.8, 0.93], [0.9, 0.99], [1.0, 1.0],
  [1.1, 0.99], [1.2, 0.93], [1.3, 0.86], [1.4, 0.78], [1.5, 0.68],
  [1.6, 0.56], [1.8, 0.39], [2.0, 0.28], [2.2, 0.207], [2.4, 0.147],
  [2.6, 0.107], [2.8, 0.077], [3.0, 0.055], [3.5, 0.025], [4.0, 0.011],
  [4.5, 0.005], [5.0, 0],
]

function interp(table: readonly (readonly [number, number])[], x: number): number {
  if (x <= table[0][0]) return table[0][1]
  const last = table[table.length - 1]
  if (x >= last[0]) return last[1]
  for (let i = 0; i < table.length - 1; i++) {
    const [x0, y0] = table[i]
    const [x1, y1] = table[i + 1]
    if (x >= x0 && x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
  }
  return last[1]
}

export interface Hydrograph {
  /** Time step, hr. */
  dtHr: number
  /** Ordinates, cfs, starting at t = 0. */
  qCfs: number[]
  peakCfs: number
  peakTimeHr: number
  volumeAcFt: number
}

export function hydrographVolumeAcFt(h: { dtHr: number; qCfs: readonly number[] }): number {
  let s = 0
  for (const q of h.qCfs) s += q
  // cfs * hr -> ac-ft : 3600 s/hr / 43560 sq ft/ac
  return (s * h.dtHr * 3600) / 43560
}

/**
 * Build the runoff hydrograph for a 24-hour Type II storm.
 */
export function scsRunoffHydrograph(input: {
  areaSqMi: number
  curveNumber: number
  rainfall24hrIn: number
  tcHr: number
  /** Computational step, hr. Defaults to a step that resolves the hour-12 burst. */
  dtHr?: number
}): Hydrograph {
  const dt = input.dtHr ?? Math.min(0.1, input.tcHr * 0.2)
  const S = 1000 / input.curveNumber - 10
  const Ia = 0.2 * S

  // Cumulative runoff at each step, then differenced to give the increments.
  const nSteps = Math.ceil(24 / dt) + 1
  const cumQ: number[] = []
  for (let i = 0; i < nSteps; i++) {
    const t = i * dt
    const P = interp(TYPE_II_24HR, t) * input.rainfall24hrIn
    cumQ.push(P <= Ia ? 0 : Math.pow(P - Ia, 2) / (P - Ia + S))
  }
  const incQ: number[] = []
  for (let i = 1; i < cumQ.length; i++) incQ.push(cumQ[i] - cumQ[i - 1])

  // Unit hydrograph for a dt-hour increment of 1 inch.
  const Tp = dt / 2 + 0.6 * input.tcHr
  const qp = (484 * input.areaSqMi * 1.0) / Tp
  const uhLen = Math.ceil((5.0 * Tp) / dt) + 1
  const uh: number[] = []
  for (let i = 0; i < uhLen; i++) uh.push(qp * interp(DIMENSIONLESS_UH, (i * dt) / Tp))

  // Convolve.
  const out = new Array<number>(incQ.length + uh.length).fill(0)
  for (let i = 0; i < incQ.length; i++) {
    if (incQ[i] <= 0) continue
    for (let j = 0; j < uh.length; j++) out[i + j] += incQ[i] * uh[j]
  }
  let peak = 0
  let peakAt = 0
  out.forEach((q, i) => {
    if (q > peak) {
      peak = q
      peakAt = i * dt
    }
  })
  return {
    dtHr: dt,
    qCfs: out,
    peakCfs: peak,
    peakTimeHr: peakAt,
    volumeAcFt: hydrographVolumeAcFt({ dtHr: dt, qCfs: out }),
  }
}

export interface StageRow {
  elevationFt: number
  /** Storage at this stage, cubic feet. */
  storageCuFt: number
  /** Total outflow at this stage, cfs — culvert plus anything over the road. */
  outflowCfs: number
}

export interface RoutingResult {
  inflowPeakCfs: number
  outflowPeakCfs: number
  /** Peak stage reached, ft. */
  peakStageFt: number
  /** Peak storage, acre-feet. */
  peakStorageAcFt: number
  /** Hours between the inflow peak and the outflow peak. */
  lagHr: number
  /** Outflow peak as a fraction of inflow peak. */
  attenuation: number
  outflowCfs: number[]
  stageFt: number[]
  dtHr: number
}

/**
 * Level-pool route an inflow hydrograph through a stage-storage-discharge
 * relation. Storage indication, as above.
 *
 * The rating must be monotonic in stage and must start at the stage where
 * storage and outflow are both zero.
 */
export function routeLevelPool(input: {
  inflow: Hydrograph
  rating: readonly StageRow[]
  /** Starting stage. Defaults to the lowest row. */
  initialStageFt?: number
}): RoutingResult {
  const { inflow, rating } = input
  const dt = inflow.dtHr
  const dtSec = dt * 3600

  // Indication curve: N(stage) = 2*S/dt + O, monotonic increasing.
  const N = rating.map((r) => (2 * r.storageCuFt) / dtSec + r.outflowCfs)
  const stageFromN = (n: number): number => {
    if (n <= N[0]) return rating[0].elevationFt
    for (let i = 0; i < N.length - 1; i++) {
      if (n >= N[i] && n <= N[i + 1]) {
        const t = (n - N[i]) / Math.max(1e-9, N[i + 1] - N[i])
        return rating[i].elevationFt + (rating[i + 1].elevationFt - rating[i].elevationFt) * t
      }
    }
    return rating[rating.length - 1].elevationFt
  }
  const at = (el: number, key: 'storageCuFt' | 'outflowCfs'): number => {
    if (el <= rating[0].elevationFt) return rating[0][key]
    for (let i = 0; i < rating.length - 1; i++) {
      if (el >= rating[i].elevationFt && el <= rating[i + 1].elevationFt) {
        const t = (el - rating[i].elevationFt) / Math.max(1e-9, rating[i + 1].elevationFt - rating[i].elevationFt)
        return rating[i][key] + (rating[i + 1][key] - rating[i][key]) * t
      }
    }
    return rating[rating.length - 1][key]
  }

  let stage = input.initialStageFt ?? rating[0].elevationFt
  let S = at(stage, 'storageCuFt')
  let O = at(stage, 'outflowCfs')
  const outflow: number[] = []
  const stages: number[] = []
  let peakO = 0
  let peakOAt = 0
  let peakStage = stage

  for (let i = 0; i < inflow.qCfs.length - 1; i++) {
    const I1 = inflow.qCfs[i]
    const I2 = inflow.qCfs[i + 1]
    const n2 = I1 + I2 + ((2 * S) / dtSec - O)
    stage = stageFromN(n2)
    S = at(stage, 'storageCuFt')
    O = at(stage, 'outflowCfs')
    outflow.push(O)
    stages.push(stage)
    if (O > peakO) {
      peakO = O
      peakOAt = i * dt
    }
    if (stage > peakStage) peakStage = stage
  }

  return {
    inflowPeakCfs: inflow.peakCfs,
    outflowPeakCfs: peakO,
    peakStageFt: peakStage,
    peakStorageAcFt: at(peakStage, 'storageCuFt') / 43560,
    lagHr: peakOAt - inflow.peakTimeHr,
    attenuation: inflow.peakCfs > 0 ? peakO / inflow.peakCfs : 0,
    outflowCfs: outflow,
    stageFt: stages,
    dtHr: dt,
  }
}
