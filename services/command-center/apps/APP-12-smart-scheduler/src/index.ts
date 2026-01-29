/**
 * APP-12: SMART SCHEDULER
 * AI-powered intelligent scheduling and resource optimization
 * Automation Level: AI-driven
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../../shared/queue.js';
import { getEventBus, EVENT_TYPES } from '../../../shared/events.js';
import { generateJSON, generateText } from '../../../shared/ai/claude.js';
import { getWeatherForecast } from '../../../shared/integrations/weather.js';
import { addWorkingDays, isWorkingDay, formatDate, getWorkingDays } from '../../../shared/utils/date.js';

const prisma = new PrismaClient();
const eventBus = getEventBus('smart-scheduler');

// ============================================================================
// TYPES
// ============================================================================

interface Task {
  id: string;
  name: string;
  duration: number; // in days
  dependencies: string[];
  trade: string;
  resourceRequirements: ResourceRequirement[];
  constraints?: TaskConstraint[];
  priority: number;
  mustStartAfter?: Date;
  mustEndBefore?: Date;
  weatherSensitive?: boolean;
}

interface ResourceRequirement {
  type: 'labor' | 'equipment' | 'material';
  resource: string;
  quantity: number;
}

interface TaskConstraint {
  type: 'weather' | 'inspection' | 'permit' | 'sequence' | 'resource';
  description: string;
  condition?: string;
}

interface Resource {
  id: string;
  type: 'labor' | 'equipment';
  name: string;
  trade?: string;
  capacity: number;
  costPerDay: number;
  availability: { date: Date; available: number }[];
}

interface ScheduledTask {
  taskId: string;
  startDate: Date;
  endDate: Date;
  resources: { resourceId: string; allocated: number }[];
  criticalPath: boolean;
  float: number;
  conflicts?: string[];
}

interface ScheduleOptimization {
  projectId: string;
  originalDuration: number;
  optimizedDuration: number;
  savings: {
    days: number;
    cost: number;
  };
  changes: ScheduleChange[];
  riskAssessment: RiskAssessment;
}

interface ScheduleChange {
  taskId: string;
  type: 'move' | 'parallelize' | 'resource-change' | 'sequence-change';
  from: { startDate: Date; endDate: Date };
  to: { startDate: Date; endDate: Date };
  reason: string;
  impact: string;
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  weatherRisk: number;
  resourceRisk: number;
  sequenceRisk: number;
  recommendations: string[];
}

interface ConflictResolution {
  conflictId: string;
  type: 'resource' | 'schedule' | 'dependency';
  options: ResolutionOption[];
  recommendation: number;
  reasoning: string;
}

interface ResolutionOption {
  description: string;
  impact: { duration: number; cost: number };
  changes: ScheduleChange[];
}

// ============================================================================
// SMART SCHEDULER SERVICE
// ============================================================================

class SmartSchedulerService {
  /**
   * Analyze schedule and identify optimization opportunities
   */
  async analyzeSchedule(projectId: string): Promise<{
    criticalPath: string[];
    float: Map<string, number>;
    bottlenecks: string[];
    opportunities: string[];
  }> {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: { dependencies: true },
    } as any);

    // Build task graph
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const visited = new Set<string>();
    const criticalPath: string[] = [];

    // Calculate early/late start/finish for each task
    const taskSchedule = new Map<string, {
      earlyStart: number;
      earlyFinish: number;
      lateStart: number;
      lateFinish: number;
      float: number;
    }>();

    // Forward pass
    const forwardPass = (taskId: string, currentDay: number): number => {
      const task = taskMap.get(taskId);
      if (!task) return currentDay;

      const deps = (task as any).dependencies || [];
      let maxDepEnd = currentDay;

      for (const dep of deps) {
        const depEnd = forwardPass(dep.dependsOnId, currentDay);
        maxDepEnd = Math.max(maxDepEnd, depEnd);
      }

      const earlyStart = maxDepEnd;
      const earlyFinish = earlyStart + ((task as any).duration || 1);

      taskSchedule.set(taskId, {
        earlyStart,
        earlyFinish,
        lateStart: 0,
        lateFinish: 0,
        float: 0,
      });

      return earlyFinish;
    };

    // Find end tasks and run forward pass
    const endTasks = tasks.filter(t =>
      !tasks.some(other =>
        (other as any).dependencies?.some((d: any) => d.dependsOnId === t.id)
      )
    );

    let projectEnd = 0;
    for (const task of endTasks) {
      projectEnd = Math.max(projectEnd, forwardPass(task.id, 0));
    }

    // Backward pass
    const backwardPass = (taskId: string, latestEnd: number): void => {
      const task = taskMap.get(taskId);
      if (!task) return;

      const schedule = taskSchedule.get(taskId);
      if (!schedule) return;

      schedule.lateFinish = latestEnd;
      schedule.lateStart = latestEnd - ((task as any).duration || 1);
      schedule.float = schedule.lateStart - schedule.earlyStart;

      if (schedule.float === 0) {
        criticalPath.push(taskId);
      }

      // Process dependencies
      for (const dep of (task as any).dependencies || []) {
        backwardPass(dep.dependsOnId, schedule.lateStart);
      }
    };

    for (const task of endTasks) {
      backwardPass(task.id, projectEnd);
    }

    // Identify bottlenecks (tasks with many dependents and low float)
    const bottlenecks = tasks
      .filter(t => {
        const schedule = taskSchedule.get(t.id);
        const dependentCount = tasks.filter(other =>
          (other as any).dependencies?.some((d: any) => d.dependsOnId === t.id)
        ).length;
        return schedule && schedule.float <= 1 && dependentCount >= 2;
      })
      .map(t => t.id);

    // Identify optimization opportunities
    const opportunities: string[] = [];

    // Check for parallelization opportunities
    const independentTasks = tasks.filter(t =>
      (t as any).dependencies?.length === 0 &&
      !criticalPath.includes(t.id)
    );
    if (independentTasks.length >= 2) {
      opportunities.push('Multiple independent tasks can be parallelized');
    }

    // Check for resource optimization
    const trades = [...new Set(tasks.map(t => (t as any).trade))];
    for (const trade of trades) {
      const tradeTasks = tasks.filter(t => (t as any).trade === trade);
      if (tradeTasks.length >= 3) {
        opportunities.push(`${trade} tasks may benefit from batching`);
      }
    }

    const float = new Map(
      Array.from(taskSchedule.entries()).map(([id, s]) => [id, s.float])
    );

    return { criticalPath, float, bottlenecks, opportunities };
  }

  /**
   * Optimize schedule using AI
   */
  async optimizeSchedule(
    projectId: string,
    constraints: {
      targetEndDate?: Date;
      maxResources?: Record<string, number>;
      prioritizeCost?: boolean;
    }
  ): Promise<ScheduleOptimization> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: { dependencies: true },
        },
        resources: true,
      },
    } as any);

    if (!project) {
      throw new Error('Project not found');
    }

    const analysis = await this.analyzeSchedule(projectId);

    // Use AI to generate optimization recommendations
    const optimizationPrompt = `Analyze and optimize this construction schedule:

Project: ${project.name}
Tasks: ${JSON.stringify((project as any).tasks.map((t: any) => ({
      id: t.id,
      name: t.name,
      duration: t.duration,
      trade: t.trade,
      dependencies: t.dependencies?.map((d: any) => d.dependsOnId),
    })))}

Critical Path: ${analysis.criticalPath.join(', ')}
Bottlenecks: ${analysis.bottlenecks.join(', ')}

Constraints:
- Target End Date: ${constraints.targetEndDate || 'ASAP'}
- Prioritize: ${constraints.prioritizeCost ? 'Cost' : 'Schedule'}

Provide optimization recommendations in JSON format with:
1. tasks_to_parallelize: array of task IDs that can run in parallel
2. sequence_changes: array of { taskId, moveBefore, moveAfter }
3. resource_adjustments: array of { taskId, addResources, reduceResources }
4. estimated_savings_days: number
5. risk_level: low/medium/high
6. reasoning: string`;

    const optimization = await generateJSON<{
      tasks_to_parallelize: string[][];
      sequence_changes: { taskId: string; moveBefore?: string; moveAfter?: string }[];
      resource_adjustments: { taskId: string; change: string }[];
      estimated_savings_days: number;
      risk_level: 'low' | 'medium' | 'high';
      reasoning: string;
    }>(`You are a construction scheduling AI expert. Analyze schedules and provide optimization recommendations.

${optimizationPrompt}` as any);

    // Calculate original duration
    const originalDuration = (project as any).tasks.reduce(
      (max: number, t: any) => Math.max(max, t.endDate ? getWorkingDays(new Date(), t.endDate) : 0),
      0
    );

    const changes: ScheduleChange[] = [];

    // Generate changes from AI recommendations
    for (const group of optimization.tasks_to_parallelize) {
      for (const taskId of group.slice(1)) {
        const task = (project as any).tasks.find((t: any) => t.id === taskId);
        if (task) {
          changes.push({
            taskId,
            type: 'parallelize',
            from: { startDate: task.startDate, endDate: task.endDate },
            to: { startDate: task.startDate, endDate: task.endDate },
            reason: 'Can run in parallel with other tasks',
            impact: 'Reduces overall schedule',
          });
        }
      }
    }

    return {
      projectId,
      originalDuration,
      optimizedDuration: originalDuration - optimization.estimated_savings_days,
      savings: {
        days: optimization.estimated_savings_days,
        cost: optimization.estimated_savings_days * 5000, // Rough estimate
      },
      changes,
      riskAssessment: {
        overallRisk: optimization.risk_level,
        weatherRisk: 30,
        resourceRisk: 20,
        sequenceRisk: optimization.sequence_changes.length > 2 ? 40 : 15,
        recommendations: [optimization.reasoning],
      },
    };
  }

  /**
   * Check weather impact on schedule
   */
  async checkWeatherImpact(
    projectId: string,
    location: { lat: number; lon: number }
  ): Promise<{
    impactedTasks: { taskId: string; date: Date; issue: string }[];
    recommendations: string[];
  }> {
    // Get weather forecast
    const forecast = await getWeatherForecast(location.lat, location.lon, 7);

    // Get weather-sensitive tasks
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        startDate: {
          gte: new Date(),
          lte: addWorkingDays(new Date(), 7),
        },
      },
    } as any);

    const impactedTasks: { taskId: string; date: Date; issue: string }[] = [];

    for (const task of tasks) {
      if (!(task as any).weatherSensitive) continue;

      const taskDate = (task as any).startDate;
      const dayForecast = forecast.daily?.find((d: any) =>
        formatDate(new Date(d.dt * 1000)) === formatDate(taskDate)
      );

      if (dayForecast) {
        // Check for problematic weather
        if (dayForecast.pop > 0.7) {
          impactedTasks.push({
            taskId: task.id,
            date: taskDate,
            issue: `High chance of rain (${Math.round(dayForecast.pop * 100)}%)`,
          });
        }
        if (dayForecast.wind_speed > 25) {
          impactedTasks.push({
            taskId: task.id,
            date: taskDate,
            issue: `High winds (${Math.round(dayForecast.wind_speed)} mph)`,
          });
        }
        if (dayForecast.temp?.max > 100) {
          impactedTasks.push({
            taskId: task.id,
            date: taskDate,
            issue: `Extreme heat (${Math.round(dayForecast.temp.max)}°F)`,
          });
        }
      }
    }

    const recommendations: string[] = [];
    if (impactedTasks.length > 0) {
      recommendations.push('Consider rescheduling weather-sensitive tasks');
      recommendations.push('Prepare contingency plans for outdoor work');
      recommendations.push('Monitor weather forecasts daily');
    }

    return { impactedTasks, recommendations };
  }

  /**
   * Detect and resolve scheduling conflicts
   */
  async detectConflicts(projectId: string): Promise<ConflictResolution[]> {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        dependencies: true,
        resources: true,
      },
    } as any);

    const conflicts: ConflictResolution[] = [];

    // Check for resource conflicts
    const resourceUsage = new Map<string, Map<string, number>>();

    for (const task of tasks) {
      const startDate = formatDate((task as any).startDate);
      const endDate = formatDate((task as any).endDate);

      for (const resource of (task as any).resources || []) {
        if (!resourceUsage.has(resource.resourceId)) {
          resourceUsage.set(resource.resourceId, new Map());
        }

        const dateUsage = resourceUsage.get(resource.resourceId)!;
        // Simplified: check start date only
        const current = dateUsage.get(startDate) || 0;
        dateUsage.set(startDate, current + resource.quantity);
      }
    }

    // Find overallocated resources
    for (const [resourceId, dateUsage] of resourceUsage) {
      const resource = await (prisma as any).resource?.findUnique({
        where: { id: resourceId },
      });

      if (!resource) continue;

      for (const [date, usage] of dateUsage) {
        if (usage > (resource as any).capacity) {
          conflicts.push({
            conflictId: `${resourceId}-${date}`,
            type: 'resource',
            options: [
              {
                description: 'Add additional resources',
                impact: { duration: 0, cost: usage * 500 },
                changes: [],
              },
              {
                description: 'Reschedule conflicting tasks',
                impact: { duration: 2, cost: 0 },
                changes: [],
              },
            ],
            recommendation: 0,
            reasoning: `Resource ${(resource as any).name} is overallocated on ${date}`,
          });
        }
      }
    }

    // Check for dependency conflicts
    for (const task of tasks) {
      for (const dep of (task as any).dependencies || []) {
        const depTask = tasks.find(t => t.id === dep.dependsOnId);
        if (depTask && (depTask as any).endDate > (task as any).startDate) {
          conflicts.push({
            conflictId: `dep-${task.id}-${depTask.id}`,
            type: 'dependency',
            options: [
              {
                description: 'Delay dependent task',
                impact: { duration: 1, cost: 0 },
                changes: [{
                  taskId: task.id,
                  type: 'move',
                  from: { startDate: (task as any).startDate, endDate: (task as any).endDate },
                  to: {
                    startDate: addWorkingDays((depTask as any).endDate, 1),
                    endDate: addWorkingDays((task as any).endDate, 1),
                  },
                  reason: 'Resolve dependency conflict',
                  impact: 'Extends overall schedule',
                }],
              },
            ],
            recommendation: 0,
            reasoning: `Task ${(task as any).name} starts before dependency ${(depTask as any).name} finishes`,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Auto-reschedule based on actual progress
   */
  async autoReschedule(
    projectId: string,
    completedTasks: string[],
    delayedTasks: { taskId: string; newEndDate: Date }[]
  ): Promise<ScheduledTask[]> {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: { dependencies: true },
    } as any);

    const rescheduled: ScheduledTask[] = [];
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Mark completed tasks
    const completed = new Set(completedTasks);

    // Update delayed tasks
    const delayMap = new Map(delayedTasks.map(d => [d.taskId, d.newEndDate]));

    // Calculate ripple effects
    const processTask = (taskId: string): Date => {
      const task = taskMap.get(taskId);
      if (!task) return new Date();

      if (completed.has(taskId)) {
        return (task as any).endDate;
      }

      const delay = delayMap.get(taskId);
      if (delay) {
        return delay;
      }

      // Check dependencies
      let latestDepEnd = new Date();
      for (const dep of (task as any).dependencies || []) {
        const depEnd = processTask(dep.dependsOnId);
        if (depEnd > latestDepEnd) {
          latestDepEnd = depEnd;
        }
      }

      // Calculate new dates
      const newStart = latestDepEnd > (task as any).startDate
        ? addWorkingDays(latestDepEnd, 1)
        : (task as any).startDate;
      const newEnd = addWorkingDays(newStart, (task as any).duration || 1);

      if (newStart > (task as any).startDate || newEnd > (task as any).endDate) {
        rescheduled.push({
          taskId,
          startDate: newStart,
          endDate: newEnd,
          resources: [],
          criticalPath: false,
          float: 0,
        });
      }

      return newEnd;
    };

    // Process all tasks
    for (const task of tasks) {
      processTask(task.id);
    }

    return rescheduled;
  }
}

const schedulerService = new SmartSchedulerService();

// ============================================================================
// WORKER
// ============================================================================

async function processSchedulerJob(job: Job): Promise<any> {
  const { type, ...data } = job.data;

  switch (type) {
    case 'ANALYZE_SCHEDULE':
      return await schedulerService.analyzeSchedule(data.projectId);

    case 'OPTIMIZE_SCHEDULE':
      return await schedulerService.optimizeSchedule(data.projectId, data.constraints);

    case 'CHECK_WEATHER_IMPACT':
      return await schedulerService.checkWeatherImpact(data.projectId, data.location);

    case 'DETECT_CONFLICTS':
      return await schedulerService.detectConflicts(data.projectId);

    case 'AUTO_RESCHEDULE':
      return await schedulerService.autoReschedule(
        data.projectId,
        data.completedTasks,
        data.delayedTasks
      );

    case 'GENERATE_LOOKAHEAD':
      return await generateLookahead(data.projectId, data.weeks);

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

async function generateLookahead(projectId: string, weeks: number = 3) {
  const startDate = new Date();
  const endDate = addWorkingDays(startDate, weeks * 5);

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      OR: [
        { startDate: { gte: startDate, lte: endDate } },
        { endDate: { gte: startDate, lte: endDate } },
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: endDate } },
          ],
        },
      ],
    },
    include: {
      dependencies: true,
      resources: true,
    },
    orderBy: { startDate: 'asc' },
  } as any);

  const analysis = await schedulerService.analyzeSchedule(projectId);

  return {
    projectId,
    period: { start: startDate, end: endDate, weeks },
    tasks: tasks.map(t => ({
      id: t.id,
      name: (t as any).name,
      trade: (t as any).trade,
      startDate: (t as any).startDate,
      endDate: (t as any).endDate,
      duration: (t as any).duration,
      percentComplete: (t as any).percentComplete || 0,
      criticalPath: analysis.criticalPath.includes(t.id),
      float: analysis.float.get(t.id) || 0,
    })),
    criticalPath: analysis.criticalPath,
    bottlenecks: analysis.bottlenecks,
    opportunities: analysis.opportunities,
  };
}

// Create worker
export const smartSchedulerWorker = createWorker(
  QUEUE_NAMES.SMART_SCHEDULER,
  processSchedulerJob
);

// ============================================================================
// ROUTES
// ============================================================================

export async function smartSchedulerRoutes(fastify: FastifyInstance) {
  /**
   * Analyze project schedule
   */
  fastify.get('/projects/:projectId/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const analysis = await schedulerService.analyzeSchedule(projectId);
    return analysis;
  });

  /**
   * Optimize schedule
   */
  fastify.post('/projects/:projectId/optimize', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const constraints = request.body as {
      targetEndDate?: string;
      maxResources?: Record<string, number>;
      prioritizeCost?: boolean;
    };

    const job = await queues.SMART_SCHEDULER.add(
      'optimize-schedule',
      {
        type: 'OPTIMIZE_SCHEDULE',
        projectId,
        constraints: {
          ...constraints,
          targetEndDate: constraints.targetEndDate
            ? new Date(constraints.targetEndDate)
            : undefined,
        },
      },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'optimizing' };
  });

  /**
   * Check weather impact
   */
  fastify.post('/projects/:projectId/weather-impact', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { lat, lon } = request.body as { lat: number; lon: number };

    const impact = await schedulerService.checkWeatherImpact(projectId, { lat, lon });
    return impact;
  });

  /**
   * Detect conflicts
   */
  fastify.get('/projects/:projectId/conflicts', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const conflicts = await schedulerService.detectConflicts(projectId);
    return { conflicts };
  });

  /**
   * Auto-reschedule
   */
  fastify.post('/projects/:projectId/reschedule', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { completedTasks, delayedTasks } = request.body as {
      completedTasks: string[];
      delayedTasks: { taskId: string; newEndDate: string }[];
    };

    const job = await queues.SMART_SCHEDULER.add(
      'auto-reschedule',
      {
        type: 'AUTO_RESCHEDULE',
        projectId,
        completedTasks,
        delayedTasks: delayedTasks.map(d => ({
          taskId: d.taskId,
          newEndDate: new Date(d.newEndDate),
        })),
      },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'rescheduling' };
  });

  /**
   * Generate lookahead schedule
   */
  fastify.get('/projects/:projectId/lookahead', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { weeks = '3' } = request.query as { weeks?: string };

    const lookahead = await generateLookahead(projectId, parseInt(weeks));
    return lookahead;
  });

  /**
   * Dashboard metrics
   */
  fastify.get('/dashboard/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const [
      projectsWithConflicts,
      tasksOverdue,
      optimizationsRun,
    ] = await Promise.all([
      prisma.project.count({
        where: { status: 'IN_PROGRESS' },
      } as any),
      prisma.task.count({
        where: {
          endDate: { lt: new Date() },
          status: { not: 'COMPLETE' },
        },
      } as any),
      (prisma as any).schedulingJob?.count({
        where: {
          type: 'OPTIMIZE',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }) ?? 0,
    ]);

    return {
      projectsWithConflicts,
      tasksOverdue,
      optimizationsRun,
    };
  });
}
