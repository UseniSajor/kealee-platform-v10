import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser } from '../../middleware/auth';
import { createSupportCase, getAuthoritativeProjectStatus } from './support-automation.service';

export async function supportAutomationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateUser);
  fastify.get('/projects/:projectId/status', async (request, reply) => {
    const { projectId } = z.object({ projectId: z.string().uuid() }).parse(request.params);
    const user = (request as any).user;
    return reply.send(await getAuthoritativeProjectStatus(projectId, user.id));
  });
  fastify.post('/cases', async (request, reply) => {
    const body = z.object({ organizationId: z.string().uuid(), projectId: z.string().uuid(),
      topic: z.string().min(3).max(500), urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']),
      sentiment: z.string().max(50).optional() }).parse(request.body);
    const user = (request as any).user;
    return reply.status(201).send({ case: await createSupportCase({ ...body, userId: user.id }) });
  });
}
