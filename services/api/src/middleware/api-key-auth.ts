/**
 * API Key Authentication Middleware
 * Validates API keys and adds user context to request
 */

import {FastifyRequest, FastifyReply} from 'fastify';
import {apiKeyService} from '../modules/api-keys/api-key.service';

export async function apiKeyAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKeyHeader = request.headers['x-api-key'] as string;

  if (!apiKeyHeader) {
    return reply.status(401).send({
      error: 'API key required',
      message: 'Please provide an API key in the X-API-Key header',
    });
  }

  const apiKey = await apiKeyService.validateApiKey(apiKeyHeader);

  if (!apiKey) {
    return reply.status(401).send({
      error: 'Invalid API key',
      message: 'The provided API key is invalid or expired',
    });
  }

  // Attach API key to request
  (request as any).apiKey = apiKey;
  (request as any).jurisdictionId = apiKey.jurisdictionId;
  (request as any).userId = apiKey.userId;
  (request as any).organizationId = apiKey.organizationId;
}
