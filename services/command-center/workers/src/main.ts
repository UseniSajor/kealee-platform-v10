/**
 * KEALEE COMMAND CENTER - WORKER ORCHESTRATION
 * Starts and manages all 14 mini-app workers
 */

import { Worker } from 'bullmq';
import { shutdownQueues, QUEUE_NAMES } from '../../shared/queue.js';
import { closeAllEventBuses, getEventBus } from '../../shared/events.js';

// Import workers from all apps
import { bidEngineWorker } from '../../apps/APP-01-bid-engine/src/index.js';
import { visitSchedulerWorker } from '../../apps/APP-02-visit-scheduler/src/index.js';
import { changeOrderWorker } from '../../apps/APP-03-change-order/src/index.js';
import { reportGeneratorWorker } from '../../apps/APP-04-report-generator/src/index.js';
import { permitTrackerWorker } from '../../apps/APP-05-permit-tracker/src/index.js';
import { inspectionWorker } from '../../apps/APP-06-inspection/src/index.js';
import { budgetTrackerWorker } from '../../apps/APP-07-budget-tracker/src/index.js';
import { communicationWorker } from '../../apps/APP-08-communication/src/index.js';
import { taskQueueWorker } from '../../apps/APP-09-task-queue/src/index.js';
import { documentGenWorker } from '../../apps/APP-10-document-gen/src/index.js';
import { predictiveWorker } from '../../apps/APP-11-predictive/src/index.js';
import { smartSchedulerWorker } from '../../apps/APP-12-smart-scheduler/src/index.js';
import { qaInspectorWorker } from '../../apps/APP-13-qa-inspector/src/index.js';
import { decisionSupportWorker } from '../../apps/APP-14-decision-support/src/index.js';
import { estimationWorker } from '../../apps/APP-15-estimation/src/index.js';

// Track all workers
const workers: Map<string, Worker> = new Map();

// Worker health status
interface WorkerHealth {
  name: string;
  status: 'running' | 'paused' | 'closed' | 'error';
  processedJobs: number;
  failedJobs: number;
  lastActivity: Date | null;
}

const workerHealth: Map<string, WorkerHealth> = new Map();

/**
 * Register a worker
 */
function registerWorker(name: string, worker: Worker): void {
  workers.set(name, worker);

  workerHealth.set(name, {
    name,
    status: 'running',
    processedJobs: 0,
    failedJobs: 0,
    lastActivity: null,
  });

  // Track job completions
  worker.on('completed', () => {
    const health = workerHealth.get(name);
    if (health) {
      health.processedJobs++;
      health.lastActivity = new Date();
    }
  });

  // Track failures
  worker.on('failed', () => {
    const health = workerHealth.get(name);
    if (health) {
      health.failedJobs++;
      health.lastActivity = new Date();
    }
  });

  // Track errors
  worker.on('error', (err) => {
    console.error(`[${name}] Worker error:`, err);
    const health = workerHealth.get(name);
    if (health) {
      health.status = 'error';
    }
  });

  console.log(`✓ Registered worker: ${name}`);
}

/**
 * Get health status for all workers
 */
export function getWorkersHealth(): WorkerHealth[] {
  return Array.from(workerHealth.values());
}

/**
 * Pause a specific worker
 */
export async function pauseWorker(name: string): Promise<boolean> {
  const worker = workers.get(name);
  if (worker) {
    await worker.pause();
    const health = workerHealth.get(name);
    if (health) health.status = 'paused';
    console.log(`⏸ Paused worker: ${name}`);
    return true;
  }
  return false;
}

/**
 * Resume a specific worker
 */
export async function resumeWorker(name: string): Promise<boolean> {
  const worker = workers.get(name);
  if (worker) {
    worker.resume();
    const health = workerHealth.get(name);
    if (health) health.status = 'running';
    console.log(`▶ Resumed worker: ${name}`);
    return true;
  }
  return false;
}

/**
 * Graceful shutdown of all workers
 */
async function shutdown(signal: string): Promise<void> {
  console.log(`\nReceived ${signal}, shutting down workers gracefully...`);

  // Close all workers
  const closePromises = Array.from(workers.entries()).map(async ([name, worker]) => {
    console.log(`Closing worker: ${name}...`);
    await worker.close();
    const health = workerHealth.get(name);
    if (health) health.status = 'closed';
  });

  await Promise.all(closePromises);

  // Shutdown queues and event buses
  await shutdownQueues();
  await closeAllEventBuses();

  console.log('All workers shut down');
  process.exit(0);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║        KEALEE COMMAND CENTER - WORKER ORCHESTRATION       ║
╠═══════════════════════════════════════════════════════════╣
║  Starting workers for 15 automation mini-apps...          ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Initialize event bus for cross-app communication
  const eventBus = getEventBus('worker-orchestration');

  // Register all 14 workers
  registerWorker('APP-01-bid-engine', bidEngineWorker);
  registerWorker('APP-02-visit-scheduler', visitSchedulerWorker);
  registerWorker('APP-03-change-order', changeOrderWorker);
  registerWorker('APP-04-report-generator', reportGeneratorWorker);
  registerWorker('APP-05-permit-tracker', permitTrackerWorker);
  registerWorker('APP-06-inspection', inspectionWorker);
  registerWorker('APP-07-budget-tracker', budgetTrackerWorker);
  registerWorker('APP-08-communication', communicationWorker);
  registerWorker('APP-09-task-queue', taskQueueWorker);
  registerWorker('APP-10-document-gen', documentGenWorker);
  registerWorker('APP-11-predictive', predictiveWorker);
  registerWorker('APP-12-smart-scheduler', smartSchedulerWorker);
  registerWorker('APP-13-qa-inspector', qaInspectorWorker);
  registerWorker('APP-14-decision-support', decisionSupportWorker);
  registerWorker('APP-15-estimation', estimationWorker);

  console.log(`
╠═══════════════════════════════════════════════════════════╣
║  Workers Status:                                          ║
╠═══════════════════════════════════════════════════════════╣
${Array.from(workers.keys()).map(name =>
    `║  ✓ ${name.padEnd(45)}║`
  ).join('\n')}
╠═══════════════════════════════════════════════════════════╣
║  Total Workers: ${workers.size.toString().padEnd(40)}║
║  Status: All workers running                              ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Set up recurring jobs
  await setupRecurringJobs();

  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Keep process running
  console.log('\n🚀 Worker orchestration started. Press Ctrl+C to stop.\n');
}

/**
 * Set up recurring scheduled jobs
 */
async function setupRecurringJobs(): Promise<void> {
  const { scheduleRecurringJob } = await import('../../shared/queue.js');

  // Check overdue tasks every hour
  await scheduleRecurringJob(
    'TASK_QUEUE',
    'check-overdue-tasks',
    { type: 'CHECK_OVERDUE' },
    '0 * * * *' // Every hour
  );

  console.log('✓ Scheduled recurring jobs');
}

// Start workers
main().catch((error) => {
  console.error('Failed to start workers:', error);
  process.exit(1);
});
