
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, queueEvents, JOB_OPTIONS } from '../../core/queue';

export async function qaInspectorRoutes(fastify: FastifyInstance) {
    fastify.post('/qa/analyze', async (request: FastifyRequest) => {
        const body = request.body as any;

        const job = await queues.QA_INSPECTOR.add('analyze', {
            type: 'ANALYZE_PHOTO',
            request: body,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queueEvents.QA_INSPECTOR);
        return result;
    });
}
