/**
 * Position and accuracy on a mobile capture.
 *
 * The capture flow records photos, video and voice but no position at all, so
 * nothing it collects can contribute geometry to a site plan. This adds the
 * fix — and, more importantly, the accuracy that comes with it, because a
 * coordinate without an accuracy figure is worse than no coordinate: it looks
 * usable and there is no way to tell that it is not.
 *
 * ── What a phone fix can and cannot support ────────────────────────────────
 *
 * A consumer GNSS fix is 3–5 m in the open and considerably worse near
 * buildings, where multipath is at its worst — which is exactly where an infill
 * lot is. Against a 25 ft front setback, 3–5 m is not a margin of error, it is
 * the whole answer.
 *
 * So a fix is graded, and the grade decides what it may be used for. It is
 * never allowed to influence a boundary or a setback at any accuracy, because
 * boundary determination is the practice of land surveying in Maryland and
 * reserved to a licensed surveyor regardless of how good the instrument is.
 *
 * Where it genuinely earns its place is the 5,000 sq ft disturbance threshold.
 * That decides whether sediment control and stormwater review apply — the
 * biggest cost fork on an infill lot — and it currently returns INDETERMINATE
 * whenever a component is unmeasured. A ±1 m trace of a driveway or a graded
 * area is far more precision than a 5,000 sq ft determination needs.
 */

export type PositionGrade = 'survey' | 'mapping' | 'sketch' | 'unusable'

export interface CapturedPosition {
  latitude: number
  longitude: number
  /** Radius of 68% confidence, in metres, as the browser reports it. */
  accuracyMetres: number
  altitudeMetres?: number | null
  altitudeAccuracyMetres?: number | null
  headingDegrees?: number | null
  capturedAt: string
  /** How the fix was obtained, when the client knows. */
  method?: 'gnss' | 'gnss_rtk' | 'network' | 'manual' | 'unknown'
}

export interface GradedPosition extends CapturedPosition {
  grade: PositionGrade
  /** What this fix may legitimately be used for. */
  permittedUses: string[]
  /** What it must never be used for, whatever the accuracy. */
  prohibitedUses: string[]
  rationale: string
}

/** Metre thresholds. Chosen against what each task actually tolerates. */
export const POSITION_GRADE_THRESHOLDS = {
  /** RTK territory. Still not a boundary survey — that is a legal question. */
  survey: 0.15,
  /** Good enough to quantify areas against a 5,000 sq ft threshold. */
  mapping: 3,
  /** Locates a feature on the correct part of the lot, and no more. */
  sketch: 15,
} as const

/**
 * Uses that are never permitted from a phone fix.
 *
 * Not a function of accuracy. In Maryland, boundary determination is the
 * practice of land surveying, so even a centimetre-grade fix does not make a
 * property line — it makes a very precise guess at one.
 */
export const NEVER_FROM_MOBILE_CAPTURE = [
  'Property boundary or lot line location',
  'Setback measurement or compliance determination',
  'Finished floor or spot elevations for grading design',
  'Base flood elevation or floodplain determination',
]

export function gradePosition(p: CapturedPosition): GradedPosition {
  const a = p.accuracyMetres
  const t = POSITION_GRADE_THRESHOLDS

  const grade: PositionGrade =
    !Number.isFinite(a) || a <= 0 ? 'unusable'
    : a <= t.survey ? 'survey'
    : a <= t.mapping ? 'mapping'
    : a <= t.sketch ? 'sketch'
    : 'unusable'

  const permittedUses: string[] = []
  if (grade === 'survey' || grade === 'mapping') {
    permittedUses.push(
      'Quantifying disturbance components — driveway, patio, graded and staged areas — against the ' +
      '5,000 sq ft threshold',
      'Locating existing improvements for the existing-conditions narrative',
      'Confirming which parcel the capture belongs to',
    )
  }
  if (grade === 'sketch') {
    permittedUses.push(
      'Confirming which parcel the capture belongs to',
      'Placing a photograph on the correct part of the site',
    )
  }

  const rationale =
    grade === 'unusable'
      ? `Accuracy ${Number.isFinite(a) ? `${a.toFixed(1)} m` : 'not reported'} is too coarse to place a ` +
        'feature on a lot with any confidence. The capture is kept as a photograph; its position is not used.'
      : grade === 'sketch'
        ? `Accuracy ${a.toFixed(1)} m locates the capture on the site but not within it. Enough to say ` +
          'which parcel, not enough to measure anything.'
        : grade === 'mapping'
          ? `Accuracy ${a.toFixed(1)} m supports area measurement. A 5,000 sq ft determination tolerates ` +
            'this comfortably; a 25 ft setback does not.'
          : `Accuracy ${a.toFixed(2)} m is survey grade as an instrument reading. It still does not ` +
            'establish a boundary — that is a licensed determination, not a measurement.'

  return {
    ...p,
    grade,
    permittedUses,
    prohibitedUses: NEVER_FROM_MOBILE_CAPTURE,
    rationale,
  }
}

/** Parses the position fields off a capture upload. Absent is fine; wrong is not. */
export function parseCapturePosition(form: {
  get(name: string): FormDataEntryValue | null
}): { position: GradedPosition | null; error: string | null } {
  const lat = form.get('latitude')
  const lon = form.get('longitude')
  const acc = form.get('accuracyMetres')

  // No position at all is normal — a photo taken indoors, or permission denied.
  if (lat == null && lon == null && acc == null) return { position: null, error: null }

  const latitude = Number(lat)
  const longitude = Number(lon)
  const accuracyMetres = Number(acc)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { position: null, error: 'latitude and longitude must both be numbers' }
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return { position: null, error: 'latitude/longitude outside valid range' }
  }
  // A coordinate with no accuracy is the dangerous case: it looks usable and
  // nothing downstream can tell that it is not.
  if (!Number.isFinite(accuracyMetres) || accuracyMetres <= 0) {
    return { position: null, error: 'accuracyMetres is required alongside a position, and must be positive' }
  }

  const num = (v: FormDataEntryValue | null): number | null => {
    if (v == null) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  const method = String(form.get('positionMethod') ?? 'unknown')

  return {
    position: gradePosition({
      latitude,
      longitude,
      accuracyMetres,
      altitudeMetres: num(form.get('altitudeMetres')),
      altitudeAccuracyMetres: num(form.get('altitudeAccuracyMetres')),
      headingDegrees: num(form.get('headingDegrees')),
      capturedAt: String(form.get('positionCapturedAt') ?? new Date().toISOString()),
      method: (['gnss', 'gnss_rtk', 'network', 'manual'].includes(method)
        ? method
        : 'unknown') as CapturedPosition['method'],
    }),
    error: null,
  }
}

/** Browser options for a site capture — accuracy matters more than speed here. */
export const CAPTURE_GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  // A good fix near buildings can take a while; a fast bad one is worthless.
  timeout: 20_000,
  maximumAge: 0,
} as const
