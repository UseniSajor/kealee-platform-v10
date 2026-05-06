
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, queueEvents, JOB_OPTIONS } from '../../core/queue';

export async function reportGeneratorRoutes(fastify: FastifyInstance) {
    fastify.post('/reports/generate', async (request: FastifyRequest) => {
        const body = request.body as any;

        const job = await queues.REPORT_GENERATOR.add('generate', {
            type: 'GENERATE_REPORT',
            config: body,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queueEvents.REPORT_GENERATOR);
        return result;
    });
}
