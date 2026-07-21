import { PrismaClient } from '@prisma/client';
import type { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { ReportGeneratorService } from './report-generator.service.js';

const prisma = new PrismaClient();
const service = new ReportGeneratorService();
const SOURCE_APP = 'APP-04';

interface GenerateWeeklyPayload {
  projectId: string;
}

interface GenerateMilestonePayload {
  projectId: string;
  milestoneId: string;
}

interface GenerateCloseoutPayload {
  projectId: string;
}

interface SendReportPayload {
  reportId: string;
}

interface WeeklyCronPayload {
  // Empty — triggers reports for all active projects
}

type ReportGeneratorPayload =
  | GenerateWeeklyPayload
  | GenerateMilestonePayload
  | GenerateCloseoutPayload
  | SendReportPayload
  | WeeklyCronPayload;

async function processor(job: Job<ReportGeneratorPayload>): Promise<any> {
  const task = await prisma.automationTask.create({
    data: {
      type: `report-generator:${job.name}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      payload: job.data as any,
      startedAt: new Date(),
    },
  });

  try {
    let result: any;

    switch (job.name) {
      case 'generate-weekly': {
        const payload = job.data as GenerateWeeklyPayload;
        const reportId = await service.generateWeeklyReport(payload.projectId);
        result = { reportId };
        break;
      }

      case 'generate-milestone': {
        const payload = job.data as GenerateMilestonePayload;
        const reportId = await service.generateMilestoneReport(
          payload.projectId,
          payload.milestoneId,
        );
        result = { reportId };
        break;
      }

      case 'generate-closeout': {
        const payload = job.data as GenerateCloseoutPayload;
        const reportId = await service.generateCloseoutPackage(payload.projectId);
        result = { reportId };
        break;
      }

      case 'send-report': {
        const payload = job.data as SendReportPayload;
        await service.sendReportToClient(payload.reportId);
        result = { reportId: payload.reportId, sent: true };
        break;
      }

      case 'weekly-cron': {
        const activeProjects = await prisma.project.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true },
        });

        const reportIds: string[] = [];
        for (const project of activeProjects) {
          try {
            const id = await service.generateWeeklyReport(project.id);
            reportIds.push(id);
          } catch (err) {
            console.error(
              `[ReportGenerator] Weekly report failed for ${project.id}:`,
              (err as Error).message,
            );
          }
        }

        result = {
          projectCount: activeProjects.length,
          reportsGenerated: reportIds.length,
        };
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

export const reportGeneratorWorker = createWorker<ReportGeneratorPayload>(
  QUEUE_NAMES.REPORT_GENERATOR,
  processor,
  { concurrency: 2 },
);
