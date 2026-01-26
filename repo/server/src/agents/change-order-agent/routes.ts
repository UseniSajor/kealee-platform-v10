import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, queueEvents, JOB_OPTIONS } from '../../core/queue';
import { prisma } from '../../core/db';

export async function changeOrderRoutes(fastify: FastifyInstance) {
    // Create change order
    fastify.post('/change-orders', async (request: FastifyRequest) => {
        const body = request.body as any;

        const job = await queues.CHANGE_ORDER.add('create', {
            type: 'CREATE_CHANGE_ORDER',
            ...body,
        }, JOB_OPTIONS.DEFAULT);

        // Wait for creation to complete so we can return the ID
        const result = await job.waitUntilFinished(queueEvents.CHANGE_ORDER);
        return result;
    });

    // Get change order
    fastify.get('/change-orders/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };

        const co = await prisma.changeOrder.findUnique({
            where: { id },
            include: { project: true },
        });

        return co;
    });

    // Analyze impact (manually trigger)
    fastify.post('/change-orders/:id/analyze', async (request: FastifyRequest) => {
        const { id } = request.params as { id: string };

        const job = await queues.CHANGE_ORDER.add('analyze', {
            type: 'ANALYZE_IMPACT',
            changeOrderId: id,
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queueEvents.CHANGE_ORDER);
        return result;
    });
}
