/**
 * The two survey stages, now that they have processors.
 *
 * `siteplan.ingest_survey` and `siteplan.reconcile_survey` were registered and
 * `undefined` — an order that arrived with a recorded plat looked identical to
 * one that arrived with nothing. These drive the processors directly, which is
 * what the runner does.
 */

import { FIRST_RELEASE_PROCESSORS } from '../workflow/processors/first-release'
import type {
  IngestSurveyOutput, ReconcileSurveyOutput, ResolvePropertyOutput,
} from '../workflow/processors/first-release'
import type { StageContext } from '../workflow/context'

/** A lot the setbacks leave a usable envelope on, in EPSG:2248. */
const PARCEL: [number, number][] = [
  [1340350, 440150], [1340450, 440150], [1340450, 440250], [1340350, 440250], [1340350, 440150],
]

/** 120 x 80 = 9,600 sq ft, closing exactly, on a rotated basis. */
const PLAT_CALLS = [
  { kind: 'line', bearing: 'N 12-30-00 E', distanceFt: 120, label: 'Call 1' },
  { kind: 'line', bearing: 'S 77-30-00 E', distanceFt: 80, label: 'Call 2' },
  { kind: 'line', bearing: 'S 12-30-00 W', distanceFt: 120, label: 'Call 3' },
  { kind: 'line', bearing: 'N 77-30-00 W', distanceFt: 80, label: 'Call 4' },
]

const RESOLVED: ResolvePropertyOutput = {
  matchedAddress: '1005 ROLLINS AVENUE',
  locatorScore: 100,
  easting2248: 1340400,
  northing2248: 440200,
  zoneCode: 'RSF-65',
  parcelRing: PARCEL,
  parcelAreaSqFt: 10_000,
  parcelId: '368546',
  streetPoint: [1340400, 440120],
  hasStreetFrontage: true,
}

function ctx(formData: Record<string, unknown>, job: string): StageContext {
  return {
    workflowId: 'wf_plat',
    job: job as never,
    attempt: 1,
    subject: {
      organizationId: 'org_1', projectId: 'proj_1', orderId: 'ord_1',
      productId: 'permit_site_plan',
      formData: { address: '1005 Rollins Ave', houseSquareFeet: 2400, storeys: 2, ...formData },
    },
    snapshot: { workflowId: 'wf_plat', definitionVersion: 1, stages: [] } as never,
    capabilities: {
      fetchImpl: (async () => ({ ok: true, status: 200, json: async () => ({}) })) as never,
      async persist() {}, async storeArtifact() { return { documentId: 'doc_1' } },
      trace() {}, now: () => new Date('2026-09-02T12:00:00Z'),
    } as never,
    priorOutputs: {
      'siteplan.resolve_property': RESOLVED,
      'siteplan.build_existing_conditions': {
        contourCount: 0, elevationsFt: [], verticalDatum: null,
        reliabilityLevel: 1, twinRevision: 1,
      },
    } as never,
  }
}

const platOrder = {
  platCalls: PLAT_CALLS,
  platReference: { liber: '12345', folio: '678', subdivisionName: 'Porter', lot: '1' },
  platBasisOfBearings: 'Maryland State Plane Coordinate System (NAD 83)',
  platRecordedAreaSqFt: 9_600,
}

describe('siteplan.ingest_survey', () => {
  const run = FIRST_RELEASE_PROCESSORS['siteplan.ingest_survey']!

  it('has a processor at all', () => {
    expect(typeof run).toBe('function')
    expect(typeof FIRST_RELEASE_PROCESSORS['siteplan.reconcile_survey']).toBe('function')
  })

  it('completes without a plat rather than blocking the order', async () => {
    // Most orders arrive with no plat and the preliminary package is produced
    // from county GIS regardless. This stage reports; it does not gate.
    const r = await run(ctx({}, 'siteplan.ingest_survey'))
    const out = r.outputs as IngestSurveyOutput
    expect(r.status).toBe('COMPLETED')
    expect(out.platProvided).toBe(false)
    expect(out.summary).toContain('Level 1')
  })

  it('computes the boundary when the order carries transcribed calls', async () => {
    const r = await run(ctx(platOrder, 'siteplan.ingest_survey'))
    const out = r.outputs as IngestSurveyOutput
    expect(r.status).toBe('COMPLETED')
    expect(out.platProvided).toBe(true)
    expect(out.callCount).toBe(4)
    expect(out.computedAreaSqFt).toBeCloseTo(9_600, 2)
    expect(out.certifiable).toBe(true)
    expect(out.reference?.liber).toBe('12345')
  })

  it('places the figure by fit when the instrument states no point of beginning', async () => {
    const r = await run(ctx(platOrder, 'siteplan.ingest_survey'))
    const out = r.outputs as IngestSurveyOutput
    expect(out.positionSource).toBe('fitted_to_reference')
    // A fit is drawable and is not a certified position, so the surveyor is
    // told to supply the coordinate.
    expect(out.beforeCertification.join(' ')).toContain('point of beginning')
  })

  it('uses the stated point of beginning when the plat publishes one', async () => {
    const r = await run(ctx(
      { ...platOrder, platPointOfBeginning: [1340254.7066, 440194.1578] },
      'siteplan.ingest_survey',
    ))
    const out = r.outputs as IngestSurveyOutput
    expect(out.positionSource).toBe('stated_point_of_beginning')
  })

  it('reports a bad transcription instead of drawing it as fact', async () => {
    const r = await run(ctx({
      ...platOrder,
      platCalls: [
        ...PLAT_CALLS.slice(0, 3),
        { kind: 'line', bearing: 'N 77-30-00 W', distanceFt: 79.6 },
      ],
    }, 'siteplan.ingest_survey'))
    const out = r.outputs as IngestSurveyOutput
    expect(out.certifiable).toBe(false)
    expect(out.problems.join(' ')).toContain('closes within')
  })
})

describe('siteplan.reconcile_survey', () => {
  const run = FIRST_RELEASE_PROCESSORS['siteplan.reconcile_survey']!

  it('does nothing gracefully when there is no plat', async () => {
    const r = await run(ctx({}, 'siteplan.reconcile_survey'))
    const out = r.outputs as ReconcileSurveyOutput
    expect(r.status).toBe('COMPLETED')
    expect(out.ran).toBe(false)
  })

  it('compares the plat figure against the county parcel and moves neither', async () => {
    const r = await run(ctx(platOrder, 'siteplan.reconcile_survey'))
    const out = r.outputs as ReconcileSurveyOutput
    expect(r.status).toBe('COMPLETED')
    expect(out.ran).toBe(true)
    expect(out.maxResidualFt).not.toBeNull()
    expect(typeof out.summary).toBe('string')
  })
})
