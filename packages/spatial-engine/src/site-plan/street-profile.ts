/**
 * Street plan & profile: the construction geometry a contractor builds a road
 * from and a DPIE reviewer checks — stationing, tangent bearings, horizontal
 * curve data, existing ground and the designed profile grade line (PGL) with
 * vertical curves, and edge-of-pavement / swale elevations at every station.
 *
 * Horizontal: the centreline polyline is split into tangents and circular
 * curves (runs of consistent turning, each fitted with a circle through its
 * end and middle points).
 *
 * Existing ground: interpolated between the two nearest contours of different
 * elevation on either side of the point (2-ft M-NCPPC contours).
 *
 * Vertical: PGL designed to the existing ground (balanced, least-squares on
 * the tangent grades), held between the minimum grade for an open-section
 * road to drain and the maximum residential grade, with a landing at the
 * highway connection, and symmetric parabolic vertical curves sized by K
 * (AASHTO Green Book 2018, Tables 3-34 / 3-37, 25 mph: crest K 12, sag K 26;
 * minimum length 3V = 75 ft).
 */
import type { Position } from './site-twin'

export const PROFILE_CRITERIA = {
  designSpeedMph: 25,
  minGradePct: 1.0,
  maxGradePct: 10.0,
  landingMaxGradePct: 3.0,
  landingLengthFt: 50,
  kCrest: 12,
  kSag: 26,
  minVcFt: 75,
  crossSlopePct: 2.0,
  shoulderSlopePct: 4.0,
  citation: 'AASHTO A Policy on Geometric Design of Highways and Streets (2018) Tables 3-34, 3-37 (25 mph); '
    + "PG DPW&T Specifications and Standards for Roadways and Bridges, Section III (2% cross slope, 2:1 max. slopes)",
}

export interface Tangent { kind: 'tangent'; staStart: number; staEnd: number; start: Position; end: Position; bearing: string; lengthFt: number }
export interface HCurve {
  kind: 'curve'; id: string; staPC: number; staPT: number; pc: Position; pt: Position; centre: Position
  radiusFt: number; deltaDeg: number; lengthFt: number; tangentFt: number; chordFt: number; chordBearing: string; direction: 'L' | 'R'
}
export interface PVI { sta: number; elev: number; gradeInPct: number | null; gradeOutPct: number | null; vcLengthFt: number; k: number | null; type: 'crest' | 'sag' | 'end' }
export interface ProfileStation { sta: number; existing: number | null; pgl: number; eopLeft: number; eopRight: number; at: Position }
export interface StreetProfile {
  criteria: typeof PROFILE_CRITERIA
  lengthFt: number
  alignment: (Tangent | HCurve)[]
  pvis: PVI[]
  stations: ProfileStation[]
  highLow: { sta: number; elev: number; kind: 'high' | 'low' }[]
  cutFill: { maxCutFt: number; maxFillFt: number }
}

const dist = (a: Position, b: Position) => Math.hypot(b[0] - a[0], b[1] - a[1])
const az = (a: Position, b: Position) => Math.atan2(b[0] - a[0], b[1] - a[1])   // from north, clockwise

export function bearingText(a: Position, b: Position): string {
  let t = (az(a, b) * 180) / Math.PI
  if (t < 0) t += 360
  const [ns, ew, ang] = t <= 90 ? ['N', 'E', t] : t <= 180 ? ['S', 'E', 180 - t] : t <= 270 ? ['S', 'W', t - 180] : ['N', 'W', 360 - t]
  const d = Math.floor(ang), mf = (ang - d) * 60, m = Math.floor(mf), s = Math.round((mf - m) * 60)
  const [dd, mm, ss] = s === 60 ? (m + 1 === 60 ? [d + 1, 0, 0] : [d, m + 1, 0]) : [d, m, s]
  return `${ns} ${String(dd).padStart(2, '0')}°${String(mm).padStart(2, '0')}'${String(ss).padStart(2, '0')}" ${ew}`
}

export function staText(s: number): string {
  const v = Math.max(0, s), h = Math.floor(v / 100)
  return `${h}+${(v - h * 100).toFixed(2).padStart(5, '0')}`
}

function circle3(a: Position, b: Position, c: Position): { c: Position; r: number } | null {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]))
  if (Math.abs(d) < 1e-9) return null
  const sq = (p: Position) => p[0] * p[0] + p[1] * p[1]
  const ux = (sq(a) * (b[1] - c[1]) + sq(b) * (c[1] - a[1]) + sq(c) * (a[1] - b[1])) / d
  const uy = (sq(a) * (c[0] - b[0]) + sq(b) * (a[0] - c[0]) + sq(c) * (b[0] - a[0])) / d
  return { c: [ux, uy], r: dist([ux, uy], a) }
}

/** Split a centreline polyline into tangents and fitted circular curves, stationed from its start. */
export function horizontalAlignment(cl: Position[], staOffset = 0): (Tangent | HCurve)[] {
  // A centreline polyline carries tangents as single long segments and curves
  // as runs of short chords. Segments of 60 ft or more are tangents; a run of
  // shorter segments between them is one circular curve, fitted through its
  // ends and middle vertex. The curve's PC and PT are the run's end vertices.
  const segL = cl.slice(1).map((p, i) => dist(cl[i], p))
  const TAN_MIN = 60
  const out: (Tangent | HCurve)[] = []
  let sta = staOffset, i = 0, n = 0
  while (i < cl.length - 1) {
    if (segL[i] >= TAN_MIN || cl.length === 2) {
      let j = i + 1
      while (j < cl.length - 1 && segL[j] >= TAN_MIN && Math.abs(az(cl[j - 1], cl[j]) - az(cl[j], cl[j + 1])) < 0.002) j++
      const L = cl.slice(i, j + 1).reduce((s, p, k, arr) => (k ? s + dist(arr[k - 1], p) : 0), 0)
      out.push({ kind: 'tangent', staStart: sta, staEnd: sta + L, start: cl[i], end: cl[j], bearing: bearingText(cl[i], cl[j]), lengthFt: L })
      sta += L; i = j; continue
    }
    let k = i
    while (k < cl.length - 1 && segL[k] < TAN_MIN) k++
    const pc = cl[i], pt = cl[k], mid = cl[Math.round((i + k) / 2)]
    const fit = k - i >= 2 ? circle3(pc, mid, pt) : null
    const chord = dist(pc, pt)
    if (!fit || fit.r > 5000) {
      const L = cl.slice(i, k + 1).reduce((s, p, m, arr) => (m ? s + dist(arr[m - 1], p) : 0), 0)
      out.push({ kind: 'tangent', staStart: sta, staEnd: sta + L, start: pc, end: pt, bearing: bearingText(pc, pt), lengthFt: L })
      sta += L; i = k; continue
    }
    const delta = 2 * Math.asin(Math.min(1, chord / (2 * fit.r)))
    const L = fit.r * delta
    const cross = (mid[0] - pc[0]) * (pt[1] - pc[1]) - (mid[1] - pc[1]) * (pt[0] - pc[0])
    n++
    out.push({
      kind: 'curve', id: `C${n}`, staPC: sta, staPT: sta + L, pc, pt, centre: fit.c, radiusFt: fit.r,
      deltaDeg: (delta * 180) / Math.PI, lengthFt: L, tangentFt: fit.r * Math.tan(delta / 2), chordFt: chord,
      chordBearing: bearingText(pc, pt), direction: cross < 0 ? 'L' : 'R',
    })
    sta += L; i = k
  }
  return out
}

/** Point and unit direction at a station along the polyline. */
function along(cl: Position[], cum: number[], s: number): { p: Position; u: Position } {
  s = Math.max(0, Math.min(cum[cum.length - 1], s))
  let i = 0
  while (i < cl.length - 2 && cum[i + 1] < s) i++
  const L = cum[i + 1] - cum[i] || 1, t = (s - cum[i]) / L
  const ux = (cl[i + 1][0] - cl[i][0]) / L, uy = (cl[i + 1][1] - cl[i][1]) / L
  return { p: [cl[i][0] + (cl[i + 1][0] - cl[i][0]) * t, cl[i][1] + (cl[i + 1][1] - cl[i][1]) * t], u: [ux, uy] }
}

function segDist(p: Position, a: Position, b: Position): number {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2))
  return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t)
}

/** Existing ground at p from contours: between the nearest contour and the nearest one of another elevation. */
export function groundFromContours(contours: { elevationFt: number; line: Position[] }[]) {
  return (p: Position): number | null => {
    const near = contours.map(c => {
      let d = Infinity
      for (let i = 1; i < c.line.length; i++) d = Math.min(d, segDist(p, c.line[i - 1], c.line[i]))
      return { z: c.elevationFt, d }
    }).filter(x => x.d < 150).sort((a, b) => a.d - b.d)
    if (!near.length) return null
    const a = near[0]
    if (a.d < 0.05) return a.z
    const b = near.find(x => Math.abs(x.z - a.z) > 0.01)
    if (!b) return a.z
    return a.z + ((b.z - a.z) * a.d) / (a.d + b.d)
  }
}

/** Elevation on a PVI profile with parabolic vertical curves. */
export function pglAt(pvis: PVI[], s: number): number {
  for (let i = 1; i < pvis.length - 1; i++) {
    const v = pvis[i], L = v.vcLengthFt
    if (L > 0 && s >= v.sta - L / 2 && s <= v.sta + L / 2) {
      const g1 = (v.gradeInPct ?? 0) / 100, g2 = (v.gradeOutPct ?? 0) / 100
      const x = s - (v.sta - L / 2), zPVC = v.elev - (g1 * L) / 2
      return zPVC + g1 * x + ((g2 - g1) / (2 * L)) * x * x
    }
  }
  let i = 0
  while (i < pvis.length - 2 && pvis[i + 1].sta < s) i++
  const a = pvis[i], b = pvis[i + 1]
  return a.elev + ((b.elev - a.elev) * (s - a.sta)) / ((b.sta - a.sta) || 1)
}

export function designStreetProfile(input: {
  centreline: Position[]
  contours: { elevationFt: number; line: Position[] }[]
  /** Station 0+00 at the existing edge of road (the connection). */
  connection?: Position[]
  halfPavementFt?: number
  stepFt?: number
  /** Run the profile on past the last vertex (bulb centre) to the far edge of pavement. */
  extendFt?: number
}): StreetProfile | null {
  const C = PROFILE_CRITERIA
  let cl = input.centreline.slice()
  if (cl.length < 2 || !input.contours.length) return null
  // start the alignment at the edge of road it connects to
  if (input.connection && input.connection.length >= 2) {
    const [e0, e1] = input.connection
    const a = cl[0], b = cl[1]
    const den = (b[0] - a[0]) * (e1[1] - e0[1]) - (b[1] - a[1]) * (e1[0] - e0[0])
    if (Math.abs(den) > 1e-9) {
      const t = ((e0[0] - a[0]) * (e1[1] - e0[1]) - (e0[1] - a[1]) * (e1[0] - e0[0])) / den
      if (t > -2 && t < 1) cl = [[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], ...cl.slice(1)]
    }
  }
  if (input.extendFt && input.extendFt > 0) {
    const a = cl[cl.length - 2], e = cl[cl.length - 1], L = dist(a, e) || 1
    cl = [...cl, [e[0] + ((e[0] - a[0]) / L) * input.extendFt, e[1] + ((e[1] - a[1]) / L) * input.extendFt]]
  }
  const cum = [0]
  for (let i = 1; i < cl.length; i++) cum.push(cum[i - 1] + dist(cl[i - 1], cl[i]))
  const total = cum[cum.length - 1]
  const ground = groundFromContours(input.contours)
  const step = input.stepFt ?? 25
  const ss: number[] = []
  for (let s = 0; s < total; s += step) ss.push(s)
  ss.push(total)
  const eg = ss.map(s => ground(along(cl, cum, s).p))
  const known = ss.map((s, i) => [s, eg[i]] as [number, number | null]).filter(x => x[1] != null) as [number, number][]
  if (known.length < 3) return null
  const egAt = (s: number) => {
    let i = 0
    while (i < known.length - 2 && known[i + 1][0] < s) i++
    const [s0, z0] = known[i], [s1, z1] = known[i + 1]
    return z0 + ((z1 - z0) * (s - s0)) / ((s1 - s0) || 1)
  }

  // PVIs: the connection, the end of the landing, then every ~150 ft to the end.
  const sp: number[] = [0, Math.min(C.landingLengthFt, total / 3)]
  const nMid = Math.max(1, Math.round((total - sp[1]) / 150))
  for (let k = 1; k <= nMid; k++) sp.push(sp[1] + ((total - sp[1]) * k) / nMid)
  // smoothed ground at each PVI (average over ±40 ft), then grades clamped
  const smooth = (s: number) => { let t = 0, n = 0; for (let d = -40; d <= 40; d += 10) { t += egAt(Math.max(0, Math.min(total, s + d))); n++ } return t / n }
  const z = sp.map((s, i) => (i === 0 ? egAt(0) : smooth(s)))
  const clampG = (g: number, max: number) => Math.sign(g || 1) * Math.min(max, Math.max(C.minGradePct, Math.abs(g)))
  for (let i = 1; i < sp.length; i++) {
    const max = i === 1 ? C.landingMaxGradePct : C.maxGradePct
    const g = clampG((100 * (z[i] - z[i - 1])) / (sp[i] - sp[i - 1]), max)
    z[i] = z[i - 1] + (g * (sp[i] - sp[i - 1])) / 100
  }
  const pvis: PVI[] = sp.map((s, i) => ({ sta: s, elev: z[i], gradeInPct: null, gradeOutPct: null, vcLengthFt: 0, k: null, type: 'end' as const }))
  for (let i = 0; i < pvis.length; i++) {
    if (i > 0) pvis[i].gradeInPct = (100 * (pvis[i].elev - pvis[i - 1].elev)) / (pvis[i].sta - pvis[i - 1].sta)
    if (i < pvis.length - 1) pvis[i].gradeOutPct = (100 * (pvis[i + 1].elev - pvis[i].elev)) / (pvis[i + 1].sta - pvis[i].sta)
  }
  for (let i = 1; i < pvis.length - 1; i++) {
    const v = pvis[i], A = (v.gradeOutPct ?? 0) - (v.gradeInPct ?? 0)
    v.type = A < 0 ? 'crest' : 'sag'
    if (Math.abs(A) < 1.0) continue                       // no curve needed for a grade break under 1%
    const K = A < 0 ? C.kCrest : C.kSag
    const room = Math.min(v.sta - pvis[i - 1].sta - pvis[i - 1].vcLengthFt / 2, pvis[i + 1].sta - v.sta) * 2 * 0.95
    v.vcLengthFt = Math.min(room, Math.max(C.minVcFt, Math.ceil((K * Math.abs(A)) / 5) * 5))
    v.k = v.vcLengthFt / Math.abs(A)
  }
  const half = input.halfPavementFt ?? 12
  const stations: ProfileStation[] = ss.map((s, i) => {
    const { p } = along(cl, cum, s), g = pglAt(pvis, s)
    const drop = (half * C.crossSlopePct) / 100
    return { sta: s, existing: eg[i], pgl: g, eopLeft: g - drop, eopRight: g - drop, at: p }
  })
  // high and low points on vertical curves
  const highLow: StreetProfile['highLow'] = []
  for (let i = 1; i < pvis.length - 1; i++) {
    const v = pvis[i], g1 = (v.gradeInPct ?? 0) / 100, g2 = (v.gradeOutPct ?? 0) / 100
    if (v.vcLengthFt > 0 && g1 * g2 < 0) {
      const x = (-g1 * v.vcLengthFt) / (g2 - g1), s = v.sta - v.vcLengthFt / 2 + x
      highLow.push({ sta: s, elev: pglAt(pvis, s), kind: g1 > 0 ? 'high' : 'low' })
    }
  }
  let maxCut = 0, maxFill = 0
  for (const st of stations) if (st.existing != null) { const d = st.pgl - st.existing; if (d > maxFill) maxFill = d; if (-d > maxCut) maxCut = -d }
  return {
    criteria: C, lengthFt: total, alignment: horizontalAlignment(cl), pvis, stations, highLow,
    cutFill: { maxCutFt: Number(maxCut.toFixed(2)), maxFillFt: Number(maxFill.toFixed(2)) },
  }
}
