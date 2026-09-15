/**
 * Reopening — the revision loop.
 *
 * What is protected: a reopen takes the whole dependent closure (a rendered
 * sheet over a redrawn layout is stale), records it through the host or
 * refuses, never auto-runs the reopened chain (same inputs, same sheet), and
 * keeps the superseded outputs on the row. And `ingest_comments` reads
 * comments a person entered; it never invents them or marks them addressed.
 */

import {
  reopenClosure, applyReopen, newWorkflow, nextJobs, canRun, type WorkflowSnapshot,
} from '../workflow/state-machine'
import { runStage } from '../workflow/runner'
import { SITE_PLAN_STAGES } from '../workflow/definition'
import { SUBMISSION_PROCESSORS } from '../workflow/processors/submission-stages'
import type { IngestCommentsOutput } from '../workflow/processors/submission-stages'
import { unconnectedStages } from '../workflow/processors/index'
import type { StageContext, StageProcessor } from '../workflow/context'
import type { CountyComment } from '../review/checklist'

const allDone = (): WorkflowSnapshot => ({
  ...newWorkflow('wf_r'),
  stages: SITE_PLAN_STAGES.map(s => ({ job: s.job, status: 'COMPLETED' as const, attempt: 1 })),
})

/** Everything done except the stage under test — otherwise the runner replays it. */
const readyFor = (job: string): WorkflowSnapshot => ({
  ...newWorkflow('wf_r'),
  stages: SITE_PLAN_STAGES.filter(s => s.job !== job)
    .map(s => ({ job: s.job, status: 'COMPLETED' as const, attempt: 1 })),
})

describe('reopenClosure', () => {
  it('takes every transitive dependent, in definition order', () => {
    const c = reopenClosure(['siteplan.compose_sheets'])
    expect(c[0]).toBe('siteplan.compose_sheets')
    expect(c).toEqual(expect.arrayContaining([
      'siteplan.render_exports', 'siteplan.run_draft_qc', 'siteplan.deliver_preliminary',
      'siteplan.route_review', 'siteplan.apply_revisions', 'siteplan.run_issuance_qc',
      'siteplan.build_submission', 'siteplan.ingest_comments',
    ]))
    // Upstream of composition is untouched.
    expect(c).not.toContain('siteplan.generate_layout')
    expect(c).not.toContain('siteplan.resolve_property')
  })

  it('reopening the layout also reopens the design group that reads it', () => {
    const c = reopenClosure(['siteplan.generate_layout'])
    expect(c).toEqual(expect.arrayContaining([
      'siteplan.generate_grading', 'siteplan.generate_drainage', 'siteplan.generate_swm',
      'siteplan.generate_utilities', 'siteplan.compose_sheets',
    ]))
  })
})

describe('applyReopen', () => {
  it('drops the closure to READY and leaves the rest satisfied', () => {
    const { snapshot, reopened } = applyReopen(allDone(), ['siteplan.compose_sheets'])
    expect(reopened).toContain('siteplan.render_exports')
    const status = (j: string) => snapshot.stages.find(s => s.job === j)?.status
    expect(status('siteplan.compose_sheets')).toBe('READY')
    expect(status('siteplan.render_exports')).toBe('READY')
    expect(status('siteplan.generate_layout')).toBe('COMPLETED')
    // The guard now lets composition run again, and only composition — its
    // dependents wait on it as they did the first time.
    expect(canRun(snapshot, 'siteplan.compose_sheets')).toBe(true)
    expect(canRun(snapshot, 'siteplan.render_exports')).toBe(false)
    expect(nextJobs(snapshot, { firstReleaseOnly: true })).toEqual(['siteplan.compose_sheets'])
  })

  it('reports only stages that had actually run', () => {
    const fresh = newWorkflow('wf_fresh')
    expect(applyReopen(fresh, ['siteplan.compose_sheets']).reopened).toEqual([])
  })
})

// ── Runner ──────────────────────────────────────────────────────────────────

function ctxFor(snap: WorkflowSnapshot, job: string, caps: Record<string, unknown>): StageContext {
  return {
    workflowId: snap.workflowId, job: job as never, attempt: 1,
    subject: { organizationId: 'o', projectId: 'p', orderId: 'ord', productId: 'permit_site_plan', formData: {} },
    snapshot: snap,
    capabilities: {
      fetchImpl: (async () => ({ ok: true })) as never,
      async persist() {}, async storeArtifact() { return { documentId: 'd' } },
      trace() {}, now: () => new Date(),
      ...caps,
    } as never,
    priorOutputs: {
      'siteplan.build_submission': { documentId: 'doc_1', deliveryState: 'SUBMISSION_INCOMPLETE', submissionReady: false },
    } as never,
  }
}

describe('runner reopen handling', () => {
  const reopener: StageProcessor = async () => ({
    status: 'COMPLETED', outputs: { ok: true }, reopen: ['siteplan.compose_sheets'], enqueue: [],
  })

  it('records the closure through the host and enqueues nothing', async () => {
    const recorded: string[][] = []
    const snap = readyFor('siteplan.ingest_comments')
    const out = await runStage(
      ctxFor(snap, 'siteplan.ingest_comments', {
        reopenStages: async (_w: string, jobs: string[]) => { recorded.push(jobs) },
      }),
      { processors: { 'siteplan.ingest_comments': reopener } },
    )
    expect(out.disposition).toBe('COMPLETED')
    expect(recorded).toHaveLength(1)
    expect(recorded[0]).toContain('siteplan.compose_sheets')
    // The closure includes the triggering stage itself: it depends on
    // build_submission, so its just-persisted row drops to READY too. That is
    // what lets the next comment round run it again — and why a host must
    // bridge this run's outputs from the outcome, not from COMPLETED rows.
    expect(recorded[0]).toContain('siteplan.ingest_comments')
    expect(out.reopened).toEqual(recorded[0])
    expect(out.nextJobs).toEqual([])
    expect(out.summary).toMatch(/Reopened \d+ stage/)
  })

  it('refuses when the host cannot record a reopen', async () => {
    const out = await runStage(
      ctxFor(readyFor('siteplan.ingest_comments'), 'siteplan.ingest_comments', {}),
      { processors: { 'siteplan.ingest_comments': reopener } },
    )
    expect(out.disposition).toBe('BLOCKED')
    expect(out.error).toMatch(/reopenStages/)
  })
})

// ── ingest_comments ─────────────────────────────────────────────────────────

const ingest = SUBMISSION_PROCESSORS['siteplan.ingest_comments']!

const COMMENTS: CountyComment[] = [
  { id: 'c1', sheet: 'C-100', reviewer: 'DPIE Site/Road Plan Review', comment: 'Show the 25 ft BRL dimension from the right-of-way line.', receivedAt: '2026-09-20' },
  { id: 'c2', reviewer: 'DPIE Site/Road Plan Review', comment: 'Add the standard stabilization note.', receivedAt: '2026-09-20' },
]

describe('siteplan.ingest_comments', () => {
  it('is connected — nothing declared is left without a processor', () => {
    expect(unconnectedStages()).toEqual([])
  })

  it('blocks when the host keeps no comments', async () => {
    const r = await ingest(ctxFor(allDone(), 'siteplan.ingest_comments', {}))
    expect(r.status).toBe('BLOCKED')
  })

  it('waits, without reopening, until a letter is recorded', async () => {
    const r = await ingest(ctxFor(allDone(), 'siteplan.ingest_comments', { loadCountyComments: async () => [] }))
    expect(r.status).toBe('AWAITING_REVIEW')
    expect(r.reopen).toBeUndefined()
    expect((r.outputs as IngestCommentsOutput).receivedCount).toBe(0)
  })

  it('records the round, leaves every response to a person, and reopens from composition', async () => {
    const r = await ingest(ctxFor(allDone(), 'siteplan.ingest_comments', { loadCountyComments: async () => COMMENTS }))
    expect(r.status).toBe('COMPLETED')
    expect(r.reopen).toEqual(['siteplan.compose_sheets'])
    expect(r.enqueue).toEqual([])
    const out = r.outputs as IngestCommentsOutput
    expect(out.receivedCount).toBe(2)
    expect(out.responseMatrix.outstanding).toBe(2)
    expect(out.responseMatrix.addressed).toBe(0)
    expect(out.responseMatrix.rows.every(row => row.response === undefined)).toBe(true)
    expect(out.resumeFrom).toBe('siteplan.compose_sheets')
    expect(out.documentId).toBe('doc_1')
  })
})

describe('re-running a stage that previously BLOCKED', () => {
  it('enqueues its dependents once it completes — the old BLOCKED record must not shadow the new one', async () => {
    // resolve_property BLOCKED on a bad address, the address was fixed, and
    // the stage is run again. The snapshot still carries the BLOCKED record.
    const snap: WorkflowSnapshot = {
      ...newWorkflow('wf_retry'),
      stages: [
        { job: 'siteplan.initialize', status: 'COMPLETED', attempt: 1 },
        { job: 'siteplan.ingest_documents', status: 'COMPLETED', attempt: 1 },
        { job: 'siteplan.resolve_property', status: 'BLOCKED', attempt: 1 },
      ],
    }
    const ok: StageProcessor = async () => ({ status: 'COMPLETED', outputs: { parcelRing: [] } })
    const out = await runStage(
      { ...ctxFor(snap, 'siteplan.resolve_property', {}), attempt: 2 },
      { processors: { 'siteplan.resolve_property': ok } },
    )
    expect(out.disposition).toBe('COMPLETED')
    expect(out.nextJobs).toContain('siteplan.resolve_jurisdiction')
  })
})
