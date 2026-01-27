/**
 * APP-02: SITE VISIT SCHEDULER
 * Automation Level: 90%
 *
 * Features:
 * - Automatic visit scheduling based on package tier
 * - PM capacity and workload balancing
 * - Route optimization for multiple visits
 * - Weather-aware scheduling
 * - Visit report integration
 * - Calendar synchronization
 */

import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import {
  createWorker,
  queues,
  QUEUE_NAMES,
  JOB_OPTIONS,
} from '../../../shared/queue.js';
import { getEventBus, EVENT_TYPES } from '../../../shared/events.js';
import {
  optimizeRoute,
  planDailyRoute,
  Location,
} from '../../../shared/integrations/maps.js';
import {
  getDailyForecast,
  isWorkableTime,
} from '../../../shared/integrations/weather.js';
import {
  createCalendarEvent,
  getAvailableSlots,
  scheduleSiteVisit,
} from '../../../shared/integrations/calendar.js';
import {
  sendVisitReminder,
  sendEmail,
  EMAIL_TEMPLATES,
} from '../../../shared/integrations/email.js';
import {
  sendVisitReminderSMS,
} from '../../../shared/integrations/sms.js';
import {
  addWorkingDays,
  isWorkingDay,
  formatDateTime,
} from '../../../shared/utils/date.js';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

export interface VisitScheduleRequest {
  projectId: string;
  pmId: string;
  visitType: VisitType;
  preferredDates?: Date[];
  duration: number; // minutes
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  requiresWeatherCheck?: boolean;
}

export type VisitType =
  | 'KICKOFF'
  | 'REGULAR'
  | 'MILESTONE'
  | 'INSPECTION_PREP'
  | 'QUALITY_CHECK'
  | 'FINAL_WALKTHROUGH'
  | 'PUNCH_LIST'
  | 'EMERGENCY';

export interface ScheduledVisit {
  id: string;
  projectId: string;
  pmId: string;
  visitType: VisitType;
  scheduledAt: Date;
  duration: number;
  status: VisitStatus;
  calendarEventId?: string;
  notes?: string;
}

export type VisitStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED';

export interface PMWorkload {
  pmId: string;
  pmName: string;
  activeProjects: number;
  scheduledVisitsToday: number;
  scheduledVisitsThisWeek: number;
  availableCapacity: number; // percentage
}

// Visit frequency by package tier (visits per month)
const VISIT_FREQUENCY: Record<string, number> = {
  STARTER: 2,
  PROFESSIONAL: 4,
  ENTERPRISE: 8,
  PREMIUM: 12,
};

// ============================================================================
// VISIT SCHEDULER SERVICE
// ============================================================================

class VisitSchedulerService {
  /**
   * Schedule a new site visit
   */
  async scheduleVisit(request: VisitScheduleRequest): Promise<ScheduledVisit> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: request.projectId },
      include: { client: true },
    });

    const pm = await prisma.user.findUniqueOrThrow({
      where: { id: request.pmId },
    });

    // Find available time slot
    const slot = await this.findOptimalSlot(request, pm);

    if (!slot) {
      throw new Error('No available time slots found');
    }

    // Check weather if required
    if (request.requiresWeatherCheck && project.latitude && project.longitude) {
      const weather = await isWorkableTime(
        project.latitude,
        project.longitude,
        slot.start
      );

      if (!weather.isWorkable) {
        // Try to find alternative date
        const altSlot = await this.findWeatherSafeSlot(request, pm, project);
        if (altSlot) {
          slot.start = altSlot.start;
          slot.end = altSlot.end;
        }
      }
    }

    // Create visit record
    const visit = await prisma.siteVisit.create({
      data: {
        projectId: request.projectId,
        pmId: request.pmId,
        visitType: request.visitType,
        scheduledAt: slot.start,
        duration: request.duration,
        status: 'SCHEDULED',
        priority: request.priority,
        notes: request.notes,
      },
    });

    // Create calendar event
    let calendarEventId: string | undefined;
    try {
      calendarEventId = await scheduleSiteVisit({
        calendarId: pm.email,
        projectName: project.name,
        address: project.address || '',
        pmEmail: pm.email,
        start: slot.start,
        durationMinutes: request.duration,
        notes: request.notes,
      });

      await prisma.siteVisit.update({
        where: { id: visit.id },
        data: { calendarEventId },
      });
    } catch (error) {
      console.error('Failed to create calendar event:', error);
    }

    // Emit event
    await getEventBus('visit-scheduler').publish(
      EVENT_TYPES.VISIT_SCHEDULED,
      {
        visitId: visit.id,
        projectId: request.projectId,
        projectName: project.name,
        pmId: request.pmId,
        pmName: pm.name,
        scheduledAt: slot.start,
        visitType: request.visitType,
      }
    );

    // Schedule reminders
    await this.scheduleReminders(visit.id, slot.start, pm.email, project.name);

    return {
      id: visit.id,
      projectId: visit.projectId,
      pmId: visit.pmId,
      visitType: visit.visitType as VisitType,
      scheduledAt: visit.scheduledAt,
      duration: visit.duration,
      status: visit.status as VisitStatus,
      calendarEventId,
      notes: visit.notes || undefined,
    };
  }

  /**
   * Find optimal time slot based on PM availability and preferences
   */
  private async findOptimalSlot(
    request: VisitScheduleRequest,
    pm: { email: string; id: string }
  ): Promise<{ start: Date; end: Date } | null> {
    const startSearch = new Date();
    const endSearch = addWorkingDays(startSearch, 14);

    // If preferred dates provided, try those first
    if (request.preferredDates?.length) {
      for (const preferred of request.preferredDates) {
        const slots = await getAvailableSlots(
          pm.email,
          preferred,
          new Date(preferred.getTime() + 24 * 60 * 60 * 1000),
          request.duration
        );

        if (slots.length > 0) {
          return slots[0];
        }
      }
    }

    // Otherwise find next available
    const slots = await getAvailableSlots(
      pm.email,
      startSearch,
      endSearch,
      request.duration
    );

    // Prioritize based on visit type
    if (request.priority === 'urgent') {
      return slots[0] || null;
    }

    // Try to batch with other visits on same day
    const existingVisits = await prisma.siteVisit.findMany({
      where: {
        pmId: pm.id,
        scheduledAt: { gte: startSearch, lte: endSearch },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: { project: true },
    });

    // Find slot that allows route optimization
    for (const slot of slots) {
      const slotDate = slot.start.toDateString();
      const sameDayVisits = existingVisits.filter(
        v => v.scheduledAt.toDateString() === slotDate
      );

      if (sameDayVisits.length > 0 && sameDayVisits.length < 4) {
        return slot; // Good day for batching
      }
    }

    return slots[0] || null;
  }

  /**
   * Find a weather-safe time slot
   */
  private async findWeatherSafeSlot(
    request: VisitScheduleRequest,
    pm: { email: string },
    project: { latitude: number | null; longitude: number | null }
  ): Promise<{ start: Date; end: Date } | null> {
    if (!project.latitude || !project.longitude) return null;

    const forecast = await getDailyForecast(
      project.latitude,
      project.longitude,
      7
    );

    const workableDays = forecast.filter(d => d.isWorkable);

    for (const day of workableDays) {
      const slots = await getAvailableSlots(
        pm.email,
        day.date,
        new Date(day.date.getTime() + 24 * 60 * 60 * 1000),
        request.duration
      );

      if (slots.length > 0) {
        return slots[0];
      }
    }

    return null;
  }

  /**
   * Schedule reminder notifications
   */
  private async scheduleReminders(
    visitId: string,
    visitTime: Date,
    pmEmail: string,
    projectName: string
  ): Promise<void> {
    const oneDayBefore = visitTime.getTime() - 24 * 60 * 60 * 1000;
    const oneHourBefore = visitTime.getTime() - 60 * 60 * 1000;

    // 24 hour reminder
    if (oneDayBefore > Date.now()) {
      await queues.VISIT_SCHEDULER.add(
        'send-reminder',
        {
          type: 'SEND_REMINDER',
          visitId,
          reminderType: '24h',
        },
        { ...JOB_OPTIONS.SCHEDULED, delay: oneDayBefore - Date.now() }
      );
    }

    // 1 hour reminder
    if (oneHourBefore > Date.now()) {
      await queues.VISIT_SCHEDULER.add(
        'send-reminder',
        {
          type: 'SEND_REMINDER',
          visitId,
          reminderType: '1h',
        },
        { ...JOB_OPTIONS.SCHEDULED, delay: oneHourBefore - Date.now() }
      );
    }
  }

  /**
   * Optimize route for a PM's daily visits
   */
  async optimizeDailyRoute(pmId: string, date: Date): Promise<{
    optimizedOrder: string[];
    totalDistance: number;
    totalDuration: number;
    savings: { distance: number; time: number };
  }> {
    const visits = await prisma.siteVisit.findMany({
      where: {
        pmId,
        scheduledAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: { project: true },
      orderBy: { scheduledAt: 'asc' },
    });

    if (visits.length < 2) {
      return {
        optimizedOrder: visits.map(v => v.id),
        totalDistance: 0,
        totalDuration: 0,
        savings: { distance: 0, time: 0 },
      };
    }

    const pm = await prisma.user.findUnique({
      where: { id: pmId },
      select: { homeLatitude: true, homeLongitude: true },
    });

    const pmHome: Location = {
      lat: pm?.homeLatitude || 38.9,
      lng: pm?.homeLongitude || -77.0,
    };

    const locations = visits.map(v => ({
      id: v.id,
      projectName: v.project.name,
      location: {
        lat: v.project.latitude || 38.9,
        lng: v.project.longitude || -77.0,
      },
      estimatedDurationMinutes: v.duration,
    }));

    const planned = await planDailyRoute(pmHome, locations, new Date(date));

    // Calculate savings vs original order
    const originalDistance = visits.length * 10; // Rough estimate
    const savings = {
      distance: Math.max(0, originalDistance - planned.totalDistance),
      time: Math.max(0, (visits.length * 20) - planned.totalTravelTime),
    };

    // Update visit times based on optimization
    for (let i = 0; i < planned.orderedVisits.length; i++) {
      const visit = planned.orderedVisits[i];
      await prisma.siteVisit.update({
        where: { id: visit.id },
        data: { scheduledAt: visit.arrivalTime },
      });
    }

    return {
      optimizedOrder: planned.orderedVisits.map(v => v.id),
      totalDistance: planned.totalDistance,
      totalDuration: planned.totalTravelTime,
      savings,
    };
  }

  /**
   * Get PM workload
   */
  async getPMWorkload(pmId: string): Promise<PMWorkload> {
    const pm = await prisma.user.findUniqueOrThrow({
      where: { id: pmId },
      select: { name: true },
    });

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const [activeProjects, visitsToday, visitsThisWeek] = await Promise.all([
      prisma.project.count({
        where: {
          pmId,
          status: { in: ['IN_PROGRESS', 'ACTIVE'] },
        },
      }),
      prisma.siteVisit.count({
        where: {
          pmId,
          scheduledAt: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
            lt: new Date(today.setHours(23, 59, 59, 999)),
          },
          status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
        },
      }),
      prisma.siteVisit.count({
        where: {
          pmId,
          scheduledAt: { gte: weekStart, lt: weekEnd },
          status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
        },
      }),
    ]);

    // Capacity: assume max 4 visits/day, 20 visits/week, 15 active projects
    const dailyCapacity = Math.max(0, 1 - visitsToday / 4) * 33;
    const weeklyCapacity = Math.max(0, 1 - visitsThisWeek / 20) * 33;
    const projectCapacity = Math.max(0, 1 - activeProjects / 15) * 34;
    const availableCapacity = dailyCapacity + weeklyCapacity + projectCapacity;

    return {
      pmId,
      pmName: pm.name || 'Unknown',
      activeProjects,
      scheduledVisitsToday: visitsToday,
      scheduledVisitsThisWeek: visitsThisWeek,
      availableCapacity: Math.round(availableCapacity),
    };
  }

  /**
   * Auto-schedule visits for a project based on tier
   */
  async autoScheduleProjectVisits(projectId: string): Promise<number> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { client: true },
    });

    if (!project.pmId) {
      throw new Error('Project has no assigned PM');
    }

    const tier = project.client.subscriptionTier || 'STARTER';
    const visitsPerMonth = VISIT_FREQUENCY[tier] || 2;
    const daysPerVisit = Math.floor(30 / visitsPerMonth);

    let scheduledCount = 0;
    let nextDate = new Date();

    for (let i = 0; i < visitsPerMonth; i++) {
      try {
        await this.scheduleVisit({
          projectId,
          pmId: project.pmId,
          visitType: 'REGULAR',
          preferredDates: [nextDate],
          duration: 60,
          priority: 'normal',
          requiresWeatherCheck: true,
        });
        scheduledCount++;
        nextDate = addWorkingDays(nextDate, daysPerVisit);
      } catch (error) {
        console.error(`Failed to schedule visit ${i + 1}:`, error);
      }
    }

    return scheduledCount;
  }
}

// ============================================================================
// JOB TYPES
// ============================================================================

type VisitSchedulerJob =
  | { type: 'SCHEDULE_VISIT'; request: VisitScheduleRequest }
  | { type: 'OPTIMIZE_ROUTE'; pmId: string; date: string }
  | { type: 'SEND_REMINDER'; visitId: string; reminderType: '24h' | '1h' }
  | { type: 'COMPLETE_VISIT'; visitId: string; notes?: string; photos?: string[] }
  | { type: 'CANCEL_VISIT'; visitId: string; reason: string }
  | { type: 'AUTO_SCHEDULE_PROJECT'; projectId: string };

// ============================================================================
// WORKER
// ============================================================================

const service = new VisitSchedulerService();

async function processVisitSchedulerJob(job: Job<VisitSchedulerJob>): Promise<unknown> {
  console.log(`[VisitScheduler] Processing job: ${job.data.type} (${job.id})`);

  switch (job.data.type) {
    case 'SCHEDULE_VISIT':
      return service.scheduleVisit(job.data.request);

    case 'OPTIMIZE_ROUTE':
      return service.optimizeDailyRoute(job.data.pmId, new Date(job.data.date));

    case 'SEND_REMINDER': {
      const visit = await prisma.siteVisit.findUnique({
        where: { id: job.data.visitId },
        include: { project: true, pm: true },
      });

      if (!visit || visit.status === 'CANCELLED') return { sent: false };

      if (visit.pm) {
        await sendVisitReminder({
          pmEmail: visit.pm.email,
          pmName: visit.pm.name || 'PM',
          projectName: visit.project.name,
          projectAddress: visit.project.address || '',
          visitDate: visit.scheduledAt,
          visitType: visit.visitType,
          notes: visit.notes || undefined,
        });

        // Also send SMS for 1h reminder
        if (job.data.reminderType === '1h' && visit.pm.phone) {
          await sendVisitReminderSMS({
            phone: visit.pm.phone,
            project: visit.project.name,
            time: formatDateTime(visit.scheduledAt),
            address: visit.project.address || '',
          });
        }
      }

      await getEventBus('visit-scheduler').publish(
        EVENT_TYPES.VISIT_REMINDER,
        {
          visitId: visit.id,
          projectId: visit.projectId,
          pmId: visit.pmId,
          reminderType: job.data.reminderType,
        }
      );

      return { sent: true };
    }

    case 'COMPLETE_VISIT': {
      const visit = await prisma.siteVisit.update({
        where: { id: job.data.visitId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          notes: job.data.notes,
          photos: job.data.photos,
        },
        include: { project: true },
      });

      await getEventBus('visit-scheduler').publish(
        EVENT_TYPES.VISIT_COMPLETED,
        {
          visitId: visit.id,
          projectId: visit.projectId,
          projectName: visit.project.name,
          completedAt: visit.completedAt,
        }
      );

      // Queue report generation
      await queues.REPORT_GENERATOR.add(
        'generate-visit-report',
        {
          type: 'GENERATE_VISIT_REPORT',
          visitId: visit.id,
        },
        JOB_OPTIONS.DEFAULT
      );

      return { completed: true, visitId: visit.id };
    }

    case 'CANCEL_VISIT': {
      const visit = await prisma.siteVisit.update({
        where: { id: job.data.visitId },
        data: {
          status: 'CANCELLED',
          cancellationReason: job.data.reason,
        },
        include: { pm: true, project: true },
      });

      await getEventBus('visit-scheduler').publish(
        EVENT_TYPES.VISIT_CANCELLED,
        {
          visitId: visit.id,
          projectId: visit.projectId,
          reason: job.data.reason,
        }
      );

      return { cancelled: true };
    }

    case 'AUTO_SCHEDULE_PROJECT':
      return {
        scheduledCount: await service.autoScheduleProjectVisits(job.data.projectId),
      };

    default:
      throw new Error(`Unknown job type: ${(job.data as { type: string }).type}`);
  }
}

export const visitSchedulerWorker = createWorker(
  QUEUE_NAMES.VISIT_SCHEDULER,
  processVisitSchedulerJob,
  { concurrency: 5 }
);

// ============================================================================
// API ROUTES
// ============================================================================

export async function visitSchedulerRoutes(fastify: FastifyInstance) {
  // Schedule a visit
  fastify.post('/visits', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as VisitScheduleRequest;
    const job = await queues.VISIT_SCHEDULER.add(
      'schedule-visit',
      { type: 'SCHEDULE_VISIT', request: body },
      JOB_OPTIONS.DEFAULT
    );
    const result = await job.waitUntilFinished(
      (await import('../../../shared/queue.js')).queueEvents.VISIT_SCHEDULER,
      30000
    );
    return result;
  });

  // Get PM schedule
  fastify.get('/visits/pm/:pmId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { pmId } = request.params as { pmId: string };
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

    const visits = await prisma.siteVisit.findMany({
      where: {
        pmId,
        scheduledAt: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      include: { project: { select: { name: true, address: true } } },
      orderBy: { scheduledAt: 'asc' },
    });

    return visits;
  });

  // Get project visits
  fastify.get('/visits/project/:projectId', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };
    return prisma.siteVisit.findMany({
      where: { projectId },
      include: { pm: { select: { name: true, email: true } } },
      orderBy: { scheduledAt: 'desc' },
    });
  });

  // Optimize route
  fastify.post('/visits/optimize-route', async (request: FastifyRequest) => {
    const { pmId, date } = request.body as { pmId: string; date: string };
    return service.optimizeDailyRoute(pmId, new Date(date));
  });

  // Complete visit
  fastify.post('/visits/:id/complete', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const { notes, photos } = request.body as { notes?: string; photos?: string[] };
    const job = await queues.VISIT_SCHEDULER.add(
      'complete-visit',
      { type: 'COMPLETE_VISIT', visitId: id, notes, photos },
      JOB_OPTIONS.DEFAULT
    );
    return { jobId: job.id, status: 'completing' };
  });

  // Cancel visit
  fastify.post('/visits/:id/cancel', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const { reason } = request.body as { reason: string };
    const job = await queues.VISIT_SCHEDULER.add(
      'cancel-visit',
      { type: 'CANCEL_VISIT', visitId: id, reason },
      JOB_OPTIONS.DEFAULT
    );
    return { jobId: job.id, status: 'cancelling' };
  });

  // Get PM workload
  fastify.get('/visits/workload/:pmId', async (request: FastifyRequest) => {
    const { pmId } = request.params as { pmId: string };
    return service.getPMWorkload(pmId);
  });

  // Auto-schedule project visits
  fastify.post('/visits/auto-schedule/:projectId', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };
    const job = await queues.VISIT_SCHEDULER.add(
      'auto-schedule',
      { type: 'AUTO_SCHEDULE_PROJECT', projectId },
      JOB_OPTIONS.DEFAULT
    );
    return { jobId: job.id, status: 'scheduling' };
  });
}

// Export service for direct use
export { VisitSchedulerService };
