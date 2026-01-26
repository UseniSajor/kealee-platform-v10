
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, queueEvents, JOB_OPTIONS } from '../../core/queue';

export async function taskQueueRoutes(fastify: FastifyInstance) {
    fastify.post('/tasks', async (request: FastifyRequest) => {
        const body = request.body as any;

        const job = await queues.TASK_QUEUE.add('create', {
            type: 'CREATE_TASK',
            definition: body,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queueEvents.TASK_QUEUE);
        return { taskId: result };
    });
}
