/**
 * workflow.types.ts
 *
 * Shared TypeScript types for the workflow primitives layer.
 * These mirror the Prisma enums so services/routes can import without
 * a direct Prisma dependency.
 */

export type WorkflowSubjectType =
  | 'PROJECT'
  | 'ENGAGEMENT'
  | 'PROFESSIONAL_ASSIGNMENT'
  | 'ORGANIZATION'
  | 'VERIFICATION_PROFILE'

export type WorkflowStageName =
  | 'LEAD_CREATED'
  | 'LEAD_ASSIGNED'
  | 'AWAITING_PRO_ACCEPTANCE'
  | 'ASSIGNMENT_ACCEPTED'
  | 'ASSIGNMENT_DECLINED'
  | 'ASSIGNMENT_EXPIRED'
  | 'VERIFICATION_PENDING'
  | 'VERIFICATION_UNDER_REVIEW'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED'
  | 'DESIGN_READY'
  | 'PERMITS_SUBMITTED'
  | 'CONSTRUCTION_READY'
  | 'CONTRACT_DRAFTED'
  | 'CONTRACT_PENDING_SIGNATURE'
  | 'ESCROW_DRAFTED'
  | 'ESCROW_FUNDED'
  | 'MILESTONES_INITIALIZED'

export type WorkItemStatus = 'OPEN' | 'COMPLETED' | 'DECLINED' | 'EXPIRED' | 'CANCELED'

export type WorkItemType =
  | 'ASSIGNMENT_ACCEPTANCE'
  | 'LICENSE_UPLOAD'
  | 'INSURANCE_UPLOAD'
  | 'VERIFICATION_REVIEW'
  | 'CONTRACT_REVIEW'
  | 'CONTRACT_SIGNATURE'
  | 'ESCROW_SETUP'
  | 'ESCROW_FUNDING'
  | 'MILESTONE_CONFIRMATION'
  | 'PROFILE_COMPLETION'
  | 'PERMIT_PACKET_REVIEW'

// ─── Service input types ──────────────────────────────────────────────────────

export interface AppendStageInput {
  subjectType: WorkflowSubjectType
  subjectId: string
  stage: WorkflowStageName
  enteredById?: string
  metadata?: Record<string, unknown>
}

export interface CreateWorkItemInput {
  type: WorkItemType
  subjectType: WorkflowSubjectType
  subjectId: string
  organizationId?: string
  assignedToUserId?: string
  assignedToOrgId?: string
  title?: string
  description?: string
  dueAt?: Date
  metadata?: Record<string, unknown>
  createdBySystem?: boolean
}

export interface CompleteWorkItemInput {
  workItemId: string
  completedById?: string
  metadata?: Record<string, unknown>
}

export interface EmitWorkflowEventInput {
  eventType: string
  subjectType: WorkflowSubjectType
  subjectId: string
  idempotencyKey: string
  payload?: Record<string, unknown>
}

// ─── Query result types ───────────────────────────────────────────────────────

export interface StageTimeline {
  subjectType: WorkflowSubjectType
  subjectId: string
  stages: Array<{
    stage: WorkflowStageName
    enteredAt: Date
    enteredById: string | null
    metadata: Record<string, unknown> | null
  }>
  currentStage: WorkflowStageName | null
}
