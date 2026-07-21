/**
 * APP-04: REPORT GENERATOR
 * Automation Level: 95%
 *
 * Features:
 * - Daily/weekly/monthly/final report generation
 * - AI-written narratives
 * - Photo and data integration
 * - PDF generation
 * - Automated scheduling and delivery
 */

import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import {
  createWorker,
  queues,
  QUEUE_NAMES,
  JOB_OPTIONS,
  scheduleRecurringJob,
} from '../../../shared/queue.js';
import { getEventBus, EVENT_TYPES } from '../../../shared/events.js';
import { generateReportNarrative } from '../../../shared/ai/claude.js';
import { sendReport, sendEmail } from '../../../shared/integrations/email.js';
import { getReportPeriod, formatDate } from '../../../shared/utils/date.js';
import { formatCurrency, calculateBudgetSummary } from '../../../shared/utils/money.js';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { progressAnalysisService, ProgressAnalysisResult, AreaProgress } from '../../APP-13-qa-inspector/src/progress-analysis.js';
import { beforeAfterService, BeforeAfterPairResult } from '../../APP-13-qa-inspector/src/before-after.js';

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

export type ReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'FINAL' | 'VISIT';

export interface ReportConfig {
  projectId: string;
  type: ReportType;
  periodStart: Date;
  periodEnd: Date;
  includePhotos?: boolean;
  includeFinancials?: boolean;
  customSections?: string[];
}

export interface GeneratedReport {
  id: string;
  projectId: string;
  type: ReportType;
  periodStart: Date;
  periodEnd: Date;
  content: ReportContent;
  pdfUrl?: string;
  generatedAt: Date;
}

export interface ReportContent {
  projectName: string;
  reportType: ReportType;
  period: { start: string; end: string };
  executiveSummary: string;
  progress: {
    phase: string;
    percentComplete: number;
    milestonesCompleted: string[];
    milestonesUpcoming: string[];
  };
  schedule: {
    status: 'AHEAD' | 'ON_TRACK' | 'BEHIND';
    varianceDays: number;
    keyDates: Array<{ name: string; date: string; status: string }>;
  };
  budget: {
    totalBudget: number;
    spent: number;
    committed: number;
    remaining: number;
    variancePercent: number;
  };
  activities: Array<{
    date: string;
    description: string;
    category: string;
  }>;
  issues: Array<{
    description: string;
    severity: string;
    status: string;
    resolution?: string;
  }>;
  photos?: Array<{
    url: string;
    caption: string;
    date: string;
  }>;
  nextSteps: string[];
  narrative: string;

  // Enhanced QA visual progress sections
  visualProgress?: {
    overallProgressPercent: number;
    phaseDetected: string;
    areaBreakdown: Array<{
      area: string;
      progressPercent: number;
      currentPhase: string;
      isStalled: boolean;
      description: string;
    }>;
    stalledAreas: string[];
    highlights: string[];
    concerns: string[];
    comparisonSummary: string;
  };
  beforeAfterPairs?: Array<{
    area: string;
    beforePhotoUrl: string;
    afterPhotoUrl: string;
    beforeDate: string;
    afterDate: string;
    beforePhase: string;
    afterPhase: string;
    progressPercent: number;
    progressDescription: string;
  }>;
}

// ============================================================================
// REPORT GENERATOR SERVICE
// ============================================================================

class ReportGeneratorService {
  /**
   * Generate a report
   */
  async generateReport(config: ReportConfig): Promise<GeneratedReport> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: config.projectId },
      include: {
        client: true,
      },
    });

    // Gather report data
    const [activities, issues, budget, milestones, photos, visits, beforeAfterPairs] = await Promise.all([
      this.getActivities(config.projectId, config.periodStart, config.periodEnd),
      this.getIssues(config.projectId, config.periodStart, config.periodEnd),
      this.getBudgetData(config.projectId),
      this.getMilestones(config.projectId),
      config.includePhotos ? this.getPhotos(config.projectId, config.periodStart, config.periodEnd) : [],
      this.getVisits(config.projectId, config.periodStart, config.periodEnd),
      this.getBeforeAfterPairs(config.projectId),
    ]);

    // Get latest progress analysis from most recent completed visit
    const latestProgressAnalysis = await this.getLatestProgressAnalysis(config.projectId);

    // Calculate progress
    const progress = this.calculateProgress(project, milestones);

    // Calculate schedule status
    const schedule = this.calculateScheduleStatus(project, milestones as any);

    // Determine highlights and issues for narrative
    const highlights = [
      ...activities.slice(0, 3).map(a => a.description),
      ...(milestones as any[]).filter(m => m.status === 'COMPLETED').slice(0, 2).map(m => `Completed: ${m.name}`),
    ];

    const issueDescriptions = issues.filter(i => i.status !== 'RESOLVED').map(i => i.description);

    const nextSteps = [
      ...milestones.filter(m => m.status === 'PENDING').slice(0, 3).map(m => m.name),
    ];

    // Build enhanced highlights and concerns from visual progress analysis
    if (latestProgressAnalysis) {
      highlights.push(...latestProgressAnalysis.highlights);
      if (latestProgressAnalysis.stalledAreas.length > 0) {
        issueDescriptions.push(
          `Areas with no progress detected: ${latestProgressAnalysis.stalledAreas.join(', ')}`
        );
      }
    }

    // Generate AI narrative with enhanced visual progress data
    const narrativeInput: any = {
      projectName: project.name,
      periodStart: config.periodStart,
      periodEnd: config.periodEnd,
      reportType: config.type.toLowerCase() as 'daily' | 'weekly' | 'monthly' | 'final',
      progress: {
        phase: latestProgressAnalysis?.phaseDetected || progress.phase,
        percentComplete: latestProgressAnalysis?.overallProgressPercent || progress.percentComplete,
      },
      schedule: {
        status: schedule.status,
        varianceDays: schedule.varianceDays,
      },
      budget: {
        spent: budget.spent,
        remaining: budget.remaining,
        variancePercent: budget.variancePercent,
      },
      highlights,
      issues: issueDescriptions,
      nextSteps,
    };

    // Add visual progress context if available
    if (latestProgressAnalysis) {
      narrativeInput.visualProgress = {
        overallPercent: latestProgressAnalysis.overallProgressPercent,
        areaBreakdown: latestProgressAnalysis.areaBreakdown.map((a: AreaProgress) =>
          `${a.area}: ${a.progressPercent}% (${a.currentPhase})${a.isStalled ? ' [STALLED]' : ''}`
        ),
        stalledAreas: latestProgressAnalysis.stalledAreas,
        comparisonSummary: latestProgressAnalysis.comparisonSummary,
      };
    }

    if (beforeAfterPairs.length > 0) {
      narrativeInput.beforeAfterInsights = beforeAfterPairs.slice(0, 5).map((p: BeforeAfterPairResult) =>
        `${p.area}: ${p.beforePhase} → ${p.afterPhase} (${p.progressPercent}%)`
      );
    }

    const narrative = await generateReportNarrative(narrativeInput);

    // Build report content
    const content: ReportContent = {
      projectName: project.name,
      reportType: config.type,
      period: {
        start: formatDate(config.periodStart),
        end: formatDate(config.periodEnd),
      },
      executiveSummary: narrative.split('\n\n')[0] || narrative,
      progress,
      schedule,
      budget,
      activities: activities.map(a => ({
        date: formatDate(a.createdAt),
        description: a.description,
        category: a.category,
      })),
      issues: issues.map(i => ({
        description: i.description,
        severity: i.severity,
        status: i.status,
        resolution: i.resolution || undefined,
      })),
      photos: photos.map(p => ({
        url: p.url,
        caption: p.caption || '',
        date: formatDate(p.createdAt),
      })),
      nextSteps,
      narrative,

      // Enhanced visual progress sections
      visualProgress: latestProgressAnalysis ? {
        overallProgressPercent: latestProgressAnalysis.overallProgressPercent,
        phaseDetected: latestProgressAnalysis.phaseDetected,
        areaBreakdown: latestProgressAnalysis.areaBreakdown.map((a: AreaProgress) => ({
          area: a.area,
          progressPercent: a.progressPercent,
          currentPhase: a.currentPhase,
          isStalled: a.isStalled,
          description: a.description,
        })),
        stalledAreas: latestProgressAnalysis.stalledAreas,
        highlights: latestProgressAnalysis.highlights,
        concerns: latestProgressAnalysis.concerns,
        comparisonSummary: latestProgressAnalysis.comparisonSummary,
      } : undefined,

      beforeAfterPairs: beforeAfterPairs.length > 0 ? beforeAfterPairs.slice(0, 10).map((p: BeforeAfterPairResult) => ({
        area: p.area,
        beforePhotoUrl: p.beforePhotoUrl,
        afterPhotoUrl: p.afterPhotoUrl,
        beforeDate: p.beforeDate,
        afterDate: p.afterDate,
        beforePhase: p.beforePhase,
        afterPhase: p.afterPhase,
        progressPercent: p.progressPercent,
        progressDescription: p.progressDescription,
      })) : undefined,
    };

    // Save report
    const report = await prisma.report.create({
      data: {
        projectId: config.projectId,
        type: config.type,
        periodStart: config.periodStart,
        periodEnd: config.periodEnd,
        content: content as object,
        status: 'GENERATED',
        generatedAt: new Date(),
      } as any,
    });

    // Generate PDF (placeholder - would use pdfkit in real implementation)
    // const pdfUrl = await this.generatePDF(report.id, content);

    // Emit event
    await getEventBus('report-generator').publish(
      EVENT_TYPES.REPORT_GENERATED,
      {
        reportId: report.id,
        projectId: config.projectId,
        projectName: project.name,
        type: config.type,
      }
    );

    return {
      id: report.id,
      projectId: report.projectId,
      type: report.type as ReportType,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      content,
      generatedAt: report.generatedAt,
    };
  }

  /**
   * Send report to recipients
   */
  async sendReportToRecipients(
    reportId: string,
    recipients: string[]
  ): Promise<{ sent: number }> {
    const report = await prisma.report.findUniqueOrThrow({
      where: { id: reportId },
      include: { project: { include: { client: true } } },
    });

    const content = report.content as unknown as ReportContent;

    await sendReport({
      recipients,
      reportType: report.type.toLowerCase() as 'daily' | 'weekly' | 'monthly' | 'final',
      projectName: report.project.name,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      summary: content.executiveSummary,
    });

    // Update report status
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        recipients,
      } as any,
    });

    // Emit event
    await getEventBus('report-generator').publish(
      EVENT_TYPES.REPORT_SENT,
      {
        reportId,
        projectId: report.projectId,
        type: report.type,
        recipientCount: recipients.length,
      }
    );

    return { sent: recipients.length };
  }

  /**
   * Schedule recurring reports for a project
   */
  async scheduleRecurringReports(
    projectId: string,
    schedule: { weekly?: boolean; monthly?: boolean }
  ): Promise<void> {
    if (schedule.weekly) {
      await scheduleRecurringJob(
        'REPORT_GENERATOR',
        'weekly-report',
        {
          type: 'GENERATE_SCHEDULED_REPORT',
          projectId,
          reportType: 'WEEKLY',
        },
        '0 9 * * 1' // Every Monday at 9 AM
      );
    }

    if (schedule.monthly) {
      await scheduleRecurringJob(
        'REPORT_GENERATOR',
        'monthly-report',
        {
          type: 'GENERATE_SCHEDULED_REPORT',
          projectId,
          reportType: 'MONTHLY',
        },
        '0 9 1 * *' // 1st of every month at 9 AM
      );
    }
  }

  // Helper methods
  private async getActivities(projectId: string, start: Date, end: Date) {
    return prisma.activityLog.findMany({
      where: {
        projectId,
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  private async getIssues(projectId: string, start: Date, end: Date) {
    return prisma.issue.findMany({
      where: {
        projectId,
        OR: [
          { createdAt: { gte: start, lte: end } },
          { status: { not: 'RESOLVED' } },
        ],
      },
    });
  }

  private async getBudgetData(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { budget: true },
    });

    const entries = await prisma.budgetEntry.aggregate({
      where: { projectId, category: 'EXPENSE' },
      _sum: { amount: true },
    });

    const committed = await prisma.budgetEntry.aggregate({
      where: { projectId, category: 'COMMITTED' },
      _sum: { amount: true },
    });

    const totalBudget = Number(project?.budget || 0);
    const spent = Number(entries._sum.amount || 0);
    const committedAmount = Number(committed._sum.amount || 0);
    const remaining = totalBudget - spent - committedAmount;
    const variancePercent = totalBudget > 0
      ? Math.round(((spent - (totalBudget * 0.5)) / totalBudget) * 100)
      : 0;

    return { totalBudget, spent, committed: committedAmount, remaining, variancePercent };
  }

  private async getMilestones(projectId: string) {
    // Milestones are linked through contracts, fetch all for the project's contracts
    const contracts = await prisma.contractAgreement.findMany({
      where: { projectId },
      select: { id: true },
    });
    const contractIds = contracts.map(c => c.id);
    return prisma.milestone.findMany({
      where: { contractId: { in: contractIds } },
      orderBy: { name: 'asc' },
    });
  }

  private async getPhotos(projectId: string, start: Date, end: Date) {
    return prisma.photo.findMany({
      where: {
        projectId,
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  private async getVisits(projectId: string, start: Date, end: Date) {
    return prisma.siteVisit.findMany({
      where: {
        projectId,
        scheduledAt: { gte: start, lte: end },
        status: 'COMPLETED',
      },
    });
  }

  private async getLatestProgressAnalysis(projectId: string): Promise<ProgressAnalysisResult | null> {
    // Get the latest completed visit with progress analysis in its findings
    const latestVisit = await prisma.siteVisit.findFirst({
      where: {
        projectId,
        status: 'COMPLETED',
      },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        findings: true,
      },
    });

    if (!latestVisit) return null;

    const findings = latestVisit.findings as any;
    const progressAnalysis = findings?.progressAnalysis;

    if (!progressAnalysis) return null;

    return {
      projectId,
      siteVisitId: latestVisit.id,
      overallProgressPercent: progressAnalysis.overallProgressPercent || 0,
      phaseDetected: progressAnalysis.phaseDetected || 'Unknown',
      areaBreakdown: progressAnalysis.areaBreakdown || [],
      stalledAreas: progressAnalysis.stalledAreas || [],
      highlights: progressAnalysis.highlights || [],
      concerns: progressAnalysis.concerns || [],
      comparisonSummary: progressAnalysis.comparisonSummary || '',
      analyzedAt: new Date(progressAnalysis.analyzedAt || Date.now()),
    };
  }

  private async getBeforeAfterPairs(projectId: string): Promise<BeforeAfterPairResult[]> {
    return beforeAfterService.getProjectPairs(projectId, { limit: 10 });
  }

  private calculateProgress(project: { currentPhase?: string | null }, milestones: any[]) {
    const completed = milestones.filter(m => m.status === 'COMPLETED').length;
    const total = milestones.length || 1;
    const percentComplete = Math.round((completed / total) * 100);

    return {
      phase: project.currentPhase || 'CONSTRUCTION',
      percentComplete,
      milestonesCompleted: milestones.filter(m => m.status === 'COMPLETED').map(m => m.name || 'Milestone'),
      milestonesUpcoming: milestones.filter(m => m.status === 'PENDING').slice(0, 3).map(m => m.name || 'Milestone'),
    };
  }

  private calculateScheduleStatus(
    project: { scheduledEndDate?: Date | null; projectedEndDate?: Date | null },
    milestones: { status: string; dueDate: Date }[]
  ) {
    let varianceDays = 0;
    let status: 'AHEAD' | 'ON_TRACK' | 'BEHIND' = 'ON_TRACK';

    if (project.scheduledEndDate && project.projectedEndDate) {
      const diff = project.projectedEndDate.getTime() - project.scheduledEndDate.getTime();
      varianceDays = Math.round(diff / (1000 * 60 * 60 * 24));

      if (varianceDays < -3) status = 'AHEAD';
      else if (varianceDays > 7) status = 'BEHIND';
    }

    const keyDates = milestones.slice(0, 5).map(m => ({
      name: (m as { name?: string }).name || 'Milestone',
      date: formatDate(m.dueDate),
      status: m.status,
    }));

    return { status, varianceDays, keyDates };
  }
}

// ============================================================================
// WORKER
// ============================================================================

const service = new ReportGeneratorService();

type ReportGeneratorJob =
  | { type: 'GENERATE_REPORT'; config: ReportConfig }
  | { type: 'GENERATE_SCHEDULED_REPORT'; projectId: string; reportType: ReportType }
  | { type: 'SEND_REPORT'; reportId: string; recipients: string[] }
  | { type: 'GENERATE_VISIT_REPORT'; visitId: string };

async function processReportGeneratorJob(job: Job<ReportGeneratorJob>): Promise<unknown> {
  console.log(`[ReportGenerator] Processing job: ${job.data.type} (${job.id})`);

  switch (job.data.type) {
    case 'GENERATE_REPORT':
      return service.generateReport(job.data.config);

    case 'GENERATE_SCHEDULED_REPORT': {
      const period = getReportPeriod(job.data.reportType.toLowerCase() as 'weekly' | 'monthly');
      return service.generateReport({
        projectId: job.data.projectId,
        type: job.data.reportType,
        periodStart: period.start,
        periodEnd: period.end,
        includePhotos: true,
        includeFinancials: true,
      });
    }

    case 'SEND_REPORT':
      return service.sendReportToRecipients(job.data.reportId, job.data.recipients);

    case 'GENERATE_VISIT_REPORT': {
      const visit = await prisma.siteVisit.findUnique({
        where: { id: job.data.visitId },
      });
      if (!visit) throw new Error('Visit not found');

      return service.generateReport({
        projectId: visit.projectId,
        type: 'VISIT',
        periodStart: visit.scheduledAt,
        periodEnd: visit.completedAt || new Date(),
        includePhotos: true,
      });
    }

    default:
      throw new Error(`Unknown job type`);
  }
}

export const reportGeneratorWorker = createWorker(
  QUEUE_NAMES.REPORT_GENERATOR,
  processReportGeneratorJob,
  { concurrency: 3 }
);

// ============================================================================
// API ROUTES
// ============================================================================

export async function reportGeneratorRoutes(fastify: FastifyInstance) {
  fastify.post('/reports/generate', async (request: FastifyRequest) => {
    const config = request.body as ReportConfig;
    const job = await queues.REPORT_GENERATOR.add(
      'generate',
      { type: 'GENERATE_REPORT', config },
      JOB_OPTIONS.DEFAULT
    );
    const result = await job.waitUntilFinished(
      (await import('../../../shared/queue.js')).queueEvents.REPORT_GENERATOR,
      60000
    );
    return result;
  });

  fastify.get('/reports/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const report = await prisma.report.findUnique({
      where: { id },
      include: { project: { select: { name: true } } },
    });
    if (!report) return reply.status(404).send({ error: 'Report not found' });
    return report;
  });

  fastify.post('/reports/:id/send', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const { recipients } = request.body as { recipients: string[] };
    return service.sendReportToRecipients(id, recipients);
  });

  fastify.get('/projects/:projectId/reports', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };
    return prisma.report.findMany({
      where: { projectId },
      orderBy: { generatedAt: 'desc' },
    });
  });

  fastify.post('/reports/schedule', async (request: FastifyRequest) => {
    const { projectId, weekly, monthly } = request.body as {
      projectId: string;
      weekly?: boolean;
      monthly?: boolean;
    };
    await service.scheduleRecurringReports(projectId, { weekly, monthly });
    return { scheduled: true };
  });
}

export { ReportGeneratorService };
