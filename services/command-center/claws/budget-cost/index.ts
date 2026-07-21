import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { KEALEE_QUEUES, createQueue, createWorker } from '@kealee/queue';
import { AIProvider, BUDGET_PROMPT } from '@kealee/ai';
import { BaseClaw } from '../base-claw';
import { VARIANCE_PROMPT, FORECAST_PROMPT } from './ai/prompts';
import { BudgetTrackerWorkerHandlers } from './workers/budget-tracker';
import { VarianceAnalyzerWorkerHandlers } from './workers/variance-analyzer';
import { ForecastEngineWorkerHandlers } from './workers/forecast-engine';
import type { Job } from 'bullmq';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Budget categories per architecture doc S9 */
const BUDGET_CATEGORIES = [
  'LABOR',
  'MATERIAL',
  'EQUIPMENT',
  'SUBCONTRACTOR',
  'PERMITS',
  'OVERHEAD',
  'CONTINGENCY',
] as const;

type BudgetCategory = typeof BUDGET_CATEGORIES[number];

/** Variance thresholds that trigger alerts */
const VARIANCE_THRESHOLDS = {
  /** >15% variance in any single category triggers a category alert */
  CATEGORY_PERCENT: 15,
  /** >10% total project budget variance triggers a total alert */
  TOTAL_PERCENT: 10,
} as const;

// Config per architecture doc S9
const CLAW_CONFIG = {
  name: 'budget-cost-claw',
  eventPatterns: ['estimate.*', 'changeorder.*', 'payment.*'],
  writableModels: [
    'BudgetItem',
    'BudgetLine',
    'BudgetEntry',
    'BudgetTransaction',
    'BudgetSnapshot',
    'BudgetAlert',
    'Prediction',
  ],
};

/**
 * Claw D: Budget & Cost
 *
 * Responsibilities:
 *   - Seed budget from approved estimates (7 categories)
 *   - Recalculate budget on approved change orders
 *   - Record actuals from payment disbursements
 *   - Variance alerts (>15% category or >10% total)
 *   - AI root cause analysis on variance triggers
 *   - Cost forecasting with earned value metrics
 *   - Budget snapshots for trend analysis
 *
 * Events consumed:
 *   estimate.approved, changeorder.approved, payment.disbursed
 *
 * Events published:
 *   budget.seeded.from.estimate, budget.updated,
 *   budget.alert.variance.high, prediction.costoverrun.created
 *
 * GUARDRAILS:
 *   - Cannot modify contracts, change orders, or payment statuses
 *   - Cannot alter schedules
 *   - Cannot approve/reject permits
 */
export class BudgetCostClaw extends BaseClaw {
  private ai: AIProvider;
  private budgetTrackerHandlers: BudgetTrackerWorkerHandlers;
  private varianceHandlers: VarianceAnalyzerWorkerHandlers;
  private forecastHandlers: ForecastEngineWorkerHandlers;

  constructor(eventBus: EventBus, prisma: PrismaClient) {
    super(eventBus, prisma, CLAW_CONFIG);
    this.ai = new AIProvider();

    const boundAssert = this.assertWritable.bind(this);
    this.budgetTrackerHandlers = new BudgetTrackerWorkerHandlers(
      prisma, this.ai, this.eventBus, CLAW_CONFIG.name, boundAssert,
    );
    this.varianceHandlers = new VarianceAnalyzerWorkerHandlers(
      prisma, this.ai, this.eventBus, CLAW_CONFIG.name, boundAssert, VARIANCE_PROMPT,
    );
    this.forecastHandlers = new ForecastEngineWorkerHandlers(
      prisma, this.ai, FORECAST_PROMPT,
    );
  }

  // =========================================================================
  // Event Router
  // =========================================================================

  async handleEvent(event: KealeeEventEnvelope): Promise<void> {
    switch (event.type) {
      // --- Estimate approved -> seed budget from estimate categories ---
      case 'estimate.approved': {
        const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
        await queue.add('seed-budget-from-estimate', { event });
        break;
      }

      // --- Change order approved -> recalculate budget with CO impact ---
      case 'changeorder.approved': {
        const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
        await queue.add('recalculate-for-change-order', { event });
        break;
      }

      // --- Payment disbursed -> record actual costs ---
      case 'payment.disbursed': {
        const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
        await queue.add('record-actual-from-payment', { event });
        break;
      }

      // --- Estimate updated (CTC takeoff confirmed) -> refresh budget if needed ---
      case 'estimate.updated': {
        const p = event.payload as Record<string, any>;
        if (p.status === 'AI_TAKEOFF_CONFIRMED') {
          const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
          await queue.add('ctc-estimate-ready', { event });
        }
        break;
      }
    }
  }

  // =========================================================================
  // Worker Registration
  // =========================================================================

  async registerWorkers(): Promise<void> {
    createWorker(KEALEE_QUEUES.BUDGET_TRACKER, async (job: Job) => {
      switch (job.name) {
        // BudgetTrackerWorkerHandlers
        case 'seed-budget-from-estimate':
          await this.budgetTrackerHandlers.handleSeedBudgetFromEstimate(job);
          break;
        case 'recalculate-for-change-order':
          await this.budgetTrackerHandlers.handleRecalculateForChangeOrder(job);
          break;
        case 'record-actual-from-payment':
          await this.budgetTrackerHandlers.handleRecordActualFromPayment(job);
          break;
        case 'create-snapshot':
          await this.budgetTrackerHandlers.handleCreateSnapshot(job);
          break;
        case 'ctc-estimate-ready':
          await this.budgetTrackerHandlers.handleCTCEstimateReady(job);
          break;
        // VarianceAnalyzerWorkerHandlers
        case 'check-variance-alerts':
          await this.varianceHandlers.handleCheckVarianceAlerts(job);
          break;
        // ForecastEngineWorkerHandlers
        case 'generate-forecast':
          return await this.forecastHandlers.handleGenerateForecast(job);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Handler implementations are in:
  //   workers/budget-tracker.ts     — BudgetTrackerWorkerHandlers
  //   workers/variance-analyzer.ts  — VarianceAnalyzerWorkerHandlers
  //   workers/forecast-engine.ts    — ForecastEngineWorkerHandlers
  // ---------------------------------------------------------------------------
}
