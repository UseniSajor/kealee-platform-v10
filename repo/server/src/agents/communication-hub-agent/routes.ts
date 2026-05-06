
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, queueEvents, JOB_OPTIONS } from '../../core/queue';

export async function communicationHubRoutes(fastify: FastifyInstance) {
    fastify.post('/communication/send', async (request: FastifyRequest) => {
        const body = request.body as any;

        const job = await queues.COMMUNICATION.add('send', {
            type: 'SEND_MESSAGE',
            ...body,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queueEvents.COMMUNICATION);
        return { messageIds: result };
    });
}
