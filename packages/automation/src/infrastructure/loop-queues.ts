import { createQueue, createWorker, addJob } from './queues.js';
import { loopRouter, mapEventToLoopType } from '../loop-router.js';
import { PrismaClient } from '@prisma/client';
import { digitalTwinService } from '../digital-twin-service.js';

const prisma = new PrismaClient();

// Initialize the required queues with retry configurations
export const processAutomationEventQueue = createQueue('processAutomationEvent');
export const runLoopQueue = createQueue('runLoop');
export const runAgentQueue = createQueue('runAgent');
export const updateDigitalTwinQueue = createQueue('updateDigitalTwin');
export const generateDeliverableQueue = createQueue('generateDeliverable');
export const sendNotificationQueue = createQueue('sendNotification');
export const adminReviewQueue = createQueue('adminReviewQueue');

loopRouter.setQueues(runLoopQueue, sendNotificationQueue);

// ── Workers ──────────────────────────────────────────────────────────────────

export const processAutomationEventWorker = createWorker('processAutomationEvent', async (job) => {
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

export const runLoopWorker = createWorker('runLoop', async (job) => {
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
  await addJob(runAgentQueue, 'runAgent', {
    loopRunId,
    projectId,
    loopType,
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
});

export const runAgentWorker = createWorker('runAgent', async (job) => {
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
    await addJob(updateDigitalTwinQueue, 'updateDigitalTwin', {
      loopRunId,
      projectId,
      updates: agentOutput.digitalTwinUpdates,
    });

    // Queue Deliverables
    if (agentOutput.deliverableUpdates && Object.keys(agentOutput.deliverableUpdates).length > 0) {
      await addJob(generateDeliverableQueue, 'generateDeliverable', {
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
      await addJob(adminReviewQueue, 'adminReview', { loopRunId, projectId, agentOutput });
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
      await addJob(sendNotificationQueue, 'sendNotification', {
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

export const updateDigitalTwinWorker = createWorker('updateDigitalTwin', async (job) => {
  const { projectId, updates } = job.data;
  console.log(`[Worker:updateDigitalTwin] Updating Twin for project ${projectId}`);
  await digitalTwinService.updateTwin(projectId, updates);
});

export const generateDeliverableWorker = createWorker('generateDeliverable', async (job) => {
  // Stub
});

export const sendNotificationWorker = createWorker('sendNotification', async (job) => {
  // Stub
});

export const adminReviewWorker = createWorker('adminReview', async (job) => {
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
