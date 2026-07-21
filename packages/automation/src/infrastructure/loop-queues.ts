// @ts-nocheck
import { createQueue, createWorker, addJob } from './queues.js';
import { loopRouter, mapEventToLoopType } from '../loop-router.js';
import { PrismaClient } from '@prisma/client';
import { digitalTwinService } from '../digital-twin-service.js';

const prisma = new PrismaClient();

// ── Queues (lazy) ────────────────────────────────────────────────────────────
//
// Queues are created on first use so that merely importing this module never
// opens a Redis connection. This matters for web-main API routes: `next build`
// imports every route module while collecting page data, and an eager
// connection floods the build with ECONNREFUSED retries (and web processes
// would hold idle connections). A route only connects when it enqueues a job.

const queues = new Map();

function getQueue(name: string) {
  let queue = queues.get(name);
  if (!queue) {
    queue = createQueue(name);
    queues.set(name, queue);
  }
  return queue;
}

export const getProcessAutomationEventQueue = () => getQueue('processAutomationEvent');
export const getRunLoopQueue = () => getQueue('runLoop');
export const getRunAgentQueue = () => getQueue('runAgent');
export const getUpdateDigitalTwinQueue = () => getQueue('updateDigitalTwin');
export const getGenerateDeliverableQueue = () => getQueue('generateDeliverable');
export const getSendNotificationQueue = () => getQueue('sendNotification');
export const getAdminReviewQueue = () => getQueue('adminReviewQueue');

// ── Workers (explicit startup) ───────────────────────────────────────────────
//
// Constructing a BullMQ Worker connects to Redis and starts polling for jobs
// immediately. Workers must therefore only be started by the dedicated worker
// entrypoint (src/workers/index.ts), never as an import side effect — web
// processes were previously competing with the worker service for jobs.

let loopWorkers = null;

export function startLoopWorkers() {
  if (loopWorkers) return loopWorkers;

  loopRouter.setQueues(getRunLoopQueue(), getSendNotificationQueue());

  const processAutomationEventWorker = createWorker('processAutomationEvent', async (job) => {
    const { eventType, sourceApp, projectId, payload } = job.data;
    console.log(`[Worker:processAutomationEvent] Processing job ${job.id}`);

    // 1. Log the event via DigitalTwinService
    await digitalTwinService.logEvent(projectId, eventType, payload);

    // 2. Route event to loops
    await loopRouter.routeEvent({
      eventType,
      sourceApp,
      projectId,
      payload,
    });
  });

  const runLoopWorker = createWorker('runLoop', async (job) => {
    const { loopRunId, projectId, loopType } = job.data;
    console.log(`[Worker:runLoop] Starting LoopRun ${loopRunId} for project ${projectId}`);

    const run = await prisma.loopRun.findUnique({ where: { id: loopRunId } });
    if (!run) throw new Error(`LoopRun ${loopRunId} not found`);

    await prisma.loopRun.update({
      where: { id: loopRunId },
      data: { status: 'RUNNING' },
    });

    // Instead of running the agent synchronously, we queue it to the runAgentQueue
    // This allows the agent LLM execution to have its own retry/timeout logic
    await addJob(getRunAgentQueue(), 'runAgent', {
      loopRunId,
      projectId,
      loopType,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  });

  const runAgentWorker = createWorker('runAgent', async (job) => {
    const { loopRunId, projectId, loopType } = job.data;

    // Project-level locking logic to ensure agents don't step on each other
    const lockKey = `agent-lock:${projectId}`;
    // In a real implementation this would use Redis SET NX
    // For now we simulate locking logic
    console.log(`[Worker:runAgent] Acquired lock ${lockKey}`);

    try {
      const twin = await digitalTwinService.getTwin(projectId);
      const agentOutput = await loopRouter.executeAgent(loopRunId, projectId, loopType, twin);

      // Queue Digital Twin updates
      await addJob(getUpdateDigitalTwinQueue(), 'updateDigitalTwin', {
        loopRunId,
        projectId,
        updates: agentOutput.digitalTwinUpdates,
      });

      // Queue Deliverables
      if (agentOutput.deliverableUpdates && Object.keys(agentOutput.deliverableUpdates).length > 0) {
        await addJob(getGenerateDeliverableQueue(), 'generateDeliverable', {
          loopRunId,
          projectId,
          deliverables: agentOutput.deliverableUpdates,
        });
      }

      if (agentOutput.requiresHumanReview) {
        await prisma.loopRun.update({
          where: { id: loopRunId },
          data: {
            status: 'AWAITING_REVIEW',
            confidenceScore: agentOutput.confidenceScore,
            requiresReview: true,
            outputSnapshot: agentOutput as any,
            nextAction: agentOutput.nextActions as any,
          },
        });
        await addJob(getAdminReviewQueue(), 'adminReview', { loopRunId, projectId, agentOutput });
      } else {
        await prisma.loopRun.update({
          where: { id: loopRunId },
          data: {
            status: 'COMPLETED',
            confidenceScore: agentOutput.confidenceScore,
            outputSnapshot: agentOutput as any,
            nextAction: agentOutput.nextActions as any,
          },
        });
        await addJob(getSendNotificationQueue(), 'sendNotification', {
          projectId,
          type: 'loop_completed',
          title: 'Project Update Recommendations',
          body: agentOutput.summary,
        });
      }
    } catch (err: any) {
      console.error(`[Worker:runAgent] Failed: ${err.message}`);
      // Failed-job handling logic
      await prisma.loopRun.update({
        where: { id: loopRunId },
        data: { status: 'FAILED' },
      });
      throw err; // Allow BullMQ to retry based on attempt config
    } finally {
      console.log(`[Worker:runAgent] Released lock ${lockKey}`);
    }
  });

  const updateDigitalTwinWorker = createWorker('updateDigitalTwin', async (job) => {
    const { projectId, updates } = job.data;
    console.log(`[Worker:updateDigitalTwin] Updating Twin for project ${projectId}`);
    await digitalTwinService.updateTwin(projectId, updates);
  });

  const generateDeliverableWorker = createWorker('generateDeliverable', async (job) => {
    // Stub
  });

  const sendNotificationWorker = createWorker('sendNotification', async (job) => {
    // Stub
  });

  const adminReviewWorker = createWorker('adminReview', async (job) => {
    const { loopRunId, projectId, agentOutput } = job.data;
    await prisma.alert.create({
      data: {
        level: 'WARNING',
        source: 'loop-router',
        title: `Admin Review Needed for LoopRun: ${loopRunId}`,
        message: `Loop run type ${agentOutput.loopType} for project ${projectId} requires administrator manual approval. Confidence score: ${agentOutput.confidenceScore}.`,
        data: { loopRunId, projectId, confidenceScore: agentOutput.confidenceScore },
      },
    });
  });

  loopWorkers = {
    processAutomationEventWorker,
    runLoopWorker,
    runAgentWorker,
    updateDigitalTwinWorker,
    generateDeliverableWorker,
    sendNotificationWorker,
    adminReviewWorker,
  };
  return loopWorkers;
}
