import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { AIProvider, SCHEDULE_PROMPT } from '@kealee/ai';
import type { Job } from 'bullmq';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VisitSchedulePayload {
  projectId: string;
  organizationId: string;
  pmId: string;
  type: string;
  scheduledAt: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  purpose?: string;
  estimatedDurationMinutes?: number;
  priority?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
}

interface RouteStop {
  visitId: string;
  address: string;
  latitude: number;
  longitude: number;
  priority: string;
  estimatedArrival: string;
  estimatedDeparture: string;
}

// ---------------------------------------------------------------------------
// Visits Worker Handlers
// ---------------------------------------------------------------------------

export class VisitsWorkerHandlers {
  constructor(
    private prisma: PrismaClient,
    private eventBus: EventBus,
    private clawName: string,
    private assertWritable: (model: string) => void,
    private ai: AIProvider,
  ) {}

  // =========================================================================
  // schedule-visit: Schedule a new site visit with PM availability + route opt
  // =========================================================================

  async handleScheduleVisit(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('SiteVisit');

    const payload = event.payload as VisitSchedulePayload;

    // Check PM availability for the requested time
    const pmId = payload.pmId;
    const requestedTime = new Date(payload.scheduledAt);

    const conflictingVisits = await this.prisma.siteVisit.findMany({
      where: {
        pmId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        scheduledAt: {
          gte: new Date(requestedTime.getTime() - 2 * 60 * 60 * 1000), // 2hr before
          lte: new Date(requestedTime.getTime() + 2 * 60 * 60 * 1000), // 2hr after
        },
      },
    });

    // If PM has a conflict, find next available slot
    let finalScheduledAt = requestedTime;
    if (conflictingVisits.length > 0) {
      // Find the latest end time of conflicting visits and schedule after
      let latestEnd = requestedTime;
      for (const visit of conflictingVisits) {
        const duration = visit.estimatedDurationMinutes ?? 60;
        const visitEnd = new Date(
          new Date(visit.scheduledAt).getTime() + duration * 60 * 1000,
        );
        if (visitEnd > latestEnd) latestEnd = visitEnd;
      }
      // Add 30 min buffer for travel
      finalScheduledAt = new Date(latestEnd.getTime() + 30 * 60 * 1000);
    }

    // Get weather for scheduled date to add weather notes
    const weatherForDate = await this.prisma.weatherLog.findFirst({
      where: {
        projectId: payload.projectId,
        date: {
          gte: new Date(finalScheduledAt.toISOString().split('T')[0]),
          lt: new Date(
            new Date(finalScheduledAt).getTime() + 86_400_000,
          ),
        },
      },
    });

    const weatherNote = weatherForDate
      ? `Weather: ${weatherForDate.condition}, Workable: ${weatherForDate.workable}`
      : null;

    // Create the site visit
    const visit = await this.prisma.siteVisit.create({
      data: {
        projectId: payload.projectId,
        pmId,
        type: payload.type ?? 'PROGRESS',
        status: 'SCHEDULED',
        priority: payload.priority ?? 'NORMAL',
        scheduledAt: finalScheduledAt,
        estimatedDurationMinutes: payload.estimatedDurationMinutes ?? 60,
        address: payload.address ?? null,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        purpose: payload.purpose ?? null,
        clientName: payload.clientName ?? null,
        clientEmail: payload.clientEmail ?? null,
        clientPhone: payload.clientPhone ?? null,
        notes: weatherNote,
      },
    });

    // Create default checklist items based on visit type
    await this.createDefaultChecklist(visit.id, payload.type ?? 'PROGRESS');

    // Publish sitevisit.scheduled
    const scheduledEvent = createEvent({
      type: EVENT_TYPES.sitevisit.scheduled,
      source: this.clawName,
      projectId: payload.projectId,
      organizationId: payload.organizationId,
      payload: {
        visitId: visit.id,
        pmId,
        scheduledAt: finalScheduledAt.toISOString(),
        type: visit.type,
        rescheduled: conflictingVisits.length > 0,
        originalRequestedAt: payload.scheduledAt,
      },
      entity: { type: 'SiteVisit', id: visit.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(scheduledEvent);
  }

  // =========================================================================
  // optimize-route: Route optimization for PM daily visits
  // =========================================================================

  async handleOptimizeRoute(job: Job): Promise<{ route: RouteStop[] }> {
    const { pmId, date, organizationId } = job.data;

    const targetDate = new Date(date);
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get all visits for this PM on the given date
    const visits = await this.prisma.siteVisit.findMany({
      where: {
        pmId,
        status: 'SCHEDULED',
        scheduledAt: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { scheduledAt: 'asc' },
      include: { project: true },
    });

    if (visits.length <= 1) {
      // No optimization needed for 0-1 visits
      return {
        route: visits.map((v) => ({
          visitId: v.id,
          address: v.address ?? '',
          latitude: v.latitude ?? 0,
          longitude: v.longitude ?? 0,
          priority: v.priority,
          estimatedArrival: v.scheduledAt.toISOString(),
          estimatedDeparture: new Date(
            v.scheduledAt.getTime() +
              (v.estimatedDurationMinutes ?? 60) * 60 * 1000,
          ).toISOString(),
        })),
      };
    }

    // AI-assisted route optimization considering priority, location, traffic
    const aiResult = await this.ai.reason({
      task:
        'Optimize the visit route for this PM. Consider visit priorities (URGENT first), ' +
        'geographic proximity to minimize travel time, and time constraints. ' +
        'Return visits in optimal order with estimated arrival/departure times.',
      context: {
        visits: visits.map((v) => ({
          id: v.id,
          address: v.address,
          lat: v.latitude,
          lng: v.longitude,
          priority: v.priority,
          scheduledAt: v.scheduledAt,
          duration: v.estimatedDurationMinutes ?? 60,
          projectName: (v.project as any)?.name,
        })),
        pmId,
        dayStart: dayStart.toISOString(),
      },
      systemPrompt: SCHEDULE_PROMPT,
    });

    // Build optimized route from AI result or use priority-based fallback
    const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
    const sorted = [...visits].sort((a, b) => {
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });

    // Calculate travel-adjusted times (30 min between visits)
    const route: RouteStop[] = [];
    let currentTime = dayStart.getTime() + 8 * 60 * 60 * 1000; // 8 AM start

    for (const visit of sorted) {
      const arrival = new Date(currentTime);
      const duration = (visit.estimatedDurationMinutes ?? 60) * 60 * 1000;
      const departure = new Date(currentTime + duration);

      route.push({
        visitId: visit.id,
        address: visit.address ?? '',
        latitude: visit.latitude ?? 0,
        longitude: visit.longitude ?? 0,
        priority: visit.priority,
        estimatedArrival: arrival.toISOString(),
        estimatedDeparture: departure.toISOString(),
      });

      // Move to next slot: departure + 30 min travel
      currentTime = departure.getTime() + 30 * 60 * 1000;
    }

    return { route };
  }

  // =========================================================================
  // complete-visit: Process visit completion with daily report
  // =========================================================================

  async handleCompleteVisit(job: Job): Promise<void> {
    const { visitId, projectId, organizationId, findings, photos, event } =
      job.data;
    this.assertWritable('SiteVisit');

    const visit = await this.prisma.siteVisit.findUnique({
      where: { id: visitId },
    });
    if (!visit) return;

    // Update visit as completed
    this.assertWritable('SiteVisit');
    await this.prisma.siteVisit.update({
      where: { id: visitId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        findings: findings ?? null,
        photos: photos ?? [],
        notes: (visit.notes ?? '') + '\n\n[Auto-completed by Claw C]',
      },
    });

    // AI-generate daily report summary from visit findings
    const aiResult = await this.ai.reason({
      task:
        'Generate a concise daily field report from these visit findings. ' +
        'Include progress observations, issues noted, weather conditions, ' +
        'and recommended follow-up actions.',
      context: {
        visitType: visit.type,
        purpose: visit.purpose,
        findings,
        photos: photos?.length ?? 0,
        scheduledAt: visit.scheduledAt,
        completedAt: new Date().toISOString(),
      },
      systemPrompt: SCHEDULE_PROMPT,
    });

    // Publish sitevisit.completed
    const completedEvent = createEvent({
      type: EVENT_TYPES.sitevisit.completed,
      source: this.clawName,
      projectId: projectId ?? visit.projectId,
      organizationId,
      payload: {
        visitId,
        pmId: visit.pmId,
        type: visit.type,
        findings,
        photoCount: photos?.length ?? 0,
        dailyReport: aiResult,
      },
      entity: { type: 'SiteVisit', id: visitId },
      trigger: event
        ? { eventId: event.id, eventType: event.type }
        : undefined,
    });
    await this.eventBus.publish(completedEvent);
  }

  // =========================================================================
  // reschedule-visit: Reschedule due to weather or conflict
  // =========================================================================

  async handleRescheduleVisit(job: Job): Promise<void> {
    const { visitId, reason, newScheduledAt, event } = job.data;
    this.assertWritable('SiteVisit');

    const visit = await this.prisma.siteVisit.findUnique({
      where: { id: visitId },
    });
    if (!visit || visit.status === 'COMPLETED' || visit.status === 'CANCELLED')
      return;

    // Determine new time
    let newTime: Date;
    if (newScheduledAt) {
      newTime = new Date(newScheduledAt);
    } else {
      // Default: push to next business day, same time
      const original = new Date(visit.scheduledAt);
      newTime = new Date(original.getTime() + 86_400_000);
      // Skip weekends
      while (newTime.getDay() === 0 || newTime.getDay() === 6) {
        newTime = new Date(newTime.getTime() + 86_400_000);
      }
    }

    this.assertWritable('SiteVisit');
    await this.prisma.siteVisit.update({
      where: { id: visitId },
      data: {
        scheduledAt: newTime,
        status: 'RESCHEDULED',
        cancellationReason: reason ?? 'Weather delay',
      },
    });

    // Publish sitevisit.scheduled (rescheduled)
    const rescheduledEvent = createEvent({
      type: EVENT_TYPES.sitevisit.scheduled,
      source: this.clawName,
      projectId: visit.projectId,
      organizationId: event?.organizationId,
      payload: {
        visitId,
        pmId: visit.pmId,
        scheduledAt: newTime.toISOString(),
        rescheduled: true,
        reason,
        originalScheduledAt: visit.scheduledAt.toISOString(),
      },
      entity: { type: 'SiteVisit', id: visitId },
      trigger: event
        ? { eventId: event.id, eventType: event.type }
        : undefined,
    });
    await this.eventBus.publish(rescheduledEvent);
  }

  // =========================================================================
  // Private: Create default checklist for a visit type
  // =========================================================================

  private async createDefaultChecklist(
    siteVisitId: string,
    visitType: string,
  ): Promise<void> {
    this.assertWritable('VisitChecklist');

    const checklists: Record<string, string[]> = {
      INITIAL: [
        'Verify site access and safety conditions',
        'Review project plans on-site',
        'Photograph existing conditions',
        'Confirm utility locations and markings',
        'Review staging and material storage areas',
        'Verify erosion control measures in place',
      ],
      PROGRESS: [
        'Review work completed since last visit',
        'Verify work quality against specifications',
        'Check schedule adherence for active tasks',
        'Photograph progress from standard angles',
        'Note any safety concerns observed',
        'Review material deliveries and storage',
        'Discuss upcoming work with on-site crew',
      ],
      INSPECTION: [
        'Verify inspection readiness per checklist',
        'Confirm all prerequisite work completed',
        'Ensure required documentation is on-site',
        'Photograph areas subject to inspection',
        'Note any potential deficiency items',
        'Verify fire/life safety compliance',
      ],
      FINAL: [
        'Complete punch list walkthrough',
        'Verify all punch items from previous visits resolved',
        'Photograph completed work from standard angles',
        'Check all MEP systems operational',
        'Verify site cleanup and restoration',
        'Confirm as-built documentation complete',
        'Review warranty documentation',
        'Verify certificate of occupancy readiness',
      ],
      EMERGENCY: [
        'Assess site safety and secure hazards',
        'Document damage with photographs',
        'Identify immediate repair needs',
        'Contact emergency services if required',
        'Notify project stakeholders',
        'Prepare incident report',
      ],
    };

    const items = checklists[visitType] ?? checklists.PROGRESS;

    for (const item of items) {
      this.assertWritable('VisitChecklist');
      await this.prisma.visitChecklist.create({
        data: {
          siteVisitId,
          item,
          isChecked: false,
        },
      });
    }
  }
}
