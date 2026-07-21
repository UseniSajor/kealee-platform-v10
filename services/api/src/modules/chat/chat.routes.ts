import { FastifyInstance } from 'fastify';
import { authenticateUser } from '../auth/auth.middleware';
import { prismaAny } from '../../utils/prisma-helper';
import { PlatformChatEngine } from '@kealee/ai-chat';

/**
 * Chat routes — Conversational AI endpoints
 *
 * POST /chat          — Send message (SSE streaming response)
 * GET  /chat/history/:id — Get conversation history
 * GET  /chat/conversations — List user conversations
 * DELETE /chat/conversations/:id — Archive a conversation
 */
export async function chatRoutes(fastify: FastifyInstance) {
  const engine = new PlatformChatEngine(prismaAny);

  // ─── POST /chat — SSE Streaming Chat ─────────────────────────────────

  fastify.post(
    '/',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const user = (request as any).user as { userId: string };
        const body = request.body as {
          message?: string;
          conversationId?: string;
          projectId?: string;
        };

        if (!body?.message || typeof body.message !== 'string' || !body.message.trim()) {
          return reply.code(400).send({ error: 'message is required' });
        }

        // Set SSE headers
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');
        reply.raw.setHeader('X-Accel-Buffering', 'no');

        // Send connected event
        reply.raw.write(
          `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`,
        );

        let disconnected = false;
        request.raw.on('close', () => {
          disconnected = true;
        });

        try {
          const stream = engine.chatStream({
            userId: user.userId,
            message: body.message.trim(),
            conversationId: body.conversationId,
            projectId: body.projectId,
          });

          for await (const event of stream) {
            if (disconnected) break;

            reply.raw.write(
              `data: ${JSON.stringify(event)}\n\n`,
            );
          }
        } catch (streamErr: unknown) {
          const errMsg = streamErr instanceof Error ? streamErr.message : 'Chat engine error';
          fastify.log.error(`Chat stream error: ${errMsg}`);

          if (!disconnected) {
            reply.raw.write(
              `data: ${JSON.stringify({ type: 'error', data: { message: errMsg } })}\n\n`,
            );
          }
        }

        if (!disconnected) {
          reply.raw.end();
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Internal server error';
        fastify.log.error(`Chat route error: ${errMsg}`);
        return reply.code(500).send({ error: errMsg });
      }
    },
  );

  // ─── GET /chat/history/:conversationId ───────────────────────────────

  fastify.get(
    '/history/:conversationId',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const user = (request as any).user as { userId: string };
        const { conversationId } = request.params as { conversationId: string };

        const conversation = await prismaAny.aIConversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation) {
          return reply.code(404).send({ error: 'Conversation not found' });
        }

        if (conversation.userId !== user.userId) {
          return reply.code(403).send({ error: 'Not authorized to view this conversation' });
        }

        return reply.send({
          conversationId: conversation.id,
          title: conversation.title,
          messages: conversation.messages || [],
          projectId: conversation.projectId,
          createdAt: conversation.createdAt,
          lastMessageAt: conversation.lastMessageAt,
          tokens: conversation.tokens,
        });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Internal server error';
        fastify.log.error(`Chat history error: ${errMsg}`);
        return reply.code(500).send({ error: errMsg });
      }
    },
  );

  // ─── GET /chat/conversations ─────────────────────────────────────────

  fastify.get(
    '/conversations',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const user = (request as any).user as { userId: string };
        const query = request.query as { page?: string; limit?: string };
        const page = Math.max(1, parseInt(query.page || '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
        const skip = (page - 1) * limit;

        const [conversations, total] = await Promise.all([
          prismaAny.aIConversation.findMany({
            where: {
              userId: user.userId,
              isArchived: false,
            },
            select: {
              id: true,
              title: true,
              projectId: true,
              lastMessageAt: true,
              createdAt: true,
              tokens: true,
            },
            orderBy: { lastMessageAt: 'desc' },
            skip,
            take: limit,
          }),
          prismaAny.aIConversation.count({
            where: {
              userId: user.userId,
              isArchived: false,
            },
          }),
        ]);

        return reply.send({
          conversations,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Internal server error';
        fastify.log.error(`Chat conversations error: ${errMsg}`);
        return reply.code(500).send({ error: errMsg });
      }
    },
  );

  // ─── DELETE /chat/conversations/:conversationId ──────────────────────

  fastify.delete(
    '/conversations/:conversationId',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const user = (request as any).user as { userId: string };
        const { conversationId } = request.params as { conversationId: string };

        const conversation = await prismaAny.aIConversation.findUnique({
          where: { id: conversationId },
          select: { id: true, userId: true },
        });

        if (!conversation) {
          return reply.code(404).send({ error: 'Conversation not found' });
        }

        if (conversation.userId !== user.userId) {
          return reply.code(403).send({ error: 'Not authorized' });
        }

        await prismaAny.aIConversation.update({
          where: { id: conversationId },
          data: { isArchived: true },
        });

        return reply.send({ success: true });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Internal server error';
        fastify.log.error(`Chat delete error: ${errMsg}`);
        return reply.code(500).send({ error: errMsg });
      }
    },
  );
}
