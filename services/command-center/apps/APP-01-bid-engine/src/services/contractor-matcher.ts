/**
 * APP-01: CONTRACTOR BID ENGINE
 * Contractor Matching Service
 */

import { PrismaClient } from '@prisma/client';
import { MatchCriteria, MatchResult, ContractorProfile } from '../types.js';
import { calculateDistance } from '../../../../shared/integrations/maps.js';

const prisma = new PrismaClient();

export class ContractorMatcher {
  private readonly MAX_DISTANCE_MILES = 50;
  private readonly MIN_RATING = 3.5;
  private readonly MAX_MATCHES = 10;

  // Scoring weights
  private readonly WEIGHTS = {
    distance: 25,
    tradeMatch: 25,
    rating: 20,
    history: 15,
    credentials: 15,
  };

  /**
   * Find matching contractors for a bid request
   */
  async findMatches(criteria: MatchCriteria): Promise<MatchResult[]> {
    // Build database query
    const contractors = await prisma.contractor.findMany({
      where: {
        status: 'ACTIVE',
        trades: { hasSome: criteria.trades },
        rating: { gte: criteria.minRating ?? this.MIN_RATING },
        ...(criteria.excludedContractors?.length && {
          id: { notIn: criteria.excludedContractors },
        }),
      },
      include: {
        credentials: {
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
        contractorProjects: {
          take: 10,
          orderBy: { completedAt: 'desc' },
          where: { status: 'COMPLETED' },
        },
        reviews: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Score and filter contractors
    const matches = contractors
      .map(contractor => this.scoreContractor(contractor as unknown as ContractorProfile & {
        contractorProjects: unknown[];
        reviews: unknown[];
        credentials: unknown[];
      }, criteria))
      .filter((match): match is MatchResult =>
        match !== null && match.score >= 0.4
      )
      .sort((a, b) => b.score - a.score);

    // Handle preferred contractors
    if (criteria.preferredContractors?.length) {
      const preferred = matches.filter(m =>
        criteria.preferredContractors!.includes(m.contractorId)
      );
      const others = matches.filter(m =>
        !criteria.preferredContractors!.includes(m.contractorId)
      );
      return [...preferred, ...others].slice(0, this.MAX_MATCHES);
    }

    return matches.slice(0, this.MAX_MATCHES);
  }

  /**
   * Score a single contractor against criteria
   */
  private scoreContractor(
    contractor: ContractorProfile & {
      contractorProjects: unknown[];
      reviews: unknown[];
      credentials: unknown[];
    },
    criteria: MatchCriteria
  ): MatchResult | null {
    let score = 0;
    const matchReasons: string[] = [];

    // Distance score (0-25 points)
    const distance = calculateDistance(
      criteria.location,
      { lat: contractor.latitude, lng: contractor.longitude }
    );

    if (distance > this.MAX_DISTANCE_MILES) {
      return null; // Too far
    }

    const distanceScore = this.WEIGHTS.distance * (1 - distance / this.MAX_DISTANCE_MILES);
    score += distanceScore;
    matchReasons.push(`${Math.round(distance)} miles from project`);

    // Trade match score (0-25 points)
    const matchedTrades = contractor.trades.filter(t =>
      criteria.trades.map(ct => ct.toLowerCase()).includes(t.toLowerCase())
    );
    const tradeScore = (matchedTrades.length / criteria.trades.length) * this.WEIGHTS.tradeMatch;
    score += tradeScore;
    matchReasons.push(`${matchedTrades.length}/${criteria.trades.length} required trades`);

    // Rating score (0-20 points)
    // Scale: 3.0-5.0 rating maps to 0-20 points
    const ratingScore = ((contractor.rating - 3) / 2) * this.WEIGHTS.rating;
    score += Math.max(0, ratingScore);
    matchReasons.push(`${contractor.rating.toFixed(1)}★ rating (${contractor.reviewCount} reviews)`);

    // Project history score (0-15 points)
    const projects = contractor.contractorProjects as Array<{ contractValue?: number }>;
    const similarProjects = projects.filter(p => {
      const budget = Number(p.contractValue || 0);
      return (
        budget >= criteria.budgetRange.min * 0.5 &&
        budget <= criteria.budgetRange.max * 2
      );
    });
    const historyScore = Math.min(similarProjects.length, 5) * 3;
    score += historyScore;
    if (similarProjects.length > 0) {
      matchReasons.push(`${similarProjects.length} similar projects completed`);
    }

    // Credential score (0-15 points)
    const requiredCreds = criteria.requiredCredentials || ['LICENSE', 'INSURANCE', 'BOND'];
    const credentials = contractor.credentials as Array<{ type: string }>;
    const validCredentials = credentials.filter(c =>
      requiredCreds.some(req => c.type.toUpperCase().includes(req))
    );
    const credScore = (validCredentials.length / requiredCreds.length) * this.WEIGHTS.credentials;
    score += credScore;
    matchReasons.push(`${validCredentials.length}/${requiredCreds.length} credentials verified`);

    // Calculate estimated response rate based on history
    const reviews = contractor.reviews as Array<{ responseTime?: number }>;
    const avgResponseTime = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.responseTime || 48), 0) / reviews.length
      : 48;
    const estimatedResponseRate = Math.max(0.3, Math.min(0.95, 1 - avgResponseTime / 168));

    return {
      contractorId: contractor.id,
      contractor: {
        id: contractor.id,
        name: contractor.contactName,
        company: contractor.companyName,
        email: contractor.email,
        phone: contractor.phone,
        rating: contractor.rating,
        trades: contractor.trades,
      },
      score: score / 100,
      matchReasons,
      distance: Math.round(distance * 10) / 10,
      availability: true, // TODO: Check against active projects calendar
      estimatedResponseRate,
    };
  }

  /**
   * Get contractor availability for a date range
   */
  async checkAvailability(
    contractorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    available: boolean;
    conflictingProjects: string[];
    utilizationPercent: number;
  }> {
    const activeProjects = await prisma.contractorProject.findMany({
      where: {
        contractorId,
        status: { in: ['IN_PROGRESS', 'SCHEDULED'] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
      select: {
        id: true,
        projectId: true,
        startDate: true,
        endDate: true,
      },
    });

    const conflictingProjects = activeProjects.map(p => p.projectId);
    const utilizationPercent = Math.min(100, activeProjects.length * 25);

    return {
      available: conflictingProjects.length < 4, // Max 4 concurrent projects
      conflictingProjects,
      utilizationPercent,
    };
  }

  /**
   * Rank contractors by specific criteria
   */
  async rankByPrice(
    contractorIds: string[],
    projectType: string
  ): Promise<Array<{ contractorId: string; avgPrice: number; rank: number }>> {
    const priceHistory = await prisma.bidSubmission.groupBy({
      by: ['contractorId'],
      where: {
        contractorId: { in: contractorIds },
        status: 'SELECTED',
      },
      _avg: { amount: true },
    });

    const ranked = priceHistory
      .map(p => ({
        contractorId: p.contractorId,
        avgPrice: p._avg.amount || 0,
        rank: 0,
      }))
      .sort((a, b) => a.avgPrice - b.avgPrice);

    ranked.forEach((item, index) => {
      item.rank = index + 1;
    });

    return ranked;
  }

  /**
   * Get contractor statistics
   */
  async getContractorStats(contractorId: string): Promise<{
    totalBidsReceived: number;
    totalBidsWon: number;
    winRate: number;
    avgBidAmount: number;
    avgProjectValue: number;
    onTimeCompletionRate: number;
  }> {
    const [bids, completedProjects] = await Promise.all([
      prisma.bidSubmission.findMany({
        where: { contractorId },
        select: { amount: true, status: true },
      }),
      prisma.contractorProject.findMany({
        where: { contractorId, status: 'COMPLETED' },
        select: {
          contractValue: true,
          scheduledEndDate: true,
          actualEndDate: true,
        },
      }),
    ]);

    const totalBidsReceived = bids.length;
    const totalBidsWon = bids.filter(b => b.status === 'SELECTED').length;
    const winRate = totalBidsReceived > 0 ? totalBidsWon / totalBidsReceived : 0;
    const avgBidAmount = bids.length > 0
      ? bids.reduce((sum, b) => sum + Number(b.amount), 0) / bids.length
      : 0;

    const avgProjectValue = completedProjects.length > 0
      ? completedProjects.reduce((sum, p) => sum + Number(p.contractValue || 0), 0) / completedProjects.length
      : 0;

    const onTimeProjects = completedProjects.filter(p =>
      p.actualEndDate && p.scheduledEndDate &&
      new Date(p.actualEndDate) <= new Date(p.scheduledEndDate)
    );
    const onTimeCompletionRate = completedProjects.length > 0
      ? onTimeProjects.length / completedProjects.length
      : 0;

    return {
      totalBidsReceived,
      totalBidsWon,
      winRate,
      avgBidAmount,
      avgProjectValue,
      onTimeCompletionRate,
    };
  }
}
