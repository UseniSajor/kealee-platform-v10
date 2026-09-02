/**
 * Recorded plat as a boundary source — coordinate geometry and the gate above it.
 *
 * The behaviours under test are the ones where being wrong is invisible: a
 * bearing parsed into the wrong quadrant, a misclosure hidden by an automatic
 * adjustment, a fitted position described as a surveyed one, or a plat promoted
 * to survey grade without a surveyor.
 */

import {
  parseBearing, azimuthToBearing, computeTraverse, applyCompassRule,
  georeferenceTraverse, shoelaceAreaSqFt, COGO_VERSION,
  type Course,
} from '../survey/cogo'
import {
  buildRecordedPlatBoundary, evaluatePlatBoundaryPromotion, platSourceRecord,
  PLAT_PROMOTABLE_KINDS, PLAT_TRANSCRIPTION_CLOSURE,
  type PlatCertification,
} from '../survey/recorded-plat'
import type { Ring } from '../site-plan/site-twin'

/**
 * A rectangle on a rotated basis, sized to a real Prince George's infill lot:
 * 120 x 80 = 9,600 sq ft. It closes exactly, so any misclosure the tests see is
 * the code's, not the fixture's.
 */
const LOT_CALLS: Course[] = [
  { kind: 'line', bearing: 'N 12-30-00 E', distanceFt: 120, label: 'Call 1' },
  { kind: 'line', bearing: 'S 77-30-00 E', distanceFt: 80, label: 'Call 2' },
  { kind: 'line', bearing: 'S 12-30-00 W', distanceFt: 120, label: 'Call 3' },
  { kind: 'line', bearing: 'N 77-30-00 W', distanceFt: 80, label: 'Call 4' },
]

const REFERENCE: Ring = {
  coordinates: [
    [1340000, 440000], [1340025.98, 440117.15], [1340104.10, 440099.83],
    [1340078.12, 439982.68], [1340000, 440000],
  ],
}

describe('bearing parsing', () => {
  it('reads every written form a plat, a deed and the PDF parser produce', () => {
    // The hyphenated form is exactly what parse-pdf.ts#dmsToText emits.
    expect(parseBearing('N 45-30-00 E')?.azimuthDeg).toBeCloseTo(45.5, 6)
    expect(parseBearing('N 45°30\'00" E')?.azimuthDeg).toBeCloseTo(45.5, 6)
    expect(parseBearing('n45 30 00e')?.azimuthDeg).toBeCloseTo(45.5, 6)
    expect(parseBearing('DUE NORTH')?.azimuthDeg).toBe(0)
    expect(parseBearing('S 12.5 W')?.azimuthDeg).toBeCloseTo(192.5, 6)
  })

  it('puts each quadrant on the right azimuth', () => {
    expect(parseBearing('N 30-00-00 E')?.azimuthDeg).toBeCloseTo(30, 9)
    expect(parseBearing('S 30-00-00 E')?.azimuthDeg).toBeCloseTo(150, 9)
    expect(parseBearing('S 30-00-00 W')?.azimuthDeg).toBeCloseTo(210, 9)
    expect(parseBearing('N 30-00-00 W')?.azimuthDeg).toBeCloseTo(330, 9)
  })

  it('returns null rather than guessing at something it cannot read', () => {
    // A misread bearing puts a corner in the wrong place and every downstream
    // check still passes, so refusing is the only safe answer.
    expect(parseBearing('N 95-00-00 E')).toBeNull()
    expect(parseBearing('N 45-72-00 E')).toBeNull()
    expect(parseBearing('northeasterly along the road')).toBeNull()
    expect(parseBearing('')).toBeNull()
  })

  it('round-trips an azimuth back to a quadrant bearing without producing 60 seconds', () => {
    for (const az of [0, 12.5, 89.9999, 90, 179.5, 270, 359.99997]) {
      const b = azimuthToBearing(az)
      expect(b.seconds).toBeLessThan(60)
      expect(b.minutes).toBeLessThan(60)
      // Compare the short way round the circle: rounding to whole seconds can
      // carry 359.99997° to due north, which is the same direction.
      const diff = Math.abs(((((b.azimuthDeg - az + 180) % 360) + 360) % 360) - 180)
      expect(diff).toBeLessThan(0.005)
    }
  })
})

describe('traverse computation', () => {
  it('computes a closed figure and its area from recorded calls', () => {
    const t = computeTraverse(LOT_CALLS)
    expect(t.closureDistanceFt).toBeCloseTo(0, 6)
    expect(t.areaSqFt).toBeCloseTo(9_600, 3)
    expect(t.perimeterFt).toBeCloseTo(400, 6)
    // Ring is closed: first vertex repeated last.
    const c = t.ring.coordinates
    expect(c[0]).toEqual(c[c.length - 1])
    expect(t.cogoVersion).toBe(COGO_VERSION)
  })

  it('reports misclosure as a ratio rather than swallowing it', () => {
    const sloppy: Course[] = [
      ...LOT_CALLS.slice(0, 3),
      { kind: 'line', bearing: 'N 77-30-00 W', distanceFt: 79.6, label: 'Call 4' },
    ]
    const t = computeTraverse(sloppy)
    expect(t.closureDistanceFt).toBeCloseTo(0.4, 3)
    expect(t.precisionDenominator).toBe(Math.round(t.perimeterFt / t.closureDistanceFt))
    expect(t.closureBearing).not.toBeNull()
    expect(t.adjustment).toBe('none')
  })

  it('keeps an unreadable call out of the geometry and says which one', () => {
    const t = computeTraverse([
      LOT_CALLS[0],
      { kind: 'line', bearing: 'thence northeasterly', distanceFt: 80, label: 'Call 2' },
      LOT_CALLS[2],
    ])
    expect(t.courses[1].bearing).toBeNull()
    expect(t.courses[1].vertices).toHaveLength(0)
    expect(t.warnings.join(' ')).toContain('Call 2')
  })

  it('places the point of beginning where it is told, or at the origin', () => {
    const local = computeTraverse(LOT_CALLS)
    expect(local.georeferenced).toBe(false)
    expect(local.ring.coordinates[0]).toEqual([0, 0])

    const placed = computeTraverse(LOT_CALLS, { pointOfBeginning: [1340000, 440000] })
    expect(placed.georeferenced).toBe(true)
    expect(placed.ring.coordinates[0]).toEqual([1340000, 440000])
    expect(placed.areaSqFt).toBeCloseTo(local.areaSqFt, 6)
  })

  it('rotates bearings only by a stated basis rotation', () => {
    const t = computeTraverse(LOT_CALLS, { basisRotationDeg: 90 })
    expect(t.basisRotationDeg).toBe(90)
    // Rotating every bearing preserves shape, so area is unchanged.
    expect(t.areaSqFt).toBeCloseTo(9_600, 3)
    expect(t.courses[0].deltaNorthFt).toBeCloseTo(120 * Math.cos((102.5 * Math.PI) / 180), 6)
  })

  it('segments a curve from its radius and arc length', () => {
    const quarter = 50 * (Math.PI / 2)
    const t = computeTraverse([
      { kind: 'line', bearing: 'N 00-00-00 E', distanceFt: 50, label: 'Tangent' },
      {
        kind: 'curve', radiusFt: 50, arcLengthFt: quarter, turn: 'right',
        chordBearing: 'N 45-00-00 E', label: 'Curve',
      },
    ])
    const curve = t.courses[1]
    expect(curve.vertices.length).toBeGreaterThan(10)
    // A quarter circle of radius 50 moves 50 east and 50 north from its start.
    expect(curve.to[0] - curve.from[0]).toBeCloseTo(50, 2)
    expect(curve.to[1] - curve.from[1]).toBeCloseTo(50, 2)
    expect(t.perimeterFt).toBeCloseTo(50 + quarter, 6)
  })

  it('flags a curve it had to assume was tangent, and refuses to open on one', () => {
    const quarter = 50 * (Math.PI / 2)
    const assumed = computeTraverse([
      { kind: 'line', bearing: 'N 00-00-00 E', distanceFt: 50 },
      { kind: 'curve', radiusFt: 50, arcLengthFt: quarter, turn: 'right', label: 'Curve' },
    ])
    expect(assumed.warnings.join(' ')).toContain('tangent')

    const opening = computeTraverse([
      { kind: 'curve', radiusFt: 50, arcLengthFt: quarter, turn: 'right', label: 'Curve' },
    ])
    expect(opening.courses[0].vertices).toHaveLength(0)
    expect(opening.warnings.join(' ')).toContain('cannot open a traverse')
  })

  it('catches a stated chord that disagrees with the radius and arc', () => {
    const t = computeTraverse([
      { kind: 'line', bearing: 'N 00-00-00 E', distanceFt: 50 },
      {
        kind: 'curve', radiusFt: 50, arcLengthFt: 50 * (Math.PI / 2), turn: 'right',
        chordBearing: 'N 45-00-00 E', chordFt: 65, label: 'Curve',
      },
    ])
    // The true chord is 70.71 ft; a stated 65 is a transcription error.
    expect(t.warnings.join(' ')).toContain('disagrees with the chord computed')
  })
})

describe('compass-rule adjustment', () => {
  it('is never applied on its own', () => {
    expect(computeTraverse(LOT_CALLS).adjustment).toBe('none')
  })

  it('closes the figure and keeps the original ratio in the record', () => {
    const sloppy: Course[] = [
      ...LOT_CALLS.slice(0, 3),
      { kind: 'line', bearing: 'N 77-30-00 W', distanceFt: 79.6 },
    ]
    const raw = computeTraverse(sloppy)
    const adj = applyCompassRule(raw)

    expect(adj.adjustment).toBe('compass_rule')
    expect(adj.closureDistanceFt).toBe(0)
    // The unadjusted ratio survives, because it is the only evidence that the
    // calls were transcribed correctly.
    expect(adj.precisionDenominator).toBe(raw.precisionDenominator)
    expect(adj.warnings.join(' ')).toContain(raw.closureDistanceFt.toFixed(3))
    expect(adj.ring.coordinates[0]).toEqual(adj.ring.coordinates[adj.ring.coordinates.length - 1])
  })
})

describe('georeferencing', () => {
  it('leaves an unpositioned figure on a local grid and says so', () => {
    const g = georeferenceTraverse(computeTraverse(LOT_CALLS), null)
    expect(g.positionSource).toBe('none')
    expect(g.notes.join(' ')).toContain('no position on the earth')
  })

  it('treats a stated point of beginning as position and does not move it', () => {
    const t = computeTraverse(LOT_CALLS, { pointOfBeginning: [1340000, 440000] })
    const g = georeferenceTraverse(t, REFERENCE)
    expect(g.positionSource).toBe('stated_point_of_beginning')
    expect(g.translationEastFt).toBe(0)
    expect(g.translationNorthFt).toBe(0)
    expect(g.ring.coordinates[0]).toEqual([1340000, 440000])
  })

  it('labels a fit to a GIS parcel as a fit, never as a surveyed position', () => {
    const g = georeferenceTraverse(computeTraverse(LOT_CALLS), REFERENCE)
    expect(g.positionSource).toBe('fitted_to_reference')
    expect(g.maxResidualFt).not.toBeNull()
    expect(g.notes.join(' ')).toContain('not a surveyed location')
    // Shape is preserved by a translation.
    expect(shoelaceAreaSqFt(g.ring)).toBeCloseTo(9_600, 3)
  })

  it('surfaces a disagreement in SHAPE, which a translation cannot absorb', () => {
    // A parcel offset bodily from the plat is invisible to a centroid fit —
    // the fit removes exactly that. What the fit cannot hide, and what actually
    // matters, is a corner in a different place: this is the 4.3 ft county-GIS
    // case that flipped a front setback from compliant to non-compliant.
    const bent = REFERENCE.coordinates.map(c => [c[0], c[1]] as [number, number])
    bent[1] = [bent[1][0] + 16, bent[1][1] + 16]
    bent[bent.length - 1] = [bent[0][0], bent[0][1]]
    const g = georeferenceTraverse(computeTraverse(LOT_CALLS), { coordinates: bent })
    expect(g.maxResidualFt).toBeGreaterThan(2)
    expect(g.notes.join(' ')).toContain('boundary certification exists to resolve')
  })
})

describe('recorded plat boundary', () => {
  const reference = {
    liber: '12345', folio: '678', subdivisionName: 'Porter', lot: '1',
    recordedIn: "Prince George's County Land Records",
  }

  it('produces geometry from an approved plat, held at Level 1 until certified', () => {
    const b = buildRecordedPlatBoundary({
      calls: LOT_CALLS,
      reference,
      basisOfBearings: 'Bearings referred to the plat of record',
      crs: 'EPSG:2248',
      recordedAreaSqFt: 9_600,
      referenceParcel: REFERENCE,
    })

    expect(b.ring.coordinates.length).toBeGreaterThan(4)
    expect(b.computedAreaSqFt).toBeCloseTo(9_600, 3)
    expect(b.areaDifferenceFraction).toBeCloseTo(0, 6)
    expect(b.certifiable).toBe(true)
    // Certifiable is not certified. The geometry stays at GIS level until a
    // licensed surveyor acts.
    expect(b.heldLevel).toBe(1)
    expect(b.beforeCertification[0]).toContain('Maryland licensed surveyor')
  })

  it('refuses to call geometry a plat boundary with no recorded instrument behind it', () => {
    const b = buildRecordedPlatBoundary({ calls: LOT_CALLS, reference: {}, crs: 'EPSG:2248' })
    expect(b.certifiable).toBe(false)
    expect(b.problems.join(' ')).toContain('Recorded instrument identified')
  })

  it('fails the transcription screen when the calls do not close well enough', () => {
    const b = buildRecordedPlatBoundary({
      calls: [...LOT_CALLS.slice(0, 3), { kind: 'line', bearing: 'N 77-30-00 W', distanceFt: 79.6 }],
      reference,
      crs: 'EPSG:2248',
    })
    expect(b.certifiable).toBe(false)
    expect(b.problems.join(' ')).toContain('closes within')
    expect(b.beforeCertification.join(' ')).toContain('Re-check the transcription')
  })

  it('catches a computed area that disagrees with the recorded area', () => {
    const b = buildRecordedPlatBoundary({
      calls: LOT_CALLS, reference, crs: 'EPSG:2248', recordedAreaSqFt: 11_000,
    })
    expect(b.certifiable).toBe(false)
    expect(b.problems.join(' ')).toContain('agrees with the recorded area')
  })

  it('writes a source record that carries no vertical datum, because a plat has none', () => {
    const b = buildRecordedPlatBoundary({
      calls: LOT_CALLS, reference, crs: 'EPSG:2248', recordedAreaSqFt: 9_600,
    })
    const s = platSourceRecord({
      sourceId: 'plat1', boundary: b, crs: 'EPSG:2248', horizontalDatum: 'NAD83',
    })
    expect(s.verticalDatum).toBeNull()
    expect(s.reliabilityLevel).toBe(1)
    expect(s.dataset).toContain('Liber 12345, Folio 678')
    expect(s.notes).toContain(COGO_VERSION)
  })
})

describe('the Level 2 gate for a plat boundary', () => {
  const reference = { liber: '12345', folio: '678' }
  const clean = () =>
    buildRecordedPlatBoundary({
      calls: LOT_CALLS,
      reference,
      basisOfBearings: 'Grid north, NAD83 Maryland State Plane',
      crs: 'EPSG:2248',
      recordedAreaSqFt: 9_600,
      pointOfBeginning: [1340000, 440000],
    })

  const certification: PlatCertification = {
    surveyor: { name: 'A. Reyes', licenceNumber: '21456', state: 'MD' },
    licenceVerification: {
      verifiedAt: '2026-09-01', register: 'Maryland Board for Professional Land Surveyors',
      verifiedBy: 'ops',
    },
    statement: 'The computed geometry is the boundary of the referenced recorded plat.',
    certifiedAt: '2026-09-01',
    positionCertified: true,
  }

  it('refuses Level 2 without a surveyor, however well the traverse closes', () => {
    const d = evaluatePlatBoundaryPromotion({
      boundary: clean(), certification: null, crs: 'EPSG:2248', horizontalDatum: 'NAD83',
    })
    expect(d.promoted).toBe(false)
    expect(d.toLevel).toBe(1)
    expect(d.promotedScope).toEqual([])
    expect(d.blockers.join(' ')).toContain('Certified by a Maryland licensed surveyor')
  })

  it('refuses Level 2 on an unverified licence number', () => {
    const d = evaluatePlatBoundaryPromotion({
      boundary: clean(),
      certification: { ...certification, licenceVerification: undefined },
      crs: 'EPSG:2248', horizontalDatum: 'NAD83',
    })
    expect(d.promoted).toBe(false)
    expect(d.blockers.join(' ')).toContain('Licence verified against the state register')
  })

  it('refuses Level 2 when position was fitted rather than stated', () => {
    const fitted = buildRecordedPlatBoundary({
      calls: LOT_CALLS, reference,
      basisOfBearings: 'Grid north', crs: 'EPSG:2248', recordedAreaSqFt: 9_600,
      referenceParcel: REFERENCE,
    })
    const d = evaluatePlatBoundaryPromotion({
      boundary: fitted, certification, crs: 'EPSG:2248', horizontalDatum: 'NAD83',
    })
    expect(d.promoted).toBe(false)
    expect(d.blockers.join(' ')).toContain('Position certified, not fitted')
  })

  it('grants Level 2 for boundary objects only, once a surveyor has certified', () => {
    const d = evaluatePlatBoundaryPromotion({
      boundary: clean(), certification, crs: 'EPSG:2248', horizontalDatum: 'NAD83',
    })
    expect(d.promoted).toBe(true)
    expect(d.toLevel).toBe(2)
    expect(d.promotedScope).toEqual(PLAT_PROMOTABLE_KINDS)
    expect(d.rationale).toContain('A. Reyes')
  })

  it('never lets an elevation-dependent object through this path', () => {
    for (const kind of ['Contour', 'SpotElevation', 'Surface', 'SWMPractice', 'Floodplain'] as const) {
      expect(PLAT_PROMOTABLE_KINDS).not.toContain(kind)
    }
    expect(PLAT_PROMOTABLE_KINDS).toEqual(['Parcel', 'BoundarySegment', 'Easement'])
  })

  it('screens transcription against a cited standard rather than an invented one', () => {
    expect(PLAT_TRANSCRIPTION_CLOSURE.citation).toContain('COMAR 09.13.06')
    expect(PLAT_TRANSCRIPTION_CLOSURE.role).toBe('transcription screen')
  })
})
