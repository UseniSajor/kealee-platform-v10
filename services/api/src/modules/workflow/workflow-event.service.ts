/**
 * workflow-event.service.ts
 *
 * Durable event emission with idempotency guard.
 * Enables reliable event replay, audit trails, and side-effect orchestration.
 */

import { prismaAny } from '../../utils/prisma-helper'
import type { EmitWorkflowEventInput, WorkflowSubjectType } from './workflow.types'

class WorkflowEventService {
  /**
   * Emit a workflow event. Idempotent — if idempotencyKey already exists,
   * returns the existing record without error.
   */
  async emit(input: EmitWorkflowEventInput) {
    const existing = await prismaAny.workflowEvent.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    })
    if (existing) return existing

    return prismaAny.workflowEvent.create({
      data: {
        eventType:      input.eventType,
        subjectType:    input.subjectType,
        subjectId:      input.subjectId,
        idempotencyKey: input.idempotencyKey,
        payload:        input.payload ?? null,
      },
    })
  }

  /**
   * Mark a workflow event as processed (e.g. after side effects run).
   */
  async markProcessed(idempotencyKey: string) {
    return prismaAny.workflowEvent.update({
      where: { idempotencyKey },
      data: { processedAt: new Date() },
    })
  }

  /**
   * Get all events for a subject, newest first.
   */
  async getEventsForSubject(subjectType: WorkflowSubjectType, subjectId: string) {
    return prismaAny.workflowEvent.findMany({
      where: { subjectType, subjectId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get unprocessed events of a given type (for worker/queue processing).
   */
  async getUnprocessedByType(eventType: string, limit = 100) {
    return prismaAny.workflowEvent.findMany({
      where: { eventType, processedAt: null },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })
  }

  /**
   * Build a deterministic idempotency key.
   * Format: <eventType>:<subjectType>:<subjectId>:<discriminator>
   */
  static buildKey(
    eventType: string,
    subjectType: WorkflowSubjectType,
    subjectId: string,
    discriminator?: string,
  ): string {
    const parts = [eventType, subjectType, subjectId]
    if (discriminator) parts.push(discriminator)
    return parts.join(':')
  }
}

export const workflowEventService = new WorkflowEventService()
export { WorkflowEventService }
