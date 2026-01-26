
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, JOB_OPTIONS } from '../../core/queue';

export async function decisionSupportRoutes(fastify: FastifyInstance) {
    fastify.post('/decision/recommend', async (request: FastifyRequest, reply: FastifyReply) => {
        const body = request.body as any;

        const job = await queues.DECISION_SUPPORT.add('recommend', {
            type: 'GET_RECOMMENDATION',
            context: body,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queues.DECISION_SUPPORT);
        return result;
    });

    fastify.post('/decision/chat', async (request: FastifyRequest, reply: FastifyReply) => {
        const body = request.body as any;

        const job = await queues.DECISION_SUPPORT.add('chat', {
            type: 'CHAT',
            projectId: body.projectId,
            message: body.message,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queues.DECISION_SUPPORT);
        return result;
    });
}
