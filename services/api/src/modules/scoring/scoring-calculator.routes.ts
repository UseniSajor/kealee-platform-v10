/**
 * Contractor Scoring Calculator Routes
 *
 * POST /contractors/:id/recalculate  — Recalculate a single contractor's score
 * POST /contractors/:id/reviews      — Submit a review for a contractor
 * POST /recalculate-all              — Admin batch recalculation for all contractors
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser } from '../auth/auth.middleware';
import { validateBody, validateParams } from '../../middleware/validation.middleware';
import { prisma } from '@kealee/database';
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const p = prisma as any;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const contractorParamsSchema = z.object({
  id: z.string().uuid(),
});

const reviewBodySchema = z.object({
  projectId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  reviewerRole: z.string().optional(),
});

// ============================================================================
// SCORING WEIGHTS
// ============================================================================

const SCORE_WEIGHTS = {
  responsiveness: 0.15,
  uploadCompliance: 0.10,
  bidAccuracy: 0.15,
  scheduleAdherence: 0.20,
  quality: 0.20,
  clientSatisfaction: 0.15,
  safety: 0.05,
};

// ============================================================================
// HELPER: Clamp a score between 0 and 100
// ============================================================================

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

// ============================================================================
// HELPER: Calculate confidence level based on data points
// ============================================================================

function calculateConfidence(dataPoints: number): string {
  if (dataPoints >= 20) return 'high';
  if (dataPoints >= 5) return 'medium';
  return 'low';
}

// ============================================================================
// CORE: Recalculate scores for a single contractor
// ============================================================================

async function recalculateContractorScore(contractorId: string): Promise<{
  updated: boolean;
  scores: Record<string, number>;
  overallScore: number;
  confidence: string;
  dataPoints: number;
}> {
  // Verify the contractor exists
  const contractor = await prisma.contractor.findUnique({
    where: { id: contractorId },
  });

  if (!contractor) {
    throw new Error('Contractor not found');
  }

  let dataPoints = 0;

  // -----------------------------------------------------------------------
  // 1. Responsiveness Score — based on average bid response time
  //    Looks at BidInvitation sentAt -> respondedAt gap
  // -----------------------------------------------------------------------
  let responsivenessScore = 50; // default
  try {
    const invitations = await p.bidInvitation?.findMany?.({
      where: {
        contractorId,
        respondedAt: { not: null },
      },
      select: { sentAt: true, respondedAt: true },
    }) || [];

    if (invitations.length > 0) {
      const avgResponseHours = invitations.reduce((sum: number, inv: any) => {
        const sentTime = new Date(inv.sentAt).getTime();
        const respondedTime = new Date(inv.respondedAt).getTime();
        const hours = (respondedTime - sentTime) / (1000 * 60 * 60);
        return sum + Math.max(0, hours);
      }, 0) / invitations.length;

      // Scoring: < 4 hours = 100, 4-12h = 90, 12-24h = 75, 24-48h = 60, 48-72h = 40, >72h = 20
      if (avgResponseHours <= 4) responsivenessScore = 100;
      else if (avgResponseHours <= 12) responsivenessScore = 90;
      else if (avgResponseHours <= 24) responsivenessScore = 75;
      else if (avgResponseHours <= 48) responsivenessScore = 60;
      else if (avgResponseHours <= 72) responsivenessScore = 40;
      else responsivenessScore = 20;

      dataPoints += invitations.length;
    }
  } catch {
    // Table may not exist yet; keep default
  }

  // -----------------------------------------------------------------------
  // 2. Quality Score — based on QA inspection pass rate
  // -----------------------------------------------------------------------
  let qualityScore = 50;
  try {
    // QAInspectionResult has overallScore (0-100 decimal) per inspection
    // We look at inspections tied to projects the contractor worked on
    const contractorProjects = await p.contractorProject?.findMany?.({
      where: { contractorId },
      select: { projectId: true },
    }) || [];

    const projectIds = contractorProjects
      .map((cp: any) => cp.projectId)
      .filter(Boolean);

    if (projectIds.length > 0) {
      const qaResults = await p.qAInspectionResult?.findMany?.({
        where: { projectId: { in: projectIds } },
        select: { overallScore: true },
      }) || [];

      const scoredResults = qaResults.filter((r: any) => r.overallScore != null);
      if (scoredResults.length > 0) {
        const avgQa = scoredResults.reduce(
          (sum: number, r: any) => sum + Number(r.overallScore),
          0
        ) / scoredResults.length;
        qualityScore = clamp(avgQa);
        dataPoints += scoredResults.length;
      }
    }
  } catch {
    // Table may not exist yet; keep default
  }

  // -----------------------------------------------------------------------
  // 3. Schedule Adherence Score — milestone completion vs deadlines
  //    Uses ContractorProject scheduledEndDate vs actualEndDate
  // -----------------------------------------------------------------------
  let scheduleAdherenceScore = 50;
  try {
    const projects = await p.contractorProject?.findMany?.({
      where: {
        contractorId,
        status: 'COMPLETED',
        scheduledEndDate: { not: null },
      },
      select: { scheduledEndDate: true, actualEndDate: true, completedAt: true },
    }) || [];

    if (projects.length > 0) {
      let onTimeCount = 0;
      projects.forEach((proj: any) => {
        const scheduled = new Date(proj.scheduledEndDate).getTime();
        const actual = new Date(proj.actualEndDate || proj.completedAt || proj.scheduledEndDate).getTime();
        // Allow 3-day grace period
        if (actual <= scheduled + 3 * 24 * 60 * 60 * 1000) {
          onTimeCount++;
        }
      });
      const onTimeRate = onTimeCount / projects.length;
      scheduleAdherenceScore = clamp(onTimeRate * 100);
      dataPoints += projects.length;
    }
  } catch {
    // Keep default
  }

  // -----------------------------------------------------------------------
  // 4. Client Satisfaction Score — based on average review rating
  // -----------------------------------------------------------------------
  let clientSatisfactionScore = 50;
  try {
    const reviews = await p.contractorReview?.findMany?.({
      where: { contractorId },
      select: { rating: true },
    }) || [];

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
      // Convert 1-5 scale to 0-100
      clientSatisfactionScore = clamp(((avgRating - 1) / 4) * 100);
      dataPoints += reviews.length;
    }
  } catch {
    // Keep default
  }

  // -----------------------------------------------------------------------
  // 5. Bid Accuracy Score — bid amount vs actual contract value
  //    Compare BidSubmission.amount to ContractorProject.contractValue
  // -----------------------------------------------------------------------
  let bidAccuracyScore = 50;
  let totalBidsSubmitted = 0;
  let avgBidResponseTimeHours: number | null = null;
  try {
    const submissions = await p.bidSubmission?.findMany?.({
      where: { contractorId },
      select: { amount: true, bidRequestId: true, submittedAt: true },
    }) || [];

    totalBidsSubmitted = submissions.length;

    // Also compute average bid response time from submissions
    if (submissions.length > 0) {
      // Gather the BidRequest creation times for response-time calc
      const requestIds = [...new Set(submissions.map((s: any) => s.bidRequestId))];
      const requests = await p.bidRequest?.findMany?.({
        where: { id: { in: requestIds } },
        select: { id: true, createdAt: true },
      }) || [];
      const requestMap = new Map<string, number>(requests.map((r: any) => [r.id, new Date(r.createdAt).getTime()]));

      let totalResponseMs = 0;
      let responseCount = 0;
      submissions.forEach((s: any) => {
        const requestTime = requestMap.get(s.bidRequestId);
        if (requestTime) {
          totalResponseMs += new Date(s.submittedAt).getTime() - Number(requestTime);
          responseCount++;
        }
      });
      if (responseCount > 0) {
        avgBidResponseTimeHours = Math.round(totalResponseMs / responseCount / (1000 * 60 * 60));
      }
    }

    // For accuracy, compare awarded bids to actual project costs
    const awardedBids = await p.bidSubmission?.findMany?.({
      where: { contractorId, status: 'AWARDED' },
      select: { amount: true, bidRequestId: true },
    }) || [];

    if (awardedBids.length > 0) {
      // Get associated projects through bid requests
      const awardedRequestIds = awardedBids.map((b: any) => b.bidRequestId);
      const awardedRequests = await p.bidRequest?.findMany?.({
        where: { id: { in: awardedRequestIds } },
        select: { id: true, projectId: true },
      }) || [];

      const projectIdMap = new Map<string, string>(awardedRequests.map((r: any) => [r.id, r.projectId]));

      // Find contractor projects with actual contract values
      const contractorProjects = await p.contractorProject?.findMany?.({
        where: { contractorId, contractValue: { not: null } },
        select: { projectId: true, contractValue: true },
      }) || [];

      const projectValueMap = new Map<string, number>(
        contractorProjects.map((cp: any) => [cp.projectId, Number(cp.contractValue)])
      );

      let varianceSum = 0;
      let varianceCount = 0;
      awardedBids.forEach((bid: any) => {
        const projectId = projectIdMap.get(bid.bidRequestId);
        const actualValue: number | null | undefined = projectId ? projectValueMap.get(projectId) : null;
        if (actualValue && actualValue > 0) {
          const bidAmount = Number(bid.amount);
          const variance = Math.abs(bidAmount - Number(actualValue)) / Number(actualValue);
          varianceSum += variance;
          varianceCount++;
        }
      });

      if (varianceCount > 0) {
        const avgVariance = varianceSum / varianceCount;
        // < 5% variance = 100, 5-10% = 85, 10-20% = 65, 20-30% = 45, >30% = 20
        if (avgVariance <= 0.05) bidAccuracyScore = 100;
        else if (avgVariance <= 0.10) bidAccuracyScore = 85;
        else if (avgVariance <= 0.20) bidAccuracyScore = 65;
        else if (avgVariance <= 0.30) bidAccuracyScore = 45;
        else bidAccuracyScore = 20;
        dataPoints += varianceCount;
      }
    }
  } catch {
    // Keep default
  }

  // -----------------------------------------------------------------------
  // 6. Upload Compliance Score — daily log submission rate
  // -----------------------------------------------------------------------
  let uploadComplianceScore = 50;
  try {
    const contractorProjects = await p.contractorProject?.findMany?.({
      where: { contractorId, status: { in: ['COMPLETED', 'IN_PROGRESS'] } },
      select: { projectId: true, startDate: true, endDate: true, actualEndDate: true },
    }) || [];

    const projectIds = contractorProjects
      .map((cp: any) => cp.projectId)
      .filter(Boolean);

    if (projectIds.length > 0) {
      const logs = await p.dailyLog?.findMany?.({
        where: {
          contractorId,
          projectId: { in: projectIds },
        },
        select: { date: true, projectId: true },
      }) || [];

      if (logs.length > 0) {
        // Calculate expected working days across all projects
        let totalExpectedDays = 0;
        contractorProjects.forEach((cp: any) => {
          if (cp.startDate) {
            const start = new Date(cp.startDate).getTime();
            const end = new Date(cp.actualEndDate || cp.endDate || new Date()).getTime();
            // Rough estimate: exclude weekends (5/7)
            const calendarDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
            totalExpectedDays += Math.round(calendarDays * (5 / 7));
          }
        });

        if (totalExpectedDays > 0) {
          const submissionRate = Math.min(1, logs.length / totalExpectedDays);
          uploadComplianceScore = clamp(submissionRate * 100);
        } else {
          // No date data to compute expected days; give credit for having logs
          uploadComplianceScore = 70;
        }
        dataPoints += logs.length;
      }
    }
  } catch {
    // Keep default
  }

  // -----------------------------------------------------------------------
  // 7. Safety Score — based on safety incident count
  // -----------------------------------------------------------------------
  let safetyScore = 50;
  try {
    const contractorProjects = await p.contractorProject?.findMany?.({
      where: { contractorId },
      select: { projectId: true },
    }) || [];

    const projectIds = contractorProjects
      .map((cp: any) => cp.projectId)
      .filter(Boolean);

    if (projectIds.length > 0) {
      const incidents = await p.safetyIncident?.findMany?.({
        where: { projectId: { in: projectIds } },
        select: { severity: true },
      }) || [];

      // Fewer incidents = higher score
      // 0 incidents = 100, each minor -5, moderate -10, major -20, critical -30
      const severityPenalties: Record<string, number> = {
        NEAR_MISS: 2,
        MINOR: 5,
        MODERATE: 10,
        MAJOR: 20,
        CRITICAL: 30,
      };

      let totalPenalty = 0;
      incidents.forEach((inc: any) => {
        totalPenalty += severityPenalties[inc.severity] || 10;
      });

      safetyScore = clamp(100 - totalPenalty);
      dataPoints += projectIds.length; // count projects as data points for safety
    }
  } catch {
    // Keep default
  }

  // -----------------------------------------------------------------------
  // Composite: Weighted overall score
  // -----------------------------------------------------------------------
  const overallScore = clamp(
    responsivenessScore * SCORE_WEIGHTS.responsiveness +
    uploadComplianceScore * SCORE_WEIGHTS.uploadCompliance +
    bidAccuracyScore * SCORE_WEIGHTS.bidAccuracy +
    scheduleAdherenceScore * SCORE_WEIGHTS.scheduleAdherence +
    qualityScore * SCORE_WEIGHTS.quality +
    clientSatisfactionScore * SCORE_WEIGHTS.clientSatisfaction +
    safetyScore * SCORE_WEIGHTS.safety
  );

  const confidence = calculateConfidence(dataPoints);

  // Count completed projects
  let projectsCompleted = 0;
  try {
    const completedProjects = await p.contractorProject?.findMany?.({
      where: { contractorId, status: 'COMPLETED' },
    }) || [];
    projectsCompleted = completedProjects.length;
  } catch {
    // Keep default
  }

  // -----------------------------------------------------------------------
  // Upsert into ContractorScore
  // -----------------------------------------------------------------------
  try {
    await p.contractorScore?.upsert?.({
      where: { contractorId },
      create: {
        contractorId,
        responsivenessScore,
        uploadComplianceScore,
        bidAccuracyScore,
        scheduleAdherenceScore,
        qualityScore,
        clientSatisfactionScore,
        safetyScore,
        overallScore,
        projectsCompleted,
        totalBidsSubmitted,
        avgBidResponseTime: avgBidResponseTimeHours,
        dataPoints,
        confidence,
        lastCalculated: new Date(),
      },
      update: {
        responsivenessScore,
        uploadComplianceScore,
        bidAccuracyScore,
        scheduleAdherenceScore,
        qualityScore,
        clientSatisfactionScore,
        safetyScore,
        overallScore,
        projectsCompleted,
        totalBidsSubmitted,
        avgBidResponseTime: avgBidResponseTimeHours,
        dataPoints,
        confidence,
        lastCalculated: new Date(),
      },
    });
  } catch {
    // ContractorScore table may not be migrated yet
  }

  // -----------------------------------------------------------------------
  // Update MarketplaceProfile.rating and performanceScore if a profile exists
  // -----------------------------------------------------------------------
  try {
    // The MarketplaceProfile is linked by userId, while Contractor is its own entity.
    // Try to find a marketplace profile that matches the contractor's email.
    const user = await p.user?.findUnique?.({
      where: { email: contractor.email },
      select: { id: true },
    });

    if (user) {
      await p.marketplaceProfile?.updateMany?.({
        where: { userId: user.id },
        data: {
          rating: Number((overallScore / 20).toFixed(1)), // Convert 0-100 to 0-5 scale
          performanceScore: overallScore,
          projectsCompleted,
        },
      });
    }
  } catch {
    // MarketplaceProfile may not exist for this contractor
  }

  return {
    updated: true,
    scores: {
      responsivenessScore,
      qualityScore,
      scheduleAdherenceScore,
      clientSatisfactionScore,
      bidAccuracyScore,
      uploadComplianceScore,
      safetyScore,
    },
    overallScore,
    confidence,
    dataPoints,
  };
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

export async function scoringCalculatorRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateUser);

  // --------------------------------------------------------------------------
  // POST /scoring/contractors/:id/recalculate
  // Recalculate a contractor's score based on their actual data
  // --------------------------------------------------------------------------
  fastify.post(
    '/contractors/:id/recalculate',
    { preHandler: [validateParams(contractorParamsSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const result = await recalculateContractorScore(id);

        return {
          success: true,
          contractorId: id,
          overallScore: result.overallScore,
          confidence: result.confidence,
          dataPoints: result.dataPoints,
          components: result.scores,
          recalculatedAt: new Date().toISOString(),
        };
      } catch (error: any) {
        if (error instanceof Error && error.message === 'Contractor not found') {
          return reply.status(404).send({ error: 'Contractor not found' });
        }
        request.log.error(error, 'Failed to recalculate contractor score');
        return reply.status(500).send({ error: 'Failed to recalculate score' });
      }
    }
  );

  // --------------------------------------------------------------------------
  // POST /scoring/contractors/:id/reviews
  // Submit a review for a contractor
  // --------------------------------------------------------------------------
  fastify.post(
    '/contractors/:id/reviews',
    {
      preHandler: [
        validateParams(contractorParamsSchema),
        validateBody(reviewBodySchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { projectId, rating, comment, reviewerRole } = request.body as {
        projectId: string;
        rating: number;
        comment?: string;
        reviewerRole?: string;
      };
      const user = (request as any).user;

      try {
        // Verify the contractor exists
        const contractor = await prisma.contractor.findUnique({
          where: { id },
        });

        if (!contractor) {
          return reply.status(404).send({ error: 'Contractor not found' });
        }

        // Try to create a ContractorReview record
        let review: any = null;
        try {
          review = await p.contractorReview?.create?.({
            data: {
              contractorId: id,
              projectId,
              reviewerId: user?.id || user?.userId || null,
              rating,
              comment: comment || null,
            },
          });
        } catch {
          // ContractorReview model may not be available; fall back to metadata storage
        }

        // If ContractorReview creation failed, store in contractor metadata
        if (!review) {
          try {
            // Store the review data as a JSON update on the contractor
            const existing = await prisma.contractor.findUnique({
              where: { id },
              select: { reviewCount: true, rating: true },
            });

            const currentCount = existing?.reviewCount || 0;
            const currentRating = Number(existing?.rating || 0);
            const newCount = currentCount + 1;
            const newRating = ((currentRating * currentCount) + rating) / newCount;

            await prisma.contractor.update({
              where: { id },
              data: {
                reviewCount: newCount,
                rating: Number(newRating.toFixed(2)),
              },
            });
          } catch (err: any) {
            request.log.error(err, 'Failed to store review in metadata');
          }
        } else {
          // Update contractor aggregate rating from all reviews
          try {
            const allReviews = await p.contractorReview?.findMany?.({
              where: { contractorId: id },
              select: { rating: true },
            }) || [];

            const avgRating =
              allReviews.length > 0
                ? allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length
                : 0;

            await prisma.contractor.update({
              where: { id },
              data: {
                reviewCount: allReviews.length,
                rating: Number(avgRating.toFixed(2)),
              },
            });
          } catch {
            // Non-critical; aggregate will be updated on next recalculation
          }
        }

        return reply.status(201).send({
          success: true,
          contractorId: id,
          reviewId: review?.id || null,
          rating,
          message: 'Review submitted successfully',
        });
      } catch (error: any) {
        request.log.error(error, 'Failed to submit contractor review');
        return reply.status(500).send({ error: 'Failed to submit review' });
      }
    }
  );

  // --------------------------------------------------------------------------
  // POST /scoring/recalculate-all
  // Admin endpoint to recalculate all contractor scores (batch job)
  // --------------------------------------------------------------------------
  fastify.post('/recalculate-all', async (request, reply) => {
    try {
      const contractors = await prisma.contractor.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, companyName: true },
        take: 5000,
      });

      let successCount = 0;
      let failureCount = 0;
      const errors: Array<{ contractorId: string; companyName: string; error: string }> = [];

      for (const contractor of contractors) {
        try {
          await recalculateContractorScore(contractor.id);
          successCount++;
        } catch (error: any) {
          failureCount++;
          errors.push({
            contractorId: contractor.id,
            companyName: contractor.companyName,
            error: sanitizeErrorMessage(error, 'Unknown error'),
          });
        }
      }

      return {
        success: true,
        summary: {
          totalContractors: contractors.length,
          updated: successCount,
          failed: failureCount,
        },
        errors: errors.length > 0 ? errors : undefined,
        completedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      request.log.error(error, 'Failed to run batch score recalculation');
      return reply.status(500).send({ error: 'Failed to recalculate all scores' });
    }
  });
}
