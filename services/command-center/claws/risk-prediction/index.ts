import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent } from '@kealee/events';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';
import { AIProvider } from '@kealee/ai';
import { BaseClaw } from '../base-claw';
import { registerPredictiveEngineWorker } from './workers/predictive-engine';
import { registerDecisionSupportWorker } from './workers/decision-support';

// Config per architecture doc SS12
const CLAW_CONFIG = {
  name: 'risk-prediction-claw',
  eventPatterns: [
    'budget.*',
    'schedule.*',
    'permit.*',
    'qualityissue.*',
    'prediction.*',
    'inspection.*',
  ],
  writableModels: ['Prediction', 'RiskAssessment', 'DecisionLog', 'AIConversation'],
};

/**
 * Claw G: Risk, Prediction & Decision Support
 *
 * Consumes events from budget, schedule, permit, quality, and inspection domains
 * to produce AI-powered risk predictions and decision recommendations.
 *
 * READ-ONLY to all other domains -- writes only to Prediction, RiskAssessment,
 * DecisionLog, and AIConversation models.
 *
 * GUARDRAILS:
 * - Cannot directly edit contracts, budgets, schedules, or permits
 * - Cannot auto-execute decisions (must be explicitly accepted)
 * - Cannot trigger payments, filings, or external actions
 */
export class RiskPredictionClaw extends BaseClaw {
  private ai: AIProvider;

  constructor(eventBus: EventBus, prisma: PrismaClient) {
    super(eventBus, prisma, CLAW_CONFIG);
    this.ai = new AIProvider();
  }

  // ---------------------------------------------------------------------------
  // Event Handler -- route domain events to the predictive-engine queue
  // ---------------------------------------------------------------------------

  async handleEvent(event: KealeeEventEnvelope): Promise<void> {
    switch (event.type) {
      // Budget domain signals
      case 'budget.updated':
      case 'budget.alert.variance.high': {
        const queue = createQueue(KEALEE_QUEUES.PREDICTIVE_ENGINE);
        await queue.add('analyze-signals', { event });
        break;
      }

      // Schedule domain signals
      case 'schedule.updated':
      case 'schedule.criticalpath.changed': {
        const queue = createQueue(KEALEE_QUEUES.PREDICTIVE_ENGINE);
        await queue.add('analyze-signals', { event });
        break;
      }

      // Permit domain signals
      case 'permit.status.changed': {
        const queue = createQueue(KEALEE_QUEUES.PREDICTIVE_ENGINE);
        await queue.add('analyze-signals', { event });
        break;
      }

      // Inspection domain signals
      case 'inspection.failed.compliance': {
        // Failed compliance inspection is a strong signal -- analyze immediately
        const queue = createQueue(KEALEE_QUEUES.PREDICTIVE_ENGINE);
        await queue.add('analyze-signals', { event, priority: 'HIGH' });

        // Also directly trigger a decision-support evaluation
        const decisionQueue = createQueue(KEALEE_QUEUES.DECISION_SUPPORT);
        await decisionQueue.add('generate-decision', {
          predictionId: null, // Direct trigger, no prediction record yet
          projectId: event.projectId,
          organizationId: event.organizationId,
          riskType: 'QUALITYISSUE',
          riskDescription:
            `Compliance inspection failed: ${(event.payload as any)?.reason ?? 'See inspection details'}`,
          signals: event.payload,
          triggerEvent: { eventId: event.id, eventType: event.type },
        });
        break;
      }

      // Catch-all for other pattern-matched events (budget.*, schedule.*, etc.)
      default: {
        // Only process if the event has a projectId (actionable signal)
        if (event.projectId) {
          const queue = createQueue(KEALEE_QUEUES.PREDICTIVE_ENGINE);
          await queue.add('analyze-signals', { event });
        }
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Worker Registration
  // ---------------------------------------------------------------------------

  async registerWorkers(): Promise<void> {
    const boundAssertWritable = this.assertWritable.bind(this);

    // Register predictive engine worker (signal analysis + AI predictions + nightly cron)
    registerPredictiveEngineWorker(
      this.prisma,
      this.eventBus,
      this.config,
      this.ai,
      boundAssertWritable,
    );

    // Register decision support worker (option generation + accept/reject)
    registerDecisionSupportWorker(
      this.prisma,
      this.eventBus,
      this.config,
      this.ai,
      boundAssertWritable,
    );

    // Schedule nightly full risk assessment -- cron 5 AM Eastern
    const engineQueue = createQueue(KEALEE_QUEUES.PREDICTIVE_ENGINE);
    await engineQueue.add(
      'nightly-risk-assessment',
      {},
      {
        repeat: {
          pattern: '0 5 * * *', // Every day at 5:00 AM
          tz: 'America/New_York',
        },
      },
    );

    console.log(`[${this.config.name}] Nightly risk assessment scheduled at 5:00 AM ET`);
  }
}
