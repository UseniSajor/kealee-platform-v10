/**
 * Workflow enforcement.
 *
 * The engine was ~23,000 lines with one external importer and no worker. These
 * tests exist so that stays fixed: sequencing is enforced by executable code,
 * the definition cannot drift from the modules it names, and a duplicate
 * delivery cannot produce a second workflow.
 */

import {
  SITE_PLAN_STAGES, SITE_PLAN_WORKFLOW_VERSION, FIRST_RELEASE_STAGES, FIRST_JOB,
  stageFor, isRegisteredJob, implementedStages,
} from '../workflow/definition'
import {
  newWorkflow, assertCanRun, canRun, nextJobs, progress, currentStage,
  alreadySatisfied, unmetPrerequisites, WorkflowTransitionError,
  type WorkflowSnapshot,
} from '../workflow/state-machine'
import {
  SITE_PLAN_AGENTS, SITE_PLAN_WORKERS, SITE_PLAN_QUEUE, agentsFor, workerFor,
  isMachineCompletable, workflowIdempotencyKey, jobIdempotencyKey,
} from '../workflow/registry'

const complete = (snap: WorkflowSnapshot, ...jobs: string[]): WorkflowSnapshot => ({
  ...snap,
  stages: [
    ...snap.stages,
    ...jobs.map(j => ({ job: j as never, status: 'COMPLETED' as const, attempt: 1 })),
  ],
})

describe('workflow definition', () => {
  it('registers every first-release job', () => {
    expect(FIRST_RELEASE_STAGES).toHaveLength(13)
    expect(FIRST_RELEASE_STAGES[0].job).toBe(FIRST_JOB)
    expect(FIRST_RELEASE_STAGES[FIRST_RELEASE_STAGES.length - 1].job)
      .toBe('siteplan.deliver_preliminary')
  })

  it('persists every stage under a code the database already accepts', () => {
    // SitePlanStageCode has exactly these eight. Adding one needs a migration,
    // so a stage that invents a code would fail to persist at runtime.
    const allowed = new Set([
      'PARCEL_RESOLUTION', 'DOCUMENT_COLLECTION', 'FEASIBILITY', 'PLAN_GENERATION',
      'COMPLIANCE_AUDIT', 'PROFESSIONAL_REVIEW', 'SUBMITTED_TO_JURISDICTION',
      'SUBMISSION_CORRECTIONS',
    ])
    for (const s of SITE_PLAN_STAGES) expect(allowed.has(s.persistAs)).toBe(true)
  })

  it('has no prerequisite cycle and no forward reference', () => {
    const seen = new Set<string>()
    for (const s of SITE_PLAN_STAGES) {
      for (const r of s.requires) {
        expect(seen.has(r)).toBe(true)  // declared before use
      }
      seen.add(s.job)
    }
  })

  it('rejects an unregistered job name', () => {
    expect(isRegisteredJob('siteplan.initialize')).toBe(true)
    expect(isRegisteredJob('siteplan.make_it_up')).toBe(false)
    expect(() => stageFor('siteplan.make_it_up' as never)).toThrow(/Unregistered/)
  })
})

describe('transition guard', () => {
  it('permits only the first job on a new workflow', () => {
    const snap = newWorkflow('wf1')
    expect(nextJobs(snap, { firstReleaseOnly: true })).toEqual([FIRST_JOB])
  })

  it('rejects a job whose prerequisites are incomplete', () => {
    const snap = newWorkflow('wf1')
    expect(() => assertCanRun(snap, 'siteplan.render_exports'))
      .toThrow(WorkflowTransitionError)
    try { assertCanRun(snap, 'siteplan.render_exports') }
    catch (e) { expect((e as WorkflowTransitionError).code).toBe('PREREQUISITE_INCOMPLETE') }
  })

  it('rejects an unregistered job outright', () => {
    try { assertCanRun(newWorkflow('wf1'), 'siteplan.nope') }
    catch (e) { expect((e as WorkflowTransitionError).code).toBe('UNREGISTERED_JOB') }
  })

  it('refuses to mix definition versions', () => {
    const snap = { ...newWorkflow('wf1'), definitionVersion: SITE_PLAN_WORKFLOW_VERSION + 1 }
    try { assertCanRun(snap, FIRST_JOB) }
    catch (e) { expect((e as WorkflowTransitionError).code).toBe('VERSION_MISMATCH') }
  })

  it('refuses to rerun a completed stage', () => {
    const snap = complete(newWorkflow('wf1'), FIRST_JOB)
    expect(alreadySatisfied(snap, FIRST_JOB)).toBe(true)
    try { assertCanRun(snap, FIRST_JOB) }
    catch (e) { expect((e as WorkflowTransitionError).code).toBe('ALREADY_COMPLETED') }
  })

  it('refuses to run a stage that is already in progress', () => {
    const snap: WorkflowSnapshot = {
      ...newWorkflow('wf1'),
      stages: [{ job: FIRST_JOB, status: 'IN_PROGRESS', attempt: 1 }],
    }
    try { assertCanRun(snap, FIRST_JOB) }
    catch (e) { expect((e as WorkflowTransitionError).code).toBe('ALREADY_RUNNING') }
  })

  it('names exactly which prerequisites are unmet', () => {
    // build_existing_conditions needs BOTH the rules and the evidence, so with
    // only initialize done, both come back — in definition order.
    const snap = complete(newWorkflow('wf1'), FIRST_JOB)
    expect(unmetPrerequisites(snap, 'siteplan.build_existing_conditions'))
      .toEqual(['siteplan.evaluate_rules', 'siteplan.ingest_documents'])

    // Satisfying one leaves exactly the other named.
    const withRules = complete(snap, 'siteplan.resolve_jurisdiction', 'siteplan.evaluate_rules')
    expect(unmetPrerequisites(withRules, 'siteplan.build_existing_conditions'))
      .toEqual(['siteplan.ingest_documents'])
  })
})

describe('resume', () => {
  it('picks up from the last completed stage, not from the beginning', () => {
    let snap = newWorkflow('wf1')
    snap = complete(snap,
      'siteplan.initialize', 'siteplan.resolve_property', 'siteplan.ingest_documents',
      'siteplan.resolve_jurisdiction', 'siteplan.evaluate_rules',
      'siteplan.build_existing_conditions', 'siteplan.generate_envelope')
    expect(nextJobs(snap, { firstReleaseOnly: true })).toEqual(['siteplan.generate_layout'])
    expect(canRun(snap, 'siteplan.initialize')).toBe(false)
  })

  it('reports the furthest persisted stage code', () => {
    let snap = newWorkflow('wf1')
    expect(currentStage(snap)).toBe('PARCEL_RESOLUTION')
    snap = complete(snap, 'siteplan.initialize', 'siteplan.resolve_property',
      'siteplan.ingest_documents', 'siteplan.resolve_jurisdiction', 'siteplan.evaluate_rules')
    expect(currentStage(snap)).toBe('FEASIBILITY')
  })

  it('reports blocked when nothing can run and work remains', () => {
    const snap: WorkflowSnapshot = {
      ...newWorkflow('wf1'),
      stages: [{ job: FIRST_JOB, status: 'REJECTED', attempt: 1 }],
    }
    const p = progress(snap, { firstReleaseOnly: true })
    expect(p.blocked).toBe(true)
    expect(p.completed).toBe(0)
  })

  it('only reports a deliverable once one actually exists', () => {
    let snap = newWorkflow('wf1')
    expect(progress(snap, { firstReleaseOnly: true }).hasDeliverable).toBe(false)
    snap = complete(snap, ...FIRST_RELEASE_STAGES.map(s => s.job))
    const p = progress(snap, { firstReleaseOnly: true })
    expect(p.hasDeliverable).toBe(true)
    expect(p.completed).toBe(13)
  })
})

describe('idempotency', () => {
  it('resolves a duplicate order delivery to the same workflow key', () => {
    const a = workflowIdempotencyKey({ orderId: 'ord_1', definitionVersion: 1 })
    const b = workflowIdempotencyKey({ orderId: 'ord_1', definitionVersion: 1 })
    expect(a).toBe(b)
  })

  it('gives a different key to a different definition version', () => {
    expect(workflowIdempotencyKey({ orderId: 'ord_1', definitionVersion: 1 }))
      .not.toBe(workflowIdempotencyKey({ orderId: 'ord_1', definitionVersion: 2 }))
  })

  it('collapses a redelivered job onto one execution', () => {
    const k = { workflowId: 'wf1', job: 'siteplan.render_exports' as const }
    expect(jobIdempotencyKey(k)).toBe(jobIdempotencyKey(k))
    expect(jobIdempotencyKey({ ...k, attemptOf: 2 })).not.toBe(jobIdempotencyKey(k))
  })
})

describe('agent and worker registries', () => {
  it('registers a worker for every stage, on the shared queue', () => {
    expect(SITE_PLAN_WORKERS).toHaveLength(SITE_PLAN_STAGES.length)
    for (const w of SITE_PLAN_WORKERS) {
      expect(w.queue).toBe(SITE_PLAN_QUEUE)
      expect(w.maxAttempts).toBeGreaterThan(0)
      expect(w.maxAttempts).toBeLessThanOrEqual(5)   // bounded
    }
  })

  it('gives a live-service stage more retries than a deterministic one', () => {
    expect(workerFor('siteplan.resolve_property').maxAttempts)
      .toBeGreaterThan(workerFor('siteplan.generate_envelope').maxAttempts)
  })

  it('never lets a software agent record a professional approval', () => {
    for (const a of SITE_PLAN_AGENTS) {
      if (a.kind === 'software') {
        expect(a.mayApprove).toBe(false)
        expect(a.licence).toBeNull()
      } else {
        expect(a.licence).not.toBeNull()
      }
    }
  })

  it('routes every stage to at least one authorised agent', () => {
    for (const s of SITE_PLAN_STAGES) expect(agentsFor(s.job).length).toBeGreaterThan(0)
  })

  it('marks the drafting stages machine-completable', () => {
    expect(isMachineCompletable('siteplan.render_exports')).toBe(true)
    expect(isMachineCompletable('siteplan.compose_sheets')).toBe(true)
  })
})

describe('synchronisation — the definition must name real code', () => {
  it('points every implemented stage at a module and export', () => {
    const impl = implementedStages()
    expect(impl.length).toBeGreaterThan(10)
    for (const i of impl) {
      expect(i.module).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+$/)
      expect(i.export).toMatch(/^[a-zA-Z]/)
    }
  })

  it('resolves EVERY named implementation against the real package', () => {
    // This is what stops the definition becoming documentation of modules
    // nobody wrote. If a stage names an export that does not exist, this fails.
    //
    // It used to check only the first-release stages, and four later-phase
    // stages had drifted behind that gap: `design#designSite`,
    // `engineering#designDrainage`, `engineering#designStormwater` and
    // `pg-site-data#partNearSite` all named functions nobody ever wrote. The
    // stages a release has not reached yet are exactly the ones nothing else
    // exercises, so they are the ones this check is for.
    const named = SITE_PLAN_STAGES.filter(s => s.implementation)
    expect(named.length).toBeGreaterThan(15)
    const missing: string[] = []
    for (const s of named) {
      const [mod, exp] = (s.implementation as string).split('#')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const loaded = require(`../${mod}`)
      if (typeof loaded[exp] !== 'function') missing.push(`${s.job} -> ${s.implementation}`)
    }
    expect(missing).toEqual([])
  })

  it('keeps every first-release stage reachable from the first job', () => {
    let snap = newWorkflow('wf1')
    const order: string[] = []
    for (let i = 0; i < 40; i++) {
      const next = nextJobs(snap, { firstReleaseOnly: true })
      if (!next.length) break
      order.push(...next)
      snap = complete(snap, ...next)
    }
    expect(order).toHaveLength(13)
    for (const s of FIRST_RELEASE_STAGES) expect(order).toContain(s.job)
  })
})
