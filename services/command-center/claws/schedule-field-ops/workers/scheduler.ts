import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { AIProvider } from '@kealee/ai';
import { CPM_PROMPT, WEATHER_PROMPT } from '../ai/prompts';
import type { Job } from 'bullmq';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScheduleTask {
  id: string;
  taskName: string;
  startDate: string;
  endDate: string;
  duration: number;
  dependencies: string[];
  status: string;
  trade: string | null;
  criticalPath: boolean;
  weatherSensitive: boolean;
  progress: number;
  milestone: boolean;
}

interface CPMResult {
  taskId: string;
  earlyStart: Date;
  earlyFinish: Date;
  lateStart: Date;
  lateFinish: Date;
  totalFloat: number;
  freeFloat: number;
  onCriticalPath: boolean;
}

interface WeatherAlertPayload {
  projectId: string;
  condition: string;
  severity: string;
  startDate: string;
  endDate: string;
  temperature?: number;
  precipitation?: number;
  windSpeed?: number;
}

// ---------------------------------------------------------------------------
// Weather-sensitive trade thresholds
// ---------------------------------------------------------------------------

const WEATHER_TRADE_RULES: Record<string, {
  maxWind?: number;
  minTemp?: number;
  maxTemp?: number;
  noRain?: boolean;
  noSnow?: boolean;
}> = {
  CONCRETE:      { minTemp: 40, maxTemp: 95, noRain: true },
  EARTHWORK:     { maxWind: 25, noRain: true },
  ROOFING:       { maxWind: 35, noRain: true, noSnow: true },
  PAINTING:      { minTemp: 50, maxTemp: 90, noRain: true },
  STEEL:         { maxWind: 30 },
  MASONRY:       { minTemp: 40, noRain: true },
  CRANE_OPS:     { maxWind: 25 },
};

// ---------------------------------------------------------------------------
// Scheduler Worker Handlers
// ---------------------------------------------------------------------------

export class SchedulerWorkerHandlers {
  constructor(
    private prisma: PrismaClient,
    private eventBus: EventBus,
    private clawName: string,
    private assertWritable: (model: string) => void,
    private ai: AIProvider,
  ) {}

  // =========================================================================
  // build-schedule: CPM forward/backward pass, critical path, resource leveling
  // =========================================================================

  async handleBuildSchedule(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('ScheduleItem');

    const payload = event.payload as Record<string, any>;
    const projectId = event.projectId;

    // Load all schedule items for this project
    const items = await this.prisma.scheduleItem.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
    });

    if (items.length === 0) {
      // Seed initial schedule from contract milestone data
      await this.seedScheduleFromContract(projectId, event);
      return;
    }

    // Run CPM analysis
    const cpmResults = this.runCPM(items as unknown as ScheduleTask[]);

    // Update critical path flags in the database
    for (const result of cpmResults) {
      this.assertWritable('ScheduleItem');
      await this.prisma.scheduleItem.update({
        where: { id: result.taskId },
        data: { criticalPath: result.onCriticalPath },
      });
    }

    // Detect if critical path changed
    const previousCriticalIds = items
      .filter((i) => i.criticalPath)
      .map((i) => i.id)
      .sort();
    const newCriticalIds = cpmResults
      .filter((r) => r.onCriticalPath)
      .map((r) => r.taskId)
      .sort();

    const criticalPathChanged =
      previousCriticalIds.length !== newCriticalIds.length ||
      previousCriticalIds.some((id, i) => id !== newCriticalIds[i]);

    // AI-enhanced resource leveling
    const aiResult = await this.ai.reason({
      task:
        'Perform resource leveling on this schedule. Identify trade over-allocations ' +
        'and suggest sequencing adjustments that minimize project extension while ' +
        'respecting predecessor/successor constraints.',
      context: {
        tasks: items.map((i) => ({
          id: i.id,
          name: i.taskName,
          trade: i.trade,
          start: i.startDate,
          end: i.endDate,
          duration: i.duration,
          dependencies: i.dependencies,
          criticalPath: cpmResults.find((r) => r.taskId === i.id)?.onCriticalPath ?? false,
          totalFloat: cpmResults.find((r) => r.taskId === i.id)?.totalFloat ?? 0,
        })),
        changeOrderImpact: payload.changeOrderId ? payload : null,
      },
      systemPrompt: CPM_PROMPT,
    });

    // Publish schedule.updated
    const updatedEvent = createEvent({
      type: EVENT_TYPES.schedule.updated,
      source: this.clawName,
      projectId,
      organizationId: event.organizationId,
      payload: {
        taskCount: items.length,
        criticalPathTaskCount: newCriticalIds.length,
        aiAnalysis: aiResult,
      },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(updatedEvent);

    // If critical path changed, publish separate event
    if (criticalPathChanged) {
      const cpEvent = createEvent({
        type: EVENT_TYPES.schedule.criticalpath.changed,
        source: this.clawName,
        projectId,
        organizationId: event.organizationId,
        payload: {
          previousCriticalPath: previousCriticalIds,
          newCriticalPath: newCriticalIds,
        },
        trigger: { eventId: event.id, eventType: event.type },
      });
      await this.eventBus.publish(cpEvent);
    }
  }

  // =========================================================================
  // reschedule-for-weather: Auto-reschedule weather-sensitive tasks
  // =========================================================================

  async handleWeatherReschedule(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('ScheduleItem');
    this.assertWritable('WeatherLog');

    const payload = event.payload as WeatherAlertPayload;
    const projectId = event.projectId ?? payload.projectId;

    // Log the weather event
    this.assertWritable('WeatherLog');
    const weatherLog = await this.prisma.weatherLog.create({
      data: {
        projectId,
        date: new Date(payload.startDate),
        condition: payload.condition,
        temperature: payload.temperature ?? null,
        precipitation: payload.precipitation ?? null,
        windSpeed: payload.windSpeed ?? null,
        workable: payload.severity !== 'SEVERE' && payload.severity !== 'EXTREME',
        notes: `Auto-logged from weather.alert event. Severity: ${payload.severity}`,
      },
    });

    // Find weather-sensitive tasks in the affected date range
    const alertStart = new Date(payload.startDate);
    const alertEnd = new Date(payload.endDate);

    const affectedTasks = await this.prisma.scheduleItem.findMany({
      where: {
        projectId,
        weatherSensitive: true,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        OR: [
          { startDate: { gte: alertStart, lte: alertEnd } },
          { endDate: { gte: alertStart, lte: alertEnd } },
          { AND: [{ startDate: { lte: alertStart } }, { endDate: { gte: alertEnd } }] },
        ],
      },
    });

    if (affectedTasks.length === 0) return;

    // AI-driven weather impact analysis
    const weatherHistory = await this.prisma.weatherLog.findMany({
      where: { projectId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    const aiResult = await this.ai.reason({
      task:
        'Analyze the weather impact on these construction activities. Calculate lost days, ' +
        'recovery time, and recommend rescheduled dates that respect predecessor/successor logic. ' +
        'Identify interior work that can be pulled forward during the delay.',
      context: {
        weatherAlert: payload,
        affectedTasks: affectedTasks.map((t) => ({
          id: t.id,
          name: t.taskName,
          trade: t.trade,
          start: t.startDate,
          end: t.endDate,
          duration: t.duration,
          dependencies: t.dependencies,
          criticalPath: t.criticalPath,
        })),
        weatherHistory: weatherHistory.map((w) => ({
          date: w.date,
          condition: w.condition,
          workable: w.workable,
        })),
        tradeWeatherRules: WEATHER_TRADE_RULES,
      },
      systemPrompt: WEATHER_PROMPT,
    });

    // Calculate delay days based on weather duration
    const alertDurationMs = alertEnd.getTime() - alertStart.getTime();
    const alertDays = Math.ceil(alertDurationMs / (1000 * 60 * 60 * 24));

    // Auto-reschedule affected tasks
    for (const task of affectedTasks) {
      const trade = (task.trade ?? '').toUpperCase();
      const rules = WEATHER_TRADE_RULES[trade];

      // Determine if this trade is actually blocked by the weather condition
      let blocked = false;
      if (rules) {
        if (rules.noRain && ['RAIN', 'STORM', 'HEAVY_RAIN'].includes(payload.condition)) blocked = true;
        if (rules.noSnow && payload.condition === 'SNOW') blocked = true;
        if (rules.maxWind && payload.windSpeed && payload.windSpeed > rules.maxWind) blocked = true;
        if (rules.minTemp && payload.temperature && payload.temperature < rules.minTemp) blocked = true;
        if (rules.maxTemp && payload.temperature && payload.temperature > rules.maxTemp) blocked = true;
      } else if (task.weatherSensitive) {
        // Default: severe/extreme weather blocks all weather-sensitive work
        blocked = payload.severity === 'SEVERE' || payload.severity === 'EXTREME';
      }

      if (!blocked) continue;

      // Calculate new dates: shift by the number of weather delay days
      const originalStart = new Date(task.startDate);
      const originalEnd = new Date(task.endDate);
      const newStart = new Date(originalStart.getTime() + alertDays * 86_400_000);
      const newEnd = new Date(originalEnd.getTime() + alertDays * 86_400_000);

      this.assertWritable('ScheduleItem');
      await this.prisma.scheduleItem.update({
        where: { id: task.id },
        data: {
          startDate: newStart,
          endDate: newEnd,
          status: 'DELAYED',
        },
      });
    }

    // Cascade: rebuild schedule to recalculate critical path after weather shift
    const allTasks = await this.prisma.scheduleItem.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
    });
    const cpmResults = this.runCPM(allTasks as unknown as ScheduleTask[]);

    for (const result of cpmResults) {
      this.assertWritable('ScheduleItem');
      await this.prisma.scheduleItem.update({
        where: { id: result.taskId },
        data: { criticalPath: result.onCriticalPath },
      });
    }

    // Publish schedule.updated after weather reschedule
    const updatedEvent = createEvent({
      type: EVENT_TYPES.schedule.updated,
      source: this.clawName,
      projectId,
      organizationId: event.organizationId,
      payload: {
        reason: 'weather-delay-reschedule',
        weatherLogId: weatherLog.id,
        affectedTaskCount: affectedTasks.length,
        delayDays: alertDays,
        aiAnalysis: aiResult,
      },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(updatedEvent);
  }

  // =========================================================================
  // generate-look-ahead: 2-week rolling look-ahead schedule
  // =========================================================================

  async handleGenerateLookAhead(job: Job): Promise<{ lookAhead: any[] }> {
    const { projectId, organizationId } = job.data;

    const now = new Date();
    const twoWeeksOut = new Date(now.getTime() + 14 * 86_400_000);

    // Get tasks in the 2-week window
    const tasks = await this.prisma.scheduleItem.findMany({
      where: {
        projectId,
        OR: [
          { startDate: { gte: now, lte: twoWeeksOut } },
          { endDate: { gte: now, lte: twoWeeksOut } },
          { AND: [{ startDate: { lte: now } }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: { startDate: 'asc' },
    });

    // Get recent weather data for context
    const recentWeather = await this.prisma.weatherLog.findMany({
      where: { projectId, date: { gte: new Date(now.getTime() - 7 * 86_400_000) } },
      orderBy: { date: 'desc' },
    });

    // AI analysis of look-ahead
    const aiResult = await this.ai.reason({
      task:
        'Generate a 2-week look-ahead analysis. Flag at-risk activities, identify ' +
        'resource constraints, and highlight weather-sensitive work that may need contingency plans.',
      context: {
        tasks: tasks.map((t) => ({
          id: t.id,
          name: t.taskName,
          start: t.startDate,
          end: t.endDate,
          trade: t.trade,
          status: t.status,
          progress: t.progress,
          criticalPath: t.criticalPath,
          weatherSensitive: t.weatherSensitive,
        })),
        recentWeather: recentWeather.map((w) => ({
          date: w.date,
          condition: w.condition,
          workable: w.workable,
        })),
        windowStart: now.toISOString(),
        windowEnd: twoWeeksOut.toISOString(),
      },
      systemPrompt: CPM_PROMPT,
    });

    // Tag overdue tasks
    const lookAhead = tasks.map((t) => {
      const isOverdue = new Date(t.endDate) < now && t.status !== 'COMPLETED';
      const isAtRisk =
        t.criticalPath && t.progress < 50 && new Date(t.endDate) < twoWeeksOut;

      return {
        taskId: t.id,
        taskName: t.taskName,
        startDate: t.startDate,
        endDate: t.endDate,
        trade: t.trade,
        status: isOverdue ? 'OVERDUE' : isAtRisk ? 'AT_RISK' : t.status,
        progress: t.progress,
        criticalPath: t.criticalPath,
        weatherSensitive: t.weatherSensitive,
      };
    });

    return { lookAhead };
  }

  // =========================================================================
  // update-schedule-for-co: Adjust schedule when change order is approved
  // =========================================================================

  async handleChangeOrderImpact(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('ScheduleItem');

    const payload = event.payload as Record<string, any>;
    const projectId = event.projectId;

    // Get the change order details for schedule impact assessment
    const changeOrder = payload.changeOrderId
      ? await this.prisma.changeOrder.findUnique({
          where: { id: payload.changeOrderId },
          include: { lineItems: true },
        })
      : null;

    if (!changeOrder) return;

    // Load current schedule
    const tasks = await this.prisma.scheduleItem.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
    });

    // AI analysis of schedule impact from approved change order
    const aiResult = await this.ai.reason({
      task:
        'Assess how this approved change order impacts the construction schedule. ' +
        'Determine if new activities need to be added, existing ones extended, ' +
        'or if the critical path shifts. Calculate the net schedule impact in working days.',
      context: {
        changeOrder: {
          id: changeOrder.id,
          title: changeOrder.title,
          description: changeOrder.description,
          amount: changeOrder.amount,
          lineItems: (changeOrder.lineItems ?? []).map((li: any) => ({
            description: li.description,
            quantity: li.quantity,
            csiDivision: li.csiDivision,
          })),
        },
        currentSchedule: tasks.map((t) => ({
          id: t.id,
          name: t.taskName,
          trade: t.trade,
          start: t.startDate,
          end: t.endDate,
          duration: t.duration,
          dependencies: t.dependencies,
          criticalPath: t.criticalPath,
        })),
      },
      systemPrompt: CPM_PROMPT,
    });

    // If AI suggests new tasks, create them
    const suggestedTasks = (aiResult as any)?.newTasks ?? [];
    for (const newTask of suggestedTasks) {
      this.assertWritable('ScheduleItem');
      await this.prisma.scheduleItem.create({
        data: {
          projectId,
          taskName: newTask.name ?? `CO Task - ${changeOrder.title}`,
          description: newTask.description ?? `Added by change order ${changeOrder.changeOrderNumber}`,
          startDate: new Date(newTask.startDate ?? Date.now()),
          endDate: new Date(newTask.endDate ?? Date.now() + 7 * 86_400_000),
          duration: newTask.duration ?? 5,
          trade: newTask.trade ?? null,
          dependencies: newTask.dependencies ?? [],
          weatherSensitive: newTask.weatherSensitive ?? false,
        },
      });
    }

    // Re-run CPM after changes
    const updatedTasks = await this.prisma.scheduleItem.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
    });
    const cpmResults = this.runCPM(updatedTasks as unknown as ScheduleTask[]);

    for (const result of cpmResults) {
      this.assertWritable('ScheduleItem');
      await this.prisma.scheduleItem.update({
        where: { id: result.taskId },
        data: { criticalPath: result.onCriticalPath },
      });
    }

    // Publish schedule updated due to change order
    const updatedEvent = createEvent({
      type: EVENT_TYPES.schedule.updated,
      source: this.clawName,
      projectId,
      organizationId: event.organizationId,
      payload: {
        reason: 'changeorder-impact',
        changeOrderId: changeOrder.id,
        newTasksAdded: suggestedTasks.length,
        aiAnalysis: aiResult,
      },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(updatedEvent);
  }

  // =========================================================================
  // Private: CPM Algorithm Implementation
  // =========================================================================

  /**
   * Run Critical Path Method on a set of schedule tasks.
   * Performs forward pass, backward pass, and float calculation.
   */
  private runCPM(tasks: ScheduleTask[]): CPMResult[] {
    if (tasks.length === 0) return [];

    // Build adjacency maps
    const taskMap = new Map<string, ScheduleTask>();
    const successors = new Map<string, string[]>();
    const predecessors = new Map<string, string[]>();

    for (const task of tasks) {
      taskMap.set(task.id, task);
      successors.set(task.id, []);
      predecessors.set(task.id, task.dependencies ?? []);
    }

    // Build successor map from predecessor data
    for (const task of tasks) {
      for (const predId of task.dependencies ?? []) {
        const succs = successors.get(predId);
        if (succs) succs.push(task.id);
      }
    }

    // ---- Forward Pass ----
    const earlyStart = new Map<string, Date>();
    const earlyFinish = new Map<string, Date>();

    // Topological sort for processing order
    const sorted = this.topologicalSort(tasks, predecessors);

    for (const taskId of sorted) {
      const task = taskMap.get(taskId)!;
      const preds = predecessors.get(taskId) ?? [];

      if (preds.length === 0) {
        // No predecessors: ES = task's own start date
        earlyStart.set(taskId, new Date(task.startDate));
      } else {
        // ES = max(EF of all predecessors)
        let maxEF = new Date(0);
        for (const predId of preds) {
          const predEF = earlyFinish.get(predId);
          if (predEF && predEF > maxEF) maxEF = predEF;
        }
        earlyStart.set(taskId, maxEF);
      }

      // EF = ES + Duration (in working days, approximated as calendar days here)
      const es = earlyStart.get(taskId)!;
      const ef = new Date(es.getTime() + task.duration * 86_400_000);
      earlyFinish.set(taskId, ef);
    }

    // ---- Backward Pass ----
    const lateStart = new Map<string, Date>();
    const lateFinish = new Map<string, Date>();

    // Project completion = max EF
    let projectEnd = new Date(0);
    for (const ef of earlyFinish.values()) {
      if (ef > projectEnd) projectEnd = ef;
    }

    // Process in reverse topological order
    const reverseSorted = [...sorted].reverse();

    for (const taskId of reverseSorted) {
      const task = taskMap.get(taskId)!;
      const succs = successors.get(taskId) ?? [];

      if (succs.length === 0) {
        // No successors: LF = project end
        lateFinish.set(taskId, projectEnd);
      } else {
        // LF = min(LS of all successors)
        let minLS = new Date(projectEnd.getTime() + 365 * 86_400_000); // far future
        for (const succId of succs) {
          const succLS = lateStart.get(succId);
          if (succLS && succLS < minLS) minLS = succLS;
        }
        lateFinish.set(taskId, minLS);
      }

      // LS = LF - Duration
      const lf = lateFinish.get(taskId)!;
      const ls = new Date(lf.getTime() - task.duration * 86_400_000);
      lateStart.set(taskId, ls);
    }

    // ---- Calculate Float and Critical Path ----
    const results: CPMResult[] = [];

    for (const task of tasks) {
      const es = earlyStart.get(task.id)!;
      const ef = earlyFinish.get(task.id)!;
      const ls = lateStart.get(task.id)!;
      const lf = lateFinish.get(task.id)!;

      const totalFloat = Math.round(
        (ls.getTime() - es.getTime()) / 86_400_000,
      );

      // Free float = min(ES of successors) - EF
      const succs = successors.get(task.id) ?? [];
      let freeFloat = totalFloat;
      if (succs.length > 0) {
        let minSuccES = new Date(projectEnd.getTime() + 365 * 86_400_000);
        for (const succId of succs) {
          const succES = earlyStart.get(succId);
          if (succES && succES < minSuccES) minSuccES = succES;
        }
        freeFloat = Math.round(
          (minSuccES.getTime() - ef.getTime()) / 86_400_000,
        );
      }

      results.push({
        taskId: task.id,
        earlyStart: es,
        earlyFinish: ef,
        lateStart: ls,
        lateFinish: lf,
        totalFloat: Math.max(0, totalFloat),
        freeFloat: Math.max(0, freeFloat),
        onCriticalPath: totalFloat <= 0,
      });
    }

    return results;
  }

  /**
   * Topological sort using Kahn's algorithm.
   * Returns task IDs in dependency order.
   */
  private topologicalSort(
    tasks: ScheduleTask[],
    predecessors: Map<string, string[]>,
  ): string[] {
    const inDegree = new Map<string, number>();
    const taskIds = tasks.map((t) => t.id);

    // Initialize in-degree
    for (const id of taskIds) {
      const preds = (predecessors.get(id) ?? []).filter((p) =>
        taskIds.includes(p),
      );
      inDegree.set(id, preds.length);
    }

    // Start with zero-dependency tasks
    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) queue.push(id);
    }

    const sorted: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      // Find successors and reduce their in-degree
      for (const task of tasks) {
        if ((task.dependencies ?? []).includes(current)) {
          const newDegree = (inDegree.get(task.id) ?? 1) - 1;
          inDegree.set(task.id, newDegree);
          if (newDegree === 0) queue.push(task.id);
        }
      }
    }

    // If not all tasks sorted, there's a cycle. Append remaining.
    if (sorted.length < taskIds.length) {
      const remaining = taskIds.filter((id) => !sorted.includes(id));
      console.warn(
        `[${this.clawName}] Dependency cycle detected in schedule. ` +
          `Appending ${remaining.length} tasks without ordering.`,
      );
      sorted.push(...remaining);
    }

    return sorted;
  }

  // =========================================================================
  // Private: Seed schedule from contract execution
  // =========================================================================

  private async seedScheduleFromContract(
    projectId: string,
    event: KealeeEventEnvelope,
  ): Promise<void> {
    this.assertWritable('ScheduleItem');

    const payload = event.payload as Record<string, any>;
    const contractId = payload.contractId;

    if (!contractId) return;

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) return;

    const milestones = (contract as any).milestones ?? [];
    const startDate = (contract as any).startDate
      ? new Date((contract as any).startDate)
      : new Date();

    let previousId: string | null = null;
    const createdIds: string[] = [];

    for (let i = 0; i < milestones.length; i++) {
      const milestone = milestones[i];
      const taskStart = new Date(
        startDate.getTime() + (milestone.startDay ?? i * 14) * 86_400_000,
      );
      const taskEnd = new Date(
        taskStart.getTime() + (milestone.durationDays ?? 14) * 86_400_000,
      );

      this.assertWritable('ScheduleItem');
      const item = await this.prisma.scheduleItem.create({
        data: {
          projectId,
          taskName: milestone.name ?? `Phase ${i + 1}`,
          description: milestone.description ?? null,
          startDate: taskStart,
          endDate: taskEnd,
          duration: milestone.durationDays ?? 14,
          milestone: true,
          trade: milestone.trade ?? null,
          weatherSensitive: milestone.weatherSensitive ?? false,
          dependencies: previousId ? [previousId] : [],
        },
      });

      createdIds.push(item.id);
      previousId = item.id;
    }

    // Publish schedule.created
    const createdEvent = createEvent({
      type: EVENT_TYPES.schedule.created,
      source: this.clawName,
      projectId,
      organizationId: event.organizationId,
      payload: {
        contractId,
        milestoneCount: createdIds.length,
        scheduleItemIds: createdIds,
      },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(createdEvent);
  }
}
