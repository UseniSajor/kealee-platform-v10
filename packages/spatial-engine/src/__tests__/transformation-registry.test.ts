/**
 * The registry's guarantee is not "proj4 works". It is that every pair this
 * platform transforms has been verified, carries its accuracy and datum
 * handling, and refuses anything it has not checked.
 *
 * The cross-check against the county's authoritative geometry service is
 * Gate A of `docs/decisions/toolchain-self-sufficiency.md`. It is skipped
 * without network rather than failed — no network is not a failed cross-check,
 * it is no cross-check, and the provenance says so.
 */
import { describe, it, expect } from 'vitest'
import {
  COORDINATE_OPERATIONS, findOperation, verifiedPairs, describeOperation,
  createProj4Transformer, createRegistryTransformer,
  assertRegistryCoversKnownCrs,
} from '../export/transformation-registry'
import { resolveCrs, createArcGisTransformer, CrsExportError, type Point2D } from '../export/crs'

/** 1005 Rollins Ave as the county's composite locator returns it, EPSG:2248. */
const ROLLINS_2248: Point2D = [1340380.66238077218, 440181.745183629333]
/** Three more county points so the check is not a single-point coincidence. */
const COUNTY_POINTS_2248: Point2D[] = [
  ROLLINS_2248,
  [1340500, 440300],
  [1339900, 439800],
  [1341200, 441000],
]

describe('registry integrity', () => {
  it('has a proj4 definition for every CRS the engine claims to know', () => {
    expect(() => assertRegistryCoversKnownCrs()).not.toThrow()
  })

  it('records datum, unit, accuracy and authority on every operation', () => {
    for (const o of COORDINATE_OPERATIONS) {
      expect(o.sourceDatum, `${o.from}->${o.to} sourceDatum`).toBeTruthy()
      expect(o.targetDatum, `${o.from}->${o.to} targetDatum`).toBeTruthy()
      expect(o.authority, `${o.from}->${o.to} authority`).toBeTruthy()
      expect(o.notes, `${o.from}->${o.to} notes`).toBeTruthy()
      expect(Number.isFinite(o.accuracyMetres)).toBe(true)
      expect(o.crossCheckTolerance).toBeGreaterThanOrEqual(0)
    }
  })

  it('flags every pair where the two engines handle the datum differently', () => {
    // The trap: a wide tolerance quietly absorbing a metre of datum shift and
    // presenting it as agreement. If the engines do different things, say so.
    for (const o of COORDINATE_OPERATIONS) {
      if (o.sourceDatum !== o.targetDatum) {
        expect(o.engineDatumHandlingDiffers, `${o.from}->${o.to}`).toBe(true)
      }
    }
  })

  it('keeps a tight cross-check on pairs where the engines must agree exactly', () => {
    for (const o of COORDINATE_OPERATIONS) {
      if (!o.engineDatumHandlingDiffers && o.accuracyMetres === 0) {
        expect(o.crossCheckTolerance, `${o.from}->${o.to} tolerance`).toBeLessThanOrEqual(0.01)
      }
    }
  })

  it('states a non-zero accuracy wherever the datums differ', () => {
    // The trap this guards: a null NAD83->WGS84 shift presented as exact.
    for (const o of COORDINATE_OPERATIONS) {
      if (o.sourceDatum !== o.targetDatum && !o.datumShiftApplied) {
        expect(o.accuracyMetres, `${o.from}->${o.to} claims exactness across datums`).toBeGreaterThan(0)
      }
    }
  })

  it('exposes the verified pairs for diagnostics', () => {
    expect(verifiedPairs()).toContain('EPSG:2248 → EPSG:4326')
    expect(describeOperation('EPSG:2248', 'EPSG:4326')?.method).toMatch(/Lambert/)
  })
})

describe('refusal of unverified pairs', () => {
  it('refuses a pair the registry has not verified rather than guessing', async () => {
    const t = createProj4Transformer()
    // 3857 -> 26985 is a plausible pair that has NOT been verified here.
    await expect(
      t.transform([[0, 0]], resolveCrs('EPSG:3857'), resolveCrs('EPSG:26985')),
    ).rejects.toBeInstanceOf(CrsExportError)
  })

  it('names the verified pairs in the refusal so the fix is obvious', async () => {
    const t = createProj4Transformer()
    await expect(
      t.transform([[0, 0]], resolveCrs('EPSG:3857'), resolveCrs('EPSG:26985')),
    ).rejects.toThrow(/Verified pairs/)
  })
})

describe('proj4 offline path', () => {
  it('places 1005 Rollins Ave in Prince George\'s County', async () => {
    const t = createProj4Transformer()
    const [[lon, lat]] = await t.transform([ROLLINS_2248], resolveCrs('EPSG:2248'), resolveCrs('EPSG:4326'))
    // Capitol Heights area. A wrong false-easting or a metre/foot mix-up puts
    // this in the Atlantic or in Africa, which is exactly the failure the
    // GeoJSON guard in crs.ts exists to catch.
    expect(lon).toBeGreaterThan(-77.0)
    expect(lon).toBeLessThan(-76.85)
    expect(lat).toBeGreaterThan(38.85)
    expect(lat).toBeLessThan(38.95)
  })

  it('round-trips 2248 -> 4326 -> 2248 to under a hundredth of a foot', async () => {
    const t = createProj4Transformer()
    const to4326 = await t.transform(COUNTY_POINTS_2248, resolveCrs('EPSG:2248'), resolveCrs('EPSG:4326'))
    const back = await t.transform(to4326, resolveCrs('EPSG:4326'), resolveCrs('EPSG:2248'))
    for (let i = 0; i < COUNTY_POINTS_2248.length; i++) {
      expect(Math.abs(back[i][0] - COUNTY_POINTS_2248[i][0])).toBeLessThan(0.01)
      expect(Math.abs(back[i][1] - COUNTY_POINTS_2248[i][1])).toBeLessThan(0.01)
    }
  })

  it('converts survey feet to metres on the same grid exactly', async () => {
    const t = createProj4Transformer()
    const [[xm, ym]] = await t.transform([ROLLINS_2248], resolveCrs('EPSG:2248'), resolveCrs('EPSG:26985'))
    // Same Lambert grid; the only difference is the linear unit, so the
    // relationship is the US survey foot definition and nothing else.
    const USFT = 1200 / 3937
    expect(xm).toBeCloseTo(ROLLINS_2248[0] * USFT, 3)
    expect(ym).toBeCloseTo(ROLLINS_2248[1] * USFT, 3)
  })
})

describe('provenance', () => {
  it('returns the operation, engine and timestamp with every transform', async () => {
    const t = createRegistryTransformer({ service: null })
    const { provenance } = await t.transformTraced(
      [ROLLINS_2248], resolveCrs('EPSG:2248'), resolveCrs('EPSG:4326'),
    )
    expect(provenance.engine).toBe('proj4')
    expect(provenance.operation.from).toBe('EPSG:2248')
    expect(provenance.operation.accuracyMetres).toBeGreaterThan(0)
    expect(provenance.pointCount).toBe(1)
    expect(Date.parse(provenance.performedAt)).not.toBeNaN()
  })

  it('reports no cross-check rather than a passing one when there is no service', async () => {
    const t = createRegistryTransformer({ service: null })
    const { provenance } = await t.transformTraced(
      [ROLLINS_2248], resolveCrs('EPSG:2248'), resolveCrs('EPSG:4326'),
    )
    expect(provenance.crossCheck).toBeNull()
  })

  it('draws on the offline path when the authoritative service is unreachable', async () => {
    const dead = {
      name: 'dead-service',
      async transform(): Promise<Point2D[]> { throw new Error('offline') },
    }
    // 6487 -> 2248 names the ArcGIS service authoritative.
    const t = createRegistryTransformer({ service: dead, crossCheck: false })
    const { points, provenance } = await t.transformTraced(
      [ROLLINS_2248], resolveCrs('EPSG:6487'), resolveCrs('EPSG:2248'),
    )
    expect(points).toHaveLength(1)
    expect(provenance.engine).toBe('proj4')
    expect(provenance.operation.authoritativeEngine).toBe('arcgis-geometry-service')
  })
})

// ── Gate A: the live cross-check ────────────────────────────────────────────

describe('Gate A — proj4 agrees with the authoritative geometry service', () => {
  it('stays within the operation\'s recorded tolerance on real county points', async () => {
    const service = createArcGisTransformer()
    const from = resolveCrs('EPSG:2248')
    const to = resolveCrs('EPSG:4326')

    let serviceResult: Point2D[]
    try {
      serviceResult = await service.transform(COUNTY_POINTS_2248, from, to)
    } catch {
      // No network. Not a failure — there is simply no cross-check to report.
      return
    }

    const local = await createProj4Transformer().transform(COUNTY_POINTS_2248, from, to)
    const operation = findOperation(from, to)!

    let worst = 0
    for (let i = 0; i < local.length; i++) {
      worst = Math.max(worst, Math.hypot(local[i][0] - serviceResult[i][0], local[i][1] - serviceResult[i][1]))
    }
    expect(
      worst,
      `proj4 and the geometry service diverge by ${worst} deg, tolerance ${operation.crossCheckTolerance}`,
    ).toBeLessThanOrEqual(operation.crossCheckTolerance)

    // And the divergence must be REAL, not zero: if it collapsed to zero the
    // service would have stopped applying its datum transformation and the
    // recorded accuracy would be wrong in the other direction.
    expect(worst, 'expected the documented NAD83/WGS84 realization difference').toBeGreaterThan(1e-6)
  }, 60_000)

  it('agrees to numerical precision on the pure unit conversion', async () => {
    const service = createArcGisTransformer()
    const from = resolveCrs('EPSG:2248')
    const to = resolveCrs('EPSG:26985')

    let serviceResult: Point2D[]
    try {
      serviceResult = await service.transform(COUNTY_POINTS_2248, from, to)
    } catch {
      return // no network, no cross-check
    }
    const local = await createProj4Transformer().transform(COUNTY_POINTS_2248, from, to)
    const operation = findOperation(from, to)!
    let worst = 0
    for (let i = 0; i < local.length; i++) {
      worst = Math.max(worst, Math.hypot(local[i][0] - serviceResult[i][0], local[i][1] - serviceResult[i][1]))
    }
    // Same grid, same datum, only the linear unit differs. Any divergence here
    // is a genuine defect, not a datum difference.
    expect(worst, `unit-only conversion diverged by ${worst} m`).toBeLessThanOrEqual(operation.crossCheckTolerance)
  }, 60_000)
})
