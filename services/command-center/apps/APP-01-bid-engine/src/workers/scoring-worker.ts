/**
 * Contractor Scoring Worker
 *
 * Listens to platform events and updates contractor scores incrementally.
 * Also handles weekly full recalculation via cron job.
 */

import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createWorker, queues, QUEUE_NAMES, JOB_OPTIONS } from '../../../../shared/queue.js';
import { getEventBus, EVENT_TYPES } from '../../../../shared/events.js';
import { ContractorScoringService } from '@kealee/scoring';

const prisma = new PrismaClient();
const eventBus = getEventBus('scoring-worker');
const scoringService = new ContractorScoringService();

// ============================================================================
// EVENT LISTENERS — Subscribe to platform events and update scores
// ============================================================================

export function initScoringEventListeners(): void {
  // Bid submitted → update responsiveness
  eventBus.on(EVENT_TYPES.BID_SUBMITTED, async (event: any) => {
    const contractorId = event.data?.contractorId;
    if (!contractorId) return;

    try {
      await scoringService.updateFromEvent({
        type: 'bid_submitted',
        contractorId,
        data: {
          responseTimeHours: event.data.responseTimeHours || 24,
          bidRequestId: event.data.bidRequestId,
        },
      });

      await emitScoreUpdate(contractorId);
    } catch (err) {
      console.error('[ScoringWorker] Failed to process bid_submitted:', err);
    }
  });

  // Visit completed with photos → update upload compliance
  eventBus.on(EVENT_TYPES.VISIT_COMPLETED, async (event: any) => {
    const contractorId = event.data?.contractorId;
    if (!contractorId) return;

    try {
      await scoringService.updateFromEvent({
        type: 'photo_uploaded',
        contractorId,
        data: { visitId: event.data.visitId, photoCount: event.data.photoCount || 0 },
      });

      await emitScoreUpdate(contractorId);
    } catch (err) {
      console.error('[ScoringWorker] Failed to process visit_completed:', err);
    }
  });

  // Task/milestone completed → update schedule adherence
  eventBus.on(EVENT_TYPES.TASK_COMPLETED, async (event: any) => {
    const contractorId = event.data?.contractorId;
    if (!contractorId) return;

    try {
      await scoringService.updateFromEvent({
        type: 'milestone_completed',
        contractorId,
        data: {
          taskId: event.data.taskId,
          daysLate: event.data.daysLate || 0,
          projectId: event.data.projectId,
        },
      });

      await emitScoreUpdate(contractorId);
    } catch (err) {
      console.error('[ScoringWorker] Failed to process task_completed:', err);
    }
  });

  // QA inspection result → update quality + safety
  eventBus.on((EVENT_TYPES as any).QA_PASSED || 'kealee.ai.qa_passed', async (event: any) => {
    const contractorId = event.data?.contractorId;
    if (!contractorId) return;

    try {
      await scoringService.updateFromEvent({
        type: 'qa_result',
        contractorId,
        data: { passed: true, inspectionId: event.data.inspectionId },
      });

      await emitScoreUpdate(contractorId);
    } catch (err) {
      console.error('[ScoringWorker] Failed to process qa_passed:', err);
    }
  });

  eventBus.on((EVENT_TYPES as any).QA_FAILED || EVENT_TYPES.QA_ISSUE_DETECTED, async (event: any) => {
    const contractorId = event.data?.contractorId;
    if (!contractorId) return;

    try {
      await scoringService.updateFromEvent({
        type: 'qa_result',
        contractorId,
        data: {
          passed: false,
          severity: event.data.severity || 'major',
          safetyViolation: event.data.safetyViolation || false,
          inspectionId: event.data.inspectionId,
        },
      });

      await emitScoreUpdate(contractorId);
    } catch (err) {
      console.error('[ScoringWorker] Failed to process qa_failed:', err);
    }
  });

  // Message delivered → update responsiveness
  eventBus.on(EVENT_TYPES.MESSAGE_DELIVERED, async (event: any) => {
    const contractorId = event.data?.contractorId;
    if (!contractorId) return;

    try {
      await scoringService.updateFromEvent({
        type: 'message_replied',
        contractorId,
        data: { replyTimeHours: event.data.replyTimeHours || 12 },
      });

      await emitScoreUpdate(contractorId);
    } catch (err) {
      console.error('[ScoringWorker] Failed to process message_delivered:', err);
    }
  });

  console.log('[ScoringWorker] Event listeners initialized');
}

// ============================================================================
// WORKER — Handles scheduled jobs (weekly recalculation)
// ============================================================================

async function processScoringJob(job: Job): Promise<unknown> {
  const { type, ...data } = job.data;

  switch (type) {
    case 'RECALCULATE_ALL': {
      console.log('[ScoringWorker] Starting weekly recalculation...');
      const result = await scoringService.recalculateAll();
      console.log(`[ScoringWorker] Recalculation complete: ${result.updated} updated, ${result.decayed} decayed`);
      return result;
    }

    case 'CALCULATE_SINGLE': {
      return scoringService.calculateScore(data.contractorId);
    }

    default:
      throw new Error(`Unknown scoring job type: ${type}`);
  }
}

export const scoringWorker = createWorker(
  QUEUE_NAMES.BID_ENGINE, // Reuse bid engine queue for scoring jobs
  processScoringJob,
  { concurrency: 2 }
);

// ============================================================================
// HELPERS
// ============================================================================

async function emitScoreUpdate(contractorId: string): Promise<void> {
  try {
    const score = await (prisma as any).contractorScore?.findUnique?.({
      where: { contractorId },
    });

    if (score) {
      await eventBus.publish(
        (EVENT_TYPES as any).CONTRACTOR_SCORE_UPDATED || 'kealee.scoring.contractor_updated',
        {
          contractorId,
          overallScore: score.overallScore,
          confidence: score.confidence,
          lastCalculated: score.lastCalculated,
        }
      );
    }
  } catch {
    // Non-critical — score event emission failure is acceptable
  }
}

/**
 * Schedule weekly recalculation (call from app startup)
 */
export async function scheduleWeeklyRecalculation(): Promise<void> {
  // Add a repeatable job that runs every Sunday at 2 AM
  await queues.BID_ENGINE.add(
    'scoring-recalculate-all',
    { type: 'RECALCULATE_ALL' },
    {
      ...JOB_OPTIONS.LOW_PRIORITY,
      repeat: {
        pattern: '0 2 * * 0', // Every Sunday at 2 AM
      },
    }
  );

  console.log('[ScoringWorker] Weekly recalculation scheduled (Sunday 2 AM)');
}
