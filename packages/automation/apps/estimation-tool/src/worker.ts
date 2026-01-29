/**
 * Estimation Tool Worker
 * BullMQ job processor for async operations
 */

import { Worker, Queue, Job } from 'bullmq';
import IORedis from 'ioredis';

// Import modules
import { priceUpdater } from './cost-database/price-updater.js';
import { planAnalyzer } from './takeoff/plan-analyzer.js';
import { quantityExtractor } from './takeoff/quantity-extractor.js';
import { estimateCalculator } from './estimates/estimate-calculator.js';
import { revisionManager } from './estimates/revision-manager.js';
import { exportGenerator } from './estimates/export-generator.js';
import { scopeAnalyzer } from './ai/scope-analyzer.js';
import { costPredictor } from './ai/cost-predictor.js';
import { valueEngineer } from './ai/value-engineer.js';
import { comparisonAnalyzer } from './ai/comparison-analyzer.js';
import { assignmentEngine } from './orders/assignment-engine.js';
import { deliveryHandler } from './orders/delivery-handler.js';
import { bidEngineSync } from './integrations/bid-engine-sync.js';
import { budgetTrackerSync } from './integrations/budget-tracker-sync.js';
import { rsMeansImporter } from './integrations/rsmeans-importer.js';

// Job types
export type JobType =
  | 'PRICE_UPDATE'
  | 'PLAN_ANALYSIS'
  | 'QUANTITY_EXTRACTION'
  | 'ESTIMATE_CALCULATION'
  | 'CREATE_REVISION'
  | 'GENERATE_EXPORT'
  | 'SCOPE_ANALYSIS'
  | 'COST_PREDICTION'
  | 'VALUE_ENGINEERING'
  | 'ESTIMATE_COMPARISON'
  | 'AUTO_ASSIGN'
  | 'DELIVER_ESTIMATE'
  | 'BID_SYNC'
  | 'BUDGET_TRANSFER'
  | 'RSMEANS_IMPORT'
  | 'SEND_REMINDERS';

export interface JobData {
  type: JobType;
  payload: Record<string, unknown>;
  metadata?: {
    organizationId?: string;
    userId?: string;
    correlationId?: string;
  };
}

export interface JobResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Redis connection
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Queue name
const QUEUE_NAME = 'estimation-tool';

// Create queue
export const estimationQueue = new Queue<JobData>(QUEUE_NAME, { connection });

/**
 * Process job based on type
 */
async function processJob(job: Job<JobData>): Promise<JobResult> {
  const { type, payload, metadata } = job.data;

  console.log(`[Worker] Processing job ${job.id}: ${type}`);

  try {
    let result: unknown;

    switch (type) {
      case 'PRICE_UPDATE':
        result = await priceUpdater.startUpdate(
          payload.databaseId as string,
          payload.source as string,
          payload.items as any[]
        );
        break;

      case 'PLAN_ANALYSIS':
        result = await planAnalyzer.analyzePlan(
          payload.planId as string,
          payload.planData as string,
          payload.options as any
        );
        break;

      case 'QUANTITY_EXTRACTION':
        result = await quantityExtractor.extractFromAnalysis(
          payload.projectId as string,
          payload.analysisId as string,
          payload.options as any
        );
        break;

      case 'ESTIMATE_CALCULATION':
        result = await estimateCalculator.calculateEstimate(
          payload.estimateId as string,
          payload.options as any
        );
        break;

      case 'CREATE_REVISION':
        result = await revisionManager.createRevision({
          estimateId: payload.estimateId as string,
          name: payload.name as string,
          description: payload.description as string,
          reason: payload.reason as any,
          createdBy: metadata?.userId,
        });
        break;

      case 'GENERATE_EXPORT':
        result = await exportGenerator.exportEstimate(
          payload.estimateId as string,
          payload.options as any
        );
        break;

      case 'SCOPE_ANALYSIS':
        result = await scopeAnalyzer.analyzeScope(
          payload.estimateId as string,
          payload.options as any
        );
        break;

      case 'COST_PREDICTION':
        result = await costPredictor.predictCost(
          payload.estimateId as string,
          payload.options as any
        );
        break;

      case 'VALUE_ENGINEERING':
        result = await valueEngineer.analyzeVE(
          payload.estimateId as string,
          payload.options as any
        );
        break;

      case 'ESTIMATE_COMPARISON':
        result = await comparisonAnalyzer.compareEstimates(
          payload.estimateIds as string[]
        );
        break;

      case 'AUTO_ASSIGN':
        result = await assignmentEngine.autoAssign(
          payload.order as any,
          payload.criteria as any
        );
        break;

      case 'DELIVER_ESTIMATE':
        result = await deliveryHandler.deliverEstimate(
          payload.orderId as string,
          payload.deliverableId as string,
          payload.options as any
        );
        break;

      case 'BID_SYNC':
        result = await bidEngineSync.syncBidRequests(
          payload.organizationId as string
        );
        break;

      case 'BUDGET_TRANSFER':
        result = await budgetTrackerSync.transferToBudget(payload as any);
        break;

      case 'RSMEANS_IMPORT':
        if (payload.dataType === 'items') {
          result = await rsMeansImporter.importItems(
            payload.items as any[],
            payload.options as any
          );
        } else {
          result = await rsMeansImporter.importAssemblies(
            payload.assemblies as any[],
            payload.options as any
          );
        }
        break;

      case 'SEND_REMINDERS':
        const reminders = await deliveryHandler.getPendingReminders();
        for (const reminder of reminders) {
          await deliveryHandler.sendReminder(reminder.id);
        }
        result = { remindersSent: reminders.length };
        break;

      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    console.log(`[Worker] Job ${job.id} completed successfully`);
    return { success: true, data: result };

  } catch (error) {
    console.error(`[Worker] Job ${job.id} failed:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Create and start worker
 */
export function createWorker(): Worker<JobData, JobResult> {
  const worker = new Worker<JobData, JobResult>(
    QUEUE_NAME,
    processJob,
    {
      connection,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  );

  worker.on('completed', (job, result) => {
    console.log(`[Worker] Job ${job.id} completed:`, result.success);
  });

  worker.on('failed', (job, error) => {
    console.error(`[Worker] Job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('[Worker] Worker error:', error);
  });

  console.log('[Worker] Estimation Tool worker started');

  return worker;
}

/**
 * Add job to queue
 */
export async function addJob(
  type: JobType,
  payload: Record<string, unknown>,
  options?: {
    delay?: number;
    priority?: number;
    attempts?: number;
    backoff?: { type: 'fixed' | 'exponential'; delay: number };
    metadata?: {
      organizationId?: string;
      userId?: string;
      correlationId?: string;
    };
  }
): Promise<Job<JobData>> {
  return estimationQueue.add(
    type,
    { type, payload, metadata: options?.metadata },
    {
      delay: options?.delay,
      priority: options?.priority,
      attempts: options?.attempts || 3,
      backoff: options?.backoff || { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    }
  );
}

/**
 * Schedule recurring jobs
 */
export async function scheduleRecurringJobs(): Promise<void> {
  // Schedule reminder check every hour
  await estimationQueue.add(
    'SEND_REMINDERS',
    { type: 'SEND_REMINDERS', payload: {} },
    {
      repeat: { every: 60 * 60 * 1000 }, // Every hour
      removeOnComplete: true,
    }
  );

  console.log('[Worker] Recurring jobs scheduled');
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    estimationQueue.getWaitingCount(),
    estimationQueue.getActiveCount(),
    estimationQueue.getCompletedCount(),
    estimationQueue.getFailedCount(),
    estimationQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

/**
 * Cleanup worker
 */
export async function cleanupWorker(worker: Worker): Promise<void> {
  await worker.close();
  await estimationQueue.close();
  await connection.quit();
  console.log('[Worker] Worker cleaned up');
}

// Start worker if run directly
// Note: This check works when file is executed directly via node
if (require.main === module) {
  const worker = createWorker();
  scheduleRecurringJobs();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[Worker] Received SIGTERM, shutting down...');
    await cleanupWorker(worker);
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('[Worker] Received SIGINT, shutting down...');
    await cleanupWorker(worker);
    process.exit(0);
  });
}
