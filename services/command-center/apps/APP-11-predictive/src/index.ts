/**
 * APP-11: PREDICTIVE ISSUE ENGINE (AI)
 * Automation Level: AI-Driven
 *
 * Features:
 * - Delay prediction from milestones, inspections, weather
 * - Cost overrun prediction from budget burn rate
 * - Quality issue prediction from inspections and QA
 * - Risk scoring and alerts
 * - Recommended interventions
 */

import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import {
  createWorker,
  queues,
  QUEUE_NAMES,
  JOB_OPTIONS,
} from '../../../shared/queue.js';
import { getEventBus, EVENT_TYPES } from '../../../shared/events.js';
import { predictProjectRisks, generateJSON } from '../../../shared/ai/claude.js';
import { getDailyForecast } from '../../../shared/integrations/weather.js';
import { sendRiskAlert } from '../../../shared/integrations/email.js';
import { daysUntilDeadline, formatDate } from '../../../shared/utils/date.js';
import { calculateBudgetSummary } from '../../../shared/utils/money.js';
import { FastifyInstance, FastifyRequest } from 'fastify';

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

export type RiskCategory = 'DELAY' | 'COST' | 'QUALITY' | 'SAFETY' | 'SCOPE';
export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskPrediction {
  projectId: string;
  category: RiskCategory;
  probability: number; // 0-1
  impact: RiskSeverity;
  description: string;
  factors: string[];
  recommendation: string;
  predictedAt: Date;
}

export interface ProjectRiskAnalysis {
  projectId: string;
  projectName: string;
  overallRiskScore: number; // 0-100
  delayRisk: {
    probability: number;
    predictedDelayDays: number;
    factors: string[];
  };
  costRisk: {
    probability: number;
    predictedOverrun: number;
    factors: string[];
  };
  qualityRisk: {
    score: number; // 0-100
    issues: string[];
  };
  risks: RiskPrediction[];
  recommendations: string[];
  analyzedAt: Date;
}

// ============================================================================
// PREDICTIVE ENGINE SERVICE
// ============================================================================

class PredictiveEngineService {
  /**
   * Run full risk analysis for a project
   */
  async analyzeProjectRisks(projectId: string): Promise<ProjectRiskAnalysis> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        client: true,
        milestones: true,
        changeOrders: { where: { status: 'APPROVED' } },
        inspections: { orderBy: { scheduledAt: 'desc' }, take: 10 },
        budgetEntries: true,
        issues: { where: { status: { not: 'RESOLVED' } } },
      },
    } as any) as any;

    // Gather metrics
    const percentComplete = this.calculatePercentComplete(project.milestones || []);
    const daysRemaining = project.scheduledEndDate
      ? daysUntilDeadline(project.scheduledEndDate)
      : 90;
    const budgetUtilization = this.calculateBudgetUtilization(project);

    // Get weather forecast if location available
    let weatherForecast: string | undefined;
    if (project.latitude && project.longitude) {
      const forecast = await getDailyForecast(project.latitude, project.longitude, 7);
      const badDays = forecast.filter((d: any) => !d.isWorkable).length;
      if (badDays > 0) {
        weatherForecast = `${badDays} days of poor weather expected in the next 7 days`;
      }
    }

    // Recent issues
    const recentIssues = (project.issues || []).map((i: any) => i.description);

    // Upcoming milestones
    const upcomingMilestones = (project.milestones || [])
      .filter((m: any) => m.status !== 'COMPLETED' && m.dueDate > new Date())
      .slice(0, 5)
      .map((m: any) => `${m.name} - ${formatDate(m.dueDate)}`);

    // AI prediction
    const aiPrediction = await predictProjectRisks({
      projectName: project.name,
      currentPhase: project.currentPhase || 'CONSTRUCTION',
      percentComplete,
      daysRemaining,
      budgetUtilization,
      recentIssues,
      weatherForecast,
      upcomingMilestones,
    });

    // Build individual risk predictions
    const risks: RiskPrediction[] = aiPrediction.risks.map((r: any) => ({
      projectId,
      category: this.mapCategory(r.category),
      probability: r.probability,
      impact: r.impact as RiskSeverity,
      description: r.description,
      factors: [r.mitigation],
      recommendation: r.mitigation,
      predictedAt: new Date(),
    }));

    // Store prediction
    await (prisma as any).prediction.create({
      data: {
        projectId,
        overallScore: aiPrediction.overallRiskScore,
        delayProbability: aiPrediction.delayProbability,
        costOverrunProbability: aiPrediction.costOverrunProbability,
        qualityScore: aiPrediction.qualityRiskScore,
        risks: risks as object[],
        recommendations: aiPrediction.recommendations,
        analyzedAt: new Date(),
      } as any,
    });

    const analysis: ProjectRiskAnalysis = {
      projectId,
      projectName: project.name,
      overallRiskScore: aiPrediction.overallRiskScore,
      delayRisk: {
        probability: aiPrediction.delayProbability,
        predictedDelayDays: Math.round(aiPrediction.delayProbability * daysRemaining * 0.2),
        factors: risks.filter(r => r.category === 'DELAY').map(r => r.description),
      },
      costRisk: {
        probability: aiPrediction.costOverrunProbability,
        predictedOverrun: Math.round(Number(project.budget) * aiPrediction.costOverrunProbability * 0.1),
        factors: risks.filter(r => r.category === 'COST').map(r => r.description),
      },
      qualityRisk: {
        score: aiPrediction.qualityRiskScore,
        issues: risks.filter(r => r.category === 'QUALITY').map(r => r.description),
      },
      risks,
      recommendations: aiPrediction.recommendations,
      analyzedAt: new Date(),
    };

    // Emit event
    await getEventBus('predictive').publish(EVENT_TYPES.PREDICTION_GENERATED, {
      projectId,
      projectName: project.name,
      overallRiskScore: aiPrediction.overallRiskScore,
      highRiskCount: risks.filter(r => r.impact === 'HIGH' || r.impact === 'CRITICAL').length,
    });

    // Send alerts for high risks
    if (aiPrediction.overallRiskScore >= 70) {
      await this.sendRiskAlerts(project, analysis);
    }

    return analysis;
  }

  /**
   * Predict delay for a specific project
   */
  async predictDelay(projectId: string): Promise<{
    probability: number;
    predictedDays: number;
    factors: string[];
    confidence: number;
  }> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        milestones: true,
        inspections: { where: { result: 'FAILED' } },
        changeOrders: { where: { status: 'APPROVED' } },
      },
    } as any) as any;

    const factors: string[] = [];

    // Check milestone completion rate
    const milestones = project.milestones || [];
    const completedMilestones = milestones.filter((m: any) => m.status === 'COMPLETED');
    const lateMilestones = completedMilestones.filter((m: any) =>
      m.completedAt && m.dueDate && m.completedAt > m.dueDate
    );
    const lateRate = completedMilestones.length > 0
      ? lateMilestones.length / completedMilestones.length
      : 0;

    if (lateRate > 0.3) {
      factors.push(`${Math.round(lateRate * 100)}% of milestones completed late`);
    }

    // Check failed inspections
    const inspections = project.inspections || [];
    if (inspections.length > 0) {
      factors.push(`${inspections.length} failed inspection(s) requiring rework`);
    }

    // Check change orders impact
    const changeOrders = project.changeOrders || [];
    const totalScheduleImpact = changeOrders.reduce(
      (sum: number, co: any) => sum + (co.scheduleDaysAffected || 0), 0
    );
    if (totalScheduleImpact > 0) {
      factors.push(`Change orders added ${totalScheduleImpact} days to schedule`);
    }

    // Calculate probability
    let probability = 0;
    probability += lateRate * 0.4;
    probability += Math.min(inspections.length * 0.1, 0.3);
    probability += Math.min(totalScheduleImpact / 30, 0.3);
    probability = Math.min(probability, 1);

    const predictedDays = Math.round(probability * 14 + totalScheduleImpact);
    const confidence = factors.length > 0 ? 0.7 + (factors.length * 0.05) : 0.5;

    return {
      probability,
      predictedDays,
      factors,
      confidence: Math.min(confidence, 0.95),
    };
  }

  /**
   * Predict cost overrun
   */
  async predictCostOverrun(projectId: string): Promise<{
    probability: number;
    predictedAmount: number;
    factors: string[];
    burnRate: number;
  }> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        budgetEntries: true,
        changeOrders: { where: { status: 'APPROVED' } },
      },
    } as any) as any;

    const factors: string[] = [];
    const budget = Number(project.budget) || 1;

    // Calculate spend
    const budgetEntries = project.budgetEntries || [];
    const spent = budgetEntries
      .filter((e: any) => e.type === 'EXPENSE')
      .reduce((sum: number, e: any) => sum + Number(e.amount), 0);

    // Calculate percent complete (rough estimate from budget utilization)
    const percentComplete = Math.min((spent / budget) * 100, 100);

    // Burn rate analysis
    const expectedSpend = budget * (percentComplete / 100);
    const variance = spent - expectedSpend;
    const variancePercent = (variance / budget) * 100;

    if (variancePercent > 5) {
      factors.push(`Currently ${variancePercent.toFixed(1)}% over expected spend rate`);
    }

    // Change orders
    const changeOrders = project.changeOrders || [];
    const changeOrderTotal = changeOrders.reduce(
      (sum: number, co: any) => sum + Number(co.approvedCost || 0), 0
    );
    const coPercent = (changeOrderTotal / budget) * 100;
    if (coPercent > 5) {
      factors.push(`Change orders represent ${coPercent.toFixed(1)}% of original budget`);
    }

    // Calculate probability
    let probability = 0;
    if (variancePercent > 0) {
      probability += Math.min(variancePercent / 20, 0.5);
    }
    probability += Math.min(coPercent / 30, 0.3);
    probability = Math.min(probability, 1);

    const burnRate = percentComplete > 0 ? spent / percentComplete : 0;
    const projectedTotal = burnRate * 100;
    const predictedOverrun = Math.max(0, projectedTotal - budget);

    return {
      probability,
      predictedAmount: Math.round(predictedOverrun),
      factors,
      burnRate: Math.round(burnRate * 100) / 100,
    };
  }

  // Helper methods
  private calculatePercentComplete(milestones: { status: string }[]): number {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.status === 'COMPLETED').length;
    return Math.round((completed / milestones.length) * 100);
  }

  private calculateBudgetUtilization(project: { budget: unknown; budgetEntries: { amount: unknown; type: string }[] }): number {
    const budget = Number(project.budget) || 1;
    const spent = project.budgetEntries
      .filter(e => e.type === 'EXPENSE')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return Math.round((spent / budget) * 100);
  }

  private mapCategory(category: string): RiskCategory {
    const map: Record<string, RiskCategory> = {
      schedule: 'DELAY',
      cost: 'COST',
      quality: 'QUALITY',
      safety: 'SAFETY',
      scope: 'SCOPE',
    };
    return map[category.toLowerCase()] || 'DELAY';
  }

  private async sendRiskAlerts(
    project: { pmId?: string | null; name: string },
    analysis: ProjectRiskAnalysis
  ): Promise<void> {
    if (!project.pmId) return;

    const pm = await prisma.user.findUnique({
      where: { id: project.pmId },
      select: { email: true },
    });

    if (pm?.email) {
      const highRisks = analysis.risks.filter(
        r => r.impact === 'HIGH' || r.impact === 'CRITICAL'
      );

      await sendRiskAlert({
        recipients: [pm.email],
        projectName: project.name,
        riskType: 'Multiple',
        severity: analysis.overallRiskScore >= 80 ? 'critical' : 'high',
        description: `Project risk score: ${analysis.overallRiskScore}/100. ${highRisks.length} high-priority risks identified.`,
        recommendations: analysis.recommendations.slice(0, 3),
      });

      await getEventBus('predictive').publish(EVENT_TYPES.RISK_ALERT, {
        projectId: analysis.projectId,
        riskScore: analysis.overallRiskScore,
        alertSent: true,
      });
    }
  }
}

// ============================================================================
// WORKER
// ============================================================================

const service = new PredictiveEngineService();

type PredictiveJob =
  | { type: 'FULL_RISK_ANALYSIS'; projectId: string }
  | { type: 'PREDICT_DELAY'; projectId: string }
  | { type: 'PREDICT_COST_OVERRUN'; projectId: string }
  | { type: 'BATCH_ANALYSIS'; projectIds: string[] };

async function processPredictiveJob(job: Job<PredictiveJob>): Promise<unknown> {
  console.log(`[Predictive] Processing job: ${job.data.type} (${job.id})`);

  switch (job.data.type) {
    case 'FULL_RISK_ANALYSIS':
      return service.analyzeProjectRisks(job.data.projectId);

    case 'PREDICT_DELAY':
      return service.predictDelay(job.data.projectId);

    case 'PREDICT_COST_OVERRUN':
      return service.predictCostOverrun(job.data.projectId);

    case 'BATCH_ANALYSIS': {
      const results = [];
      for (const projectId of job.data.projectIds) {
        try {
          const analysis = await service.analyzeProjectRisks(projectId);
          results.push({ projectId, success: true, riskScore: analysis.overallRiskScore });
        } catch (error) {
          results.push({ projectId, success: false, error: String(error) });
        }
      }
      return { results };
    }

    default:
      throw new Error(`Unknown job type`);
  }
}

export const predictiveWorker = createWorker(
  QUEUE_NAMES.PREDICTIVE,
  processPredictiveJob,
  { concurrency: 2 }
);

// ============================================================================
// API ROUTES
// ============================================================================

export async function predictiveRoutes(fastify: FastifyInstance) {
  fastify.get('/ai/risk/:projectId', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };
    return service.analyzeProjectRisks(projectId);
  });

  fastify.get('/ai/predict/delay/:projectId', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };
    return service.predictDelay(projectId);
  });

  fastify.get('/ai/predict/cost/:projectId', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };
    return service.predictCostOverrun(projectId);
  });

  fastify.get('/ai/risk-history/:projectId', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };
    return (prisma as any).prediction.findMany({
      where: { projectId },
      orderBy: { analyzedAt: 'desc' },
      take: 10,
    });
  });

  fastify.post('/ai/batch-analysis', async (request: FastifyRequest) => {
    const { projectIds } = request.body as { projectIds: string[] };
    const job = await queues.PREDICTIVE.add(
      'batch-analysis',
      { type: 'BATCH_ANALYSIS', projectIds },
      JOB_OPTIONS.LOW_PRIORITY
    );
    return { jobId: job.id, projectCount: projectIds.length };
  });
}

export { PredictiveEngineService };
