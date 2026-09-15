/**
 * The H_PROFESSIONAL_REVIEW stages, now that they have processors.
 *
 * What matters here is not routing arithmetic but the boundary: a processor
 * may READ what a licensed human decided and must never produce a decision of
 * its own. So: no review store → BLOCKED, not approved. Unclaimed or active →
 * AWAITING_REVIEW, not completed. Only the assignment's own status moves the
 * stage on, and a withheld approval routes to `apply_revisions`, which in turn
 * refuses to invent a revised sheet.
 */

import { REVIEW_PROCESSORS } from '../workflow/processors/review-stages'
import type { RouteReviewOutput, ApplyRevisionsOutput } from '../workflow/processors/review-stages'
import { unconnectedStages } from '../workflow/processors/index'
import type { ResolvePropertyOutput } from '../workflow/processors/first-release'
import type { StageContext, ReviewState } from '../workflow/context'

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

const PE = { displayName: 'A. Engineer', licenceNumber: 'MD-12345', licenceState: 'MD' }

function approvals(decisions: Array<ReviewState['approvals'][number]['decision']>): ReviewState['approvals'] {
  const subjects = ['ZONING_COMPLIANCE', 'SITE_LAYOUT']
  return decisions.map((decision, i) => ({
    subject: subjects[i] ?? `SUBJECT_${i}`, decision,
    comment: decision === 'APPROVED' ? null : 'Front BRL scales at 24 ft, not 25 ft.',
    decidedByName: decision === 'PENDING' ? null : PE.displayName,
    licenceNumber: PE.licenceNumber, licenceState: PE.licenceState,
    decidedAt: decision === 'PENDING' ? null : '2026-09-16T10:00:00Z',
  }))
}

function reviewState(
  status: string | null, decisions: Array<ReviewState['approvals'][number]['decision']>,
): ReviewState {
  return {
    assignment: status === null ? null : {
      status, discipline: 'professional_engineer',
      acceptedAt: '2026-09-15T13:00:00Z',
      completedAt: status === 'COMPLETED' ? '2026-09-16T11:00:00Z' : null,
      notes: null, professional: PE,
    },
    approvals: approvals(decisions),
  }
}

function ctx(job: string, opts: {
  review?: ReviewState | null | 'absent'
  routed?: Partial<RouteReviewOutput>
  attempt?: number
} = {}): StageContext {
  const caps: Record<string, unknown> = {
    fetchImpl: (async () => ({ ok: true, json: async () => ({}) })) as never,
    async persist() {}, async storeArtifact() { return { documentId: 'doc_1' } },
    trace() {}, now: () => new Date('2026-09-16T12:00:00Z'),
  }
  if (opts.review !== 'absent') {
    caps.loadReviewState = async () => opts.review ?? null
  }
  return {
    workflowId: 'wf_review', job: job as never, attempt: opts.attempt ?? 1,
    subject: {
      organizationId: 'org_1', projectId: 'proj_1', orderId: 'ord_1',
      productId: 'verified_site_feasibility',
      formData: { address: '1005 Rollins Ave', houseSquareFeet: 2400, storeys: 2 },
    },
    snapshot: { workflowId: 'wf_review', definitionVersion: 1, stages: [] } as never,
    capabilities: caps as never,
    priorOutputs: {
      'siteplan.resolve_property': RESOLVED,
      'siteplan.compose_sheets': { pages: [{ primary: 'C-100', covers: ['C-100', 'C-200'] }], rationale: 'infill' },
      'siteplan.render_exports': { documentId: 'doc_1', filename: 'plan.pdf', pageCount: 1, byteLength: 10, frameFailures: [] },
      ...(opts.routed ? { 'siteplan.route_review': opts.routed } : {}),
    } as never,
  }
}

const routeReview = REVIEW_PROCESSORS['siteplan.route_review']!
const applyRevisions = REVIEW_PROCESSORS['siteplan.apply_revisions']!

describe('the review group is connected', () => {
  it('has a processor for route_review and apply_revisions, and not for the I/J groups', () => {
    expect(typeof routeReview).toBe('function')
    expect(typeof applyRevisions).toBe('function')
    const missing = unconnectedStages()
    expect(missing).not.toContain('siteplan.route_review')
    expect(missing).not.toContain('siteplan.apply_revisions')
    expect(missing).toEqual(expect.arrayContaining([
      'siteplan.run_issuance_qc', 'siteplan.build_submission', 'siteplan.ingest_comments',
    ]))
  })
})

describe('siteplan.route_review', () => {
  it('BLOCKS rather than approving when the host has no review store', async () => {
    const r = await routeReview(ctx('siteplan.route_review', { review: 'absent' }))
    expect(r.status).toBe('BLOCKED')
    expect(r.blockers?.[0]).toMatch(/loadReviewState/)
  })

  it('waits while nobody has claimed the plan', async () => {
    const r = await routeReview(ctx('siteplan.route_review', { review: null }))
    expect(r.status).toBe('AWAITING_REVIEW')
    const out = r.outputs as RouteReviewOutput
    expect(out.reviewState).toBe('UNCLAIMED')
    expect(out.reviewer).toBeNull()
    expect(out.documentId).toBe('doc_1')
  })

  it('builds the title-block responsibility division from the drawn features', async () => {
    const r = await routeReview(ctx('siteplan.route_review', { review: null }))
    const out = r.outputs as RouteReviewOutput
    expect(out.responsibility).toHaveLength(1)
    expect(out.responsibility[0].sheet).toBe('C-100')
    const certified = out.responsibility[0].rows.flatMap(row => row.certifies)
    expect(certified).toEqual(expect.arrayContaining(['zoning_compliance', 'site_layout']))
  })

  it('waits while the professional is still deciding', async () => {
    const r = await routeReview(ctx('siteplan.route_review', {
      review: reviewState('ACTIVE', ['APPROVED', 'PENDING']),
    }))
    expect(r.status).toBe('AWAITING_REVIEW')
    const out = r.outputs as RouteReviewOutput
    expect(out.reviewState).toBe('IN_REVIEW')
    expect(out.outstanding).toEqual(['SITE_LAYOUT'])
    expect(out.reviewer).toMatchObject({ displayName: 'A. Engineer', licenceNumber: 'MD-12345' })
  })

  it('does not complete on approvals alone — the assignment must be COMPLETED', async () => {
    // Every subject approved but the engineer has not pressed "complete".
    const r = await routeReview(ctx('siteplan.route_review', {
      review: reviewState('ACTIVE', ['APPROVED', 'APPROVED']),
    }))
    expect(r.status).toBe('AWAITING_REVIEW')
  })

  it('completes with the sign-off once the assignment is COMPLETED', async () => {
    const r = await routeReview(ctx('siteplan.route_review', {
      review: reviewState('COMPLETED', ['APPROVED', 'APPROVED']),
    }))
    expect(r.status).toBe('COMPLETED')
    expect(r.enqueue).toEqual([])
    const out = r.outputs as RouteReviewOutput
    expect(out.reviewState).toBe('APPROVED')
    expect(out.outstanding).toEqual([])
    expect(out.redlines).toEqual([])
    expect(out.reviewCompletedAt).toBe('2026-09-16T11:00:00Z')
    expect(out.note).toMatch(/Sealing remains a separate act/)
  })

  it('routes withheld approval to apply_revisions with the redlines', async () => {
    const r = await routeReview(ctx('siteplan.route_review', {
      review: reviewState('REVISION_REQUIRED', ['APPROVED', 'CHANGES_REQUESTED']),
    }))
    expect(r.status).toBe('COMPLETED')
    expect(r.enqueue).toEqual(['siteplan.apply_revisions'])
    const out = r.outputs as RouteReviewOutput
    expect(out.reviewState).toBe('CHANGES_REQUESTED')
    expect(out.redlines).toEqual([{
      subject: 'SITE_LAYOUT', decision: 'CHANGES_REQUESTED',
      comment: 'Front BRL scales at 24 ft, not 25 ft.',
      decidedByName: 'A. Engineer', decidedAt: '2026-09-16T10:00:00Z',
    }])
  })
})

describe('siteplan.apply_revisions', () => {
  it('records the redlines for a drafter and does not invent a revised sheet', async () => {
    const routed: Partial<RouteReviewOutput> = {
      reviewState: 'CHANGES_REQUESTED',
      redlines: [{
        subject: 'SITE_LAYOUT', decision: 'CHANGES_REQUESTED', comment: 'Move the footprint.',
        decidedByName: 'A. Engineer', decidedAt: '2026-09-16T10:00:00Z',
      }],
    }
    const r = await applyRevisions(ctx('siteplan.apply_revisions', { routed, attempt: 2 }))
    expect(r.status).toBe('AWAITING_REVIEW')
    expect(r.artifacts ?? []).toEqual([])
    const out = r.outputs as ApplyRevisionsOutput
    expect(out.revisionState).toBe('AWAITING_DRAFTER')
    expect(out.redlines).toHaveLength(1)
    expect(out.nextSheetRevision).toBe(2)
    expect(out.note).toMatch(/does not apply free-text redlines/)
  })

  it('blocks when there is nothing to revise', async () => {
    const r = await applyRevisions(ctx('siteplan.apply_revisions', {
      routed: { reviewState: 'APPROVED', redlines: [] },
    }))
    expect(r.status).toBe('BLOCKED')
  })
})
