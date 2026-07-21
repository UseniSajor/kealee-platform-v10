import { PrismaClient } from '@prisma/client';
import { generateJSON } from '../../infrastructure/ai.js';
import { AI_PROMPTS } from '../../infrastructure/ai-prompts.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';

const prisma = new PrismaClient();
const SOURCE_APP = 'APP-14';

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

type DecisionType = 'bid_award' | 'change_order' | 'payment_release' | 'schedule_change';

interface CreateDecisionOpts {
  projectId: string;
  pmId: string;
  type: DecisionType;
  title: string;
  contextData: Record<string, any>;
}

interface ResolveDecisionOpts {
  decision: string;
  decidedBy: string;
  reasoning?: string;
}

interface AIRecommendation {
  recommendation: 'approve' | 'reject' | 'defer' | 'negotiate';
  confidence: number;
  reasoning: string;
  risks: string[];
  alternatives: string[];
  financialImpact: string;
  scheduleImpact: string;
}

/** Options presented to the decision maker per type. */
const OPTIONS_BY_TYPE: Record<DecisionType, Array<{ action: string; label: string }>> = {
  bid_award: [
    { action: 'award_to_recommended', label: 'Award to Recommended Contractor' },
    { action: 'award_to_other', label: 'Award to Different Contractor' },
    { action: 'request_rebid', label: 'Request New Bids' },
  ],
  change_order: [
    { action: 'approve', label: 'Approve Change Order' },
    { action: 'reject', label: 'Reject Change Order' },
    { action: 'negotiate_amount', label: 'Negotiate Amount' },
  ],
  payment_release: [
    { action: 'release_full', label: 'Release Full Payment' },
    { action: 'release_partial', label: 'Release Partial Payment' },
    { action: 'hold_for_corrections', label: 'Hold Until Corrections' },
  ],
  schedule_change: [
    { action: 'approve_revision', label: 'Approve Revised Schedule' },
    { action: 'reject_keep_original', label: 'Keep Original Schedule' },
    { action: 'modify', label: 'Modify Proposed Changes' },
  ],
};

// -----------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------

export class DecisionSupportService {
  // -----------------------------------------------------------------------
  // createDecision
  // -----------------------------------------------------------------------

  async createDecision(opts: CreateDecisionOpts): Promise<string> {
    // 1. Compile comprehensive context based on type
    const compiledContext = await this.compileContext(
      opts.projectId,
      opts.type,
      opts.contextData,
    );

    // 2. Send to Claude AI for recommendation
    const userPrompt = this.buildUserPrompt(opts.type, opts.title, compiledContext);

    let aiRec: AIRecommendation;
    try {
      const result = await generateJSON<AIRecommendation>({
        systemPrompt: AI_PROMPTS.DECISION_SUPPORT,
        userPrompt,
        maxTokens: 2000,
      });
      aiRec = result.data;
    } catch (err) {
      console.error(
        `[DecisionSupport] AI recommendation failed for ${opts.type}:`,
        (err as Error).message,
      );
      // Fallback: create decision without AI recommendation
      aiRec = {
        recommendation: 'defer',
        confidence: 0,
        reasoning: 'AI analysis unavailable. Please review the context manually.',
        risks: [],
        alternatives: [],
        financialImpact: 'Unknown',
        scheduleImpact: 'Unknown',
      };
    }

    // 3. Build options array
    const options = OPTIONS_BY_TYPE[opts.type] ?? [
      { action: 'approve', label: 'Approve' },
      { action: 'reject', label: 'Reject' },
    ];

    // 4. Create DecisionQueue record
    const decision = await prisma.decisionQueue.create({
      data: {
        projectId: opts.projectId,
        pmId: opts.pmId,
        type: opts.type,
        title: opts.title,
        context: {
          ...compiledContext,
          aiAnalysis: {
            recommendation: aiRec.recommendation,
            reasoning: aiRec.reasoning,
            risks: aiRec.risks,
            alternatives: aiRec.alternatives,
            financialImpact: aiRec.financialImpact,
            scheduleImpact: aiRec.scheduleImpact,
          },
        },
        aiRecommendation:
          `${aiRec.recommendation.toUpperCase()}: ${aiRec.reasoning}\n\n` +
          `Financial Impact: ${aiRec.financialImpact}\n` +
          `Schedule Impact: ${aiRec.scheduleImpact}` +
          (aiRec.risks.length > 0
            ? `\n\nRisks:\n${aiRec.risks.map((r) => `• ${r}`).join('\n')}`
            : '') +
          (aiRec.alternatives.length > 0
            ? `\n\nAlternatives:\n${aiRec.alternatives.map((a) => `• ${a}`).join('\n')}`
            : ''),
        aiConfidence: Math.min(1, Math.max(0, aiRec.confidence)),
        options: options as any,
      },
    });

    // 5. Publish 'decision.needed' event
    await eventBus.publish(
      EVENT_TYPES.DECISION_NEEDED,
      {
        decisionId: decision.id,
        type: opts.type,
        title: opts.title,
        projectName: compiledContext.projectName ?? opts.projectId,
        description: aiRec.reasoning.substring(0, 200),
        recommendation: aiRec.recommendation,
      },
      SOURCE_APP,
      { projectId: opts.projectId },
    );

    // 6. Notify decision maker
    await prisma.notification.create({
      data: {
        userId: opts.pmId,
        type: 'decision_needed',
        title: `Decision Required: ${opts.title}`,
        message:
          `AI Recommendation: ${aiRec.recommendation.toUpperCase()}\n` +
          `Confidence: ${(aiRec.confidence * 100).toFixed(0)}%\n\n` +
          `${aiRec.reasoning.substring(0, 300)}`,
        channels: ['in_app'],
        status: 'SENT',
        sentAt: new Date(),
        data: { decisionId: decision.id, projectId: opts.projectId },
      },
    });

    console.log(
      `[DecisionSupport] Created decision ${decision.id} (${opts.type}): ` +
        `AI recommends ${aiRec.recommendation} (${(aiRec.confidence * 100).toFixed(0)}%)`,
    );

    return decision.id;
  }

  // -----------------------------------------------------------------------
  // resolveDecision
  // -----------------------------------------------------------------------

  async resolveDecision(
    decisionId: string,
    opts: ResolveDecisionOpts,
  ): Promise<void> {
    // 1. Update DecisionQueue record
    const decision = await prisma.decisionQueue.update({
      where: { id: decisionId },
      data: {
        decision: opts.decision,
        decidedAt: new Date(),
        decidedBy: opts.decidedBy,
        reasoning: opts.reasoning,
      },
    });

    // 2. Trigger follow-up actions based on type + decision
    await this.triggerFollowUp(decision);

    // 3. Publish 'decision.made' event
    await eventBus.publish(
      EVENT_TYPES.DECISION_MADE,
      {
        decisionId: decision.id,
        type: decision.type,
        title: decision.title,
        decision: opts.decision,
        decidedBy: opts.decidedBy,
      },
      SOURCE_APP,
      { projectId: decision.projectId },
    );

    // 4. Create audit trail in AutomationEvent
    await prisma.automationEvent.create({
      data: {
        eventType: 'decision.resolved',
        sourceApp: SOURCE_APP,
        projectId: decision.projectId,
        payload: {
          decisionId: decision.id,
          type: decision.type,
          decision: opts.decision,
          decidedBy: opts.decidedBy,
          reasoning: opts.reasoning,
          aiRecommendation: decision.aiRecommendation,
          aiConfidence: decision.aiConfidence ? Number(decision.aiConfidence) : null,
        },
      },
    });

    console.log(
      `[DecisionSupport] Decision ${decisionId} resolved: ${opts.decision} by ${opts.decidedBy}`,
    );
  }

  // -----------------------------------------------------------------------
  // getPendingDecisions
  // -----------------------------------------------------------------------

  async getPendingDecisions(pmId: string): Promise<any[]> {
    const decisions = await prisma.decisionQueue.findMany({
      where: { pmId, decision: null },
      orderBy: { createdAt: 'asc' },
    });

    return decisions;
  }

  // -----------------------------------------------------------------------
  // getClientDecisions
  // -----------------------------------------------------------------------

  async getClientDecisions(userId: string): Promise<any[]> {
    // Get projects where user is the client's assigned PM or project owner
    const clientProjects = await prisma.project.findMany({
      where: {
        client: { assignedPM: userId },
        status: { in: ['ACTIVE', 'IN_PROGRESS'] },
      },
      select: { id: true },
    });

    if (clientProjects.length === 0) return [];

    const projectIds = clientProjects.map((p) => p.id);

    const decisions = await prisma.decisionQueue.findMany({
      where: {
        projectId: { in: projectIds },
        type: 'payment_release',
        decision: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    return decisions;
  }

  // -----------------------------------------------------------------------
  // Private: Compile context
  // -----------------------------------------------------------------------

  private async compileContext(
    projectId: string,
    type: DecisionType,
    contextData: Record<string, any>,
  ): Promise<Record<string, any>> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        budget: true,
        currentPhase: true,
        scheduledStartDate: true,
        scheduledEndDate: true,
      },
    });

    const baseContext: Record<string, any> = {
      projectName: project.name ?? 'Unnamed Project',
      projectStatus: project.status,
      projectBudget: project.budget ? Number(project.budget) : null,
      currentPhase: project.currentPhase,
      ...contextData,
    };

    switch (type) {
      case 'bid_award':
        return this.compileBidAwardContext(projectId, baseContext);
      case 'change_order':
        return this.compileChangeOrderContext(projectId, baseContext);
      case 'payment_release':
        return this.compilePaymentReleaseContext(projectId, baseContext);
      case 'schedule_change':
        return this.compileScheduleChangeContext(projectId, baseContext);
      default:
        return baseContext;
    }
  }

  private async compileBidAwardContext(
    projectId: string,
    base: Record<string, any>,
  ): Promise<Record<string, any>> {
    // Get bid evaluations with bids for this project
    const evaluations = await prisma.bidEvaluation.findMany({
      where: { projectId, status: { in: ['collecting', 'evaluating', 'evaluated'] } },
      include: { bids: true },
    });

    const allBids = evaluations.flatMap((e) => e.bids);

    // Get contractor profiles for bid participants
    const contractorIds = [...new Set(allBids.map((b) => b.contractorId))];
    const contractors = await prisma.contractor.findMany({
      where: { id: { in: contractorIds } },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        rating: true,
        reviewCount: true,
        trades: true,
        yearsInBusiness: true,
      },
    });
    const contractorMap = new Map(contractors.map((c) => [c.id, c]));

    // Get leads for context
    const leads = await prisma.lead.findMany({
      where: { projectId },
      select: { id: true, category: true, estimatedValue: true, budget: true, description: true },
      take: 5,
    });

    return {
      ...base,
      bids: allBids.map((b) => ({
        id: b.id,
        contractorId: b.contractorId,
        contractor: contractorMap.get(b.contractorId) ?? null,
        amount: Number(b.amount),
        timeline: b.timeline,
        totalScore: b.totalScore ? Number(b.totalScore) : null,
        rank: b.rank,
        scope: b.scope,
        status: b.status,
      })),
      evaluations: evaluations.map((e) => ({
        id: e.id,
        trade: e.trade,
        status: e.status,
        selectedBidId: e.selectedBidId,
        aiRecommendation: e.aiRecommendation,
      })),
      leads: leads.map((l) => ({
        category: l.category,
        estimatedValue: l.estimatedValue ? Number(l.estimatedValue) : null,
        budget: l.budget ? Number(l.budget) : null,
        description: l.description,
      })),
    };
  }

  private async compileChangeOrderContext(
    projectId: string,
    base: Record<string, any>,
  ): Promise<Record<string, any>> {
    const [latestSnapshot, recentPredictions, allCOs] = await Promise.all([
      prisma.budgetSnapshot.findFirst({
        where: { projectId },
        orderBy: { snapshotDate: 'desc' },
      }),
      prisma.prediction.findMany({
        where: {
          projectId,
          type: { in: ['COST_OVERRUN', 'DELAY'] },
          createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        },
        take: 5,
      }),
      prisma.changeOrder.findMany({
        where: { projectId },
        select: { id: true, totalCost: true, status: true, title: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      ...base,
      budgetStatus: latestSnapshot
        ? {
            totalBudget: Number(latestSnapshot.totalBudget),
            totalSpent: Number(latestSnapshot.totalActual),
            totalCommitted: Number(latestSnapshot.totalCommitted),
            variance: Number(latestSnapshot.totalVariance),
            percentComplete: Number(latestSnapshot.percentComplete),
          }
        : null,
      riskAssessment: recentPredictions.map((p) => ({
        type: p.type,
        probability: Number(p.probability),
        impact: p.impact,
        description: p.description,
      })),
      changeOrderHistory: {
        totalCOs: allCOs.length,
        approvedCOs: allCOs.filter((co) => co.status === 'APPROVED').length,
        totalCOAmount: allCOs.reduce((s, co) => s + Number(co.totalCost), 0),
        recentCOs: allCOs.slice(0, 5).map((co) => ({
          title: co.title,
          amount: Number(co.totalCost),
          status: co.status,
        })),
      },
    };
  }

  private async compilePaymentReleaseContext(
    projectId: string,
    base: Record<string, any>,
  ): Promise<Record<string, any>> {
    const [inspections, qaResults, escrowAgreements] = await Promise.all([
      // Recent inspections for this project
      prisma.inspection.findMany({
        where: { projectId },
        orderBy: { completedAt: 'desc' },
        take: 5,
        select: {
          inspectionType: true,
          result: true,
          completedAt: true,
          deficiencies: true,
        },
      }),
      // QA scores
      prisma.qAInspectionResult.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { overallScore: true, createdAt: true },
      }),
      // Escrow balances
      prisma.escrowAgreement.findMany({
        where: { projectId },
        select: {
          currentBalance: true,
          availableBalance: true,
          heldBalance: true,
          totalContractAmount: true,
          holdbackPercentage: true,
          status: true,
        },
      }),
    ]);

    const qaScores = qaResults
      .filter((q) => q.overallScore !== null)
      .map((q) => Number(q.overallScore));

    return {
      ...base,
      inspectionResults: inspections.map((i) => ({
        type: i.inspectionType,
        result: i.result,
        completedAt: i.completedAt?.toISOString() ?? null,
        deficiencyCount: Array.isArray(i.deficiencies) ? (i.deficiencies as any[]).length : 0,
      })),
      qaAssessment: {
        recentScores: qaScores,
        averageScore:
          qaScores.length > 0
            ? Math.round(qaScores.reduce((a, b) => a + b, 0) / qaScores.length)
            : null,
      },
      escrow: escrowAgreements.map((e) => ({
        currentBalance: Number(e.currentBalance),
        availableBalance: Number(e.availableBalance),
        heldBalance: Number(e.heldBalance),
        totalContract: Number(e.totalContractAmount),
        holdbackPercent: e.holdbackPercentage,
        status: e.status,
      })),
    };
  }

  private async compileScheduleChangeContext(
    projectId: string,
    base: Record<string, any>,
  ): Promise<Record<string, any>> {
    const [scheduleItems, weatherLogs, tasks] = await Promise.all([
      prisma.scheduleItem.findMany({
        where: { projectId, criticalPath: true },
        orderBy: { startDate: 'asc' },
        select: {
          taskName: true,
          startDate: true,
          endDate: true,
          status: true,
          trade: true,
          weatherSensitive: true,
        },
      }),
      prisma.weatherLog.findMany({
        where: {
          projectId,
          date: { gte: new Date() },
          workable: false,
        },
        take: 10,
        select: { date: true, condition: true },
      }),
      prisma.task.findMany({
        where: { projectId, status: { notIn: ['COMPLETED', 'CANCELED'] } },
        select: { id: true, title: true, status: true, dueDate: true, priority: true },
        take: 20,
      }),
    ]);

    return {
      ...base,
      criticalPathItems: scheduleItems.map((s) => ({
        task: s.taskName,
        start: s.startDate.toISOString().split('T')[0],
        end: s.endDate.toISOString().split('T')[0],
        status: s.status,
        trade: s.trade,
        weatherSensitive: s.weatherSensitive,
      })),
      weatherFactors: weatherLogs.map((w) => ({
        date: w.date.toISOString().split('T')[0],
        condition: w.condition,
      })),
      pendingTasks: tasks.map((t) => ({
        title: t.title,
        status: t.status,
        dueDate: t.dueDate?.toISOString().split('T')[0] ?? null,
        priority: t.priority,
      })),
    };
  }

  // -----------------------------------------------------------------------
  // Private: Build user prompt
  // -----------------------------------------------------------------------

  private buildUserPrompt(
    type: DecisionType,
    title: string,
    context: Record<string, any>,
  ): string {
    const typeDescriptions: Record<DecisionType, string> = {
      bid_award:
        'Evaluate the submitted bids and recommend which contractor to award the work to. ' +
        'Consider price, timeline, quality scores, contractor history, and value for money.',
      change_order:
        'Evaluate this change order request. Consider budget impact, schedule impact, ' +
        'necessity, and whether the proposed cost is reasonable.',
      payment_release:
        'Evaluate whether to release payment for the completed milestone. ' +
        'Consider inspection results, QA scores, work quality, and escrow balance.',
      schedule_change:
        'Evaluate the proposed schedule changes. Consider impact on completion date, ' +
        'resource availability, weather, and critical path implications.',
    };

    return (
      `DECISION TYPE: ${type}\n` +
      `TITLE: ${title}\n\n` +
      `TASK: ${typeDescriptions[type]}\n\n` +
      `Return a JSON object with:\n` +
      `- recommendation: "approve" | "reject" | "defer" | "negotiate"\n` +
      `- confidence: 0.0-1.0\n` +
      `- reasoning: clear explanation\n` +
      `- risks: array of risk strings (if approved and if rejected)\n` +
      `- alternatives: array of alternative approaches\n` +
      `- financialImpact: string describing financial impact\n` +
      `- scheduleImpact: string describing schedule impact\n\n` +
      `CONTEXT DATA:\n${JSON.stringify(context, null, 2)}`
    );
  }

  // -----------------------------------------------------------------------
  // Private: Trigger follow-up actions
  // -----------------------------------------------------------------------

  private async triggerFollowUp(
    decision: {
      id: string;
      projectId: string;
      type: string;
      context: any;
      decision: string | null;
    },
  ): Promise<void> {
    if (!decision.decision) return;

    const ctx = (decision.context as Record<string, any>) ?? {};

    switch (decision.type) {
      case 'bid_award': {
        if (decision.decision === 'award_to_recommended' || decision.decision === 'approve') {
          // Find the top-ranked bid
          const bids = (ctx.bids as any[]) ?? [];
          const topBid = bids.find((b: any) => b.rank === 1) ?? bids[0];
          if (topBid) {
            await eventBus.publish(
              EVENT_TYPES.BID_ACCEPTED,
              {
                bidId: topBid.id,
                contractorId: topBid.contractorId,
                contractorName: topBid.contractor?.companyName ?? '',
                projectName: ctx.projectName,
                leadId: ctx.leads?.[0]?.id ?? null,
              },
              SOURCE_APP,
              { projectId: decision.projectId },
            );
          }
        }
        break;
      }

      case 'change_order': {
        if (decision.decision === 'approve') {
          const changeOrderId = ctx.changeOrderId;
          if (changeOrderId) {
            await eventBus.publish(
              EVENT_TYPES.CHANGE_ORDER_APPROVED,
              {
                changeOrderId,
                projectName: ctx.projectName,
              },
              SOURCE_APP,
              { projectId: decision.projectId },
            );
          }
        }
        break;
      }

      case 'payment_release': {
        if (decision.decision === 'release_full') {
          await eventBus.publish(
            EVENT_TYPES.PAYMENT_RELEASED,
            {
              paymentId: ctx.paymentId ?? null,
              milestoneId: ctx.milestoneId ?? null,
              amount: ctx.amount ?? null,
              milestoneName: ctx.milestoneName ?? '',
              projectName: ctx.projectName,
            },
            SOURCE_APP,
            { projectId: decision.projectId },
          );
        }
        break;
      }

      case 'schedule_change': {
        if (decision.decision === 'approve_revision') {
          await eventBus.publish(
            EVENT_TYPES.PROJECT_STATUS_CHANGED,
            {
              change: 'schedule_revised',
              projectName: ctx.projectName,
              approvedBy: decision.decision,
            },
            SOURCE_APP,
            { projectId: decision.projectId },
          );
        }
        break;
      }
    }
  }
}
