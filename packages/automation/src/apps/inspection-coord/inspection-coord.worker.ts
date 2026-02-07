import { PrismaClient } from '@prisma/client';
import type { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { InspectionCoordinatorService } from './inspection-coord.service.js';

const prisma = new PrismaClient();
const service = new InspectionCoordinatorService();
const SOURCE_APP = 'APP-06';

interface ScheduleInspectionPayload {
  projectId: string;
  type: string;
  permitId: string;
  milestoneId?: string;
  requestedBy: string;
  leadTimeDays?: number;
}

interface RecordResultPayload {
  inspectionId: string;
  result: 'PASS' | 'PASS_WITH_COMMENTS' | 'FAIL' | 'PARTIAL_PASS';
  notes?: string;
  corrections?: Array<{ description: string; severity: string }>;
  photos?: string[];
}

interface CheckUpcomingPayload {
  hoursAhead?: number;
}

type InspectionPayload =
  | ScheduleInspectionPayload
  | RecordResultPayload
  | CheckUpcomingPayload;

async function processor(job: Job<InspectionPayload>): Promise<any> {
  const task = await prisma.automationTask.create({
    data: {
      type: `inspection-coord:${job.name}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      payload: job.data as any,
      startedAt: new Date(),
    },
  });

  try {
    let result: any;

    switch (job.name) {
      case 'schedule-inspection': {
        const payload = job.data as ScheduleInspectionPayload;
        const inspectionId = await service.scheduleInspection(
          payload.projectId,
          {
            type: payload.type as any,
            permitId: payload.permitId,
            milestoneId: payload.milestoneId,
            requestedBy: payload.requestedBy,
            leadTimeDays: payload.leadTimeDays,
          },
        );
        result = { inspectionId };
        break;
      }

      case 'record-result': {
        const payload = job.data as RecordResultPayload;
        await service.recordResult(payload.inspectionId, {
          result: payload.result,
          notes: payload.notes,
          corrections: payload.corrections,
          photos: payload.photos,
        });
        result = { inspectionId: payload.inspectionId, recorded: true };
        break;
      }

      case 'check-upcoming': {
        const payload = job.data as CheckUpcomingPayload;
        const inspections = await service.getInspectionsDueSoon(
          payload.hoursAhead ?? 48,
        );

        // Send reminders for each upcoming inspection
        for (const inspection of inspections) {
          await eventBus.publish(
            EVENT_TYPES.INSPECTION_SCHEDULED,
            {
              inspectionId: inspection.id,
              projectId: inspection.projectId,
              type: inspection.inspectionType,
              scheduledDate: inspection.scheduledDate?.toISOString(),
              reminder: true,
            },
            SOURCE_APP,
            { projectId: inspection.projectId },
          );
        }

        result = { checked: inspections.length, reminders: inspections.length };
        break;
      }

      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }

    await prisma.automationTask.update({
      where: { id: task.id },
      data: { status: 'COMPLETED', result: result ?? {}, completedAt: new Date() },
    });

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.automationTask.update({
      where: { id: task.id },
      data: { status: 'FAILED', error: message, completedAt: new Date() },
    });
    throw err;
  }
}

export const inspectionCoordWorker = createWorker<InspectionPayload>(
  QUEUE_NAMES.INSPECTION,
  processor,
  { concurrency: 3 },
);
