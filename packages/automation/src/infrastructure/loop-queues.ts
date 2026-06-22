import { createQueue, createWorker, addJob } from './queues.js';
import { loopRouter, mapEventToLoopType } from '../loop-router.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize the 7 required queues
export const processAutomationEventQueue = createQueue('processAutomationEvent');
export const runLoopQueue = createQueue('runLoop');
export const runAgentQueue = createQueue('runAgent');
export const updateDigitalTwinQueue = createQueue('updateDigitalTwin');
export const generateDeliverableQueue = createQueue('generateDeliverable');
export const sendNotificationQueue = createQueue('sendNotification');
export const adminReviewQueue = createQueue('adminReviewQueue');

// Wire the queues into the loop router
loopRouter.setQueues(runLoopQueue, sendNotificationQueue);

// ── Workers ──────────────────────────────────────────────────────────────────

export const processAutomationEventWorker = createWorker('processAutomationEvent', async (job) => {
  const { eventType, sourceApp, projectId, payload } = job.data;
  console.log(`[Worker:processAutomationEvent] Processing job ${job.id}`);
  
  // Route event to loops
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

  // Fetch the LoopRun
  const run = await prisma.loopRun.findUnique({
    where: { id: loopRunId },
  });
  if (!run) throw new Error(`LoopRun ${loopRunId} not found`);

  // Update status to RUNNING
  await prisma.loopRun.update({
    where: { id: loopRunId },
    data: { status: 'RUNNING' },
  });

  // Get project Twin config
  const twin = await prisma.digitalTwin.findUnique({
    where: { projectId },
  });
  const config = twin ? twin.config : {};

  // Step 1: Run Agent
  try {
    const agentOutput = await loopRouter.executeAgent(loopRunId, projectId, loopType, config);

    // Step 2: Queue Digital Twin updates
    await addJob(updateDigitalTwinQueue, 'updateDigitalTwin', {
      loopRunId,
      projectId,
      updates: agentOutput.digitalTwinUpdates,
    });

    // Step 3: Queue Deliverable Updates if present
    if (agentOutput.deliverableUpdates && Object.keys(agentOutput.deliverableUpdates).length > 0) {
      await addJob(generateDeliverableQueue, 'generateDeliverable', {
        loopRunId,
        projectId,
        deliverables: agentOutput.deliverableUpdates,
      });
    }

    // Step 4: Handle Human Review or Complete
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

      // Queue Admin Review job
      await addJob(adminReviewQueue, 'adminReview', {
        loopRunId,
        projectId,
        agentOutput,
      });
    } else {
      // Auto-approve and complete the run
      await prisma.loopRun.update({
        where: { id: loopRunId },
        data: {
          status: 'COMPLETED',
          confidenceScore: agentOutput.confidenceScore,
          outputSnapshot: agentOutput as any,
          nextAction: agentOutput.nextActions as any,
        },
      });

      // Queue customer notifications
      await addJob(sendNotificationQueue, 'sendNotification', {
        projectId,
        type: 'loop_completed',
        title: 'Project Update Recommendations',
        body: agentOutput.summary,
      });
    }
  } catch (err: any) {
    console.error(`[Worker:runLoop] LoopRun ${loopRunId} failed:`, err.message);
    await prisma.loopRun.update({
      where: { id: loopRunId },
      data: { status: 'FAILED' },
    });
  }
});

export const updateDigitalTwinWorker = createWorker('updateDigitalTwin', async (job) => {
  const { projectId, updates } = job.data;
  console.log(`[Worker:updateDigitalTwin] Updating Twin for project ${projectId}`);
  await loopRouter.applyDigitalTwinUpdates(projectId, updates);
});

export const generateDeliverableWorker = createWorker('generateDeliverable', async (job) => {
  const { projectId, deliverables } = job.data;
  console.log(`[Worker:generateDeliverable] Generating deliverables for project ${projectId}`, deliverables);
  // Stubs for PDF generation (integrates with Document Gen app)
});

export const sendNotificationWorker = createWorker('sendNotification', async (job) => {
  const { projectId, type, title, body } = job.data;
  console.log(`[Worker:sendNotification] Sending notification: ${title} — ${body}`);
  // In-app Notification creation
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (project && project.clientId) {
    await prisma.notification.create({
      data: {
        userId: project.clientId,
        type,
        title,
        message: body,
        channels: ['in_app', 'email'],
        status: 'PENDING',
      },
    });
  }
});

export const adminReviewWorker = createWorker('adminReview', async (job) => {
  const { loopRunId, projectId, agentOutput } = job.data;
  console.log(`[Worker:adminReviewQueue] Adding loop ${loopRunId} to Admin Review Queue`);
  
  // Creates an alert for administrator dashboard review
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
