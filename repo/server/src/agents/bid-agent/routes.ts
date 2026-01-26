
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, JOB_OPTIONS } from '../../core/queue';
import { prisma } from '../../core/db';

export async function bidEngineRoutes(fastify: FastifyInstance) {
    // Create bid request
    fastify.post('/bid-requests', async (request: FastifyRequest, reply: FastifyReply) => {
        const { projectId, trades, scope, requirements, deadline } = request.body as any;

        const job = await queues.BID_ENGINE.add('create-bid-request', {
            type: 'CREATE_BID_REQUEST',
            projectId,
            trades,
            scope,
            requirements,
            deadline,
        }, JOB_OPTIONS.DEFAULT);

        return { jobId: job.id, status: 'processing' };
    });

    // Get bid request
    fastify.get('/bid-requests/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };

        const bidRequest = await prisma.bidRequest.findUnique({
            where: { id },
            include: {
                project: true,
                invitations: { include: { contractor: true } },
                submissions: { include: { contractor: true } },
            },
        });

        if (!bidRequest) {
            return reply.status(404).send({ error: 'Bid request not found' });
        }

        return bidRequest;
    });

    // Trigger bid analysis
    fastify.post('/bid-requests/:id/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };

        const job = await queues.BID_ENGINE.add('analyze-bids', {
            type: 'ANALYZE_BIDS',
            bidRequestId: id,
        }, JOB_OPTIONS.HIGH_PRIORITY);

        return { jobId: job.id, status: 'analyzing' };
    });

    // Find matching contractors
    fastify.post('/contractors/match', async (request: FastifyRequest, reply: FastifyReply) => {
        const criteria = request.body as any;

        const job = await queues.BID_ENGINE.add('find-contractors', {
            type: 'FIND_CONTRACTORS',
            bidRequestId: null,
            criteria,
        }, JOB_OPTIONS.DEFAULT);

        // Wait for result
        const result = await job.waitUntilFinished(queues.BID_ENGINE);
        return result;
    });
}
