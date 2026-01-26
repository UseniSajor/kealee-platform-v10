
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, JOB_OPTIONS } from '../../core/queue';

export async function qaInspectorRoutes(fastify: FastifyInstance) {
    fastify.post('/qa/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
        const body = request.body as any;

        const job = await queues.QA_INSPECTOR.add('analyze', {
            type: 'ANALYZE_PHOTO',
            request: body,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queues.QA_INSPECTOR);
        return result;
    });
}
