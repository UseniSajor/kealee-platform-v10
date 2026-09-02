/**
 * Coordinate geometry — turning recorded calls into coordinates.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 *
 * `parse-pdf.ts` extracts metes-and-bounds calls from a plat as TEXT and
 * deliberately refuses to trace geometry out of the drawing, because a traced
 * line is a guess that renders identically to a measured one. That rule is
 * correct and is not relaxed here.
 *
 * But a recorded plat's calls are not a picture. They are the legal description
 * of the boundary, written in words, and computing coordinates from them is
 * arithmetic with a checkable answer: a traverse either closes or it does not.
 * That is a categorically different act from tracing pixels, and it is what a
 * drafter has always done with a deed.
 *
 * So this module computes. It does not decide what the result is worth — that
 * is `recorded-plat.ts`, which holds the geometry below survey grade until a
 * licensed surveyor certifies it.
 *
 * ── What a traverse can and cannot establish ───────────────────────────────
 *
 * Calls give SHAPE and ORIENTATION. They do not give POSITION: a bearing and a
 * distance say where the next corner is relative to the last one, and nothing
 * anywhere in the description says where on the earth the first corner sits.
 * Position comes from a stated point-of-beginning coordinate, or from fitting
 * the computed figure to another source — and a fit is a fit, never a survey
 * position. `georeferenceTraverse` keeps that distinction in the return type
 * rather than in a comment.
 *
 * Bearings are quadrant bearings on the plat's own basis. Rotating them onto
 * grid north is only ever done from a STATED basis-of-bearings rotation. A
 * best-fit rotation would be inventing a datum relationship out of coincidence,
 * which is the same class of error as a silent datum conversion.
 */

import type { Position, Ring } from '../site-plan/site-twin'

export const COGO_VERSION = 'kealee-cogo-1.0.0'

// ── Bearings ────────────────────────────────────────────────────────────────

export type Quadrant = 'NE' | 'SE' | 'SW' | 'NW'

export interface Bearing {
  quadrant: Quadrant
  degrees: number
  minutes: number
  seconds: number
  /** Clockwise from north, 0–360. The form every computation below uses. */
  azimuthDeg: number
  /** Normalised text, e.g. `N 45°30'00" E`. */
  formatted: string
}

/**
 * Accepts the forms a plat, a deed and this repo's own PDF parser produce:
 *
 *   N 45°30'00" E      the drafting convention
 *   N 45-30-00 E       what `parse-pdf.ts#dmsToText` emits
 *   N45 30 00E         OCR, with the separators eaten
 *   S 12.5 W           decimal degrees, occasionally seen in tables
 *   DUE NORTH          a real call on old descriptions
 *
 * Returns null rather than guessing. A misread bearing puts a corner in the
 * wrong place and every check downstream still passes.
 */
export function parseBearing(raw: string): Bearing | null {
  const s = String(raw ?? '').trim().toUpperCase()
  if (!s) return null

  const cardinal = s.replace(/^DUE\s+/, '')
  if (/^(NORTH|N)$/.test(cardinal)) return bearingFrom('NE', 0, 0, 0)
  if (/^(SOUTH|S)$/.test(cardinal)) return bearingFrom('SE', 0, 0, 0)
  if (/^(EAST|E)$/.test(cardinal)) return bearingFrom('NE', 90, 0, 0)
  if (/^(WEST|W)$/.test(cardinal)) return bearingFrom('NW', 90, 0, 0)

  const m = s.match(
    /^([NS])\s*(\d{1,3}(?:\.\d+)?)\s*(?:[°D\-\s]\s*(\d{1,2}(?:\.\d+)?))?\s*(?:['´’\-\s]\s*(\d{1,2}(?:\.\d+)?))?\s*["”]?\s*([EW])$/,
  )
  if (!m) return null

  const ns = m[1] as 'N' | 'S'
  const ew = m[5] as 'E' | 'W'
  let deg = Number(m[2])
  let min = m[3] != null ? Number(m[3]) : 0
  let sec = m[4] != null ? Number(m[4]) : 0

  // A decimal in the degrees field with no minutes means decimal degrees.
  if (m[3] == null && !Number.isInteger(deg)) {
    const whole = Math.floor(deg)
    const frac = (deg - whole) * 60
    min = Math.floor(frac)
    sec = Math.round((frac - min) * 60 * 100) / 100
    deg = whole
  }

  if (deg > 90 || min >= 60 || sec >= 60) return null

  const quadrant = `${ns}${ew}` as Quadrant
  return bearingFrom(quadrant, deg, min, sec)
}

function bearingFrom(quadrant: Quadrant, degrees: number, minutes: number, seconds: number): Bearing {
  const angle = degrees + minutes / 60 + seconds / 3600
  const azimuthDeg =
    quadrant === 'NE' ? angle
      : quadrant === 'SE' ? 180 - angle
        : quadrant === 'SW' ? 180 + angle
          : 360 - angle
  return {
    quadrant,
    degrees,
    minutes,
    seconds,
    azimuthDeg: (azimuthDeg + 360) % 360,
    formatted:
      `${quadrant[0]} ${degrees}°${String(minutes).padStart(2, '0')}'` +
      `${String(Math.round(seconds)).padStart(2, '0')}" ${quadrant[1]}`,
  }
}

/** Azimuth back to a quadrant bearing, for labelling a computed line. */
export function azimuthToBearing(azimuthDeg: number): Bearing {
  const az = ((azimuthDeg % 360) + 360) % 360
  const quadrant: Quadrant =
    az <= 90 ? 'NE' : az <= 180 ? 'SE' : az <= 270 ? 'SW' : 'NW'
  const angle =
    quadrant === 'NE' ? az
      : quadrant === 'SE' ? 180 - az
        : quadrant === 'SW' ? az - 180
          : 360 - az
  const d = Math.floor(angle)
  const mFloat = (angle - d) * 60
  const mi = Math.floor(mFloat)
  const se = Math.round((mFloat - mi) * 60)
  // Rounding seconds to 60 must carry, or the label reads 45°29'60".
  return se === 60
    ? bearingFrom(quadrant, mi === 59 ? d + 1 : d, mi === 59 ? 0 : mi + 1, 0)
    : bearingFrom(quadrant, d, mi, se)
}

// ── Courses ─────────────────────────────────────────────────────────────────

export interface LineCourse {
  kind: 'line'
  /** As written on the instrument. Parsed, never rewritten. */
  bearing: string
  distanceFt: number
  monument?: string
  /** Which call on the instrument this is, for the closure report. */
  label?: string
}

/**
 * A circular curve, as a plat states one.
 *
 * Plats give radius plus arc length, and usually a chord bearing and chord
 * length as a check. Chord bearing is preferred for orientation when present:
 * assuming tangency to the previous course is right most of the time and wrong
 * silently the rest of the time, at a compound curve or a broken-back.
 */
export interface CurveCourse {
  kind: 'curve'
  radiusFt: number
  arcLengthFt: number
  /** Direction of curvature along the direction of travel. */
  turn: 'left' | 'right'
  /** Bearing of the long chord, when the instrument states it. */
  chordBearing?: string
  chordFt?: number
  monument?: string
  label?: string
}

export type Course = LineCourse | CurveCourse

export interface ComputedCourse {
  index: number
  label: string
  kind: 'line' | 'curve'
  /** Bearing actually used, after parsing and any stated rotation. */
  bearing: Bearing | null
  distanceFt: number
  deltaEastFt: number
  deltaNorthFt: number
  from: Position
  to: Position
  /** Vertices this course contributed, curves being segmented. */
  vertices: Position[]
  warnings: string[]
}

export interface TraverseOptions {
  /**
   * Coordinate of the point of beginning, as [easting, northing].
   * Omitted, the traverse is computed on a local grid with the POB at the
   * origin and `georeferenced` is false.
   */
  pointOfBeginning?: Position
  /**
   * Rotation applied to every bearing, in degrees clockwise, to bring the
   * instrument's basis of bearings onto the target grid's north.
   *
   * ONLY ever a value the instrument or the surveyor states. There is no
   * best-fit rotation in this module, by design.
   */
  basisRotationDeg?: number
  /** Maximum chord length when segmenting a curve. Default 2 ft. */
  curveChordFt?: number
}

export interface TraverseResult {
  /** Closed ring, first vertex repeated last. Empty when nothing computed. */
  ring: Ring
  courses: ComputedCourse[]
  /** Misclosure in easting and northing, feet. */
  closureEastFt: number
  closureNorthFt: number
  /** Linear misclosure, feet. */
  closureDistanceFt: number
  /** Bearing of the misclosure vector — points at where the error accumulated. */
  closureBearing: Bearing | null
  perimeterFt: number
  /** Denominator of the 1:N precision ratio. Null when closure is exact. */
  precisionDenominator: number | null
  /** Shoelace area of the computed figure, square feet. */
  areaSqFt: number
  georeferenced: boolean
  basisRotationDeg: number
  adjustment: 'none' | 'compass_rule'
  cogoVersion: string
  warnings: string[]
}

const DEFAULT_CURVE_CHORD_FT = 2

/**
 * Computes a traverse from a sequence of calls.
 *
 * Nothing is adjusted here. The raw computation and its misclosure are the
 * evidence; `applyCompassRule` is a separate, recorded step, because an
 * adjustment applied automatically hides the one number that says whether the
 * calls were read correctly.
 */
export function computeTraverse(courses: Course[], opts: TraverseOptions = {}): TraverseResult {
  const warnings: string[] = []
  const rotation = opts.basisRotationDeg ?? 0
  const chordMax = opts.curveChordFt ?? DEFAULT_CURVE_CHORD_FT
  const start: Position = opts.pointOfBeginning ?? [0, 0]

  const computed: ComputedCourse[] = []
  let cursor: Position = [start[0], start[1]]
  let heading: number | null = null
  let perimeter = 0

  courses.forEach((course, i) => {
    const label = course.label ?? `Call ${i + 1}`
    const cw: string[] = []

    if (course.kind === 'line') {
      const b = parseBearing(course.bearing)
      if (!b) {
        cw.push(`Bearing "${course.bearing}" was not recognised, so this call contributes no geometry.`)
        computed.push({
          index: i, label, kind: 'line', bearing: null, distanceFt: course.distanceFt,
          deltaEastFt: 0, deltaNorthFt: 0, from: cursor, to: cursor, vertices: [], warnings: cw,
        })
        return
      }
      if (!Number.isFinite(course.distanceFt) || course.distanceFt <= 0) {
        cw.push('Distance is missing or not positive, so this call contributes no geometry.')
        computed.push({
          index: i, label, kind: 'line', bearing: b, distanceFt: course.distanceFt,
          deltaEastFt: 0, deltaNorthFt: 0, from: cursor, to: cursor, vertices: [], warnings: cw,
        })
        return
      }

      const az = ((b.azimuthDeg + rotation) % 360 + 360) % 360
      const rad = (az * Math.PI) / 180
      const dE = course.distanceFt * Math.sin(rad)
      const dN = course.distanceFt * Math.cos(rad)
      const to: Position = [cursor[0] + dE, cursor[1] + dN]

      computed.push({
        index: i, label, kind: 'line', bearing: b, distanceFt: course.distanceFt,
        deltaEastFt: dE, deltaNorthFt: dN, from: cursor, to, vertices: [to], warnings: cw,
      })
      perimeter += course.distanceFt
      heading = az
      cursor = to
      return
    }

    // ── Curve ───────────────────────────────────────────────────────────────
    const { radiusFt, arcLengthFt, turn } = course
    if (!(radiusFt > 0) || !(arcLengthFt > 0)) {
      cw.push('Curve needs a positive radius and arc length; this call contributes no geometry.')
      computed.push({
        index: i, label, kind: 'curve', bearing: null, distanceFt: arcLengthFt,
        deltaEastFt: 0, deltaNorthFt: 0, from: cursor, to: cursor, vertices: [], warnings: cw,
      })
      return
    }

    const deltaRad = arcLengthFt / radiusFt
    if (deltaRad > Math.PI * 2) {
      cw.push('Arc length exceeds the full circle for the stated radius — check the call.')
    }
    const halfDeltaDeg = (deltaRad * 180) / Math.PI / 2
    const chordFt = 2 * radiusFt * Math.sin(deltaRad / 2)

    // Orientation: the chord bearing when stated, otherwise tangency to the
    // previous course. Tangency is an assumption and is recorded as one.
    let chordAz: number
    const stated = course.chordBearing ? parseBearing(course.chordBearing) : null
    if (stated) {
      chordAz = ((stated.azimuthDeg + rotation) % 360 + 360) % 360
    } else if (heading != null) {
      chordAz = heading + (turn === 'right' ? halfDeltaDeg : -halfDeltaDeg)
      cw.push(
        'No chord bearing was stated, so the curve is oriented tangent to the previous course. ' +
        'Confirm against the instrument — a compound or broken-back curve is not tangent.',
      )
    } else {
      cw.push('A curve cannot open a traverse without a stated chord bearing; this call contributes no geometry.')
      computed.push({
        index: i, label, kind: 'curve', bearing: null, distanceFt: arcLengthFt,
        deltaEastFt: 0, deltaNorthFt: 0, from: cursor, to: cursor, vertices: [], warnings: cw,
      })
      return
    }

    if (course.chordFt != null && Math.abs(course.chordFt - chordFt) > 0.1) {
      cw.push(
        `Stated chord ${course.chordFt.toFixed(2)} ft disagrees with the chord computed from the ` +
        `radius and arc (${chordFt.toFixed(2)} ft) by ${Math.abs(course.chordFt - chordFt).toFixed(2)} ft.`,
      )
    }

    // Tangent azimuth entering the curve is the chord azimuth swung back by
    // half the central angle, whichever way the curve turns.
    const entryAz = chordAz - (turn === 'right' ? halfDeltaDeg : -halfDeltaDeg)
    // Centre lies 90° off the entry tangent, on the inside of the turn.
    const toCentreAz = entryAz + (turn === 'right' ? 90 : -90)
    const centre: Position = [
      cursor[0] + radiusFt * Math.sin((toCentreAz * Math.PI) / 180),
      cursor[1] + radiusFt * Math.cos((toCentreAz * Math.PI) / 180),
    ]

    const steps = Math.max(2, Math.ceil(arcLengthFt / chordMax))
    const startAngle = Math.atan2(cursor[1] - centre[1], cursor[0] - centre[0])
    const sweep = (turn === 'right' ? -1 : 1) * deltaRad
    const vertices: Position[] = []
    for (let k = 1; k <= steps; k++) {
      const a = startAngle + (sweep * k) / steps
      vertices.push([centre[0] + radiusFt * Math.cos(a), centre[1] + radiusFt * Math.sin(a)])
    }

    const to = vertices[vertices.length - 1]
    computed.push({
      index: i, label, kind: 'curve', bearing: stated ?? azimuthToBearing(chordAz),
      distanceFt: arcLengthFt,
      deltaEastFt: to[0] - cursor[0], deltaNorthFt: to[1] - cursor[1],
      from: cursor, to, vertices, warnings: cw,
    })
    perimeter += arcLengthFt
    heading = chordAz + (turn === 'right' ? halfDeltaDeg : -halfDeltaDeg)
    cursor = to
  })

  for (const c of computed) warnings.push(...c.warnings.map(w => `${c.label}: ${w}`))

  const closureE = cursor[0] - start[0]
  const closureN = cursor[1] - start[1]
  const closureDist = Math.hypot(closureE, closureN)

  const vertices: Position[] = [start, ...computed.flatMap(c => c.vertices)]
  // The last course lands back on the point of beginning, give or take the
  // misclosure, so its endpoint is DROPPED and the ring closes on the POB
  // itself. Keeping both would duplicate a vertex — which is invisible in the
  // drawing and quietly wrong everywhere a vertex is averaged, the centroid fit
  // in `georeferenceTraverse` being the case that caught it. The misclosure is
  // not lost by closing here; it is reported, which is where it belongs.
  const ring: Ring =
    vertices.length >= 4
      ? { coordinates: [...vertices.slice(0, -1), [start[0], start[1]] as Position] }
      : { coordinates: [] }
  if (vertices.length < 4) {
    warnings.push(
      `Only ${vertices.length} vertex/vertices were computed. A closed figure needs at least three ` +
      'courses that each parsed to a bearing and a distance.',
    )
  }

  return {
    ring,
    courses: computed,
    closureEastFt: closureE,
    closureNorthFt: closureN,
    closureDistanceFt: closureDist,
    closureBearing: closureDist > 1e-9 ? azimuthToBearing((Math.atan2(closureE, closureN) * 180) / Math.PI) : null,
    perimeterFt: perimeter,
    precisionDenominator: closureDist > 1e-9 ? Math.round(perimeter / closureDist) : null,
    areaSqFt: ring.coordinates.length ? shoelaceAreaSqFt(ring) : 0,
    georeferenced: opts.pointOfBeginning != null,
    basisRotationDeg: rotation,
    adjustment: 'none',
    cogoVersion: COGO_VERSION,
    warnings,
  }
}

/** Absolute shoelace area of a ring in [easting, northing], square feet. */
export function shoelaceAreaSqFt(ring: Ring): number {
  const c = ring.coordinates
  if (c.length < 4) return 0
  let twice = 0
  for (let i = 0; i < c.length - 1; i++) {
    twice += c[i][0] * c[i + 1][1] - c[i + 1][0] * c[i][1]
  }
  return Math.abs(twice / 2)
}

/**
 * Compass-rule (Bowditch) adjustment.
 *
 * Distributes the misclosure across the courses in proportion to their length,
 * which is the standard assumption that angular and linear error accumulate
 * together. It is a SEPARATE call because an adjustment applied silently would
 * hide the misclosure, and the misclosure is the only evidence that the calls
 * were transcribed correctly in the first place.
 *
 * Adjusting a traverse that does not close acceptably does not make it close
 * acceptably — it moves the error into the corners. Check the precision ratio
 * before calling this, not after.
 */
export function applyCompassRule(traverse: TraverseResult): TraverseResult {
  if (traverse.perimeterFt <= 0 || traverse.closureDistanceFt === 0) {
    return { ...traverse, adjustment: 'compass_rule' }
  }

  const start = traverse.courses[0]?.from ?? [0, 0]
  let cursor: Position = [start[0], start[1]]
  let carried = 0

  const courses = traverse.courses.map(c => {
    if (c.vertices.length === 0) return { ...c, from: cursor, to: cursor }
    carried += c.distanceFt
    const share = carried / traverse.perimeterFt
    const corrE = -traverse.closureEastFt * share
    const corrN = -traverse.closureNorthFt * share
    // The correction accrues along the traverse, so each vertex inside a curve
    // is shifted by the share earned at the course's end. Sub-course
    // interpolation would imply a precision the method does not have.
    const vertices = c.vertices.map(v => [v[0] + corrE, v[1] + corrN] as Position)
    const to = vertices[vertices.length - 1]
    const out = {
      ...c,
      from: cursor,
      to,
      deltaEastFt: to[0] - cursor[0],
      deltaNorthFt: to[1] - cursor[1],
      vertices,
    }
    cursor = to
    return out
  })

  const vertices: Position[] = [start, ...courses.flatMap(c => c.vertices)]
  const ring: Ring =
    vertices.length >= 4
      ? { coordinates: [...vertices.slice(0, -1), [start[0], start[1]] as Position] }
      : { coordinates: [] }

  return {
    ...traverse,
    ring,
    courses,
    closureEastFt: 0,
    closureNorthFt: 0,
    closureDistanceFt: 0,
    closureBearing: null,
    precisionDenominator: traverse.precisionDenominator,
    areaSqFt: ring.coordinates.length ? shoelaceAreaSqFt(ring) : 0,
    adjustment: 'compass_rule',
    warnings: [
      ...traverse.warnings,
      `Compass-rule adjustment applied. The unadjusted misclosure was ` +
      `${traverse.closureDistanceFt.toFixed(3)} ft over ${traverse.perimeterFt.toFixed(2)} ft ` +
      `(1:${traverse.precisionDenominator ?? '—'}), and that ratio — not the adjusted figure — is ` +
      'the measure of whether the calls were read correctly.',
    ],
  }
}

// ── Georeferencing ──────────────────────────────────────────────────────────

export interface GeoreferenceResult {
  ring: Ring
  /** How position was established. Shape and bearings are always the plat's. */
  positionSource: 'stated_point_of_beginning' | 'fitted_to_reference' | 'none'
  translationEastFt: number
  translationNorthFt: number
  /** Per-vertex distance from the computed figure to the reference, feet. */
  residuals: number[] | null
  maxResidualFt: number | null
  rmsResidualFt: number | null
  /** Area of the computed figure against the reference's, as a fraction. */
  areaDifferenceFraction: number | null
  notes: string[]
}

/**
 * Places a computed figure on the grid.
 *
 * A traverse computed from calls has no position. This supplies one, and is
 * explicit about where it came from: a stated point of beginning is a survey
 * fact; a fit to a GIS parcel is a placement of authoritative SHAPE using
 * preliminary POSITION, which is a defensible thing to draw and an indefensible
 * thing to call a surveyed location.
 *
 * Translation only. There is no rotation search here — see the module header.
 */
export function georeferenceTraverse(
  traverse: TraverseResult,
  reference?: Ring | null,
): GeoreferenceResult {
  const notes: string[] = []
  if (traverse.ring.coordinates.length === 0) {
    return {
      ring: { coordinates: [] }, positionSource: 'none',
      translationEastFt: 0, translationNorthFt: 0,
      residuals: null, maxResidualFt: null, rmsResidualFt: null,
      areaDifferenceFraction: null,
      notes: ['No geometry was computed, so there is nothing to place.'],
    }
  }

  if (traverse.georeferenced) {
    notes.push(
      'Position is the stated point of beginning. Shape, bearings and distances are the recorded ' +
      'instrument\'s throughout.',
    )
    return {
      ring: traverse.ring, positionSource: 'stated_point_of_beginning',
      translationEastFt: 0, translationNorthFt: 0,
      residuals: null, maxResidualFt: null, rmsResidualFt: null,
      areaDifferenceFraction: reference ? areaFraction(traverse.ring, reference) : null,
      notes,
    }
  }

  if (!reference || reference.coordinates.length < 4) {
    notes.push(
      'No point of beginning was stated and no reference parcel was supplied, so the figure sits on ' +
      'a local grid with the point of beginning at the origin. It has correct shape and dimensions ' +
      'and no position on the earth.',
    )
    return {
      ring: traverse.ring, positionSource: 'none',
      translationEastFt: 0, translationNorthFt: 0,
      residuals: null, maxResidualFt: null, rmsResidualFt: null,
      areaDifferenceFraction: null, notes,
    }
  }

  const a = centroid(traverse.ring)
  const b = centroid(reference)
  const tE = b[0] - a[0]
  const tN = b[1] - a[1]
  const ring: Ring = {
    coordinates: traverse.ring.coordinates.map(c => [c[0] + tE, c[1] + tN] as Position),
  }

  const residuals = ring.coordinates
    .slice(0, -1)
    .map(p => nearestDistance(p, reference))
  const maxResidual = residuals.length ? Math.max(...residuals) : null
  const rms = residuals.length
    ? Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / residuals.length)
    : null

  notes.push(
    'Shape, bearings and distances are the recorded instrument\'s. POSITION is a centroid fit to the ' +
    'reference parcel and is therefore only as good as that parcel — it is not a surveyed location, ' +
    'and it is not rotated onto grid north unless a basis-of-bearings rotation was stated.',
  )
  if (maxResidual != null && maxResidual > 2) {
    notes.push(
      `Largest corner deviation from the reference is ${maxResidual.toFixed(2)} ft. A difference of ` +
      'this size is what a boundary certification exists to resolve; it is not resolved by moving ' +
      'either figure.',
    )
  }

  return {
    ring,
    positionSource: 'fitted_to_reference',
    translationEastFt: tE,
    translationNorthFt: tN,
    residuals,
    maxResidualFt: maxResidual,
    rmsResidualFt: rms,
    areaDifferenceFraction: areaFraction(ring, reference),
    notes,
  }
}

function centroid(ring: Ring): Position {
  const pts = ring.coordinates.slice(0, -1)
  const n = pts.length || 1
  return [
    pts.reduce((s, p) => s + p[0], 0) / n,
    pts.reduce((s, p) => s + p[1], 0) / n,
  ]
}

function areaFraction(a: Ring, b: Ring): number | null {
  const ab = shoelaceAreaSqFt(b)
  if (ab <= 0) return null
  return (shoelaceAreaSqFt(a) - ab) / ab
}

/** Shortest distance from a point to any segment of a ring. */
function nearestDistance(p: Position, ring: Ring): number {
  const c = ring.coordinates
  let best = Infinity
  for (let i = 0; i < c.length - 1; i++) {
    best = Math.min(best, pointToSegment(p, c[i], c[i + 1]))
  }
  return best === Infinity ? 0 : best
}

function pointToSegment(p: Position, a: Position, b: Position): number {
  const vx = b[0] - a[0], vy = b[1] - a[1]
  const wx = p[0] - a[0], wy = p[1] - a[1]
  const len2 = vx * vx + vy * vy
  if (len2 === 0) return Math.hypot(wx, wy)
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2))
  return Math.hypot(wx - t * vx, wy - t * vy)
}
