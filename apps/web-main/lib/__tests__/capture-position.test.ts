/**
 * Position and accuracy on a mobile capture.
 *
 * The dangerous case is a coordinate with no accuracy: it looks usable and
 * nothing downstream can tell that it is not. The second dangerous case is
 * assuming a good instrument reading makes a property line — in Maryland,
 * boundary determination is a licensed act, not a measurement.
 */

import {
  gradePosition, parseCapturePosition, POSITION_GRADE_THRESHOLDS,
  NEVER_FROM_MOBILE_CAPTURE, CAPTURE_GEOLOCATION_OPTIONS,
} from '../capture-position'

const at = (accuracyMetres: number) => ({
  latitude: 38.9428, longitude: -76.9506, accuracyMetres,
  capturedAt: '2026-08-22T10:00:00Z',
})

/** FormData-like stub. */
const form = (o: Record<string, string>) => ({
  get: (k: string) => (k in o ? o[k] : null) as never,
})

describe('grading a fix by what it can actually support', () => {
  it('treats a GOOD phone fix as mapping grade, not survey', () => {
    // Open sky, dual-frequency, holding still.
    const g = gradePosition(at(2.5))
    expect(g.grade).toBe('mapping')
    expect(g.permittedUses.join(' ')).toMatch(/5,000 sq ft threshold/)
    expect(g.rationale).toMatch(/a 25 ft setback does not/i)
  })

  it('treats a TYPICAL phone fix as sketch, because 4-5 m is marginal for area work', () => {
    // The common case beside a building, where multipath is worst — which is
    // exactly where an infill lot is. Tempting to widen the mapping band to
    // cover it; that would be moving the bar to fit the instrument rather than
    // the task.
    expect(gradePosition(at(4)).grade).toBe('sketch')
    expect(gradePosition(at(5)).grade).toBe('sketch')
  })

  it('calls an RTK-grade reading survey grade but still not a boundary', () => {
    const g = gradePosition(at(0.02))
    expect(g.grade).toBe('survey')
    expect(g.rationale).toMatch(/does not\s+establish a boundary/i)
  })

  it('downgrades a poor urban fix to sketch', () => {
    const g = gradePosition(at(12))
    expect(g.grade).toBe('sketch')
    expect(g.permittedUses.join(' ')).toMatch(/which parcel/i)
    expect(g.permittedUses.join(' ')).not.toMatch(/5,000 sq ft/)
  })

  it('refuses to use a fix worse than 15 m for anything positional', () => {
    const g = gradePosition(at(40))
    expect(g.grade).toBe('unusable')
    expect(g.permittedUses).toEqual([])
    expect(g.rationale).toMatch(/its position is not used/i)
  })

  it('prohibits boundary and setback use at every accuracy', () => {
    for (const a of [0.01, 1, 4, 12]) {
      const g = gradePosition(at(a))
      expect(g.prohibitedUses).toEqual(NEVER_FROM_MOBILE_CAPTURE)
      expect(g.permittedUses.join(' ')).not.toMatch(/setback|boundary|lot line/i)
    }
  })

  it('sets thresholds against the task, not round numbers', () => {
    // 3 m is the point where area measurement stops being trustworthy for a
    // 5,000 sq ft call; 15 m is where you can no longer say where on the lot.
    expect(POSITION_GRADE_THRESHOLDS.mapping).toBe(3)
    expect(POSITION_GRADE_THRESHOLDS.sketch).toBe(15)
  })
})

describe('parsing a capture upload', () => {
  it('accepts no position at all — indoors or permission denied is normal', () => {
    const r = parseCapturePosition(form({}))
    expect(r.position).toBeNull()
    expect(r.error).toBeNull()
  })

  it('REJECTS a coordinate with no accuracy', () => {
    const r = parseCapturePosition(form({ latitude: '38.94', longitude: '-76.95' }))
    expect(r.position).toBeNull()
    expect(r.error).toMatch(/accuracyMetres is required/i)
  })

  it('rejects a non-positive accuracy', () => {
    expect(parseCapturePosition(form({ latitude: '38.94', longitude: '-76.95', accuracyMetres: '0' })).error)
      .toMatch(/must be positive/i)
  })

  it('rejects coordinates outside valid range', () => {
    expect(parseCapturePosition(form({ latitude: '138', longitude: '-76.95', accuracyMetres: '4' })).error)
      .toMatch(/outside valid range/i)
  })

  it('rejects a non-numeric coordinate rather than coercing it', () => {
    expect(parseCapturePosition(form({ latitude: 'north', longitude: '-76.95', accuracyMetres: '4' })).error)
      .toMatch(/must both be numbers/i)
  })

  it('carries optional fields through and grades the result', () => {
    const r = parseCapturePosition(form({
      latitude: '38.9428', longitude: '-76.9506', accuracyMetres: '2.5',
      altitudeMetres: '32', headingDegrees: '180', positionMethod: 'gnss',
    }))
    expect(r.position?.grade).toBe('mapping')
    expect(r.position?.altitudeMetres).toBe(32)
    expect(r.position?.method).toBe('gnss')
  })

  it('falls back to unknown for an unrecognised method rather than trusting it', () => {
    const r = parseCapturePosition(form({
      latitude: '38.94', longitude: '-76.95', accuracyMetres: '2', positionMethod: 'vibes',
    }))
    expect(r.position?.method).toBe('unknown')
  })

  it('asks the browser for accuracy over speed', () => {
    // A fast bad fix near buildings is worthless; waiting is correct here.
    expect(CAPTURE_GEOLOCATION_OPTIONS.enableHighAccuracy).toBe(true)
    expect(CAPTURE_GEOLOCATION_OPTIONS.maximumAge).toBe(0)
  })
})
