import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent } from '@kealee/events';
import { KEALEE_QUEUES, createQueue, createWorker } from '@kealee/queue';
import { AIProvider } from '@kealee/ai';
import type { ClawConfig } from '../../base-claw';
import { RISK_ASSESSMENT_PROMPT, PREDICTION_PROMPT } from '../ai/prompts';
import type { Job } from 'bullmq';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectSignals {
  projectId: string;
  organizationId: string;
  budgetVariance: number | null;
  budgetBurnRate: number | null;
  scheduleFloatDays: number | null;
  criticalPathSlipTrend: number;
  activePermits: number;
  pendingPermits: number;
  expiredPermits: number;
  inspectionPassRate: number | null;
  changeOrderCount: number;
  changeOrderDollarImpact: number;
  weatherDisruptionDays: number;
}

interface PredictionResult {
  type: string;
  probability: number;
  confidence: number;
  impact: string;
  description: string;
  factors: Array<{ name: string; weight: number; value: string }>;
  recommendedAction: string;
}

interface RiskAssessmentResult {
  overallScore: number;
  riskLevel: string;
  categories: Record<string, unknown>;
  recommendations: Array<{ priority: string; action: string; rationale: string }>;
}

// Confidence threshold -- predictions below this are discarded
const CONFIDENCE_THRESHOLD = 0.7;

// Prediction types to evaluate for each project
const PREDICTION_TYPES = ['DELAY', 'COSTOVERRUN', 'QUALITYISSUE', 'SAFETY'] as const;

/**
 * Predictive Engine Worker
 *
 * Responsibilities:
 * - Gather project signals (budget variance, schedule float, permit status, etc.)
 * - Run AI predictions with confidence > 0.7 threshold
 * - Nightly full risk assessment (cron 5 AM)
 *
 * GUARDRAILS:
 * - Cannot directly edit contracts, budgets, schedules, or permits
 * - Cannot auto-execute decisions (must be explicitly accepted)
 * - Cannot trigger payments, filings, or external actions
 */
export function registerPredictiveEngineWorker(
  prisma: PrismaClient,
  eventBus: EventBus,
  config: ClawConfig,
  ai: AIProvider,
  assertWritable: (model: string) => void,
): void {

  createWorker(KEALEE_QUEUES.PREDICTIVE_ENGINE, async (job: Job) => {
    switch (job.name) {
      case 'analyze-signals':
        await handleAnalyzeSignals(job);
        break;
      case 'run-prediction':
        await handleRunPrediction(job);
        break;
      case 'nightly-risk-assessment':
        await handleNightlyRiskAssessment(job);
        break;
    }
  });

  // -------------------------------------------------------------------------
  // Analyze Signals -- triggered by incoming domain events
  // -------------------------------------------------------------------------

  async function handleAnalyzeSignals(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    const { projectId, organizationId } = event;
    if (!projectId) return;

    // Gather all project signals (read-only from other domains)
    const signals = await gatherProjectSignals(projectId, organizationId);

    // Queue individual predictions for each risk type
    const queue = createQueue(KEALEE_QUEUES.PREDICTIVE_ENGINE);
    for (const predictionType of PREDICTION_TYPES) {
      await queue.add('run-prediction', {
        signals,
        predictionType,
        triggerEvent: { eventId: event.id, eventType: event.type },
      });
    }
  }

  // -------------------------------------------------------------------------
  // Run Prediction -- AI-powered risk prediction for a single type
  // -------------------------------------------------------------------------

  async function handleRunPrediction(job: Job): Promise<void> {
    const { signals, predictionType, triggerEvent } = job.data as {
      signals: ProjectSignals;
      predictionType: string;
      triggerEvent?: { eventId: string; eventType: string };
    };

    assertWritable('Prediction');

    // AI prediction
    const aiResult = await ai.reason({
      task: `Predict the likelihood of a ${predictionType} risk for this construction project.`,
      context: {
        predictionType,
        signals,
      },
      systemPrompt: PREDICTION_PROMPT,
    });

    const prediction = aiResult as unknown as PredictionResult;

    // THRESHOLD GATE -- discard low-confidence predictions
    if (!prediction || prediction.confidence < CONFIDENCE_THRESHOLD) {
      console.log(
        `[${config.name}] Prediction ${predictionType} for project ${signals.projectId} ` +
        `below confidence threshold (${prediction?.confidence ?? 0} < ${CONFIDENCE_THRESHOLD}). Discarded.`,
      );
      return;
    }

    // Persist prediction
    const record = await prisma.prediction.create({
      data: {
        projectId: signals.projectId,
        type: prediction.type || predictionType,
        probability: prediction.probability,
        confidence: prediction.confidence,
        impact: prediction.impact || 'MEDIUM',
        description: prediction.description || `${predictionType} risk detected`,
        factors: prediction.factors ?? [],
        recommendedAction: prediction.recommendedAction ?? null,
      },
    });

    // Publish prediction.created event
    const predictionEvent = createEvent({
      type: `prediction.created`,
      source: config.name,
      projectId: signals.projectId,
      organizationId: signals.organizationId,
      payload: {
        predictionId: record.id,
        type: prediction.type || predictionType,
        probability: prediction.probability,
        confidence: prediction.confidence,
        impact: prediction.impact,
      },
      entity: { type: 'Prediction', id: record.id },
      trigger: triggerEvent,
    });
    await eventBus.publish(predictionEvent);

    // If high-impact + high-probability, queue decision support
    if (
      prediction.probability >= 0.6 &&
      (prediction.impact === 'HIGH' || prediction.impact === 'CRITICAL')
    ) {
      const decisionQueue = createQueue(KEALEE_QUEUES.DECISION_SUPPORT);
      await decisionQueue.add('generate-decision', {
        predictionId: record.id,
        projectId: signals.projectId,
        organizationId: signals.organizationId,
        riskType: prediction.type || predictionType,
        riskDescription: prediction.description,
        signals,
        triggerEvent,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Nightly Risk Assessment -- full project portfolio scan (cron 5 AM)
  // -------------------------------------------------------------------------

  async function handleNightlyRiskAssessment(_job: Job): Promise<void> {
    assertWritable('RiskAssessment');

    // Fetch all active projects
    const projects = await prisma.project.findMany({
      where: { status: { in: ['ACTIVE', 'IN_PROGRESS'] } },
      select: { id: true, organizationId: true, name: true },
    });

    for (const project of projects) {
      const signals = await gatherProjectSignals(project.id, project.organizationId);

      // AI full risk assessment
      const aiResult = await ai.reason({
        task: `Perform a comprehensive risk assessment for project "${project.name}".`,
        context: { signals },
        systemPrompt: RISK_ASSESSMENT_PROMPT,
      });

      const assessment = aiResult as unknown as RiskAssessmentResult;
      if (!assessment) continue;

      // Persist risk assessment
      const record = await prisma.riskAssessment.create({
        data: {
          projectId: project.id,
          overallScore: assessment.overallScore ?? 50,
          riskLevel: assessment.riskLevel ?? 'MEDIUM',
          categories: assessment.categories ?? {},
          recommendations: assessment.recommendations ?? [],
          assessedBy: 'AI',
        },
      });

      // Publish risk.assessment.created
      const assessmentEvent = createEvent({
        type: 'risk.assessment.created',
        source: config.name,
        projectId: project.id,
        organizationId: project.organizationId,
        payload: {
          assessmentId: record.id,
          overallScore: assessment.overallScore,
          riskLevel: assessment.riskLevel,
        },
        entity: { type: 'RiskAssessment', id: record.id },
      });
      await eventBus.publish(assessmentEvent);

      // If CRITICAL or HIGH, publish update event for dashboards
      if (assessment.riskLevel === 'CRITICAL' || assessment.riskLevel === 'HIGH') {
        const alertEvent = createEvent({
          type: 'risk.assessment.updated',
          source: config.name,
          projectId: project.id,
          organizationId: project.organizationId,
          payload: {
            assessmentId: record.id,
            riskLevel: assessment.riskLevel,
            requiresAttention: true,
          },
          entity: { type: 'RiskAssessment', id: record.id },
        });
        await eventBus.publish(alertEvent);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Signal Gathering -- READ-ONLY queries across domains
  // -------------------------------------------------------------------------

  async function gatherProjectSignals(
    projectId: string,
    organizationId: string,
  ): Promise<ProjectSignals> {
    // Budget signals (read-only)
    const budgetItems = await prisma.budgetItem.findMany({
      where: { projectId },
      select: { plannedAmount: true, actualAmount: true },
    });

    const totalPlanned = budgetItems.reduce(
      (sum, b) => sum + (Number(b.plannedAmount) || 0), 0,
    );
    const totalActual = budgetItems.reduce(
      (sum, b) => sum + (Number(b.actualAmount) || 0), 0,
    );
    const budgetVariance = totalPlanned > 0
      ? ((totalActual - totalPlanned) / totalPlanned) * 100
      : null;

    // Schedule signals (read-only)
    const scheduleItems = await prisma.scheduleItem.findMany({
      where: { projectId },
      select: {
        floatDays: true,
        isCriticalPath: true,
        status: true,
      },
    });

    const criticalPathItems = scheduleItems.filter((s) => s.isCriticalPath);
    const minFloat = criticalPathItems.length > 0
      ? Math.min(...criticalPathItems.map((s) => Number(s.floatDays) || 0))
      : null;
    const slippingCritical = criticalPathItems.filter(
      (s) => (Number(s.floatDays) || 0) < 0,
    ).length;

    // Permit signals (read-only)
    const permits = await prisma.permit.findMany({
      where: { projectId },
      select: { status: true, expiresAt: true },
    });

    const activePermits = permits.filter((p) => p.status === 'APPROVED' || p.status === 'ACTIVE').length;
    const pendingPermits = permits.filter((p) => p.status === 'PENDING' || p.status === 'SUBMITTED').length;
    const expiredPermits = permits.filter((p) => p.status === 'EXPIRED').length;

    // Inspection signals (read-only, last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
    const inspections = await prisma.inspection.findMany({
      where: {
        projectId,
        scheduledDate: { gte: thirtyDaysAgo },
      },
      select: { status: true, result: true },
    });

    const completedInspections = inspections.filter(
      (i) => i.status === 'COMPLETED',
    );
    const passedInspections = completedInspections.filter(
      (i) => i.result === 'PASS' || i.result === 'PASSED',
    );
    const inspectionPassRate = completedInspections.length > 0
      ? passedInspections.length / completedInspections.length
      : null;

    // Change order signals (read-only)
    const changeOrders = await prisma.changeOrder.findMany({
      where: { projectId },
      select: { totalAmount: true },
    });

    const changeOrderCount = changeOrders.length;
    const changeOrderDollarImpact = changeOrders.reduce(
      (sum, co) => sum + (Number(co.totalAmount) || 0), 0,
    );

    // Weather signals (read-only)
    const weatherLogs = await prisma.weatherLog.findMany({
      where: {
        projectId,
        date: { gte: new Date() },
      },
      select: { isWorkDay: true },
      take: 14,
    });

    const weatherDisruptionDays = weatherLogs.filter((w) => !w.isWorkDay).length;

    return {
      projectId,
      organizationId,
      budgetVariance,
      budgetBurnRate: null, // Calculated from historical snapshots if available
      scheduleFloatDays: minFloat,
      criticalPathSlipTrend: slippingCritical,
      activePermits,
      pendingPermits,
      expiredPermits,
      inspectionPassRate,
      changeOrderCount,
      changeOrderDollarImpact,
      weatherDisruptionDays,
    };
  }
}
