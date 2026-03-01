/**
 * KeaBot Chat Routes
 *
 * Public endpoints for the KeaBot AI chat assistant.
 * No authentication required — this serves website visitors.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sanitizeErrorMessage } from '../../utils/sanitize-error';
import { chat, getConversation, endSession } from './keabot-engine';
import { isGhlConfigured } from '../integrations/ghl/ghl-client';
import { syncNewUser } from '../integrations/ghl/ghl-sync';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const chatSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1).max(2000),
  visitorEmail: z.string().email().optional(),
  visitorName: z.string().optional(),
});

const endSessionSchema = z.object({
  sessionId: z.string(),
  visitorEmail: z.string().email().optional(),
  visitorName: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function keabotRoutes(fastify: FastifyInstance) {
  /** POST /chat - Send a message to KeaBot */
  fastify.post('/chat', async (request, reply) => {
    try {
      const input = chatSchema.parse(request.body);
      const sessionId = input.sessionId || randomUUID();

      const response = await chat(sessionId, input.message);

      // If lead is qualified and we have email, sync to GHL
      if (
        response.leadScore?.readyForHandoff &&
        input.visitorEmail &&
        isGhlConfigured()
      ) {
        // Fire-and-forget GHL sync
        syncNewUser(
          {
            id: `visitor-${sessionId}`,
            email: input.visitorEmail,
            firstName: input.visitorName?.split(' ')[0],
            lastName: input.visitorName?.split(' ').slice(1).join(' '),
          },
          'KeaBot Chat',
        ).catch(() => {});
      }

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid chat request',
          details: error.issues,
        });
      }
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error, 'Chat service temporarily unavailable'),
      });
    }
  });

  /** GET /history/:sessionId - Get conversation history */
  fastify.get('/history/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const messages = getConversation(sessionId);
    return reply.send({ success: true, data: messages });
  });

  /** POST /end - End session and get final lead score */
  fastify.post('/end', async (request, reply) => {
    try {
      const input = endSessionSchema.parse(request.body);
      const score = endSession(input.sessionId);
      return reply.send({ success: true, data: { score } });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: 'Invalid request' });
      }
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error, 'Failed to end session'),
      });
    }
  });
}
