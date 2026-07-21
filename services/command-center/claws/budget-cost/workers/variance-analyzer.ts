/**
 * Claw D — Variance Analyzer Worker Handler
 *
 * Evaluates budget variance thresholds and creates alerts:
 *   - >15% variance in any single category → THRESHOLD_WARNING
 *   - >10% total project budget variance → OVER_BUDGET
 *
 * Triggers AI root cause analysis when alerts fire and creates
 * Prediction records for cost overrun forecasting.
 */
import type { PrismaClient } from '@prisma/client';
import type { EventBus } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import type { AIProvider } from '@kealee/ai';
import type { Job } from 'bullmq';

const VARIANCE_THRESHOLDS = {
  CATEGORY_PERCENT: 15,
  TOTAL_PERCENT: 10,
} as const;

export class VarianceAnalyzerWorkerHandlers {
  constructor(
    private prisma: PrismaClient,
    private ai: AIProvider,
    private eventBus: EventBus,
    private clawName: string,
    private assertWritable: (model: string) => void,
    private variancePrompt: string,
  ) {}

  async handleCheckVarianceAlerts(job: Job): Promise<void> {
    const { projectId, organizationId, trigger, event } = job.data;
    this.assertWritable('BudgetAlert');
    this.assertWritable('Prediction');

    const budgetItems = await this.prisma.budgetItem.findMany({
      where: { projectId },
    });
    if (budgetItems.length === 0) return;

    let totalEstimated = 0;
    let totalActual = 0;
    const categoryAlerts: Array<{
      category: string;
      variancePercent: number;
      variance: number;
    }> = [];

    for (const item of budgetItems) {
      const estimated = Number(item.estimatedCost);
      const actual = Number(item.actualCost);
      totalEstimated += estimated;
      totalActual += actual;

      const variancePercent = Number(item.variancePercent);
      if (Math.abs(variancePercent) > VARIANCE_THRESHOLDS.CATEGORY_PERCENT) {
        categoryAlerts.push({
          category: item.category,
          variancePercent,
          variance: Number(item.varianceAmount),
        });
      }
    }

    const totalVariance = totalActual - totalEstimated;
    const totalVariancePct =
      totalEstimated > 0 ? (totalVariance / totalEstimated) * 100 : 0;
    const totalExceeded =
      Math.abs(totalVariancePct) > VARIANCE_THRESHOLDS.TOTAL_PERCENT;

    // Create category-level alerts
    for (const alert of categoryAlerts) {
      const existingAlert = await this.prisma.budgetAlert.findFirst({
        where: {
          projectId,
          category: alert.category,
          type: 'THRESHOLD_WARNING',
          acknowledged: false,
        },
      });
      if (existingAlert) continue;

      await this.prisma.budgetAlert.create({
        data: {
          projectId,
          type: 'THRESHOLD_WARNING',
          severity: Math.abs(alert.variancePercent) > 25 ? 'CRITICAL' : 'WARNING',
          category: alert.category,
          title: `${alert.category} budget variance exceeds ${VARIANCE_THRESHOLDS.CATEGORY_PERCENT}%`,
          message:
            `${alert.category} category is ${alert.variancePercent > 0 ? 'over' : 'under'} budget ` +
            `by ${Math.abs(alert.variancePercent).toFixed(1)}% ` +
            `($${Math.abs(alert.variance).toLocaleString()}). ` +
            `Triggered by ${trigger ?? 'recalculation'}.`,
          threshold: VARIANCE_THRESHOLDS.CATEGORY_PERCENT,
          currentValue: totalActual,
          budgetedValue: totalEstimated,
        },
      });
    }

    // Create total project alert
    if (totalExceeded) {
      const existingTotal = await this.prisma.budgetAlert.findFirst({
        where: { projectId, type: 'OVER_BUDGET', acknowledged: false },
      });

      if (!existingTotal) {
        await this.prisma.budgetAlert.create({
          data: {
            projectId,
            type: 'OVER_BUDGET',
            severity: Math.abs(totalVariancePct) > 20 ? 'CRITICAL' : 'WARNING',
            title: `Total project budget variance exceeds ${VARIANCE_THRESHOLDS.TOTAL_PERCENT}%`,
            message:
              `Total project is ${totalVariancePct > 0 ? 'over' : 'under'} budget ` +
              `by ${Math.abs(totalVariancePct).toFixed(1)}% ` +
              `($${Math.abs(totalVariance).toLocaleString()}). ` +
              `Estimated: $${totalEstimated.toLocaleString()}, ` +
              `Actual: $${totalActual.toLocaleString()}.`,
            threshold: VARIANCE_THRESHOLDS.TOTAL_PERCENT,
            currentValue: totalActual,
            budgetedValue: totalEstimated,
          },
        });
      }
    }

    // AI root cause analysis on triggered alerts
    if (categoryAlerts.length > 0 || totalExceeded) {
      const aiResult = await this.ai.reason({
        task:
          'Perform root cause analysis on these budget variances. Identify the primary ' +
          'drivers, assess trend direction, and recommend corrective actions.',
        context: {
          budgetItems: budgetItems.map((bi) => ({
            category: bi.category,
            estimated: Number(bi.estimatedCost),
            actual: Number(bi.actualCost),
            committed: Number(bi.committedCost),
            variancePercent: Number(bi.variancePercent),
          })),
          categoryAlerts,
          totalVariancePct,
          trigger,
        },
        systemPrompt: this.variancePrompt,
      });

      if (totalVariancePct > VARIANCE_THRESHOLDS.TOTAL_PERCENT) {
        const prediction = await this.prisma.prediction.create({
          data: {
            projectId,
            type: 'BUDGET_OVERRUN',
            probability: Math.min(0.95, 0.5 + totalVariancePct / 100),
            confidence: 0.75,
            impact:
              Math.abs(totalVariancePct) > 20 ? 'CRITICAL'
                : Math.abs(totalVariancePct) > 15 ? 'HIGH' : 'MEDIUM',
            description:
              `Budget overrun predicted. Total variance: ${totalVariancePct.toFixed(1)}%. ` +
              `Categories exceeding thresholds: ${categoryAlerts.map((a) => a.category).join(', ') || 'none'}.`,
            factors: { categoryAlerts, totalVariancePct, aiAnalysis: aiResult },
            recommendedAction:
              (aiResult as any)?.recommendations?.[0]?.action ??
              'Review budget categories exceeding variance thresholds and implement corrective measures.',
          },
        });

        const predictionEvent = createEvent({
          type: EVENT_TYPES.prediction.costoverrun.created,
          source: this.clawName, projectId, organizationId,
          payload: {
            predictionId: prediction.id,
            probability: prediction.probability,
            impact: prediction.impact,
            totalVariancePct, aiAnalysis: aiResult,
          },
          trigger: event ? { eventId: event.id, eventType: event.type } : undefined,
        });
        await this.eventBus.publish(predictionEvent);
      }

      const alertEvent = createEvent({
        type: EVENT_TYPES.budget.alert.variance.high,
        source: this.clawName, projectId, organizationId,
        payload: { categoryAlerts, totalVariancePct, totalExceeded, aiAnalysis: aiResult },
        trigger: event ? { eventId: event.id, eventType: event.type } : undefined,
      });
      await this.eventBus.publish(alertEvent);
    }
  }
}
