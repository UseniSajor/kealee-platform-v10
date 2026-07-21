import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';

export function bidRoutes(prisma: PrismaClient) {
  return async function (fastify: FastifyInstance) {
    // -----------------------------------------------------------------------
    // List bid requests
    // -----------------------------------------------------------------------
    fastify.get('/', async (request) => {
      const { projectId, status } = request.query as {
        projectId?: string;
        status?: string;
      };

      const bids = await prisma.bidRequest.findMany({
        where: {
          ...(projectId && { projectId }),
          ...(status && { status }),
        },
        include: {
          invitations: true,
          submissions: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return { data: bids };
    });

    // -----------------------------------------------------------------------
    // Get single bid request with invitations + scored submissions
    // -----------------------------------------------------------------------
    fastify.get('/:id', async (request) => {
      const { id } = request.params as { id: string };

      const bid = await prisma.bidRequest.findUnique({
        where: { id },
        include: {
          invitations: true,
          submissions: {
            include: { contractor: true },
            orderBy: { totalAmount: 'asc' },
          },
        },
      });

      if (!bid) {
        return { error: 'Bid request not found', statusCode: 404 };
      }

      return { data: bid };
    });

    // -----------------------------------------------------------------------
    // Create bid request
    // -----------------------------------------------------------------------
    fastify.post('/', async (request) => {
      const body = request.body as {
        projectId: string;
        organizationId: string;
        scope: string;
        deadline?: string;
      };

      const bid = await prisma.bidRequest.create({
        data: {
          projectId: body.projectId,
          organizationId: body.organizationId,
          scope: body.scope,
          deadline: body.deadline
            ? new Date(body.deadline)
            : new Date(Date.now() + 7 * 86_400_000),
          status: 'OPEN',
        },
      });

      return { data: bid };
    });

    // -----------------------------------------------------------------------
    // Score submissions -- enqueues AI scoring job
    // -----------------------------------------------------------------------
    fastify.post('/:id/score', async (request) => {
      const { id } = request.params as { id: string };

      const bid = await prisma.bidRequest.findUnique({
        where: { id },
        include: { submissions: true },
      });

      if (!bid) {
        return { error: 'Bid request not found', statusCode: 404 };
      }

      if (bid.submissions.length === 0) {
        return { error: 'No submissions to score', statusCode: 400 };
      }

      // Queue the scoring job
      const queue = createQueue(KEALEE_QUEUES.BID_ENGINE);
      await queue.add('score-submissions', {
        bidRequestId: id,
        projectId: bid.projectId,
        organizationId: bid.organizationId,
      });

      return {
        data: {
          queued: true,
          bidRequestId: id,
          submissionCount: bid.submissions.length,
        },
      };
    });

    // -----------------------------------------------------------------------
    // Close bid request
    // -----------------------------------------------------------------------
    fastify.post('/:id/close', async (request) => {
      const { id } = request.params as { id: string };

      const bid = await prisma.bidRequest.update({
        where: { id },
        data: { status: 'CLOSED' },
      });

      return { data: bid };
    });
  };
}
