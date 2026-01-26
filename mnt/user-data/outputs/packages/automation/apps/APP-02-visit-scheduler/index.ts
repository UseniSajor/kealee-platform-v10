// ============================================================================
// APP-02: SITE VISIT SCHEDULER
// ============================================================================
// Automates scheduling, routing, and coordination of PM site visits
// Automation Level: 90%
// Build Time: 4-6 weeks
// ============================================================================

import { prisma } from '@kealee/database';
import { Job } from 'bullmq';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../shared/queue';
import { getEventBus, EVENT_TYPES } from '../../shared/events';
import { sendEmail, EMAIL_TEMPLATES } from '../../shared/integrations/sendgrid';
import { sendSMS } from '../../shared/integrations/twilio';
import { createCalendarEvent, getAvailableSlots } from '../../shared/integrations/google-calendar';
import { optimizeRoute, calculateRoute, geocodeAddress } from '../../shared/integrations/google-maps';
import { getWeatherForecast } from '../../shared/integrations/weather';
import { addDays, startOfDay, endOfDay, format, isWeekend, isSameDay } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface VisitScheduleRequest {
  projectId: string;
  pmId: string;
  visitType: 'assessment' | 'progress' | 'inspection_prep' | 'punch_list' | 'final';
  preferredDates?: Date[];
  duration: number; // minutes
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
}

export interface ScheduledVisit {
  id: string;
  projectId: string;
  pmId: string;
  scheduledAt: Date;
  endAt: Date;
  type: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  checklist?: string[];
  weather?: {
    conditions: string;
    temp: number;
    isWorkable: boolean;
  };
}

export interface RouteOptimization {
  pmId: string;
  date: Date;
  visits: Array<{
    projectId: string;
    address: string;
    scheduledAt: Date;
    duration: number;
    travelTime: number; // minutes from previous
  }>;
  totalDistance: number; // miles
  totalDuration: number; // minutes
  optimizationSavings: {
    distanceSaved: number;
    timeSaved: number;
  };
}

// ============================================================================
// PACKAGE RULES
// ============================================================================

const PACKAGE_VISIT_RULES = {
  A: {
    minVisitsPerMonth: 0,
    maxVisitsPerMonth: 1,
    visitDuration: 30, // minutes
    requiresNotice: 48, // hours
  },
  B: {
    minVisitsPerMonth: 2,
    maxVisitsPerMonth: 4,
    visitDuration: 60,
    requiresNotice: 24,
  },
  C: {
    minVisitsPerMonth: 4,
    maxVisitsPerMonth: 8,
    visitDuration: 90,
    requiresNotice: 24,
  },
  D: {
    minVisitsPerMonth: 8,
    maxVisitsPerMonth: 16,
    visitDuration: 120,
    requiresNotice: 12,
  },
};

// ============================================================================
// SMART SCHEDULER
// ============================================================================

export class SmartScheduler {
  async scheduleVisit(request: VisitScheduleRequest): Promise<ScheduledVisit> {
    // Get project and PM details
    const [project, pm] = await Promise.all([
      prisma.project.findUniqueOrThrow({
        where: { id: request.projectId },
        include: { client: true, subscription: true },
      }),
      prisma.user.findUniqueOrThrow({
        where: { id: request.pmId },
      }),
    ]);

    // Get package rules
    const packageTier = (project.subscription?.tier || 'A') as keyof typeof PACKAGE_VISIT_RULES;
    const rules = PACKAGE_VISIT_RULES[packageTier];
    const duration = request.duration || rules.visitDuration;

    // Get location
    const location = await geocodeAddress(project.address);

    // Get PM's availability
    const preferredDates = request.preferredDates || this.getNextAvailableDates(7);
    const availableSlots = await this.findAvailableSlots(
      request.pmId,
      preferredDates,
      duration
    );

    if (availableSlots.length === 0) {
      throw new Error('No available time slots found');
    }

    // Check weather for outdoor visits
    const weather = await this.getVisitWeather(location.lat, location.lng, availableSlots);
    
    // Select best slot considering weather and travel
    const bestSlot = await this.selectBestSlot(availableSlots, {
      pmId: request.pmId,
      location,
      weather,
      priority: request.priority,
    });

    // Create the visit
    const visit = await prisma.siteVisit.create({
      data: {
        projectId: request.projectId,
        pmId: request.pmId,
        scheduledAt: bestSlot.start,
        type: request.visitType,
        status: 'SCHEDULED',
        notes: request.notes,
      },
    });

    // Create calendar event
    await createCalendarEvent(pm.calendarId || 'primary', {
      summary: `Site Visit: ${project.name}`,
      description: `${request.visitType} visit\n${request.notes || ''}`,
      location: project.address,
      start: bestSlot.start,
      end: new Date(bestSlot.start.getTime() + duration * 60000),
      attendees: [pm.email],
    });

    // Send confirmations
    await this.sendConfirmations(visit, project, pm);

    // Emit event
    await getEventBus().publish(
      EVENT_TYPES.VISIT_SCHEDULED,
      {
        visitId: visit.id,
        projectId: request.projectId,
        pmId: request.pmId,
        scheduledAt: bestSlot.start,
        type: request.visitType,
      },
      'visit-scheduler'
    );

    return {
      id: visit.id,
      projectId: request.projectId,
      pmId: request.pmId,
      scheduledAt: bestSlot.start,
      endAt: new Date(bestSlot.start.getTime() + duration * 60000),
      type: request.visitType,
      status: 'scheduled',
      location: {
        address: project.address,
        lat: location.lat,
        lng: location.lng,
      },
      weather: weather.find(w => isSameDay(w.date, bestSlot.start)),
    };
  }

  private getNextAvailableDates(days: number): Date[] {
    const dates: Date[] = [];
    let current = addDays(new Date(), 1);
    
    while (dates.length < days) {
      if (!isWeekend(current)) {
        dates.push(current);
      }
      current = addDays(current, 1);
    }
    
    return dates;
  }

  private async findAvailableSlots(
    pmId: string,
    dates: Date[],
    durationMinutes: number
  ): Promise<Array<{ start: Date; end: Date }>> {
    const pm = await prisma.user.findUnique({ where: { id: pmId } });
    if (!pm?.calendarId) {
      // Return default work hours if no calendar
      return dates.flatMap(date => [
        { start: this.setTime(date, 9, 0), end: this.setTime(date, 9 + Math.ceil(durationMinutes / 60), 0) },
        { start: this.setTime(date, 13, 0), end: this.setTime(date, 13 + Math.ceil(durationMinutes / 60), 0) },
      ]);
    }

    const allSlots: Array<{ start: Date; end: Date }> = [];
    
    for (const date of dates) {
      const slots = await getAvailableSlots(
        pm.calendarId,
        startOfDay(date),
        endOfDay(date),
        durationMinutes
      );
      allSlots.push(...slots);
    }

    return allSlots;
  }

  private setTime(date: Date, hours: number, minutes: number): Date {
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  private async getVisitWeather(
    lat: number,
    lng: number,
    slots: Array<{ start: Date }>
  ): Promise<Array<{ date: Date; conditions: string; temp: number; isWorkable: boolean }>> {
    const forecast = await getWeatherForecast(lat, lng, 7);
    
    return forecast.map(f => ({
      date: f.date,
      conditions: f.conditions,
      temp: (f.temp.max + f.temp.min) / 2,
      isWorkable: f.isWorkable,
    }));
  }

  private async selectBestSlot(
    slots: Array<{ start: Date; end: Date }>,
    context: {
      pmId: string;
      location: { lat: number; lng: number };
      weather: Array<{ date: Date; isWorkable: boolean }>;
      priority: string;
    }
  ): Promise<{ start: Date; end: Date }> {
    // Filter by workable weather
    const workableSlots = slots.filter(slot => {
      const dayWeather = context.weather.find(w => isSameDay(w.date, slot.start));
      return dayWeather?.isWorkable !== false;
    });

    if (workableSlots.length === 0) {
      console.log('No slots with good weather, using first available');
      return slots[0];
    }

    // Get PM's existing visits for route optimization
    const existingVisits = await prisma.siteVisit.findMany({
      where: {
        pmId: context.pmId,
        scheduledAt: {
          gte: startOfDay(slots[0].start),
          lte: endOfDay(slots[slots.length - 1].start),
        },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: { project: true },
    });

    // Score each slot
    const scoredSlots = await Promise.all(
      workableSlots.map(async slot => {
        let score = 100;

        // Prefer morning slots
        const hour = slot.start.getHours();
        if (hour >= 9 && hour <= 11) score += 10;

        // Prefer slots near existing visits (route efficiency)
        const sameDay = existingVisits.filter(v => isSameDay(v.scheduledAt, slot.start));
        if (sameDay.length > 0) {
          score += 15; // Can batch visits
        }

        // Urgent priority prefers earlier dates
        if (context.priority === 'urgent') {
          const daysFromNow = Math.floor((slot.start.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
          score -= daysFromNow * 5;
        }

        return { slot, score };
      })
    );

    // Return highest scored slot
    scoredSlots.sort((a, b) => b.score - a.score);
    return scoredSlots[0].slot;
  }

  private async sendConfirmations(visit: any, project: any, pm: any): Promise<void> {
    // Send email to PM
    await sendEmail({
      to: pm.email,
      subject: `Site Visit Scheduled: ${project.name}`,
      html: `
        <h2>Site Visit Scheduled</h2>
        <p><strong>Project:</strong> ${project.name}</p>
        <p><strong>Address:</strong> ${project.address}</p>
        <p><strong>Date:</strong> ${format(visit.scheduledAt, 'EEEE, MMMM d, yyyy')}</p>
        <p><strong>Time:</strong> ${format(visit.scheduledAt, 'h:mm a')}</p>
        <p><strong>Type:</strong> ${visit.type}</p>
        <p><a href="${process.env.APP_URL}/visits/${visit.id}">View Details</a></p>
      `,
    });

    // Notify client if they want notifications
    if (project.client.notifyOnVisits) {
      await sendEmail({
        to: project.client.email,
        subject: `Upcoming Site Visit: ${project.name}`,
        html: `
          <p>Hi ${project.client.name},</p>
          <p>A site visit has been scheduled for your project.</p>
          <p><strong>Date:</strong> ${format(visit.scheduledAt, 'EEEE, MMMM d, yyyy')} at ${format(visit.scheduledAt, 'h:mm a')}</p>
          <p>Your project manager, ${pm.name}, will be on site to assess progress.</p>
        `,
      });
    }
  }
}

// ============================================================================
// ROUTE OPTIMIZER
// ============================================================================

export class RouteOptimizer {
  async optimizeDayRoute(pmId: string, date: Date): Promise<RouteOptimization> {
    // Get all visits for the day
    const visits = await prisma.siteVisit.findMany({
      where: {
        pmId,
        scheduledAt: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: { project: true },
      orderBy: { scheduledAt: 'asc' },
    });

    if (visits.length <= 1) {
      return {
        pmId,
        date,
        visits: visits.map(v => ({
          projectId: v.projectId,
          address: v.project.address,
          scheduledAt: v.scheduledAt,
          duration: 60, // Default
          travelTime: 0,
        })),
        totalDistance: 0,
        totalDuration: visits.length * 60,
        optimizationSavings: { distanceSaved: 0, timeSaved: 0 },
      };
    }

    // Get PM's starting location (office or home)
    const pm = await prisma.user.findUnique({ where: { id: pmId } });
    const startLocation = await geocodeAddress(pm?.address || '1420 K St NW, Washington, DC');

    // Geocode all visit locations
    const visitLocations = await Promise.all(
      visits.map(async v => ({
        visit: v,
        location: await geocodeAddress(v.project.address),
      }))
    );

    // Calculate original route distance
    const originalRoute = await calculateRoute(
      startLocation,
      visitLocations.map(vl => vl.location)
    );
    const originalDistance = originalRoute.reduce((sum, r) => sum + r.distance, 0) / 1609; // meters to miles

    // Optimize route
    const optimizedOrder = await optimizeRoute(
      startLocation,
      visitLocations.map(vl => vl.location)
    );

    // Calculate optimized distance
    const optimizedRoute = await calculateRoute(startLocation, optimizedOrder);
    const optimizedDistance = optimizedRoute.reduce((sum, r) => sum + r.distance, 0) / 1609;

    // Reorder visits and calculate travel times
    const reorderedVisits = optimizedOrder.map((loc, index) => {
      const original = visitLocations.find(
        vl => vl.location.lat === loc.lat && vl.location.lng === loc.lng
      )!;
      
      return {
        projectId: original.visit.projectId,
        address: original.visit.project.address,
        scheduledAt: original.visit.scheduledAt,
        duration: 60,
        travelTime: Math.round(optimizedRoute[index].duration / 60), // seconds to minutes
      };
    });

    // Update visit times based on optimized route
    let currentTime = this.setTime(date, 9, 0); // Start at 9 AM
    
    for (let i = 0; i < reorderedVisits.length; i++) {
      const visit = reorderedVisits[i];
      
      // Add travel time
      currentTime = new Date(currentTime.getTime() + visit.travelTime * 60000);
      
      // Update scheduled time
      visit.scheduledAt = new Date(currentTime);
      
      // Add visit duration
      currentTime = new Date(currentTime.getTime() + visit.duration * 60000);
      
      // Update database
      await prisma.siteVisit.update({
        where: { id: visits.find(v => v.projectId === visit.projectId)!.id },
        data: { scheduledAt: visit.scheduledAt },
      });
    }

    const totalDuration = reorderedVisits.reduce((sum, v) => sum + v.duration + v.travelTime, 0);

    return {
      pmId,
      date,
      visits: reorderedVisits,
      totalDistance: optimizedDistance,
      totalDuration,
      optimizationSavings: {
        distanceSaved: Math.max(0, originalDistance - optimizedDistance),
        timeSaved: Math.max(0, (originalDistance - optimizedDistance) * 2), // Rough estimate
      },
    };
  }

  private setTime(date: Date, hours: number, minutes: number): Date {
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }
}

// ============================================================================
// AUTO-SCHEDULER (Batch scheduling based on package requirements)
// ============================================================================

export class AutoScheduler {
  private scheduler = new SmartScheduler();

  async scheduleMonthlyVisits(projectId: string): Promise<ScheduledVisit[]> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { subscription: true, assignedPm: true },
    });

    if (!project.assignedPmId) {
      throw new Error('No PM assigned to project');
    }

    const packageTier = (project.subscription?.tier || 'A') as keyof typeof PACKAGE_VISIT_RULES;
    const rules = PACKAGE_VISIT_RULES[packageTier];

    // Get existing visits this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);

    const existingVisits = await prisma.siteVisit.count({
      where: {
        projectId,
        scheduledAt: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'CANCELLED' },
      },
    });

    const visitsNeeded = rules.minVisitsPerMonth - existingVisits;
    
    if (visitsNeeded <= 0) {
      return [];
    }

    // Schedule visits evenly throughout the month
    const scheduledVisits: ScheduledVisit[] = [];
    const daysInMonth = endOfMonth.getDate();
    const interval = Math.floor(daysInMonth / visitsNeeded);

    for (let i = 0; i < visitsNeeded; i++) {
      const targetDay = Math.min(startOfMonth.getDate() + (i * interval), daysInMonth);
      const targetDate = new Date(startOfMonth);
      targetDate.setDate(targetDay);

      // Skip weekends
      while (isWeekend(targetDate)) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      try {
        const visit = await this.scheduler.scheduleVisit({
          projectId,
          pmId: project.assignedPmId,
          visitType: 'progress',
          preferredDates: [targetDate],
          duration: rules.visitDuration,
          priority: 'normal',
        });
        scheduledVisits.push(visit);
      } catch (error) {
        console.error(`Failed to schedule visit for ${targetDate}:`, error);
      }
    }

    return scheduledVisits;
  }

  async scheduleAllProjectVisits(): Promise<{ scheduled: number; failed: number }> {
    // Get all active projects with PM assignments
    const projects = await prisma.project.findMany({
      where: {
        status: { in: ['IN_PROGRESS', 'ACTIVE'] },
        assignedPmId: { not: null },
      },
      include: { subscription: true },
    });

    let scheduled = 0;
    let failed = 0;

    for (const project of projects) {
      try {
        const visits = await this.scheduleMonthlyVisits(project.id);
        scheduled += visits.length;
      } catch (error) {
        console.error(`Failed to schedule visits for project ${project.id}:`, error);
        failed++;
      }
    }

    return { scheduled, failed };
  }
}

// ============================================================================
// REMINDER SERVICE
// ============================================================================

export class ReminderService {
  async sendVisitReminders(): Promise<void> {
    const tomorrow = addDays(new Date(), 1);
    
    // Get visits scheduled for tomorrow
    const visits = await prisma.siteVisit.findMany({
      where: {
        scheduledAt: {
          gte: startOfDay(tomorrow),
          lte: endOfDay(tomorrow),
        },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: {
        project: { include: { client: true } },
        pm: true,
      },
    });

    for (const visit of visits) {
      // Send PM reminder
      await sendSMS(
        visit.pm.phone,
        `Reminder: Site visit tomorrow at ${format(visit.scheduledAt, 'h:mm a')} - ${visit.project.name}, ${visit.project.address}`
      );

      await sendEmail({
        to: visit.pm.email,
        subject: `Tomorrow: Site Visit - ${visit.project.name}`,
        html: `
          <h2>Site Visit Reminder</h2>
          <p><strong>Project:</strong> ${visit.project.name}</p>
          <p><strong>Address:</strong> ${visit.project.address}</p>
          <p><strong>Time:</strong> ${format(visit.scheduledAt, 'EEEE, MMMM d at h:mm a')}</p>
          <p><strong>Type:</strong> ${visit.type}</p>
          <h3>Checklist</h3>
          <ul>
            <li>Review project status before visit</li>
            <li>Bring camera/phone for photos</li>
            <li>Check for outstanding issues</li>
            <li>Prepare questions for contractor</li>
          </ul>
          <p><a href="${process.env.APP_URL}/visits/${visit.id}">View Visit Details</a></p>
        `,
      });

      // Notify client if they want notifications
      if (visit.project.client.notifyOnVisits) {
        await sendEmail({
          to: visit.project.client.email,
          subject: `Site Visit Tomorrow - ${visit.project.name}`,
          html: `
            <p>Hi ${visit.project.client.name},</p>
            <p>This is a reminder that your project manager will be visiting the site tomorrow.</p>
            <p><strong>Time:</strong> ${format(visit.scheduledAt, 'h:mm a')}</p>
            <p><strong>Address:</strong> ${visit.project.address}</p>
          `,
        });
      }

      // Emit event
      await getEventBus().publish(
        EVENT_TYPES.VISIT_REMINDER,
        {
          visitId: visit.id,
          projectId: visit.projectId,
          pmId: visit.pmId,
          scheduledAt: visit.scheduledAt,
        },
        'visit-scheduler'
      );
    }
  }

  async sendMorningBriefing(pmId: string): Promise<void> {
    const today = new Date();
    
    const visits = await prisma.siteVisit.findMany({
      where: {
        pmId,
        scheduledAt: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: { project: true },
      orderBy: { scheduledAt: 'asc' },
    });

    if (visits.length === 0) return;

    const pm = await prisma.user.findUnique({ where: { id: pmId } });
    if (!pm) return;

    // Get weather
    const firstVisit = visits[0];
    const location = await geocodeAddress(firstVisit.project.address);
    const weather = await getWeatherForecast(location.lat, location.lng, 1);

    await sendEmail({
      to: pm.email,
      subject: `Morning Briefing: ${visits.length} Site Visits Today`,
      html: `
        <h2>Good Morning, ${pm.name}!</h2>
        <p>You have <strong>${visits.length} site visit${visits.length > 1 ? 's' : ''}</strong> scheduled today.</p>
        
        <h3>Weather</h3>
        <p>${weather[0].conditions}, ${Math.round(weather[0].temp.max)}°F</p>
        ${!weather[0].isWorkable ? '<p style="color: red;">⚠️ Weather conditions may affect site work</p>' : ''}
        
        <h3>Today's Schedule</h3>
        <table border="1" cellpadding="8" cellspacing="0">
          <tr>
            <th>Time</th>
            <th>Project</th>
            <th>Address</th>
            <th>Type</th>
          </tr>
          ${visits.map(v => `
            <tr>
              <td>${format(v.scheduledAt, 'h:mm a')}</td>
              <td>${v.project.name}</td>
              <td>${v.project.address}</td>
              <td>${v.type}</td>
            </tr>
          `).join('')}
        </table>
        
        <p><a href="${process.env.APP_URL}/schedule">View Full Schedule</a></p>
      `,
    });
  }
}

// ============================================================================
// JOB HANDLERS
// ============================================================================

interface ScheduleVisitJob {
  type: 'SCHEDULE_VISIT';
  request: VisitScheduleRequest;
}

interface OptimizeRouteJob {
  type: 'OPTIMIZE_ROUTE';
  pmId: string;
  date: string;
}

interface SendRemindersJob {
  type: 'SEND_REMINDERS';
}

interface MorningBriefingJob {
  type: 'MORNING_BRIEFING';
  pmId: string;
}

interface AutoScheduleJob {
  type: 'AUTO_SCHEDULE';
  projectId?: string;
}

type VisitSchedulerJob = 
  | ScheduleVisitJob 
  | OptimizeRouteJob 
  | SendRemindersJob 
  | MorningBriefingJob
  | AutoScheduleJob;

// ============================================================================
// WORKER
// ============================================================================

const smartScheduler = new SmartScheduler();
const routeOptimizer = new RouteOptimizer();
const autoScheduler = new AutoScheduler();
const reminderService = new ReminderService();

export const visitSchedulerWorker = createWorker<VisitSchedulerJob>(
  QUEUE_NAMES.VISIT_SCHEDULER,
  async (job: Job<VisitSchedulerJob>) => {
    console.log(`Processing visit-scheduler job: ${job.data.type}`);

    switch (job.data.type) {
      case 'SCHEDULE_VISIT': {
        const visit = await smartScheduler.scheduleVisit(job.data.request);
        return visit;
      }

      case 'OPTIMIZE_ROUTE': {
        const { pmId, date } = job.data;
        const optimization = await routeOptimizer.optimizeDayRoute(pmId, new Date(date));
        return optimization;
      }

      case 'SEND_REMINDERS': {
        await reminderService.sendVisitReminders();
        return { sent: true };
      }

      case 'MORNING_BRIEFING': {
        await reminderService.sendMorningBriefing(job.data.pmId);
        return { sent: true };
      }

      case 'AUTO_SCHEDULE': {
        if (job.data.projectId) {
          const visits = await autoScheduler.scheduleMonthlyVisits(job.data.projectId);
          return { scheduled: visits.length };
        } else {
          const result = await autoScheduler.scheduleAllProjectVisits();
          return result;
        }
      }

      default:
        throw new Error(`Unknown job type: ${(job.data as any).type}`);
    }
  },
  3
);

// ============================================================================
// CRON JOBS
// ============================================================================

import cron from 'node-cron';

// Send reminders at 5 PM for next day visits
cron.schedule('0 17 * * *', async () => {
  await queues.VISIT_SCHEDULER.add(
    'send-reminders',
    { type: 'SEND_REMINDERS' },
    JOB_OPTIONS.DEFAULT
  );
});

// Send morning briefings at 6 AM
cron.schedule('0 6 * * 1-5', async () => {
  const pms = await prisma.user.findMany({
    where: { role: 'PM', status: 'ACTIVE' },
  });

  for (const pm of pms) {
    await queues.VISIT_SCHEDULER.add(
      'morning-briefing',
      { type: 'MORNING_BRIEFING', pmId: pm.id },
      JOB_OPTIONS.DEFAULT
    );
  }
});

// Auto-schedule visits at beginning of each month
cron.schedule('0 0 1 * *', async () => {
  await queues.VISIT_SCHEDULER.add(
    'auto-schedule',
    { type: 'AUTO_SCHEDULE' },
    JOB_OPTIONS.DEFAULT
  );
});

// ============================================================================
// API ROUTES
// ============================================================================

import { FastifyInstance } from 'fastify';

export async function visitSchedulerRoutes(fastify: FastifyInstance) {
  // Schedule a visit
  fastify.post('/visits/schedule', async (request, reply) => {
    const body = request.body as VisitScheduleRequest;
    
    const job = await queues.VISIT_SCHEDULER.add(
      'schedule-visit',
      { type: 'SCHEDULE_VISIT', request: body },
      JOB_OPTIONS.DEFAULT
    );

    const result = await job.waitUntilFinished(await job.queue.getEvents());
    return result;
  });

  // Get visits for a PM
  fastify.get('/visits/pm/:pmId', async (request, reply) => {
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
      include: { project: true },
      orderBy: { scheduledAt: 'asc' },
    });

    return visits;
  });

  // Optimize day's route
  fastify.post('/visits/optimize-route', async (request, reply) => {
    const { pmId, date } = request.body as { pmId: string; date: string };
    
    const optimization = await routeOptimizer.optimizeDayRoute(pmId, new Date(date));
    return optimization;
  });

  // Complete a visit
  fastify.post('/visits/:id/complete', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { notes, photos } = request.body as { notes?: string; photos?: string[] };

    const visit = await prisma.siteVisit.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes,
        photos: photos ? JSON.stringify(photos) : undefined,
      },
    });

    // Emit event
    await getEventBus().publish(
      EVENT_TYPES.VISIT_COMPLETED,
      { visitId: id, projectId: visit.projectId },
      'visit-scheduler'
    );

    return visit;
  });

  // Cancel/reschedule a visit
  fastify.post('/visits/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason, reschedule } = request.body as { reason: string; reschedule?: boolean };

    const visit = await prisma.siteVisit.update({
      where: { id },
      data: { status: 'CANCELLED', notes: reason },
    });

    if (reschedule) {
      // Queue rescheduling
      await queues.VISIT_SCHEDULER.add(
        'schedule-visit',
        {
          type: 'SCHEDULE_VISIT',
          request: {
            projectId: visit.projectId,
            pmId: visit.pmId,
            visitType: visit.type as any,
            duration: 60,
            priority: 'normal',
            notes: `Rescheduled from ${format(visit.scheduledAt, 'MMM d')}. Reason: ${reason}`,
          },
        },
        JOB_OPTIONS.DEFAULT
      );
    }

    return visit;
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  SmartScheduler,
  RouteOptimizer,
  AutoScheduler,
  ReminderService,
  PACKAGE_VISIT_RULES,
};
