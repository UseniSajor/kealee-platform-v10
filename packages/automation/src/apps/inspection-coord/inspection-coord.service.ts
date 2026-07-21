import { PrismaClient } from '@prisma/client';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';

const prisma = new PrismaClient();
const SOURCE_APP = 'APP-06';

// Default lead time for jurisdictions (business days)
const DEFAULT_LEAD_TIME_DAYS = 3;

/**
 * Get the next business day at least `minDays` business days from `from`.
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

export class InspectionCoordinatorService {
  // -----------------------------------------------------------------------
  // scheduleInspection
  // -----------------------------------------------------------------------

  async scheduleInspection(
    projectId: string,
    opts: {
      type: 'SITE' | 'FOOTING' | 'FOUNDATION' | 'SLAB' | 'ROUGH_FRAMING' |
        'ROUGH_ELECTRICAL' | 'ROUGH_PLUMBING' | 'ROUGH_MECHANICAL' |
        'INSULATION' | 'FINAL_ELECTRICAL' | 'FINAL_PLUMBING' |
        'FINAL_MECHANICAL' | 'FINAL_BUILDING';
      permitId: string;
      milestoneId?: string;
      requestedBy: string;
      leadTimeDays?: number;
    },
  ): Promise<string> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    // Look up the permit to get jurisdiction info
    const permit = await prisma.permit.findUniqueOrThrow({
      where: { id: opts.permitId },
    });

    const leadTime = opts.leadTimeDays ?? DEFAULT_LEAD_TIME_DAYS;
    const requestedDate = nextBusinessDay(new Date(), leadTime);

    const inspection = await prisma.inspection.create({
      data: {
        permitId: opts.permitId,
        projectId,
        jurisdictionId: permit.jurisdictionId,
        inspectionType: opts.type,
        requestedDate,
        requestedBy: opts.requestedBy,
        scheduledDate: requestedDate,
      },
    });

    // Track with AutomationTask
    await prisma.automationTask.create({
      data: {
        type: 'inspection-coord:schedule',
        status: 'COMPLETED',
        sourceApp: SOURCE_APP,
        projectId,
        payload: {
          inspectionId: inspection.id,
          type: opts.type,
          permitId: opts.permitId,
          milestoneId: opts.milestoneId,
        },
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // Publish event
    await eventBus.publish(
      EVENT_TYPES.INSPECTION_SCHEDULED,
      {
        inspectionId: inspection.id,
        type: opts.type,
        projectId,
        permitId: opts.permitId,
        scheduledDate: requestedDate.toISOString(),
      },
      SOURCE_APP,
      { projectId },
    );

    return inspection.id;
  }

  // -----------------------------------------------------------------------
  // recordResult
  // -----------------------------------------------------------------------

  async recordResult(
    inspectionId: string,
    data: {
      result: 'PASS' | 'PASS_WITH_COMMENTS' | 'FAIL' | 'PARTIAL_PASS';
      notes?: string;
      corrections?: Array<{ description: string; severity: string }>;
      photos?: string[];
    },
  ): Promise<void> {
    const inspection = await prisma.inspection.findUniqueOrThrow({
      where: { id: inspectionId },
    });

    // Update inspection record
    await prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        result: data.result,
        inspectorNotes: data.notes,
        deficiencies: data.corrections ? (data.corrections as any) : undefined,
        sitePhotos: data.photos ?? [],
        completedAt: new Date(),
        failedItems: data.corrections?.length ?? 0,
        passedItems: data.result === 'PASS' || data.result === 'PASS_WITH_COMMENTS'
          ? 1 : 0,
      },
    });

    if (data.result === 'PASS' || data.result === 'PASS_WITH_COMMENTS') {
      // Inspection passed
      await eventBus.publish(
        EVENT_TYPES.INSPECTION_PASSED,
        {
          inspectionId,
          projectId: inspection.projectId,
          type: inspection.inspectionType,
          result: data.result,
        },
        SOURCE_APP,
        { projectId: inspection.projectId },
      );

      // If linked to a milestone, trigger payment release flow
      await eventBus.publish(
        EVENT_TYPES.MILESTONE_COMPLETED,
        {
          inspectionId,
          projectId: inspection.projectId,
          type: inspection.inspectionType,
          triggeredByInspection: true,
        },
        SOURCE_APP,
        { projectId: inspection.projectId },
      );
    } else {
      // Inspection failed
      await eventBus.publish(
        EVENT_TYPES.INSPECTION_FAILED,
        {
          inspectionId,
          projectId: inspection.projectId,
          type: inspection.inspectionType,
          corrections: data.corrections,
          correctionCount: data.corrections?.length ?? 0,
        },
        SOURCE_APP,
        { projectId: inspection.projectId },
      );

      // If significant corrections, suggest a change order
      const hasCritical = data.corrections?.some(
        (c) => c.severity === 'CRITICAL' || c.severity === 'HIGH',
      );
      if (hasCritical) {
        await eventBus.publish(
          EVENT_TYPES.CHANGE_ORDER_REQUESTED,
          {
            reason: 'inspection_failure',
            inspectionId,
            projectId: inspection.projectId,
            corrections: data.corrections,
          },
          SOURCE_APP,
          { projectId: inspection.projectId },
        );
      }
    }
  }

  // -----------------------------------------------------------------------
  // getUpcomingInspections
  // -----------------------------------------------------------------------

  async getUpcomingInspections(projectId: string) {
    return prisma.inspection.findMany({
      where: {
        projectId,
        completedAt: null,
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  // -----------------------------------------------------------------------
  // getInspectionsDueSoon (for reminder cron)
  // -----------------------------------------------------------------------

  async getInspectionsDueSoon(hoursAhead: number = 48) {
    const now = new Date();
    const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    return prisma.inspection.findMany({
      where: {
        scheduledDate: { gte: now, lte: cutoff },
        completedAt: null,
      },
      include: { project: true, permit: true },
      orderBy: { scheduledDate: 'asc' },
    });
  }
}
