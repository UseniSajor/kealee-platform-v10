/**
 * workflow-primitives.test.ts
 *
 * Unit tests for the v20 workflow lifecycle primitives:
 *   - WorkflowEventService  (idempotency, buildKey, emit, getEventsForSubject)
 *   - WorkflowStageService  (appendStage, transition guard, getCurrentStage, getTimeline)
 *   - WorkItemService       (createWorkItem, complete, decline, expire, expireOverdue, getAdminQueue)
 *   - WorkflowOrchestratorService  (onLeadAssigned, onAssignmentAccepted, onVerificationApproved)
 *
 * Approach: Prisma is fully mocked via prismaAny so no DB connection is needed.
 * Transition rules from workflow.constants.ts are respected in test setup.
 *
 * TO RUN: pnpm --filter services/api test -- workflow-primitives
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Prisma mock ──────────────────────────────────────────────────────────────

const mockWorkflowEvent  = { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() }
const mockWorkflowStage  = { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() }
const mockWorkItem       = { create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findMany: vi.fn() }

vi.mock('../../../utils/prisma-helper', () => ({
  prismaAny: {
    workflowEvent: mockWorkflowEvent,
    workflowStage: mockWorkflowStage,
    workItem:      mockWorkItem,
  },
}))

// ── Import under test (after mock) ───────────────────────────────────────────

import { workflowEventService, WorkflowEventService } from '../workflow-event.service'
import { workflowStageService } from '../workflow-stage.service'
import { workItemService } from '../work-item.service'
import { workflowOrchestratorService } from '../workflow-orchestrator.service'

// ─────────────────────────────────────────────────────────────────────────────
// WorkflowEventService
// ─────────────────────────────────────────────────────────────────────────────

describe('WorkflowEventService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('buildKey()', () => {
    it('returns colon-joined key without discriminator', () => {
      const key = WorkflowEventService.buildKey(
        'assignment.offered',
        'PROFESSIONAL_ASSIGNMENT',
        'asgn-001'
      )
      expect(key).toBe('assignment.offered:PROFESSIONAL_ASSIGNMENT:asgn-001')
    })

    it('appends discriminator when provided', () => {
      const key = WorkflowEventService.buildKey(
        'assignment.expired',
        'PROFESSIONAL_ASSIGNMENT',
        'asgn-001',
        '1234567890'
      )
      expect(key).toBe('assignment.expired:PROFESSIONAL_ASSIGNMENT:asgn-001:1234567890')
    })
  })

  describe('emit()', () => {
    it('creates a new workflow event record', async () => {
      const record = { id: 'evt-001', eventType: 'assignment.offered' }
      mockWorkflowEvent.create.mockResolvedValueOnce(record)

      const result = await workflowEventService.emit({
        eventType:      'assignment.offered',
        subjectType:    'PROFESSIONAL_ASSIGNMENT',
        subjectId:      'asgn-001',
        idempotencyKey: 'assignment.offered:PROFESSIONAL_ASSIGNMENT:asgn-001',
        payload:        { foo: 'bar' },
      })

      expect(mockWorkflowEvent.create).toHaveBeenCalledOnce()
      expect(result).toEqual(record)
    })

    it('swallows P2002 (duplicate idempotency key) and returns null', async () => {
      const dupError: any = new Error('Unique constraint')
      dupError.code = 'P2002'
      mockWorkflowEvent.create.mockRejectedValueOnce(dupError)

      const result = await workflowEventService.emit({
        eventType:      'assignment.offered',
        subjectType:    'PROFESSIONAL_ASSIGNMENT',
        subjectId:      'asgn-001',
        idempotencyKey: 'assignment.offered:PROFESSIONAL_ASSIGNMENT:asgn-001',
      })

      expect(result).toBeNull()
    })

    it('re-throws non-idempotency errors', async () => {
      mockWorkflowEvent.create.mockRejectedValueOnce(new Error('DB connection lost'))
      await expect(
        workflowEventService.emit({
          eventType:      'assignment.offered',
          subjectType:    'PROFESSIONAL_ASSIGNMENT',
          subjectId:      'asgn-001',
          idempotencyKey: 'key',
        })
      ).rejects.toThrow('DB connection lost')
    })
  })

  describe('getEventsForSubject()', () => {
    it('queries by subjectType + subjectId and returns events', async () => {
      const events = [{ id: 'evt-001' }, { id: 'evt-002' }]
      mockWorkflowEvent.findMany.mockResolvedValueOnce(events)

      const result = await workflowEventService.getEventsForSubject(
        'PROFESSIONAL_ASSIGNMENT',
        'asgn-001'
      )

      expect(mockWorkflowEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { subjectType: 'PROFESSIONAL_ASSIGNMENT', subjectId: 'asgn-001' },
        })
      )
      expect(result).toHaveLength(2)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// WorkflowStageService
// ─────────────────────────────────────────────────────────────────────────────

describe('WorkflowStageService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('appendStage()', () => {
    it('creates a stage row when transitioning from null (first stage)', async () => {
      // getCurrentStage returns null (first stage — transition guard allows any)
      mockWorkflowStage.findFirst.mockResolvedValueOnce(null)
      mockWorkflowStage.create.mockResolvedValueOnce({ id: 'stg-001', stage: 'LEAD_CREATED' })

      await workflowStageService.appendStage({
        subjectType: 'PROFESSIONAL_ASSIGNMENT',
        subjectId:   'asgn-001',
        stage:       'LEAD_CREATED',
      })

      expect(mockWorkflowStage.create).toHaveBeenCalledOnce()
      expect(mockWorkflowStage.create.mock.calls[0][0].data.stage).toBe('LEAD_CREATED')
    })

    it('creates a stage row on a valid transition (LEAD_ASSIGNED → AWAITING_PRO_ACCEPTANCE)', async () => {
      // VALID_TRANSITIONS: LEAD_ASSIGNED → ['AWAITING_PRO_ACCEPTANCE']
      mockWorkflowStage.findFirst.mockResolvedValueOnce({ stage: 'LEAD_ASSIGNED' })
      mockWorkflowStage.create.mockResolvedValueOnce({ id: 'stg-002', stage: 'AWAITING_PRO_ACCEPTANCE' })

      await workflowStageService.appendStage({
        subjectType: 'PROFESSIONAL_ASSIGNMENT',
        subjectId:   'asgn-001',
        stage:       'AWAITING_PRO_ACCEPTANCE',
      })

      expect(mockWorkflowStage.create).toHaveBeenCalledOnce()
    })

    it('throws on an invalid transition (LEAD_ASSIGNED → CONSTRUCTION_READY)', async () => {
      // VALID_TRANSITIONS: LEAD_ASSIGNED → ['AWAITING_PRO_ACCEPTANCE'] only
      mockWorkflowStage.findFirst.mockResolvedValueOnce({ stage: 'LEAD_ASSIGNED' })

      await expect(
        workflowStageService.appendStage({
          subjectType: 'PROFESSIONAL_ASSIGNMENT',
          subjectId:   'asgn-001',
          stage:       'CONSTRUCTION_READY',
        })
      ).rejects.toThrow('Invalid workflow transition')
    })

    it('skips the transition guard when allowForce=true', async () => {
      // Normally LEAD_ASSIGNED → CONSTRUCTION_READY is invalid, but force bypasses it
      mockWorkflowStage.findFirst.mockResolvedValueOnce({ stage: 'LEAD_ASSIGNED' })
      mockWorkflowStage.create.mockResolvedValueOnce({ id: 'stg-003', stage: 'CONSTRUCTION_READY' })

      await workflowStageService.appendStage(
        {
          subjectType: 'PROJECT',
          subjectId:   'proj-001',
          stage:       'CONSTRUCTION_READY',
        },
        true // force
      )

      expect(mockWorkflowStage.create).toHaveBeenCalledOnce()
      expect(mockWorkflowStage.create.mock.calls[0][0].data.stage).toBe('CONSTRUCTION_READY')
    })
  })

  describe('getTimeline()', () => {
    it('returns a StageTimeline with ordered stages', async () => {
      const rows = [
        { stage: 'LEAD_CREATED',  enteredAt: new Date('2026-01-01'), enteredById: null, metadata: null },
        { stage: 'LEAD_ASSIGNED', enteredAt: new Date('2026-01-02'), enteredById: 'u1', metadata: null },
      ]
      mockWorkflowStage.findMany.mockResolvedValueOnce(rows)

      const result = await workflowStageService.getTimeline(
        'PROFESSIONAL_ASSIGNMENT',
        'asgn-001'
      )

      expect(result.stages).toHaveLength(2)
      expect(result.currentStage).toBe('LEAD_ASSIGNED')
      expect(result.subjectType).toBe('PROFESSIONAL_ASSIGNMENT')
    })

    it('returns null currentStage when no stages exist', async () => {
      mockWorkflowStage.findMany.mockResolvedValueOnce([])
      const result = await workflowStageService.getTimeline('PROJECT', 'proj-999')
      expect(result.currentStage).toBeNull()
      expect(result.stages).toHaveLength(0)
    })
  })

  describe('getCurrentStage()', () => {
    it('returns the most recent stage name', async () => {
      mockWorkflowStage.findFirst.mockResolvedValueOnce({ stage: 'AWAITING_PRO_ACCEPTANCE' })
      const result = await workflowStageService.getCurrentStage(
        'PROFESSIONAL_ASSIGNMENT',
        'asgn-001'
      )
      expect(result).toBe('AWAITING_PRO_ACCEPTANCE')
    })

    it('returns null when no stages exist', async () => {
      mockWorkflowStage.findFirst.mockResolvedValueOnce(null)
      const result = await workflowStageService.getCurrentStage('PROJECT', 'proj-999')
      expect(result).toBeNull()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// WorkItemService
// ─────────────────────────────────────────────────────────────────────────────

describe('WorkItemService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('createWorkItem()', () => {
    it('persists a new work item with correct fields', async () => {
      const item = { id: 'wi-001', type: 'ASSIGNMENT_ACCEPTANCE', status: 'OPEN' }
      mockWorkItem.create.mockResolvedValueOnce(item)

      const dueAt = new Date(Date.now() + 72 * 60 * 60 * 1000)
      const result = await workItemService.createWorkItem({
        type:             'ASSIGNMENT_ACCEPTANCE',
        subjectType:      'PROFESSIONAL_ASSIGNMENT',
        subjectId:        'asgn-001',
        assignedToUserId: 'user-001',
        title:            'Accept or decline lead assignment',
        dueAt,
        createdBySystem:  true,
      })

      expect(mockWorkItem.create).toHaveBeenCalledOnce()
      const data = mockWorkItem.create.mock.calls[0][0].data
      expect(data.type).toBe('ASSIGNMENT_ACCEPTANCE')
      expect(data.subjectType).toBe('PROFESSIONAL_ASSIGNMENT')
      expect(data.assignedToUserId).toBe('user-001')
      expect(data.createdBySystem).toBe(true)
      expect(result.id).toBe('wi-001')
    })
  })

  describe('completeWorkItem()', () => {
    it('sets status=COMPLETED with completedAt and completedById', async () => {
      mockWorkItem.update.mockResolvedValueOnce({ id: 'wi-001', status: 'COMPLETED' })

      await workItemService.completeWorkItem({
        workItemId:    'wi-001',
        completedById: 'user-001',
      })

      const args = mockWorkItem.update.mock.calls[0][0]
      expect(args.where.id).toBe('wi-001')
      expect(args.data.status).toBe('COMPLETED')
      expect(args.data.completedById).toBe('user-001')
      expect(args.data.completedAt).toBeInstanceOf(Date)
    })
  })

  describe('declineWorkItem()', () => {
    it('sets status=DECLINED with completedById', async () => {
      mockWorkItem.update.mockResolvedValueOnce({ id: 'wi-001', status: 'DECLINED' })

      await workItemService.declineWorkItem('wi-001', 'user-002')

      const data = mockWorkItem.update.mock.calls[0][0].data
      expect(data.status).toBe('DECLINED')
      expect(data.completedById).toBe('user-002')
    })
  })

  describe('expireOverdueItems()', () => {
    it('bulk-updates OPEN items past dueAt and returns count', async () => {
      mockWorkItem.updateMany.mockResolvedValueOnce({ count: 3 })

      const count = await workItemService.expireOverdueItems(
        'PROFESSIONAL_ASSIGNMENT',
        'asgn-001'
      )

      expect(count).toBe(3)
      const args = mockWorkItem.updateMany.mock.calls[0][0]
      expect(args.where.status).toBe('OPEN')
      expect(args.where.dueAt).toEqual({ lt: expect.any(Date) })
      expect(args.data.status).toBe('EXPIRED')
    })
  })

  describe('getAdminQueue()', () => {
    it('returns OPEN items with default limit when no filter given', async () => {
      const items = [{ id: 'wi-001' }, { id: 'wi-002' }]
      mockWorkItem.findMany.mockResolvedValueOnce(items)

      const result = await workItemService.getAdminQueue()

      const args = mockWorkItem.findMany.mock.calls[0][0]
      expect(args.where.status).toBe('OPEN')
      expect(args.where.type).toBeUndefined()
      expect(args.take).toBe(50)
      expect(result).toHaveLength(2)
    })

    it('filters by type and respects limit', async () => {
      mockWorkItem.findMany.mockResolvedValueOnce([{ id: 'wi-003' }])

      await workItemService.getAdminQueue({ type: 'VERIFICATION_REVIEW', limit: 10 })

      const args = mockWorkItem.findMany.mock.calls[0][0]
      expect(args.where.type).toBe('VERIFICATION_REVIEW')
      expect(args.take).toBe(10)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// WorkflowOrchestratorService (integration-level)
// ─────────────────────────────────────────────────────────────────────────────

describe('WorkflowOrchestratorService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('onLeadAssigned()', () => {
    it('appends LEAD_ASSIGNED + AWAITING_PRO_ACCEPTANCE stages, creates work item, emits event', async () => {
      // appendStage('LEAD_ASSIGNED'): getCurrentStage → null (first stage, any allowed)
      // appendStage('AWAITING_PRO_ACCEPTANCE'): getCurrentStage → 'LEAD_ASSIGNED' (valid)
      mockWorkflowStage.findFirst
        .mockResolvedValueOnce(null)                    // getCurrentStage for LEAD_ASSIGNED transition
        .mockResolvedValueOnce({ stage: 'LEAD_ASSIGNED' }) // getCurrentStage for AWAITING_PRO_ACCEPTANCE

      mockWorkflowStage.create
        .mockResolvedValueOnce({ id: 'stg-001', stage: 'LEAD_ASSIGNED' })
        .mockResolvedValueOnce({ id: 'stg-002', stage: 'AWAITING_PRO_ACCEPTANCE' })

      mockWorkItem.create.mockResolvedValueOnce({ id: 'wi-001' })
      mockWorkflowEvent.create.mockResolvedValueOnce({ id: 'evt-001' })

      await workflowOrchestratorService.onLeadAssigned({
        assignmentId:     'asgn-001',
        leadId:           'lead-001',
        assignedToUserId: 'user-001',
      })

      // Two stage appends
      expect(mockWorkflowStage.create).toHaveBeenCalledTimes(2)
      const stages = mockWorkflowStage.create.mock.calls.map((c: any) => c[0].data.stage)
      expect(stages).toContain('LEAD_ASSIGNED')
      expect(stages).toContain('AWAITING_PRO_ACCEPTANCE')

      // ASSIGNMENT_ACCEPTANCE work item created with 72h window
      expect(mockWorkItem.create).toHaveBeenCalledOnce()
      const wiData = mockWorkItem.create.mock.calls[0][0].data
      expect(wiData.type).toBe('ASSIGNMENT_ACCEPTANCE')
      expect(wiData.assignedToUserId).toBe('user-001')
      expect(wiData.metadata).toMatchObject({ leadId: 'lead-001', acceptWindowHours: 72 })

      // assignment.offered event emitted
      expect(mockWorkflowEvent.create).toHaveBeenCalledOnce()
      expect(mockWorkflowEvent.create.mock.calls[0][0].data.eventType).toBe('assignment.offered')
    })
  })

  describe('onAssignmentAccepted()', () => {
    it('completes the work item, appends ASSIGNMENT_ACCEPTED, emits assignment.accepted', async () => {
      // AWAITING_PRO_ACCEPTANCE → ASSIGNMENT_ACCEPTED is a valid transition
      mockWorkItem.update.mockResolvedValueOnce({ id: 'wi-001', status: 'COMPLETED' })
      mockWorkflowStage.findFirst.mockResolvedValueOnce({ stage: 'AWAITING_PRO_ACCEPTANCE' })
      mockWorkflowStage.create.mockResolvedValueOnce({ id: 'stg-003', stage: 'ASSIGNMENT_ACCEPTED' })
      mockWorkflowEvent.create.mockResolvedValueOnce({ id: 'evt-002' })

      await workflowOrchestratorService.onAssignmentAccepted({
        assignmentId:     'asgn-001',
        acceptedByUserId: 'user-001',
        workItemId:       'wi-001',
      })

      // Work item completed
      expect(mockWorkItem.update).toHaveBeenCalledOnce()
      expect(mockWorkItem.update.mock.calls[0][0].data.status).toBe('COMPLETED')

      // ASSIGNMENT_ACCEPTED stage appended
      expect(mockWorkflowStage.create.mock.calls[0][0].data.stage).toBe('ASSIGNMENT_ACCEPTED')

      // assignment.accepted event emitted
      expect(mockWorkflowEvent.create.mock.calls[0][0].data.eventType).toBe('assignment.accepted')
    })

    it('still appends stage and emits event even without a workItemId', async () => {
      mockWorkflowStage.findFirst.mockResolvedValueOnce({ stage: 'AWAITING_PRO_ACCEPTANCE' })
      mockWorkflowStage.create.mockResolvedValueOnce({ id: 'stg-003', stage: 'ASSIGNMENT_ACCEPTED' })
      mockWorkflowEvent.create.mockResolvedValueOnce({ id: 'evt-003' })

      await workflowOrchestratorService.onAssignmentAccepted({
        assignmentId:     'asgn-002',
        acceptedByUserId: 'user-002',
        // no workItemId
      })

      expect(mockWorkItem.update).not.toHaveBeenCalled()
      expect(mockWorkflowStage.create).toHaveBeenCalledOnce()
      expect(mockWorkflowEvent.create).toHaveBeenCalledOnce()
    })
  })

  describe('onAssignmentDeclined()', () => {
    it('declines the work item, appends ASSIGNMENT_DECLINED with reason, emits event', async () => {
      mockWorkItem.update.mockResolvedValueOnce({ id: 'wi-001', status: 'DECLINED' })
      // AWAITING_PRO_ACCEPTANCE → ASSIGNMENT_DECLINED is valid
      mockWorkflowStage.findFirst.mockResolvedValueOnce({ stage: 'AWAITING_PRO_ACCEPTANCE' })
      mockWorkflowStage.create.mockResolvedValueOnce({ id: 'stg-004', stage: 'ASSIGNMENT_DECLINED' })
      mockWorkflowEvent.create.mockResolvedValueOnce({ id: 'evt-004' })

      await workflowOrchestratorService.onAssignmentDeclined({
        assignmentId:     'asgn-001',
        declinedByUserId: 'user-001',
        workItemId:       'wi-001',
        reason:           'Not available',
      })

      const stageData = mockWorkflowStage.create.mock.calls[0][0].data
      expect(stageData.stage).toBe('ASSIGNMENT_DECLINED')
      expect(stageData.metadata).toEqual({ reason: 'Not available' })
      expect(mockWorkflowEvent.create.mock.calls[0][0].data.eventType).toBe('assignment.declined')
    })
  })

  describe('onVerificationApproved()', () => {
    it('appends VERIFICATION_APPROVED and emits verification.approved', async () => {
      // VERIFICATION_UNDER_REVIEW → VERIFICATION_APPROVED is valid
      mockWorkflowStage.findFirst.mockResolvedValueOnce({ stage: 'VERIFICATION_UNDER_REVIEW' })
      mockWorkflowStage.create.mockResolvedValueOnce({ id: 'stg-005', stage: 'VERIFICATION_APPROVED' })
      mockWorkflowEvent.create.mockResolvedValueOnce({ id: 'evt-005' })

      await workflowOrchestratorService.onVerificationApproved({
        orgId:            'org-001',
        reviewedByUserId: 'admin-001',
      })

      const stageData = mockWorkflowStage.create.mock.calls[0][0].data
      expect(stageData.subjectType).toBe('ORGANIZATION')
      expect(stageData.stage).toBe('VERIFICATION_APPROVED')
      expect(mockWorkflowEvent.create.mock.calls[0][0].data.eventType).toBe('verification.approved')
    })
  })

  describe('onVerificationRejected()', () => {
    it('appends VERIFICATION_REJECTED with reason metadata and emits event', async () => {
      // VERIFICATION_UNDER_REVIEW → VERIFICATION_REJECTED is valid
      mockWorkflowStage.findFirst.mockResolvedValueOnce({ stage: 'VERIFICATION_UNDER_REVIEW' })
      mockWorkflowStage.create.mockResolvedValueOnce({ id: 'stg-006', stage: 'VERIFICATION_REJECTED' })
      mockWorkflowEvent.create.mockResolvedValueOnce({ id: 'evt-006' })

      await workflowOrchestratorService.onVerificationRejected({
        orgId:            'org-001',
        reviewedByUserId: 'admin-001',
        reason:           'Insurance expired',
      })

      const stageData = mockWorkflowStage.create.mock.calls[0][0].data
      expect(stageData.stage).toBe('VERIFICATION_REJECTED')
      expect(stageData.metadata).toEqual({ reason: 'Insurance expired' })
      expect(mockWorkflowEvent.create.mock.calls[0][0].data.eventType).toBe('verification.rejected')
    })
  })
})
