
import { prisma } from '../../core/db';
import { getEventBus, EVENT_TYPES } from '../../core/events';

export class DelayPredictor {
    async predictDelay(projectId: string): Promise<any> {
        const features = await this.extractFeatures(projectId);
        const prediction = this.ruleBasedPredict(features);

        // Mock DB save
        // await prisma.prediction.create(...)

        return {
            projectId,
            ...prediction,
            predictedAt: new Date()
        };
    }

    private async extractFeatures(projectId: string): Promise<Record<string, number>> {
        // Mock data fetch
        return {
            percentComplete: 45,
            milestonesOverdue: 2,
            milestonesTotal: 10,
            changeOrderCount: 4,
        };
    }

    private ruleBasedPredict(features: Record<string, number>): any {
        let riskScore = 0;
        const factors: any[] = [];

        if (features.milestonesOverdue > 0) {
            riskScore += 0.3;
            factors.push({ name: 'Overdue Milestones', impact: 0.3 });
        }

        if (features.changeOrderCount > 3) {
            riskScore += 0.2;
            factors.push({ name: 'High Change Order Volume', impact: 0.2 });
        }

        const probability = Math.min(riskScore, 1);
        const expectedDays = Math.ceil(probability * 14);

        return {
            probability,
            expectedDays,
            confidence: 0.7,
            factors,
            recommendation: probability > 0.5 ? 'High delay risk detected. Review schedule immediately.' : 'Project appears on track.',
        };
    }
}
