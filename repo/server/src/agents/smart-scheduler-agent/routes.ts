
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, JOB_OPTIONS } from '../../core/queue';

export async function smartSchedulerRoutes(fastify: FastifyInstance) {
    fastify.post('/schedule/optimize', async (request: FastifyRequest, reply: FastifyReply) => {
        const body = request.body as any;

        const job = await queues.SMART_SCHEDULER.add('optimize', {
            type: 'OPTIMIZE_SCHEDULE',
            request: body,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queues.SMART_SCHEDULER);
        return result;
    });
}
