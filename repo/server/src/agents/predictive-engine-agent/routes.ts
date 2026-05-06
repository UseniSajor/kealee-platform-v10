
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, queueEvents, JOB_OPTIONS } from '../../core/queue';

export async function predictiveEngineRoutes(fastify: FastifyInstance) {
    fastify.post('/predict/delay', async (request: FastifyRequest) => {
        const { projectId } = request.body as any;

        const job = await queues.PREDICTIVE.add('predict', {
            type: 'PREDICT_DELAY',
            projectId,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queueEvents.PREDICTIVE);
        return result;
    });
}
