
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, JOB_OPTIONS } from '../../core/queue';

export async function communicationHubRoutes(fastify: FastifyInstance) {
    fastify.post('/messages/send', async (request: FastifyRequest, reply: FastifyReply) => {
        const body = request.body as any;

        const job = await queues.COMMUNICATION.add('send', {
            type: 'SEND_MESSAGE',
            request: body,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queues.COMMUNICATION);
        return { sentCount: result.length, messageIds: result };
    });
}
