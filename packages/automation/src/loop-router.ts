// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { addJob } from './infrastructure/queues.js';
import { Queue } from 'bullmq';

const prisma = new PrismaClient();

// Canonical loop types
export const LOOP_TYPES = {
  INTAKE_REFINEMENT: 'intake_refinement',
  ESTIMATE_REVISION: 'estimate_revision',
  PERMIT_CORRECTION: 'permit_correction',
  CONTRACTOR_BID: 'contractor_bid',
  PROJECT_MANAGEMENT: 'project_management',
  DEVELOPER_FEASIBILITY: 'developer_feasibility',
  FINANCE_REVIEW: 'finance_review',
  ADMIN_REVIEW: 'admin_review',
} as const;

export type LoopType = typeof LOOP_TYPES[keyof typeof LOOP_TYPES];

// Trigger events
export const LOOP_EVENTS = {
  PROJECT_CREATED: 'PROJECT_CREATED',
  INTAKE_UPDATED: 'INTAKE_UPDATED',
  PHOTO_UPLOADED: 'PHOTO_UPLOADED',
  ADDRESS_UPDATED: 'ADDRESS_UPDATED',
  BUDGET_UPDATED: 'BUDGET_UPDATED',
  SCOPE_UPDATED: 'SCOPE_UPDATED',
  ESTIMATE_GENERATED: 'ESTIMATE_GENERATED',
  ESTIMATE_REVISED: 'ESTIMATE_REVISED',
  PERMIT_PACKAGE_REQUESTED: 'PERMIT_PACKAGE_REQUESTED',
  PERMIT_COMMENT_UPLOADED: 'PERMIT_COMMENT_UPLOADED',
  CONTRACTOR_BID_REQUESTED: 'CONTRACTOR_BID_REQUESTED',
  CONTRACTOR_QUESTION_RECEIVED: 'CONTRACTOR_QUESTION_RECEIVED',
  BID_UPLOADED: 'BID_UPLOADED',
  PROJECT_TASK_UPDATED: 'PROJECT_TASK_UPDATED',
  CHANGE_ORDER_REQUESTED: 'CHANGE_ORDER_REQUESTED',
  INSPECTION_FAILED: 'INSPECTION_FAILED',
  DEVELOPER_FEASIBILITY_REQUESTED: 'DEVELOPER_FEASIBILITY_REQUESTED',
  FINANCE_MODEL_UPDATED: 'FINANCE_MODEL_UPDATED',
  USER_DECISION_SUBMITTED: 'USER_DECISION_SUBMITTED',
  ADMIN_OVERRIDE_SUBMITTED: 'ADMIN_OVERRIDE_SUBMITTED',
} as const;

export type LoopEvent = typeof LOOP_EVENTS[keyof typeof LOOP_EVENTS];

// Map Event to Loop Type
export function mapEventToLoopType(event: string): LoopType | null {
  switch (event) {
    case LOOP_EVENTS.PROJECT_CREATED:
    case LOOP_EVENTS.INTAKE_UPDATED:
      return LOOP_TYPES.INTAKE_REFINEMENT;
    case LOOP_EVENTS.SCOPE_UPDATED:
    case LOOP_EVENTS.ESTIMATE_GENERATED:
    case LOOP_EVENTS.ESTIMATE_REVISED:
      return LOOP_TYPES.ESTIMATE_REVISION;
    case LOOP_EVENTS.PERMIT_PACKAGE_REQUESTED:
    case LOOP_EVENTS.PERMIT_COMMENT_UPLOADED:
      return LOOP_TYPES.PERMIT_CORRECTION;
    case LOOP_EVENTS.CONTRACTOR_BID_REQUESTED:
    case LOOP_EVENTS.CONTRACTOR_QUESTION_RECEIVED:
    case LOOP_EVENTS.BID_UPLOADED:
      return LOOP_TYPES.CONTRACTOR_BID;
    case LOOP_EVENTS.PHOTO_UPLOADED:
    case LOOP_EVENTS.PROJECT_TASK_UPDATED:
    case LOOP_EVENTS.CHANGE_ORDER_REQUESTED:
    case LOOP_EVENTS.INSPECTION_FAILED:
      return LOOP_TYPES.PROJECT_MANAGEMENT;
    case LOOP_EVENTS.ADDRESS_UPDATED:
    case LOOP_EVENTS.DEVELOPER_FEASIBILITY_REQUESTED:
      return LOOP_TYPES.DEVELOPER_FEASIBILITY;
    case LOOP_EVENTS.BUDGET_UPDATED:
    case LOOP_EVENTS.FINANCE_MODEL_UPDATED:
      return LOOP_TYPES.FINANCE_REVIEW;
    case LOOP_EVENTS.USER_DECISION_SUBMITTED:
    case LOOP_EVENTS.ADMIN_OVERRIDE_SUBMITTED:
      return LOOP_TYPES.ADMIN_REVIEW;
    default:
      return null;
  }
}

import { AgentOutput } from './agents/types.js';
import { IntakeAgent } from './agents/intake-agent.js';
import { EstimateAgent } from './agents/estimate-agent.js';
import { PermitAgent } from './agents/permit-agent.js';
import { ContractorAgent } from './agents/contractor-agent.js';
import { ProjectAgent } from './agents/project-agent.js';
import { FeasibilityAgent } from './agents/feasibility-agent.js';
import { FinanceAgent } from './agents/finance-agent.js';
import { AdminAgent } from './agents/admin-agent.js';
import { contextBuilder } from './context/context-builder.js';

export class LoopRouter {
  private runLoopQueue?: Queue;
  private sendNotificationQueue?: Queue;

  setQueues(runLoopQueue: Queue, sendNotificationQueue: Queue) {
    this.runLoopQueue = runLoopQueue;
    this.sendNotificationQueue = sendNotificationQueue;
  }

  /**
   * Main entry point for events in the Loop Orchestration system.
   * Performs validation, twin loading, loop run creation, and queueing.
   */
  async routeEvent(event: {
    eventType: string;
    sourceApp: string;
    projectId?: string;
    payload: any;
  }): Promise<{ loopRunId: string | null; status: string }> {
    console.log(`[LoopRouter] Routing event ${event.eventType} for project ${event.projectId}`);

    // 1. Validate payload
    if (!event.payload) {
      throw new Error('Event payload is missing or empty');
    }

    // 2. Resolve Project ID
    let projectId = event.projectId || event.payload.projectId;
    if (!projectId && event.payload.id && event.eventType === LOOP_EVENTS.PROJECT_CREATED) {
      projectId = event.payload.id;
    }
    if (!projectId) {
      console.warn(`[LoopRouter] Could not resolve projectId for event ${event.eventType}. Skipping.`);
      return { loopRunId: null, status: 'SKIPPED_NO_PROJECT' };
    }

    // 3. Load or create Digital Twin
    let twin = await prisma.digitalTwin.findUnique({
      where: { projectId },
    });
    if (!twin) {
      console.log(`[LoopRouter] Digital Twin missing for project ${projectId}. Creating...`);
      twin = await prisma.digitalTwin.create({
        data: {
          projectId,
          orgId: event.payload.orgId || 'default-org',
          tier: 'L1',
          status: 'INTAKE',
          healthStatus: 'HEALTHY',
          healthScore: 100,
          currentPhase: 'PRE_CONSTRUCTION',
          enabledModules: ['os-intake', 'os-pm'],
          config: {},
          metrics: {},
        },
      });
    }

    // 4. Determine Loop Type
    const loopType = mapEventToLoopType(event.eventType);
    if (!loopType) {
      console.log(`[LoopRouter] Event ${event.eventType} does not trigger any canonical loop. Skipping.`);
      return { loopRunId: null, status: 'SKIPPED_NO_LOOP' };
    }

    // 5. Create or Resume LoopRun
    // Look for pending/running loops of the same type to resume/coalesce
    let run = await prisma.loopRun.findFirst({
      where: {
        projectId,
        loopType,
        status: { in: ['PENDING', 'RUNNING'] },
      },
    });

    if (run) {
      console.log(`[LoopRouter] Found active LoopRun ${run.id} for type ${loopType}. Resuming.`);
      run = await prisma.loopRun.update({
        where: { id: run.id },
        data: {
          triggerEvent: event.eventType,
          inputSnapshot: {
            ...((run.inputSnapshot as Record<string, any>) || {}),
            ...event.payload,
          },
          updatedAt: new Date(),
        },
      });
    } else {
      console.log(`[LoopRouter] Creating new LoopRun for type ${loopType}`);
      run = await prisma.loopRun.create({
        data: {
          projectId,
          loopType,
          status: 'PENDING',
          triggerEvent: event.eventType,
          inputSnapshot: event.payload,
        },
      });
    }

    // 6. Queue the runLoop job (worker processes the loop asynchronously)
    if (this.runLoopQueue) {
      await addJob(this.runLoopQueue, 'runLoop', {
        loopRunId: run.id,
        projectId,
        loopType,
      });
    } else {
      console.warn('[LoopRouter] runLoopQueue not set. LoopRun left in PENDING status.');
    }

    return { loopRunId: run.id, status: 'QUEUED' };
  }

  /**
   * Helper function to dispatch an agent inside a worker step.
   * Runs the agent LLM evaluation and returns a structured output payload.
   */
  async executeAgent(
    loopRunId: string,
    projectId: string,
    loopType: LoopType,
    digitalTwinConfig: any
  ): Promise<AgentOutput> {
    const startedAt = new Date();
    const agentName = getAgentNameForLoop(loopType);
    console.log(`[LoopRouter] Dispatches agent ${agentName} for loop ${loopType}`);

    // Create a LoopStep record
    const step = await prisma.loopStep.create({
      data: {
        loopRunId,
        agentName,
        stepType: 'evaluation',
        input: { digitalTwinConfig },
        status: 'RUNNING',
      } as any, // Cast because database model status might be added
    });

    try {
      // Fetch supplemental context and history
      const { optionalKnowledgeContext, priorLoopHistory } = await contextBuilder.buildContext(projectId, 'EVALUATE');

      let agent: any;
      
      // Route to correct agent
      switch (loopType) {
        case LOOP_TYPES.INTAKE_REFINEMENT:
          agent = new IntakeAgent();
          break;
        case LOOP_TYPES.ESTIMATE_REVISION:
          agent = new EstimateAgent();
          break;
        case LOOP_TYPES.PERMIT_CORRECTION:
          agent = new PermitAgent();
          break;
        case LOOP_TYPES.CONTRACTOR_BID:
          agent = new ContractorAgent();
          break;
        case LOOP_TYPES.PROJECT_MANAGEMENT:
          agent = new ProjectAgent();
          break;
        case LOOP_TYPES.DEVELOPER_FEASIBILITY:
          agent = new FeasibilityAgent();
          break;
        case LOOP_TYPES.FINANCE_REVIEW:
          agent = new FinanceAgent();
          break;
        case LOOP_TYPES.ADMIN_REVIEW:
          agent = new AdminAgent();
          break;
        default:
          throw new Error(`Unsupported loop type: ${loopType}`);
      }

      const agentOutput = await agent.evaluate({
        projectId,
        triggerEvent: 'EVALUATE', // Abstracted trigger event for the evaluation run
        digitalTwinState: digitalTwinConfig,
        eventPayload: {}, // Full event payload would be retrieved from LoopRun
        optionalKnowledgeContext,
        priorLoopHistory
      });

      // Perform human review rule checks
      const reviewRequired = checkHumanReviewRequired(agentOutput, digitalTwinConfig);
      agentOutput.requiresHumanReview = reviewRequired;

      // Update LoopStep with output
      await prisma.loopStep.update({
        where: { id: step.id },
        data: {
          output: agentOutput as any,
          confidenceScore: agentOutput.confidenceScore,
        },
      });

      return agentOutput;
    } catch (err: any) {
      console.error(`[LoopRouter] Agent execution failed:`, err.message);
      await prisma.loopStep.update({
        where: { id: step.id },
        data: {
          error: err.message,
        },
      });
      throw err;
    }
  }

  /**
   * Applies the Digital Twin updates back into the project's config and specific database models.
   */
  async applyDigitalTwinUpdates(
    projectId: string,
    updates: Record<string, any>
  ): Promise<void> {
    console.log(`[LoopRouter] Saving Digital Twin updates for project ${projectId}`);

    const twin = await prisma.digitalTwin.findUnique({
      where: { projectId },
    });
    if (!twin) return;

    // Merge updates into the Digital Twin config JSON document (source of truth)
    const existingConfig = (twin.config as Record<string, any>) || {};
    const updatedConfig = {
      ...existingConfig,
      ...updates,
    };

    await prisma.digitalTwin.update({
      where: { id: twin.id },
      data: {
        config: updatedConfig,
        status: updates.status || twin.status,
        healthScore: updates.healthScore !== undefined ? updates.healthScore : twin.healthScore,
      },
    });

    // Mirror to relational models as per Digital Twin section requirements
    if (updates.siteAddress) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          address: updates.siteAddress.address,
          city: updates.siteAddress.city,
          state: updates.siteAddress.state,
          zipCode: updates.siteAddress.zipCode,
        },
      });
    }

    if (updates.budget) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          budget: updates.budget.total,
        },
      });
    }

    if (updates.tasks && Array.isArray(updates.tasks)) {
      // Upsert tasks
      for (const t of updates.tasks) {
        await prisma.task.upsert({
          where: { id: t.id || 'new-task' },
          update: { title: t.name || t.title, status: t.status },
          create: {
            id: t.id || randomUUID(),
            projectId,
            title: t.name || t.title,
            status: t.status || 'PENDING',
          },
        });
      }
    }
  }
}

// Map Loop Type to Agent Name
function getAgentNameForLoop(loopType: LoopType): string {
  switch (loopType) {
    case LOOP_TYPES.INTAKE_REFINEMENT:
      return 'IntakeAgent';
    case LOOP_TYPES.ESTIMATE_REVISION:
      return 'EstimateAgent';
    case LOOP_TYPES.PERMIT_CORRECTION:
      return 'PermitAgent';
    case LOOP_TYPES.CONTRACTOR_BID:
      return 'ContractorAgent';
    case LOOP_TYPES.PROJECT_MANAGEMENT:
      return 'ProjectAgent';
    case LOOP_TYPES.DEVELOPER_FEASIBILITY:
      return 'FeasibilityAgent';
    case LOOP_TYPES.FINANCE_REVIEW:
      return 'FinanceAgent';
    case LOOP_TYPES.ADMIN_REVIEW:
      return 'AdminAgent';
    default:
      return 'OwnerAgent';
  }
}

// Check if human review is required
function checkHumanReviewRequired(output: AgentOutput, digitalTwinConfig: any): boolean {
  if (output.confidenceScore < 0.75) return true;
  if (output.adminFlags && output.adminFlags.length > 0) return true;

  // Cost exceeds budget by more than 25%
  if (output.digitalTwinUpdates.budget && digitalTwinConfig.budget) {
    const newBudget = output.digitalTwinUpdates.budget.total;
    const oldBudget = digitalTwinConfig.budget.total;
    if (oldBudget > 0 && (newBudget - oldBudget) / oldBudget > 0.25) {
      return true;
    }
  }

  return false;
}

export const loopRouter = new LoopRouter();
