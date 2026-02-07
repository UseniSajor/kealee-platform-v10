import { PrismaClient } from '@prisma/client';
import { generateText } from '../../infrastructure/ai.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';

const prisma = new PrismaClient();
const SOURCE_APP = 'APP-04';

const REPORT_WRITER_PROMPT =
  'You are a construction PM report writer. Write a clear, concise weekly ' +
  'progress report for a client. Include: work completed, upcoming milestones, ' +
  'budget status, any issues or risks, and photos summary. Keep tone professional ' +
  'but accessible for non-technical clients. Use markdown formatting with headers.';

const MILESTONE_REPORT_PROMPT =
  'You are a construction PM report writer. Write a milestone completion report ' +
  'for a client. Cover what was accomplished, quality assessment results, any ' +
  'inspection outcomes, budget impact, and next steps. Professional but accessible.';

const CLOSEOUT_REPORT_PROMPT =
  'You are a construction PM report writer. Write a comprehensive project closeout ' +
  'report. Include: project overview, timeline summary (planned vs actual), complete ' +
  'financial summary, all inspections passed, warranty information, and lessons learned. ' +
  'This is a formal deliverable so be thorough and well-structured.';

/**
 * Get the Monday and Sunday of the current week.
 */
function currentWeekBounds(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

export class ReportGeneratorService {
  // -----------------------------------------------------------------------
  // generateWeeklyReport
  // -----------------------------------------------------------------------

  async generateWeeklyReport(projectId: string): Promise<string> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    const { weekStart, weekEnd } = currentWeekBounds();

    // Gather all data for the week in parallel
    const [
      tasksCompleted,
      latestSnapshot,
      siteVisits,
      qaResults,
      inspections,
      changeOrders,
      predictions,
    ] = await Promise.all([
      prisma.task.findMany({
        where: {
          projectId,
          status: 'COMPLETED',
          completedAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.budgetSnapshot.findFirst({
        where: { projectId },
        orderBy: { snapshotDate: 'desc' },
      }),
      prisma.siteVisit.findMany({
        where: {
          projectId,
          scheduledAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.qAInspectionResult.findMany({
        where: {
          projectId,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.inspection.findMany({
        where: {
          projectId,
          completedAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.changeOrder.findMany({
        where: {
          projectId,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.prediction.findMany({
        where: { projectId, acknowledged: false },
        orderBy: { probability: 'desc' },
        take: 5,
      }),
    ]);

    // Collect photos from site visits
    const photos: string[] = [];
    for (const visit of siteVisits) {
      photos.push(...visit.photos);
    }

    // Build data summary for AI
    const dataSummary =
      `PROJECT: ${project.name ?? 'Unnamed'}\n` +
      `Week: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}\n\n` +
      `TASKS COMPLETED (${tasksCompleted.length}):\n` +
      (tasksCompleted.length > 0
        ? tasksCompleted.map((t) => `- ${t.title} (${t.status})`).join('\n')
        : '- No tasks completed this week') +
      `\n\nBUDGET STATUS:\n` +
      (latestSnapshot
        ? `- Total Budget: $${Number(latestSnapshot.totalBudget).toLocaleString()}\n` +
          `- Spent to Date: $${Number(latestSnapshot.totalActual).toLocaleString()}\n` +
          `- Committed: $${Number(latestSnapshot.totalCommitted).toLocaleString()}\n` +
          `- Variance: $${Number(latestSnapshot.totalVariance).toLocaleString()}\n` +
          `- Completion: ${Number(latestSnapshot.percentComplete).toFixed(1)}%`
        : '- No budget data available') +
      `\n\nSITE VISITS (${siteVisits.length}):\n` +
      (siteVisits.length > 0
        ? siteVisits
            .map(
              (v) =>
                `- ${v.type} visit on ${v.scheduledAt.toLocaleDateString()} ` +
                `(${v.status})${v.notes ? ': ' + v.notes.substring(0, 100) : ''}`,
            )
            .join('\n')
        : '- No site visits this week') +
      `\n\nQA RESULTS (${qaResults.length}):\n` +
      (qaResults.length > 0
        ? qaResults
            .map(
              (q) =>
                `- Score: ${q.overallScore ?? 'N/A'}, Issues: ${
                  q.issuesFound ? JSON.stringify(q.issuesFound).substring(0, 100) : 'None'
                }`,
            )
            .join('\n')
        : '- No QA inspections this week') +
      `\n\nINSPECTIONS (${inspections.length}):\n` +
      (inspections.length > 0
        ? inspections
            .map(
              (i) =>
                `- ${i.inspectionType}: ${i.result ?? 'pending'}` +
                (i.inspectorNotes ? ` - ${i.inspectorNotes.substring(0, 100)}` : ''),
            )
            .join('\n')
        : '- No inspections this week') +
      `\n\nCHANGE ORDERS (${changeOrders.length}):\n` +
      (changeOrders.length > 0
        ? changeOrders
            .map(
              (co) =>
                `- ${co.changeOrderNumber}: ${co.title} ($${Number(co.totalCost).toLocaleString()}) - ${co.status}`,
            )
            .join('\n')
        : '- No change orders this week') +
      `\n\nACTIVE RISKS/PREDICTIONS (${predictions.length}):\n` +
      (predictions.length > 0
        ? predictions
            .map(
              (p) =>
                `- [${p.impact}] ${p.type}: ${p.description.substring(0, 150)} ` +
                `(probability: ${Number(p.probability) * 100}%)`,
            )
            .join('\n')
        : '- No active risk predictions') +
      `\n\nPHOTOS: ${photos.length} site photos taken this week`;

    // Generate AI summary
    let summary: string;
    try {
      const result = await generateText({
        systemPrompt: REPORT_WRITER_PROMPT,
        userPrompt: dataSummary,
        maxTokens: 3000,
        temperature: 0.4,
      });
      summary = result.text;
    } catch (err) {
      console.error('[ReportGenerator] AI summary failed:', (err as Error).message);
      summary = `Weekly Report for ${project.name ?? projectId}\n\n${dataSummary}`;
    }

    // Build metrics JSON
    const metrics = {
      tasksCompleted: tasksCompleted.length,
      siteVisits: siteVisits.length,
      inspections: inspections.length,
      inspectionsPassed: inspections.filter((i) => i.result === 'PASS' || i.result === 'PASS_WITH_COMMENTS').length,
      changeOrders: changeOrders.length,
      qaScoreAvg:
        qaResults.length > 0
          ? qaResults.reduce((s, q) => s + Number(q.overallScore ?? 0), 0) / qaResults.length
          : null,
      budget: latestSnapshot
        ? {
            total: Number(latestSnapshot.totalBudget),
            spent: Number(latestSnapshot.totalActual),
            committed: Number(latestSnapshot.totalCommitted),
            variance: Number(latestSnapshot.totalVariance),
          }
        : null,
      photoCount: photos.length,
    };

    const risks = predictions.length > 0
      ? predictions.map((p) => ({
          type: p.type,
          impact: p.impact,
          probability: Number(p.probability),
          description: p.description,
        }))
      : null;

    // Create WeeklyReport record
    const report = await prisma.weeklyReport.create({
      data: {
        projectId,
        weekStart,
        weekEnd,
        summary,
        metrics,
        risks: risks ?? undefined,
        photos: photos.slice(0, 20), // Limit stored photo refs
      },
    });

    // Publish event
    await eventBus.publish(
      EVENT_TYPES.DOCUMENT_GENERATED,
      {
        type: 'weekly_report',
        reportId: report.id,
        projectId,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
      },
      SOURCE_APP,
      { projectId },
    );

    return report.id;
  }

  // -----------------------------------------------------------------------
  // generateMilestoneReport
  // -----------------------------------------------------------------------

  async generateMilestoneReport(
    projectId: string,
    milestoneId: string,
  ): Promise<string> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    const [inspections, qaResults, latestSnapshot] = await Promise.all([
      prisma.inspection.findMany({
        where: { projectId },
        orderBy: { completedAt: 'desc' },
        take: 5,
      }),
      prisma.qAInspectionResult.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.budgetSnapshot.findFirst({
        where: { projectId },
        orderBy: { snapshotDate: 'desc' },
      }),
    ]);

    const dataSummary =
      `PROJECT: ${project.name ?? 'Unnamed'}\n` +
      `MILESTONE ID: ${milestoneId}\n\n` +
      `INSPECTION RESULTS:\n` +
      inspections
        .map((i) => `- ${i.inspectionType}: ${i.result ?? 'pending'}`)
        .join('\n') +
      `\n\nQA SCORES:\n` +
      qaResults
        .map((q) => `- Score: ${q.overallScore ?? 'N/A'}`)
        .join('\n') +
      `\n\nBUDGET STATUS:\n` +
      (latestSnapshot
        ? `Spent: $${Number(latestSnapshot.totalActual).toLocaleString()} of $${Number(latestSnapshot.totalBudget).toLocaleString()}`
        : 'No budget data');

    let summary: string;
    try {
      const result = await generateText({
        systemPrompt: MILESTONE_REPORT_PROMPT,
        userPrompt: dataSummary,
        maxTokens: 2000,
        temperature: 0.4,
      });
      summary = result.text;
    } catch (err) {
      console.error('[ReportGenerator] AI milestone report failed:', (err as Error).message);
      summary = `Milestone Report\n\n${dataSummary}`;
    }

    const { weekStart, weekEnd } = currentWeekBounds();

    const report = await prisma.weeklyReport.create({
      data: {
        projectId,
        weekStart,
        weekEnd,
        summary,
        metrics: { type: 'milestone', milestoneId },
      },
    });

    await eventBus.publish(
      EVENT_TYPES.DOCUMENT_GENERATED,
      { type: 'milestone_report', reportId: report.id, projectId, milestoneId },
      SOURCE_APP,
      { projectId },
    );

    return report.id;
  }

  // -----------------------------------------------------------------------
  // generateCloseoutPackage
  // -----------------------------------------------------------------------

  async generateCloseoutPackage(projectId: string): Promise<string> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    const [
      allInspections,
      allSnapshots,
      allChangeOrders,
      allVisits,
    ] = await Promise.all([
      prisma.inspection.findMany({
        where: { projectId },
        orderBy: { completedAt: 'asc' },
      }),
      prisma.budgetSnapshot.findMany({
        where: { projectId },
        orderBy: { snapshotDate: 'asc' },
      }),
      prisma.changeOrder.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.siteVisit.findMany({
        where: { projectId },
        orderBy: { scheduledAt: 'asc' },
      }),
    ]);

    const latestSnapshot = allSnapshots[allSnapshots.length - 1];
    const allPhotos: string[] = [];
    for (const visit of allVisits) {
      allPhotos.push(...visit.photos);
    }

    const dataSummary =
      `PROJECT CLOSEOUT: ${project.name ?? 'Unnamed'}\n\n` +
      `TIMELINE:\n` +
      `- Planned Start: ${project.scheduledStartDate?.toLocaleDateString() ?? 'N/A'}\n` +
      `- Planned End: ${project.scheduledEndDate?.toLocaleDateString() ?? 'N/A'}\n` +
      `- Actual Start: ${project.actualStartDate?.toLocaleDateString() ?? 'N/A'}\n` +
      `- Actual End: ${project.actualEndDate?.toLocaleDateString() ?? 'N/A'}\n\n` +
      `FINANCIAL SUMMARY:\n` +
      (latestSnapshot
        ? `- Original Budget: $${Number(latestSnapshot.totalBudget).toLocaleString()}\n` +
          `- Final Spent: $${Number(latestSnapshot.totalActual).toLocaleString()}\n` +
          `- Variance: $${Number(latestSnapshot.totalVariance).toLocaleString()}\n`
        : '- No financial data\n') +
      `\nCHANGE ORDERS (${allChangeOrders.length}):\n` +
      allChangeOrders
        .map(
          (co) =>
            `- ${co.changeOrderNumber}: ${co.title} ($${Number(co.totalCost).toLocaleString()}) - ${co.status}`,
        )
        .join('\n') +
      `\n\nINSPECTIONS (${allInspections.length}):\n` +
      allInspections
        .map((i) => `- ${i.inspectionType}: ${i.result ?? 'pending'}`)
        .join('\n') +
      `\n\nSITE VISITS: ${allVisits.length} total\n` +
      `PHOTOS: ${allPhotos.length} total`;

    let summary: string;
    try {
      const result = await generateText({
        systemPrompt: CLOSEOUT_REPORT_PROMPT,
        userPrompt: dataSummary,
        maxTokens: 4000,
        temperature: 0.3,
      });
      summary = result.text;
    } catch (err) {
      console.error('[ReportGenerator] AI closeout report failed:', (err as Error).message);
      summary = `Closeout Report\n\n${dataSummary}`;
    }

    const now = new Date();
    const report = await prisma.weeklyReport.create({
      data: {
        projectId,
        weekStart: project.actualStartDate ?? project.createdAt,
        weekEnd: now,
        summary,
        metrics: {
          type: 'closeout',
          totalInspections: allInspections.length,
          inspectionsPassed: allInspections.filter(
            (i) => i.result === 'PASS' || i.result === 'PASS_WITH_COMMENTS',
          ).length,
          totalChangeOrders: allChangeOrders.length,
          totalSiteVisits: allVisits.length,
          totalPhotos: allPhotos.length,
          budget: latestSnapshot
            ? {
                total: Number(latestSnapshot.totalBudget),
                spent: Number(latestSnapshot.totalActual),
                variance: Number(latestSnapshot.totalVariance),
              }
            : null,
        },
        photos: allPhotos.slice(0, 50),
      },
    });

    await eventBus.publish(
      EVENT_TYPES.DOCUMENT_GENERATED,
      { type: 'closeout_package', reportId: report.id, projectId },
      SOURCE_APP,
      { projectId },
    );

    return report.id;
  }

  // -----------------------------------------------------------------------
  // sendReportToClient
  // -----------------------------------------------------------------------

  async sendReportToClient(reportId: string): Promise<void> {
    const report = await prisma.weeklyReport.findUniqueOrThrow({
      where: { id: reportId },
      include: { project: true },
    });

    // Publish communication event for APP-08
    await eventBus.publish(
      EVENT_TYPES.DOCUMENT_GENERATED,
      {
        type: 'report_delivery',
        reportId,
        projectId: report.projectId,
        fileUrl: report.fileUrl,
        recipientType: 'client',
        clientId: report.project.clientId,
      },
      SOURCE_APP,
      { projectId: report.projectId },
    );

    await prisma.weeklyReport.update({
      where: { id: reportId },
      data: { sentToClient: true },
    });
  }
}
