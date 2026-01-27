/**
 * APP-01: CONTRACTOR BID ENGINE - API ROUTES
 * Fastify routes for bid engine operations
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { queues, JOB_OPTIONS, QUEUE_NAMES } from '../../../shared/queue.js';
import { ContractorMatcher } from './services/contractor-matcher.js';
import { BidAnalyzer } from './services/bid-analyzer.js';
import { MatchCriteria } from './types.js';

const prisma = new PrismaClient();
const matcher = new ContractorMatcher();
const analyzer = new BidAnalyzer();

export async function bidEngineRoutes(fastify: FastifyInstance) {
  // ============================================================================
  // BID REQUESTS
  // ============================================================================

  /**
   * Create a new bid request
   */
  fastify.post('/bid-requests', async (request: FastifyRequest, reply: FastifyReply) => {
    const {
      projectId,
      trades,
      scope,
      requirements,
      deadline,
      estimatedBudget,
    } = request.body as {
      projectId: string;
      trades: string[];
      scope: unknown;
      requirements: unknown;
      deadline: string;
      estimatedBudget?: number;
    };

    const job = await queues.BID_ENGINE.add(
      'create-bid-request',
      {
        type: 'CREATE_BID_REQUEST',
        projectId,
        trades,
        scope,
        requirements,
        deadline,
        estimatedBudget,
      },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'processing' };
  });

  /**
   * Get bid request by ID
   */
  fastify.get('/bid-requests/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const bidRequest = await prisma.bidRequest.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            address: true,
            status: true,
          },
        },
        bidInvitations: {
          include: {
            contractor: {
              select: {
                id: true,
                companyName: true,
                contactName: true,
                rating: true,
              },
            },
          },
        },
        bidSubmissions: {
          include: {
            contractor: {
              select: {
                id: true,
                companyName: true,
                contactName: true,
                rating: true,
              },
            },
          },
          orderBy: { score: 'desc' },
        },
      },
    });

    if (!bidRequest) {
      return reply.status(404).send({ error: 'Bid request not found' });
    }

    return bidRequest;
  });

  /**
   * List bid requests for a project
   */
  fastify.get('/projects/:projectId/bid-requests', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { status } = request.query as { status?: string };

    const bidRequests = await prisma.bidRequest.findMany({
      where: {
        projectId,
        ...(status && { status }),
      },
      include: {
        _count: {
          select: {
            bidInvitations: true,
            bidSubmissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bidRequests;
  });

  /**
   * Update bid request status
   */
  fastify.patch('/bid-requests/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { status, deadline } = request.body as {
      status?: string;
      deadline?: string;
    };

    const bidRequest = await prisma.bidRequest.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(deadline && { deadline: new Date(deadline) }),
      },
    });

    return bidRequest;
  });

  // ============================================================================
  // BID ANALYSIS
  // ============================================================================

  /**
   * Trigger bid analysis
   */
  fastify.post('/bid-requests/:id/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const job = await queues.BID_ENGINE.add(
      'analyze-bids',
      { type: 'ANALYZE_BIDS', bidRequestId: id },
      JOB_OPTIONS.HIGH_PRIORITY
    );

    return { jobId: job.id, status: 'analyzing' };
  });

  /**
   * Get bid comparison/analysis results
   */
  fastify.get('/bid-requests/:id/comparison', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const submissions = await prisma.bidSubmission.findMany({
      where: { bidRequestId: id, status: { not: 'WITHDRAWN' } },
      include: {
        contractor: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            rating: true,
            trades: true,
          },
        },
      },
      orderBy: { score: 'desc' },
    });

    if (submissions.length === 0) {
      return reply.status(404).send({ error: 'No bids found' });
    }

    return {
      submissions: submissions.map(s => ({
        id: s.id,
        contractor: s.contractor,
        amount: s.amount,
        score: s.score,
        recommendation: s.recommendation,
        analysisData: s.analysisData,
        timeline: s.timeline,
        submittedAt: s.submittedAt,
      })),
      summary: await analyzer.getQuickComparison(id),
    };
  });

  /**
   * Award bid to contractor
   */
  fastify.post('/bid-requests/:id/award', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { submissionId, notifyOthers = true } = request.body as {
      submissionId: string;
      notifyOthers?: boolean;
    };

    const job = await queues.BID_ENGINE.add(
      'award-bid',
      {
        type: 'AWARD_BID',
        bidRequestId: id,
        submissionId,
        notifyOthers,
      },
      JOB_OPTIONS.HIGH_PRIORITY
    );

    return { jobId: job.id, status: 'awarding' };
  });

  // ============================================================================
  // CONTRACTOR MATCHING
  // ============================================================================

  /**
   * Find matching contractors
   */
  fastify.post('/contractors/match', async (request: FastifyRequest, reply: FastifyReply) => {
    const criteria = request.body as MatchCriteria;
    const matches = await matcher.findMatches(criteria);
    return { matches, count: matches.length };
  });

  /**
   * Get contractor by ID
   */
  fastify.get('/contractors/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const contractor = await prisma.contractor.findUnique({
      where: { id },
      include: {
        credentials: {
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            contractorProjects: true,
            bidSubmissions: true,
          },
        },
      },
    });

    if (!contractor) {
      return reply.status(404).send({ error: 'Contractor not found' });
    }

    return contractor;
  });

  /**
   * Verify contractor credentials
   */
  fastify.post('/contractors/:id/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const job = await queues.BID_ENGINE.add(
      'verify-credentials',
      { type: 'VERIFY_CREDENTIALS', contractorId: id },
      JOB_OPTIONS.DEFAULT
    );

    // Wait for result
    const result = await job.waitUntilFinished(
      (await import('../../../shared/queue.js')).queueEvents.BID_ENGINE,
      30000
    );

    return result;
  });

  /**
   * Get contractor statistics
   */
  fastify.get('/contractors/:id/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const stats = await matcher.getContractorStats(id);
    return stats;
  });

  // ============================================================================
  // BID SUBMISSIONS
  // ============================================================================

  /**
   * Submit a bid (for contractors)
   */
  fastify.post('/bids/submit/:invitationId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { invitationId } = request.params as { invitationId: string };
    const {
      amount,
      timeline,
      scope,
      alternates,
      exclusions,
      assumptions,
      validUntil,
    } = request.body as {
      amount: number;
      timeline: unknown;
      scope: unknown;
      alternates?: unknown[];
      exclusions?: string[];
      assumptions?: string[];
      validUntil: string;
    };

    // Verify invitation exists and is valid
    const invitation = await prisma.bidInvitation.findUnique({
      where: { id: invitationId },
      include: { bidRequest: true },
    });

    if (!invitation) {
      return reply.status(404).send({ error: 'Invitation not found' });
    }

    if (invitation.status === 'SUBMITTED') {
      return reply.status(400).send({ error: 'Bid already submitted' });
    }

    if (invitation.bidRequest.deadline < new Date()) {
      return reply.status(400).send({ error: 'Bid deadline has passed' });
    }

    // Create submission
    const submission = await prisma.bidSubmission.create({
      data: {
        bidRequestId: invitation.bidRequestId,
        invitationId,
        contractorId: invitation.contractorId,
        amount,
        timeline: timeline as object,
        scope: scope as object,
        alternates: alternates as object[] | undefined,
        exclusions,
        assumptions,
        validUntil: new Date(validUntil),
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    // Update invitation status
    await prisma.bidInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'SUBMITTED',
        respondedAt: new Date(),
      },
    });

    return { submissionId: submission.id, status: 'submitted' };
  });

  /**
   * Get submission details
   */
  fastify.get('/bids/:submissionId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { submissionId } = request.params as { submissionId: string };

    const submission = await prisma.bidSubmission.findUnique({
      where: { id: submissionId },
      include: {
        contractor: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
            phone: true,
            rating: true,
          },
        },
        bidRequest: {
          include: {
            project: {
              select: { name: true, address: true },
            },
          },
        },
      },
    });

    if (!submission) {
      return reply.status(404).send({ error: 'Submission not found' });
    }

    return submission;
  });

  /**
   * Withdraw a bid
   */
  fastify.post('/bids/:submissionId/withdraw', async (request: FastifyRequest, reply: FastifyReply) => {
    const { submissionId } = request.params as { submissionId: string };
    const { reason } = request.body as { reason?: string };

    const submission = await prisma.bidSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'WITHDRAWN',
        withdrawnAt: new Date(),
        withdrawReason: reason,
      },
    });

    return { status: 'withdrawn', submissionId: submission.id };
  });

  // ============================================================================
  // DASHBOARD / METRICS
  // ============================================================================

  /**
   * Get bid engine dashboard metrics
   */
  fastify.get('/dashboard/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const [
      openRequests,
      totalSubmissions,
      pendingAnalysis,
      recentAwards,
    ] = await Promise.all([
      prisma.bidRequest.count({ where: { status: 'OPEN' } }),
      prisma.bidSubmission.count({ where: { status: 'SUBMITTED' } }),
      prisma.bidRequest.count({ where: { status: 'EVALUATING' } }),
      prisma.bidRequest.findMany({
        where: { status: 'AWARDED' },
        take: 5,
        orderBy: { awardedAt: 'desc' },
        include: {
          project: { select: { name: true } },
          awardedContractor: { select: { companyName: true } },
        },
      }),
    ]);

    return {
      openRequests,
      totalSubmissions,
      pendingAnalysis,
      recentAwards: recentAwards.map(r => ({
        projectName: r.project.name,
        contractorName: r.awardedContractor?.companyName,
        awardedAt: r.awardedAt,
      })),
    };
  });
}
