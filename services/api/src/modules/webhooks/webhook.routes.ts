/**
 * Webhook Management Routes
 */

import {FastifyInstance, FastifyRequest, FastifyReply} from 'fastify';
import {webhookService} from './webhook.service';
import {prisma} from '@kealee/database';
import { sanitizeErrorMessage } from '../../utils/sanitize-error';

export async function webhookRoutes(fastify: FastifyInstance) {
  // POST /api/v1/webhooks - Create webhook
  fastify.post(
    '/api/v1/webhooks',
    {
      schema: {
        description: 'Create webhook',
        tags: ['webhooks'],
        body: {
          type: 'object',
          required: ['url', 'events'],
          properties: {
            url: {type: 'string', format: 'uri'},
            events: {
              type: 'array',
              items: {type: 'string'},
            },
            jurisdictionId: {type: 'string'},
            organizationId: {type: 'string'},
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const {url, events, jurisdictionId, organizationId} = request.body as any;

        const webhook = await webhookService.createWebhook(
          url,
          events,
          jurisdictionId,
          organizationId
        );

        return reply.status(201).send({data: webhook});
      } catch (error: any) {
        return reply.status(500).send({error: sanitizeErrorMessage(error)});
      }
    }
  );

  // GET /api/v1/webhooks - List webhooks
  fastify.get(
    '/api/v1/webhooks',
    {
      schema: {
        description: 'List webhooks',
        tags: ['webhooks'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const {jurisdictionId, organizationId} = request.query as any;

        const where: any = {};
        if (jurisdictionId) where.jurisdictionId = jurisdictionId;
        if (organizationId) where.orgId = organizationId;

        const webhooks = await prisma.webhook.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });

        return reply.send({ data: webhooks });
      } catch (error: any) {
        return reply.status(500).send({error: sanitizeErrorMessage(error)});
      }
    }
  );

  // DELETE /api/v1/webhooks/:id - Delete webhook
  fastify.delete<{Params: {id: string}}>(
    '/api/v1/webhooks/:id',
    {
      schema: {
        description: 'Delete webhook',
        tags: ['webhooks'],
      },
    },
    async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
      try {
        const {id} = request.params;

        await prisma.webhook.update({
          where: { id },
          data: { active: false },
        });

        return reply.status(204).send();
      } catch (error: any) {
        return reply.status(500).send({error: sanitizeErrorMessage(error)});
      }
    }
  );
}
