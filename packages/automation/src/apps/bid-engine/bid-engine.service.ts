import { PrismaClient, Prisma } from '@prisma/client';
import { generateText } from '../../infrastructure/ai.js';
import { AI_PROMPTS } from '../../infrastructure/ai-prompts.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';

const prisma = new PrismaClient();

const SOURCE_APP = 'APP-01';
const DEFAULT_MAX_BID_OVERAGE_PCT = 3; // 3% above estimated value

interface MatchedContractor {
  id: string;
  companyName: string;
  trades: string[];
  rating: number;
  latitude: number | null;
  longitude: number | null;
  projectsCompleted: number;
  lastWonAt: Date | null;
}

interface BidValidationResult {
  valid: boolean;
  maxAllowed: Prisma.Decimal;
  overagePercent: number;
}

/**
 * Calculate distance between two lat/lng points in miles (Haversine formula).
 */
function haversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class BidEngineService {
  // -------------------------------------------------------------------------
  // matchContractors
  // -------------------------------------------------------------------------

  async matchContractors(leadId: string): Promise<MatchedContractor[]> {
    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: leadId },
      include: { project: true },
    });

    // Find verified contractors whose trades overlap with the lead category
    const contractors = await prisma.contractor.findMany({
      where: {
        isVerified: true,
        status: 'ACTIVE',
        trades: { hasSome: [lead.category] },
      },
      include: {
        contractorProjects: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Sort by fair rotation: contractors who haven't won recently go first
    const sorted = contractors.sort((a, b) => {
      if (!a.createdAt && b.createdAt) return -1;
      if (a.createdAt && !b.createdAt) return 1;
      return 0;
    });

    const top = sorted.slice(0, 10);

    return top.map((c) => ({
      id: c.id,
      companyName: c.companyName,
      trades: c.trades,
      rating: Number(c.rating),
      latitude: c.latitude,
      longitude: c.longitude,
      projectsCompleted: c.contractorProjects.length,
      lastWonAt: null,
    }));
  }

  // -------------------------------------------------------------------------
  // scoreBid
  // -------------------------------------------------------------------------

  async scoreBid(bidId: string): Promise<void> {
    const bid = await prisma.bid.findUniqueOrThrow({
      where: { id: bidId },
      include: { evaluation: { include: { project: true } } },
    });

    const contractor = await prisma.contractor.findUnique({
      where: { id: bid.contractorId },
      include: { contractorProjects: true },
    });

    const evaluation = bid.evaluation;
    const project = evaluation.project;

    // --- Price score (0–100) ---
    // Lower bid relative to project budget = higher score
    const budget = project.budget ? Number(project.budget) : null;
    const bidAmount = Number(bid.amount);
    let priceScore = 50; // default if no budget reference
    if (budget && budget > 0) {
      const ratio = bidAmount / budget;
      // At or below budget = 100; up to 3% over = 70; beyond that drops
      if (ratio <= 1) {
        priceScore = 100;
      } else if (ratio <= 1.03) {
        priceScore = 100 - ((ratio - 1) / 0.03) * 30;
      } else {
        priceScore = Math.max(0, 70 - ((ratio - 1.03) / 0.1) * 70);
      }
    }

    // --- Timeline score (0–100) ---
    let timelineScore = 70;
    if (project.scheduledStartDate && project.scheduledEndDate) {
      const expectedDays = Math.ceil(
        (project.scheduledEndDate.getTime() - project.scheduledStartDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (expectedDays > 0) {
        const ratio = bid.timeline / expectedDays;
        if (ratio <= 1) timelineScore = 100;
        else if (ratio <= 1.2) timelineScore = 100 - ((ratio - 1) / 0.2) * 40;
        else timelineScore = Math.max(0, 60 - ((ratio - 1.2) / 0.3) * 60);
      }
    }

    // --- Quality score (0–100) ---
    let qualityScore = 50;
    if (contractor) {
      const rating = Number(contractor.rating);
      const completedJobs = contractor.contractorProjects.length;
      // Rating contributes 70%, experience 30%
      const ratingPart = (rating / 5) * 100;
      const expPart = Math.min(completedJobs / 20, 1) * 100;
      qualityScore = ratingPart * 0.7 + expPart * 0.3;
    }

    // --- Proximity score (0–100) ---
    let proximityScore = 50;
    if (
      contractor?.latitude &&
      contractor?.longitude &&
      project.latitude &&
      project.longitude
    ) {
      const distance = haversineDistanceMiles(
        contractor.latitude,
        contractor.longitude,
        project.latitude,
        project.longitude,
      );
      // Within 10 miles = 100, within 50 miles = 50, beyond 100 = 0
      if (distance <= 10) proximityScore = 100;
      else if (distance <= 50) proximityScore = 100 - ((distance - 10) / 40) * 50;
      else if (distance <= 100) proximityScore = 50 - ((distance - 50) / 50) * 50;
      else proximityScore = 0;
    }

    // --- Availability score (0–100) ---
    let availabilityScore = 70;
    if (contractor) {
      const activeProjects = contractor.contractorProjects.length;
      // Fewer active projects = more available
      if (activeProjects === 0) availabilityScore = 100;
      else if (activeProjects <= 3) availabilityScore = 90 - activeProjects * 10;
      else if (activeProjects <= 8) availabilityScore = 60 - (activeProjects - 3) * 8;
      else availabilityScore = Math.max(0, 20);
    }

    // --- Weighted total ---
    const wp = Number(evaluation.weightPrice);
    const wt = Number(evaluation.weightTimeline);
    const wq = Number(evaluation.weightQuality);
    const wpr = Number(evaluation.weightProximity);
    const wa = Number(evaluation.weightAvailability);

    const totalScore =
      priceScore * wp +
      timelineScore * wt +
      qualityScore * wq +
      proximityScore * wpr +
      availabilityScore * wa;

    await prisma.bid.update({
      where: { id: bidId },
      data: {
        qualityScore: new Prisma.Decimal(qualityScore.toFixed(2)),
        proximityScore: new Prisma.Decimal(proximityScore.toFixed(2)),
        availabilityScore: new Prisma.Decimal(availabilityScore.toFixed(2)),
        totalScore: new Prisma.Decimal(totalScore.toFixed(2)),
      },
    });
  }

  // -------------------------------------------------------------------------
  // evaluateBids
  // -------------------------------------------------------------------------

  async evaluateBids(evaluationId: string): Promise<void> {
    const evaluation = await prisma.bidEvaluation.findUniqueOrThrow({
      where: { id: evaluationId },
      include: { bids: true, project: true },
    });

    // Score each bid
    for (const bid of evaluation.bids) {
      await this.scoreBid(bid.id);
    }

    // Re-fetch with updated scores
    const scoredBids = await prisma.bid.findMany({
      where: { evaluationId },
      orderBy: { totalScore: 'desc' },
    });

    // Assign ranks
    for (let i = 0; i < scoredBids.length; i++) {
      await prisma.bid.update({
        where: { id: scoredBids[i].id },
        data: { rank: i + 1 },
      });
    }

    // Generate AI recommendation if we have enough bids
    let aiRecommendation: string | null = null;
    if (scoredBids.length >= 2) {
      const bidSummary = scoredBids
        .map(
          (b, i) =>
            `Bid #${i + 1} (Contractor ${b.contractorId}): ` +
            `$${b.amount}, ${b.timeline} days, ` +
            `Quality: ${b.qualityScore}, Proximity: ${b.proximityScore}, ` +
            `Availability: ${b.availabilityScore}, Total: ${b.totalScore}` +
            (b.scope ? `, Scope: ${b.scope}` : ''),
        )
        .join('\n');

      try {
        const result = await generateText({
          systemPrompt: AI_PROMPTS.DECISION_SUPPORT,
          userPrompt:
            `Evaluate the following bids for trade "${evaluation.trade}" on project ${evaluation.projectId}.\n\n` +
            `Scoring weights: Price ${Number(evaluation.weightPrice) * 100}%, ` +
            `Timeline ${Number(evaluation.weightTimeline) * 100}%, ` +
            `Quality ${Number(evaluation.weightQuality) * 100}%, ` +
            `Proximity ${Number(evaluation.weightProximity) * 100}%, ` +
            `Availability ${Number(evaluation.weightAvailability) * 100}%.\n\n` +
            `Bids:\n${bidSummary}\n\n` +
            `Recommend which bid to accept and explain why. Consider value, risk, and overall fit.`,
          maxTokens: 1000,
        });
        aiRecommendation = result.text;
      } catch (err) {
        console.error('[BidEngine] AI recommendation failed:', (err as Error).message);
      }
    }

    // Update evaluation
    await prisma.bidEvaluation.update({
      where: { id: evaluationId },
      data: {
        status: 'evaluated',
        aiRecommendation,
      },
    });

    // Create decision queue item for PM
    const pmId = evaluation.project.pmId;
    if (pmId) {
      const topBid = scoredBids[0];
      await prisma.decisionQueue.create({
        data: {
          projectId: evaluation.projectId,
          pmId,
          type: 'bid_award',
          title: `Award bid for ${evaluation.trade}`,
          context: {
            evaluationId,
            trade: evaluation.trade,
            bidCount: scoredBids.length,
            topBid: topBid
              ? {
                  id: topBid.id,
                  contractorId: topBid.contractorId,
                  amount: topBid.amount.toString(),
                  totalScore: topBid.totalScore?.toString(),
                }
              : null,
          },
          aiRecommendation,
          options: scoredBids.slice(0, 5).map((b) => ({
            bidId: b.id,
            contractorId: b.contractorId,
            amount: b.amount.toString(),
            totalScore: b.totalScore?.toString(),
            rank: b.rank,
          })),
        },
      });

      await eventBus.publish(
        EVENT_TYPES.DECISION_NEEDED,
        {
          evaluationId,
          projectId: evaluation.projectId,
          trade: evaluation.trade,
          bidCount: scoredBids.length,
        },
        SOURCE_APP,
        { projectId: evaluation.projectId },
      );
    }
  }

  // -------------------------------------------------------------------------
  // acceptBid
  // -------------------------------------------------------------------------

  async acceptBid(bidId: string): Promise<void> {
    const bid = await prisma.bid.findUniqueOrThrow({
      where: { id: bidId },
      include: { evaluation: { include: { project: true } } },
    });

    // Mark bid as accepted
    await prisma.bid.update({
      where: { id: bidId },
      data: { status: 'accepted' },
    });

    // Mark other bids as rejected
    await prisma.bid.updateMany({
      where: {
        evaluationId: bid.evaluationId,
        id: { not: bidId },
      },
      data: { status: 'rejected' },
    });

    // Update evaluation
    await prisma.bidEvaluation.update({
      where: { id: bid.evaluationId },
      data: {
        status: 'awarded',
        selectedBidId: bidId,
      },
    });

    // Publish event
    await eventBus.publish(
      EVENT_TYPES.BID_ACCEPTED,
      {
        bidId,
        evaluationId: bid.evaluationId,
        contractorId: bid.contractorId,
        amount: bid.amount.toString(),
        trade: bid.evaluation.trade,
      },
      SOURCE_APP,
      { projectId: bid.evaluation.projectId },
    );
  }

  // -------------------------------------------------------------------------
  // validateBid
  // -------------------------------------------------------------------------

  async validateBid(
    evaluationId: string,
    amount: Prisma.Decimal,
  ): Promise<BidValidationResult> {
    const evaluation = await prisma.bidEvaluation.findUniqueOrThrow({
      where: { id: evaluationId },
      include: { project: true },
    });

    const budget = evaluation.project.budget;
    if (!budget) {
      // No budget reference — accept any amount
      return {
        valid: true,
        maxAllowed: amount,
        overagePercent: 0,
      };
    }

    const budgetNum = Number(budget);
    const maxAllowed = budgetNum * (1 + DEFAULT_MAX_BID_OVERAGE_PCT / 100);
    const amountNum = Number(amount);
    const overagePercent =
      budgetNum > 0 ? ((amountNum - budgetNum) / budgetNum) * 100 : 0;

    return {
      valid: amountNum <= maxAllowed,
      maxAllowed: new Prisma.Decimal(maxAllowed.toFixed(2)),
      overagePercent: Math.max(0, overagePercent),
    };
  }
}
