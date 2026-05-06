
import { prisma } from '../../core/db';
import { getEventBus, EVENT_TYPES } from '../../core/events';
import { generateText } from '../../core/ai';
import { formatCurrency } from '../../core/utils';
import { BidComparison, BidAnalysis } from './types';

export class BidAnalyzer {
    private readonly WEIGHTS = {
        price: 0.35,
        timeline: 0.25,
        scope: 0.25,
        qualifications: 0.15,
    };

    async analyzeBids(bidRequestId: string): Promise<BidComparison> {
        const bidRequest = await prisma.bidRequest.findUniqueOrThrow({
            where: { id: bidRequestId },
            include: {
                project: true,
                submissions: { include: { contractor: true } },
            },
        });

        if (bidRequest.submissions.length === 0) {
            throw new Error('No bids submitted');
        }

        const prices = bidRequest.submissions.map(s => Number(s.amount));
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        const analyses: BidAnalysis[] = bidRequest.submissions.map(submission => {
            return this.analyzeSubmission(submission, {
                avgPrice,
                minPrice,
                projectBudget: Number(bidRequest.project.budget) || avgPrice,
            });
        });

        analyses.sort((a, b) => b.overallScore - a.overallScore);
        analyses.forEach((analysis, index) => {
            analysis.rank = index + 1;
        });

        const aiNarrative = await this.generateComparisonNarrative(
            bidRequest.project.name,
            analyses
        );

        const comparison: BidComparison = {
            projectId: bidRequest.projectId,
            bidRequestId,
            analyses,
            summary: {
                totalBids: analyses.length,
                averagePrice: avgPrice,
                priceRange: { min: minPrice, max: maxPrice },
                recommendedContractor: analyses[0].contractorName,
                aiNarrative,
            },
            generatedAt: new Date(),
        };

        for (const analysis of analyses) {
            await prisma.bidSubmission.update({
                where: { id: analysis.submissionId },
                data: {
                    score: analysis.overallScore,
                    recommendation: analysis.recommendation,
                },
            });
        }

        await getEventBus().publish(
            EVENT_TYPES.BID_ANALYSIS_COMPLETE,
            {
                bidRequestId,
                projectId: bidRequest.projectId,
                totalBids: analyses.length,
                recommendedContractor: analyses[0].contractorName,
            },
            'bid-engine'
        );

        return comparison;
    }

    private analyzeSubmission(
        submission: any,
        context: { avgPrice: number; minPrice: number; projectBudget: number }
    ): BidAnalysis {
        const strengths: string[] = [];
        const concerns: string[] = [];
        const amount = Number(submission.amount);
        const timeline = submission.timeline as any;
        const scope = submission.scope as any;

        let priceScore: number;
        const priceRatio = amount / context.avgPrice;

        if (priceRatio <= 0.9) {
            priceScore = 95;
            strengths.push(`Competitive pricing (${Math.round((1 - priceRatio) * 100)}% below average)`);
        } else if (priceRatio <= 1.0) {
            priceScore = 85;
            strengths.push('Pricing at or below market average');
        } else if (priceRatio <= 1.1) {
            priceScore = 70;
        } else if (priceRatio <= 1.2) {
            priceScore = 50;
            concerns.push(`Pricing ${Math.round((priceRatio - 1) * 100)}% above average`);
        } else {
            priceScore = 30;
            concerns.push(`Significant premium pricing (${Math.round((priceRatio - 1) * 100)}% above average)`);
        }

        if (amount < context.minPrice * 1.05 && amount < context.avgPrice * 0.8) {
            concerns.push('Pricing significantly below competitors - verify scope understanding');
            priceScore = Math.min(priceScore, 60);
        }

        let timelineScore = 70;
        if (timeline?.milestones?.length > 3) {
            timelineScore += 15;
            strengths.push('Detailed milestone schedule provided');
        }
        if (timeline?.startDate && new Date(timeline.startDate) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)) {
            timelineScore += 10;
            strengths.push('Quick mobilization capability');
        }
        if (!timeline || !timeline.totalDays) {
            timelineScore = 40;
            concerns.push('Timeline details not provided');
        }

        let scopeScore = 70;
        if (scope?.inclusions?.length > 5) {
            scopeScore += 15;
            strengths.push('Comprehensive scope inclusions');
        }
        if (scope?.exclusions?.length > 0) {
            scopeScore += 10;
            strengths.push('Clear exclusions defined');
        }
        if (!scope || Object.keys(scope).length < 2) {
            scopeScore = 40;
            concerns.push('Scope details insufficient');
        }

        let qualificationScore = 70;
        const contractor = submission.contractor;

        if (contractor.rating >= 4.5) {
            qualificationScore += 20;
            strengths.push(`Excellent rating (${contractor.rating}★)`);
        } else if (contractor.rating >= 4.0) {
            qualificationScore += 10;
        } else if (contractor.rating < 3.5) {
            qualificationScore -= 20;
            concerns.push(`Lower rating (${contractor.rating}★)`);
        }

        const overallScore =
            priceScore * this.WEIGHTS.price +
            timelineScore * this.WEIGHTS.timeline +
            scopeScore * this.WEIGHTS.scope +
            qualificationScore * this.WEIGHTS.qualifications;

        let recommendation: BidAnalysis['recommendation'];
        if (overallScore >= 85) recommendation = 'HIGHLY_RECOMMENDED';
        else if (overallScore >= 70) recommendation = 'RECOMMENDED';
        else if (overallScore >= 55) recommendation = 'ACCEPTABLE';
        else recommendation = 'NOT_RECOMMENDED';

        return {
            submissionId: submission.id,
            contractorName: contractor.companyName,
            amount,
            priceScore,
            timelineScore,
            scopeScore,
            qualificationScore,
            overallScore,
            strengths,
            concerns,
            recommendation,
            rank: 0,
        };
    }

    private async generateComparisonNarrative(
        projectName: string,
        analyses: BidAnalysis[]
    ): Promise<string> {
        const prompt = `Generate a brief executive summary (2-3 paragraphs) comparing these contractor bids for "${projectName}":

${analyses.map((a, i) => `
#${i + 1} ${a.contractorName}
- Amount: ${formatCurrency(a.amount)}
- Overall Score: ${a.overallScore.toFixed(1)}/100
- Recommendation: ${a.recommendation}
- Strengths: ${a.strengths.join(', ')}
- Concerns: ${a.concerns.join(', ') || 'None'}
`).join('\n')}

Provide an objective analysis highlighting key differences and the rationale for the top recommendation.`;

        return generateText(prompt, 'You are a construction consultant providing bid analysis.');
    }
}
