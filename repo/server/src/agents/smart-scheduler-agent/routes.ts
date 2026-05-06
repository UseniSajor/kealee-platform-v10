
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, queueEvents, JOB_OPTIONS } from '../../core/queue';

export async function smartSchedulerRoutes(fastify: FastifyInstance) {
    fastify.post('/schedule/optimize', async (request: FastifyRequest) => {
        const body = request.body as any;

        const job = await queues.SMART_SCHEDULER.add('optimize', {
            type: 'OPTIMIZE_SCHEDULE',
            projectId: body.projectId,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queueEvents.SMART_SCHEDULER);
        return result;
    });
}
