
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, queueEvents, JOB_OPTIONS } from '../../core/queue';

export async function visitSchedulerRoutes(fastify: FastifyInstance) {
    fastify.post('/visits/schedule', async (request: FastifyRequest, reply: FastifyReply) => {
        const body = request.body as any;

        const job = await queues.VISIT_SCHEDULER.add('schedule', {
            type: 'SCHEDULE_VISIT',
            request: body,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queueEvents.VISIT_SCHEDULER);
        return result;
    });
}
