import { PrismaClient } from '@prisma/client';
import { generateJSON } from '../../infrastructure/ai.js';
import { AI_PROMPTS } from '../../infrastructure/ai-prompts.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';

const prisma = new PrismaClient();
const SOURCE_APP = 'APP-12';

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

interface CriticalPathItem {
  taskId: string;
  title: string;
  start: string;
  end: string;
  float: number;
}

interface OptimizedTask {
  taskId: string;
  recommendedStart: string;
  recommendedEnd: string;
  rationale: string;
}

interface WeatherConflict {
  taskId: string;
  conflictDate: string;
  weatherIssue: string;
  recommendation: string;
}

interface ResourceConflict {
  taskId: string;
  conflict: string;
  recommendation: string;
}

interface ScheduleOptimizationResult {
  criticalPath: CriticalPathItem[];
  optimizedTasks: OptimizedTask[];
  weatherConflicts: WeatherConflict[];
  resourceConflicts: ResourceConflict[];
  overallAssessment: string;
  estimatedCompletion: string;
  confidenceLevel: number;
}

interface DisruptionInput {
  type: string;
  description: string;
  affectedTaskIds: string[];
}

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

/**
 * Compute earliest-start / earliest-finish / latest-start / latest-finish
 * and float for a set of schedule items. Returns items annotated with
 * critical-path data.
 */
function computeCriticalPath(
  items: Array<{
    id: string;
    taskName: string;
    startDate: Date;
    endDate: Date;
    duration: number;
    dependencies: string[];
  }>,
): Array<{
  id: string;
  taskName: string;
  es: number; // earliest start (days from project start)
  ef: number; // earliest finish
  ls: number; // latest start
  lf: number; // latest finish
  float: number;
  isCritical: boolean;
}> {
  if (items.length === 0) return [];

  // Use the earliest startDate as project day 0
  const projectStart = Math.min(...items.map((i) => i.startDate.getTime()));
  const dayMs = 24 * 60 * 60 * 1000;

  // Build lookup and adjacency
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const result = new Map<
    string,
    { id: string; taskName: string; es: number; ef: number; ls: number; lf: number; float: number; isCritical: boolean }
  >();

  // Forward pass: compute ES and EF
  const visited = new Set<string>();

  function forwardPass(id: string): number {
    if (result.has(id)) return result.get(id)!.ef;

    const item = itemMap.get(id);
    if (!item) return 0;

    // Prevent infinite recursion on circular deps
    if (visited.has(id)) return 0;
    visited.add(id);

    let es = Math.round((item.startDate.getTime() - projectStart) / dayMs);

    // ES is max of all predecessor EFs
    for (const depId of item.dependencies) {
      if (itemMap.has(depId)) {
        const depEf = forwardPass(depId);
        if (depEf > es) es = depEf;
      }
    }

    const ef = es + item.duration;

    result.set(id, {
      id,
      taskName: item.taskName,
      es,
      ef,
      ls: 0,
      lf: 0,
      float: 0,
      isCritical: false,
    });

    return ef;
  }

  for (const item of items) {
    forwardPass(item.id);
  }

  // Project finish = max EF
  const projectFinish = Math.max(...Array.from(result.values()).map((r) => r.ef));

  // Backward pass: compute LF and LS
  // Build reverse adjacency: for each item, which items depend on it
  const successors = new Map<string, string[]>();
  for (const item of items) {
    for (const depId of item.dependencies) {
      const list = successors.get(depId) ?? [];
      list.push(item.id);
      successors.set(depId, list);
    }
  }

  const visitedBack = new Set<string>();

  function backwardPass(id: string): number {
    const r = result.get(id);
    if (!r) return projectFinish;

    if (visitedBack.has(id)) return r.ls;
    visitedBack.add(id);

    // LF is min of all successor LS values
    const succs = successors.get(id) ?? [];
    let lf = projectFinish;

    for (const succId of succs) {
      backwardPass(succId);
      const succR = result.get(succId);
      if (succR && succR.ls < lf) lf = succR.ls;
    }

    r.lf = lf;
    r.ls = lf - (r.ef - r.es);
    r.float = r.ls - r.es;
    r.isCritical = r.float === 0;

    return r.ls;
  }

  for (const item of items) {
    backwardPass(item.id);
  }

  return Array.from(result.values());
}

// -----------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------

export class SmartSchedulerService {
  // -----------------------------------------------------------------------
  // optimizeSchedule
  // -----------------------------------------------------------------------

  async optimizeSchedule(projectId: string): Promise<ScheduleOptimizationResult | null> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        phases: {
          orderBy: { sortOrder: 'asc' },
          include: { milestones: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });

    const now = new Date();
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // ---- Gather all scheduling data in parallel ----
    const [
      scheduleItems,
      tasks,
      inspections,
      permits,
      weatherLogs,
      siteVisits,
      historicalItems,
    ] = await Promise.all([
      // Schedule items for this project
      prisma.scheduleItem.findMany({
        where: { projectId },
        orderBy: { startDate: 'asc' },
      }),

      // Tasks
      prisma.task.findMany({
        where: { projectId },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          assignedTo: true,
          dueDate: true,
          completedAt: true,
          description: true,
        },
      }),

      // Upcoming inspections
      prisma.inspection.findMany({
        where: {
          projectId,
          completedAt: null,
        },
        select: {
          id: true,
          inspectionType: true,
          requestedDate: true,
          scheduledDate: true,
          result: true,
          phaseRequired: true,
        },
        orderBy: { requestedDate: 'asc' },
      }),

      // Active permits with dates
      prisma.permit.findMany({
        where: {
          projectId,
          kealeeStatus: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'ISSUED'] },
        },
        select: {
          id: true,
          permitType: true,
          kealeeStatus: true,
          expiresAt: true,
          approvedAt: true,
        },
      }),

      // Weather logs for next 7 days
      prisma.weatherLog.findMany({
        where: {
          projectId,
          date: { gte: now, lte: sevenDaysOut },
        },
        orderBy: { date: 'asc' },
      }),

      // Upcoming site visits
      prisma.siteVisit.findMany({
        where: {
          projectId,
          scheduledAt: { gte: now, lte: thirtyDaysOut },
          status: { in: ['SCHEDULED', 'RESCHEDULED'] },
        },
        select: { id: true, type: true, scheduledAt: true, estimatedDurationMinutes: true },
        orderBy: { scheduledAt: 'asc' },
      }),

      // Historical durations from completed items on other projects (for similar tasks)
      prisma.scheduleItem.findMany({
        where: {
          status: 'COMPLETED',
          projectId: { not: projectId },
        },
        select: { taskName: true, trade: true, duration: true },
        take: 200,
      }),
    ]);

    if (scheduleItems.length === 0 && tasks.length === 0) {
      console.log(`[SmartScheduler] No schedule items or tasks for project ${projectId}`);
      return null;
    }

    // ---- Compute critical path from schedule items ----

    const cpInput = scheduleItems.map((item) => ({
      id: item.id,
      taskName: item.taskName,
      startDate: item.startDate,
      endDate: item.endDate,
      duration: item.duration,
      dependencies: item.dependencies,
    }));

    const criticalPathData = computeCriticalPath(cpInput);
    const criticalItems = criticalPathData.filter((c) => c.isCritical);

    // ---- Build historical duration averages by trade ----

    const histDurations = new Map<string, number[]>();
    for (const h of historicalItems) {
      const key = (h.trade ?? h.taskName).toLowerCase();
      const list = histDurations.get(key) ?? [];
      list.push(h.duration);
      histDurations.set(key, list);
    }
    const histAverages: Record<string, number> = {};
    for (const [key, durations] of histDurations) {
      histAverages[key] = Math.round(
        durations.reduce((a, b) => a + b, 0) / durations.length,
      );
    }

    // ---- Identify weather-sensitive tasks in upcoming window ----

    const weatherSensitiveItems = scheduleItems.filter(
      (item) =>
        item.weatherSensitive &&
        item.status !== 'COMPLETED' &&
        item.startDate <= sevenDaysOut,
    );

    const nonWorkableDays = weatherLogs.filter((w) => !w.workable);

    // ---- Build AI prompt ----

    const schedulingData = {
      project: {
        name: project.name ?? 'Unnamed',
        status: project.status,
        currentPhase: project.currentPhase ?? 'unknown',
        scheduledStart: project.scheduledStartDate?.toISOString() ?? null,
        scheduledEnd: project.scheduledEndDate?.toISOString() ?? null,
        actualStart: project.actualStartDate?.toISOString() ?? null,
      },
      scheduleItems: scheduleItems.map((item) => ({
        id: item.id,
        taskName: item.taskName,
        trade: item.trade,
        startDate: item.startDate.toISOString().split('T')[0],
        endDate: item.endDate.toISOString().split('T')[0],
        duration: item.duration,
        progress: item.progress,
        status: item.status,
        dependencies: item.dependencies,
        milestone: item.milestone,
        criticalPath: item.criticalPath,
        weatherSensitive: item.weatherSensitive,
        assignedTo: item.assignedTo,
      })),
      criticalPath: criticalItems.map((c) => ({
        taskId: c.id,
        title: c.taskName,
        earliestStart: c.es,
        earliestFinish: c.ef,
        latestStart: c.ls,
        float: c.float,
      })),
      tasks: {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === 'COMPLETED').length,
        overdue: tasks.filter(
          (t) => t.dueDate && t.dueDate < now && t.status !== 'COMPLETED' && t.status !== 'CANCELED',
        ).length,
        inProgress: tasks.filter((t) => t.status === 'PROCESSING').length,
      },
      inspections: inspections.map((i) => ({
        id: i.id,
        type: i.inspectionType,
        requestedDate: i.requestedDate.toISOString().split('T')[0],
        scheduledDate: i.scheduledDate?.toISOString().split('T')[0] ?? null,
        phase: i.phaseRequired,
      })),
      permits: permits.map((p) => ({
        type: p.permitType,
        status: p.kealeeStatus,
        expiresAt: p.expiresAt?.toISOString().split('T')[0] ?? null,
      })),
      weather: {
        forecast: weatherLogs.map((w) => ({
          date: w.date.toISOString().split('T')[0],
          condition: w.condition,
          temperature: w.temperature ? Number(w.temperature) : null,
          precipitation: w.precipitation ? Number(w.precipitation) : null,
          windSpeed: w.windSpeed ? Number(w.windSpeed) : null,
          workable: w.workable,
        })),
        nonWorkableDays: nonWorkableDays.map((w) => w.date.toISOString().split('T')[0]),
        weatherSensitiveTasks: weatherSensitiveItems.map((i) => ({
          id: i.id,
          taskName: i.taskName,
          trade: i.trade,
          startDate: i.startDate.toISOString().split('T')[0],
        })),
      },
      upcomingSiteVisits: siteVisits.map((v) => ({
        type: v.type,
        date: v.scheduledAt.toISOString().split('T')[0],
        durationMinutes: v.estimatedDurationMinutes,
      })),
      historicalDurationAverages: histAverages,
      phases: project.phases.map((p) => ({
        type: p.type,
        name: p.name,
        status: p.status,
        percentComplete: p.percentComplete,
        plannedStart: p.plannedStartDate?.toISOString().split('T')[0] ?? null,
        plannedEnd: p.plannedEndDate?.toISOString().split('T')[0] ?? null,
        actualStart: p.actualStartDate?.toISOString().split('T')[0] ?? null,
        milestones: p.milestones.map((m) => ({
          name: m.name,
          dueDate: m.dueDate?.toISOString().split('T')[0] ?? null,
          isCompleted: m.isCompleted,
          requiresInspection: m.requiresInspection,
        })),
      })),
      currentDate: now.toISOString().split('T')[0],
    };

    const userPrompt =
      'Analyze this construction project schedule and optimize it. Return a JSON object with:\n' +
      '- criticalPath: [{taskId, title, start (YYYY-MM-DD), end (YYYY-MM-DD), float: number}]\n' +
      '- optimizedTasks: [{taskId, recommendedStart (YYYY-MM-DD), recommendedEnd (YYYY-MM-DD), rationale}]\n' +
      '- weatherConflicts: [{taskId, conflictDate, weatherIssue, recommendation}]\n' +
      '- resourceConflicts: [{taskId, conflict, recommendation}]\n' +
      '- overallAssessment: string describing schedule health\n' +
      '- estimatedCompletion: YYYY-MM-DD\n' +
      '- confidenceLevel: 0.0-1.0\n\n' +
      'Only include tasks that need rescheduling in optimizedTasks. ' +
      'Consider weather, dependencies, resource conflicts, and inspection lead times.\n\n' +
      'SCHEDULE DATA:\n' +
      JSON.stringify(schedulingData, null, 2);

    // ---- Call Claude AI ----

    let optimization: ScheduleOptimizationResult;
    try {
      const result = await generateJSON<ScheduleOptimizationResult>({
        systemPrompt: AI_PROMPTS.SMART_SCHEDULER,
        userPrompt,
        maxTokens: 4000,
      });
      optimization = result.data;
    } catch (err) {
      console.error(
        `[SmartScheduler] AI optimization failed for ${projectId}:`,
        (err as Error).message,
      );
      return null;
    }

    // ---- Process results ----

    // Update critical path flags on schedule items
    const criticalIds = new Set(
      (optimization.criticalPath ?? []).map((c) => c.taskId),
    );
    for (const item of scheduleItems) {
      const shouldBeCritical = criticalIds.has(item.id);
      if (item.criticalPath !== shouldBeCritical) {
        await prisma.scheduleItem.update({
          where: { id: item.id },
          data: { criticalPath: shouldBeCritical },
        });
      }
    }

    // Process optimized task recommendations
    let majorChange = false;
    const originalEnd = project.scheduledEndDate;

    for (const opt of optimization.optimizedTasks ?? []) {
      const item = scheduleItems.find((i) => i.id === opt.taskId);
      if (!item) continue;

      const newStart = new Date(opt.recommendedStart);
      const newEnd = new Date(opt.recommendedEnd);
      const origStart = item.startDate;

      // Check if this is a minor or major change
      const daysDiff = Math.abs(
        Math.round((newStart.getTime() - origStart.getTime()) / (24 * 60 * 60 * 1000)),
      );

      if (daysDiff <= 5) {
        // Minor change: auto-update
        await prisma.scheduleItem.update({
          where: { id: item.id },
          data: {
            startDate: newStart,
            endDate: newEnd,
            duration: Math.ceil(
              (newEnd.getTime() - newStart.getTime()) / (24 * 60 * 60 * 1000),
            ),
          },
        });
      } else {
        majorChange = true;
      }
    }

    // Auto-reschedule weather-conflicted tasks
    for (const wc of optimization.weatherConflicts ?? []) {
      const item = scheduleItems.find((i) => i.id === wc.taskId);
      if (!item || !item.weatherSensitive) continue;

      // Find next workable day after the conflict
      const conflictDate = new Date(wc.conflictDate);
      let nextWorkable = new Date(conflictDate);
      nextWorkable.setDate(nextWorkable.getDate() + 1);

      // Skip non-workable days
      const nonWorkableDateSet = new Set(nonWorkableDays.map((w) => w.date.toISOString().split('T')[0]));
      while (nonWorkableDateSet.has(nextWorkable.toISOString().split('T')[0])) {
        nextWorkable.setDate(nextWorkable.getDate() + 1);
      }

      // Only auto-reschedule if the shift is small
      const shiftDays = Math.round(
        (nextWorkable.getTime() - item.startDate.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (shiftDays > 0 && shiftDays <= 3) {
        const newEnd = new Date(nextWorkable);
        newEnd.setDate(newEnd.getDate() + item.duration);

        await prisma.scheduleItem.update({
          where: { id: item.id },
          data: { startDate: nextWorkable, endDate: newEnd },
        });
      }
    }

    // If major changes or completion date shifted → create DecisionQueue + publish event
    if (majorChange && project.pmId) {
      await prisma.decisionQueue.create({
        data: {
          projectId,
          pmId: project.pmId,
          type: 'schedule_change',
          title: `Schedule optimization: ${optimization.overallAssessment?.substring(0, 80) ?? 'Review recommended changes'}`,
          context: {
            optimizedTasks: optimization.optimizedTasks as any,
            weatherConflicts: optimization.weatherConflicts as any,
            resourceConflicts: optimization.resourceConflicts as any,
            estimatedCompletion: optimization.estimatedCompletion,
          },
          aiRecommendation: optimization.overallAssessment,
          aiConfidence: optimization.confidenceLevel ?? 0.8,
          options: [
            { action: 'approve_all', label: 'Approve All Changes' },
            { action: 'approve_minor', label: 'Approve Minor Only' },
            { action: 'review', label: 'Review Individually' },
            { action: 'reject', label: 'Keep Current Schedule' },
          ],
        },
      });
    }

    // If estimated completion differs from scheduled end, publish disruption
    if (
      optimization.estimatedCompletion &&
      originalEnd
    ) {
      const estCompletion = new Date(optimization.estimatedCompletion);
      const daysBeyond = Math.round(
        (estCompletion.getTime() - originalEnd.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (daysBeyond > 3) {
        await eventBus.publish(
          EVENT_TYPES.SCHEDULE_DISRUPTION,
          {
            projectName: project.name ?? projectId,
            disruptionType: 'completion_date_shift',
            originalEnd: originalEnd.toISOString(),
            estimatedCompletion: optimization.estimatedCompletion,
            daysBeyond,
            impactDays: String(daysBeyond),
            assessment: optimization.overallAssessment,
          },
          SOURCE_APP,
          { projectId },
        );
      }
    }

    console.log(
      `[SmartScheduler] Optimized project ${projectId}: ` +
        `${optimization.criticalPath?.length ?? 0} critical items, ` +
        `${optimization.optimizedTasks?.length ?? 0} task changes, ` +
        `${optimization.weatherConflicts?.length ?? 0} weather conflicts`,
    );

    return optimization;
  }

  // -----------------------------------------------------------------------
  // handleDisruption
  // -----------------------------------------------------------------------

  async handleDisruption(
    projectId: string,
    disruption: DisruptionInput,
  ): Promise<void> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    // Get affected schedule items
    const affectedItems = await prisma.scheduleItem.findMany({
      where: {
        projectId,
        id: { in: disruption.affectedTaskIds },
      },
    });

    // Re-run optimization with disruption context added
    const optimizationResult = await this.optimizeSchedule(projectId);

    // Create decision entry for PM
    if (project.pmId) {
      await prisma.decisionQueue.create({
        data: {
          projectId,
          pmId: project.pmId,
          type: 'schedule_disruption',
          title: `Schedule disruption: ${disruption.type} — ${disruption.description.substring(0, 60)}`,
          context: {
            disruptionType: disruption.type,
            description: disruption.description,
            affectedTasks: affectedItems.map((i) => ({
              id: i.id,
              name: i.taskName,
              trade: i.trade,
            })),
            optimizationResult: optimizationResult
              ? {
                  estimatedCompletion: optimizationResult.estimatedCompletion,
                  assessment: optimizationResult.overallAssessment,
                  changesRecommended: optimizationResult.optimizedTasks?.length ?? 0,
                }
              : null,
          },
          aiRecommendation:
            optimizationResult?.overallAssessment ??
            'Schedule optimization could not be completed. Manual review required.',
          aiConfidence: optimizationResult?.confidenceLevel ?? 0.5,
          options: [
            { action: 'accept_revised', label: 'Accept Revised Schedule' },
            { action: 'manual_adjust', label: 'Manually Adjust' },
            { action: 'escalate', label: 'Escalate to Client' },
          ],
        },
      });

      // Notify PM
      await prisma.notification.create({
        data: {
          userId: project.pmId,
          type: 'schedule_disruption',
          title: `Schedule Disruption: ${disruption.type}`,
          message:
            `${disruption.description}\n\n` +
            `Affected tasks: ${affectedItems.length}\n` +
            (optimizationResult
              ? `Estimated completion: ${optimizationResult.estimatedCompletion}`
              : 'Schedule optimization pending.'),
          channels: ['in_app'],
          status: 'SENT',
          sentAt: new Date(),
          data: { projectId, disruption: disruption as any },
        },
      });
    }

    console.log(
      `[SmartScheduler] Handled disruption for ${projectId}: ${disruption.type}`,
    );
  }

  // -----------------------------------------------------------------------
  // crossProjectOptimize
  // -----------------------------------------------------------------------

  async crossProjectOptimize(pmId: string): Promise<{
    projectsAnalyzed: number;
    conflictsFound: number;
  }> {
    // Get all active projects for this PM
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { pmId },
          { projectManagers: { some: { userId: pmId, removedAt: null } } },
        ],
        status: { in: ['ACTIVE', 'IN_PROGRESS'] },
      },
      select: { id: true, name: true },
    });

    if (projects.length <= 1) {
      return { projectsAnalyzed: projects.length, conflictsFound: 0 };
    }

    const projectIds = projects.map((p) => p.id);

    // Get all schedule items across projects with assigned resources
    const allItems = await prisma.scheduleItem.findMany({
      where: {
        projectId: { in: projectIds },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        assignedTo: { not: null },
      },
      orderBy: { startDate: 'asc' },
    });

    // Group by assignedTo to find overlapping assignments
    const byResource = new Map<string, typeof allItems>();
    for (const item of allItems) {
      if (!item.assignedTo) continue;
      const list = byResource.get(item.assignedTo) ?? [];
      list.push(item);
      byResource.set(item.assignedTo, list);
    }

    // Detect overlapping schedule windows for the same resource
    let conflictsFound = 0;

    for (const [resource, items] of byResource) {
      if (items.length < 2) continue;

      // Sort by start date
      const sorted = items.sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime(),
      );

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        // Check overlap: current endDate > next startDate AND different projects
        if (
          current.endDate > next.startDate &&
          current.projectId !== next.projectId
        ) {
          conflictsFound++;

          // Find the PM's project names
          const currentProject = projects.find((p) => p.id === current.projectId);
          const nextProject = projects.find((p) => p.id === next.projectId);

          // Create notification for PM
          await prisma.notification.create({
            data: {
              userId: pmId,
              type: 'resource_conflict',
              title: 'Resource Scheduling Conflict',
              message:
                `Resource "${resource}" is double-booked:\n` +
                `• "${current.taskName}" (${currentProject?.name ?? current.projectId}) ` +
                `${current.startDate.toLocaleDateString()} - ${current.endDate.toLocaleDateString()}\n` +
                `• "${next.taskName}" (${nextProject?.name ?? next.projectId}) ` +
                `${next.startDate.toLocaleDateString()} - ${next.endDate.toLocaleDateString()}`,
              channels: ['in_app'],
              status: 'SENT',
              sentAt: new Date(),
              data: {
                resource,
                items: [
                  { itemId: current.id, projectId: current.projectId },
                  { itemId: next.id, projectId: next.projectId },
                ],
              },
            },
          });
        }
      }
    }

    console.log(
      `[SmartScheduler] Cross-project optimization for PM ${pmId}: ` +
        `${projects.length} projects, ${conflictsFound} conflicts found`,
    );

    return {
      projectsAnalyzed: projects.length,
      conflictsFound,
    };
  }
}
