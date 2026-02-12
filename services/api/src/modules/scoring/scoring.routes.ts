/**
 * Contractor Scoring API Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../auth/auth.middleware.js';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

export async function scoringRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateUser);

  /**
   * GET /scoring/contractors/:id
   * Public contractor score (filtered view — no exact numbers for gaming prevention)
   */
  fastify.get('/contractors/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const score = await prismaAny.contractorScore?.findUnique?.({
      where: { contractorId: id },
      include: {
        contractor: {
          select: {
            companyName: true,
            trades: true,
            isVerified: true,
          },
        },
      },
    });

    if (!score) {
      // No score yet — return "new contractor" response
      const contractor = await prisma.contractor.findUnique({
        where: { id },
        select: { companyName: true, trades: true, isVerified: true },
      });

      if (!contractor) {
        return reply.status(404).send({ error: 'Contractor not found' });
      }

      return {
        contractorId: id,
        companyName: contractor.companyName,
        label: 'New to Kealee — Building Track Record',
        confidence: 'low',
        projectsCompleted: 0,
        isVerified: contractor.isVerified,
      };
    }

    // Map overall score to star rating (public-facing)
    const starRating = Math.round((score.overallScore / 100) * 5 * 10) / 10;

    // Only show component breakdown if confidence is medium or high
    const showBreakdown = score.confidence !== 'low';

    return {
      contractorId: id,
      companyName: score.contractor.companyName,
      starRating,
      confidence: score.confidence,
      projectsCompleted: score.projectsCompleted,
      isVerified: score.contractor.isVerified,
      label: score.confidence === 'low'
        ? 'New to Kealee — Building Track Record'
        : `Reliability: ${starRating}/5`,
      breakdown: showBreakdown ? {
        onTime: `${score.scheduleAdherenceScore}%`,
        quality: `${score.qualityScore}%`,
        responsiveness: `${score.responsivenessScore}%`,
      } : undefined,
    };
  });

  /**
   * GET /scoring/contractors/:id/full
   * Full score breakdown — PM only view
   */
  fastify.get('/contractors/:id/full', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const score = await prismaAny.contractorScore?.findUnique?.({
      where: { contractorId: id },
      include: {
        contractor: {
          select: {
            companyName: true,
            trades: true,
            rating: true,
            reviewCount: true,
            isVerified: true,
            status: true,
          },
        },
      },
    });

    if (!score) {
      return reply.status(404).send({ error: 'No score data found for this contractor' });
    }

    return {
      contractorId: id,
      companyName: score.contractor.companyName,
      trades: score.contractor.trades,
      overallScore: score.overallScore,
      confidence: score.confidence,
      components: {
        responsiveness: { score: score.responsivenessScore, weight: '15%', label: 'Responsiveness' },
        uploadCompliance: { score: score.uploadComplianceScore, weight: '10%', label: 'Upload Compliance' },
        bidAccuracy: { score: score.bidAccuracyScore, weight: '15%', label: 'Bid Accuracy' },
        scheduleAdherence: { score: score.scheduleAdherenceScore, weight: '20%', label: 'Schedule Adherence' },
        quality: { score: score.qualityScore, weight: '20%', label: 'Quality' },
        clientSatisfaction: { score: score.clientSatisfactionScore, weight: '15%', label: 'Client Satisfaction' },
        safety: { score: score.safetyScore, weight: '5%', label: 'Safety' },
      },
      metadata: {
        projectsCompleted: score.projectsCompleted,
        totalBidsSubmitted: score.totalBidsSubmitted,
        avgBidResponseTime: score.avgBidResponseTime ? `${score.avgBidResponseTime}h` : null,
        dataPoints: score.dataPoints,
        lastCalculated: score.lastCalculated,
      },
      contractor: {
        platformRating: Number(score.contractor.rating),
        reviewCount: score.contractor.reviewCount,
        isVerified: score.contractor.isVerified,
        status: score.contractor.status,
      },
    };
  });

  /**
   * GET /scoring/leaderboard
   * Paginated contractor leaderboard with filters
   */
  fastify.get('/leaderboard', async (request: FastifyRequest, reply: FastifyReply) => {
    const {
      trade,
      region,
      minScore,
      confidence,
      limit = '50',
      offset = '0',
    } = request.query as {
      trade?: string;
      region?: string;
      minScore?: string;
      confidence?: string;
      limit?: string;
      offset?: string;
    };

    const where: Record<string, unknown> = {};
    if (minScore) where.overallScore = { gte: parseInt(minScore) };
    if (confidence) where.confidence = confidence;

    let scores = await prismaAny.contractorScore?.findMany?.({
      where,
      include: {
        contractor: {
          select: {
            id: true,
            companyName: true,
            trades: true,
            state: true,
            isVerified: true,
            rating: true,
          },
        },
      },
      orderBy: { overallScore: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    }) || [];

    // Apply trade/region filters post-query (these are on the relation)
    if (trade) {
      scores = scores.filter((s: any) =>
        s.contractor.trades.some((t: string) =>
          t.toLowerCase().includes(trade.toLowerCase())
        )
      );
    }
    if (region) {
      scores = scores.filter((s: any) =>
        s.contractor.state?.toLowerCase() === region.toLowerCase()
      );
    }

    const total = await prismaAny.contractorScore?.count?.({ where }) || 0;

    return {
      contractors: scores.map((s: any, index: number) => ({
        rank: parseInt(offset) + index + 1,
        contractorId: s.contractorId,
        companyName: s.contractor.companyName,
        trades: s.contractor.trades,
        state: s.contractor.state,
        overallScore: s.overallScore,
        confidence: s.confidence,
        projectsCompleted: s.projectsCompleted,
        isVerified: s.contractor.isVerified,
        topScores: {
          onTime: s.scheduleAdherenceScore,
          quality: s.qualityScore,
          responsiveness: s.responsivenessScore,
        },
      })),
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };
  });

  /**
   * GET /scoring/contractors/:id/history
   * Score trend over time (returns last N score snapshots)
   */
  fastify.get('/contractors/:id/history', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    // For now, return the current score with lastCalculated
    // Future: store score history in a separate table for trend analysis
    const score = await prismaAny.contractorScore?.findUnique?.({
      where: { contractorId: id },
    });

    if (!score) {
      return { contractorId: id, history: [] };
    }

    return {
      contractorId: id,
      current: {
        overallScore: score.overallScore,
        confidence: score.confidence,
        lastCalculated: score.lastCalculated,
      },
      // Placeholder for future trend data
      history: [
        {
          date: score.lastCalculated,
          overallScore: score.overallScore,
          responsiveness: score.responsivenessScore,
          quality: score.qualityScore,
          scheduleAdherence: score.scheduleAdherenceScore,
        },
      ],
    };
  });
}
