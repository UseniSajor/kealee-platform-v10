import { PrismaClient } from '@prisma/client';
import { generateJSON } from '../../infrastructure/ai.js';
import { AI_PROMPTS } from '../../infrastructure/ai-prompts.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';

const prisma = new PrismaClient();
const SOURCE_APP = 'APP-11';

interface PredictionResult {
  type: 'delay' | 'cost_overrun' | 'quality_issue' | 'safety_risk';
  probability: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  timeframe: string;
  dataPoints: string[];
}

/** Map prediction types to event types for publishing. */
const PREDICTION_EVENT_MAP: Record<string, string> = {
  delay: EVENT_TYPES.SCHEDULE_DISRUPTION,
  cost_overrun: EVENT_TYPES.BUDGET_OVERRUN_DETECTED,
  quality_issue: EVENT_TYPES.QA_ISSUE_DETECTED,
  safety_risk: EVENT_TYPES.DECISION_NEEDED,
};

/** Map prediction types to DecisionQueue types. */
const DECISION_TYPE_MAP: Record<string, string> = {
  delay: 'schedule_risk',
  cost_overrun: 'budget_risk',
  quality_issue: 'quality_risk',
  safety_risk: 'safety_risk',
};

export class PredictiveEngineService {
  // -----------------------------------------------------------------------
  // analyzeProject
  // -----------------------------------------------------------------------

  async analyzeProject(projectId: string): Promise<string[]> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        client: true,
        phases: {
          orderBy: { sortOrder: 'asc' },
          include: { milestones: true },
        },
      },
    });

    // ---- Gather comprehensive data in parallel ----
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      allTasks,
      latestSnapshot,
      recentSnapshots,
      changeOrders,
      inspections,
      qaResults,
      siteVisits,
      existingPredictions,
      contractorProjects,
    ] = await Promise.all([
      // Tasks
      prisma.task.findMany({
        where: { projectId },
        select: { id: true, status: true, priority: true, dueDate: true, completedAt: true, assignedTo: true },
      }),

      // Latest budget snapshot
      prisma.budgetSnapshot.findFirst({
        where: { projectId },
        orderBy: { snapshotDate: 'desc' },
      }),

      // Last 4 snapshots for trend analysis
      prisma.budgetSnapshot.findMany({
        where: { projectId },
        orderBy: { snapshotDate: 'desc' },
        take: 4,
      }),

      // Change orders
      prisma.changeOrder.findMany({
        where: { projectId },
        select: { id: true, totalCost: true, status: true, createdAt: true },
      }),

      // Inspections
      prisma.inspection.findMany({
        where: { projectId },
        select: { id: true, result: true, inspectionType: true, completedAt: true },
      }),

      // QA results
      prisma.qAInspectionResult.findMany({
        where: { projectId },
        select: { id: true, overallScore: true, issuesFound: true, createdAt: true },
      }),

      // Recent site visits
      prisma.siteVisit.findMany({
        where: { projectId, scheduledAt: { gte: sevenDaysAgo } },
        select: { id: true, status: true, type: true, notes: true },
      }),

      // Recent predictions (to avoid duplicates)
      prisma.prediction.findMany({
        where: { projectId, createdAt: { gte: sevenDaysAgo } },
        select: { type: true, description: true },
      }),

      // Contractor performance (get contractors via ContractorProject)
      prisma.contractorProject.findMany({
        where: { projectId },
        include: {
          contractor: {
            select: { id: true, companyName: true, rating: true, reviewCount: true },
          },
        },
      }),
    ]);

    // ---- Compute metrics ----

    // Task metrics
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === 'COMPLETED').length;
    const overdueTasks = allTasks.filter(
      (t) =>
        t.dueDate &&
        t.dueDate < now &&
        t.status !== 'COMPLETED' &&
        t.status !== 'CANCELED',
    ).length;
    const recentCompletions = allTasks.filter(
      (t) => t.completedAt && t.completedAt >= sevenDaysAgo,
    ).length;
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    // Budget metrics
    const budgetVariance = latestSnapshot
      ? Number(latestSnapshot.totalVariance)
      : 0;
    const budgetTotal = latestSnapshot
      ? Number(latestSnapshot.totalBudget)
      : 0;
    const budgetSpent = latestSnapshot
      ? Number(latestSnapshot.totalActual)
      : 0;
    const budgetCommitted = latestSnapshot
      ? Number(latestSnapshot.totalCommitted)
      : 0;
    const percentComplete = latestSnapshot
      ? Number(latestSnapshot.percentComplete)
      : 0;

    // Budget trend (variance direction over recent snapshots)
    let budgetTrend = 'stable';
    if (recentSnapshots.length >= 2) {
      const latestVar = Number(recentSnapshots[0].totalVariance);
      const previousVar = Number(recentSnapshots[1].totalVariance);
      if (latestVar < previousVar - 100) budgetTrend = 'worsening';
      else if (latestVar > previousVar + 100) budgetTrend = 'improving';
    }

    // Spend rate (percent of budget spent per day)
    const projectDays = project.actualStartDate
      ? Math.max(1, Math.ceil((now.getTime() - project.actualStartDate.getTime()) / (1000 * 60 * 60 * 24)))
      : null;
    const spendRate = projectDays && budgetTotal > 0
      ? (budgetSpent / budgetTotal / projectDays) * 100
      : null;

    // Schedule metrics
    const scheduledDuration =
      project.scheduledStartDate && project.scheduledEndDate
        ? Math.ceil(
            (project.scheduledEndDate.getTime() - project.scheduledStartDate.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;
    const elapsedDays =
      project.actualStartDate
        ? Math.ceil((now.getTime() - project.actualStartDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const scheduledProgress =
      scheduledDuration && elapsedDays
        ? Math.min(100, (elapsedDays / scheduledDuration) * 100)
        : null;

    // Change order metrics
    const totalCOAmount = changeOrders.reduce(
      (sum, co) => sum + Number(co.totalCost),
      0,
    );
    const approvedCOs = changeOrders.filter((co) => co.status === 'APPROVED').length;

    // Inspection metrics
    const totalInspections = inspections.length;
    const passedInspections = inspections.filter(
      (i) => i.result === 'PASS' || i.result === 'PASS_WITH_COMMENTS',
    ).length;
    const failedInspections = inspections.filter(
      (i) => i.result === 'FAIL',
    ).length;
    const inspectionPassRate =
      totalInspections > 0 ? passedInspections / totalInspections : null;

    // QA metrics
    const qaScores = qaResults
      .filter((q) => q.overallScore !== null)
      .map((q) => Number(q.overallScore));
    const avgQaScore =
      qaScores.length > 0
        ? qaScores.reduce((a, b) => a + b, 0) / qaScores.length
        : null;
    const openQaIssues = qaResults.reduce((count, q) => {
      const issues = q.issuesFound as any[] | null;
      return count + (Array.isArray(issues) ? issues.length : 0);
    }, 0);

    // Contractor metrics
    const contractorSummary = contractorProjects.map((cp) => ({
      company: cp.contractor.companyName,
      rating: Number(cp.contractor.rating),
      reviews: cp.contractor.reviewCount,
      status: cp.status,
    }));

    // ---- Build AI prompt ----

    const projectData = {
      project: {
        name: project.name ?? 'Unnamed',
        status: project.status,
        currentPhase: project.currentPhase ?? 'unknown',
        address: [project.city, project.state].filter(Boolean).join(', '),
        scheduledStart: project.scheduledStartDate?.toISOString() ?? null,
        scheduledEnd: project.scheduledEndDate?.toISOString() ?? null,
        actualStart: project.actualStartDate?.toISOString() ?? null,
        percentComplete,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        overdue: overdueTasks,
        completionRate: Math.round(completionRate * 100),
        recentCompletions,
      },
      budget: {
        total: budgetTotal,
        spent: budgetSpent,
        committed: budgetCommitted,
        variance: budgetVariance,
        trend: budgetTrend,
        spendRatePerDay: spendRate ? `${spendRate.toFixed(2)}%` : null,
      },
      schedule: {
        scheduledDuration,
        elapsedDays,
        scheduledProgressPercent: scheduledProgress ? Math.round(scheduledProgress) : null,
        actualProgressPercent: Math.round(percentComplete),
        behindSchedule:
          scheduledProgress !== null
            ? Math.round(scheduledProgress) - Math.round(percentComplete)
            : null,
      },
      changeOrders: {
        count: changeOrders.length,
        approved: approvedCOs,
        totalAmount: totalCOAmount,
      },
      inspections: {
        total: totalInspections,
        passed: passedInspections,
        failed: failedInspections,
        passRate: inspectionPassRate ? `${(inspectionPassRate * 100).toFixed(0)}%` : null,
      },
      qa: {
        averageScore: avgQaScore ? avgQaScore.toFixed(1) : null,
        openIssues: openQaIssues,
        inspectionCount: qaResults.length,
      },
      contractors: contractorSummary,
      recentActivity: {
        siteVisitsThisWeek: siteVisits.length,
        completedTasksThisWeek: recentCompletions,
      },
      existingPredictions: existingPredictions.map((p) => ({
        type: p.type,
        description: p.description.substring(0, 100),
      })),
    };

    const userPrompt =
      'Analyze this construction project data and predict potential problems. ' +
      'Return a JSON array of predictions. Each prediction must have: type, probability (0-1), ' +
      'impact ("low"|"medium"|"high"|"critical"), description, recommendation, timeframe, ' +
      'and dataPoints (array of strings citing which data led to the prediction). ' +
      'Only include predictions with probability >= 0.3. Avoid duplicating existing predictions.\n\n' +
      'PROJECT DATA:\n' +
      JSON.stringify(projectData, null, 2);

    // ---- Call Claude ----

    let predictions: PredictionResult[];
    try {
      const result = await generateJSON<PredictionResult[]>({
        systemPrompt: AI_PROMPTS.PREDICTIVE_ENGINE,
        userPrompt,
        maxTokens: 3000,
      });
      predictions = Array.isArray(result.data) ? result.data : [];
    } catch (err) {
      console.error(
        `[PredictiveEngine] AI analysis failed for ${projectId}:`,
        (err as Error).message,
      );
      // Return empty — don't create false predictions on AI failure
      return [];
    }

    // ---- Process predictions ----

    const createdIds: string[] = [];

    for (const pred of predictions) {
      // Validate prediction data
      if (
        !pred.type ||
        typeof pred.probability !== 'number' ||
        pred.probability < 0.3
      ) {
        continue;
      }

      const probability = Math.min(1, Math.max(0, pred.probability));
      const impact = (['low', 'medium', 'high', 'critical'].includes(pred.impact)
        ? pred.impact
        : 'medium'
      ).toUpperCase();

      // Create Prediction record
      const prediction = await prisma.prediction.create({
        data: {
          projectId,
          type: pred.type.toUpperCase(),
          probability,
          confidence: probability * 0.85, // Confidence slightly below probability
          impact,
          description: pred.description,
          factors: {
            dataPoints: pred.dataPoints ?? [],
            timeframe: pred.timeframe ?? 'unknown',
          },
          recommendedAction: pred.recommendation,
        },
      });

      createdIds.push(prediction.id);

      // High probability (>0.7): publish event and create decision queue entry
      if (probability > 0.7) {
        const eventType = PREDICTION_EVENT_MAP[pred.type] ?? EVENT_TYPES.DECISION_NEEDED;

        await eventBus.publish(
          eventType,
          {
            predictionId: prediction.id,
            type: pred.type,
            probability,
            impact,
            description: pred.description,
            projectName: project.name ?? projectId,
            severity: impact,
          },
          SOURCE_APP,
          { projectId },
        );

        // Create DecisionQueue entry
        if (project.pmId) {
          await prisma.decisionQueue.create({
            data: {
              projectId,
              pmId: project.pmId,
              type: DECISION_TYPE_MAP[pred.type] ?? 'risk_mitigation',
              title: `${pred.type.replace(/_/g, ' ')} risk: ${pred.description.substring(0, 80)}`,
              context: {
                predictionId: prediction.id,
                probability,
                impact,
                timeframe: pred.timeframe,
                dataPoints: pred.dataPoints,
              },
              aiRecommendation: pred.recommendation,
              aiConfidence: probability * 0.85,
              options: [
                { action: 'mitigate', label: 'Take Recommended Action' },
                { action: 'monitor', label: 'Monitor & Reassess' },
                { action: 'accept', label: 'Accept Risk' },
              ],
            },
          });
        }
      }

      // Medium probability (>0.5): notify PM
      if (probability > 0.5 && project.pmId) {
        await prisma.notification.create({
          data: {
            userId: project.pmId,
            type: 'risk_prediction',
            title: `Risk Alert: ${pred.type.replace(/_/g, ' ')}`,
            message:
              `${pred.description.substring(0, 200)}\n\n` +
              `Probability: ${(probability * 100).toFixed(0)}% | Impact: ${impact}\n` +
              `Recommendation: ${pred.recommendation?.substring(0, 150) ?? 'See details'}`,
            channels: ['in_app'],
            status: 'SENT',
            sentAt: new Date(),
            data: { predictionId: prediction.id, projectId },
          },
        });
      }
    }

    console.log(
      `[PredictiveEngine] Project ${projectId}: ${createdIds.length} predictions created ` +
        `(${predictions.filter((p) => p.probability > 0.7).length} high-risk)`,
    );

    return createdIds;
  }

  // -----------------------------------------------------------------------
  // analyzeAllActiveProjects
  // -----------------------------------------------------------------------

  async analyzeAllActiveProjects(): Promise<number> {
    const activeProjects = await prisma.project.findMany({
      where: { status: { in: ['ACTIVE', 'IN_PROGRESS'] } },
      select: { id: true },
    });

    console.log(
      `[PredictiveEngine] Queuing analysis for ${activeProjects.length} active projects`,
    );

    return activeProjects.length;
  }

  // -----------------------------------------------------------------------
  // getProjectRiskSummary
  // -----------------------------------------------------------------------

  async getProjectRiskSummary(projectId: string): Promise<{
    overall: string;
    predictions: Array<{
      type: string;
      count: number;
      avgProbability: number;
      maxImpact: string;
    }>;
    trend: 'improving' | 'worsening' | 'stable';
    totalActive: number;
  }> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [recentPredictions, olderPredictions] = await Promise.all([
      prisma.prediction.findMany({
        where: { projectId, createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.prediction.findMany({
        where: {
          projectId,
          createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        },
      }),
    ]);

    // Group by type
    const byType = new Map<
      string,
      { count: number; probabilities: number[]; impacts: string[] }
    >();

    for (const pred of recentPredictions) {
      const existing = byType.get(pred.type) ?? {
        count: 0,
        probabilities: [],
        impacts: [],
      };
      existing.count++;
      existing.probabilities.push(Number(pred.probability));
      existing.impacts.push(pred.impact);
      byType.set(pred.type, existing);
    }

    const impactOrder: Record<string, number> = {
      LOW: 0,
      MEDIUM: 1,
      HIGH: 2,
      CRITICAL: 3,
    };

    const predictions = Array.from(byType.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      avgProbability:
        data.probabilities.reduce((a, b) => a + b, 0) / data.probabilities.length,
      maxImpact: data.impacts.sort(
        (a, b) => (impactOrder[b] ?? 0) - (impactOrder[a] ?? 0),
      )[0],
    }));

    // Determine trend
    const recentAvgProb =
      recentPredictions.length > 0
        ? recentPredictions.reduce((s, p) => s + Number(p.probability), 0) /
          recentPredictions.length
        : 0;
    const olderAvgProb =
      olderPredictions.length > 0
        ? olderPredictions.reduce((s, p) => s + Number(p.probability), 0) /
          olderPredictions.length
        : 0;

    let trend: 'improving' | 'worsening' | 'stable' = 'stable';
    if (recentAvgProb > olderAvgProb + 0.1) trend = 'worsening';
    else if (recentAvgProb < olderAvgProb - 0.1) trend = 'improving';

    // Overall risk level
    const highRiskCount = recentPredictions.filter(
      (p) => Number(p.probability) > 0.7,
    ).length;
    let overall = 'low';
    if (highRiskCount >= 3 || recentAvgProb > 0.7) overall = 'critical';
    else if (highRiskCount >= 1 || recentAvgProb > 0.5) overall = 'high';
    else if (recentPredictions.length > 0) overall = 'medium';

    return {
      overall,
      predictions,
      trend,
      totalActive: recentPredictions.filter((p) => !p.acknowledged).length,
    };
  }
}
