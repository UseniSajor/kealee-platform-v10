/**
 * The vertical slice, driven through the production runner.
 *
 * Not the script. `runStage` is what a worker calls, and this drives all
 * thirteen first-release stages through it with in-memory capabilities — so
 * the guard, the persistence contract and the resume path are all exercised
 * exactly as production will exercise them.
 *
 * Network is stubbed. The point here is sequencing and persistence, not
 * whether PGAtlas is up; the live services have their own tests.
 */

import { runStage, type RunnerDeps } from '../workflow/runner'
import { FIRST_RELEASE_PROCESSORS } from '../workflow/processors/first-release'
import { FIRST_RELEASE_STAGES, FIRST_JOB, type SitePlanJobName } from '../workflow/definition'
import { newWorkflow, nextJobs, type WorkflowSnapshot } from '../workflow/state-machine'
import type { StageContext, PersistedStageOutput, TraceEvent } from '../workflow/context'

/** A lot big enough that setbacks leave a usable envelope. */
const RING: [number, number][] = [
  [1340350, 440150], [1340450, 440150], [1340450, 440250], [1340350, 440250], [1340350, 440150],
]

function stubFetch(): typeof fetch {
  return (async (url: string) => {
    const u = String(url)
    const json = (body: unknown) =>
      ({ ok: true, status: 200, json: async () => body } as unknown as Response)

    if (u.includes('findAddressCandidates')) {
      return json({ candidates: [{ address: '1005 ROLLINS AVENUE', score: 100,
        location: { x: 1340400, y: 440200 } }] })
    }
    if (u.includes('Property/MapServer')) {
      return json({ features: [{ attributes: { PROP_ID: '368546', 'SHAPE.AREA': 10000 },
        geometry: { rings: [RING] } }] })
    }
    if (u.includes('Zoning/MapServer')) {
      return json({ features: [{ attributes: { 'ARCDBA.Zoning_Py.CLASS': 'RSF-65' } }] })
    }
    if (u.includes('Transportation/MapServer')) {
      return json({ features: [{ geometry: { paths: [[[1340400, 440120]]] } }] })
    }
    if (u.includes('Elevation/MapServer')) {
      return json({ features: [
        { attributes: { ELEVATION: 210, FEATURE_CODE: 7101 },
          geometry: { paths: [[[1340360, 440160], [1340440, 440160]]] } },
        { attributes: { ELEVATION: 212, FEATURE_CODE: 7102 },
          geometry: { paths: [[[1340360, 440200], [1340440, 440200]]] } },
      ] })
    }
    return json({ features: [] })
  }) as unknown as typeof fetch
}

function harness() {
  const persisted: PersistedStageOutput[] = []
  const traces: TraceEvent[] = []
  const artifacts: { documentId: string; bytes: number; preliminary: boolean }[] = []
  let docSeq = 0

  const capabilities = {
    fetchImpl: stubFetch(),
    async persist(r: PersistedStageOutput) { persisted.push(r) },
    async storeArtifact(a: { bytes: Buffer; preliminary: boolean }) {
      docSeq++
      artifacts.push({ documentId: `doc_${docSeq}`, bytes: a.bytes.length, preliminary: a.preliminary })
      return { documentId: `doc_${docSeq}` }
    },
    trace(e: TraceEvent) { traces.push(e) },
    now: () => new Date('2026-08-25T12:00:00Z'),
  }

  const deps: RunnerDeps = {
    processors: FIRST_RELEASE_PROCESSORS,
    async loadPriorResult(_w, job) {
      return persisted.find(p => p.job === job)?.outputs ?? null
    },
  }

  const subject = {
    organizationId: 'org_1', projectId: 'proj_1', orderId: 'ord_1', productId: 'permit_site_plan',
    formData: { address: '1005 Rollins Ave', houseSquareFeet: 2400, storeys: 2, garage: 'attached_2_car' },
  }

  const ctxFor = (snap: WorkflowSnapshot, job: SitePlanJobName): StageContext => ({
    workflowId: snap.workflowId, job, attempt: 1, subject, snapshot: snap,
    capabilities: capabilities as never,
    priorOutputs: Object.fromEntries(
      persisted.filter(p => p.status === 'COMPLETED').map(p => [p.job, p.outputs]),
    ) as never,
  })

  return { persisted, traces, artifacts, deps, ctxFor }
}

/** Drives the slice to completion, one stage at a time, through the runner. */
async function driveSlice() {
  const h = harness()
  let snap = newWorkflow('wf_slice')
  const order: string[] = []

  for (let i = 0; i < 30; i++) {
    const runnable = nextJobs(snap, { firstReleaseOnly: true })
    if (!runnable.length) break
    const job = runnable[0]
    const out = await runStage(h.ctxFor(snap, job), h.deps)
    order.push(job)
    if (out.disposition !== 'COMPLETED') return { ...h, snap, order, halted: out }
    snap = { ...snap, stages: [...snap.stages, { job, status: 'COMPLETED', attempt: 1 }] }
  }
  return { ...h, snap, order, halted: null }
}

describe('the vertical slice runs through the production runner', () => {
  it('completes all thirteen first-release stages', async () => {
    const r = await driveSlice()
    expect(r.halted).toBeNull()
    expect(r.order).toHaveLength(13)
    expect(r.order[0]).toBe(FIRST_JOB)
    expect(r.order[r.order.length - 1]).toBe('siteplan.deliver_preliminary')
  })

  it('starts from the same entry point the webhook uses, not a script', async () => {
    // scripts/generate-site-plan.ts is not imported anywhere in this file. The
    // slice is driven entirely by runStage + the registered processors.
    const r = await driveSlice()
    for (const s of FIRST_RELEASE_STAGES) expect(r.order).toContain(s.job)
  })

  it('persists every completed stage', async () => {
    const r = await driveSlice()
    const persistedJobs = r.persisted.filter(p => p.status === 'COMPLETED').map(p => p.job)
    for (const s of FIRST_RELEASE_STAGES) expect(persistedJobs).toContain(s.job)
    expect(r.persisted.length).toBeGreaterThanOrEqual(13)
  })

  it('records the rule-pack version on the evaluation stage', async () => {
    const r = await driveSlice()
    const rules = r.persisted.find(p => p.job === 'siteplan.evaluate_rules')
    expect(rules?.rulePackVersion).toBe('pg-2022.1')
  })

  it('produces a preliminary PDF artifact', async () => {
    const r = await driveSlice()
    expect(r.artifacts).toHaveLength(1)
    expect(r.artifacts[0].preliminary).toBe(true)
    expect(r.artifacts[0].bytes).toBeGreaterThan(1000)
  })

  it('composes a PG infill lot to one or two sheets, never ten', async () => {
    const r = await driveSlice()
    const composed = r.persisted.find(p => p.job === 'siteplan.compose_sheets')
      ?.outputs as { pages: unknown[] }
    expect(composed.pages.length).toBeGreaterThanOrEqual(1)
    expect(composed.pages.length).toBeLessThanOrEqual(2)
  })

  it('resolves street frontage, which Sec. 24-128 requires of a buildable lot', async () => {
    const r = await driveSlice()
    const prop = r.persisted.find(p => p.job === 'siteplan.resolve_property')
      ?.outputs as { hasStreetFrontage: boolean; locatorScore: number }
    expect(prop.hasStreetFrontage).toBe(true)
    expect(prop.locatorScore).toBe(100)
  })

  it('delivers, and never implies jurisdiction approval', async () => {
    const r = await driveSlice()
    const d = r.persisted.find(p => p.job === 'siteplan.deliver_preliminary')
      ?.outputs as { deliveryState: string; note: string }
    expect(d.deliveryState).toBe('PRELIMINARY_READY')
    expect(d.note).toMatch(/Jurisdiction approval is separate and not implied/)
  })

  it('emits a start and a complete trace for every stage', async () => {
    const r = await driveSlice()
    expect(r.traces.filter(t => t.phase === 'start')).toHaveLength(13)
    expect(r.traces.filter(t => t.phase === 'complete')).toHaveLength(13)
  })
})

describe('runner enforcement', () => {
  it('rejects a stage whose prerequisites are unmet', async () => {
    const h = harness()
    const snap = newWorkflow('wf1')
    const out = await runStage(h.ctxFor(snap, 'siteplan.render_exports'), h.deps)
    expect(out.disposition).toBe('REJECTED_BY_GUARD')
    expect(out.error).toMatch(/requires/)
    expect(h.persisted).toHaveLength(0)
  })

  it('returns the persisted result on redelivery instead of recomputing', async () => {
    const h = harness()
    let snap = newWorkflow('wf1')
    await runStage(h.ctxFor(snap, FIRST_JOB), h.deps)
    snap = { ...snap, stages: [{ job: FIRST_JOB, status: 'COMPLETED', attempt: 1 }] }

    const before = h.persisted.length
    const again = await runStage(h.ctxFor(snap, FIRST_JOB), h.deps)
    expect(again.disposition).toBe('SKIPPED_ALREADY_DONE')
    expect(h.persisted).toHaveLength(before)   // nothing written twice
    expect(again.outputs).not.toBeNull()
  })

  it('reports NO_PROCESSOR for a declared but unconnected stage', async () => {
    const h = harness()
    let snap = newWorkflow('wf1')
    snap = { ...snap, stages: [{ job: FIRST_JOB, status: 'COMPLETED', attempt: 1 }] }
    const out = await runStage(h.ctxFor(snap, 'siteplan.ingest_survey'), h.deps)
    expect(out.disposition).toBe('NO_PROCESSOR')
    expect(out.summary).toMatch(/declared and not yet connected/)
  })

  it('persists the failure rather than throwing when a stage blocks', async () => {
    const h = harness()
    const snap = newWorkflow('wf_noaddr')
    const ctx = {
      ...h.ctxFor(snap, FIRST_JOB),
      job: 'siteplan.resolve_property' as const,
      snapshot: { ...snap, stages: [{ job: FIRST_JOB, status: 'COMPLETED' as const, attempt: 1 }] },
      subject: { ...h.ctxFor(snap, FIRST_JOB).subject, formData: {} },
    }
    const out = await runStage(ctx, h.deps)
    expect(out.disposition).toBe('BLOCKED')
    expect(out.blockers[0]).toMatch(/No address/)
    expect(h.persisted.some(p => p.status === 'BLOCKED')).toBe(true)
  })
})

describe('resume', () => {
  it('picks up mid-slice from persisted stages without redoing earlier work', async () => {
    const r = await driveSlice()
    // Drop the last three stages and confirm the runner resumes at the right one.
    const partial: WorkflowSnapshot = {
      ...r.snap, stages: r.snap.stages.slice(0, 10),
    }
    const next = nextJobs(partial, { firstReleaseOnly: true })
    expect(next).toEqual(['siteplan.run_draft_qc'])
  })
})
