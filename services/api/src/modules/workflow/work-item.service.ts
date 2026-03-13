/**
 * work-item.service.ts
 *
 * Manages actionable tasks: assignment acceptance windows, verification
 * uploads, review queues, contract signatures, escrow funding, etc.
 */

import { prismaAny } from '../../utils/prisma-helper'
import type {
  CompleteWorkItemInput,
  CreateWorkItemInput,
  WorkItemStatus,
  WorkItemType,
  WorkflowSubjectType,
} from './workflow.types'

class WorkItemService {
  /**
   * Create a new open work item.
   */
  async createWorkItem(input: CreateWorkItemInput) {
    return prismaAny.workItem.create({
      data: {
        type:             input.type,
        subjectType:      input.subjectType,
        subjectId:        input.subjectId,
        organizationId:   input.organizationId   ?? null,
        assignedToUserId: input.assignedToUserId ?? null,
        assignedToOrgId:  input.assignedToOrgId  ?? null,
        title:            input.title            ?? null,
        description:      input.description      ?? null,
        dueAt:            input.dueAt            ?? null,
        metadata:         input.metadata         ?? null,
        createdBySystem:  input.createdBySystem  ?? false,
      },
    })
  }

  /**
   * Mark a work item as COMPLETED.
   */
  async completeWorkItem(input: CompleteWorkItemInput) {
    return prismaAny.workItem.update({
      where: { id: input.workItemId },
      data: {
        status:       'COMPLETED',
        completedAt:  new Date(),
        completedById: input.completedById ?? null,
        ...(input.metadata
          ? { metadata: input.metadata }
          : {}),
      },
    })
  }

  /**
   * Mark a work item as DECLINED.
   */
  async declineWorkItem(workItemId: string, completedById?: string) {
    return prismaAny.workItem.update({
      where: { id: workItemId },
      data: {
        status:       'DECLINED',
        completedAt:  new Date(),
        completedById: completedById ?? null,
      },
    })
  }

  /**
   * Mark a work item as EXPIRED (called by scheduler / worker).
   */
  async expireWorkItem(workItemId: string) {
    return prismaAny.workItem.update({
      where: { id: workItemId },
      data: { status: 'EXPIRED', completedAt: new Date() },
    })
  }

  /**
   * Expire all OPEN work items of a given type for a subject that have
   * passed their dueAt deadline. Returns count of expired items.
   */
  async expireOverdueItems(subjectType: WorkflowSubjectType, subjectId: string): Promise<number> {
    const result = await prismaAny.workItem.updateMany({
      where: {
        subjectType,
        subjectId,
        status: 'OPEN',
        dueAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED', completedAt: new Date() },
    })
    return result.count
  }

  /**
   * Query open work items for a user.
   */
  async getOpenItemsForUser(userId: string) {
    return prismaAny.workItem.findMany({
      where: { assignedToUserId: userId, status: 'OPEN' },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
    })
  }

  /**
   * Query open work items for an org.
   */
  async getOpenItemsForOrg(orgId: string) {
    return prismaAny.workItem.findMany({
      where: {
        status: 'OPEN',
        OR: [{ assignedToOrgId: orgId }, { organizationId: orgId }],
      },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
    })
  }

  /**
   * Query open work items for a subject.
   */
  async getOpenItemsForSubject(subjectType: WorkflowSubjectType, subjectId: string) {
    return prismaAny.workItem.findMany({
      where: { subjectType, subjectId, status: 'OPEN' },
      orderBy: [{ dueAt: 'asc' }],
    })
  }

  /**
   * Get all open items of a given type across all subjects (e.g. admin review queue).
   */
  async getOpenItemsByType(type: WorkItemType, statusFilter: WorkItemStatus = 'OPEN') {
    return prismaAny.workItem.findMany({
      where: { type, status: statusFilter },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
    })
  }

  /**
   * Cancel a work item (soft-delete; preserves audit trail).
   */
  async cancelWorkItem(workItemId: string) {
    return prismaAny.workItem.update({
      where: { id: workItemId },
      data: { status: 'CANCELED', completedAt: new Date() },
    })
  }
}

export const workItemService = new WorkItemService()
