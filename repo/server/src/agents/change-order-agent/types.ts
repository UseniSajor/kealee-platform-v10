
export interface ChangeOrderRequest {
    projectId: string;
    amount: number;
    description: string;
    reason: string;
    scheduleImpact?: number;
}

export interface ImpactAnalysis {
    costImpact: {
        directCost: number;
        overhead: number;
        contingency: number;
        totalCost: number;
    };
    scheduleImpact: {
        directDays: number;
        cascadeDays: number;
        totalDays: number;
        affectedMilestones: string[];
    };
    budgetStatus: {
        originalBudget: number;
        approvedChanges: number;
        thisCO: number;
        newTotal: number;
        percentIncrease: number;
    };
    riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendation: string;
}
