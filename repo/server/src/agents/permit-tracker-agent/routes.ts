
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, JOB_OPTIONS } from '../../core/queue';

export async function permitTrackerRoutes(fastify: FastifyInstance) {
    fastify.get('/permits/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };

        const job = await queues.PERMIT_TRACKER.add('check-status', {
            type: 'CHECK_STATUS',
            permitId: id,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queues.PERMIT_TRACKER);
        return result;
    });
}
