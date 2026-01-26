
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, JOB_OPTIONS } from '../../core/queue';

export async function documentGeneratorRoutes(fastify: FastifyInstance) {
    fastify.post('/documents', async (request: FastifyRequest, reply: FastifyReply) => {
        const body = request.body as any;

        const job = await queues.DOCUMENT_GENERATOR.add('generate', {
            type: 'GENERATE',
            request: body,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queues.DOCUMENT_GENERATOR);
        return result;
    });
}
