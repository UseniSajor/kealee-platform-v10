/**
 * workflow-stage.service.ts
 *
 * Append-only stage log for canonical subjects.
 * Does NOT replace Organization / Project / Engagement / ProfessionalAssignment.
 * It wraps them, recording the stage timeline.
 */

import { prismaAny } from '../../utils/prisma-helper'
import { VALID_TRANSITIONS } from './workflow.constants'
import type {
  AppendStageInput,
  StageTimeline,
  WorkflowStageName,
  WorkflowSubjectType,
} from './workflow.types'

class WorkflowStageService {
  /**
   * Append a new stage to a subject's timeline.
   * Validates that the transition is allowed unless allowForce=true.
   */
  async appendStage(input: AppendStageInput, allowForce = false): Promise<void> {
    const { subjectType, subjectId, stage, enteredById, metadata } = input

    if (!allowForce) {
      await this._validateTransition(subjectType, subjectId, stage)
    }

    await prismaAny.workflowStage.create({
      data: {
        subjectType,
        subjectId,
        stage,
        enteredById: enteredById ?? null,
        metadata: metadata ?? null,
      },
    })
  }

  /**
   * Returns the most recent stage for a subject, or null if none exists.
   */
  async getCurrentStage(
    subjectType: WorkflowSubjectType,
    subjectId: string,
  ): Promise<WorkflowStageName | null> {
    const row = await prismaAny.workflowStage.findFirst({
      where: { subjectType, subjectId },
      orderBy: { enteredAt: 'desc' },
      select: { stage: true },
    })
    return row?.stage ?? null
  }

  /**
   * Returns the full stage timeline for a subject, ordered oldest first.
   */
  async getTimeline(
    subjectType: WorkflowSubjectType,
    subjectId: string,
  ): Promise<StageTimeline> {
    const rows = await prismaAny.workflowStage.findMany({
      where: { subjectType, subjectId },
      orderBy: { enteredAt: 'asc' },
      select: { stage: true, enteredAt: true, enteredById: true, metadata: true },
    })

    return {
      subjectType,
      subjectId,
      stages: rows,
      currentStage: rows.length > 0 ? rows[rows.length - 1].stage : null,
    }
  }

  /**
   * Returns true if the subject has ever entered the given stage.
   */
  async hasReachedStage(
    subjectType: WorkflowSubjectType,
    subjectId: string,
    stage: WorkflowStageName,
  ): Promise<boolean> {
    const row = await prismaAny.workflowStage.findFirst({
      where: { subjectType, subjectId, stage },
      select: { id: true },
    })
    return row !== null
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private async _validateTransition(
    subjectType: WorkflowSubjectType,
    subjectId: string,
    targetStage: WorkflowStageName,
  ): Promise<void> {
    const current = await this.getCurrentStage(subjectType, subjectId)

    if (current === null) {
      // First stage — any entry is valid
      return
    }

    const allowed = VALID_TRANSITIONS[current]
    if (allowed && !allowed.includes(targetStage)) {
      throw new Error(
        `Invalid workflow transition: ${current} → ${targetStage} for ${subjectType}:${subjectId}`,
      )
    }
  }
}

export const workflowStageService = new WorkflowStageService()
