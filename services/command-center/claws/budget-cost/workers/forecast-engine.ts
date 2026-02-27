/**
 * Claw D — Forecast Engine Worker Handler
 *
 * Generates cost forecasts using earned value analysis (CPI/SPI) and
 * AI-enhanced trend analysis.  Calculates optimistic, most likely, and
 * pessimistic Estimate at Completion (EAC).
 */
import type { PrismaClient } from '@prisma/client';
import type { AIProvider } from '@kealee/ai';
import type { Job } from 'bullmq';

export class ForecastEngineWorkerHandlers {
  constructor(
    private prisma: PrismaClient,
    private ai: AIProvider,
    private forecastPrompt: string,
  ) {}

  async handleGenerateForecast(job: Job): Promise<any> {
    const { projectId } = job.data;

    const budgetItems = await this.prisma.budgetItem.findMany({
      where: { projectId },
    });

    const snapshots = await this.prisma.budgetSnapshot.findMany({
      where: { projectId },
      orderBy: { snapshotDate: 'desc' },
      take: 12,
    });

    const scheduleItems = await this.prisma.scheduleItem.findMany({
      where: { projectId },
    });

    const totalTasks = scheduleItems.length;
    const completedTasks = scheduleItems.filter(
      (t) => t.status === 'COMPLETED',
    ).length;
    const percentComplete =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Earned value metrics
    const totalBudget = budgetItems.reduce(
      (s, b) => s + Number(b.estimatedCost), 0,
    );
    const totalActual = budgetItems.reduce(
      (s, b) => s + Number(b.actualCost), 0,
    );
    const plannedValue = totalBudget * (percentComplete / 100);
    const earnedValue = totalBudget * (percentComplete / 100);
    const cpi = totalActual > 0 ? earnedValue / totalActual : 1;
    const spi = plannedValue > 0 ? earnedValue / plannedValue : 1;

    const aiResult = await this.ai.reason({
      task:
        'Generate a cost forecast using earned value analysis and trend data. ' +
        'Calculate optimistic, most likely, and pessimistic EAC. ' +
        'Assess contingency adequacy and identify cash flow risks.',
      context: {
        budgetItems: budgetItems.map((bi) => ({
          category: bi.category,
          estimated: Number(bi.estimatedCost),
          actual: Number(bi.actualCost),
          committed: Number(bi.committedCost),
        })),
        earnedValue: {
          BAC: totalBudget, PV: plannedValue, EV: earnedValue,
          AC: totalActual, CPI: cpi, SPI: spi,
        },
        percentComplete,
        snapshotHistory: snapshots.map((s) => ({
          date: s.snapshotDate,
          totalBudget: Number(s.totalBudget),
          totalActual: Number(s.totalActual),
          variance: Number(s.totalVariance),
        })),
      },
      systemPrompt: this.forecastPrompt,
    });

    return {
      earnedValue: {
        budgetAtCompletion: totalBudget,
        plannedValue, earnedValue, actualCost: totalActual,
        cpi, spi,
        eac: cpi > 0 ? totalBudget / cpi : totalBudget,
        etc: cpi > 0 ? (totalBudget - earnedValue) / cpi : totalBudget - totalActual,
      },
      percentComplete,
      aiAnalysis: aiResult,
    };
  }
}
