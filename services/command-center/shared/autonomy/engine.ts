/**
 * Autonomous Action Engine
 *
 * Core decision engine that upgrades AI agents from "recommend and wait"
 * to "decide and act" for routine operations. Evaluates whether an action
 * should be auto-executed or escalated to a human based on project autonomy
 * configuration.
 */

import { PrismaClient } from '@prisma/client';
import { getEventBus, EVENT_TYPES } from '../events.js';
import {
  ActionContext,
  ActionResult,
  ActionDecision,
  ActionLogFilters,
  AutonomyConfig,
  AutonomyStats,
  RevertResult,
  AutonomyCategory,
} from './types.js';
import { buildAutonomyConfig, MINUTES_SAVED_PER_ACTION } from './defaults.js';

const prisma = new PrismaClient();
const eventBus = getEventBus('autonomy-engine');

// ============================================================================
// AUTONOMOUS ACTION ENGINE
// ============================================================================

export class AutonomousActionEngine {
  /**
   * Core decision method: evaluate an action context and either auto-execute
   * or escalate to a human decision-maker.
   */
  async evaluateAndAct(context: ActionContext): Promise<ActionResult> {
    // 1. Load project autonomy config
    const project = await prisma.project.findUnique({
      where: { id: context.projectId },
      select: {
        id: true,
        name: true,
        autonomyLevel: true,
        autonomyRules: true,
        autonomyEnabledAt: true,
        autonomyEnabledBy: true,
        projectManagers: {
          select: { userId: true },
          where: { isPrimary: true },
        },
      },
    } as any);

    if (!project) {
      return this.escalate(context, 'Project not found');
    }

    const config = buildAutonomyConfig(
      (project as any).autonomyLevel ?? 1,
      (project as any).autonomyRules as Record<string, unknown> | null,
      (project as any).autonomyEnabledAt,
      (project as any).autonomyEnabledBy
    );

    // 2. Check if autonomy is enabled for this category
    const rule = config.rules[context.category];
    if (!rule || !rule.enabled) {
      return this.escalate(context, `Autonomy not enabled for category: ${context.category}`);
    }

    // 3. Check confidence threshold
    if (rule.minConfidence && context.confidence < rule.minConfidence) {
      return this.escalate(
        context,
        `Confidence ${context.confidence} below minimum ${rule.minConfidence} for ${context.category}`
      );
    }

    // 4. Check category-specific thresholds
    const thresholdResult = this.checkThresholds(context, rule);
    if (!thresholdResult.withinThreshold) {
      return this.escalate(context, thresholdResult.reason);
    }

    // 5. Auto-execute: log the action and notify PM
    const decision = this.determineDecision(context);
    const reasoning = `Auto-${decision === 'AUTO_APPROVED' ? 'approved' : decision === 'AUTO_REJECTED' ? 'rejected' : 'executed'}: ${thresholdResult.reason}. Autonomy Level ${config.level}, confidence ${context.confidence}%.`;

    const actionLog = await this.logAction(context, decision, reasoning, config.level);

    // Notify PM via event bus
    const pmUserIds = ((project as any).projectManagers || []).map((pm: any) => pm.userId);
    await this.notifyPM(context.projectId, actionLog.id, context, decision, pmUserIds);

    return {
      decision,
      reasoning,
      actionLogId: actionLog.id,
    };
  }

  /**
   * Check whether the action falls within the auto-execute thresholds
   */
  private checkThresholds(
    context: ActionContext,
    rule: { maxAutoApprove?: number; maxPercentage?: number; maxDays?: number; enabled: boolean }
  ): { withinThreshold: boolean; reason: string } {
    // Dollar amount check (change orders, budget items)
    if (context.amount !== undefined && rule.maxAutoApprove !== undefined) {
      if (context.amount <= rule.maxAutoApprove) {
        return {
          withinThreshold: true,
          reason: `Amount $${context.amount.toLocaleString()} within auto-approve limit of $${rule.maxAutoApprove.toLocaleString()}`,
        };
      }
      return {
        withinThreshold: false,
        reason: `Amount $${context.amount.toLocaleString()} exceeds auto-approve limit of $${rule.maxAutoApprove.toLocaleString()}`,
      };
    }

    // Percentage check (budget variance)
    if (context.percentage !== undefined && rule.maxPercentage !== undefined) {
      if (context.percentage <= rule.maxPercentage) {
        return {
          withinThreshold: true,
          reason: `Variance ${context.percentage.toFixed(1)}% within auto-acknowledge limit of ${rule.maxPercentage}%`,
        };
      }
      return {
        withinThreshold: false,
        reason: `Variance ${context.percentage.toFixed(1)}% exceeds auto-acknowledge limit of ${rule.maxPercentage}%`,
      };
    }

    // Days check (schedule adjustments)
    if (context.days !== undefined && rule.maxDays !== undefined) {
      if (context.days <= rule.maxDays) {
        return {
          withinThreshold: true,
          reason: `${context.days} day(s) within auto-reschedule limit of ${rule.maxDays} days`,
        };
      }
      return {
        withinThreshold: false,
        reason: `${context.days} day(s) exceeds auto-reschedule limit of ${rule.maxDays} days`,
      };
    }

    // QA severity check — critical ALWAYS escalated
    if (context.severity) {
      if (context.severity === 'critical') {
        return {
          withinThreshold: false,
          reason: 'Critical severity findings always require human review',
        };
      }
      if (context.severity === 'minor' || context.severity === 'observation') {
        return {
          withinThreshold: true,
          reason: `${context.severity} severity within auto-action threshold`,
        };
      }
      // Major: allowed at Level 3 only (already handled by rule config)
      return {
        withinThreshold: true,
        reason: `${context.severity} severity within configured auto-action threshold`,
      };
    }

    // Default: if enabled and no specific threshold, auto-execute
    return {
      withinThreshold: true,
      reason: 'Action within general auto-execute parameters',
    };
  }

  /**
   * Determine specific decision type based on action context
   */
  private determineDecision(context: ActionContext): ActionDecision {
    switch (context.actionType) {
      case 'change_order_approve':
      case 'budget_acknowledge':
      case 'phase_advance':
      case 'bid_award':
        return 'AUTO_APPROVED';

      case 'bid_reject':
      case 'bid_reject_late':
      case 'bid_reject_overpriced':
        return 'AUTO_REJECTED';

      case 'weather_reschedule':
      case 'task_escalate':
      case 'qa_create_task':
      case 'task_auto_create':
        return 'AUTO_EXECUTED';

      default:
        return 'AUTO_EXECUTED';
    }
  }

  /**
   * Escalate to human: create DecisionLog entry and notify
   */
  private async escalate(context: ActionContext, reason: string): Promise<ActionResult> {
    // Log the escalation
    const actionLog = await this.logAction(context, 'ESCALATED', reason, 1);

    // Create a DecisionLog entry for the PM to act on
    const decisionLog = await (prisma as any).decisionLog.create({
      data: {
        projectId: context.projectId,
        type: context.category.toUpperCase(),
        question: context.description,
        recommendation: `AI recommends: ${context.actionType}`,
        confidence: context.confidence,
        source: context.appSource,
        data: context.metadata || {},
      },
    });

    // Get PM users for notification
    const project = await prisma.project.findUnique({
      where: { id: context.projectId },
      select: {
        projectManagers: {
          select: { userId: true },
        },
      },
    } as any);

    const pmUserIds = ((project as any)?.projectManagers || []).map((pm: any) => pm.userId);

    // Emit escalation event
    await eventBus.publish(
      (EVENT_TYPES as any).AUTONOMOUS_ACTION_ESCALATED || 'autonomous.action.escalated',
      {
        projectId: context.projectId,
        actionLogId: actionLog.id,
        decisionLogId: decisionLog.id,
        category: context.category,
        description: context.description,
        reason,
      }
    );

    return {
      decision: 'ESCALATED',
      reasoning: reason,
      actionLogId: actionLog.id,
      escalationData: {
        decisionLogId: decisionLog.id,
        notifiedUsers: pmUserIds,
      },
    };
  }

  /**
   * Log an autonomous action to the database
   */
  private async logAction(
    context: ActionContext,
    decision: ActionDecision,
    reasoning: string,
    autonomyLevel: number
  ) {
    return (prisma as any).autonomousActionLog.create({
      data: {
        projectId: context.projectId,
        appSource: context.appSource,
        actionType: context.actionType,
        description: context.description,
        decision,
        reasoning,
        data: context.metadata || {},
        confidence: context.confidence,
        autonomyLevel,
      },
    });
  }

  /**
   * Notify PM of an auto-action via event bus
   */
  private async notifyPM(
    projectId: string,
    actionLogId: string,
    context: ActionContext,
    decision: ActionDecision,
    pmUserIds: string[]
  ): Promise<void> {
    await eventBus.publish(
      (EVENT_TYPES as any).AUTONOMOUS_ACTION_EXECUTED || 'autonomous.action.executed',
      {
        projectId,
        actionLogId,
        appSource: context.appSource,
        category: context.category,
        actionType: context.actionType,
        decision,
        description: context.description,
        amount: context.amount,
        confidence: context.confidence,
        pmUserIds,
      }
    );
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Get paginated action log for a project
   */
  async getActionLog(
    projectId: string,
    filters?: ActionLogFilters,
    page: number = 1,
    pageSize: number = 20
  ) {
    const where: Record<string, unknown> = { projectId };

    if (filters?.appSource) where.appSource = filters.appSource;
    if (filters?.decision) where.decision = filters.decision;
    if (filters?.reviewedByPM !== undefined) where.reviewedByPM = filters.reviewedByPM;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {
        ...(filters.startDate && { gte: filters.startDate }),
        ...(filters.endDate && { lte: filters.endDate }),
      };
    }
    if (filters?.category) {
      // Map category to actionType prefix
      where.actionType = { startsWith: filters.category };
    }

    const [actions, total] = await Promise.all([
      (prisma as any).autonomousActionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (prisma as any).autonomousActionLog.count({ where }),
    ]);

    return { actions, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * Revert an autonomous action
   */
  async revertAction(actionId: string, userId: string): Promise<RevertResult> {
    const action = await (prisma as any).autonomousActionLog.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      return { success: false, message: 'Action not found', revertedActionId: actionId };
    }

    if (action.revertedAt) {
      return { success: false, message: 'Action already reverted', revertedActionId: actionId };
    }

    if (action.decision === 'ESCALATED') {
      return { success: false, message: 'Cannot revert an escalated action', revertedActionId: actionId };
    }

    // Mark as reverted
    await (prisma as any).autonomousActionLog.update({
      where: { id: actionId },
      data: {
        revertedAt: new Date(),
        revertedBy: userId,
      },
    });

    // Emit revert event
    await eventBus.publish(
      (EVENT_TYPES as any).AUTONOMOUS_ACTION_REVERTED || 'autonomous.action.reverted',
      {
        projectId: action.projectId,
        actionLogId: actionId,
        revertedBy: userId,
        actionType: action.actionType,
        originalDecision: action.decision,
      }
    );

    return {
      success: true,
      message: `Action ${action.actionType} reverted successfully`,
      revertedActionId: actionId,
    };
  }

  /**
   * Mark an action as reviewed by PM
   */
  async markReviewed(actionId: string): Promise<void> {
    await (prisma as any).autonomousActionLog.update({
      where: { id: actionId },
      data: {
        reviewedByPM: true,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Get aggregate stats for a project's autonomous actions
   */
  async getStats(projectId: string, days: number = 7): Promise<AutonomyStats> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const actions = await (prisma as any).autonomousActionLog.findMany({
      where: {
        projectId,
        createdAt: { gte: since },
      },
      select: {
        decision: true,
        actionType: true,
        reviewedByPM: true,
        revertedAt: true,
      },
    });

    const totalActions = actions.length;
    const autoApproved = actions.filter((a: any) => a.decision === 'AUTO_APPROVED').length;
    const autoRejected = actions.filter((a: any) => a.decision === 'AUTO_REJECTED').length;
    const autoExecuted = actions.filter((a: any) => a.decision === 'AUTO_EXECUTED').length;
    const escalated = actions.filter((a: any) => a.decision === 'ESCALATED').length;
    const revertedCount = actions.filter((a: any) => a.revertedAt !== null).length;
    const reviewedCount = actions.filter((a: any) => a.reviewedByPM).length;

    // Estimate hours saved: each auto-action saves category-specific minutes
    const autoActions = actions.filter((a: any) => a.decision !== 'ESCALATED');
    let totalMinutesSaved = 0;
    for (const action of autoActions) {
      const category = (action as any).actionType.split('_')[0] as AutonomyCategory;
      totalMinutesSaved += MINUTES_SAVED_PER_ACTION[category] || 15;
    }

    // Count by category (extract from actionType)
    const categoryCountMap = new Map<string, number>();
    for (const action of actions) {
      const parts = (action as any).actionType.split('_');
      const category = parts.slice(0, 2).join('_');
      categoryCountMap.set(category, (categoryCountMap.get(category) || 0) + 1);
    }
    const topCategories = Array.from(categoryCountMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalActions,
      autoApproved,
      autoRejected,
      autoExecuted,
      escalated,
      revertedCount,
      reviewedCount,
      estimatedHoursSaved: Math.round((totalMinutesSaved / 60) * 10) / 10,
      topCategories,
    };
  }
}

// Singleton export
export const autonomyEngine = new AutonomousActionEngine();
