import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, queueEvents, JOB_OPTIONS } from '../../core/queue';
import { prisma } from '../../core/db';
import { ContractorMatcher } from './matcher';
import { BidAnalyzer } from './analyzer';

const contractorMatcher = new ContractorMatcher();
const bidAnalyzer = new BidAnalyzer();

export async function bidEngineRoutes(fastify: FastifyInstance) {
    // POST /v1/bids/requests – create bid request & push job to queue
    fastify.post('/requests', async (request: FastifyRequest, reply: FastifyReply) => {
        const { projectId, trades, scope, requirements, deadline } = request.body as any;

        const job = await queues.BID_ENGINE.add('create-bid-request', {
            type: 'create-bid-request',
            projectId,
            trades,
            scope,
            requirements,
            deadline,
        }, JOB_OPTIONS.DEFAULT);

        return { jobId: job.id, status: 'processing' };
    });

    // POST /v1/bids/match – preview contractor matches using ContractorMatcher
    fastify.post('/match', async (request: FastifyRequest, reply: FastifyReply) => {
        const criteria = request.body as any;
        const matches = await contractorMatcher.findMatches(criteria);
        return { matches };
    });

    // POST /v1/bids/requests/:id/analyze – run BidAnalyzer and persist analysis
    fastify.post('/requests/:id/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };

        const job = await queues.BID_ENGINE.add('analyze-bids', {
            type: 'analyze-bids',
            bidRequestId: id,
        }, JOB_OPTIONS.HIGH_PRIORITY);

        return { jobId: job.id, status: 'analyzing' };
    });

    // GET /v1/bids/requests/:id - Get bid request details
    fastify.get('/requests/:id', async (request: FastifyRequest, reply: FastifyReply) => {
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
            return reply.status(404).send({ 
                message: 'Bid request not found',
                code: 'NOT_FOUND' 
            });
        }

        return bidRequest;
    });
}
