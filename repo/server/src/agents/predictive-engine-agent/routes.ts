
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, JOB_OPTIONS } from '../../core/queue';

export async function predictiveEngineRoutes(fastify: FastifyInstance) {
    fastify.post('/projects/:id/predict', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };

        const job = await queues.PREDICTIVE.add('predict', {
            type: 'PREDICT_DELAY',
            projectId: id,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queues.PREDICTIVE);
        return result;
    });
}
