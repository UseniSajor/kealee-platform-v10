/**
 * services/command-center/bots/permit/permit-compliance.bot.ts
 *
 * PermitComplianceBot — Autonomous permit & inspection monitoring bot.
 * Category: COMPLIANCE_VERIFICATION
 *
 * GUARDRAILS (CRITICAL — enforced via requiresHumanApproval + autoExecute: false):
 *   ❌ NEVER auto-files permits without explicit user trigger
 *   ❌ Cannot modify financial records, budgets, or payment state
 *   ❌ Cannot alter schedules or contract terms
 *   ❌ Cannot override CLAW E inspection pass/fail authority
 *
 * Subscribed events (published by CLAW E — permits-compliance-claw):
 *   permit.status.changed  → notify applicant, queue portal re-check
 *   permit.expiring        → escalating alerts at 30d / 7d threshold
 *   permit.approved        → notify + queue inspection sequence setup
 *   inspection.failed      → notify contractor, recommend reinspection (SUPERVISED)
 *   inspection.passed      → update dashboard + email confirmation
 *   compliance.alert.high  → CRITICAL ops alert for AI-detected safety issues
 *   project.phase.changed  → surface new phase permit requirements (CLAW E executes)
 *
 * Scheduled (daily 06:30 UTC via runScheduled()):
 *   1. Permits expiring within 30 days → EMAIL_SEQUENCE (+ INTERNAL_ALERT if ≤ 7 days)
 *   2. Inspections not scheduled ≥ 3 days after request → QUEUE_JOB + INTERNAL_ALERT
 *   3. Permits stuck UNDER_REVIEW > 15 days → INTERNAL_ALERT + recommend portal check
 *   4. Permits stuck CORRECTIONS_REQUIRED > 14 days → EMAIL_SEQUENCE to applicant
 *   5. Dashboard health metric snapshot
 *
 * Architecture reference: kealee-architecture.md §10 (Claw E) + §3 (8-Claw System)
 */

import { createLogger } from '@kealee/observability'
import { getPrisma } from '@kealee/database'
import {
  OperationalBot,
  BotCategory,
  BotEvent,
  BotResult,
  BotAction,
} from '../shared/bot.interface.js'

const logger = createLogger('permit-compliance-bot')

// ── Monitoring thresholds ──────────────────────────────────────────────────────

const EXPIRY_WARNING_DAYS    = 30  // emit EMAIL when permit expiry within 30 days
const EXPIRY_CRITICAL_DAYS   =  7  // add INTERNAL_ALERT when within 7 days
const INSPECTION_STALE_DAYS  =  3  // flag inspection not scheduled after 3 days
const REVIEW_STALE_DAYS      = 15  // permit stuck in review threshold (business days approx)
const CORRECTION_STALE_DAYS  = 14  // permit stuck in CORRECTIONS_REQUIRED threshold

// Permit statuses that indicate active review (portal should be polled)
const ACTIVE_REVIEW_STATUSES = [
  'SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED', 'IN_REVIEW', 'PLAN_REVIEW',
] as const

// Permit statuses awaiting applicant action
const CORRECTION_STATUSES = [
  'CORRECTIONS_REQUIRED', 'CORRECTIONS_NEEDED',
] as const

// ── Bot ───────────────────────────────────────────────────────────────────────

export class PermitComplianceBot extends OperationalBot {
  readonly id          = 'permit-bot'
  readonly name        = 'PermitComplianceBot'
  readonly category: BotCategory = 'COMPLIANCE_VERIFICATION'
  readonly description =
    'Autonomous permit & inspection monitor — tracks expiry, stale reviews, missed inspections. ' +
    'Never auto-files permits. All submission actions require human approval.'

  readonly subscribedEvents = [
    'permit.status.changed',
    'permit.expiring',
    'permit.approved',
    'inspection.failed',
    'inspection.passed',
    'compliance.alert.high',
    'project.phase.changed',
  ]

  /** Filing and correction submission always require explicit human trigger */
  readonly requiresHumanApproval = true

  /** All analysis is async / queued — never blocks the event bus */
  readonly synchronous = false

  /** Outputs user-facing email notifications */
  readonly internalOnly = false

  // ── Main event router ──────────────────────────────────────────────────────

  async handle(event: BotEvent): Promise<BotResult> {
    const start = Date.now()
    logger.info({ botId: this.id, eventType: event.type }, 'PermitComplianceBot handling event')

    try {
      switch (event.type) {
        case 'permit.status.changed':
          return this._handleStatusChanged(event, start)
        case 'permit.expiring':
          return this._handleExpiring(event, start)
        case 'permit.approved':
          return this._handleApproved(event, start)
        case 'inspection.failed':
          return this._handleInspectionFailed(event, start)
        case 'inspection.passed':
          return this._handleInspectionPassed(event, start)
        case 'compliance.alert.high':
          return this._handleComplianceAlert(event, start)
        case 'project.phase.changed':
          return this._handlePhaseChanged(event, start)
        default:
          return this.makeResult(event.type, [], [], start)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error({ botId: this.id, err: msg }, 'PermitComplianceBot event handling error')
      return {
        botId: this.id,
        eventType: event.type,
        actionsTriggered: [],
        recommendationsEmitted: [],
        processingMs: Date.now() - start,
        error: msg,
      }
    }
  }

  // ── Daily scheduled scan (06:30 UTC) ──────────────────────────────────────

  async runScheduled(): Promise<BotResult> {
    const start = Date.now()
    logger.info('PermitComplianceBot daily scan starting')

    const actionsTriggered: BotAction[]     = []
    const recommendations:  BotAction[]     = []

    try {
      const prisma = getPrisma()
      const now    = new Date()

      // ── 1. Expiring permits (within EXPIRY_WARNING_DAYS) ──────────────────
      const expiryThreshold = new Date(now.getTime() + EXPIRY_WARNING_DAYS * 86_400_000)

      const expiringPermits = await prisma.permit.findMany({
        where: {
          status:    { in: ['APPROVED', 'ISSUED'] as any },
          expiresAt: { lte: expiryThreshold, gt: now },
        },
        select: {
          id: true, permitType: true, expiresAt: true,
          projectId: true, applicantEmail: true, status: true,
        },
      })

      for (const permit of expiringPermits) {
        const daysRemaining = Math.ceil(
          ((permit.expiresAt as Date).getTime() - now.getTime()) / 86_400_000,
        )
        const isCritical = daysRemaining <= EXPIRY_CRITICAL_DAYS

        actionsTriggered.push(
          this.makeAction(
            'EMAIL_SEQUENCE',
            {
              templateId:     isCritical ? 'permit_expiry_critical' : 'permit_expiry_warning',
              permitId:       permit.id,
              projectId:      permit.projectId,
              daysRemaining,
              permitType:     permit.permitType,
              to:             permit.applicantEmail,
            },
            { requiresApproval: false, autoExecute: true },
          ),
        )

        if (isCritical) {
          actionsTriggered.push(
            this.makeAction(
              'INTERNAL_ALERT',
              {
                message:      `CRITICAL: Permit ${permit.id} (${permit.permitType}) expires in ${daysRemaining} day(s) — renewal required`,
                permitId:     permit.id,
                projectId:    permit.projectId,
                daysRemaining,
                severity:     'CRITICAL',
              },
              { requiresApproval: false, autoExecute: true },
            ),
          )
        }
      }

      // ── 2. Stale inspection requests (unscheduled ≥ INSPECTION_STALE_DAYS) ──
      const inspectionStaleThreshold = new Date(now.getTime() - INSPECTION_STALE_DAYS * 86_400_000)

      const staleInspections = await prisma.inspection.findMany({
        where: {
          scheduledDate: null,
          completedAt:   null,
          result:        null,
          requestedDate: { lte: inspectionStaleThreshold },
        },
        select: {
          id: true, projectId: true, permitId: true,
          inspectionType: true, requestedDate: true,
        },
      })

      for (const inspection of staleInspections) {
        const staleDays = Math.floor(
          (now.getTime() - new Date(inspection.requestedDate).getTime()) / 86_400_000,
        )

        actionsTriggered.push(
          this.makeAction(
            'QUEUE_JOB',
            {
              queue:          'kealee-inspection-coordinator',
              job:            'schedule-inspection',
              inspectionId:   inspection.id,
              projectId:      inspection.projectId,
              permitId:       inspection.permitId,
              inspectionType: inspection.inspectionType,
              staleDays,
              priority:       staleDays > 7 ? 'HIGH' : 'MEDIUM',
            },
            { requiresApproval: false, autoExecute: true },
          ),
        )

        actionsTriggered.push(
          this.makeAction(
            'INTERNAL_ALERT',
            {
              message:        `Inspection ${inspection.id} (${inspection.inspectionType}) unscheduled for ${staleDays} day(s)`,
              inspectionId:   inspection.id,
              projectId:      inspection.projectId,
              permitId:       inspection.permitId,
              staleDays,
              severity:       staleDays > 7 ? 'HIGH' : 'MEDIUM',
            },
            { requiresApproval: false, autoExecute: true },
          ),
        )
      }

      // ── 3. Permits stuck in active review > REVIEW_STALE_DAYS ─────────────
      const reviewStaleDate = new Date(now.getTime() - REVIEW_STALE_DAYS * 86_400_000)

      const staleReviewPermits = await prisma.permit.findMany({
        where: {
          status:         { in: ACTIVE_REVIEW_STATUSES as any },
          reviewStartedAt: { lte: reviewStaleDate },
        },
        select: {
          id: true, projectId: true, permitType: true,
          reviewStartedAt: true, applicantEmail: true,
        },
      })

      for (const permit of staleReviewPermits) {
        const reviewDays = Math.floor(
          (now.getTime() - new Date(permit.reviewStartedAt as Date).getTime()) / 86_400_000,
        )

        actionsTriggered.push(
          this.makeAction(
            'INTERNAL_ALERT',
            {
              message:      `Permit ${permit.id} (${permit.permitType}) in review for ${reviewDays} day(s) — consider expedited processing`,
              permitId:     permit.id,
              projectId:    permit.projectId,
              reviewDays,
              severity:     reviewDays > 30 ? 'HIGH' : 'MEDIUM',
            },
            { requiresApproval: false, autoExecute: true },
          ),
        )

        // SUPERVISED: recommend portal status check — human must approve before queuing
        recommendations.push(
          this.makeAction(
            'QUEUE_JOB',
            {
              queue:     'kealee-permit-tracker',
              job:       'check-portal-status',
              permitId:  permit.id,
              projectId: permit.projectId,
              reason:    'stale_review_check',
            },
            { requiresApproval: true, autoExecute: false },
          ),
        )
      }

      // ── 4. Permits stuck in CORRECTIONS_REQUIRED > CORRECTION_STALE_DAYS ──
      const correctionStaleDate = new Date(now.getTime() - CORRECTION_STALE_DAYS * 86_400_000)

      const staleCorrections = await prisma.permit.findMany({
        where: {
          status:    { in: CORRECTION_STATUSES as any },
          updatedAt: { lte: correctionStaleDate },
        },
        select: {
          id: true, projectId: true, permitType: true,
          updatedAt: true, applicantEmail: true,
        },
      })

      for (const permit of staleCorrections) {
        const staleDays = Math.floor(
          (now.getTime() - new Date(permit.updatedAt).getTime()) / 86_400_000,
        )

        actionsTriggered.push(
          this.makeAction(
            'EMAIL_SEQUENCE',
            {
              templateId:  'permit_corrections_stale',
              permitId:    permit.id,
              projectId:   permit.projectId,
              permitType:  permit.permitType,
              staleDays,
              to:          permit.applicantEmail,
            },
            { requiresApproval: false, autoExecute: true },
          ),
        )
      }

      // ── 5. Dashboard health snapshot ──────────────────────────────────────
      actionsTriggered.push(
        this.makeAction(
          'DASHBOARD_METRIC_UPDATE',
          {
            metric: 'permit_compliance_health',
            value: {
              expiringPermits:   expiringPermits.length,
              staleInspections:  staleInspections.length,
              staleReviews:      staleReviewPermits.length,
              staleCorrections:  staleCorrections.length,
              scannedAt:         now.toISOString(),
            },
          },
          { requiresApproval: false, autoExecute: true },
        ),
      )

      logger.info(
        {
          expiringPermits:  expiringPermits.length,
          staleInspections: staleInspections.length,
          staleReviews:     staleReviewPermits.length,
          staleCorrections: staleCorrections.length,
          actionsGenerated: actionsTriggered.length,
          recommendations:  recommendations.length,
        },
        'PermitComplianceBot daily scan complete',
      )

      return this.makeResult('permit.monitor.daily', actionsTriggered, recommendations, start)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error({ botId: this.id, err: msg }, 'PermitComplianceBot daily scan error')
      return {
        botId: this.id,
        eventType: 'permit.monitor.daily',
        actionsTriggered: [],
        recommendationsEmitted: [],
        processingMs: Date.now() - start,
        error: msg,
      }
    }
  }

  // ── Event-specific handlers ────────────────────────────────────────────────

  /**
   * permit.status.changed — Notify applicant of status update and queue a
   * portal re-check to confirm the transition is reflected in the jurisdiction system.
   */
  private _handleStatusChanged(event: BotEvent, start: number): BotResult {
    const { permitId, previousStatus, newStatus, jurisdictionCode } = event.payload as {
      permitId:         string
      previousStatus:   string
      newStatus:        string
      jurisdictionCode?: string
    }

    const actions: BotAction[] = [
      this.makeAction(
        'EMAIL_SEQUENCE',
        {
          templateId:       'permit_status_update',
          permitId,
          projectId:        event.payload.projectId,
          previousStatus,
          newStatus,
          jurisdictionCode,
        },
        { requiresApproval: false, autoExecute: true },
      ),
      this.makeAction(
        'DASHBOARD_METRIC_UPDATE',
        {
          permitId,
          projectId:  event.payload.projectId,
          metric:     'permit_status',
          value:      newStatus,
        },
        { requiresApproval: false, autoExecute: true },
      ),
      // Queue a portal re-check to confirm the new status propagated
      this.makeAction(
        'QUEUE_JOB',
        {
          queue:     'kealee-permit-tracker',
          job:       'check-portal-status',
          permitId,
          projectId: event.payload.projectId,
          reason:    'status_change_confirmation',
        },
        { requiresApproval: false, autoExecute: true },
      ),
    ]

    return this.makeResult(event.type, actions, [], start)
  }

  /**
   * permit.expiring — Emit escalating alerts based on days remaining.
   * CLAW E publishes this event from the daily 7AM cron.
   */
  private _handleExpiring(event: BotEvent, start: number): BotResult {
    const { permitId, daysRemaining, permitType } = event.payload as {
      permitId:     string
      daysRemaining: number
      permitType:   string
    }

    const isCritical = daysRemaining <= EXPIRY_CRITICAL_DAYS

    const actions: BotAction[] = [
      this.makeAction(
        'EMAIL_SEQUENCE',
        {
          templateId:    isCritical ? 'permit_expiry_critical' : 'permit_expiry_warning',
          permitId,
          projectId:     event.payload.projectId,
          daysRemaining,
          permitType,
        },
        { requiresApproval: false, autoExecute: true },
      ),
    ]

    if (isCritical) {
      actions.push(
        this.makeAction(
          'INTERNAL_ALERT',
          {
            message:   `CRITICAL: Permit ${permitId} (${permitType}) expires in ${daysRemaining} day(s)`,
            permitId,
            projectId: event.payload.projectId,
            daysRemaining,
            severity:  'CRITICAL',
          },
          { requiresApproval: false, autoExecute: true },
        ),
      )
    }

    return this.makeResult(event.type, actions, [], start)
  }

  /**
   * permit.approved — Notify applicant and queue inspection sequence setup.
   * CLAW E already wrote the APPROVED status; we coordinate next steps.
   */
  private _handleApproved(event: BotEvent, start: number): BotResult {
    const { permitId, jurisdictionCode } = event.payload as {
      permitId:         string
      jurisdictionCode: string
    }

    const actions: BotAction[] = [
      this.makeAction(
        'EMAIL_SEQUENCE',
        {
          templateId:      'permit_approved',
          permitId,
          projectId:       event.payload.projectId,
          jurisdictionCode,
        },
        { requiresApproval: false, autoExecute: true },
      ),
      // Prime the inspection coordinator to set up the required inspection sequence
      this.makeAction(
        'QUEUE_JOB',
        {
          queue:     'kealee-inspection-coordinator',
          job:       'setup-inspection-sequence',
          permitId,
          projectId: event.payload.projectId,
        },
        { requiresApproval: false, autoExecute: true },
      ),
      this.makeAction(
        'DASHBOARD_METRIC_UPDATE',
        {
          permitId,
          projectId: event.payload.projectId,
          metric:    'permit_approved',
          value:     true,
        },
        { requiresApproval: false, autoExecute: true },
      ),
    ]

    return this.makeResult(event.type, actions, [], start)
  }

  /**
   * inspection.failed — Notify contractor and recommend reinspection scheduling.
   * Pass/fail authority belongs to CLAW E; this bot only coordinates follow-up.
   * Reinspection scheduling is SUPERVISED — requires human confirmation.
   */
  private _handleInspectionFailed(event: BotEvent, start: number): BotResult {
    const { inspectionId, inspectionType, deficiencies } = event.payload as {
      inspectionId:   string
      inspectionType: string
      deficiencies?:  string[]
    }

    const actions: BotAction[] = [
      this.makeAction(
        'EMAIL_SEQUENCE',
        {
          templateId:     'inspection_failed',
          inspectionId,
          projectId:      event.payload.projectId,
          inspectionType,
          deficiencies:   deficiencies ?? [],
          deficiencyCount: deficiencies?.length ?? 0,
        },
        { requiresApproval: false, autoExecute: true },
      ),
      this.makeAction(
        'INTERNAL_ALERT',
        {
          message:        `Inspection FAILED: ${inspectionType} on project ${event.payload.projectId} — ${deficiencies?.length ?? 0} deficiency(ies)`,
          inspectionId,
          projectId:      event.payload.projectId,
          inspectionType,
          deficiencyCount: deficiencies?.length ?? 0,
          severity:       'HIGH',
        },
        { requiresApproval: false, autoExecute: true },
      ),
    ]

    // SUPERVISED: reinspection must be explicitly approved by PM
    const recommendations: BotAction[] = [
      this.makeAction(
        'QUEUE_JOB',
        {
          queue:          'kealee-inspection-coordinator',
          job:            'schedule-reinspection',
          inspectionId,
          projectId:      event.payload.projectId,
          inspectionType,
        },
        { requiresApproval: true, autoExecute: false },
      ),
    ]

    return this.makeResult(event.type, actions, recommendations, start)
  }

  /**
   * inspection.passed — Notify stakeholders and update dashboard.
   * CLAW E owns the pass authority; we handle the downstream notifications.
   */
  private _handleInspectionPassed(event: BotEvent, start: number): BotResult {
    const { inspectionId, inspectionType } = event.payload as {
      inspectionId:   string
      inspectionType: string
    }

    const actions: BotAction[] = [
      this.makeAction(
        'EMAIL_SEQUENCE',
        {
          templateId:     'inspection_passed',
          inspectionId,
          projectId:      event.payload.projectId,
          inspectionType,
        },
        { requiresApproval: false, autoExecute: true },
      ),
      this.makeAction(
        'DASHBOARD_METRIC_UPDATE',
        {
          inspectionId,
          projectId:      event.payload.projectId,
          metric:         'inspection_passed',
          inspectionType,
          value:          true,
        },
        { requiresApproval: false, autoExecute: true },
      ),
    ]

    return this.makeResult(event.type, actions, [], start)
  }

  /**
   * compliance.alert.high — AI photo analysis detected critical safety/QA issues.
   * Published by CLAW E qa-inspector when photo analysis finds CRITICAL issues.
   * This requires immediate ops response.
   */
  private _handleComplianceAlert(event: BotEvent, start: number): BotResult {
    const { qaResultId, criticalIssueCount, safetyIssueCount } = event.payload as {
      qaResultId:        string
      criticalIssueCount: number
      safetyIssueCount:  number
    }

    const actions: BotAction[] = [
      this.makeAction(
        'INTERNAL_ALERT',
        {
          message:            `COMPLIANCE CRITICAL on project ${event.payload.projectId}: ${criticalIssueCount} critical issue(s), ${safetyIssueCount} safety issue(s) — immediate action required`,
          qaResultId,
          projectId:          event.payload.projectId,
          criticalIssueCount,
          safetyIssueCount,
          severity:           'CRITICAL',
          requiresImmediateAction: true,
        },
        { requiresApproval: false, autoExecute: true },
      ),
      this.makeAction(
        'EMAIL_SEQUENCE',
        {
          templateId:         'compliance_critical_alert',
          qaResultId,
          projectId:          event.payload.projectId,
          criticalIssueCount,
          safetyIssueCount,
        },
        { requiresApproval: false, autoExecute: true },
      ),
      this.makeAction(
        'DASHBOARD_METRIC_UPDATE',
        {
          projectId:  event.payload.projectId,
          metric:     'compliance_alert',
          value:      { criticalIssueCount, safetyIssueCount, qaResultId },
        },
        { requiresApproval: false, autoExecute: true },
      ),
    ]

    return this.makeResult(event.type, actions, [], start)
  }

  /**
   * project.phase.changed — Surface permit readiness for the new construction phase.
   * CLAW E's evaluate-permits-for-phase worker does the actual permit creation;
   * this bot surfaces the queue trigger and updates the dashboard.
   */
  private _handlePhaseChanged(event: BotEvent, start: number): BotResult {
    const { phase } = event.payload as { phase: string }

    const actions: BotAction[] = [
      // Queue the permit evaluation in CLAW E's permit-tracker worker
      this.makeAction(
        'QUEUE_JOB',
        {
          queue:     'kealee-permit-tracker',
          job:       'evaluate-permits-for-phase',
          projectId: event.payload.projectId,
          phase,
        },
        { requiresApproval: false, autoExecute: true },
      ),
      this.makeAction(
        'DASHBOARD_METRIC_UPDATE',
        {
          projectId: event.payload.projectId,
          metric:    'project_phase',
          value:     phase,
        },
        { requiresApproval: false, autoExecute: true },
      ),
    ]

    return this.makeResult(event.type, actions, [], start)
  }
}
