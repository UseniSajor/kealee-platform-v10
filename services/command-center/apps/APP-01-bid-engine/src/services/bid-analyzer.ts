/**
 * APP-01: CONTRACTOR BID ENGINE
 * Bid Analysis Service
 */

import { PrismaClient } from '@prisma/client';
import { BidAnalysis, BidComparison, BidRecommendation } from '../types.js';
import { generateBidComparisonNarrative } from '../../../../shared/ai/claude.js';
import { formatCurrency } from '../../../../shared/utils/money.js';
import { getEventBus, EVENT_TYPES } from '../../../../shared/events.js';
import { autonomyEngine } from '../../../../shared/autonomy/index.js';

const prisma = new PrismaClient();

export class BidAnalyzer {
  // Updated scoring weights — now includes contractor reliability
  private readonly WEIGHTS = {
    price: 0.25,       // was 0.35 — still important but balanced by reliability
    timeline: 0.10,    // was 0.25 — timeline detail matters less than actual track record
    reliability: 0.25, // NEW — from ContractorScore.overallScore
    scope: 0.15,       // was 0.25 — scope clarity still valued
    qualifications: 0.10, // was 0.15 — complemented by reliability data
    availability: 0.05,   // NEW — bonus for no overlapping projects
  };

  /**
   * Analyze all bids for a request and generate comparison
   */
  async analyzeBids(bidRequestId: string): Promise<BidComparison> {
    const bidRequest = await prisma.bidRequest.findUniqueOrThrow({
      where: { id: bidRequestId },
      include: {
        project: true,
        bidSubmissions: {
          include: { contractor: true },
          where: { status: { not: 'WITHDRAWN' } },
        },
      },
    });

    if (bidRequest.bidSubmissions.length === 0) {
      throw new Error('No bids submitted for analysis');
    }

    // Calculate baseline metrics
    const prices = bidRequest.bidSubmissions.map(s => Number(s.amount));
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const projectBudget = Number(bidRequest.project.budget) || avgPrice;

    // Analyze each submission
    const analyses: BidAnalysis[] = await Promise.all(
      bidRequest.bidSubmissions.map(submission =>
        this.analyzeSubmission(submission as unknown as {
          id: string;
          amount: number;
          timeline: unknown;
          scope: unknown;
          contractor: {
            companyName: string;
            rating: number;
            id: string;
          };
        }, {
          avgPrice,
          minPrice,
          projectBudget,
        })
      )
    );

    // Sort by overall score and assign ranks
    analyses.sort((a, b) => b.overallScore - a.overallScore);
    analyses.forEach((analysis, index) => {
      analysis.rank = index + 1;
    });

    // Generate AI narrative
    const aiNarrative = await generateBidComparisonNarrative(
      bidRequest.project.name || 'Unnamed Project',
      analyses.map(a => ({
        rank: a.rank,
        contractorName: a.contractorName,
        amount: a.amount,
        overallScore: a.overallScore,
        recommendation: a.recommendation,
        strengths: a.strengths,
        concerns: a.concerns,
      }))
    );

    const comparison: BidComparison = {
      projectId: bidRequest.projectId,
      bidRequestId,
      analyses,
      summary: {
        totalBids: analyses.length,
        averagePrice: avgPrice,
        medianPrice,
        priceRange: { min: minPrice, max: maxPrice },
        recommendedContractor: analyses[0].contractorName,
        recommendedContractorId: bidRequest.bidSubmissions.find(
          s => s.id === analyses[0].submissionId
        )?.contractorId || '',
        aiNarrative,
      },
      generatedAt: new Date(),
    };

    // Store analysis results in database
    for (const analysis of analyses) {
      await prisma.bidSubmission.update({
        where: { id: analysis.submissionId },
        data: {
          score: analysis.overallScore,
          recommendation: analysis.recommendation,
          analysisData: {
            priceScore: analysis.priceScore,
            timelineScore: analysis.timelineScore,
            scopeScore: analysis.scopeScore,
            qualificationScore: analysis.qualificationScore,
            strengths: analysis.strengths,
            concerns: analysis.concerns,
            rank: analysis.rank,
          },
        },
      });
    }

    // Emit analysis complete event
    await getEventBus('bid-engine').publish(
      EVENT_TYPES.BID_ANALYSIS_COMPLETE,
      {
        bidRequestId,
        projectId: bidRequest.projectId,
        projectName: bidRequest.project.name,
        totalBids: analyses.length,
        recommendedContractor: analyses[0].contractorName,
        recommendedAmount: analyses[0].amount,
      }
    );

    // ── Autonomy: Auto-reject late bids and auto-award clear winners ──
    try {
      // Auto-reject bids submitted after deadline
      if (bidRequest.deadline && new Date() > new Date(bidRequest.deadline)) {
        const lateBids = bidRequest.bidSubmissions.filter(
          s => s.submittedAt && new Date(s.submittedAt) > new Date(bidRequest.deadline!)
        );
        for (const lateBid of lateBids) {
          await autonomyEngine.evaluateAndAct({
            projectId: bidRequest.projectId,
            category: 'bid_management',
            appSource: 'APP-01',
            actionType: 'bid_reject_late',
            description: `Auto-reject late bid from ${lateBid.contractor.companyName} (submitted after deadline)`,
            confidence: 95,
            metadata: {
              bidSubmissionId: lateBid.id,
              bidRequestId,
              contractorName: lateBid.contractor.companyName,
              submittedAt: lateBid.submittedAt,
              deadline: bidRequest.deadline,
            },
          });
        }
      }

      // Auto-award if clear winner (score >85, gap >15 from #2)
      if (analyses.length >= 2 && analyses[0].overallScore > 85) {
        const gap = analyses[0].overallScore - analyses[1].overallScore;
        if (gap > 15) {
          await autonomyEngine.evaluateAndAct({
            projectId: bidRequest.projectId,
            category: 'bid_management',
            appSource: 'APP-01',
            actionType: 'bid_award',
            description: `Auto-recommend award to ${analyses[0].contractorName} (score ${analyses[0].overallScore}, ${gap}pt gap)`,
            confidence: Math.min(95, 70 + gap),
            amount: analyses[0].amount,
            metadata: {
              bidRequestId,
              winnerId: analyses[0].submissionId,
              winnerName: analyses[0].contractorName,
              winnerScore: analyses[0].overallScore,
              runnerUpScore: analyses[1].overallScore,
              gap,
            },
          });
        }
      }
    } catch (err) {
      console.warn('[BidAnalyzer] Autonomy check failed:', err);
    }
    // ── End Autonomy ──

    return comparison;
  }

  /**
   * Analyze a single bid submission
   */
  private async analyzeSubmission(
    submission: {
      id: string;
      amount: number;
      timeline: unknown;
      scope: unknown;
      contractor: {
        companyName: string;
        rating: number;
        id: string;
      };
    },
    context: { avgPrice: number; minPrice: number; projectBudget: number }
  ): Promise<BidAnalysis> {
    const strengths: string[] = [];
    const concerns: string[] = [];
    const amount = Number(submission.amount);
    const timeline = submission.timeline as {
      totalDays?: number;
      milestones?: unknown[];
      startDate?: string;
    } | null;
    const scope = submission.scope as {
      inclusions?: string[];
      exclusions?: string[];
      clarifications?: string[];
    } | null;

    // Price Score (0-100)
    const priceScore = this.calculatePriceScore(amount, context, strengths, concerns);

    // Timeline Score (0-100)
    const timelineScore = this.calculateTimelineScore(timeline, strengths, concerns);

    // Scope Score (0-100)
    const scopeScore = this.calculateScopeScore(scope, strengths, concerns);

    // Qualification Score (0-100)
    const qualificationScore = await this.calculateQualificationScore(
      submission.contractor,
      strengths,
      concerns
    );

    // Reliability Score (0-100) — from ContractorScore
    let reliabilityScore = 50; // Default for unscored contractors
    try {
      const contractorScore = await (prisma as any).contractorScore?.findUnique?.({
        where: { contractorId: submission.contractor.id },
      });
      if (contractorScore) {
        reliabilityScore = contractorScore.overallScore;
        if (contractorScore.confidence === 'high' && contractorScore.overallScore >= 80) {
          strengths.push(`High reliability score (${contractorScore.overallScore}/100, verified)`);
        } else if (contractorScore.confidence === 'medium' && contractorScore.overallScore >= 70) {
          strengths.push(`Good reliability track record (${contractorScore.overallScore}/100)`);
        } else if (contractorScore.overallScore < 50) {
          concerns.push(`Below-average reliability score (${contractorScore.overallScore}/100)`);
        }
      } else {
        strengths.push('New contractor — building track record');
      }
    } catch {
      // ContractorScore not available — use default
    }

    // Availability Score (0-100) — bonus for no overlapping projects
    let availabilityScore = 70; // Default
    try {
      const activeProjects = await prisma.contractorProject.count({
        where: {
          contractorId: submission.contractor.id,
          status: { in: ['IN_PROGRESS', 'SCHEDULED'] },
        },
      });
      if (activeProjects === 0) {
        availabilityScore = 100;
        strengths.push('Fully available — no concurrent projects');
      } else if (activeProjects <= 2) {
        availabilityScore = 80;
      } else if (activeProjects <= 4) {
        availabilityScore = 50;
        concerns.push(`Currently managing ${activeProjects} active projects`);
      } else {
        availabilityScore = 30;
        concerns.push(`Heavy workload (${activeProjects} active projects)`);
      }
    } catch {
      // Availability check failed — use default
    }

    // Calculate weighted overall score (now with 6 factors)
    const overallScore =
      priceScore * this.WEIGHTS.price +
      timelineScore * this.WEIGHTS.timeline +
      reliabilityScore * this.WEIGHTS.reliability +
      scopeScore * this.WEIGHTS.scope +
      qualificationScore * this.WEIGHTS.qualifications +
      availabilityScore * this.WEIGHTS.availability;

    // Determine recommendation
    const recommendation = this.getRecommendation(overallScore, concerns);

    return {
      submissionId: submission.id,
      contractorName: submission.contractor.companyName,
      amount,
      priceScore,
      timelineScore,
      scopeScore,
      qualificationScore,
      overallScore,
      strengths,
      concerns,
      recommendation,
      rank: 0, // Set later when comparing all bids
    };
  }

  /**
   * Calculate price score
   */
  private calculatePriceScore(
    amount: number,
    context: { avgPrice: number; minPrice: number; projectBudget: number },
    strengths: string[],
    concerns: string[]
  ): number {
    const priceRatio = amount / context.avgPrice;
    let score: number;

    if (priceRatio <= 0.85) {
      score = 95;
      strengths.push(`Competitive pricing (${Math.round((1 - priceRatio) * 100)}% below average)`);

      // Very low price warning
      if (amount < context.minPrice * 1.05 && amount < context.avgPrice * 0.75) {
        concerns.push('Pricing significantly below competitors - verify scope understanding');
        score = Math.min(score, 70);
      }
    } else if (priceRatio <= 0.95) {
      score = 85;
      strengths.push('Pricing below market average');
    } else if (priceRatio <= 1.05) {
      score = 75;
      strengths.push('Pricing at market average');
    } else if (priceRatio <= 1.15) {
      score = 60;
      concerns.push(`Pricing ${Math.round((priceRatio - 1) * 100)}% above average`);
    } else if (priceRatio <= 1.25) {
      score = 45;
      concerns.push(`Premium pricing (${Math.round((priceRatio - 1) * 100)}% above average)`);
    } else {
      score = 30;
      concerns.push(`Significant premium (${Math.round((priceRatio - 1) * 100)}% above average)`);
    }

    // Budget alignment bonus/penalty
    if (amount <= context.projectBudget) {
      strengths.push('Within project budget');
      score = Math.min(100, score + 5);
    } else if (amount > context.projectBudget * 1.1) {
      concerns.push(`Exceeds project budget by ${Math.round((amount / context.projectBudget - 1) * 100)}%`);
    }

    return score;
  }

  /**
   * Calculate timeline score
   */
  private calculateTimelineScore(
    timeline: { totalDays?: number; milestones?: unknown[]; startDate?: string } | null,
    strengths: string[],
    concerns: string[]
  ): number {
    let score = 70; // Base score

    if (!timeline || !timeline.totalDays) {
      concerns.push('Timeline details not provided');
      return 40;
    }

    // Milestone detail bonus
    if (timeline.milestones && timeline.milestones.length > 3) {
      score += 15;
      strengths.push('Detailed milestone schedule provided');
    } else if (timeline.milestones && timeline.milestones.length > 0) {
      score += 5;
    }

    // Quick mobilization bonus
    if (timeline.startDate) {
      const startDate = new Date(timeline.startDate);
      const daysUntilStart = Math.ceil(
        (startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilStart <= 14) {
        score += 10;
        strengths.push('Quick mobilization capability');
      } else if (daysUntilStart <= 30) {
        score += 5;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate scope score
   */
  private calculateScopeScore(
    scope: { inclusions?: string[]; exclusions?: string[]; clarifications?: string[] } | null,
    strengths: string[],
    concerns: string[]
  ): number {
    let score = 70; // Base score

    if (!scope || (!scope.inclusions?.length && !scope.exclusions?.length)) {
      concerns.push('Scope details insufficient');
      return 40;
    }

    // Comprehensive inclusions bonus
    if (scope.inclusions && scope.inclusions.length > 5) {
      score += 15;
      strengths.push('Comprehensive scope inclusions');
    } else if (scope.inclusions && scope.inclusions.length > 2) {
      score += 5;
    }

    // Clear exclusions bonus
    if (scope.exclusions && scope.exclusions.length > 0) {
      score += 10;
      strengths.push('Clear exclusions defined');
    }

    // Clarifications bonus
    if (scope.clarifications && scope.clarifications.length > 0) {
      score += 5;
      strengths.push('Proactive clarifications provided');
    }

    return Math.min(100, score);
  }

  /**
   * Calculate qualification score
   */
  private async calculateQualificationScore(
    contractor: { companyName: string; rating: number; id: string },
    strengths: string[],
    concerns: string[]
  ): Promise<number> {
    let score = 70; // Base score

    // Rating bonus/penalty
    if (contractor.rating >= 4.5) {
      score += 20;
      strengths.push(`Excellent rating (${contractor.rating.toFixed(1)}★)`);
    } else if (contractor.rating >= 4.0) {
      score += 10;
      strengths.push(`Good rating (${contractor.rating.toFixed(1)}★)`);
    } else if (contractor.rating < 3.5) {
      score -= 20;
      concerns.push(`Lower rating (${contractor.rating.toFixed(1)}★)`);
    }

    // Check past performance
    const pastProjects = await prisma.contractorProject.count({
      where: {
        contractorId: contractor.id,
        status: 'COMPLETED',
      },
    });

    if (pastProjects >= 10) {
      score += 10;
      strengths.push(`${pastProjects} projects completed`);
    } else if (pastProjects >= 5) {
      score += 5;
    } else if (pastProjects < 2) {
      concerns.push('Limited project history');
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get recommendation based on score and concerns
   */
  private getRecommendation(score: number, concerns: string[]): BidRecommendation {
    const criticalConcerns = concerns.filter(c =>
      c.includes('significantly below') ||
      c.includes('Exceeds project budget') ||
      c.includes('Lower rating')
    );

    if (criticalConcerns.length > 0 && score < 70) {
      return 'NOT_RECOMMENDED';
    }

    if (score >= 85) {
      return 'HIGHLY_RECOMMENDED';
    } else if (score >= 70) {
      return 'RECOMMENDED';
    } else if (score >= 55) {
      return 'ACCEPTABLE';
    } else {
      return 'NOT_RECOMMENDED';
    }
  }

  /**
   * Generate quick comparison summary
   */
  async getQuickComparison(bidRequestId: string): Promise<{
    lowestBid: { contractor: string; amount: number };
    highestBid: { contractor: string; amount: number };
    bestValue: { contractor: string; amount: number; score: number };
    averagePrice: number;
    bidCount: number;
  }> {
    const submissions = await prisma.bidSubmission.findMany({
      where: {
        bidRequestId,
        status: { not: 'WITHDRAWN' },
      },
      include: { contractor: true },
      orderBy: { amount: 'asc' },
    });

    if (submissions.length === 0) {
      throw new Error('No bids found');
    }

    const amounts = submissions.map(s => Number(s.amount));
    const avgPrice = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    const bestValue = submissions.reduce((best, current) => {
      const currentScore = Number(current.score || 0);
      const bestScore = Number(best.score || 0);
      return currentScore > bestScore ? current : best;
    }, submissions[0]);

    return {
      lowestBid: {
        contractor: submissions[0].contractor.companyName,
        amount: Number(submissions[0].amount),
      },
      highestBid: {
        contractor: submissions[submissions.length - 1].contractor.companyName,
        amount: Number(submissions[submissions.length - 1].amount),
      },
      bestValue: {
        contractor: bestValue.contractor.companyName,
        amount: Number(bestValue.amount),
        score: Number(bestValue.score || 0),
      },
      averagePrice: avgPrice,
      bidCount: submissions.length,
    };
  }
}
