import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';
import { AIProvider } from '@kealee/ai';
import { BaseClaw } from '../base-claw';
import { registerTaskOrchestratorWorker } from './workers/task-orchestrator';
import { registerJobSchedulerWorker } from './workers/job-scheduler';
import { evaluateRules, executeRules } from './workers/automation-rules';

// Config per architecture doc SS13
const CLAW_CONFIG = {
  name: 'command-automation-claw',
  eventPatterns: ['kealee.*'], // ALL events -- meta-orchestrator
  writableModels: [
    'AutomationTask',
    'JobQueue',
    'JobSchedule',
    'DashboardWidget',
    'Notification',
    'ActivityLog',
    'Alert',
  ],
};

/**
 * Claw H: Command Center & Automation
 *
 * META-ORCHESTRATOR -- monitors ALL claws and ALL events.
 *
 * Responsibilities:
 * - Log every event to ActivityLog
 * - Evaluate deterministic automation rules
 * - Create follow-up tasks when rules match
 * - Schedule and dispatch cron jobs across all claws
 * - Generate daily and weekly summary reports
 *
 * GUARDRAILS:
 * - Cannot make domain decisions
 * - Cannot override claw guardrails
 * - Cannot directly write to domain-owned models
 */
export class CommandAutomationClaw extends BaseClaw {
  private ai: AIProvider;

  constructor(eventBus: EventBus, prisma: PrismaClient) {
    super(eventBus, prisma, CLAW_CONFIG);
    this.ai = new AIProvider();
  }

  // ---------------------------------------------------------------------------
  // Event Handler -- process ALL events
  // ---------------------------------------------------------------------------

  async handleEvent(event: KealeeEventEnvelope): Promise<void> {
    // STEP 1: Log every event to ActivityLog (unconditional)
    const logQueue = createQueue(KEALEE_QUEUES.TASK_ORCHESTRATOR);
    await logQueue.add('log-event', { event });

    // STEP 2: Evaluate deterministic automation rules
    const matchedRules = evaluateRules(event.type);

    if (matchedRules.length > 0) {
      // Execute matched rules synchronously (deterministic, no AI needed)
      await executeRules(
        matchedRules,
        event,
        this.prisma,
        this.eventBus,
        this.config,
        this.assertWritable.bind(this),
      );
    } else if (this.shouldEvaluateWithAI(event)) {
      // STEP 3: For events without deterministic rules, queue AI evaluation
      await logQueue.add('evaluate-automation', { event });
    }
  }

  // ---------------------------------------------------------------------------
  // Worker Registration
  // ---------------------------------------------------------------------------

  async registerWorkers(): Promise<void> {
    const boundAssertWritable = this.assertWritable.bind(this);

    // Register task orchestrator (event logging, AI evaluation, overdue checks)
    registerTaskOrchestratorWorker(
      this.prisma,
      this.eventBus,
      this.config,
      this.ai,
      boundAssertWritable,
    );

    // Register job scheduler (cron dispatch, daily/weekly summaries)
    registerJobSchedulerWorker(
      this.prisma,
      this.eventBus,
      this.config,
      this.ai,
      boundAssertWritable,
    );

    // Schedule hourly overdue task check
    const orchestratorQueue = createQueue(KEALEE_QUEUES.TASK_ORCHESTRATOR);
    await orchestratorQueue.add(
      'check-overdue',
      {},
      {
        repeat: {
          pattern: '0 * * * *', // Every hour on the hour
          tz: 'America/New_York',
        },
      },
    );

    // Schedule cron jobs for all claws (dispatched via job-scheduler)
    const schedulerQueue = createQueue(KEALEE_QUEUES.JOB_SCHEDULER);

    // 5 AM -- Risk assessment (-> Claw G)
    await schedulerQueue.add(
      'dispatch-scheduled-job',
      {
        scheduleName: 'nightly-risk-assessment',
        targetQueue: KEALEE_QUEUES.PREDICTIVE_ENGINE,
        targetJobName: 'nightly-risk-assessment',
      },
      {
        repeat: {
          pattern: '0 5 * * *',
          tz: 'America/New_York',
        },
      },
    );

    // 6 AM -- Permit check (-> Claw E)
    await schedulerQueue.add(
      'dispatch-scheduled-job',
      {
        scheduleName: 'morning-permit-check',
        targetQueue: KEALEE_QUEUES.PERMIT_TRACKER,
        targetJobName: 'daily-permit-check',
      },
      {
        repeat: {
          pattern: '0 6 * * *',
          tz: 'America/New_York',
        },
      },
    );

    // 7 AM -- Weather sync (-> Claw C)
    await schedulerQueue.add(
      'dispatch-scheduled-job',
      {
        scheduleName: 'morning-weather-sync',
        targetQueue: KEALEE_QUEUES.SMART_SCHEDULER,
        targetJobName: 'sync-weather',
      },
      {
        repeat: {
          pattern: '0 7 * * *',
          tz: 'America/New_York',
        },
      },
    );

    // 8 AM -- Budget snapshot (-> Claw D)
    await schedulerQueue.add(
      'dispatch-scheduled-job',
      {
        scheduleName: 'morning-budget-snapshot',
        targetQueue: KEALEE_QUEUES.BUDGET_TRACKER,
        targetJobName: 'daily-budget-snapshot',
      },
      {
        repeat: {
          pattern: '0 8 * * *',
          tz: 'America/New_York',
        },
      },
    );

    // 6 PM -- Daily summary (-> Self, Claw H)
    const taskQueue = createQueue(KEALEE_QUEUES.TASK_ORCHESTRATOR);
    await taskQueue.add(
      'generate-daily-summary',
      { scheduledBy: this.config.name },
      {
        repeat: {
          pattern: '0 18 * * *',
          tz: 'America/New_York',
        },
      },
    );

    // Monday 9 AM -- Weekly reports (-> Self, Claw H)
    await taskQueue.add(
      'generate-weekly-report',
      { scheduledBy: this.config.name },
      {
        repeat: {
          pattern: '0 9 * * 1',
          tz: 'America/New_York',
        },
      },
    );

    // Sync all schedule definitions to JobSchedule table
    await schedulerQueue.add('sync-schedules', {});

    console.log(`[${this.config.name}] Cron schedules registered:`);
    console.log(`  05:00 AM ET - Nightly risk assessment (-> Claw G)`);
    console.log(`  06:00 AM ET - Morning permit check (-> Claw E)`);
    console.log(`  07:00 AM ET - Morning weather sync (-> Claw C)`);
    console.log(`  08:00 AM ET - Morning budget snapshot (-> Claw D)`);
    console.log(`  06:00 PM ET - Daily summary (-> Claw H)`);
    console.log(`  Monday 09:00 AM ET - Weekly reports (-> Claw H)`);
    console.log(`  Hourly - Overdue task check`);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Determine whether an event should be evaluated by AI for potential automation.
   * Filters out low-value events to avoid unnecessary AI calls.
   */
  private shouldEvaluateWithAI(event: KealeeEventEnvelope): boolean {
    // Skip if no project context (cannot create meaningful tasks)
    if (!event.projectId) return false;

    // Skip task.* and system.* events (self-referential / would create loops)
    if (event.type.startsWith('task.') || event.type.startsWith('system.')) {
      return false;
    }

    // Skip low-signal events that rarely need follow-up
    const lowSignalPrefixes = [
      'document.viewed',
      'communication.read',
    ];
    if (lowSignalPrefixes.some((prefix) => event.type.startsWith(prefix))) {
      return false;
    }

    // All other events are candidates for AI evaluation
    return true;
  }
}
