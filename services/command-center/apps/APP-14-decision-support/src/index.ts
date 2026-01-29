/**
 * APP-14: DECISION SUPPORT AI
 * AI-powered decision support and recommendations
 * Automation Level: AI-driven
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES, getAllQueueMetrics } from '../../../shared/queue.js';
import { getEventBus, EVENT_TYPES } from '../../../shared/events.js';
import { generateJSON, generateText, predictProjectRisks } from '../../../shared/ai/claude.js';
import { formatCurrency, calculatePercentage } from '../../../shared/utils/money.js';
import { formatDate, daysUntilDeadline } from '../../../shared/utils/date.js';

const prisma = new PrismaClient();
const eventBus = getEventBus('decision-support');

// ============================================================================
// TYPES
// ============================================================================

interface DecisionContext {
  projectId: string;
  type: DecisionType;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  data: Record<string, any>;
}

type DecisionType =
  | 'CONTRACTOR_SELECTION'
  | 'CHANGE_ORDER_APPROVAL'
  | 'SCHEDULE_RECOVERY'
  | 'BUDGET_REALLOCATION'
  | 'RESOURCE_ALLOCATION'
  | 'RISK_MITIGATION'
  | 'QUALITY_ISSUE'
  | 'PERMIT_STRATEGY'
  | 'VENDOR_SELECTION'
  | 'SCOPE_CHANGE';

interface Decision {
  id: string;
  projectId: string;
  type: DecisionType;
  title: string;
  context: DecisionContext;
  options: DecisionOption[];
  recommendation: number;
  reasoning: string;
  riskAnalysis: RiskAnalysis;
  impacts: Impact[];
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  decidedBy?: string;
  decidedAt?: Date;
  outcome?: DecisionOutcome;
  createdAt: Date;
}

interface DecisionOption {
  id: number;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  estimatedCost: number;
  estimatedTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
}

interface RiskAnalysis {
  overallRisk: 'low' | 'medium' | 'high';
  scheduleRisk: number;
  budgetRisk: number;
  qualityRisk: number;
  factors: RiskFactor[];
}

interface RiskFactor {
  name: string;
  severity: number;
  likelihood: number;
  impact: string;
  mitigation: string;
}

interface Impact {
  area: 'schedule' | 'budget' | 'quality' | 'scope' | 'resources' | 'stakeholders';
  description: string;
  magnitude: 'low' | 'medium' | 'high';
}

interface DecisionOutcome {
  optionChosen: number;
  actualCost?: number;
  actualTime?: number;
  success: boolean;
  notes?: string;
  recordedAt: Date;
}

interface ProjectInsight {
  category: 'opportunity' | 'risk' | 'trend' | 'anomaly';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  metrics?: Record<string, any>;
  relatedDecisions?: string[];
}

interface DashboardData {
  projectId: string;
  healthScore: number;
  pendingDecisions: number;
  criticalIssues: number;
  insights: ProjectInsight[];
  metrics: {
    schedule: { status: string; variance: number };
    budget: { status: string; variance: number };
    quality: { score: number; trend: string };
    safety: { incidents: number; rating: string };
  };
  recommendations: string[];
}

// ============================================================================
// DECISION SUPPORT SERVICE
// ============================================================================

class DecisionSupportService {
  /**
   * Generate decision options using AI
   */
  async generateDecisionOptions(context: DecisionContext): Promise<{
    options: DecisionOption[];
    recommendation: number;
    reasoning: string;
  }> {
    const project = await prisma.project.findUnique({
      where: { id: context.projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const prompt = `Analyze this construction project decision and provide options:

Project: ${project.name}
Decision Type: ${context.type}
Urgency: ${context.urgency}
Context Data: ${JSON.stringify(context.data, null, 2)}

Provide 3-4 decision options in JSON format with:
- options: array of { id, title, description, pros, cons, estimatedCost, estimatedTime, riskLevel, confidence }
- recommendation: index of recommended option (0-based)
- reasoning: explanation of recommendation`;

    const result = await (generateJSON as any)({
      systemPrompt: 'You are a construction project management AI advisor. Provide balanced, practical decision options with clear trade-offs.',
      userPrompt: prompt,
    }) as {
      options: DecisionOption[];
      recommendation: number;
      reasoning: string;
    };

    return result;
  }

  /**
   * Analyze risks for a decision
   */
  async analyzeRisks(context: DecisionContext): Promise<RiskAnalysis> {
    const prompt = `Analyze risks for this construction decision:

Type: ${context.type}
Urgency: ${context.urgency}
Context: ${JSON.stringify(context.data, null, 2)}

Provide risk analysis in JSON format:
- overallRisk: low/medium/high
- scheduleRisk: 0-100
- budgetRisk: 0-100
- qualityRisk: 0-100
- factors: array of { name, severity (0-10), likelihood (0-100), impact, mitigation }`;

    return await (generateJSON as any)({
      systemPrompt: 'You are a construction risk analyst. Identify and quantify project risks.',
      userPrompt: prompt,
    }) as RiskAnalysis;
  }

  /**
   * Calculate project health score
   */
  async calculateHealthScore(projectId: string): Promise<number> {
    const [project, budget, schedule, quality] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: true,
          budgetAlerts: { where: { acknowledged: false } },
        },
      } as any),
      prisma.budgetSnapshot.findFirst({
        where: { projectId },
        orderBy: { snapshotDate: 'desc' },
      }),
      prisma.task.aggregate({
        where: { projectId, status: 'COMPLETE' },
        _count: true,
      } as any),
      (prisma as any).qAInspection.aggregate({
        where: { projectId, status: 'passed' },
        _avg: { score: true },
      } as any),
    ]);

    if (!project) return 0;

    let score = 100;

    // Budget impact (30 points max)
    if (budget) {
      const budgetVariance = Math.abs((budget as any).variancePercent || 0);
      score -= Math.min(30, budgetVariance * 3);
    }

    // Schedule impact (30 points max)
    const totalTasks = (project as any).tasks?.length || 1;
    const completedTasks = (schedule as any)._count || 0;
    const plannedCompletion = (project as any).percentComplete || 0;
    const actualCompletion = (completedTasks / totalTasks) * 100;
    const scheduleVariance = Math.abs(plannedCompletion - actualCompletion);
    score -= Math.min(30, scheduleVariance * 1.5);

    // Quality impact (20 points max)
    const avgQuality = (quality._avg as any)?.score || 80;
    if (avgQuality < 70) score -= 20;
    else if (avgQuality < 80) score -= 10;
    else if (avgQuality < 90) score -= 5;

    // Active alerts impact (20 points max)
    const alertCount = (project as any).budgetAlerts?.length || 0;
    score -= Math.min(20, alertCount * 5);

    return Math.max(0, Math.round(score));
  }

  /**
   * Generate project insights
   */
  async generateInsights(projectId: string): Promise<ProjectInsight[]> {
    const [project, recentInspections, recentAlerts, tasks] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: {
          budgetSnapshots: { take: 5, orderBy: { snapshotDate: 'desc' } },
        },
      } as any),
      (prisma as any).qAInspection.findMany({
        where: { projectId, completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        include: { findings: true },
      } as any),
      prisma.budgetAlert.findMany({
        where: { projectId, acknowledged: false },
      }),
      prisma.task.findMany({
        where: { projectId, status: { not: 'COMPLETE' } },
        orderBy: { endDate: 'asc' },
        take: 10,
      } as any),
    ]);

    if (!project) return [];

    const insights: ProjectInsight[] = [];

    // Budget trend analysis
    const snapshots = (project as any).budgetSnapshots || [];
    if (snapshots.length >= 2) {
      const latest = snapshots[0];
      const previous = snapshots[snapshots.length - 1];
      const varianceChange = (latest.variancePercent || 0) - (previous.variancePercent || 0);

      if (varianceChange > 5) {
        insights.push({
          category: 'risk',
          severity: 'warning',
          title: 'Budget Variance Increasing',
          description: `Budget variance has increased by ${varianceChange.toFixed(1)}% over recent snapshots.`,
          recommendation: 'Review recent expenditures and identify cost-saving opportunities.',
          metrics: { varianceChange, currentVariance: latest.variancePercent },
        });
      } else if (varianceChange < -5) {
        insights.push({
          category: 'opportunity',
          severity: 'info',
          title: 'Budget Performance Improving',
          description: `Budget variance has decreased by ${Math.abs(varianceChange).toFixed(1)}%.`,
          recommendation: 'Continue current cost management practices.',
          metrics: { varianceChange, currentVariance: latest.variancePercent },
        });
      }
    }

    // Quality trend
    const failedInspections = recentInspections.filter(i => i.status === 'failed');
    if (failedInspections.length > 2) {
      insights.push({
        category: 'risk',
        severity: 'critical',
        title: 'Quality Issues Detected',
        description: `${failedInspections.length} inspections failed in the past week.`,
        recommendation: 'Conduct root cause analysis and implement corrective actions.',
        metrics: { failedCount: failedInspections.length, totalCount: recentInspections.length },
      });
    }

    // Critical findings
    const criticalFindings = recentInspections.flatMap(i =>
      (i as any).findings?.filter((f: any) => f.severity === 'critical') || []
    );
    if (criticalFindings.length > 0) {
      insights.push({
        category: 'risk',
        severity: 'critical',
        title: 'Critical QA Findings',
        description: `${criticalFindings.length} critical quality findings require immediate attention.`,
        recommendation: 'Address critical findings before proceeding with related work.',
        metrics: { criticalCount: criticalFindings.length },
      });
    }

    // Upcoming deadline pressure
    const urgentTasks = tasks.filter(t => {
      const daysLeft = daysUntilDeadline((t as any).endDate);
      return daysLeft >= 0 && daysLeft <= 3;
    });
    if (urgentTasks.length > 3) {
      insights.push({
        category: 'risk',
        severity: 'warning',
        title: 'Multiple Urgent Deadlines',
        description: `${urgentTasks.length} tasks due within the next 3 days.`,
        recommendation: 'Prioritize resources and consider overtime if needed.',
        metrics: { urgentCount: urgentTasks.length },
      });
    }

    // Unacknowledged alerts
    if (recentAlerts.length > 3) {
      insights.push({
        category: 'anomaly',
        severity: 'warning',
        title: 'Unaddressed Alerts',
        description: `${recentAlerts.length} alerts require acknowledgment and action.`,
        recommendation: 'Review and address pending alerts to prevent escalation.',
        metrics: { alertCount: recentAlerts.length },
      });
    }

    return insights;
  }

  /**
   * Generate executive dashboard
   */
  async generateDashboard(projectId: string): Promise<DashboardData> {
    const [
      healthScore,
      insights,
      pendingDecisions,
      project,
      latestBudget,
      qualityScore,
    ] = await Promise.all([
      this.calculateHealthScore(projectId),
      this.generateInsights(projectId),
      (prisma as any).decision.count({ where: { projectId, status: 'pending' } }),
      prisma.project.findUnique({
        where: { id: projectId },
        include: { tasks: true },
      } as any),
      prisma.budgetSnapshot.findFirst({
        where: { projectId },
        orderBy: { snapshotDate: 'desc' },
      }),
      (prisma as any).qAInspection.aggregate({
        where: { projectId },
        _avg: { score: true },
      } as any),
    ]);

    const criticalIssues = insights.filter(i => i.severity === 'critical').length;

    // Calculate schedule status
    const completedTasks = (project as any)?.tasks?.filter((t: any) => t.status === 'COMPLETE').length || 0;
    const totalTasks = (project as any)?.tasks?.length || 1;
    const actualProgress = (completedTasks / totalTasks) * 100;
    const plannedProgress = (project as any)?.percentComplete || 0;
    const scheduleVariance = actualProgress - plannedProgress;

    // Generate recommendations
    const recommendations: string[] = [];
    if (healthScore < 60) {
      recommendations.push('Project health is below threshold - schedule management review');
    }
    if (criticalIssues > 0) {
      recommendations.push(`Address ${criticalIssues} critical issues immediately`);
    }
    if (pendingDecisions > 3) {
      recommendations.push('Clear pending decisions to maintain project momentum');
    }

    return {
      projectId,
      healthScore,
      pendingDecisions,
      criticalIssues,
      insights,
      metrics: {
        schedule: {
          status: scheduleVariance >= 0 ? 'on-track' : 'delayed',
          variance: scheduleVariance,
        },
        budget: {
          status: (latestBudget as any)?.variancePercent <= 0 ? 'under' :
            (latestBudget as any)?.variancePercent <= 5 ? 'on-track' : 'over',
          variance: (latestBudget as any)?.variancePercent || 0,
        },
        quality: {
          score: Math.round((qualityScore._avg as any)?.score || 0),
          trend: 'stable',
        },
        safety: {
          incidents: 0,
          rating: 'A',
        },
      },
      recommendations,
    };
  }

  /**
   * Compare historical decisions for learning
   */
  async learnFromHistory(
    projectId: string,
    decisionType: DecisionType
  ): Promise<{
    successfulPatterns: string[];
    failurePatterns: string[];
    recommendations: string[];
  }> {
    const historicalDecisions = await (prisma as any).decision.findMany({
      where: {
        type: decisionType,
        status: 'accepted',
        outcome: { isNot: null },
      },
      take: 50,
      orderBy: { decidedAt: 'desc' },
    } as any);

    const successful = historicalDecisions.filter(d => (d as any).outcome?.success);
    const failed = historicalDecisions.filter(d => !(d as any).outcome?.success);

    // Analyze patterns
    const successfulPatterns: string[] = [];
    const failurePatterns: string[] = [];

    if (successful.length > 0) {
      // Analyze common factors in successful decisions
      const avgCost = successful.reduce((s, d) =>
        s + ((d as any).outcome?.actualCost || 0), 0) / successful.length;
      successfulPatterns.push(`Average cost of successful decisions: ${formatCurrency(avgCost)}`);

      const avgTime = successful.reduce((s, d) =>
        s + ((d as any).outcome?.actualTime || 0), 0) / successful.length;
      successfulPatterns.push(`Average time for successful decisions: ${avgTime.toFixed(1)} days`);
    }

    if (failed.length > 0) {
      // Analyze common factors in failed decisions
      const highRiskFailures = failed.filter(d =>
        (d as any).options?.[(d as any).outcome?.optionChosen]?.riskLevel === 'high'
      );
      if (highRiskFailures.length > failed.length / 2) {
        failurePatterns.push('High-risk options have higher failure rate');
      }
    }

    const recommendations = [
      'Consider historical success factors when making decisions',
      'Avoid patterns that led to previous failures',
    ];

    return { successfulPatterns, failurePatterns, recommendations };
  }
}

const decisionService = new DecisionSupportService();

// ============================================================================
// WORKER
// ============================================================================

async function processDecisionJob(job: Job): Promise<any> {
  const { type, ...data } = job.data;

  switch (type) {
    case 'GENERATE_OPTIONS':
      return await generateDecisionOptions(data.context);

    case 'ANALYZE_RISKS':
      return await decisionService.analyzeRisks(data.context);

    case 'CREATE_DECISION':
      return await createDecision(data);

    case 'GENERATE_DASHBOARD':
      return await decisionService.generateDashboard(data.projectId);

    case 'GENERATE_INSIGHTS':
      return await decisionService.generateInsights(data.projectId);

    case 'LEARN_FROM_HISTORY':
      return await decisionService.learnFromHistory(data.projectId, data.decisionType);

    case 'RECORD_OUTCOME':
      return await recordDecisionOutcome(data.decisionId, data.outcome);

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

async function generateDecisionOptions(context: DecisionContext) {
  const result = await decisionService.generateDecisionOptions(context);
  const risks = await decisionService.analyzeRisks(context);

  return { ...result, riskAnalysis: risks };
}

async function createDecision(data: {
  projectId: string;
  type: DecisionType;
  title: string;
  context: DecisionContext;
}) {
  // Generate options and analysis
  const { options, recommendation, reasoning, riskAnalysis } = await generateDecisionOptions(data.context);

  // Determine impacts
  const impacts = await determineImpacts(data.type, data.context);

  // Create decision record
  const decision = await (prisma as any).decision.create({
    data: {
      projectId: data.projectId,
      type: data.type,
      title: data.title,
      context: data.context as any,
      options: options as any,
      recommendation,
      reasoning,
      riskAnalysis: riskAnalysis as any,
      impacts: impacts as any,
      status: 'pending',
    } as any,
  });

  // Emit event
  await eventBus.publish((EVENT_TYPES as any).DECISION_REQUIRED, {
    decisionId: decision.id,
    projectId: data.projectId,
    type: data.type,
    title: data.title,
    urgency: data.context.urgency,
  });

  return decision;
}

async function determineImpacts(type: DecisionType, context: DecisionContext): Promise<Impact[]> {
  const impacts: Impact[] = [];

  switch (type) {
    case 'CHANGE_ORDER_APPROVAL':
      impacts.push(
        { area: 'budget', description: 'Budget adjustment required', magnitude: 'medium' },
        { area: 'schedule', description: 'Potential schedule impact', magnitude: 'low' }
      );
      break;
    case 'SCHEDULE_RECOVERY':
      impacts.push(
        { area: 'schedule', description: 'Schedule compression', magnitude: 'high' },
        { area: 'resources', description: 'Additional resources may be needed', magnitude: 'medium' }
      );
      break;
    case 'CONTRACTOR_SELECTION':
      impacts.push(
        { area: 'quality', description: 'Work quality dependent on selection', magnitude: 'high' },
        { area: 'budget', description: 'Cost commitment', magnitude: 'high' }
      );
      break;
    case 'BUDGET_REALLOCATION':
      impacts.push(
        { area: 'budget', description: 'Line item changes', magnitude: 'medium' },
        { area: 'scope', description: 'Possible scope adjustments', magnitude: 'low' }
      );
      break;
    default:
      impacts.push(
        { area: 'scope', description: 'General project impact', magnitude: 'medium' }
      );
  }

  return impacts;
}

async function recordDecisionOutcome(decisionId: string, outcome: DecisionOutcome) {
  const decision = await (prisma as any).decision.update({
    where: { id: decisionId },
    data: {
      outcome: outcome as any,
    },
  });

  // Emit event for learning
  await eventBus.publish((EVENT_TYPES as any).DECISION_OUTCOME_RECORDED, {
    decisionId,
    type: (decision as any).type,
    success: outcome.success,
  });

  return decision;
}

// Create worker
export const decisionSupportWorker = createWorker(
  QUEUE_NAMES.DECISION_SUPPORT,
  processDecisionJob
);

// ============================================================================
// ROUTES
// ============================================================================

export async function decisionSupportRoutes(fastify: FastifyInstance) {
  /**
   * Get pending decisions for a project
   */
  fastify.get('/projects/:projectId/decisions', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { status } = request.query as { status?: string };

    const decisions = await (prisma as any).decision.findMany({
      where: {
        projectId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return { decisions };
  });

  /**
   * Get decision by ID
   */
  fastify.get('/decisions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const decision = await (prisma as any).decision.findUnique({
      where: { id },
    });

    if (!decision) {
      return reply.status(404).send({ error: 'Decision not found' });
    }

    return decision;
  });

  /**
   * Create new decision request
   */
  fastify.post('/decisions', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as {
      projectId: string;
      type: DecisionType;
      title: string;
      context: DecisionContext;
    };

    const job = await queues.DECISION_SUPPORT.add(
      'create-decision',
      { type: 'CREATE_DECISION', ...data },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'generating' };
  });

  /**
   * Accept a decision option
   */
  fastify.post('/decisions/:id/accept', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { optionId, decidedBy, notes } = request.body as {
      optionId: number;
      decidedBy: string;
      notes?: string;
    };

    const decision = await (prisma as any).decision.update({
      where: { id },
      data: {
        status: 'accepted',
        decidedBy,
        decidedAt: new Date(),
        acceptedOption: optionId,
        decisionNotes: notes,
      } as any,
    });

    // Emit event
    await eventBus.publish((EVENT_TYPES as any).DECISION_MADE, {
      decisionId: id,
      projectId: decision.projectId,
      type: (decision as any).type,
      optionChosen: optionId,
    });

    return decision;
  });

  /**
   * Record decision outcome
   */
  fastify.post('/decisions/:id/outcome', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const outcome = request.body as DecisionOutcome;

    const decision = await recordDecisionOutcome(id, outcome);
    return decision;
  });

  /**
   * Get project dashboard
   */
  fastify.get('/projects/:projectId/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const dashboard = await decisionService.generateDashboard(projectId);
    return dashboard;
  });

  /**
   * Get project insights
   */
  fastify.get('/projects/:projectId/insights', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const insights = await decisionService.generateInsights(projectId);
    return { insights };
  });

  /**
   * Get project health score
   */
  fastify.get('/projects/:projectId/health', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const healthScore = await decisionService.calculateHealthScore(projectId);
    return { projectId, healthScore };
  });

  /**
   * Learn from historical decisions
   */
  fastify.get('/learn/:decisionType', async (request: FastifyRequest, reply: FastifyReply) => {
    const { decisionType } = request.params as { decisionType: DecisionType };
    const { projectId } = request.query as { projectId?: string };

    const learning = await decisionService.learnFromHistory(
      projectId || '',
      decisionType
    );

    return learning;
  });

  /**
   * Get decision types
   */
  fastify.get('/types', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      types: [
        { id: 'CONTRACTOR_SELECTION', label: 'Contractor Selection' },
        { id: 'CHANGE_ORDER_APPROVAL', label: 'Change Order Approval' },
        { id: 'SCHEDULE_RECOVERY', label: 'Schedule Recovery' },
        { id: 'BUDGET_REALLOCATION', label: 'Budget Reallocation' },
        { id: 'RESOURCE_ALLOCATION', label: 'Resource Allocation' },
        { id: 'RISK_MITIGATION', label: 'Risk Mitigation' },
        { id: 'QUALITY_ISSUE', label: 'Quality Issue Resolution' },
        { id: 'PERMIT_STRATEGY', label: 'Permit Strategy' },
        { id: 'VENDOR_SELECTION', label: 'Vendor Selection' },
        { id: 'SCOPE_CHANGE', label: 'Scope Change' },
      ],
    };
  });

  /**
   * Platform-wide dashboard
   */
  fastify.get('/platform/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    const [
      totalProjects,
      activeProjects,
      pendingDecisions,
      queueMetrics,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: { in: ['IN_PROGRESS', 'ACTIVE'] } } }),
      (prisma as any).decision.count({ where: { status: 'pending' } }),
      getAllQueueMetrics(),
    ]);

    // Calculate queue health
    const totalWaiting = Object.values(queueMetrics as any).reduce((s: number, m: any) => s + m.waiting, 0);
    const totalActive = Object.values(queueMetrics as any).reduce((s: number, m: any) => s + m.active, 0);
    const totalFailed = Object.values(queueMetrics as any).reduce((s: number, m: any) => s + m.failed, 0);

    return {
      projects: {
        total: totalProjects,
        active: activeProjects,
      },
      decisions: {
        pending: pendingDecisions,
      },
      queues: {
        waiting: totalWaiting,
        active: totalActive,
        failed: totalFailed,
        health: (totalFailed as number) === 0 ? 'healthy' : (totalFailed as number) < 10 ? 'degraded' : 'critical',
      },
      timestamp: new Date().toISOString(),
    };
  });

  /**
   * Dashboard metrics
   */
  fastify.get('/dashboard/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const [
      pendingDecisions,
      acceptedToday,
      avgResponseTime,
    ] = await Promise.all([
      (prisma as any).decision.count({ where: { status: 'pending' } }),
      (prisma as any).decision.count({
        where: {
          status: 'accepted',
          decidedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      (prisma as any).decision.aggregate({
        where: { status: 'accepted' },
        _avg: { responseTimeMinutes: true },
      } as any),
    ]);

    return {
      pendingDecisions,
      acceptedToday,
      avgResponseTime: Math.round((avgResponseTime._avg as any)?.responseTimeMinutes || 0),
    };
  });
}
