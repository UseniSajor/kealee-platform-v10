/**
 * The H_PROFESSIONAL_REVIEW stage processors — `route_review` and
 * `apply_revisions`.
 *
 * These are the stages where a licensed human, not the engine, decides. The
 * decisions themselves are written by the review application
 * (apps/web-main/app/engineer/review) under the professional's own identity;
 * a processor here only READS them through `capabilities.loadReviewState`.
 * That is the whole design: a worker can route work to a professional and
 * report what they decided, and it can never record an approval itself.
 *
 * `route_review` therefore has two kinds of outcome. While the plan is
 * unclaimed or under review it ends AWAITING_REVIEW and is re-run when the
 * professional acts. Once the assignment is COMPLETED or REVISION_REQUIRED it
 * COMPLETES with the decision in its outputs, which is what the order bridge
 * and the issuance stages read.
 *
 * `apply_revisions` cannot apply free-text redlines — nothing here parses a
 * reviewer's comment into geometry — so it records them as a revision request
 * and ends AWAITING_REVIEW for a drafter. Fabricating a "revised" sheet from a
 * comment would be exactly the kind of invented output this engine refuses.
 */

import type { StageContext, StageResult, StageProcessor, ReviewState, ReviewSubjectDecision } from '../context'
import { requirePriorOutput } from '../context'
import type { SitePlanJobName } from '../definition'
import { buildResponsibilityBlock, type DividedResponsibilityBlock } from '../../review/content-scope'
import type { ContentSubject } from '../../review/content-scope'
import { lotPackageFrom, type ComposeOutput, type RenderOutput } from './first-release'

// ── Stage payloads ──────────────────────────────────────────────────────────

export type ReviewRoutingState = 'UNCLAIMED' | 'IN_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED'

export interface Redline {
  subject: string
  comment: string
  decision: 'CHANGES_REQUESTED' | 'REJECTED'
  decidedByName: string | null
  decidedAt: string | null
}

export interface RouteReviewOutput {
  reviewState: ReviewRoutingState
  /** The drawing the professional was asked to review. */
  documentId: string
  /** Title-block responsibility division, one per composed page. Empty when the twin could not be rebuilt. */
  responsibility: DividedResponsibilityBlock[]
  reviewer: {
    displayName: string
    licenceNumber: string | null
    licenceState: string | null
    discipline: string
  } | null
  approvals: ReviewSubjectDecision[]
  /** Subjects not yet APPROVED. Empty once the review is complete. */
  outstanding: string[]
  redlines: Redline[]
  reviewCompletedAt: string | null
  note: string
}

export interface ApplyRevisionsOutput {
  revisionState: 'AWAITING_DRAFTER'
  documentId: string
  redlines: Redline[]
  /** The sheet revision a drafter's re-render must carry. */
  nextSheetRevision: number
  note: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Subjects the review application seeds on every plan, in engine casing. */
const BASE_SUBJECTS: ContentSubject[] = ['zoning_compliance', 'site_layout']

function responsibilityFor(ctx: StageContext, compose: ComposeOutput): DividedResponsibilityBlock[] {
  try {
    const pkg = lotPackageFrom(ctx)
    return compose.pages.map(p => buildResponsibilityBlock({
      sheet: p.primary, features: pkg.twin.features, additionalSubjects: BASE_SUBJECTS,
    }))
  } catch (e) {
    // A block that cannot be built is reported absent, not invented.
    ctx.capabilities.trace({
      workflowId: ctx.workflowId, job: ctx.job, phase: 'skip',
      detail: `responsibility block unavailable: ${e instanceof Error ? e.message : String(e)}`,
    })
    return []
  }
}

function redlinesFrom(approvals: ReviewSubjectDecision[]): Redline[] {
  return approvals.flatMap(a =>
    a.decision === 'CHANGES_REQUESTED' || a.decision === 'REJECTED'
      ? [{
          subject: a.subject, comment: a.comment ?? '', decision: a.decision,
          decidedByName: a.decidedByName, decidedAt: a.decidedAt,
        }]
      : [])
}

function reviewerFrom(state: ReviewState): RouteReviewOutput['reviewer'] {
  const a = state.assignment
  if (!a?.professional) return null
  return { ...a.professional, discipline: a.discipline }
}

// ── siteplan.route_review ───────────────────────────────────────────────────

const routeReview: StageProcessor = async (ctx): Promise<StageResult> => {
  const render = requirePriorOutput<RenderOutput>(ctx, 'siteplan.render_exports')
  const compose = requirePriorOutput<ComposeOutput>(ctx, 'siteplan.compose_sheets')

  if (!ctx.capabilities.loadReviewState) {
    return {
      status: 'BLOCKED',
      outputs: null,
      blockers: [
        'This host provides no professional-review store (capabilities.loadReviewState), ' +
        'so the plan cannot be routed for review here.',
      ],
    }
  }

  const state = await ctx.capabilities.loadReviewState(ctx.workflowId)
  const responsibility = responsibilityFor(ctx, compose)
  const approvals = state?.approvals ?? []
  const outstanding = approvals.filter(a => a.decision !== 'APPROVED').map(a => a.subject)

  const base = {
    documentId: render.documentId,
    responsibility,
    reviewer: state ? reviewerFrom(state) : null,
    approvals,
    outstanding,
    redlines: redlinesFrom(approvals),
  }

  const assignment = state?.assignment ?? null

  // Nobody has claimed it. The review queue lists it; the stage waits.
  if (!assignment) {
    return {
      status: 'AWAITING_REVIEW',
      outputs: {
        ...base, reviewState: 'UNCLAIMED', reviewCompletedAt: null,
        note: 'Awaiting a licensed professional to claim the review.',
      } satisfies RouteReviewOutput,
    }
  }

  if (assignment.status === 'COMPLETED') {
    return {
      status: 'COMPLETED',
      outputs: {
        ...base, reviewState: 'APPROVED', reviewCompletedAt: assignment.completedAt,
        note: 'Scoped professional review complete. Sealing remains a separate act.',
      } satisfies RouteReviewOutput,
      // Issuance QC reads this approval and the evidence ledger next.
      enqueue: ['siteplan.run_issuance_qc'],
    }
  }

  if (assignment.status === 'REVISION_REQUIRED') {
    return {
      status: 'COMPLETED',
      outputs: {
        ...base, reviewState: 'CHANGES_REQUESTED', reviewCompletedAt: null,
        note: 'The reviewer withheld approval on at least one subject. Redlines are listed.',
      } satisfies RouteReviewOutput,
      enqueue: ['siteplan.apply_revisions'],
    }
  }

  // ACTIVE, or any status this engine does not know: still with the professional.
  return {
    status: 'AWAITING_REVIEW',
    outputs: {
      ...base, reviewState: 'IN_REVIEW', reviewCompletedAt: null,
      note: `Under review (${assignment.status}); ${outstanding.length} subject(s) outstanding.`,
    } satisfies RouteReviewOutput,
  }
}

// ── siteplan.apply_revisions ────────────────────────────────────────────────

const applyRevisions: StageProcessor = async (ctx): Promise<StageResult> => {
  const routed = requirePriorOutput<RouteReviewOutput>(ctx, 'siteplan.route_review')
  const render = requirePriorOutput<RenderOutput>(ctx, 'siteplan.render_exports')

  if (routed.reviewState !== 'CHANGES_REQUESTED') {
    return {
      status: 'BLOCKED',
      outputs: null,
      blockers: [`apply_revisions ran on a review in state ${routed.reviewState}; nothing to revise.`],
    }
  }

  const output: ApplyRevisionsOutput = {
    revisionState: 'AWAITING_DRAFTER',
    documentId: render.documentId,
    redlines: routed.redlines,
    nextSheetRevision: ctx.attempt,
    note:
      'The engine does not apply free-text redlines. A drafter revises the sheet set, re-renders, ' +
      'and the plan is re-routed for review.',
  }

  return { status: 'AWAITING_REVIEW', outputs: output, enqueue: [] }
}

// ── Registry ────────────────────────────────────────────────────────────────

export const REVIEW_PROCESSORS: Partial<Record<SitePlanJobName, StageProcessor>> = {
  'siteplan.route_review': routeReview,
  'siteplan.apply_revisions': applyRevisions,
}
