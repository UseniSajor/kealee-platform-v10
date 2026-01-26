
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, JOB_OPTIONS } from '../../core/queue';

export async function visitSchedulerRoutes(fastify: FastifyInstance) {
    // Schedule a visit
    fastify.post('/visits', async (request: FastifyRequest, reply: FastifyReply) => {
        const { projectId, pmId, visitType, preferredDates, duration, priority, notes } = request.body as any;

        const job = await queues.VISIT_SCHEDULER.add('schedule-visit', {
            type: 'SCHEDULE_VISIT',
            request: { projectId, pmId, visitType, preferredDates, duration, priority, notes },
        }, JOB_OPTIONS.DEFAULT);

        const result = await job.waitUntilFinished(queues.VISIT_SCHEDULER);
        return result;
    });
}
