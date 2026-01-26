
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, JOB_OPTIONS } from '../../core/queue';

export async function budgetTrackerRoutes(fastify: FastifyInstance) {
    fastify.get('/projects/:id/budget', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };

        const job = await queues.BUDGET_TRACKER.add('summary', {
            type: 'GET_SUMMARY',
            projectId: id,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queues.BUDGET_TRACKER);
        return result;
    });
}
