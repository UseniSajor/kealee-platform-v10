
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, JOB_OPTIONS } from '../../core/queue';

export async function reportGeneratorRoutes(fastify: FastifyInstance) {
    fastify.post('/reports', async (request: FastifyRequest, reply: FastifyReply) => {
        const config = request.body as any;

        const job = await queues.REPORT_GENERATOR.add('generate', {
            type: 'GENERATE_REPORT',
            config,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queues.REPORT_GENERATOR);
        return result;
    });
}
