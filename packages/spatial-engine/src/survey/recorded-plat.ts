/**
 * The recorded plat as a boundary source.
 *
 * ── The gap this closes ────────────────────────────────────────────────────
 *
 * An approved, recorded subdivision plat with located boundaries is the reason
 * a great many infill projects do not need a new boundary survey. Until now the
 * engine could not use one: `parse-pdf.ts` extracts the calls as text and
 * refuses to trace geometry, `promotion.ts` excludes PDF from the formats that
 * can carry Level 2, and nothing computed coordinates from calls. The result was
 * that the single most authoritative document a project owns contributed
 * nothing to the drawing.
 *
 * `cogo.ts` computes the geometry. This module decides what it is worth.
 *
 * ── What is deliberately NOT relaxed ───────────────────────────────────────
 *
 * The PDF rule stands exactly as written: a rendering of a survey is not a
 * survey, and nothing here promotes a traced or scanned depiction. What changes
 * is narrower and defensible — a recorded plat's METES AND BOUNDS are a legal
 * description in words, and computing coordinates from words is arithmetic with
 * a self-check. The traverse either closes or it does not, and the closure ratio
 * is reported before anything else.
 *
 * Three limits are structural, not cautious:
 *
 *   1. BOUNDARY ONLY. A plat carries no elevations. Nothing elevation-dependent
 *      promotes through this path, ever — that needs field topography.
 *   2. POSITION IS NOT SHAPE. Calls give shape and orientation; they say nothing
 *      about where the figure sits. Level 2 requires a stated point of
 *      beginning. A centroid fit to a GIS parcel is drawable and is not a
 *      surveyed position.
 *   3. A HUMAN CERTIFIES. A Maryland licensed surveyor certifies that the
 *      computed geometry is the boundary of the recorded instrument. No
 *      closure ratio, however good, substitutes for that.
 */

import type { Position, Ring } from '../site-plan/site-twin'
import type { ReliabilityLevel, SourceRecord } from '../site-plan/reliability'
import type { SiteFeature } from '../site-plan/site-twin'
import {
  computeTraverse, applyCompassRule, georeferenceTraverse,
  COGO_VERSION,
  type Course, type TraverseResult, type GeoreferenceResult,
} from './cogo'

/**
 * Screening closure ratio for accepting a computed traverse as a faithful
 * transcription of a recorded instrument.
 *
 * This is a TRANSCRIPTION check, not a survey standard: it asks whether the
 * calls were read correctly, not whether the original survey met the standard
 * of practice. The controlling standard for boundary surveying in Maryland is
 * COMAR 09.13.06 (Minimum Standards of Practice), and the surveyor certifying
 * under `evaluatePlatBoundaryPromotion` applies it. Confirm the current
 * requirement before treating this number as anything more than a screen.
 */
export const PLAT_TRANSCRIPTION_CLOSURE = {
  minimumPrecisionDenominator: 5_000,
  /**
   * Below this the misclosure is arithmetic noise, not a transcription error.
   * Calls are stated to a hundredth of a foot, so a computed misclosure of half
   * that cannot mean anything — and a floating-point residue of 1e-14 ft must
   * not be allowed to fail a plat that closes perfectly.
   */
  exactWithinFt: 0.005,
  citation: 'COMAR 09.13.06 — Minimum Standards of Practice (controlling standard, not reproduced here)',
  role: 'transcription screen',
  note:
    'A ratio poorer than 1:5,000 on a modern recorded plat almost always means a call was ' +
    'mis-transcribed or a curve was missed, not that the original survey was poor.',
} as const

/** Area agreement between the computed figure and the recorded area. */
export const PLAT_AREA_TOLERANCE_FRACTION = 0.005

export interface PlatReference {
  /** Liber and folio, or plat book and page, as recorded. */
  liber?: string | null
  folio?: string | null
  platBook?: string | null
  platPage?: string | null
  subdivisionName?: string | null
  lot?: string | null
  block?: string | null
  /** Jurisdiction land-records office the instrument is recorded in. */
  recordedIn?: string | null
  recordedDate?: string | null
}

export interface RecordedPlatInput {
  calls: Course[]
  reference: PlatReference
  /**
   * The basis of bearings as the instrument states it, verbatim. Never
   * paraphrased, and never assumed to be grid north.
   */
  basisOfBearings?: string | null
  /**
   * Rotation from the instrument's basis onto the target grid, degrees
   * clockwise. Supplied only when the instrument or the surveyor states it.
   */
  basisRotationDeg?: number
  /** Coordinate of the point of beginning, [easting, northing], when known. */
  pointOfBeginning?: Position | null
  /** Target coordinate reference system, e.g. `EPSG:2248`. */
  crs?: string | null
  horizontalDatum?: string | null
  /** Area the instrument states, square feet. */
  recordedAreaSqFt?: number | null
  /** Preliminary GIS parcel, used only to place an unpositioned figure. */
  referenceParcel?: Ring | null
  /** Apply the compass rule after computing. Off by default, and recorded. */
  adjust?: boolean
}

export interface PlatCheck {
  requirement: string
  satisfied: boolean
  detail: string
}

export interface RecordedPlatBoundary {
  /** Geometry as placed. Empty when the calls did not compute. */
  ring: Ring
  traverse: TraverseResult
  georeference: GeoreferenceResult
  /** Area of the computed figure, square feet. */
  computedAreaSqFt: number
  /** Signed difference against the recorded area, as a fraction. */
  areaDifferenceFraction: number | null
  checks: PlatCheck[]
  /** Checks that failed. Empty does not mean certified — see the promotion gate. */
  problems: string[]
  /** What a licensed surveyor must do before this is boundary of record. */
  beforeCertification: string[]
  /** Level the geometry is held at until a surveyor certifies it. */
  heldLevel: ReliabilityLevel
  /** Ready to put in front of a surveyor for certification. */
  certifiable: boolean
  reference: PlatReference
  summary: string
}

function referenceLabel(r: PlatReference): string | null {
  if (r.liber && r.folio) return `Liber ${r.liber}, Folio ${r.folio}`
  if (r.platBook && r.platPage) return `Plat Book ${r.platBook}, Page ${r.platPage}`
  return null
}

/**
 * Computes the boundary of a recorded plat and reports what it is worth.
 *
 * Always returns geometry when the calls compute, whatever the checks say. The
 * platform drafts; the checks decide what the drawing may claim about itself,
 * which is the same rule the rest of the engine follows.
 */
export function buildRecordedPlatBoundary(input: RecordedPlatInput): RecordedPlatBoundary {
  const raw = computeTraverse(input.calls, {
    pointOfBeginning: input.pointOfBeginning ?? undefined,
    basisRotationDeg: input.basisRotationDeg,
  })
  const traverse = input.adjust && raw.ring.coordinates.length > 0 ? applyCompassRule(raw) : raw
  const georeference = georeferenceTraverse(traverse, input.referenceParcel ?? null)

  const computedArea = georeference.ring.coordinates.length
    ? traverse.areaSqFt
    : 0
  const areaDiff =
    input.recordedAreaSqFt && input.recordedAreaSqFt > 0
      ? (computedArea - input.recordedAreaSqFt) / input.recordedAreaSqFt
      : null

  const checks: PlatCheck[] = []
  const add = (requirement: string, satisfied: boolean, detail: string) =>
    checks.push({ requirement, satisfied, detail })

  const label = referenceLabel(input.reference)
  add(
    'Recorded instrument identified',
    label != null,
    label ?? 'No liber/folio or plat book/page. Geometry with no instrument behind it is not a plat boundary.',
  )

  const closed = traverse.ring.coordinates.length >= 4
  add(
    'Calls compute a closed figure',
    closed,
    closed
      ? `${traverse.courses.filter(c => c.vertices.length > 0).length} of ${input.calls.length} call(s) computed.`
      : 'Fewer than three calls produced geometry. Check the transcription and any missing curve data.',
  )

  const ratio = raw.precisionDenominator
  const closesExactly = raw.closureDistanceFt <= PLAT_TRANSCRIPTION_CLOSURE.exactWithinFt
  const closureOk =
    closesExactly ||
    (ratio != null && ratio >= PLAT_TRANSCRIPTION_CLOSURE.minimumPrecisionDenominator)
  add(
    `Traverse closes within 1:${PLAT_TRANSCRIPTION_CLOSURE.minimumPrecisionDenominator.toLocaleString()}`,
    closureOk,
    closesExactly
      ? `Closes to within ${PLAT_TRANSCRIPTION_CLOSURE.exactWithinFt} ft over ` +
        `${raw.perimeterFt.toFixed(2)} ft — exact at the precision the calls are stated to.`
      : `Misclosure ${raw.closureDistanceFt.toFixed(3)} ft over ${raw.perimeterFt.toFixed(2)} ft` +
        ` = 1:${(ratio ?? 0).toLocaleString()}` +
        (closureOk ? '.' : `. ${PLAT_TRANSCRIPTION_CLOSURE.note}`),
  )

  const areaOk = areaDiff == null || Math.abs(areaDiff) <= PLAT_AREA_TOLERANCE_FRACTION
  add(
    'Computed area agrees with the recorded area',
    areaOk,
    areaDiff == null
      ? 'No recorded area was supplied, so this check could not run.'
      : `Computed ${Math.round(computedArea).toLocaleString()} sq ft against a recorded ` +
        `${Math.round(input.recordedAreaSqFt as number).toLocaleString()} sq ft — ` +
        `${(areaDiff * 100).toFixed(3)}%.`,
  )

  add(
    'Basis of bearings stated',
    Boolean(input.basisOfBearings),
    input.basisOfBearings
      ? `"${input.basisOfBearings}"` +
        (input.basisRotationDeg
          ? ` — rotated ${input.basisRotationDeg}° onto the target grid.`
          : ' — no rotation applied, so the bearings are used as written.')
      : 'Not stated. Bearings are used as written, which is correct only if the instrument is already ' +
        'on the target grid\'s north.',
  )

  add(
    'Coordinate reference system stated',
    Boolean(input.crs),
    input.crs ?? 'None. A figure with no CRS is a shape, not a location.',
  )

  const positioned = georeference.positionSource === 'stated_point_of_beginning'
  add(
    'Position established by a stated point of beginning',
    positioned,
    positioned
      ? 'Point of beginning supplied.'
      : georeference.positionSource === 'fitted_to_reference'
        ? `Placed by centroid fit to the reference parcel` +
          (georeference.maxResidualFt != null
            ? `, largest corner deviation ${georeference.maxResidualFt.toFixed(2)} ft`
            : '') +
          '. Drawable; not a surveyed position.'
        : 'No position established. The figure is on a local grid.',
  )

  const problems = checks.filter(c => !c.satisfied).map(c => `${c.requirement}: ${c.detail}`)

  const beforeCertification: string[] = [
    `Certification by a Maryland licensed surveyor that this computed geometry is the boundary of ` +
    `${label ?? 'the recorded instrument'}. The computation is arithmetic on the recorded calls; ` +
    'the identification of that boundary on the ground is surveying.',
  ]
  if (!positioned) {
    beforeCertification.push(
      'A coordinate for the point of beginning, or a monument tie the surveyor can supply. Without ' +
      'one the figure has correct shape and dimensions and no certified position.',
    )
  }
  if (!input.basisOfBearings) {
    beforeCertification.push(
      'The basis of bearings as the instrument states it, and the rotation onto the target grid ' +
      'if the two differ.',
    )
  }
  if (!closureOk) {
    beforeCertification.push(
      'Re-check the transcription of every call against the recorded instrument. The misclosure is ' +
      'outside the screening ratio, which points at a reading error rather than at the original survey.',
    )
  }
  if (georeference.maxResidualFt != null && georeference.maxResidualFt > 2) {
    beforeCertification.push(
      `Resolve the ${georeference.maxResidualFt.toFixed(2)} ft disagreement between the plat figure and ` +
      'the county parcel. County GIS is the less accurate source and is not evidence against the plat, ' +
      'but a setback dimensioned from the wrong line fails review either way.',
    )
  }

  // Geometry from a recorded instrument is better than a tax-map polygon and is
  // not survey grade until a surveyor says so. It is held at Level 1 — the same
  // level as GIS — with the distinction carried in the source record's dataset
  // and accuracy class rather than in an invented intermediate level.
  const certifiable = closed && closureOk && areaOk && label != null

  return {
    ring: georeference.ring,
    traverse,
    georeference,
    computedAreaSqFt: computedArea,
    areaDifferenceFraction: areaDiff,
    checks,
    problems,
    beforeCertification,
    heldLevel: 1,
    certifiable,
    reference: input.reference,
    summary:
      `${label ?? 'Unidentified instrument'} — ` +
      (closed
        ? `${Math.round(computedArea).toLocaleString()} sq ft computed from ${input.calls.length} call(s), ` +
          (closesExactly
            ? 'exact closure. '
            : `closure 1:${(ratio ?? 0).toLocaleString()}. `)
        : 'no closed figure computed. ') +
      `${certifiable ? 'Ready for surveyor certification' : `${problems.length} problem(s) to resolve first`}. ` +
      `Held at Level ${1} until certified.`,
  }
}

/** Source record for a plat-derived boundary, for the twin's provenance list. */
export function platSourceRecord(input: {
  sourceId: string
  boundary: RecordedPlatBoundary
  crs: string | null
  horizontalDatum: string | null
  recordedIn?: string | null
  retrievedAt?: string
}): SourceRecord {
  const label = referenceLabel(input.boundary.reference)
  return {
    sourceId: input.sourceId,
    authority: input.recordedIn ?? input.boundary.reference.recordedIn ?? 'Land records',
    dataset:
      `Recorded plat boundary — ${label ?? 'instrument not identified'}` +
      (input.boundary.reference.subdivisionName
        ? `, ${input.boundary.reference.subdivisionName}`
        : '') +
      (input.boundary.reference.lot ? ` Lot ${input.boundary.reference.lot}` : ''),
    effectiveDate: input.boundary.reference.recordedDate ?? undefined,
    retrievedAt: input.retrievedAt ?? new Date().toISOString(),
    crs: input.crs,
    horizontalDatum: input.horizontalDatum,
    // A plat carries no elevations. Stating this as null rather than unknown is
    // what keeps elevation-dependent objects off this source.
    verticalDatum: null,
    accuracyClass: 'approximate',
    reliabilityLevel: input.boundary.heldLevel,
    notes:
      `Computed from the recorded metes and bounds by ${COGO_VERSION}. ` +
      input.boundary.georeference.notes.join(' '),
  }
}

// ── Certification, which is the only route to Level 2 ───────────────────────

export interface PlatCertification {
  surveyor: { name: string; licenceNumber: string; state: string }
  /** When the licence was checked against the state register. */
  licenceVerification?: { verifiedAt: string; register: string; verifiedBy: string }
  /** The surveyor's statement, in their words. */
  statement: string
  certifiedAt: string
  /** True only where the surveyor certifies the POSITION as well as the shape. */
  positionCertified: boolean
}

/** Object kinds a plat can ever certify. Nothing elevation-dependent, ever. */
export const PLAT_PROMOTABLE_KINDS: SiteFeature['kind'][] = ['Parcel', 'BoundarySegment', 'Easement']

export interface PlatPromotionDecision {
  promoted: boolean
  toLevel: ReliabilityLevel
  promotedScope: SiteFeature['kind'][]
  checks: PlatCheck[]
  blockers: string[]
  rationale: string
}

/**
 * The Level 2 gate for a plat-derived boundary.
 *
 * Narrower than `evaluatePromotion` in `promotion.ts` and deliberately separate
 * from it: that function governs surveyor coordinate files and its exclusion of
 * PDF is untouched. This one governs a computation from a recorded legal
 * description, and it grants Level 2 for boundary objects only.
 */
export function evaluatePlatBoundaryPromotion(input: {
  boundary: RecordedPlatBoundary
  certification?: PlatCertification | null
  crs?: string | null
  horizontalDatum?: string | null
}): PlatPromotionDecision {
  const { boundary, certification } = input
  const checks: PlatCheck[] = [...boundary.checks]
  const add = (requirement: string, satisfied: boolean, detail: string) =>
    checks.push({ requirement, satisfied, detail })

  add(
    'Horizontal datum stated',
    Boolean(input.horizontalDatum),
    input.horizontalDatum ??
      'Not stated. NAD83(1986) and NAD83(2011) differ materially in Maryland.',
  )

  add(
    'Certified by a Maryland licensed surveyor',
    certification != null && certification.surveyor.licenceNumber.length > 0,
    certification
      ? `${certification.surveyor.name}, ${certification.surveyor.state} licence ` +
        `${certification.surveyor.licenceNumber}, ${certification.certifiedAt}.`
      : 'No certification. A closure ratio is evidence of correct transcription, not of boundary ' +
        'location, and only a licensed surveyor can supply the second.',
  )

  add(
    'Licence verified against the state register',
    certification?.licenceVerification != null,
    certification?.licenceVerification
      ? `Verified ${certification.licenceVerification.verifiedAt} against ` +
        `${certification.licenceVerification.register}.`
      : 'Not verified. A licence number is a claim until it is checked.',
  )

  add(
    'Position certified, not fitted',
    certification?.positionCertified === true &&
      boundary.georeference.positionSource === 'stated_point_of_beginning',
    certification?.positionCertified
      ? boundary.georeference.positionSource === 'stated_point_of_beginning'
        ? 'Position is a stated point of beginning and is certified.'
        : 'The surveyor certified position, but the figure is placed by a fit rather than a stated ' +
          'point of beginning. Supply the coordinate.'
      : 'Position is not certified. Shape and dimensions may still be relied on; the location on the ' +
        'grid may not.',
  )

  const blockers = checks.filter(c => !c.satisfied).map(c => `${c.requirement}: ${c.detail}`)
  const promoted = blockers.length === 0

  return {
    promoted,
    toLevel: promoted ? 2 : 1,
    promotedScope: promoted ? PLAT_PROMOTABLE_KINDS : [],
    checks,
    blockers,
    rationale: promoted
      ? `Boundary objects promoted to Level 2 on the certification of ` +
        `${certification?.surveyor.name}, ${certification?.surveyor.state} licence ` +
        `${certification?.surveyor.licenceNumber}. Elevation-dependent objects are outside this ` +
        'path entirely — a plat carries no elevations and field topography is a separate instrument.'
      : `Held at Level 1. ${blockers.length} precondition(s) unmet: ` +
        blockers.map(b => b.split(':')[0]).join('; ') + '.',
  }
}
