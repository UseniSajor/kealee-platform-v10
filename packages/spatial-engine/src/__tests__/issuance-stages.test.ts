/**
 * The I/J stages — issuance QC and the submission package.
 *
 * The thing to protect: "ready to submit" is a conclusion from evidence and
 * sign-off, never from approval alone. An approved engineer review with no
 * certified survey on file must NOT produce an issuable package, and the
 * submission stage must still assemble what exists and say what is missing.
 */

import { ISSUANCE_PROCESSORS } from '../workflow/processors/issuance-stages'
import type { IssuanceQcOutput, SubmissionPackageOutput } from '../workflow/processors/issuance-stages'
import type { RouteReviewOutput } from '../workflow/processors/review-stages'
import type { ResolvePropertyOutput } from '../workflow/processors/first-release'
import type { StageContext } from '../workflow/context'
import type { EvidenceLedger } from '../review/evidence'

const PARCEL: [number, number][] = [
  [1340350, 440150], [1340450, 440150], [1340450, 440250], [1340350, 440250], [1340350, 440150],
]

const RESOLVED: ResolvePropertyOutput = {
  matchedAddress: '1005 ROLLINS AVENUE', locatorScore: 100,
  easting2248: 1340400, northing2248: 440200, zoneCode: 'RSF-65',
  parcelRing: PARCEL, parcelAreaSqFt: 10_000, parcelId: '368546',
  streetPoint: [1340400, 440120], hasStreetFrontage: true,
  streets: [{ name: 'ROLLINS AVE', paths: [[[1340300, 440120], [1340500, 440120]]] }],
  municipality: {
    determined: true, incorporated: false, name: null,
    nearestName: 'CAPITOL HEIGHTS', nearestWithin: 'quarter_mile',
    mailingCity: 'Capitol Heights', zipCode: '20743', internalStaffReviewRequired: false,
  },
}

const REVIEWER = {
  displayName: 'A. Engineer', licenceNumber: 'MD-12345', licenceState: 'MD',
  discipline: 'professional_engineer',
}

function routed(state: RouteReviewOutput['reviewState']): RouteReviewOutput {
  return {
    reviewState: state, documentId: 'doc_1', responsibility: [],
    reviewer: REVIEWER,
    approvals: [
      { subject: 'ZONING_COMPLIANCE', decision: 'APPROVED', comment: null, decidedByName: 'A. Engineer',
        licenceNumber: 'MD-12345', licenceState: 'MD', decidedAt: '2026-09-16T10:00:00Z' },
      { subject: 'SITE_LAYOUT', decision: 'APPROVED', comment: null, decidedByName: 'A. Engineer',
        licenceNumber: 'MD-12345', licenceState: 'MD', decidedAt: '2026-09-16T10:00:00Z' },
    ],
    outstanding: [], redlines: [], reviewCompletedAt: '2026-09-16T11:00:00Z', note: '',
  }
}

function ctx(job: string, opts: {
  review?: RouteReviewOutput
  ledger?: EvidenceLedger | null | 'absent'
  issuance?: IssuanceQcOutput
  frameFailures?: { sheet: string; missing: string[] }[]
} = {}): StageContext {
  const caps: Record<string, unknown> = {
    fetchImpl: (async () => ({ ok: true, json: async () => ({}) })) as never,
    async persist() {}, async storeArtifact() { return { documentId: 'doc_1' } },
    trace() {}, now: () => new Date('2026-09-16T12:00:00Z'),
  }
  if (opts.ledger !== 'absent') caps.loadEvidenceLedger = async () => opts.ledger ?? { items: [] }
  return {
    workflowId: 'wf_issue', job: job as never, attempt: 1,
    subject: {
      organizationId: 'org_1', projectId: 'proj_1', orderId: 'ord_1', productId: 'permit_site_plan',
      formData: { address: '1005 Rollins Ave', houseSquareFeet: 2400, storeys: 2 },
    },
    snapshot: { workflowId: 'wf_issue', definitionVersion: 1, stages: [] } as never,
    capabilities: caps as never,
    priorOutputs: {
      'siteplan.resolve_property': RESOLVED,
      'siteplan.render_exports': {
        documentId: 'doc_1', filename: 'plan.pdf', pageCount: 1, byteLength: 10,
        frameFailures: opts.frameFailures ?? [],
      },
      'siteplan.route_review': opts.review ?? routed('APPROVED'),
      ...(opts.issuance ? { 'siteplan.run_issuance_qc': opts.issuance } : {}),
    } as never,
  }
}

const issuanceQc = ISSUANCE_PROCESSORS['siteplan.run_issuance_qc']!
const buildSubmission = ISSUANCE_PROCESSORS['siteplan.build_submission']!

describe('siteplan.run_issuance_qc', () => {
  it('blocks without an approved professional review', async () => {
    const r = await issuanceQc(ctx('siteplan.run_issuance_qc', { review: routed('CHANGES_REQUESTED') }))
    expect(r.status).toBe('BLOCKED')
    expect(r.blockers?.[0]).toMatch(/approved professional review/)
  })

  it('an engineer approval alone does not make a GIS-drawn lot issuable', async () => {
    const r = await issuanceQc(ctx('siteplan.run_issuance_qc'))
    expect(r.status).toBe('COMPLETED')
    expect(r.enqueue).toEqual(['siteplan.build_submission'])
    const out = r.outputs as IssuanceQcOutput
    expect(out.issuable).toBe(false)
    // The surveyor never signed anything; the engine must not infer it.
    expect(out.review.blockingDisciplines).toContain('surveyor')
    expect(out.review.rows.find(x => x.discipline === 'professional_engineer')?.decision).toBe('APPROVED')
    expect(out.review.rows.find(x => x.discipline === 'surveyor')?.decision).toBe('PENDING')
    // And the certified survey is owed, not cleared by approval.
    expect(out.pendingSeal.some(f => f.code === 'MISSING_SURVEY_CERTIFICATION')).toBe(true)
    expect(out.summary).toMatch(/not yet ready to submit/)
  })

  it('reports an absent evidence ledger as absent, not as "nothing owed"', async () => {
    const withLedger = (await issuanceQc(ctx('siteplan.run_issuance_qc'))).outputs as IssuanceQcOutput
    const without = (await issuanceQc(ctx('siteplan.run_issuance_qc', { ledger: 'absent' }))).outputs as IssuanceQcOutput
    expect(withLedger.evidenceLedgerAvailable).toBe(true)
    expect(without.evidenceLedgerAvailable).toBe(false)
    expect(without.issuable).toBe(false)
  })

  it('a sheet whose frame did not render is a blocking defect', async () => {
    const r = await issuanceQc(ctx('siteplan.run_issuance_qc', {
      frameFailures: [{ sheet: 'C-100', missing: ['north arrow'] }],
    }))
    const out = r.outputs as IssuanceQcOutput
    expect(out.blocking.length).toBeGreaterThan(0)
    expect(out.issuable).toBe(false)
  })
})

describe('siteplan.build_submission', () => {
  it('assembles the package and lists every outstanding item when not issuable', async () => {
    const qc = (await issuanceQc(ctx('siteplan.run_issuance_qc'))).outputs as IssuanceQcOutput
    const r = await buildSubmission(ctx('siteplan.build_submission', { issuance: qc }))
    expect(r.status).toBe('COMPLETED')
    expect(r.enqueue).toEqual([])
    const out = r.outputs as SubmissionPackageOutput
    expect(out.deliveryState).toBe('SUBMISSION_INCOMPLETE')
    expect(out.submissionReady).toBe(false)
    expect(out.documentId).toBe('doc_1')
    expect(out.checklist.items.length).toBeGreaterThan(0)
    for (const item of out.checklist.items) expect(item.citation.length).toBeGreaterThan(5)
    expect(out.outstanding.length).toBeGreaterThan(0)
    expect(out.outstanding.some(o => o.code === 'REVIEW_SURVEYOR')).toBe(true)
    // Deduplicated: no code twice.
    expect(new Set(out.outstanding.map(o => o.code)).size).toBe(out.outstanding.length)
    expect(out.note).toMatch(/not labelled ready to submit/)
  })

  it('never implies jurisdiction approval, even when ready', async () => {
    const qc = (await issuanceQc(ctx('siteplan.run_issuance_qc'))).outputs as IssuanceQcOutput
    const ready: IssuanceQcOutput = {
      ...qc, issuable: true, blocking: [], unclearedEvaluations: [],
      review: { ...qc.review, submissionReady: true, blockingDisciplines: [] },
    }
    const r = await buildSubmission(ctx('siteplan.build_submission', { issuance: ready }))
    const out = r.outputs as SubmissionPackageOutput
    // The county checklist itself may still carry outstanding items (the
    // seal, the certified survey); readiness is not declared over them.
    if (out.submissionReady) {
      expect(out.deliveryState).toBe('SUBMISSION_READY')
      expect(out.note).toMatch(/jurisdiction approval is not implied/i)
    } else {
      expect(out.outstanding.every(o => o.code.startsWith('SP-') || o.code.startsWith('MISSING_'))).toBe(true)
    }
  })
})
