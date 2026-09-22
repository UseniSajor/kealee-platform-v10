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

import type { StageContext, StageResult, StageProcessor, ReviewState, ReviewAssignmentState, ReviewSubjectDecision } from '../context'
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

export interface ReviewerSummary {
  displayName: string
  licenceNumber: string | null
  licenceState: string | null
  discipline: string
}

export interface DisciplineReviewState {
  discipline: string
  /** UNCLAIMED — no assignment yet; IN_REVIEW — claimed, deciding; APPROVED; CHANGES_REQUESTED. */
  state: ReviewRoutingState
  reviewer: ReviewerSummary | null
  outstanding: string[]
  completedAt: string | null
}

export interface RouteReviewOutput {
  reviewState: ReviewRoutingState
  /** The drawing the professional was asked to review. */
  documentId: string
  /** The drawing revision under review (0 = the first issue). */
  sheetRevision: number
  /** Title-block responsibility division, one per composed page. Empty when the twin could not be rebuilt. */
  responsibility: DividedResponsibilityBlock[]
  /** The first (engineer's) reviewer — kept for readers that know one reviewer per plan. */
  reviewer: ReviewerSummary | null
  /** Every discipline the product requires, with where each stands. */
  disciplines: DisciplineReviewState[]
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
  /** The stage the drafter re-enqueues once the inputs are revised. */
  resumeFrom: SitePlanJobName
  note: string
}

/** Where a revision restarts. Composition is the first stage a drafter's input change reaches. */
export const REVISION_RESUME_JOB: SitePlanJobName = 'siteplan.compose_sheets'

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

function reviewerOf(a: ReviewAssignmentState | null): ReviewerSummary | null {
  if (!a?.professional) return null
  return { ...a.professional, discipline: a.discipline }
}

/** The engineer is always required; the host adds the architect (and others) per product. */
const DEFAULT_REQUIRED = ['professional_engineer']

/**
 * Where each required discipline stands. A discipline with no assignment is
 * UNCLAIMED; one whose assignment is REVISION_REQUIRED (or with a withheld
 * subject) is CHANGES_REQUESTED; COMPLETED is APPROVED; anything else is
 * IN_REVIEW. Subjects are attributed to a discipline by their `discipline`
 * field, or — on a host predating it — all to the engineer.
 */
function disciplineStates(state: ReviewState | null): DisciplineReviewState[] {
  const required = state?.requiredDisciplines?.length ? state.requiredDisciplines : DEFAULT_REQUIRED
  const assignments = state?.assignments ?? (state?.assignment ? [state.assignment] : [])
  const approvals = state?.approvals ?? []
  return required.map(discipline => {
    const a = assignments.find(x => x.discipline === discipline) ?? null
    const mine = approvals.filter(ap => (ap.discipline ?? 'professional_engineer') === discipline)
    const outstanding = mine.filter(ap => ap.decision !== 'APPROVED').map(ap => ap.subject)
    const withheld = mine.some(ap => ap.decision === 'CHANGES_REQUESTED' || ap.decision === 'REJECTED')
    const st: ReviewRoutingState = !a ? 'UNCLAIMED'
      : a.status === 'REVISION_REQUIRED' || withheld ? 'CHANGES_REQUESTED'
      : a.status === 'COMPLETED' ? 'APPROVED'
      : 'IN_REVIEW'
    return { discipline, state: st, reviewer: reviewerOf(a), outstanding, completedAt: a?.completedAt ?? null }
  })
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
  const disciplines = disciplineStates(state)
  const primary = state?.assignments?.find(a => a.discipline === 'professional_engineer') ?? state?.assignment ?? null

  const base = {
    documentId: render.documentId,
    sheetRevision: state?.sheetRevision ?? 0,
    responsibility,
    reviewer: reviewerOf(primary),
    disciplines,
    approvals,
    outstanding,
    redlines: redlinesFrom(approvals),
  }
  const who = (st: ReviewRoutingState) => disciplines.filter(d => d.state === st).map(d => d.discipline)

  // Any required discipline withholding approval decides the plan: it goes
  // back to a drafter now, whatever the other reviewers are doing.
  if (who('CHANGES_REQUESTED').length) {
    return {
      status: 'COMPLETED',
      outputs: {
        ...base, reviewState: 'CHANGES_REQUESTED', reviewCompletedAt: null,
        note: `${who('CHANGES_REQUESTED').join(', ')} withheld approval on at least one subject. Redlines are listed.`,
      } satisfies RouteReviewOutput,
      enqueue: ['siteplan.apply_revisions'],
    }
  }

  // Every required discipline has completed: the review is approved.
  if (disciplines.length && disciplines.every(d => d.state === 'APPROVED')) {
    const completedAt = disciplines.map(d => d.completedAt).filter((v): v is string => Boolean(v)).sort().pop() ?? null
    return {
      status: 'COMPLETED',
      outputs: {
        ...base, reviewState: 'APPROVED', reviewCompletedAt: completedAt,
        note: `Scoped professional review complete (${disciplines.map(d => d.discipline).join(', ')}). Sealing remains a separate act.`,
      } satisfies RouteReviewOutput,
      // Issuance runs off the delivered preliminary, not off this approval.
      // Staff re-run run_issuance_qc if the matrix should reflect it.
      enqueue: [],
    }
  }

  // Nobody has claimed any of it. The review queues list it; the stage waits.
  if (disciplines.every(d => d.state === 'UNCLAIMED')) {
    return {
      status: 'AWAITING_REVIEW',
      outputs: {
        ...base, reviewState: 'UNCLAIMED', reviewCompletedAt: null,
        note: `Awaiting ${disciplines.map(d => d.discipline).join(' and ')} to claim the review.`,
      } satisfies RouteReviewOutput,
    }
  }

  // Claimed by some, still with the professionals.
  return {
    status: 'AWAITING_REVIEW',
    outputs: {
      ...base, reviewState: 'IN_REVIEW', reviewCompletedAt: null,
      note: `Under review: ${disciplines.map(d => `${d.discipline} ${d.state}`).join(', ')}; ${outstanding.length} subject(s) outstanding.`,
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
    nextSheetRevision: (routed.sheetRevision ?? 0) + 1,
    resumeFrom: REVISION_RESUME_JOB,
    note:
      'The engine does not apply free-text redlines. A drafter answers each redline and revises the ' +
      `inputs on the staff desk (submit revision), which re-enqueues ${REVISION_RESUME_JOB}; the plan ` +
      'renders at the next sheet revision, the customer record is refreshed, and it is re-routed to ' +
      'every reviewer, whose withheld subjects are reset to PENDING on the new revision.',
  }

  // Reopen from composition so the re-render, QC, delivery and review all
  // run again once the drafter has changed the inputs. Not enqueued here:
  // the same inputs would draw the same sheet.
  return { status: 'AWAITING_REVIEW', outputs: output, enqueue: [], reopen: [REVISION_RESUME_JOB] }
}

// ── Registry ────────────────────────────────────────────────────────────────

export const REVIEW_PROCESSORS: Partial<Record<SitePlanJobName, StageProcessor>> = {
  'siteplan.route_review': routeReview,
  'siteplan.apply_revisions': applyRevisions,
}
