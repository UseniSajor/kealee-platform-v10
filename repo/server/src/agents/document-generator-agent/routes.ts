
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, queueEvents, JOB_OPTIONS } from '../../core/queue';

export async function documentGeneratorRoutes(fastify: FastifyInstance) {
    fastify.post('/documents/generate', async (request: FastifyRequest) => {
        const body = request.body as any;

        const job = await queues.DOCUMENT_GENERATOR.add('generate', {
            type: 'GENERATE_DOCUMENT',
            ...body,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queueEvents.DOCUMENT_GENERATOR);
        return result;
    });
}
