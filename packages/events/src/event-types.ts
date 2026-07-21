/**
 * Kealee Event Types — organized by domain.
 * See: _docs/kealee-architecture.md §4 "Event Types by Domain"
 *
 * Each event type has exactly ONE claw publisher (see guardrails.ts).
 */

export const EVENT_TYPES = {
  // ── Claw A: Acquisition & PreCon ────────────────────────────
  estimate: {
    created: 'estimate.created',
    updated: 'estimate.updated',
    approved: 'estimate.approved',
  },
  ctc: {
    imported: 'ctc.imported',
    takeoff: {
      completed: 'ctc.takeoff.completed',
      confirmed: 'ctc.takeoff.confirmed',
    },
  },
  bid: {
    request: { created: 'bid.request.created' },
    submissions: { scored: 'bid.submissions.scored' },
    contractor: { recommended: 'bid.contractor.recommended' },
  },
  project: {
    precon: { completed: 'project.precon.completed' },
    created: 'project.created',
    phase: { changed: 'project.phase.changed' },
  },

  // ── Claw B: Contract & Commercials ──────────────────────────
  contract: {
    draft: { created: 'contract.draft.created' },
    executed: 'contract.executed',
  },
  changeorder: {
    created: 'changeorder.created',
    submitted: 'changeorder.submitted',
    approved: 'changeorder.approved',
    rejected: 'changeorder.rejected',
  },
  payment: {
    request: { created: 'payment.request.created' },
    disbursed: 'payment.disbursed',
  },

  // ── Claw C: Schedule & Field Ops ────────────────────────────
  schedule: {
    created: 'schedule.created',
    updated: 'schedule.updated',
    criticalpath: { changed: 'schedule.criticalpath.changed' },
  },
  sitevisit: {
    scheduled: 'sitevisit.scheduled',
    completed: 'sitevisit.completed',
  },

  // ── Claw D: Budget & Cost Control ───────────────────────────
  budget: {
    seeded: { from: { estimate: 'budget.seeded.from.estimate' } },
    updated: 'budget.updated',
    alert: { variance: { high: 'budget.alert.variance.high' } },
  },

  // ── Claw E: Permits & Compliance ────────────────────────────
  permit: {
    created: 'permit.created',
    status: { changed: 'permit.status.changed' },
    approved: 'permit.approved',
    expiring: 'permit.expiring',
  },
  inspection: {
    required: { compliance: 'inspection.required.compliance' },
    failed: { compliance: 'inspection.failed.compliance' },
    scheduled: 'inspection.scheduled',
    passed: 'inspection.passed',
    failed_result: 'inspection.failed',
  },
  compliance: {
    alert: { high: 'compliance.alert.high' },
  },

  // ── Claw F: Documents & Communication ───────────────────────
  document: {
    generated: 'document.generated',
    signed: 'document.signed',
  },
  communication: {
    sent: 'communication.sent',
    failed: 'communication.failed',
  },

  // ── Claw G: Risk, Prediction & Decisions ────────────────────
  prediction: {
    created: 'prediction.created',
    costoverrun: { created: 'prediction.costoverrun.created' },
  },
  risk: {
    assessment: {
      created: 'risk.assessment.created',
      updated: 'risk.assessment.updated',
    },
  },
  decision: {
    recommended: 'decision.recommended',
    accepted: 'decision.accepted',
    rejected: 'decision.rejected',
  },

  // ── Claw H: Command Center & Automation ─────────────────────
  task: {
    created: 'task.created',
    completed: 'task.completed',
    failed: 'task.failed',
  },
  system: {
    alert: 'system.alert',
    metric: { updated: 'system.metric.updated' },
  },
} as const;
