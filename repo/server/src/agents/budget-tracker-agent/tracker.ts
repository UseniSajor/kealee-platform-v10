
import { prisma } from '../../core/db';

export class BudgetTracker {
    async getBudgetSummary(projectId: string): Promise<any> {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { changeOrders: { where: { status: 'APPROVED' } } },
        }) || {
            // Mock if not found
            name: 'Demo Project',
            budget: 500000,
            changeOrders: []
        };

        // Mock transactions
        const transactions = [
            { type: 'EXPENSE', amount: 15000, description: 'Materials' },
            { type: 'EXPENSE', amount: 35000, description: 'Labor' },
        ];

        const originalBudget = Number(project.budget) || 500000;
        const approvedChanges = project.changeOrders?.reduce((sum: number, co: any) => sum + Number(co.amount), 0) || 0;
        const currentBudget = originalBudget + approvedChanges;
        const spent = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);

        return {
            projectId,
            originalBudget,
            approvedChanges,
            currentBudget,
            spent,
            remaining: currentBudget - spent,
            percentComplete: (spent / currentBudget) * 100,
        };
    }
}
