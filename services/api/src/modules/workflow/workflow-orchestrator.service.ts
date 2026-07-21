/**
 * workflow-orchestrator.service.ts
 *
 * High-level automation wiring:
 *   - Combines stage transitions + work item creation + event emission
 *   - Called by domain services (ProfessionalAssignment, verification, etc.)
 *   - Never replaces canonical objects; always wraps them
 */

import { workflowStageService } from './workflow-stage.service'
import { workItemService } from './work-item.service'
import { workflowEventService, WorkflowEventService } from './workflow-event.service'
import { ASSIGNMENT_ACCEPTANCE_WINDOW_MS, CONTRACT_SIGNATURE_WINDOW_MS, ESCROW_FUNDING_WINDOW_MS } from './workflow.constants'
import type { WorkflowSubjectType } from './workflow.types'

class WorkflowOrchestratorService {
  // ─── ProfessionalAssignment lifecycle ──────────────────────────────────────

  /**
   * Called when a lead is assigned to a professional.
   * Appends LEAD_ASSIGNED stage and opens an ASSIGNMENT_ACCEPTANCE work item
   * with a 72-hour acceptance window.
   */
  async onLeadAssigned(opts: {
    assignmentId: string
    leadId: string
    assignedToUserId: string
    assignedToOrgId?: string
    enteredById?: string
  }) {
    const { assignmentId, leadId, assignedToUserId, assignedToOrgId, enteredById } = opts

    await workflowStageService.appendStage({
      subjectType: 'PROFESSIONAL_ASSIGNMENT',
      subjectId: assignmentId,
      stage: 'LEAD_ASSIGNED',
      enteredById,
      metadata: { leadId },
    })

    const dueAt = new Date(Date.now() + ASSIGNMENT_ACCEPTANCE_WINDOW_MS)
    await workItemService.createWorkItem({
      type:             'ASSIGNMENT_ACCEPTANCE',
      subjectType:      'PROFESSIONAL_ASSIGNMENT',
      subjectId:        assignmentId,
      assignedToUserId: assignedToUserId,
      assignedToOrgId:  assignedToOrgId,
      title:            'Accept or decline lead assignment',
      dueAt,
      createdBySystem:  true,
      metadata: { leadId, acceptWindowHours: 72 },
    })

    await workflowStageService.appendStage({
      subjectType: 'PROFESSIONAL_ASSIGNMENT',
      subjectId: assignmentId,
      stage: 'AWAITING_PRO_ACCEPTANCE',
      enteredById,
    })

    await workflowEventService.emit({
      eventType:      'assignment.offered',
      subjectType:    'PROFESSIONAL_ASSIGNMENT',
      subjectId:      assignmentId,
      idempotencyKey: WorkflowEventService.buildKey('assignment.offered', 'PROFESSIONAL_ASSIGNMENT', assignmentId),
      payload:        { leadId, assignedToUserId, dueAt },
    })
  }

  /**
   * Called when a professional accepts an assignment.
   */
  async onAssignmentAccepted(opts: {
    assignmentId: string
    acceptedByUserId: string
    workItemId?: string
  }) {
    const { assignmentId, acceptedByUserId, workItemId } = opts

    if (workItemId) {
      await workItemService.completeWorkItem({ workItemId, completedById: acceptedByUserId })
    }

    await workflowStageService.appendStage({
      subjectType: 'PROFESSIONAL_ASSIGNMENT',
      subjectId: assignmentId,
      stage: 'ASSIGNMENT_ACCEPTED',
      enteredById: acceptedByUserId,
    })

    await workflowEventService.emit({
      eventType:      'assignment.accepted',
      subjectType:    'PROFESSIONAL_ASSIGNMENT',
      subjectId:      assignmentId,
      idempotencyKey: WorkflowEventService.buildKey('assignment.accepted', 'PROFESSIONAL_ASSIGNMENT', assignmentId),
      payload:        { acceptedByUserId },
    })
  }

  /**
   * Called when a professional declines an assignment.
   */
  async onAssignmentDeclined(opts: {
    assignmentId: string
    declinedByUserId: string
    workItemId?: string
    reason?: string
  }) {
    const { assignmentId, declinedByUserId, workItemId, reason } = opts

    if (workItemId) {
      await workItemService.declineWorkItem(workItemId, declinedByUserId)
    }

    await workflowStageService.appendStage({
      subjectType: 'PROFESSIONAL_ASSIGNMENT',
      subjectId: assignmentId,
      stage: 'ASSIGNMENT_DECLINED',
      enteredById: declinedByUserId,
      metadata: reason ? { reason } : undefined,
    })

    await workflowEventService.emit({
      eventType:      'assignment.declined',
      subjectType:    'PROFESSIONAL_ASSIGNMENT',
      subjectId:      assignmentId,
      idempotencyKey: WorkflowEventService.buildKey('assignment.declined', 'PROFESSIONAL_ASSIGNMENT', assignmentId),
      payload:        { declinedByUserId, reason },
    })
  }

  /**
   * Called by the worker when an acceptance window expires.
   */
  async onAssignmentExpired(opts: { assignmentId: string }) {
    const { assignmentId } = opts

    await workItemService.expireOverdueItems('PROFESSIONAL_ASSIGNMENT', assignmentId)

    await workflowStageService.appendStage({
      subjectType: 'PROFESSIONAL_ASSIGNMENT',
      subjectId: assignmentId,
      stage: 'ASSIGNMENT_EXPIRED',
    })

    await workflowEventService.emit({
      eventType:      'assignment.expired',
      subjectType:    'PROFESSIONAL_ASSIGNMENT',
      subjectId:      assignmentId,
      idempotencyKey: WorkflowEventService.buildKey('assignment.expired', 'PROFESSIONAL_ASSIGNMENT', assignmentId, Date.now().toString()),
      payload:        { expiredAt: new Date() },
    })
  }

  // ─── Verification lifecycle ────────────────────────────────────────────────

  /**
   * Called when an org submits for verification.
   * Opens LICENSE_UPLOAD and INSURANCE_UPLOAD work items for the org.
   */
  async onVerificationSubmitted(opts: {
    orgId: string
    submittedByUserId: string
  }) {
    const { orgId, submittedByUserId } = opts

    await workflowStageService.appendStage({
      subjectType: 'ORGANIZATION',
      subjectId: orgId,
      stage: 'VERIFICATION_PENDING',
      enteredById: submittedByUserId,
    })

    await workItemService.createWorkItem({
      type:            'VERIFICATION_REVIEW',
      subjectType:     'ORGANIZATION',
      subjectId:       orgId,
      organizationId:  orgId,
      title:           'Review verification submission',
      createdBySystem: true,
    })

    await workflowEventService.emit({
      eventType:      'verification.submitted',
      subjectType:    'ORGANIZATION',
      subjectId:      orgId,
      idempotencyKey: WorkflowEventService.buildKey('verification.submitted', 'ORGANIZATION', orgId, submittedByUserId),
      payload:        { submittedByUserId },
    })
  }

  /**
   * Called when an admin approves an org's verification.
   */
  async onVerificationApproved(opts: { orgId: string; reviewedByUserId: string; workItemId?: string }) {
    const { orgId, reviewedByUserId, workItemId } = opts

    if (workItemId) {
      await workItemService.completeWorkItem({ workItemId, completedById: reviewedByUserId })
    }

    await workflowStageService.appendStage({
      subjectType: 'ORGANIZATION',
      subjectId: orgId,
      stage: 'VERIFICATION_APPROVED',
      enteredById: reviewedByUserId,
    })

    await workflowEventService.emit({
      eventType:      'verification.approved',
      subjectType:    'ORGANIZATION',
      subjectId:      orgId,
      idempotencyKey: WorkflowEventService.buildKey('verification.approved', 'ORGANIZATION', orgId),
      payload:        { reviewedByUserId },
    })
  }

  /**
   * Called when an admin rejects an org's verification.
   */
  async onVerificationRejected(opts: {
    orgId: string
    reviewedByUserId: string
    reason?: string
    workItemId?: string
  }) {
    const { orgId, reviewedByUserId, reason, workItemId } = opts

    if (workItemId) {
      await workItemService.declineWorkItem(workItemId, reviewedByUserId)
    }

    await workflowStageService.appendStage({
      subjectType: 'ORGANIZATION',
      subjectId: orgId,
      stage: 'VERIFICATION_REJECTED',
      enteredById: reviewedByUserId,
      metadata: reason ? { reason } : undefined,
    })

    await workflowEventService.emit({
      eventType:      'verification.rejected',
      subjectType:    'ORGANIZATION',
      subjectId:      orgId,
      idempotencyKey: WorkflowEventService.buildKey('verification.rejected', 'ORGANIZATION', orgId, reviewedByUserId),
      payload:        { reviewedByUserId, reason },
    })
  }

  // ─── Construction readiness mirror ────────────────────────────────────────

  /**
   * Mirror ConstructionReadinessStatus transitions into workflow stages.
   * Does NOT replace ConstructionReadinessStatus on the Project model.
   */
  async onConstructionReady(opts: { projectId: string; triggeredByUserId?: string }) {
    const { projectId, triggeredByUserId } = opts

    await workflowStageService.appendStage(
      {
        subjectType: 'PROJECT',
        subjectId: projectId,
        stage: 'CONSTRUCTION_READY',
        enteredById: triggeredByUserId,
      },
      true, // allow force — project may not have gone through full lead lifecycle
    )

    await workflowEventService.emit({
      eventType:      'project.construction_ready',
      subjectType:    'PROJECT',
      subjectId:      projectId,
      idempotencyKey: WorkflowEventService.buildKey('project.construction_ready', 'PROJECT', projectId),
      payload:        { triggeredByUserId },
    })
  }

  // ─── Contract + Escrow ─────────────────────────────────────────────────────

  async onContractDrafted(opts: { subjectType: WorkflowSubjectType; subjectId: string; enteredById?: string }) {
    await workflowStageService.appendStage({ ...opts, stage: 'CONTRACT_DRAFTED' }, true)
  }

  async onContractPendingSignature(opts: {
    subjectType: WorkflowSubjectType
    subjectId: string
    assignedToUserId?: string
    enteredById?: string
  }) {
    const dueAt = new Date(Date.now() + CONTRACT_SIGNATURE_WINDOW_MS)

    await workflowStageService.appendStage({ ...opts, stage: 'CONTRACT_PENDING_SIGNATURE' }, true)

    if (opts.assignedToUserId) {
      await workItemService.createWorkItem({
        type:             'CONTRACT_SIGNATURE',
        subjectType:      opts.subjectType,
        subjectId:        opts.subjectId,
        assignedToUserId: opts.assignedToUserId,
        title:            'Sign contract',
        dueAt,
        createdBySystem:  true,
      })
    }
  }

  async onEscrowFunded(opts: { subjectType: WorkflowSubjectType; subjectId: string; enteredById?: string }) {
    await workflowStageService.appendStage({ ...opts, stage: 'ESCROW_FUNDED' }, true)

    await workflowEventService.emit({
      eventType:      'escrow.funded',
      subjectType:    opts.subjectType,
      subjectId:      opts.subjectId,
      idempotencyKey: WorkflowEventService.buildKey('escrow.funded', opts.subjectType, opts.subjectId),
      payload:        { enteredById: opts.enteredById },
    })
  }
}

export const workflowOrchestratorService = new WorkflowOrchestratorService()
