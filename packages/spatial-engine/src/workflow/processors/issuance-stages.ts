/**
 * The I_ISSUANCE_QC and J_SUBMISSION stage processors — `run_issuance_qc`
 * and `build_submission`.
 *
 * Same rule as every other group: thin adapters over functions that already
 * exist. `runIssuanceQc`, `applyEvidenceGate` and `buildCountyChecklist` were
 * written and tested in `review/` and had no caller in the workflow, so a
 * `permit_site_plan` order stopped dead after professional review.
 *
 * What these stages settle is whether the package may be LABELLED READY TO
 * SUBMIT. Three things are never confused here:
 *
 *   - Delivered.  Always true; the drawing exists and the customer has it.
 *   - Issuable.   No blocking QC finding, every required discipline signed off,
 *                 and each evidence-gated block cleared BY EVIDENCE — an
 *                 approval alone does not clear an absent certified survey.
 *   - Approved.   Only the County does that, and nothing here implies it.
 *
 * A package that is not issuable still COMPLETES: the submission stage
 * assembles what exists and lists what is outstanding, which is exactly what
 * the person coordinating the filing needs. Blocking is reserved for a run
 * that cannot honestly produce that list.
 */

import type { StageContext, StageResult, StageProcessor } from '../context'
import { requirePriorOutput } from '../context'
import type { SitePlanJobName } from '../definition'
import { lotPackageFrom, type RenderOutput } from './first-release'
import type { RouteReviewOutput } from './review-stages'
import { seedReviewItems, buildReviewMatrix, type ReviewItem, type Discipline } from '../../review/disciplines'
import { runIssuanceQc, type QcFinding, type ChecklistItem } from '../../review/checklist'
import { applyEvidenceGate, type EvidenceLedger, type ClearanceEvaluation } from '../../review/evidence'
import type { ScopedApproval, ContentSubject } from '../../review/content-scope'
import type { SheetId } from '../../sheets/sheet-template'

// ── Stage payloads ──────────────────────────────────────────────────────────

export interface IssuanceQcOutput {
  /** May the package be labelled ready to submit to the County. */
  issuable: boolean
  blocking: QcFinding[]
  warnings: QcFinding[]
  pendingSeal: QcFinding[]
  /** Evidence-gated blocks that cleared, with what cleared them. */
  clearedByEvidence: ClearanceEvaluation[]
  /** Evidence-gated blocks still open, with exactly what is missing. */
  unclearedEvaluations: ClearanceEvaluation[]
  review: {
    submissionReady: boolean
    blockingDisciplines: Discipline[]
    /** Per discipline: what the review application recorded, or PENDING. */
    rows: { discipline: Discipline; decision: string; outstanding: number }[]
  }
  /** Whether the host supplied an evidence ledger at all. */
  evidenceLedgerAvailable: boolean
  evidenceCount: number
  sheets: SheetId[]
  summary: string
}

export interface SubmissionPackageOutput {
  deliveryState: 'SUBMISSION_READY' | 'SUBMISSION_INCOMPLETE'
  submissionReady: boolean
  documentId: string
  pageCount: number
  jurisdiction: string
  agency: string
  checklist: {
    providedCount: number
    outstandingCount: number
    items: ChecklistItem[]
  }
  /** Everything a coordinator must resolve before filing, deduplicated. */
  outstanding: { code: string; requirement: string; responsible: string }[]
  blockingDisciplines: Discipline[]
  note: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * The review application decides SUBJECTS for one discipline; the review
 * matrix wants per-sheet ITEMS per discipline. Bridge them honestly: a
 * discipline whose every recorded subject is APPROVED has its items marked
 * APPROVED under that reviewer's name; a discipline the application never
 * recorded stays PENDING. Nothing is inferred for a surveyor from what an
 * engineer approved.
 */
function decideItems(items: ReviewItem[], routed: RouteReviewOutput): ReviewItem[] {
  const discipline = routed.reviewer?.discipline as Discipline | undefined
  if (!discipline || routed.reviewState !== 'APPROVED') return items
  const allApproved = routed.approvals.length > 0 && routed.approvals.every(a => a.decision === 'APPROVED')
  if (!allApproved) return items
  return items.map(i =>
    i.discipline === discipline
      ? {
          ...i, decision: 'APPROVED' as const,
          decidedAt: routed.reviewCompletedAt ?? undefined,
          decidedBy: routed.reviewer?.displayName,
          licenceNumber: routed.reviewer?.licenceNumber ?? undefined,
        }
      : i)
}

/** Prisma stores subjects upper-cased; the engine's ContentSubject is lower. */
function scopedApprovalsFrom(routed: RouteReviewOutput, sheets: SheetId[]): ScopedApproval[] {
  const discipline = (routed.reviewer?.discipline ?? 'professional_engineer') as Discipline
  return routed.approvals.map((a, i) => ({
    id: `approval-${i + 1}`,
    discipline,
    subject: a.subject.toLowerCase() as ContentSubject,
    appearsOn: sheets,
    objectIds: [],
    decision: a.decision as ScopedApproval['decision'],
    decidedAt: a.decidedAt ?? undefined,
    decidedBy: a.decidedByName ?? undefined,
    licenceNumber: routed.reviewer?.licenceNumber ?? undefined,
    comment: a.comment ?? undefined,
  }))
}

// ── siteplan.run_issuance_qc ────────────────────────────────────────────────

const runIssuanceQcStage: StageProcessor = async (ctx): Promise<StageResult> => {
  const routed = requirePriorOutput<RouteReviewOutput>(ctx, 'siteplan.route_review')
  const render = requirePriorOutput<RenderOutput>(ctx, 'siteplan.render_exports')

  if (routed.reviewState !== 'APPROVED') {
    return {
      status: 'BLOCKED', outputs: null,
      blockers: [
        `Issuance QC requires an approved professional review; the review is ${routed.reviewState}.`,
      ],
    }
  }

  const pkg = lotPackageFrom(ctx)
  const sheets = [...new Set(pkg.sheets.sheets.flatMap(s => s.covers))]

  const items = decideItems(seedReviewItems({ sheets, assumptions: [] }), routed)
  const matrix = buildReviewMatrix(items, sheets)

  const qc = runIssuanceQc({
    twin: pkg.twin,
    applicability: pkg.permitPath,
    checklist: pkg.checklist,
    reviewMatrix: matrix,
    sheetFrameFailures: render.frameFailures.length,
  })

  // An absent ledger is reported as absent. An empty one is a real answer:
  // the host keeps evidence and none has been attached.
  const ledger: EvidenceLedger | null = ctx.capabilities.loadEvidenceLedger
    ? await ctx.capabilities.loadEvidenceLedger(ctx.workflowId)
    : null

  const gated = applyEvidenceGate(qc, {
    twin: pkg.twin,
    ledger: ledger ?? { items: [] },
    imports: [],
    promotions: [],
    approvals: scopedApprovalsFrom(routed, sheets),
  })

  const output: IssuanceQcOutput = {
    issuable: gated.issuable && matrix.submissionReady,
    blocking: gated.blocking,
    warnings: gated.findings.filter(f => f.severity === 'warning'),
    pendingSeal: gated.pendingSeal,
    clearedByEvidence: gated.clearedByEvidence,
    unclearedEvaluations: gated.unclearedEvaluations,
    review: {
      submissionReady: matrix.submissionReady,
      blockingDisciplines: matrix.blockingDisciplines,
      rows: matrix.rows.map(r => ({ discipline: r.discipline, decision: r.decision, outstanding: r.outstanding })),
    },
    evidenceLedgerAvailable: ledger !== null,
    evidenceCount: ledger?.items.length ?? 0,
    sheets,
    summary:
      `${gated.blocking.length} blocking, ${gated.pendingSeal.length} pending seal, ` +
      `${gated.clearedByEvidence.length} cleared by evidence, ` +
      `${matrix.blockingDisciplines.length} discipline(s) not signed off. ` +
      (gated.issuable && matrix.submissionReady
        ? 'Package may be labelled ready to submit. Jurisdiction approval is separate and not implied.'
        : 'Package is not yet ready to submit.'),
  }

  return {
    status: 'COMPLETED', outputs: output, rulePackVersion: 'pg-2022.1',
    enqueue: ['siteplan.build_submission'],
  }
}

// ── siteplan.build_submission ───────────────────────────────────────────────

const buildSubmission: StageProcessor = async (ctx): Promise<StageResult> => {
  const qc = requirePriorOutput<IssuanceQcOutput>(ctx, 'siteplan.run_issuance_qc')
  const render = requirePriorOutput<RenderOutput>(ctx, 'siteplan.render_exports')
  const pkg = lotPackageFrom(ctx)
  const checklist = pkg.checklist

  // One list, in the order a coordinator works it: drawing defects first,
  // then checklist items the County will ask for, then evidence still owed.
  const outstanding: SubmissionPackageOutput['outstanding'] = []
  const seen = new Set<string>()
  const push = (code: string, requirement: string, responsible: string) => {
    if (seen.has(code)) return
    seen.add(code)
    outstanding.push({ code, requirement, responsible })
  }
  for (const b of qc.blocking) push(b.code, b.message, 'Kealee drafter')
  for (const item of checklist.items) {
    if (item.status === 'outstanding') push(item.code, item.requirement, item.responsible)
  }
  for (const e of qc.unclearedEvaluations) {
    push(e.code, e.outstanding.join(' | '), 'Licensed professional / applicant')
  }
  for (const d of qc.review.blockingDisciplines) {
    push(`REVIEW_${d.toUpperCase()}`, `${d.replace(/_/g, ' ')} sign-off not recorded.`, d)
  }

  const submissionReady = qc.issuable && outstanding.length === 0

  const output: SubmissionPackageOutput = {
    deliveryState: submissionReady ? 'SUBMISSION_READY' : 'SUBMISSION_INCOMPLETE',
    submissionReady,
    documentId: render.documentId,
    pageCount: render.pageCount,
    jurisdiction: checklist.jurisdiction,
    agency: checklist.agency,
    checklist: {
      providedCount: checklist.providedCount,
      outstandingCount: checklist.outstandingCount,
      items: checklist.items,
    },
    outstanding,
    blockingDisciplines: qc.review.blockingDisciplines,
    note: submissionReady
      ? 'Submission package assembled. Filing with the County is a separate act; jurisdiction approval is not implied.'
      : `Submission package assembled with ${outstanding.length} outstanding item(s). It is not labelled ready to submit.`,
  }

  return { status: 'COMPLETED', outputs: output, enqueue: [] }
}

// ── Registry ────────────────────────────────────────────────────────────────

export const ISSUANCE_PROCESSORS: Partial<Record<SitePlanJobName, StageProcessor>> = {
  'siteplan.run_issuance_qc': runIssuanceQcStage,
  'siteplan.build_submission': buildSubmission,
}
