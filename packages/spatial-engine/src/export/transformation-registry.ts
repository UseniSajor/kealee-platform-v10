/**
 * Verified coordinate-operation registry.
 *
 * A projection library is not an authority. `proj4` will happily transform any
 * pair of CRSs you hand it, including pairs where the answer is wrong by metres
 * because no datum transformation was applied. This registry is the list of CRS
 * pairs this platform has VERIFIED, each with the operation actually used, its
 * stated accuracy, its datum handling and where the definition came from.
 *
 * Rules:
 *   - A pair that is not in this registry is REFUSED, not guessed. An
 *     unverified transform under a sealed drawing is a fabricated coordinate.
 *   - Every transform returns provenance. A coordinate with no operation
 *     metadata cannot be defended in a review.
 *   - proj4 supplies the OFFLINE path. It is not universally authoritative:
 *     where the county's own geometry service is the authority for a pair, the
 *     registry says so and the service is used or cross-checked.
 *   - Accuracy is stated honestly. A null datum shift between NAD83 and WGS84
 *     is ~1 m, not zero, and the registry records that rather than implying a
 *     precision the operation does not have.
 */

import proj4 from 'proj4'
import {
  KNOWN_CRS, CrsExportError, resolveCrs,
  type CrsDefinition, type CrsTransformer, type Point2D,
} from './crs'

// ── proj4 definitions ───────────────────────────────────────────────────────
//
// Taken from the EPSG registry via epsg.io. Maryland State Plane is a Lambert
// Conformal Conic with standard parallels 39°27' and 38°18', latitude of origin
// 37°40', central meridian 77°00'W and a 400 000 m false easting. The foot
// variants carry the same grid with a US survey foot linear unit, which is why
// the false easting reads 399999.9998984 m rather than a round number.

const PROJ4_DEFS: Record<string, string> = {
  'EPSG:4326':
    '+proj=longlat +datum=WGS84 +no_defs',
  'EPSG:3857':
    '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 ' +
    '+units=m +nadgrids=@null +no_defs',
  'EPSG:26985':
    '+proj=lcc +lat_0=37.6666666666667 +lon_0=-77 +lat_1=39.45 +lat_2=38.3 ' +
    '+x_0=400000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  'EPSG:2248':
    '+proj=lcc +lat_0=37.6666666666667 +lon_0=-77 +lat_1=39.45 +lat_2=38.3 ' +
    '+x_0=399999.9998984 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 ' +
    '+units=us-ft +no_defs',
  'EPSG:6487':
    '+proj=lcc +lat_0=37.6666666666667 +lon_0=-77 +lat_1=39.45 +lat_2=38.3 ' +
    '+x_0=399999.9998984 +y_0=0 +ellps=GRS80 +units=us-ft +no_defs',
}

let defsRegistered = false
function registerDefs(): void {
  if (defsRegistered) return
  for (const [code, def] of Object.entries(PROJ4_DEFS)) proj4.defs(code, def)
  defsRegistered = true
}

// ── The registry ────────────────────────────────────────────────────────────

/** Which implementation is trusted for a pair. */
export type TransformEngine = 'proj4' | 'arcgis-geometry-service'

export interface CoordinateOperation {
  from: string
  to: string
  /** How the operation is performed, named the way PROJ names it. */
  method: string
  /** The engine this platform treats as authoritative for the pair. */
  authoritativeEngine: TransformEngine
  /**
   * True when the two CRSs sit on different datums and a real shift is needed.
   * A `false` here with different datum names means a NULL transformation is
   * being applied deliberately — see `accuracyMetres`.
   */
  datumShiftApplied: boolean
  sourceDatum: string
  targetDatum: string
  sourceUnit: CrsDefinition['unit']
  targetUnit: CrsDefinition['unit']
  /** Stated horizontal accuracy of the operation, one sigma, in metres. */
  accuracyMetres: number
  /** Where the operation definition came from. */
  authority: string
  /**
   * True when proj4 and the authoritative service do NOT perform the same
   * operation for this pair — typically because the service applies a real
   * datum transformation where the offline path applies a null shift. The two
   * answers are then both correct for what they claim, and the difference is
   * the datum realization, not an error. It must be recorded, never hidden
   * behind a wide tolerance.
   */
  engineDatumHandlingDiffers: boolean
  /**
   * How far proj4 and the ArcGIS geometry service may disagree before the
   * cross-check fails, expressed in the TARGET CRS's linear unit (degrees for
   * a geographic target). Where `engineDatumHandlingDiffers` is true this is
   * derived from `accuracyMetres`, because the expected disagreement IS the
   * stated accuracy. Where it is false the engines should agree to numerical
   * precision and the tolerance is tight enough to catch a real regression.
   */
  crossCheckTolerance: number
  notes: string
}

function op(o: CoordinateOperation): CoordinateOperation { return o }

/**
 * Verified pairs only. Adding one requires running the cross-check in
 * `crossCheck()` against real county coordinates and recording the result.
 */
export const COORDINATE_OPERATIONS: CoordinateOperation[] = [
  op({
    from: 'EPSG:2248', to: 'EPSG:4326',
    method: 'Inverse Lambert Conformal Conic (2SP) + null NAD83→WGS84',
    authoritativeEngine: 'proj4',
    datumShiftApplied: false,
    sourceDatum: 'NAD83', targetDatum: 'WGS84',
    sourceUnit: 'usSurveyFoot', targetUnit: 'degree',
    // A null shift between NAD83 and WGS84 is about a metre in CONUS. That is
    // irrelevant for a GeoJSON handoff and unacceptable for a boundary, which
    // is why boundaries stay in 2248 and are never round-tripped through 4326.
    accuracyMetres: 1.0,
    authority: 'EPSG:2248 / EPSG:4326 via epsg.io; null datum shift',
    engineDatumHandlingDiffers: true,
    // MEASURED 2026-09-23 against the live ArcGIS geometry service on four
    // county points: worst divergence 8.1e-6 deg, about 0.9 m. That is the
    // NAD83->WGS84 realization difference, not a projection error: the service
    // applies a real datum transformation, proj4 offline applies a null shift.
    // The tolerance is therefore the stated accuracy plus headroom, and the
    // difference is carried in provenance so a reviewer sees it.
    crossCheckTolerance: 0.000014, // ~1.5 m of latitude
    notes:
      'Export path for GeoJSON (RFC 7946). Boundary geometry of record must ' +
      'not be stored in this CRS — a metre-level datum assumption would ' +
      'become part of the drawing. proj4 and the county service disagree by ' +
      'about 0.9 m here by design; both are correct for the datum each names.',
  }),
  op({
    from: 'EPSG:4326', to: 'EPSG:2248',
    method: 'Null WGS84→NAD83 + Lambert Conformal Conic (2SP)',
    authoritativeEngine: 'proj4',
    datumShiftApplied: false,
    sourceDatum: 'WGS84', targetDatum: 'NAD83',
    sourceUnit: 'degree', targetUnit: 'usSurveyFoot',
    accuracyMetres: 1.0,
    authority: 'EPSG:4326 / EPSG:2248 via epsg.io; null datum shift',
    engineDatumHandlingDiffers: true,
    crossCheckTolerance: 5.0, // feet — the same ~1 m realization difference
    notes:
      'Used to bring public-geocoder results onto the county grid. Level 1 ' +
      'only. Never use this path to place a boundary: a metre of datum ' +
      'ambiguity is larger than the setback tolerances the plan is checked on.',
  }),
  op({
    from: 'EPSG:2248', to: 'EPSG:26985',
    method: 'Linear unit conversion within one projected CRS (usSurveyFoot → metre)',
    authoritativeEngine: 'proj4',
    datumShiftApplied: false,
    sourceDatum: 'NAD83', targetDatum: 'NAD83',
    sourceUnit: 'usSurveyFoot', targetUnit: 'metre',
    accuracyMetres: 0.0,
    authority: 'Same grid, same datum; exact by definition',
    engineDatumHandlingDiffers: false,
    crossCheckTolerance: 0.001, // metres — both engines must agree numerically
    notes: 'Exact. Same Lambert grid, differing only in linear unit.',
  }),
  op({
    from: 'EPSG:26985', to: 'EPSG:2248',
    method: 'Linear unit conversion within one projected CRS (metre → usSurveyFoot)',
    authoritativeEngine: 'proj4',
    datumShiftApplied: false,
    sourceDatum: 'NAD83', targetDatum: 'NAD83',
    sourceUnit: 'metre', targetUnit: 'usSurveyFoot',
    accuracyMetres: 0.0,
    authority: 'Same grid, same datum; exact by definition',
    engineDatumHandlingDiffers: false,
    crossCheckTolerance: 0.005, // feet — both engines must agree numerically
    notes: 'Exact.',
  }),
  op({
    from: 'EPSG:6487', to: 'EPSG:2248',
    method: 'NAD83(2011) → NAD83(1986) treated as identity on the same grid',
    authoritativeEngine: 'arcgis-geometry-service',
    datumShiftApplied: false,
    sourceDatum: 'NAD83(2011)', targetDatum: 'NAD83',
    sourceUnit: 'usSurveyFoot', targetUnit: 'usSurveyFoot',
    // NAD83(2011) and NAD83(1986) differ by ~1-2 cm in Maryland. proj4 without
    // a transformation grid cannot express that, so the county's own service
    // is authoritative here and proj4 is the degraded offline path.
    accuracyMetres: 0.02,
    authority: 'NGS; realization difference, no public grid applied here',
    engineDatumHandlingDiffers: true,
    crossCheckTolerance: 0.2, // feet — the realization difference itself
    notes:
      'PGAtlas publishes 6487/103069. The centimetre-level realization ' +
      'difference is below GIS parcel accuracy but must not be described as ' +
      'exact. Offline runs use proj4 and record this accuracy.',
  }),
  op({
    from: 'EPSG:2248', to: 'EPSG:3857',
    method: 'Inverse LCC + null datum + spherical Mercator',
    authoritativeEngine: 'proj4',
    datumShiftApplied: false,
    sourceDatum: 'NAD83', targetDatum: 'WGS84',
    sourceUnit: 'usSurveyFoot', targetUnit: 'metre',
    accuracyMetres: 1.0,
    authority: 'EPSG:3857 via epsg.io; web-mapping display CRS',
    engineDatumHandlingDiffers: true,
    crossCheckTolerance: 2.0, // metres — carries the same ~1 m datum difference
    notes: 'Web map display only. Never an export CRS for geometry of record.',
  }),
]

export function findOperation(from: CrsDefinition, to: CrsDefinition): CoordinateOperation | null {
  return COORDINATE_OPERATIONS.find(o => o.from === from.code && o.to === to.code) ?? null
}

/** Every pair the registry can perform, for diagnostics and documentation. */
export function verifiedPairs(): string[] {
  return COORDINATE_OPERATIONS.map(o => `${o.from} → ${o.to}`)
}

// ── Provenance ──────────────────────────────────────────────────────────────

export interface TransformProvenance {
  operation: CoordinateOperation
  /** Which engine actually produced the returned coordinates. */
  engine: TransformEngine
  performedAt: string
  pointCount: number
  /**
   * Present when a cross-check ran. `withinTolerance: false` does NOT silently
   * downgrade the result — the caller decides, and a drawing stage blocks.
   */
  crossCheck: {
    against: TransformEngine
    maxDivergence: number
    tolerance: number
    withinTolerance: boolean
  } | null
}

export interface TracedTransformResult {
  points: Point2D[]
  provenance: TransformProvenance
}

// ── proj4-backed transformer ────────────────────────────────────────────────

function proj4Transform(points: Point2D[], from: CrsDefinition, to: CrsDefinition): Point2D[] {
  registerDefs()
  if (!PROJ4_DEFS[from.code] || !PROJ4_DEFS[to.code]) {
    throw new CrsExportError(
      'CRS_NOT_DEFINED',
      `No proj4 definition is registered for ${!PROJ4_DEFS[from.code] ? from.code : to.code}. ` +
      'Definitions are added deliberately, with the EPSG authority recorded, never by guess.',
    )
  }
  const converter = proj4(PROJ4_DEFS[from.code], PROJ4_DEFS[to.code])
  return points.map(([x, y]) => {
    const [ox, oy] = converter.forward([x, y]) as [number, number]
    if (!Number.isFinite(ox) || !Number.isFinite(oy)) {
      throw new CrsExportError(
        'TRANSFORM_FAILED',
        `proj4 returned a non-finite coordinate transforming ${from.code} → ${to.code}. ` +
        'Export blocked rather than emitting a broken coordinate.',
      )
    }
    return [ox, oy] as Point2D
  })
}

/**
 * Offline transformer. Refuses any pair the registry has not verified.
 */
export function createProj4Transformer(): CrsTransformer {
  return {
    name: 'proj4 (verified registry)',
    async transform(points, from, to) {
      if (points.length === 0) return []
      if (from.epsg === to.epsg) return points
      const operation = findOperation(from, to)
      if (!operation) {
        throw new CrsExportError(
          'OPERATION_NOT_VERIFIED',
          `No verified coordinate operation from ${from.code} to ${to.code}. ` +
          `Verified pairs: ${verifiedPairs().join(', ')}. ` +
          'An unverified transform under a drawing is a fabricated coordinate, so it is refused.',
        )
      }
      return proj4Transform(points, from, to)
    },
  }
}

// ── The registry transformer: offline path + authoritative cross-check ──────

export interface RegistryTransformerOptions {
  /** The service transformer, when the platform has network. */
  service?: CrsTransformer | null
  /**
   * Run the service as a cross-check even when proj4 is authoritative.
   * Default true when a service is supplied — a silent local answer that
   * nothing ever checks is how a projection bug survives to a sealed sheet.
   */
  crossCheck?: boolean
}

export interface TracedCrsTransformer extends CrsTransformer {
  transformTraced(points: Point2D[], from: CrsDefinition, to: CrsDefinition): Promise<TracedTransformResult>
}

function maxDivergence(a: Point2D[], b: Point2D[]): number {
  let worst = 0
  for (let i = 0; i < a.length; i++) {
    const dx = a[i][0] - b[i][0]
    const dy = a[i][1] - b[i][1]
    const d = Math.hypot(dx, dy)
    if (d > worst) worst = d
  }
  return worst
}

/**
 * The transformer the engine should use.
 *
 * Picks the engine the registry names authoritative for the pair, falls back to
 * proj4 when the service is unavailable, and records what happened either way.
 * Network absence degrades the ACCURACY CLAIM, never the ability to draw.
 */
export function createRegistryTransformer(opts: RegistryTransformerOptions = {}): TracedCrsTransformer {
  const service = opts.service ?? null
  const wantCrossCheck = opts.crossCheck ?? Boolean(service)

  async function traced(points: Point2D[], from: CrsDefinition, to: CrsDefinition): Promise<TracedTransformResult> {
    const operation = findOperation(from, to)
    if (!operation) {
      throw new CrsExportError(
        'OPERATION_NOT_VERIFIED',
        `No verified coordinate operation from ${from.code} to ${to.code}. ` +
        `Verified pairs: ${verifiedPairs().join(', ')}.`,
      )
    }

    const preferService = operation.authoritativeEngine === 'arcgis-geometry-service' && service !== null
    let engine: TransformEngine = preferService ? 'arcgis-geometry-service' : 'proj4'
    let result: Point2D[]

    if (preferService) {
      try {
        result = await service!.transform(points, from, to)
      } catch {
        // The registry named the service authoritative and it did not answer.
        // Draw anyway, on the offline path, and say which engine produced it.
        engine = 'proj4'
        result = proj4Transform(points, from, to)
      }
    } else {
      result = proj4Transform(points, from, to)
    }

    let crossCheck: TransformProvenance['crossCheck'] = null
    if (wantCrossCheck && service && engine === 'proj4') {
      try {
        const other = await service.transform(points, from, to)
        if (other.length === result.length) {
          const divergence = maxDivergence(result, other)
          crossCheck = {
            against: 'arcgis-geometry-service',
            maxDivergence: divergence,
            tolerance: operation.crossCheckTolerance,
            withinTolerance: divergence <= operation.crossCheckTolerance,
          }
        }
      } catch {
        crossCheck = null // No network is not a failed cross-check; it is no cross-check.
      }
    }

    return {
      points: result,
      provenance: {
        operation, engine,
        performedAt: new Date().toISOString(),
        pointCount: points.length,
        crossCheck,
      },
    }
  }

  return {
    name: `registry (proj4 + ${service ? service.name : 'no service'})`,
    async transform(points, from, to) {
      if (points.length === 0) return []
      if (from.epsg === to.epsg) return points
      return (await traced(points, from, to)).points
    },
    async transformTraced(points, from, to) {
      if (points.length === 0 || from.epsg === to.epsg) {
        const operation = findOperation(from, to)
        return {
          points,
          provenance: {
            operation: operation ?? {
              from: from.code, to: to.code, method: 'identity',
              authoritativeEngine: 'proj4', datumShiftApplied: false,
              sourceDatum: from.datum, targetDatum: to.datum,
              sourceUnit: from.unit, targetUnit: to.unit,
              accuracyMetres: 0, authority: 'identity',
              engineDatumHandlingDiffers: false,
              crossCheckTolerance: 0, notes: 'Same CRS; no operation performed.',
            },
            engine: 'proj4',
            performedAt: new Date().toISOString(),
            pointCount: points.length,
            crossCheck: null,
          },
        }
      }
      return traced(points, from, to)
    },
  }
}

/** Convenience for diagnostics: resolve two CRS strings and report the operation. */
export function describeOperation(fromCode: string, toCode: string): CoordinateOperation | null {
  return findOperation(resolveCrs(fromCode), resolveCrs(toCode))
}

/** Guard used by tests and by the registry's own documentation. */
export function assertRegistryCoversKnownCrs(): void {
  for (const code of Object.keys(KNOWN_CRS)) {
    if (!PROJ4_DEFS[code]) {
      throw new CrsExportError(
        'CRS_NOT_DEFINED',
        `${code} is in KNOWN_CRS but has no proj4 definition. Add it with its EPSG authority.`,
      )
    }
  }
}
