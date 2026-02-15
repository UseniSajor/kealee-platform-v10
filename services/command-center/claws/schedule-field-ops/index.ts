import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { KEALEE_QUEUES, createQueue, createWorker } from '@kealee/queue';
import { AIProvider, SCHEDULE_PROMPT } from '@kealee/ai';
import { BaseClaw } from '../base-claw';
import { SchedulerWorkerHandlers } from './workers/scheduler';
import { VisitsWorkerHandlers } from './workers/visits';
import { InspectionsWorkerHandlers } from './workers/inspections';
import type { Job } from 'bullmq';

// ---------------------------------------------------------------------------
// Config per architecture doc S8
// ---------------------------------------------------------------------------
const CLAW_CONFIG = {
  name: 'schedule-field-ops-claw',
  eventPatterns: ['contract.*', 'changeorder.*', 'weather.*', 'inspection.*'],
  writableModels: ['ScheduleItem', 'WeatherLog', 'SiteVisit', 'VisitChecklist'],
};

/**
 * Claw C: Schedule & Field Ops
 *
 * Responsibilities:
 *   - CPM scheduling (forward/backward pass, float analysis, critical path)
 *   - Resource leveling across trades
 *   - 2-week rolling look-ahead generation
 *   - Weather delay auto-rescheduling
 *   - Site visit scheduling with PM availability + route optimization
 *   - Inspection timing coordination with permits
 *   - Daily field reports
 *
 * Events consumed:
 *   contract.executed, changeorder.approved, weather.alert, inspection.required
 *
 * Events published:
 *   schedule.created, schedule.updated, schedule.criticalpath.changed,
 *   sitevisit.scheduled, sitevisit.completed
 *
 * GUARDRAILS:
 *   - Cannot approve/fail inspections (pass/fail is Claw E)
 *   - Cannot alter contract values
 *   - Cannot modify budgets
 */
export class ScheduleFieldOpsClaw extends BaseClaw {
  private ai: AIProvider;
  private schedulerHandlers: SchedulerWorkerHandlers;
  private visitsHandlers: VisitsWorkerHandlers;
  private inspectionsHandlers: InspectionsWorkerHandlers;

  constructor(eventBus: EventBus, prisma: PrismaClient) {
    super(eventBus, prisma, CLAW_CONFIG);
    this.ai = new AIProvider();

    // Bind assertWritable so worker handlers can enforce guardrails
    const boundAssert = this.assertWritable.bind(this);

    this.schedulerHandlers = new SchedulerWorkerHandlers(
      prisma, eventBus, CLAW_CONFIG.name, boundAssert, this.ai,
    );
    this.visitsHandlers = new VisitsWorkerHandlers(
      prisma, eventBus, CLAW_CONFIG.name, boundAssert, this.ai,
    );
    this.inspectionsHandlers = new InspectionsWorkerHandlers(
      prisma, eventBus, CLAW_CONFIG.name, boundAssert,
    );
  }

  // =========================================================================
  // Event Router
  // =========================================================================

  async handleEvent(event: KealeeEventEnvelope): Promise<void> {
    switch (event.type) {
      // --- Contract executed -> seed / rebuild schedule ---
      case 'contract.executed': {
        const queue = createQueue(KEALEE_QUEUES.SMART_SCHEDULER);
        await queue.add('build-schedule', { event });
        break;
      }

      // --- Change order approved -> adjust schedule for scope changes ---
      case 'changeorder.approved': {
        const queue = createQueue(KEALEE_QUEUES.SMART_SCHEDULER);
        await queue.add('update-schedule-for-co', { event });
        break;
      }

      // --- Weather alert -> auto-reschedule weather-sensitive tasks ---
      case 'weather.alert': {
        const queue = createQueue(KEALEE_QUEUES.SMART_SCHEDULER);
        await queue.add('reschedule-for-weather', { event });

        // Also reschedule affected site visits
        const visitQueue = createQueue(KEALEE_QUEUES.VISIT_SCHEDULER);
        await visitQueue.add('reschedule-weather-visits', { event });
        break;
      }

      // --- Inspection required -> coordinate timing with permits/schedule ---
      case 'inspection.required': {
        const queue = createQueue(KEALEE_QUEUES.SMART_SCHEDULER);
        await queue.add('coordinate-inspection-timing', { event });
        break;
      }
    }
  }

  // =========================================================================
  // Worker Registration
  // =========================================================================

  async registerWorkers(): Promise<void> {
    // ---- Scheduler Worker (CPM, resource leveling, weather reschedule) ----
    createWorker(KEALEE_QUEUES.SMART_SCHEDULER, async (job: Job) => {
      switch (job.name) {
        case 'build-schedule':
          await this.schedulerHandlers.handleBuildSchedule(job);
          break;
        case 'reschedule-for-weather':
          await this.schedulerHandlers.handleWeatherReschedule(job);
          break;
        case 'generate-look-ahead':
          return await this.schedulerHandlers.handleGenerateLookAhead(job);
        case 'update-schedule-for-co':
          await this.schedulerHandlers.handleChangeOrderImpact(job);
          break;
        case 'coordinate-inspection-timing':
          await this.inspectionsHandlers.handleCoordinateInspectionTiming(job);
          break;
        case 'inspection-reminder':
          await this.inspectionsHandlers.handleInspectionReminder(job);
          break;
        case 'check-inspection-prerequisites':
          return await this.inspectionsHandlers.handleCheckPrerequisites(job);
      }
    });

    // ---- Visits Worker (scheduling, route optimization, completion) ----
    createWorker(KEALEE_QUEUES.VISIT_SCHEDULER, async (job: Job) => {
      switch (job.name) {
        case 'schedule-visit':
          await this.visitsHandlers.handleScheduleVisit(job);
          break;
        case 'optimize-route':
          return await this.visitsHandlers.handleOptimizeRoute(job);
        case 'complete-visit':
          await this.visitsHandlers.handleCompleteVisit(job);
          break;
        case 'reschedule-visit':
          await this.visitsHandlers.handleRescheduleVisit(job);
          break;
        case 'reschedule-weather-visits':
          await this.handleRescheduleWeatherVisits(job);
          break;
      }
    });
  }

  // =========================================================================
  // Internal: Reschedule visits affected by weather
  // =========================================================================

  private async handleRescheduleWeatherVisits(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('SiteVisit');

    const payload = event.payload as Record<string, any>;
    const projectId = event.projectId ?? payload.projectId;
    const alertStart = new Date(payload.startDate);
    const alertEnd = new Date(payload.endDate);

    // Find visits in the weather window
    const affectedVisits = await this.prisma.siteVisit.findMany({
      where: {
        projectId,
        status: { in: ['SCHEDULED', 'RESCHEDULED'] },
        scheduledAt: { gte: alertStart, lte: alertEnd },
      },
    });

    if (affectedVisits.length === 0) return;

    // Reschedule each affected visit
    const visitQueue = createQueue(KEALEE_QUEUES.VISIT_SCHEDULER);
    for (const visit of affectedVisits) {
      await visitQueue.add('reschedule-visit', {
        visitId: visit.id,
        reason: `Weather alert: ${payload.condition} (${payload.severity})`,
        event,
      });
    }
  }
}
