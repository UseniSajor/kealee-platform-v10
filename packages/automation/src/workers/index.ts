/**
 * Command Center — Main Worker Entry Point
 *
 * This file bootstraps the entire automation platform:
 *  1. Initializes Prisma, Redis, and EventBus connections
 *  2. Creates the EventRouter and registers all event handlers
 *  3. Starts all 14 app workers + 1 dashboard monitor
 *  4. Handles graceful shutdown on SIGTERM / SIGINT
 *
 * Usage:
 *   npx tsx src/workers/index.ts
 *   node dist/workers/index.js
 */

import { PrismaClient } from '@prisma/client';
import { eventBus } from '../infrastructure/event-bus.js';
import { checkRedisHealth, closeAllConnections } from '../infrastructure/redis.js';
import { registerAllCrons, removeAllCrons } from '../infrastructure/cron.js';
import { eventRouter } from '../event-router.js';

// ── Worker imports (APP-01 through APP-15) ─────────────────────────────────
import { bidEngineWorker, bidEngineQueue, bidEngineService } from '../apps/bid-engine/index.js';
import { visitSchedulerWorker, visitSchedulerQueue, visitSchedulerService } from '../apps/visit-scheduler/index.js';
import { changeOrderWorker, changeOrderQueue, changeOrderService } from '../apps/change-order/index.js';
import { reportGeneratorWorker, reportGeneratorQueue, reportGeneratorService } from '../apps/report-generator/index.js';
import { permitTrackerWorker, permitTrackerQueue, permitTrackerService } from '../apps/permit-tracker/index.js';
import { inspectionCoordWorker, inspectionQueue, inspectionCoordService } from '../apps/inspection-coord/index.js';
import { budgetTrackerWorker, budgetTrackerQueue, budgetTrackerService } from '../apps/budget-tracker/index.js';
import { communicationHubWorker, communicationHubQueue, communicationHubService } from '../apps/communication-hub/index.js';
import { taskQueueWorker, taskQueueQueue, taskQueueService } from '../apps/task-queue/index.js';
import { documentGenWorker, documentGenQueue, documentGenService } from '../apps/document-gen/index.js';
import { predictiveEngineWorker, predictiveEngineQueue, predictiveEngineService } from '../apps/predictive-engine/index.js';
import { smartSchedulerWorker, smartSchedulerQueue, smartSchedulerService } from '../apps/smart-scheduler/index.js';
import { qaInspectorWorker, qaInspectorQueue, qaInspectorService } from '../apps/qa-inspector/index.js';
import { decisionSupportWorker, decisionSupportQueue, decisionSupportService } from '../apps/decision-support/index.js';
import { dashboardWorker, dashboardQueue, dashboardService } from '../apps/dashboard/index.js';

// ── All workers array (for lifecycle management) ───────────────────────────

const ALL_WORKERS = [
  { name: 'APP-01 Bid Engine', worker: bidEngineWorker },
  { name: 'APP-02 Visit Scheduler', worker: visitSchedulerWorker },
  { name: 'APP-03 Change Order', worker: changeOrderWorker },
  { name: 'APP-04 Report Generator', worker: reportGeneratorWorker },
  { name: 'APP-05 Permit Tracker', worker: permitTrackerWorker },
  { name: 'APP-06 Inspection Coord', worker: inspectionCoordWorker },
  { name: 'APP-07 Budget Tracker', worker: budgetTrackerWorker },
  { name: 'APP-08 Communication Hub', worker: communicationHubWorker },
  { name: 'APP-09 Task Queue', worker: taskQueueWorker },
  { name: 'APP-10 Document Gen', worker: documentGenWorker },
  { name: 'APP-11 Predictive Engine', worker: predictiveEngineWorker },
  { name: 'APP-12 Smart Scheduler', worker: smartSchedulerWorker },
  { name: 'APP-13 QA Inspector', worker: qaInspectorWorker },
  { name: 'APP-14 Decision Support', worker: decisionSupportWorker },
  { name: 'APP-15 Dashboard Monitor', worker: dashboardWorker },
];

// ── Prisma client ──────────────────────────────────────────────────────────

const prisma = new PrismaClient();

// ── Graceful shutdown ──────────────────────────────────────────────────────

let shuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`\n[CommandCenter] Received ${signal} — shutting down gracefully...`);

  // 1. Stop the event bus (stop receiving new events)
  try {
    await eventBus.stop();
    console.log('[CommandCenter] EventBus stopped');
  } catch (err) {
    console.error('[CommandCenter] EventBus stop error:', (err as Error).message);
  }

  // 2. Remove repeatable cron jobs
  try {
    await removeAllCrons();
    console.log('[CommandCenter] Cron jobs removed');
  } catch (err) {
    console.error('[CommandCenter] Cron removal error:', (err as Error).message);
  }

  // 3. Close all workers (drain current jobs, stop accepting new ones)
  console.log('[CommandCenter] Stopping all workers...');
  const workerClosePromises = ALL_WORKERS.map(async ({ name, worker }) => {
    try {
      await worker.close();
      console.log(`[CommandCenter]   ✓ ${name} stopped`);
    } catch (err) {
      console.error(`[CommandCenter]   ✗ ${name} stop error:`, (err as Error).message);
    }
  });
  await Promise.allSettled(workerClosePromises);

  // 3. Close Redis connections
  try {
    await closeAllConnections();
    console.log('[CommandCenter] Redis connections closed');
  } catch (err) {
    console.error('[CommandCenter] Redis close error:', (err as Error).message);
  }

  // 4. Close Prisma
  try {
    await prisma.$disconnect();
    console.log('[CommandCenter] Prisma disconnected');
  } catch (err) {
    console.error('[CommandCenter] Prisma disconnect error:', (err as Error).message);
  }

  console.log('[CommandCenter] Shutdown complete');
  process.exit(0);
}

// ── Main startup ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          KEALEE COMMAND CENTER — Starting Up                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // 1. Check Redis health
  console.log('[CommandCenter] Checking Redis connection...');
  const redisHealthy = await checkRedisHealth();
  if (!redisHealthy) {
    console.error('[CommandCenter] Redis is not reachable. Aborting startup.');
    process.exit(1);
  }
  console.log('[CommandCenter] Redis connected ✓');

  // 2. Check Prisma connection
  console.log('[CommandCenter] Checking database connection...');
  try {
    await prisma.$connect();
    console.log('[CommandCenter] Database connected ✓');
  } catch (err) {
    console.error('[CommandCenter] Database connection failed:', (err as Error).message);
    process.exit(1);
  }

  // 3. Start the EventBus (begin listening on Redis pub/sub)
  console.log('[CommandCenter] Starting EventBus...');
  await eventBus.start();

  // 4. Register all event handlers via the EventRouter
  console.log('[CommandCenter] Registering event handlers...');
  eventRouter.registerAll();

  // 5. Register all cron jobs centrally
  console.log('[CommandCenter] Registering cron jobs...');
  await registerAllCrons();

  // 6. Workers are already started by their module-level createWorker() calls
  //    Just log that they're running
  console.log('[CommandCenter] Workers active:');
  ALL_WORKERS.forEach(({ name }) => {
    console.log(`[CommandCenter]   • ${name}`);
  });

  // 7. Register shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // 8. Log startup complete
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Command Center: 14 workers + 1 monitor active              ║');
  console.log('║  Event Router: 5 cross-app chains registered                ║');
  console.log('║  Cron Scheduler: all repeatable jobs registered              ║');
  console.log('║  Ready to process jobs                                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

// ── Start ──────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error('[CommandCenter] Fatal startup error:', err);
  process.exit(1);
});

// ── Exports for testing ────────────────────────────────────────────────────

export {
  // Infrastructure
  eventRouter,
  eventBus,
  prisma,
  registerAllCrons,
  removeAllCrons,

  // APP-01: Bid Engine
  bidEngineQueue,
  bidEngineService,
  bidEngineWorker,

  // APP-02: Visit Scheduler
  visitSchedulerQueue,
  visitSchedulerService,
  visitSchedulerWorker,

  // APP-03: Change Order
  changeOrderQueue,
  changeOrderService,
  changeOrderWorker,

  // APP-04: Report Generator
  reportGeneratorQueue,
  reportGeneratorService,
  reportGeneratorWorker,

  // APP-05: Permit Tracker
  permitTrackerQueue,
  permitTrackerService,
  permitTrackerWorker,

  // APP-06: Inspection Coordinator
  inspectionQueue,
  inspectionCoordService,
  inspectionCoordWorker,

  // APP-07: Budget Tracker
  budgetTrackerQueue,
  budgetTrackerService,
  budgetTrackerWorker,

  // APP-08: Communication Hub
  communicationHubQueue,
  communicationHubService,
  communicationHubWorker,

  // APP-09: Task Queue
  taskQueueQueue,
  taskQueueService,
  taskQueueWorker,

  // APP-10: Document Generator
  documentGenQueue,
  documentGenService,
  documentGenWorker,

  // APP-11: Predictive Engine
  predictiveEngineQueue,
  predictiveEngineService,
  predictiveEngineWorker,

  // APP-12: Smart Scheduler
  smartSchedulerQueue,
  smartSchedulerService,
  smartSchedulerWorker,

  // APP-13: QA Inspector
  qaInspectorQueue,
  qaInspectorService,
  qaInspectorWorker,

  // APP-14: Decision Support
  decisionSupportQueue,
  decisionSupportService,
  decisionSupportWorker,

  // APP-15: Dashboard Monitor
  dashboardQueue,
  dashboardService,
  dashboardWorker,
};
