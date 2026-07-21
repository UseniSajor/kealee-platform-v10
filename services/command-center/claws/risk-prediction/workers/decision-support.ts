import type { PrismaClient } from '@prisma/client';
import type { EventBus } from '@kealee/events';
import { createEvent } from '@kealee/events';
import { KEALEE_QUEUES, createWorker } from '@kealee/queue';
import { AIProvider } from '@kealee/ai';
import type { ClawConfig } from '../../base-claw';
import { DECISION_SUPPORT_PROMPT } from '../ai/prompts';
import type { Job } from 'bullmq';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DecisionOption {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  costImpact: { min: number; max: number; unit: string };
  scheduleImpact: { days: number; direction: string };
  riskReduction: number;
}

interface DecisionResult {
  question: string;
  recommendation: string;
  confidence: number;
  reasoning: string;
  options: DecisionOption[];
  risks: Array<{ description: string; likelihood: string; mitigation: string }>;
  dataPoints: Array<{ label: string; value: string; source: string }>;
}

/**
 * Decision Support Worker
 *
 * Responsibilities:
 * - Generate 2-3 options with tradeoffs via AI
 * - Create DecisionLog records in PENDING status
 * - Record acceptance/rejection of decisions
 *
 * GUARDRAILS:
 * - Cannot auto-execute decisions (must be explicitly accepted by user)
 * - Cannot directly edit contracts, budgets, schedules, or permits
 * - Cannot trigger payments, filings, or external actions
 */
export function registerDecisionSupportWorker(
  prisma: PrismaClient,
  eventBus: EventBus,
  config: ClawConfig,
  ai: AIProvider,
  assertWritable: (model: string) => void,
): void {

  createWorker(KEALEE_QUEUES.DECISION_SUPPORT, async (job: Job) => {
    switch (job.name) {
      case 'generate-decision':
        await handleGenerateDecision(job);
        break;
      case 'accept-decision':
        await handleAcceptDecision(job);
        break;
      case 'reject-decision':
        await handleRejectDecision(job);
        break;
    }
  });

  // -------------------------------------------------------------------------
  // Generate Decision -- AI creates 2-3 options with tradeoffs
  // -------------------------------------------------------------------------

  async function handleGenerateDecision(job: Job): Promise<void> {
    const {
      predictionId,
      projectId,
      organizationId,
      riskType,
      riskDescription,
      signals,
      triggerEvent,
    } = job.data as {
      predictionId: string;
      projectId: string;
      organizationId: string;
      riskType: string;
      riskDescription: string;
      signals: Record<string, unknown>;
      triggerEvent?: { eventId: string; eventType: string };
    };

    assertWritable('DecisionLog');

    // Gather additional project context for better decision options
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, status: true, startDate: true, endDate: true },
    });

    // Get recent predictions for this project to provide broader context
    const recentPredictions = await prisma.prediction.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        type: true,
        probability: true,
        impact: true,
        description: true,
      },
    });

    // Map risk type to decision type
    const decisionType = mapRiskTypeToDecisionType(riskType);

    // AI generates decision options
    const aiResult = await ai.reason({
      task:
        `A ${riskType} risk has been identified for project "${project?.name ?? projectId}": ` +
        `"${riskDescription}". Generate 2-3 actionable options for the project manager.`,
      context: {
        riskType,
        riskDescription,
        predictionId,
        project,
        signals,
        recentPredictions,
      },
      systemPrompt: DECISION_SUPPORT_PROMPT,
    });

    const decision = aiResult as unknown as DecisionResult;
    if (!decision || !decision.options || decision.options.length === 0) {
      console.warn(
        `[${config.name}] AI returned empty decision options for prediction ${predictionId}`,
      );
      return;
    }

    // Persist DecisionLog as PENDING (user must explicitly accept or reject)
    const record = await prisma.decisionLog.create({
      data: {
        projectId,
        type: decisionType,
        question: decision.question || `How to address ${riskType} risk?`,
        context: {
          predictionId,
          riskType,
          riskDescription,
          signals,
        },
        recommendation: decision.recommendation || decision.options[0]?.title || '',
        confidence: decision.confidence ?? 0.5,
        reasoning: decision.reasoning ?? null,
        alternatives: decision.options,
        risks: decision.risks ?? [],
        dataPoints: decision.dataPoints ?? [],
        accepted: null, // PENDING -- must be explicitly decided
      },
    });

    // Publish decision.recommended event
    const recommendedEvent = createEvent({
      type: 'decision.recommended',
      source: config.name,
      projectId,
      organizationId,
      payload: {
        decisionLogId: record.id,
        predictionId,
        type: decisionType,
        recommendation: decision.recommendation,
        optionCount: decision.options.length,
        confidence: decision.confidence,
      },
      entity: { type: 'DecisionLog', id: record.id },
      trigger: triggerEvent,
    });
    await eventBus.publish(recommendedEvent);

    // Log to AI conversation for audit trail
    assertWritable('AIConversation');

    await prisma.aIConversation.create({
      data: {
        projectId,
        userId: 'system', // System-initiated decision
        title: `Decision: ${decision.question || riskType}`,
        messages: [
          {
            role: 'system',
            content: `Risk prediction triggered decision analysis for ${riskType}`,
            timestamp: new Date().toISOString(),
          },
          {
            role: 'assistant',
            content: JSON.stringify({
              recommendation: decision.recommendation,
              options: decision.options.map((o) => o.title),
              confidence: decision.confidence,
            }),
            timestamp: new Date().toISOString(),
          },
        ],
        context: { predictionId, decisionLogId: record.id },
        model: 'kealee-risk-engine',
      },
    });
  }

  // -------------------------------------------------------------------------
  // Accept Decision -- user explicitly accepts a recommended decision
  // -------------------------------------------------------------------------

  async function handleAcceptDecision(job: Job): Promise<void> {
    const { decisionLogId, projectId, organizationId, userId, feedback } =
      job.data as {
        decisionLogId: string;
        projectId: string;
        organizationId: string;
        userId: string;
        feedback?: string;
      };

    assertWritable('DecisionLog');

    const existing = await prisma.decisionLog.findUnique({
      where: { id: decisionLogId },
    });

    if (!existing) {
      console.warn(`[${config.name}] DecisionLog ${decisionLogId} not found`);
      return;
    }

    if (existing.accepted !== null) {
      console.warn(
        `[${config.name}] DecisionLog ${decisionLogId} already resolved (accepted=${existing.accepted})`,
      );
      return;
    }

    await prisma.decisionLog.update({
      where: { id: decisionLogId },
      data: {
        accepted: true,
        acceptedAt: new Date(),
        feedback: feedback ?? null,
      },
    });

    // Publish decision.accepted event
    const acceptedEvent = createEvent({
      type: 'decision.accepted',
      source: config.name,
      projectId,
      organizationId,
      payload: {
        decisionLogId,
        acceptedBy: userId,
        recommendation: existing.recommendation,
      },
      entity: { type: 'DecisionLog', id: decisionLogId },
    });
    await eventBus.publish(acceptedEvent);
  }

  // -------------------------------------------------------------------------
  // Reject Decision -- user explicitly rejects a recommended decision
  // -------------------------------------------------------------------------

  async function handleRejectDecision(job: Job): Promise<void> {
    const { decisionLogId, projectId, organizationId, userId, feedback } =
      job.data as {
        decisionLogId: string;
        projectId: string;
        organizationId: string;
        userId: string;
        feedback?: string;
      };

    assertWritable('DecisionLog');

    const existing = await prisma.decisionLog.findUnique({
      where: { id: decisionLogId },
    });

    if (!existing) {
      console.warn(`[${config.name}] DecisionLog ${decisionLogId} not found`);
      return;
    }

    if (existing.accepted !== null) {
      console.warn(
        `[${config.name}] DecisionLog ${decisionLogId} already resolved (accepted=${existing.accepted})`,
      );
      return;
    }

    await prisma.decisionLog.update({
      where: { id: decisionLogId },
      data: {
        accepted: false,
        acceptedAt: new Date(),
        feedback: feedback ?? null,
      },
    });

    // Publish decision.rejected event
    const rejectedEvent = createEvent({
      type: 'decision.rejected',
      source: config.name,
      projectId,
      organizationId,
      payload: {
        decisionLogId,
        rejectedBy: userId,
        feedback: feedback ?? null,
      },
      entity: { type: 'DecisionLog', id: decisionLogId },
    });
    await eventBus.publish(rejectedEvent);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function mapRiskTypeToDecisionType(riskType: string): string {
    const mapping: Record<string, string> = {
      DELAY: 'SCHEDULE',
      COSTOVERRUN: 'BUDGET',
      QUALITYISSUE: 'QUALITY',
      SAFETY: 'QUALITY',
    };
    return mapping[riskType] ?? 'SCOPE';
  }
}
