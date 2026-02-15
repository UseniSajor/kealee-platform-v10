import type { PrismaClient } from '@prisma/client';
import type { EventBus } from '@kealee/events';
import { createEvent } from '@kealee/events';
import { KEALEE_QUEUES, createQueue, createWorker } from '@kealee/queue';
import { AIProvider } from '@kealee/ai';
import type { ClawConfig } from '../../base-claw';
import { SUMMARY_REPORT_PROMPT } from '../ai/prompts';
import type { Job } from 'bullmq';

// ---------------------------------------------------------------------------
// Schedule Definitions
// ---------------------------------------------------------------------------

/**
 * Master cron schedule for the Kealee platform.
 * Each job dispatches work to the appropriate claw's queue.
 *
 * GUARDRAIL: This scheduler only QUEUES jobs in other claws' queues.
 * It cannot make domain decisions or write to domain-owned models.
 */
const SCHEDULED_JOBS = [
  {
    name: 'nightly-risk-assessment',
    cron: '0 5 * * *', // 5:00 AM daily
    queue: KEALEE_QUEUES.PREDICTIVE_ENGINE, // -> Claw G
    jobName: 'nightly-risk-assessment',
    description: 'Full portfolio risk assessment',
  },
  {
    name: 'morning-permit-check',
    cron: '0 6 * * *', // 6:00 AM daily
    queue: KEALEE_QUEUES.PERMIT_TRACKER, // -> Claw E
    jobName: 'daily-permit-check',
    description: 'Check permit expirations and status updates',
  },
  {
    name: 'morning-weather-sync',
    cron: '0 7 * * *', // 7:00 AM daily
    queue: KEALEE_QUEUES.SMART_SCHEDULER, // -> Claw C
    jobName: 'sync-weather',
    description: 'Fetch weather forecasts and flag disruption days',
  },
  {
    name: 'morning-budget-snapshot',
    cron: '0 8 * * *', // 8:00 AM daily
    queue: KEALEE_QUEUES.BUDGET_TRACKER, // -> Claw D
    jobName: 'daily-budget-snapshot',
    description: 'Capture daily budget snapshot for trend analysis',
  },
  {
    name: 'evening-summary-report',
    cron: '0 18 * * *', // 6:00 PM daily
    queue: KEALEE_QUEUES.TASK_ORCHESTRATOR, // -> Self (Claw H)
    jobName: 'generate-daily-summary',
    description: 'Generate end-of-day project portfolio summary',
  },
  {
    name: 'monday-weekly-reports',
    cron: '0 9 * * 1', // 9:00 AM Monday
    queue: KEALEE_QUEUES.TASK_ORCHESTRATOR, // -> Self (Claw H)
    jobName: 'generate-weekly-report',
    description: 'Generate weekly project portfolio report',
  },
] as const;

/**
 * Job Scheduler Worker
 *
 * Responsibilities:
 * - Register and maintain cron schedules for all claws
 * - Dispatch scheduled jobs to appropriate queues
 * - Generate daily/weekly summary reports
 * - Track schedule execution (JobSchedule, JobQueue models)
 *
 * GUARDRAILS:
 * - Cannot make domain decisions
 * - Cannot override claw guardrails
 * - Cannot directly write to domain-owned models
 */
export function registerJobSchedulerWorker(
  prisma: PrismaClient,
  eventBus: EventBus,
  config: ClawConfig,
  ai: AIProvider,
  assertWritable: (model: string) => void,
): void {

  createWorker(KEALEE_QUEUES.JOB_SCHEDULER, async (job: Job) => {
    switch (job.name) {
      case 'dispatch-scheduled-job':
        await handleDispatchScheduledJob(job);
        break;
      case 'generate-daily-summary':
        await handleGenerateDailySummary(job);
        break;
      case 'generate-weekly-report':
        await handleGenerateWeeklyReport(job);
        break;
      case 'sync-schedules':
        await handleSyncSchedules(job);
        break;
    }
  });

  // Also handle summary jobs that land in TASK_ORCHESTRATOR queue
  // (since the cron dispatches to TASK_ORCHESTRATOR for self-directed work)
  // The task-orchestrator worker will route these back to job-scheduler.

  // -------------------------------------------------------------------------
  // Dispatch Scheduled Job -- route cron trigger to the target queue
  // -------------------------------------------------------------------------

  async function handleDispatchScheduledJob(job: Job): Promise<void> {
    const { scheduleName, targetQueue, targetJobName } = job.data as {
      scheduleName: string;
      targetQueue: string;
      targetJobName: string;
    };

    assertWritable('JobQueue');
    assertWritable('JobSchedule');

    // Track execution in JobQueue
    const jobRecord = await prisma.jobQueue.create({
      data: {
        queueName: targetQueue,
        jobId: `${scheduleName}-${Date.now()}`,
        jobName: targetJobName,
        status: 'ACTIVE',
        priority: 0,
        data: { scheduleName, dispatchedAt: new Date().toISOString() },
      },
    });

    // Dispatch to the target queue
    const targetQueueInstance = createQueue(targetQueue);
    await targetQueueInstance.add(targetJobName, {
      scheduledBy: config.name,
      scheduleName,
      jobQueueId: jobRecord.id,
    });

    // Update JobSchedule run tracking
    await prisma.jobSchedule.updateMany({
      where: { name: scheduleName },
      data: {
        lastRunAt: new Date(),
        runCount: { increment: 1 },
      },
    });

    // Update JobQueue status
    await prisma.jobQueue.update({
      where: { id: jobRecord.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        progress: 100,
      },
    });
  }

  // -------------------------------------------------------------------------
  // Generate Daily Summary -- AI-powered end-of-day report
  // -------------------------------------------------------------------------

  async function handleGenerateDailySummary(_job: Job): Promise<void> {
    assertWritable('Notification');
    assertWritable('ActivityLog');

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    // Gather day's activity data (read-only from other domains)
    const [
      activeProjects,
      todayActivities,
      pendingTasks,
      overdueTasks,
      pendingDecisions,
      recentPredictions,
      recentAlerts,
    ] = await Promise.all([
      prisma.project.count({ where: { status: { in: ['ACTIVE', 'IN_PROGRESS'] } } }),
      prisma.activityLog.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.automationTask.count({ where: { status: 'PENDING' } }),
      prisma.automationTask.count({
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] }, dueAt: { lt: today } },
      }),
      prisma.decisionLog.count({ where: { accepted: null } }),
      prisma.prediction.count({
        where: { createdAt: { gte: startOfDay }, acknowledged: false },
      }),
      prisma.alert.count({
        where: { createdAt: { gte: startOfDay }, acknowledged: false },
      }),
    ]);

    // AI summary generation
    const aiResult = await ai.reason({
      task: 'Generate an end-of-day project portfolio summary.',
      context: {
        date: today.toISOString().split('T')[0],
        activeProjects,
        todayActivities,
        pendingTasks,
        overdueTasks,
        pendingDecisions,
        newPredictions: recentPredictions,
        newAlerts: recentAlerts,
      },
      systemPrompt: SUMMARY_REPORT_PROMPT,
    });

    // Log the summary as an activity
    await prisma.activityLog.create({
      data: {
        action: 'system.daily.summary',
        category: 'SYSTEM',
        entityType: 'REPORT',
        description: 'Daily portfolio summary generated',
        metadata: {
          report: aiResult,
          generatedAt: today.toISOString(),
          metrics: {
            activeProjects,
            todayActivities,
            pendingTasks,
            overdueTasks,
            pendingDecisions,
          },
        },
      },
    });

    // Publish system metric event
    const metricEvent = createEvent({
      type: 'system.metric.updated',
      source: config.name,
      payload: {
        metricType: 'DAILY_SUMMARY',
        date: today.toISOString().split('T')[0],
        activeProjects,
        pendingTasks,
        overdueTasks,
        pendingDecisions,
      },
    });
    await eventBus.publish(metricEvent);
  }

  // -------------------------------------------------------------------------
  // Generate Weekly Report -- comprehensive weekly portfolio analysis
  // -------------------------------------------------------------------------

  async function handleGenerateWeeklyReport(_job: Job): Promise<void> {
    assertWritable('Notification');
    assertWritable('ActivityLog');

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86_400_000);

    // Gather weekly data (read-only from other domains)
    const [
      activeProjects,
      completedProjects,
      weekActivities,
      tasksCreated,
      tasksCompleted,
      predictionsCreated,
      decisionsResolved,
      inspectionsCompleted,
    ] = await Promise.all([
      prisma.project.count({ where: { status: { in: ['ACTIVE', 'IN_PROGRESS'] } } }),
      prisma.project.count({
        where: { status: 'COMPLETED', updatedAt: { gte: weekAgo } },
      }),
      prisma.activityLog.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.automationTask.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.automationTask.count({
        where: { status: 'COMPLETED', completedAt: { gte: weekAgo } },
      }),
      prisma.prediction.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.decisionLog.count({
        where: { accepted: { not: null }, acceptedAt: { gte: weekAgo } },
      }),
      prisma.inspection.count({
        where: { status: 'COMPLETED', updatedAt: { gte: weekAgo } },
      }),
    ]);

    // AI weekly report generation
    const aiResult = await ai.reason({
      task: 'Generate a comprehensive weekly project portfolio report.',
      context: {
        periodStart: weekAgo.toISOString().split('T')[0],
        periodEnd: now.toISOString().split('T')[0],
        activeProjects,
        completedProjects,
        weekActivities,
        tasksCreated,
        tasksCompleted,
        predictionsCreated,
        decisionsResolved,
        inspectionsCompleted,
      },
      systemPrompt: SUMMARY_REPORT_PROMPT,
    });

    // Log the weekly report
    await prisma.activityLog.create({
      data: {
        action: 'system.weekly.report',
        category: 'SYSTEM',
        entityType: 'REPORT',
        description: 'Weekly portfolio report generated',
        metadata: {
          report: aiResult,
          generatedAt: now.toISOString(),
          period: {
            start: weekAgo.toISOString(),
            end: now.toISOString(),
          },
          metrics: {
            activeProjects,
            completedProjects,
            tasksCreated,
            tasksCompleted,
            predictionsCreated,
            decisionsResolved,
          },
        },
      },
    });

    // Publish weekly metric event
    const metricEvent = createEvent({
      type: 'system.metric.updated',
      source: config.name,
      payload: {
        metricType: 'WEEKLY_REPORT',
        periodStart: weekAgo.toISOString().split('T')[0],
        periodEnd: now.toISOString().split('T')[0],
        activeProjects,
        completedProjects,
        tasksCreated,
        tasksCompleted,
      },
    });
    await eventBus.publish(metricEvent);
  }

  // -------------------------------------------------------------------------
  // Sync Schedules -- ensure all cron jobs are registered in JobSchedule
  // -------------------------------------------------------------------------

  async function handleSyncSchedules(_job: Job): Promise<void> {
    assertWritable('JobSchedule');

    for (const schedule of SCHEDULED_JOBS) {
      // Upsert each schedule definition
      const existing = await prisma.jobSchedule.findFirst({
        where: {
          name: schedule.name,
          queueName: schedule.queue,
        },
      });

      if (!existing) {
        await prisma.jobSchedule.create({
          data: {
            name: schedule.name,
            description: schedule.description,
            queueName: schedule.queue,
            cronExpression: schedule.cron,
            jobData: {
              scheduleName: schedule.name,
              targetQueue: schedule.queue,
              targetJobName: schedule.jobName,
            },
            timezone: 'America/New_York',
            isActive: true,
          },
        });
      }
    }
  }
}

// Export the schedule definitions for reference
export { SCHEDULED_JOBS };
