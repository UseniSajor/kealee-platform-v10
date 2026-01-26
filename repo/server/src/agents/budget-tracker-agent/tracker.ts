
import { prisma } from '../../core/db';

export class BudgetTracker {
    async getBudgetSummary(projectId: string): Promise<any> {
        const project = await prisma.project.findUniqueOrThrow({
            where: { id: projectId },
            include: { changeOrders: { where: { status: 'APPROVED' } } },
        });

        const transactions = await prisma.budgetTransaction.findMany({
            where: { projectId },
        });

        const originalBudget = Number(project.budget);
        const approvedChanges = project.changeOrders.reduce((sum: number, co: any) => sum + Number(co.amount), 0);
        const currentBudget = originalBudget + approvedChanges;
        const spent = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

        return {
            projectId,
            originalBudget,
            approvedChanges,
            currentBudget,
            spent,
            remaining: currentBudget - spent,
            percentComplete: currentBudget > 0 ? (spent / currentBudget) * 100 : 0,
        };
    }
}
