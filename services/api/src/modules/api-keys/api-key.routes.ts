/**
 * API Key Management Routes
 */

import {FastifyInstance, FastifyRequest, FastifyReply} from 'fastify';
import {apiKeyService} from './api-key.service';
import { sanitizeErrorMessage } from '../../utils/sanitize-error';

export async function apiKeyRoutes(fastify: FastifyInstance) {
  // POST /api/v1/api-keys - Generate API key
  fastify.post(
    '/api/v1/api-keys',
    {
      schema: {
        description: 'Generate new API key',
        tags: ['api-keys'],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {type: 'string'},
            jurisdictionId: {type: 'string'},
            organizationId: {type: 'string'},
            scopes: {
              type: 'array',
              items: {type: 'string'},
              default: ['read'],
            },
            rateLimit: {type: 'number', default: 100},
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const {name, jurisdictionId, organizationId, scopes, rateLimit} = request.body as any;

        const apiKey = await apiKeyService.generateApiKey(
          name,
          jurisdictionId,
          (request as any).userId,
          organizationId,
          scopes,
          rateLimit
        );

        return reply.status(201).send({data: apiKey});
      } catch (error: any) {
        return reply.status(500).send({error: sanitizeErrorMessage(error)});
      }
    }
  );

  // GET /api/v1/api-keys - List API keys
  fastify.get(
    '/api/v1/api-keys',
    {
      schema: {
        description: 'List API keys',
        tags: ['api-keys'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const {jurisdictionId, organizationId} = request.query as any;

        const apiKeys = await apiKeyService.listApiKeys(
          (request as any).userId,
          organizationId,
          jurisdictionId
        );

        return reply.send({data: apiKeys});
      } catch (error: any) {
        return reply.status(500).send({error: sanitizeErrorMessage(error)});
      }
    }
  );

  // DELETE /api/v1/api-keys/:id - Revoke API key
  fastify.delete<{Params: {id: string}}>(
    '/api/v1/api-keys/:id',
    {
      schema: {
        description: 'Revoke API key',
        tags: ['api-keys'],
      },
    },
    async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
      try {
        const {id} = request.params;

        await apiKeyService.revokeApiKey(id);

        return reply.status(204).send();
      } catch (error: any) {
        return reply.status(500).send({error: sanitizeErrorMessage(error)});
      }
    }
  );
}
