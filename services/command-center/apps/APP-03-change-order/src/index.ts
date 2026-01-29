/**
 * APP-03: CHANGE ORDER PROCESSOR
 * Automation Level: 75%
 *
 * Features:
 * - Change order request intake
 * - AI-powered cost and schedule impact analysis
 * - Risk level assignment
 * - Multi-party approval workflow
 * - Budget integration
 * - Document generation
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
import { analyzeChangeOrderImpact } from '../../../shared/ai/claude.js';
import { sendEmail, EMAIL_TEMPLATES } from '../../../shared/integrations/email.js';
import { formatCurrency, calculateChangeOrderImpact } from '../../../shared/utils/money.js';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

export type ChangeOrderSource = 'CLIENT' | 'PM' | 'CONTRACTOR' | 'FIELD';
export type ChangeOrderStatus =
  | 'DRAFT'
  | 'PENDING_ANALYSIS'
  | 'ANALYZED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ChangeOrderRequest {
  projectId: string;
  requestedBy: ChangeOrderSource;
  description: string;
  reason: string;
  estimatedCost: number;
  scheduleDaysAffected: number;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitCost: number;
    total: number;
  }>;
  attachments?: string[];
}

export interface ImpactAnalysis {
  costImpact: {
    amount: number;
    percentOfBudget: number;
    newBudgetTotal: number;
    riskLevel: RiskLevel;
  };
  scheduleImpact: {
    additionalDays: number;
    newVariance: number;
    criticalPathAffected: boolean;
    riskLevel: RiskLevel;
  };
  recommendation: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'NEEDS_REVIEW' | 'REJECT';
  conditions: string[];
  narrative: string;
}

// ============================================================================
// CHANGE ORDER SERVICE
// ============================================================================

class ChangeOrderService {
  /**
   * Create a new change order
   */
  async createChangeOrder(request: ChangeOrderRequest): Promise<{ id: string; number: number }> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: request.projectId },
    });

    // Get next change order number for project
    const lastCO = await prisma.changeOrder.findFirst({
      where: { projectId: request.projectId },
      orderBy: { number: 'desc' },
    });
    const nextNumber = (lastCO?.number || 0) + 1;

    const changeOrder = await prisma.changeOrder.create({
      data: {
        project: { connect: { id: request.projectId } },
        changeOrderNumber: `CO-${nextNumber.toString().padStart(4, '0')}`,
        title: request.description.substring(0, 100),
        number: nextNumber,
        requestedBy: request.requestedBy,
        description: request.description,
        reason: request.reason,
        estimatedCost: request.estimatedCost,
        originalAmount: request.estimatedCost || 0,
        totalCost: request.estimatedCost || 0,
        scheduleDaysAffected: request.scheduleDaysAffected,
        lineItems: request.lineItems ? {
          create: request.lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit: 'EA',
            unitCost: item.unitCost,
            totalCost: item.total,
          })),
        } : undefined,
        status: 'PENDING_ANALYSIS',
      },
    });

    // Emit event
    await getEventBus('change-order').publish(
      EVENT_TYPES.CHANGE_ORDER_CREATED,
      {
        changeOrderId: changeOrder.id,
        projectId: request.projectId,
        projectName: project.name,
        number: nextNumber,
        estimatedCost: request.estimatedCost,
        requestedBy: request.requestedBy,
      }
    );

    // Queue impact analysis
    await queues.CHANGE_ORDER.add(
      'analyze-impact',
      { type: 'ANALYZE_IMPACT', changeOrderId: changeOrder.id },
      JOB_OPTIONS.DEFAULT
    );

    return { id: changeOrder.id, number: nextNumber };
  }

  /**
   * Analyze change order impact
   */
  async analyzeImpact(changeOrderId: string): Promise<ImpactAnalysis> {
    const changeOrder = await prisma.changeOrder.findUniqueOrThrow({
      where: { id: changeOrderId },
      include: { project: true },
    });

    // Get project budget info
    const budgetData = await prisma.budgetEntry.aggregate({
      where: { projectId: changeOrder.projectId },
      _sum: { amount: true },
    });

    const existingCOs = await prisma.changeOrder.aggregate({
      where: {
        projectId: changeOrder.projectId,
        status: 'APPROVED',
        id: { not: changeOrderId },
      },
      _sum: { approvedCost: true },
    });

    // Get schedule info
    const scheduleVariance = await this.calculateScheduleVariance(changeOrder.projectId);

    // AI-powered analysis
    const analysis = await analyzeChangeOrderImpact({
      projectName: changeOrder.project.name,
      changeOrderNumber: changeOrder.number,
      description: changeOrder.description,
      requestedBy: changeOrder.requestedBy,
      estimatedCost: Number(changeOrder.estimatedCost),
      currentBudget: Number(changeOrder.project.budget),
      currentSpend: Number(budgetData._sum.amount || 0),
      scheduleDaysAffected: changeOrder.scheduleDaysAffected,
      currentScheduleVariance: scheduleVariance,
      projectPhase: changeOrder.project.currentPhase || 'CONSTRUCTION',
    });

    // Determine risk levels
    const costRiskLevel = this.determineCostRisk(
      analysis.costImpact.percentOfBudget
    );
    const scheduleRiskLevel = this.determineScheduleRisk(
      analysis.scheduleImpact.additionalDays,
      analysis.scheduleImpact.criticalPathAffected
    );

    const impactAnalysis: ImpactAnalysis = {
      costImpact: {
        ...analysis.costImpact,
        riskLevel: costRiskLevel,
      },
      scheduleImpact: {
        ...analysis.scheduleImpact,
        riskLevel: scheduleRiskLevel,
      },
      recommendation: analysis.recommendation,
      conditions: analysis.conditions,
      narrative: analysis.narrative,
    };

    // Store analysis
    await prisma.changeOrder.update({
      where: { id: changeOrderId },
      data: {
        impactAnalysis: impactAnalysis as object,
        status: 'ANALYZED',
        reviewedAt: new Date(),
        aiRecommendation: Math.max(
          this.riskToNumber(costRiskLevel),
          this.riskToNumber(scheduleRiskLevel)
        ) >= 3 ? 'HIGH_RISK' : 'APPROVED',
      },
    });

    // Emit event
    await getEventBus('change-order').publish(
      EVENT_TYPES.CHANGE_ORDER_ANALYZED,
      {
        changeOrderId,
        projectId: changeOrder.projectId,
        recommendation: impactAnalysis.recommendation,
        costImpact: impactAnalysis.costImpact.amount,
        scheduleImpact: impactAnalysis.scheduleImpact.additionalDays,
      }
    );

    return impactAnalysis;
  }

  /**
   * Initiate approval workflow
   */
  async initiateApproval(changeOrderId: string): Promise<{ approvers: string[] }> {
    const changeOrder = await prisma.changeOrder.findUniqueOrThrow({
      where: { id: changeOrderId },
      include: {
        project: { include: { client: true } },
      },
    });

    const analysis = changeOrder.impactAnalysis as unknown as ImpactAnalysis;
    const approvers: string[] = [];

    // Determine required approvers based on impact
    const costPercent = analysis?.costImpact?.percentOfBudget || 0;

    // PM approval always required
    if (changeOrder.project.pmId) {
      approvers.push(changeOrder.project.pmId);
    }

    // Client approval for significant changes (>5% of budget)
    if (costPercent > 5 && changeOrder.project.client?.email) {
      approvers.push(changeOrder.project.clientId!);
    }

    // Executive approval for major changes (>15% of budget)
    if (costPercent > 15) {
      // Add operations manager
      const opsManager = await prisma.user.findFirst({
        where: { role: 'OPERATIONS_MANAGER' },
      });
      if (opsManager) approvers.push(opsManager.id);
    }

    // Create approval records
    for (const approverId of approvers) {
      await prisma.changeOrderApproval.create({
        data: {
          changeOrder: { connect: { id: changeOrderId } },
          approver: { connect: { id: approverId } },
          role: approverId === changeOrder.project.pmId ? 'PM' : 'OWNER',
          status: 'PENDING',
        },
      });
    }

    // Update status
    await prisma.changeOrder.update({
      where: { id: changeOrderId },
      data: { status: 'PENDING_APPROVAL' },
    });

    // Send approval request notifications
    for (const approverId of approvers) {
      const approver = await prisma.user.findUnique({
        where: { id: approverId },
      });

      if (approver?.email) {
        await sendEmail({
          to: approver.email,
          templateId: EMAIL_TEMPLATES.CHANGE_ORDER_REQUEST,
          dynamicTemplateData: {
            approver_name: approver.name,
            project_name: changeOrder.project.name,
            co_number: changeOrder.number,
            description: changeOrder.description,
            estimated_cost: formatCurrency(Number(changeOrder.estimatedCost)),
            recommendation: analysis?.recommendation,
            approval_link: `${process.env.APP_URL}/change-orders/${changeOrderId}/approve`,
          },
        });
      }
    }

    return { approvers };
  }

  /**
   * Process approval decision
   */
  async processApproval(
    changeOrderId: string,
    approverId: string,
    decision: 'APPROVED' | 'REJECTED',
    comments?: string
  ): Promise<{ status: ChangeOrderStatus; allApproved: boolean }> {
    // Update approval record
    await prisma.changeOrderApproval.updateMany({
      where: { changeOrderId, approverId },
      data: {
        status: decision,
        comments,
        decidedAt: new Date(),
      },
    });

    // Check all approvals
    const approvals = await prisma.changeOrderApproval.findMany({
      where: { changeOrderId },
    });

    const allDecided = approvals.every(a => a.status !== 'PENDING');
    const allApproved = approvals.every(a => a.status === 'APPROVED');
    const anyRejected = approvals.some(a => a.status === 'REJECTED');

    let newStatus: ChangeOrderStatus = 'PENDING_APPROVAL';

    if (anyRejected) {
      newStatus = 'REJECTED';
    } else if (allDecided && allApproved) {
      newStatus = 'APPROVED';
    }

    const changeOrder = await prisma.changeOrder.update({
      where: { id: changeOrderId },
      data: {
        status: newStatus,
        ...(newStatus === 'APPROVED' && {
          approvedAt: new Date(),
          approvedCost: (await prisma.changeOrder.findUnique({
            where: { id: changeOrderId },
          }))?.estimatedCost,
        }),
      },
      include: { project: true },
    });

    // Emit appropriate event
    if (newStatus === 'APPROVED') {
      await getEventBus('change-order').publish(
        EVENT_TYPES.CHANGE_ORDER_APPROVED,
        {
          changeOrderId,
          projectId: changeOrder.projectId,
          projectName: changeOrder.project.name,
          number: changeOrder.number,
          approvedCost: Number(changeOrder.approvedCost),
        }
      );

      // Update project budget
      await queues.BUDGET_TRACKER.add(
        'adjust-budget',
        {
          type: 'ADJUST_BUDGET',
          projectId: changeOrder.projectId,
          changeOrderId,
          amount: Number(changeOrder.approvedCost),
        },
        JOB_OPTIONS.DEFAULT
      );
    } else if (newStatus === 'REJECTED') {
      await getEventBus('change-order').publish(
        EVENT_TYPES.CHANGE_ORDER_REJECTED,
        {
          changeOrderId,
          projectId: changeOrder.projectId,
          number: changeOrder.number,
        }
      );
    }

    return { status: newStatus, allApproved };
  }

  private async calculateScheduleVariance(projectId: string): Promise<number> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { scheduledEndDate: true, projectedEndDate: true },
    });

    if (!project?.scheduledEndDate || !project?.projectedEndDate) return 0;

    const diff = project.projectedEndDate.getTime() - project.scheduledEndDate.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  private determineCostRisk(percentOfBudget: number): RiskLevel {
    if (percentOfBudget <= 2) return 'LOW';
    if (percentOfBudget <= 5) return 'MEDIUM';
    if (percentOfBudget <= 10) return 'HIGH';
    return 'CRITICAL';
  }

  private determineScheduleRisk(days: number, criticalPath: boolean): RiskLevel {
    if (criticalPath) {
      if (days <= 3) return 'MEDIUM';
      if (days <= 7) return 'HIGH';
      return 'CRITICAL';
    }
    if (days <= 5) return 'LOW';
    if (days <= 14) return 'MEDIUM';
    return 'HIGH';
  }

  private riskToNumber(risk: RiskLevel): number {
    const map: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    return map[risk];
  }
}

// ============================================================================
// WORKER
// ============================================================================

const service = new ChangeOrderService();

type ChangeOrderJob =
  | { type: 'CREATE_CHANGE_ORDER'; request: ChangeOrderRequest }
  | { type: 'ANALYZE_IMPACT'; changeOrderId: string }
  | { type: 'INITIATE_APPROVAL'; changeOrderId: string }
  | { type: 'PROCESS_APPROVAL'; changeOrderId: string; approverId: string; decision: 'APPROVED' | 'REJECTED'; comments?: string };

async function processChangeOrderJob(job: Job<ChangeOrderJob>): Promise<unknown> {
  console.log(`[ChangeOrder] Processing job: ${job.data.type} (${job.id})`);

  switch (job.data.type) {
    case 'CREATE_CHANGE_ORDER':
      return service.createChangeOrder(job.data.request);
    case 'ANALYZE_IMPACT':
      return service.analyzeImpact(job.data.changeOrderId);
    case 'INITIATE_APPROVAL':
      return service.initiateApproval(job.data.changeOrderId);
    case 'PROCESS_APPROVAL':
      return service.processApproval(
        job.data.changeOrderId,
        job.data.approverId,
        job.data.decision,
        job.data.comments
      );
    default:
      throw new Error(`Unknown job type`);
  }
}

export const changeOrderWorker = createWorker(
  QUEUE_NAMES.CHANGE_ORDER,
  processChangeOrderJob,
  { concurrency: 3 }
);

// ============================================================================
// API ROUTES
// ============================================================================

export async function changeOrderRoutes(fastify: FastifyInstance) {
  fastify.post('/change-orders', async (request: FastifyRequest) => {
    const body = request.body as ChangeOrderRequest;
    return service.createChangeOrder(body);
  });

  fastify.get('/change-orders/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const co = await prisma.changeOrder.findUnique({
      where: { id },
      include: {
        project: { select: { name: true } },
        approvals: { include: { approver: { select: { name: true, email: true } } } },
      },
    });
    if (!co) return reply.status(404).send({ error: 'Not found' });
    return co;
  });

  fastify.post('/change-orders/:id/analyze', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    return service.analyzeImpact(id);
  });

  fastify.post('/change-orders/:id/submit', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    return service.initiateApproval(id);
  });

  fastify.post('/change-orders/:id/approve', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const { approverId, decision, comments } = request.body as {
      approverId: string;
      decision: 'APPROVED' | 'REJECTED';
      comments?: string;
    };
    return service.processApproval(id, approverId, decision, comments);
  });

  fastify.get('/projects/:projectId/change-orders', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };
    return prisma.changeOrder.findMany({
      where: { projectId },
      orderBy: { number: 'desc' },
    });
  });
}

export { ChangeOrderService };
