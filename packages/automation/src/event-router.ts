import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { eventBus } from './infrastructure/event-bus.js';
import { EVENT_TYPES } from './infrastructure/event-types.js';
import { addJob } from './infrastructure/queues.js';

// ── APP-01 through APP-15 imports ──────────────────────────────────────────
import {
  registerBidEngineEvents,
  bidEngineQueue,
} from './apps/bid-engine/index.js';

import {
  registerVisitSchedulerEvents,
  visitSchedulerQueue,
} from './apps/visit-scheduler/index.js';

import {
  registerChangeOrderEvents,
  changeOrderQueue,
} from './apps/change-order/index.js';

import {
  registerReportGeneratorEvents,
  reportGeneratorQueue,
} from './apps/report-generator/index.js';

import {
  registerPermitTrackerEvents,
  permitTrackerQueue,
} from './apps/permit-tracker/index.js';

import {
  registerInspectionCoordEvents,
  inspectionQueue,
} from './apps/inspection-coord/index.js';

import {
  registerBudgetTrackerEvents,
  budgetTrackerQueue,
} from './apps/budget-tracker/index.js';

import {
  registerCommunicationHubEvents,
  communicationHubQueue,
} from './apps/communication-hub/index.js';

import {
  registerTaskQueueEvents,
  taskQueueQueue,
} from './apps/task-queue/index.js';

import {
  registerDocumentGenEvents,
  documentGenQueue,
} from './apps/document-gen/index.js';

import {
  registerPredictiveEngineEvents,
  predictiveEngineQueue,
} from './apps/predictive-engine/index.js';

import {
  registerSmartSchedulerEvents,
  smartSchedulerQueue,
} from './apps/smart-scheduler/index.js';

import {
  registerQAInspectorEvents,
  qaInspectorQueue,
} from './apps/qa-inspector/index.js';

import {
  registerDecisionSupportEvents,
  decisionSupportQueue,
} from './apps/decision-support/index.js';

import {
  registerDashboardJobs,
  dashboardQueue,
} from './apps/dashboard/index.js';

// ── Types ──────────────────────────────────────────────────────────────────

interface ChainStep {
  appId: string;
  description: string;
  execute: () => Promise<any>;
}

const prisma = new PrismaClient();
const SOURCE_APP = 'EVENT-ROUTER';

// ── Helper: Execute a chain with tracking ──────────────────────────────────

async function executeChain(
  chainName: string,
  steps: ChainStep[],
  context: { projectId?: string; userId?: string },
): Promise<void> {
  const chainId = randomUUID();
  const startTime = Date.now();

  // Create an AutomationTask to track this chain execution
  const task = await prisma.automationTask.create({
    data: {
      type: `chain_execution:${chainName}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      projectId: context.projectId ?? null,
      payload: {
        chainId,
        chainName,
        totalSteps: steps.length,
        projectId: context.projectId,
        userId: context.userId,
      } as any,
      startedAt: new Date(),
    },
  });

  // Log chain start in AutomationEvent
  await prisma.automationEvent.create({
    data: {
      eventType: `chain.started`,
      sourceApp: SOURCE_APP,
      projectId: context.projectId,
      payload: { chainId, chainName, steps: steps.map((s) => s.appId) },
      processedBy: [],
    },
  });

  console.log(`[EventRouter] Chain "${chainName}" started (${chainId}) — ${steps.length} steps`);

  const results: { appId: string; status: 'ok' | 'failed'; durationMs: number; error?: string }[] = [];

  for (const step of steps) {
    const stepStart = Date.now();
    try {
      await step.execute();
      results.push({
        appId: step.appId,
        status: 'ok',
        durationMs: Date.now() - stepStart,
      });
      console.log(`[EventRouter]   ✓ ${step.appId}: ${step.description} (${Date.now() - stepStart}ms)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        appId: step.appId,
        status: 'failed',
        durationMs: Date.now() - stepStart,
        error: message,
      });
      // Log but continue — one app failure should not block the chain
      console.error(`[EventRouter]   ✗ ${step.appId}: ${step.description} — ${message}`);
    }
  }

  const totalDuration = Date.now() - startTime;
  const failedCount = results.filter((r) => r.status === 'failed').length;

  // Update the chain tracking task
  await prisma.automationTask.update({
    where: { id: task.id },
    data: {
      status: failedCount === 0 ? 'COMPLETED' : 'COMPLETED',
      result: { chainId, totalDuration, results } as any,
      completedAt: new Date(),
    },
  });

  // Log chain completion in AutomationEvent
  await prisma.automationEvent.create({
    data: {
      eventType: `chain.completed`,
      sourceApp: SOURCE_APP,
      projectId: context.projectId,
      payload: { chainId, chainName, totalDuration, failedCount, results },
      processedBy: [],
    },
  });

  console.log(
    `[EventRouter] Chain "${chainName}" completed in ${totalDuration}ms` +
      (failedCount > 0 ? ` (${failedCount} failures)` : ''),
  );
}

// ── EventRouter class ──────────────────────────────────────────────────────

export class EventRouter {
  /**
   * Register all 15 app event subscriptions, then add cross-app chain handlers.
   */
  registerAll(): void {
    console.log('[EventRouter] Registering all app event subscriptions...');

    // ─── Per-app event registrations ─────────────────────────────────
    registerBidEngineEvents();          // APP-01
    registerVisitSchedulerEvents();     // APP-02
    registerChangeOrderEvents();        // APP-03
    registerReportGeneratorEvents();    // APP-04
    registerPermitTrackerEvents();      // APP-05
    registerInspectionCoordEvents();    // APP-06
    registerBudgetTrackerEvents();      // APP-07
    registerCommunicationHubEvents();   // APP-08
    registerTaskQueueEvents();          // APP-09
    registerDocumentGenEvents();        // APP-10
    registerPredictiveEngineEvents();   // APP-11
    registerSmartSchedulerEvents();     // APP-12
    registerQAInspectorEvents();        // APP-13
    registerDecisionSupportEvents();    // APP-14
    registerDashboardJobs();            // APP-15

    console.log('[EventRouter] All 15 app subscriptions registered');

    // ─── Cross-app chain handlers ────────────────────────────────────
    this.registerChain1_ProjectKickoff();
    this.registerChain2_MilestoneFlow();
    this.registerChain3_ProblemDetection();
    this.registerChain4_WeeklyCycle();
    this.registerChain5_Onboarding();

    console.log('[EventRouter] All 5 cross-app chains registered');
    console.log('[EventRouter] Initialization complete');
  }

  // ═══ CHAIN 1: PROJECT KICKOFF ═══════════════════════════════════════════
  // Triggered by: contract.signed
  // Orchestrates the full project startup sequence across 8 apps.
  private registerChain1_ProjectKickoff(): void {
    eventBus.subscribe(EVENT_TYPES.CONTRACT_SIGNED, async (event) => {
      if (!event.projectId) return;

      const projectId = event.projectId;
      const projectType = event.data.projectType ?? 'RENOVATION';
      const contractNumber = event.data.contractNumber ?? '';

      await executeChain('project_kickoff', [
        // 1. APP-10 → generate project documents (contract, SOW)
        {
          appId: 'APP-10',
          description: 'Generate project documents',
          execute: () =>
            addJob(documentGenQueue, 'generate-document', {
              projectId,
              templateName: 'scope_of_work',
              variables: { project_name: event.data.projectName ?? '', contract_number: contractNumber },
            }),
        },
        // 2. APP-09 → create project task list
        {
          appId: 'APP-09',
          description: 'Create project task list',
          execute: () =>
            addJob(taskQueueQueue, 'create-project-tasks', {
              projectId,
              projectType,
            }),
        },
        // 3. APP-02 → schedule first site visit + weekly cadence
        {
          appId: 'APP-02',
          description: 'Schedule site visits',
          execute: () =>
            addJob(visitSchedulerQueue, 'schedule-weekly', {
              pmId: event.data.pmId ?? event.userId,
            }),
        },
        // 4. APP-05 → check if permits are needed
        {
          appId: 'APP-05',
          description: 'Check permit requirements',
          execute: () =>
            addJob(permitTrackerQueue, 'check-submitted', {
              projectId,
            }),
        },
        // 5. APP-07 → initialize budget tracking
        {
          appId: 'APP-07',
          description: 'Initialize budget tracking',
          execute: () =>
            addJob(budgetTrackerQueue, 'create-snapshot', {
              projectId,
            }),
        },
        // 6. APP-12 → build optimized schedule (after tasks created via delay)
        {
          appId: 'APP-12',
          description: 'Build optimized schedule',
          execute: () =>
            addJob(
              smartSchedulerQueue,
              'optimize-schedule',
              { projectId },
              { delay: 10_000 }, // 10s delay to let task creation finish
            ),
        },
        // 7. APP-08 → send kickoff email to all parties
        {
          appId: 'APP-08',
          description: 'Send kickoff communications',
          execute: () =>
            addJob(communicationHubQueue, 'send-template', {
              templateName: 'contract_signed',
              projectId,
              audience: 'all' as const,
              variables: {
                project_name: event.data.projectName ?? '',
                contract_number: contractNumber,
              },
            }),
        },
        // 8. APP-11 → create baseline risk assessment
        {
          appId: 'APP-11',
          description: 'Create baseline risk assessment',
          execute: () =>
            addJob(predictiveEngineQueue, 'analyze-project', {
              projectId,
            }),
        },
      ], { projectId, userId: event.userId });
    });

    console.log('[EventRouter] Chain 1 (Project Kickoff) registered');
  }

  // ═══ CHAIN 2: MILESTONE FLOW ════════════════════════════════════════════
  // Triggered by: project.milestone.completed
  // Steps 1-5 fire immediately, then 6-7 fire on inspection.passed.
  private registerChain2_MilestoneFlow(): void {
    // Part A: milestone completed → first 5 steps
    eventBus.subscribe(EVENT_TYPES.MILESTONE_COMPLETED, async (event) => {
      if (!event.projectId) return;

      const projectId = event.projectId;
      const milestoneId = event.data.milestoneId;

      await executeChain('milestone_flow', [
        // 1. APP-06 → schedule inspection
        {
          appId: 'APP-06',
          description: 'Schedule milestone inspection',
          execute: () =>
            addJob(inspectionQueue, 'schedule-inspection', {
              projectId,
              type: event.data.inspectionType ?? 'SITE',
              permitId: event.data.permitId,
              milestoneId,
              requestedBy: event.userId ?? 'system',
            }),
        },
        // 2. APP-07 → update budget snapshot
        {
          appId: 'APP-07',
          description: 'Update budget snapshot',
          execute: () =>
            addJob(budgetTrackerQueue, 'create-snapshot', {
              projectId,
            }),
        },
        // 3. APP-04 → generate milestone report
        {
          appId: 'APP-04',
          description: 'Generate milestone report',
          execute: () =>
            addJob(reportGeneratorQueue, 'generate-milestone', {
              projectId,
              milestoneId,
            }),
        },
        // 4. APP-08 → notify client
        {
          appId: 'APP-08',
          description: 'Notify client of milestone completion',
          execute: () =>
            addJob(communicationHubQueue, 'send-template', {
              templateName: 'milestone_completed',
              projectId,
              audience: 'client' as const,
              variables: {
                project_name: event.data.projectName ?? '',
                milestone_name: event.data.milestoneName ?? '',
              },
            }),
        },
        // 5. APP-09 → assign next-phase tasks
        {
          appId: 'APP-09',
          description: 'Advance to next phase tasks',
          execute: () =>
            addJob(taskQueueQueue, 'advance-phase', {
              projectId,
            }),
        },
      ], { projectId, userId: event.userId });
    });

    // Part B: inspection passed → payment release decision
    eventBus.subscribe(EVENT_TYPES.INSPECTION_PASSED, async (event) => {
      if (!event.projectId) return;

      const projectId = event.projectId;

      await executeChain('milestone_payment_release', [
        // 6. APP-14 → create payment release decision for client
        {
          appId: 'APP-14',
          description: 'Create payment release decision',
          execute: () =>
            addJob(decisionSupportQueue, 'create-decision', {
              projectId,
              type: 'payment_release',
              title: `Payment release — ${event.data.inspectionType ?? 'milestone'} inspection passed`,
              urgency: 'high',
            }),
        },
        // 7. APP-08 → notify client to approve payment
        {
          appId: 'APP-08',
          description: 'Notify client to approve payment',
          execute: () =>
            addJob(communicationHubQueue, 'send-template', {
              templateName: 'inspection_passed',
              projectId,
              audience: 'client' as const,
              variables: {
                project_name: event.data.projectName ?? '',
                inspection_type: event.data.inspectionType ?? 'Inspection',
              },
            }),
        },
      ], { projectId, userId: event.userId });
    });

    console.log('[EventRouter] Chain 2 (Milestone Flow) registered');
  }

  // ═══ CHAIN 3: PROBLEM DETECTION ═════════════════════════════════════════
  // Triggered by: qa.issue_detected with severity HIGH or CRITICAL
  private registerChain3_ProblemDetection(): void {
    eventBus.subscribe(EVENT_TYPES.QA_ISSUE_DETECTED, async (event) => {
      const severity = event.data.severity;
      if (!event.projectId || (severity !== 'HIGH' && severity !== 'CRITICAL')) {
        return;
      }

      const projectId = event.projectId;

      await executeChain('problem_detection', [
        // 1. APP-09 → create correction task
        {
          appId: 'APP-09',
          description: 'Create correction task',
          execute: () =>
            addJob(taskQueueQueue, 'create-project-tasks', {
              projectId,
              projectType: 'MAINTENANCE', // correction work
            }),
        },
        // 2. APP-08 → notify PM + contractor
        {
          appId: 'APP-08',
          description: 'Notify PM and contractor of QA issue',
          execute: async () => {
            await addJob(communicationHubQueue, 'send-template', {
              templateName: 'qa_issue_pm',
              projectId,
              audience: 'pm' as const,
              variables: {
                project_name: event.data.projectName ?? '',
                issue_summary: event.data.issueSummary ?? '',
                severity,
              },
            });
            await addJob(communicationHubQueue, 'send-template', {
              templateName: 'qa_issue_contractor',
              projectId,
              audience: 'contractor' as const,
              variables: {
                project_name: event.data.projectName ?? '',
                issue_summary: event.data.issueSummary ?? '',
                severity,
              },
            });
          },
        },
        // 3. APP-03 → evaluate if change order needed
        {
          appId: 'APP-03',
          description: 'Evaluate change order need',
          execute: () =>
            addJob(changeOrderQueue, 'generate', {
              projectId,
              title: `QA Correction — ${severity} issue`,
              description: event.data.issueSummary ?? 'Quality issue requiring correction',
              reason: 'CODE_COMPLIANCE',
              requestedBy: 'system',
            }),
        },
        // 4. APP-11 → re-analyze project risk
        {
          appId: 'APP-11',
          description: 'Re-analyze project risk',
          execute: () =>
            addJob(predictiveEngineQueue, 'analyze-project', {
              projectId,
            }),
        },
        // 5. APP-14 → queue decision if CO needed
        {
          appId: 'APP-14',
          description: 'Queue change order decision',
          execute: () =>
            addJob(decisionSupportQueue, 'create-decision', {
              projectId,
              type: 'change_order',
              title: `QA ${severity} issue — evaluate corrective change order`,
              urgency: severity === 'CRITICAL' ? 'critical' : 'high',
            }),
        },
      ], { projectId, userId: event.userId });
    });

    console.log('[EventRouter] Chain 3 (Problem Detection) registered');
  }

  // ═══ CHAIN 4: WEEKLY CYCLE ══════════════════════════════════════════════
  // Monday 6am cron + Friday 4pm cron
  private registerChain4_WeeklyCycle(): void {
    // Monday 6am: analysis + optimization + overdue checks + visit scheduling
    dashboardQueue.add(
      'weekly-monday-chain',
      {},
      {
        repeat: { pattern: '0 6 * * 1' }, // Monday 6am
        jobId: 'weekly-monday-chain-repeat',
      },
    ).catch((err) => {
      console.error('[EventRouter] Failed to add Monday chain cron:', err.message);
    });

    // Friday 4pm: generate + send weekly reports
    dashboardQueue.add(
      'weekly-friday-chain',
      {},
      {
        repeat: { pattern: '0 16 * * 5' }, // Friday 4pm
        jobId: 'weekly-friday-chain-repeat',
      },
    ).catch((err) => {
      console.error('[EventRouter] Failed to add Friday chain cron:', err.message);
    });

    console.log('[EventRouter] Chain 4 (Weekly Cycle) registered');
  }

  /**
   * Execute the Monday weekly cycle chain.
   * Called by the dashboard worker when it picks up the 'weekly-monday-chain' job.
   */
  async executeMondayCycle(): Promise<void> {
    await executeChain('weekly_monday_cycle', [
      // 1. APP-11 → analyze all active projects (risk)
      {
        appId: 'APP-11',
        description: 'Analyze all active projects for risk',
        execute: () =>
          addJob(predictiveEngineQueue, 'analyze-all', {}),
      },
      // 2. APP-12 → optimize all active schedules
      {
        appId: 'APP-12',
        description: 'Optimize all active schedules',
        execute: () =>
          addJob(smartSchedulerQueue, 'optimize-all', {}),
      },
      // 3. APP-09 → check overdue tasks, reassign
      {
        appId: 'APP-09',
        description: 'Check overdue tasks and reassign',
        execute: async () => {
          await addJob(taskQueueQueue, 'check-overdue', {});
          await addJob(taskQueueQueue, 'rebalance-workload', {});
        },
      },
      // 4. APP-02 → schedule weekly visits
      {
        appId: 'APP-02',
        description: 'Schedule weekly site visits',
        execute: () =>
          addJob(visitSchedulerQueue, 'schedule-weekly-cron', {}),
      },
    ], {});
  }

  /**
   * Execute the Friday weekly cycle chain.
   * Called by the dashboard worker when it picks up the 'weekly-friday-chain' job.
   */
  async executeFridayCycle(): Promise<void> {
    await executeChain('weekly_friday_cycle', [
      // 5. APP-04 → generate weekly reports for all projects
      {
        appId: 'APP-04',
        description: 'Generate weekly reports',
        execute: () =>
          addJob(reportGeneratorQueue, 'weekly-cron', {}),
      },
      // 6. APP-08 → send reports to all clients (delayed to let generation finish)
      {
        appId: 'APP-08',
        description: 'Send weekly reports to clients',
        execute: () =>
          addJob(
            communicationHubQueue,
            'send-template',
            {
              templateName: 'weekly_report',
              audience: 'all' as const,
              variables: {},
            },
            { delay: 60_000 }, // 60s delay to allow report generation
          ),
      },
    ], {});
  }

  // ═══ CHAIN 5: ONBOARDING ════════════════════════════════════════════════
  // Triggered by: user.signed_up
  private registerChain5_Onboarding(): void {
    eventBus.subscribe(EVENT_TYPES.USER_SIGNED_UP, async (event) => {
      if (!event.userId) return;

      const userId = event.userId;
      const isContractor = event.data.role === 'contractor';

      await executeChain('user_onboarding', [
        // 1. APP-08 → welcome email sequence
        {
          appId: 'APP-08',
          description: 'Send welcome email sequence',
          execute: () =>
            addJob(communicationHubQueue, 'send-notification', {
              userId,
              type: 'welcome',
              title: 'Welcome to Kealee!',
              body: 'Your account has been created. Get started by setting up your first project.',
              channels: ['email', 'in_app'],
            }),
        },
        // 2. APP-09 → create onboarding task checklist
        {
          appId: 'APP-09',
          description: 'Create onboarding task checklist',
          execute: () =>
            addJob(taskQueueQueue, 'create-project-tasks', {
              projectType: 'MAINTENANCE', // lightweight onboarding checklist
              userId,
            }),
        },
      ], { userId });
    });

    // Contractor-specific: when onboarding completes, send marketplace notification
    eventBus.subscribe(EVENT_TYPES.USER_ONBOARDING_COMPLETE, async (event) => {
      if (!event.userId) return;
      if (event.data.role !== 'contractor') return;

      await executeChain('contractor_onboarding_complete', [
        // 3–4. APP-08 → "You're now receiving leads" email
        {
          appId: 'APP-08',
          description: 'Send marketplace live notification',
          execute: () =>
            addJob(communicationHubQueue, 'send-notification', {
              userId: event.userId,
              type: 'marketplace_live',
              title: 'Your profile is live!',
              body: "You're now receiving leads on the Kealee marketplace. Good luck!",
              channels: ['email', 'in_app'],
            }),
        },
      ], { userId: event.userId });
    });

    console.log('[EventRouter] Chain 5 (Onboarding) registered');
  }
}

export const eventRouter = new EventRouter();
