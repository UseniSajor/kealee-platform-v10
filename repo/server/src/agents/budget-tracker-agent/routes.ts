
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, queueEvents, JOB_OPTIONS } from '../../core/queue';

export async function budgetTrackerRoutes(fastify: FastifyInstance) {
    fastify.get('/budget/:projectId/summary', async (request: FastifyRequest) => {
        const { projectId } = request.params as { projectId: string };

        const job = await queues.BUDGET_TRACKER.add('summary', {
            type: 'GET_SUMMARY',
            projectId,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queueEvents.BUDGET_TRACKER);
        return result;
    });
}
