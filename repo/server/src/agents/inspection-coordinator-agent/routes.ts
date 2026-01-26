
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, JOB_OPTIONS } from '../../core/queue';

export async function inspectionCoordinatorRoutes(fastify: FastifyInstance) {
    fastify.post('/inspections', async (request: FastifyRequest, reply: FastifyReply) => {
        const body = request.body as any;

        const job = await queues.INSPECTION.add('schedule', {
            type: 'SCHEDULE_INSPECTION',
            request: body,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queues.INSPECTION);
        return { inspectionId: result };
    });

    fastify.get('/inspections/checklist', async (request: FastifyRequest, reply: FastifyReply) => {
        const { type } = request.query as { type: string };

        const job = await queues.INSPECTION.add('checklist', {
            type: 'GET_CHECKLIST',
            type: type || 'FINAL',
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queues.INSPECTION);
        return { checklist: result };
    });
}
