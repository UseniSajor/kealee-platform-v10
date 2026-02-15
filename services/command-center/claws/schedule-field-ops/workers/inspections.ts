import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';
import type { Job } from 'bullmq';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Reminder lead times in milliseconds */
const REMINDER_48HR = 48 * 60 * 60 * 1000;
const REMINDER_24HR = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Inspections Worker Handlers
// ---------------------------------------------------------------------------

/**
 * Inspection timing coordination for Claw C (Schedule & Field Ops).
 *
 * GUARDRAIL: This worker CANNOT approve or fail inspections.
 * Pass/fail determination is owned exclusively by Claw E (Permits & Compliance).
 * This worker only handles scheduling coordination, timing, and reminders.
 */
export class InspectionsWorkerHandlers {
  constructor(
    private prisma: PrismaClient,
    private eventBus: EventBus,
    private clawName: string,
    private assertWritable: (model: string) => void,
  ) {}

  // =========================================================================
  // coordinate-inspection-timing: Align inspection with schedule + permits
  // =========================================================================

  async handleCoordinateInspectionTiming(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };

    // GUARDRAIL: We do NOT write to Inspection model. Claw E owns that.
    // We only coordinate by scheduling site visits and updating our schedule items.
    this.assertWritable('SiteVisit');

    const payload = event.payload as Record<string, any>;
    const projectId = event.projectId;
    const inspectionId = payload.inspectionId;

    if (!inspectionId) return;

    // Read the inspection details (read-only, no writes to Inspection)
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: { permit: true },
    });

    if (!inspection) return;

    // Find the related schedule items that must be complete before inspection
    const prerequisiteTasks = await this.prisma.scheduleItem.findMany({
      where: {
        projectId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        // Look for tasks whose trade matches the inspection type
        trade: { not: null },
      },
      orderBy: { endDate: 'asc' },
    });

    // Determine the earliest the inspection can happen:
    // After all prerequisite tasks in the same phase are complete
    const phaseRequired = (inspection as any).phaseRequired;
    const relatedTasks = phaseRequired
      ? prerequisiteTasks.filter((t) => {
          const taskTrade = (t.trade ?? '').toUpperCase();
          return (
            taskTrade.includes(phaseRequired.toUpperCase()) ||
            phaseRequired.toUpperCase().includes(taskTrade)
          );
        })
      : [];

    // Find latest completion date of related tasks
    let earliestInspectionDate = inspection.requestedDate
      ? new Date(inspection.requestedDate)
      : new Date();

    for (const task of relatedTasks) {
      const taskEnd = new Date(task.endDate);
      if (taskEnd > earliestInspectionDate) {
        earliestInspectionDate = taskEnd;
      }
    }

    // Add 1 business day buffer after last prerequisite task
    earliestInspectionDate = this.addBusinessDays(earliestInspectionDate, 1);

    // Schedule a preparation site visit 1 day before the inspection
    const prepVisitDate = this.addBusinessDays(earliestInspectionDate, -1);

    // Get PM from project
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    const pmId = (project as any)?.managerId ?? (project as any)?.ownerId;

    if (pmId) {
      this.assertWritable('SiteVisit');
      const prepVisit = await this.prisma.siteVisit.create({
        data: {
          projectId,
          pmId,
          type: 'INSPECTION',
          status: 'SCHEDULED',
          priority: 'HIGH',
          scheduledAt: prepVisitDate,
          estimatedDurationMinutes: 60,
          purpose: `Pre-inspection preparation for ${(inspection as any).inspectionType ?? 'scheduled'} inspection. ` +
            `Verify readiness and address any outstanding items before inspector arrival.`,
          notes: `Related inspection: ${inspectionId}. Permit: ${inspection.permitId}.`,
        },
      });

      // Create checklist for the prep visit
      this.assertWritable('VisitChecklist');
      const prepItems = [
        'Verify all prerequisite work is complete per inspection requirements',
        'Ensure all required documentation is on-site and accessible',
        'Clear access paths for inspector',
        'Confirm fire/life safety items are compliant',
        'Photograph areas subject to inspection for pre-inspection record',
        'Review and confirm inspection checklist items with on-site crew',
        'Ensure required test reports and certifications are available',
      ];

      for (const item of prepItems) {
        this.assertWritable('VisitChecklist');
        await this.prisma.visitChecklist.create({
          data: {
            siteVisitId: prepVisit.id,
            item,
            isChecked: false,
          },
        });
      }

      // Publish sitevisit.scheduled for prep visit
      const visitEvent = createEvent({
        type: EVENT_TYPES.sitevisit.scheduled,
        source: this.clawName,
        projectId,
        organizationId: event.organizationId,
        payload: {
          visitId: prepVisit.id,
          pmId,
          scheduledAt: prepVisitDate.toISOString(),
          type: 'INSPECTION',
          relatedInspectionId: inspectionId,
        },
        entity: { type: 'SiteVisit', id: prepVisit.id },
        trigger: { eventId: event.id, eventType: event.type },
      });
      await this.eventBus.publish(visitEvent);
    }

    // Queue 48-hour and 24-hour reminders
    const queue = createQueue(KEALEE_QUEUES.SMART_SCHEDULER);
    const inspectionDate = inspection.scheduledDate
      ? new Date(inspection.scheduledDate)
      : earliestInspectionDate;

    const now = Date.now();
    const reminder48Delay = inspectionDate.getTime() - REMINDER_48HR - now;
    const reminder24Delay = inspectionDate.getTime() - REMINDER_24HR - now;

    if (reminder48Delay > 0) {
      await queue.add(
        'inspection-reminder',
        {
          inspectionId,
          projectId,
          organizationId: event.organizationId,
          reminderType: '48HR',
          inspectionDate: inspectionDate.toISOString(),
          event,
        },
        { delay: reminder48Delay },
      );
    }

    if (reminder24Delay > 0) {
      await queue.add(
        'inspection-reminder',
        {
          inspectionId,
          projectId,
          organizationId: event.organizationId,
          reminderType: '24HR',
          inspectionDate: inspectionDate.toISOString(),
          event,
        },
        { delay: reminder24Delay },
      );
    }
  }

  // =========================================================================
  // inspection-reminder: Send 48hr and 24hr reminders before inspection
  // =========================================================================

  async handleInspectionReminder(job: Job): Promise<void> {
    // GUARDRAIL: We do NOT write to Inspection. We only publish reminder events.

    const {
      inspectionId,
      projectId,
      organizationId,
      reminderType,
      inspectionDate,
      event,
    } = job.data;

    // Verify the inspection hasn't been cancelled or already completed
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
    });

    if (!inspection) return;

    const result = (inspection as any).result;
    if (result === 'PASS' || result === 'FAIL' || result === 'CANCELLED') {
      // Inspection already resolved, skip reminder
      return;
    }

    // Check if prerequisite schedule items are on track
    const projectTasks = await this.prisma.scheduleItem.findMany({
      where: {
        projectId,
        status: { in: ['PENDING', 'IN_PROGRESS', 'DELAYED'] },
        endDate: { lte: new Date(inspectionDate) },
      },
    });

    const delayedTasks = projectTasks.filter(
      (t) => t.status === 'DELAYED' || t.status === 'IN_PROGRESS',
    );

    const readiness = delayedTasks.length === 0 ? 'READY' : 'AT_RISK';

    // Publish reminder event (consumed by Docs/Communication Claw F for notification)
    const reminderEvent = createEvent({
      type: EVENT_TYPES.inspection.reminder,
      source: this.clawName,
      projectId,
      organizationId,
      payload: {
        inspectionId,
        reminderType, // '48HR' or '24HR'
        inspectionDate,
        readiness,
        delayedPrerequisites: delayedTasks.map((t) => ({
          taskId: t.id,
          taskName: t.taskName,
          status: t.status,
          endDate: t.endDate,
        })),
        inspectionType: (inspection as any).inspectionType,
        permitId: inspection.permitId,
      },
      trigger: event
        ? { eventId: event.id, eventType: event.type }
        : undefined,
    });
    await this.eventBus.publish(reminderEvent);
  }

  // =========================================================================
  // check-inspection-prerequisites: Verify schedule readiness for inspection
  // =========================================================================

  async handleCheckPrerequisites(job: Job): Promise<{
    ready: boolean;
    blockers: string[];
  }> {
    const { inspectionId, projectId } = job.data;

    // Read inspection (no writes)
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
    });

    if (!inspection) return { ready: false, blockers: ['Inspection not found'] };

    const phaseRequired = (inspection as any).phaseRequired;
    const blockers: string[] = [];

    // Check if all prerequisite schedule items are complete
    if (phaseRequired) {
      const incompleteTasks = await this.prisma.scheduleItem.findMany({
        where: {
          projectId,
          status: { not: 'COMPLETED' },
          trade: { not: null },
        },
      });

      const blockingTasks = incompleteTasks.filter((t) => {
        const taskTrade = (t.trade ?? '').toUpperCase();
        return (
          taskTrade.includes(phaseRequired.toUpperCase()) ||
          phaseRequired.toUpperCase().includes(taskTrade)
        );
      });

      for (const task of blockingTasks) {
        blockers.push(
          `Task "${task.taskName}" (${task.trade}) is ${task.status} - must be COMPLETED before inspection`,
        );
      }
    }

    // Check if prep visit has been completed
    const prepVisits = await this.prisma.siteVisit.findMany({
      where: {
        projectId,
        type: 'INSPECTION',
        notes: { contains: inspectionId },
      },
    });

    const completedPrepVisit = prepVisits.find(
      (v) => v.status === 'COMPLETED',
    );
    if (!completedPrepVisit && prepVisits.length > 0) {
      blockers.push('Pre-inspection preparation visit has not been completed');
    }

    return {
      ready: blockers.length === 0,
      blockers,
    };
  }

  // =========================================================================
  // Private: Add business days to a date (skip weekends)
  // =========================================================================

  private addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let remaining = Math.abs(days);
    const direction = days >= 0 ? 1 : -1;

    while (remaining > 0) {
      result.setDate(result.getDate() + direction);
      // Skip Saturday (6) and Sunday (0)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        remaining--;
      }
    }

    return result;
  }
}
