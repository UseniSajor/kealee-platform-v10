
import { prisma } from '../../core/db';
import { formatCurrency } from '../../core/utils';
import { ImpactAnalysis } from './types';

export class ImpactAnalyzer {
    async analyzeChangeOrder(changeOrderId: string): Promise<ImpactAnalysis> {
        const co = await prisma.changeOrder.findUniqueOrThrow({
            where: { id: changeOrderId },
            include: {
                project: { include: { milestones: true, changeOrders: { where: { status: 'APPROVED' } } } },
            },
        });

        const directCost = Number(co.amount);
        const overhead = directCost * 0.10;
        const contingency = directCost * 0.05;
        const totalCost = directCost + overhead + contingency;

        const directDays = co.scheduleImpact || 0;
        const originalBudget = Number(co.project.budget);
        const approvedChanges = co.project.changeOrders.reduce((sum, change) => sum + Number(change.amount), 0);
        const newTotal = originalBudget + approvedChanges + totalCost;
        const percentIncrease = originalBudget > 0 ? ((newTotal - originalBudget) / originalBudget) * 100 : 0;

        let riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
        if (percentIncrease <= 5 && directDays <= 7) riskAssessment = 'LOW';
        else if (percentIncrease <= 15 && directDays <= 21) riskAssessment = 'MEDIUM';
        else riskAssessment = 'HIGH';

        return {
            costImpact: { directCost, overhead, contingency, totalCost },
            scheduleImpact: { directDays, cascadeDays: 0, totalDays: directDays, affectedMilestones: [] },
            budgetStatus: { originalBudget, approvedChanges, thisCO: totalCost, newTotal, percentIncrease },
            riskAssessment,
            recommendation: `${riskAssessment} risk change order. Budget impact: ${formatCurrency(totalCost)} (${percentIncrease.toFixed(1)}% increase).`,
        };
    }
}
