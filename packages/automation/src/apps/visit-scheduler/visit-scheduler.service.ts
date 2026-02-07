import { PrismaClient } from '@prisma/client';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';

const prisma = new PrismaClient();
const SOURCE_APP = 'APP-02';

// Preferred visit days (0=Sunday ... 6=Saturday)
const PREFERRED_DAYS = [2, 3]; // Tuesday, Wednesday
const TIME_SLOTS = ['09:00', '11:00', '13:00', '15:00'];

/**
 * Get the next date that falls on one of the preferred days.
 */
function nextPreferredDay(from: Date): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 7; i++) {
    d.setDate(d.getDate() + 1);
    if (PREFERRED_DAYS.includes(d.getDay())) return d;
  }
  // Fallback: next day
  d.setDate(d.getDate() + 1);
  return d;
}

/**
 * Get the next business day at least `minDays` from `from`.
 */
function nextBusinessDay(from: Date, minDays: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < minDays) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  d.setHours(9, 0, 0, 0);
  return d;
}

/**
 * Return the Monday 00:00 and Sunday 23:59 of the week containing `date`.
 */
function weekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

interface VisitLocation {
  visitId: string;
  lat: number;
  lng: number;
}

/**
 * Sort locations by nearest-neighbour from a starting point.
 */
function sortByProximity(locations: VisitLocation[]): VisitLocation[] {
  if (locations.length <= 1) return locations;
  const remaining = [...locations];
  const sorted: VisitLocation[] = [];
  let current = remaining.shift()!;
  sorted.push(current);

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const dx = remaining[i].lat - current.lat;
      const dy = remaining[i].lng - current.lng;
      const dist = dx * dx + dy * dy;
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }
    current = remaining.splice(nearestIdx, 1)[0];
    sorted.push(current);
  }
  return sorted;
}

export class VisitSchedulerService {
  // -----------------------------------------------------------------------
  // scheduleWeeklyVisits
  // -----------------------------------------------------------------------

  async scheduleWeeklyVisits(pmId: string): Promise<string[]> {
    // Get all active projects for this PM
    const pmAssignments = await prisma.projectManager.findMany({
      where: { userId: pmId, removedAt: null },
      include: { project: true },
    });

    const activeProjects = pmAssignments
      .filter((a) => a.project.status === 'ACTIVE')
      .map((a) => a.project);

    if (activeProjects.length === 0) return [];

    const now = new Date();
    const { start: weekStart, end: weekEnd } = weekBounds(now);
    const createdVisitIds: string[] = [];

    // Check which projects already have a visit this week
    const existingVisits = await prisma.siteVisit.findMany({
      where: {
        pmId,
        scheduledAt: { gte: weekStart, lte: weekEnd },
        status: { in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] },
      },
    });

    const projectsWithVisit = new Set(existingVisits.map((v) => v.projectId));

    const projectsNeedingVisit = activeProjects.filter(
      (p) => !projectsWithVisit.has(p.id),
    );

    if (projectsNeedingVisit.length === 0) return [];

    // Pick the next preferred day
    const visitDate = nextPreferredDay(now);

    // Create visits and collect locations for route optimization
    const locations: VisitLocation[] = [];

    for (const project of projectsNeedingVisit) {
      const visit = await prisma.siteVisit.create({
        data: {
          projectId: project.id,
          pmId,
          type: 'weekly',
          status: 'SCHEDULED',
          scheduledAt: visitDate,
          address: project.address ?? undefined,
          latitude: project.latitude ?? undefined,
          longitude: project.longitude ?? undefined,
          estimatedDurationMinutes: 60,
        },
      });

      createdVisitIds.push(visit.id);

      if (project.latitude && project.longitude) {
        locations.push({
          visitId: visit.id,
          lat: project.latitude,
          lng: project.longitude,
        });
      }
    }

    // Optimize route and assign time slots
    const sorted = sortByProximity(locations);
    for (let i = 0; i < sorted.length; i++) {
      const slot = TIME_SLOTS[i % TIME_SLOTS.length];
      const [hours, minutes] = slot.split(':').map(Number);
      const scheduledAt = new Date(visitDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      await prisma.siteVisit.update({
        where: { id: sorted[i].visitId },
        data: { scheduledAt },
      });
    }

    // Publish events
    for (const visitId of createdVisitIds) {
      await eventBus.publish(
        EVENT_TYPES.INSPECTION_SCHEDULED,
        { visitId, type: 'weekly', pmId },
        SOURCE_APP,
      );
    }

    return createdVisitIds;
  }

  // -----------------------------------------------------------------------
  // scheduleMilestoneVisit
  // -----------------------------------------------------------------------

  async scheduleMilestoneVisit(
    projectId: string,
    milestoneId: string,
  ): Promise<string> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    const scheduledAt = nextBusinessDay(new Date(), 2);

    const visit = await prisma.siteVisit.create({
      data: {
        projectId,
        pmId: project.pmId ?? '',
        type: 'milestone',
        status: 'SCHEDULED',
        scheduledAt,
        address: project.address ?? undefined,
        latitude: project.latitude ?? undefined,
        longitude: project.longitude ?? undefined,
        purpose: `Milestone verification: ${milestoneId}`,
        estimatedDurationMinutes: 90,
      },
    });

    await eventBus.publish(
      EVENT_TYPES.INSPECTION_SCHEDULED,
      { visitId: visit.id, type: 'milestone', milestoneId, projectId },
      SOURCE_APP,
      { projectId },
    );

    return visit.id;
  }

  // -----------------------------------------------------------------------
  // scheduleClientWalkthrough
  // -----------------------------------------------------------------------

  async scheduleClientWalkthrough(
    projectId: string,
    requestedDate?: Date,
  ): Promise<string> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { client: true },
    });

    const scheduledAt = requestedDate ?? nextBusinessDay(new Date(), 3);
    scheduledAt.setHours(10, 0, 0, 0);

    const visit = await prisma.siteVisit.create({
      data: {
        projectId,
        pmId: project.pmId ?? '',
        type: 'client_walkthrough',
        status: 'SCHEDULED',
        scheduledAt,
        address: project.address ?? undefined,
        latitude: project.latitude ?? undefined,
        longitude: project.longitude ?? undefined,
        purpose: 'Client walkthrough',
        clientName: project.client?.name ?? undefined,
        clientEmail: project.client?.email ?? undefined,
        clientPhone: project.client?.phone ?? undefined,
        estimatedDurationMinutes: 120,
      },
    });

    await eventBus.publish(
      EVENT_TYPES.INSPECTION_SCHEDULED,
      { visitId: visit.id, type: 'client_walkthrough', projectId },
      SOURCE_APP,
      { projectId },
    );

    return visit.id;
  }

  // -----------------------------------------------------------------------
  // completeVisit
  // -----------------------------------------------------------------------

  async completeVisit(
    visitId: string,
    data: { notes?: string; photos?: string[]; checklist?: Record<string, any> },
  ): Promise<void> {
    const visit = await prisma.siteVisit.update({
      where: { id: visitId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: data.notes,
        photos: data.photos ?? [],
        checklistData: data.checklist ?? undefined,
      },
    });

    // Trigger QA analysis for each photo
    if (data.photos && data.photos.length > 0) {
      for (const photoUrl of data.photos) {
        await eventBus.publish(
          EVENT_TYPES.SITE_PHOTO_UPLOADED,
          { visitId, projectId: visit.projectId, photoUrl },
          SOURCE_APP,
          { projectId: visit.projectId },
        );
      }
    }

    await eventBus.publish(
      EVENT_TYPES.TASK_COMPLETED,
      { visitId, type: visit.type, projectId: visit.projectId },
      SOURCE_APP,
      { projectId: visit.projectId },
    );
  }
}
