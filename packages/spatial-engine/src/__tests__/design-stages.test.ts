/**
 * The five E_DESIGN stages, now that they have processors.
 *
 * Grading, drainage, stormwater, utilities and environmental constraints were
 * registered and `undefined`, so the design half of the engine had no way into
 * the pipeline. These drive the processors directly, which is what the runner
 * does.
 *
 * What is worth testing here is not that the arithmetic runs — engineering.ts
 * has its own tests — but that each stage says what it does NOT know: an
 * assumed datum, an unestablished overflow path, an unresolved utility main,
 * and a county layer that did not answer.
 */

import { DESIGN_PROCESSORS } from '../workflow/processors/design-stages'
import type {
  GradingOutput, DrainageOutput, StormwaterOutput, UtilitiesOutput, EnvironmentalOutput,
} from '../workflow/processors/design-stages'
import { unconnectedStages } from '../workflow/processors/index'
import type { ResolvePropertyOutput } from '../workflow/processors/first-release'
import type { StageContext } from '../workflow/context'

/** A lot the setbacks leave a usable envelope on, in EPSG:2248. */
const PARCEL: [number, number][] = [
  [1340350, 440150], [1340450, 440150], [1340450, 440250], [1340350, 440250], [1340350, 440150],
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

/** What the county's 2-ft contour layer produced for this site. */
const WITH_CONTOURS = {
  contourCount: 2,
  elevationsFt: [210, 212],
  intervalFt: 2,
  verticalDatum: 'NAVD88',
  reliabilityLevel: 1,
  twinRevision: 1,
  contours: [
    { elevationFt: 210, path: [[1340360, 440160], [1340440, 440160]], weight: 1, hidden: false },
    { elevationFt: 212, path: [[1340360, 440200], [1340440, 440200]], weight: 1, hidden: false },
  ],
}

/** No elevation source answered. */
const NO_CONTOURS = {
  contourCount: 0, elevationsFt: [], intervalFt: null, verticalDatum: null,
  reliabilityLevel: 1, twinRevision: 1,
}

interface CtxOptions {
  conditions?: unknown
  formData?: Record<string, unknown>
  fetchImpl?: typeof fetch
}

function ctx(job: string, opts: CtxOptions = {}): StageContext {
  return {
    workflowId: 'wf_design',
    job: job as never,
    attempt: 1,
    subject: {
      organizationId: 'org_1', projectId: 'proj_1', orderId: 'ord_1',
      productId: 'permit_site_plan',
      formData: {
        address: '1005 Rollins Ave', houseSquareFeet: 2400, storeys: 2,
        garage: 'attached_2_car', ...opts.formData,
      },
    },
    snapshot: { workflowId: 'wf_design', definitionVersion: 1, stages: [] } as never,
    capabilities: {
      fetchImpl: opts.fetchImpl ?? ((async () => ({
        ok: true, status: 200, json: async () => ({ features: [] }),
      })) as never),
      async persist() {}, async storeArtifact() { return { documentId: 'doc_1' } },
      trace() {}, now: () => new Date('2026-09-03T12:00:00Z'),
    } as never,
    priorOutputs: {
      'siteplan.resolve_property': RESOLVED,
      'siteplan.build_existing_conditions': opts.conditions ?? WITH_CONTOURS,
    } as never,
  }
}

describe('the design group is connected', () => {
  it('has a processor for every E_DESIGN stage', () => {
    for (const job of [
      'siteplan.generate_grading', 'siteplan.generate_drainage', 'siteplan.generate_swm',
      'siteplan.generate_utilities', 'siteplan.generate_environmental',
    ] as const) {
      expect(typeof DESIGN_PROCESSORS[job]).toBe('function')
      expect(unconnectedStages()).not.toContain(job)
    }
  })
})

describe('siteplan.generate_grading', () => {
  const run = DESIGN_PROCESSORS['siteplan.generate_grading']!

  it('draws at the interval the county publishes, not at a default', async () => {
    // PGAtlas serves 2-ft contours. The design module's own default is 1 ft,
    // and using it would put a contour label on the sheet the source cannot
    // support.
    const r = await run(ctx('siteplan.generate_grading'))
    const out = r.outputs as GradingOutput
    expect(r.status).toBe('COMPLETED')
    expect(out.contourIntervalFt).toBe(2)
    expect(out.verticalDatum).toBe('NAVD88')
    expect(out.datumEstablished).toBe(true)
    expect(out.gradedAreaDrawn).toBe(true)
  })

  it('derives the interval from the elevations when none was recorded', async () => {
    // Workflows persisted before `intervalFt` existed still have elevations.
    const { intervalFt: _drop, ...older } = WITH_CONTOURS
    const r = await run(ctx('siteplan.generate_grading', { conditions: older }))
    expect((r.outputs as GradingOutput).contourIntervalFt).toBe(2)
  })

  it('still produces the drawing when no elevation source answered', async () => {
    // Generation is never gated. What changes is what the output admits.
    const r = await run(ctx('siteplan.generate_grading', { conditions: NO_CONTOURS }))
    const out = r.outputs as GradingOutput
    expect(r.status).toBe('COMPLETED')
    expect(out.datumEstablished).toBe(false)
    expect(out.existingContourCount).toBe(0)
    expect(out.beforeSeal.join(' ')).toContain('existing grade is not established')
    expect(out.beforeSeal.join(' ')).toContain('vertical datum')
    expect(out.assumptions.some(a => a.resolvedBy === 'survey')).toBe(true)
  })

  it('never invents the spot elevations Sec. 32-130(a)(9) asks for', async () => {
    const r = await run(ctx('siteplan.generate_grading'))
    const out = r.outputs as GradingOutput
    expect(out.beforeSeal.join(' ')).toContain('32-130(a)(9)')
    expect(out.beforeSeal.join(' ')).toMatch(/field survey/i)
  })
})

describe('siteplan.generate_drainage', () => {
  const run = DESIGN_PROCESSORS['siteplan.generate_drainage']!

  it('computes the rational-method figures and shows the equations', async () => {
    const r = await run(ctx('siteplan.generate_drainage'))
    const out = r.outputs as DrainageOutput
    expect(r.status).toBe('COMPLETED')
    expect(out.drainageAreaAcres).toBeCloseTo(10_000 / 43_560, 3)
    expect(out.compositeRunoffCoefficient).toBeGreaterThan(0)
    expect(out.peakDischargeCfs).toBeGreaterThan(0)
    expect(out.calculations.peakDischarge.equation).toContain('Q = C')
    expect(out.calculations.peakDischarge.calcVersion).toBeTruthy()
  })

  it('does not claim a 100-year overflow path it cannot draw', async () => {
    // Sec. 32-162's overflow path follows finished grades, and finished grades
    // need the survey the grading stage already said is missing.
    const r = await run(ctx('siteplan.generate_drainage'))
    const out = r.outputs as DrainageOutput
    expect(out.overflowPathEstablished).toBe(false)
    expect(out.beforeSeal.join(' ')).toContain('32-162')
  })
})

describe('siteplan.generate_swm', () => {
  const run = DESIGN_PROCESSORS['siteplan.generate_swm']!

  it('sizes the ESD practice and carries the WQv calculation', async () => {
    const r = await run(ctx('siteplan.generate_swm'))
    const out = r.outputs as StormwaterOutput
    expect(r.status).toBe('COMPLETED')
    expect(out.waterQualityVolumeCf).toBeGreaterThan(0)
    expect(out.practice?.footprintSqFt).toBeGreaterThan(0)
    expect(out.calculations.waterQualityVolume.reference).toMatch(/Maryland/)
    expect(out.assumptions.some(a => a.resolvedBy === 'geotechnical')).toBe(true)
  })

  it('answers the 5,000 sq ft gate from the disturbance calculation', async () => {
    const r = await run(ctx('siteplan.generate_swm'))
    const out = r.outputs as StormwaterOutput
    expect(out.thresholdSqFt).toBe(5_000)
    // Indeterminate counts as triggered — the safe direction, and the engine's
    // rule rather than this stage's opinion.
    if (!out.review.certain) expect(out.review.required).toBe(true)
    expect(out.summary).toContain(out.review.certain ? '' : 'INDETERMINATE')
  })

  it('says the sediment control is missing rather than omitting it silently', async () => {
    // No limit-of-disturbance polygon is in the twin, so silt fence and the
    // stabilized construction entrance are not drawn. A required item absent
    // from a sheet with nothing said about it is how a plan gets rejected.
    const r = await run(ctx('siteplan.generate_swm'))
    const out = r.outputs as StormwaterOutput
    expect(out.sedimentControlDrawn).toBe(false)
    expect(out.beforeSeal.join(' ')).toContain('limit of disturbance')
  })
})

describe('siteplan.generate_utilities', () => {
  const run = DESIGN_PROCESSORS['siteplan.generate_utilities']!

  it('draws the proposed service runs with their lengths', async () => {
    const r = await run(ctx('siteplan.generate_utilities'))
    const out = r.outputs as UtilitiesOutput
    expect(r.status).toBe('COMPLETED')
    expect(out.runs.map(x => x.type)).toEqual(
      expect.arrayContaining(['Water service', 'Sanitary lateral', 'Storm drain']))
    for (const run_ of out.runs) expect(run_.lengthFt).toBeGreaterThan(0)
  })

  it('does not present a schematic run as a located connection', async () => {
    // Sec. 32-106 wants existing AND proposed. No county layer this engine
    // reads carries mains, sizes or inverts.
    const r = await run(ctx('siteplan.generate_utilities'))
    const out = r.outputs as UtilitiesOutput
    expect(out.existingMainsResolved).toBe(false)
    expect(out.beforeSeal.join(' ')).toContain('32-106')
    expect(out.beforeSeal.join(' ')).toContain('Miss Utility')
    expect(out.assumptions.some(a => a.resolvedBy === 'utility_owner')).toBe(true)
  })
})

// ── Environmental — the live-query stage ────────────────────────────────────

function envFetch(behaviour: 'ok' | 'partial' | 'all_fail'): typeof fetch {
  const polygon = {
    attributes: { NAME: 'ESA wetland' },
    geometry: { rings: [[[1340380, 440180], [1340420, 440180], [1340420, 440220], [1340380, 440180]]] },
  }
  return (async (url: string) => {
    const u = String(url)
    const json = (body: unknown) =>
      ({ ok: true, status: 200, json: async () => body } as unknown as Response)
    if (behaviour === 'all_fail') return { ok: false, status: 503 } as unknown as Response
    if (behaviour === 'partial' && u.includes('ZoningCertificationLetter')) {
      // ArcGIS reports failures in the body with HTTP 200.
      return json({ error: { message: 'Layer temporarily unavailable' } })
    }
    if (u.includes('Stream_and_Wetland_Buffer_Identifier')) return json({ features: [polygon] })
    return json({ features: [] })
  }) as unknown as typeof fetch
}

describe('siteplan.generate_environmental', () => {
  const run = DESIGN_PROCESSORS['siteplan.generate_environmental']!

  it('reports the constraints the county layers return', async () => {
    const r = await run(ctx('siteplan.generate_environmental', { fetchImpl: envFetch('ok') }))
    const out = r.outputs as EnvironmentalOutput
    expect(r.status).toBe('COMPLETED')
    expect(out.featureCount).toBeGreaterThan(0)
    expect(out.constraintsDetermined).toBe(true)
    expect(out.layers.length).toBeGreaterThan(4)
    expect(out.source).not.toBeNull()
  })

  it('marks the set undetermined when a layer did not answer', async () => {
    // An absent constraint and an unanswered query draw identically. Only one
    // of them is a finding, and the difference has to survive into the output.
    const r = await run(ctx('siteplan.generate_environmental', { fetchImpl: envFetch('partial') }))
    const out = r.outputs as EnvironmentalOutput
    expect(r.status).toBe('COMPLETED')
    expect(out.constraintsDetermined).toBe(false)
    expect(out.layers.some(l => l.error !== null)).toBe(true)
    expect(out.summary).toContain('NOT reported as clear')
  })

  it('blocks rather than recording an empty set when nothing answered', async () => {
    const r = await run(ctx('siteplan.generate_environmental', { fetchImpl: envFetch('all_fail') }))
    expect(r.status).toBe('BLOCKED')
    expect(r.outputs).toBeNull()
    expect(r.blockers?.join(' ')).toContain('nothing is known')
  })

  it('blocks when the query throws instead of reporting a clear site', async () => {
    const boom = (async () => { throw new Error('ENOTFOUND gis.pgatlas.com') }) as unknown as typeof fetch
    const r = await run(ctx('siteplan.generate_environmental', { fetchImpl: boom }))
    expect(r.status).toBe('BLOCKED')
    expect(r.blockers?.join(' ')).toContain('ENOTFOUND')
  })
})
