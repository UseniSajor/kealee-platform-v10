/**
 * AI Conversation Routes
 * Handles AIConversation model for conversation history management
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.middleware';
import { prisma } from '@kealee/database';

const p = prisma as any;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const idParamSchema = z.object({
  id: z.string().uuid(),
});

const conversationListSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  projectId: z.string().uuid().optional(),
  includeArchived: z.string().transform((v) => v === 'true').optional(),
});

const conversationCreateSchema = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string().optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    timestamp: z.string().datetime().optional(),
  })).optional(),
  context: z.record(z.any()).optional(),
  model: z.string().optional(),
});

const messageAddSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  timestamp: z.string().datetime().optional(),
  tokens: z.number().int().optional(),
});

// ============================================================================
// ROUTES
// ============================================================================

export async function aiConversationRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateUser);

  // GET / - List conversations for current user
  fastify.get(
    '/',
    { preHandler: [validateQuery(conversationListSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const query = conversationListSchema.parse(request.query);
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(50, Math.max(1, query.limit || 20));
        const skip = (page - 1) * limit;

        const where: any = { userId: user.id };
        if (!query.includeArchived) {
          where.isArchived = false;
        }
        if (query.projectId) {
          where.projectId = query.projectId;
        }

        const [conversations, total] = await Promise.all([
          p.aIConversation.findMany({
            where,
            select: {
              id: true,
              title: true,
              projectId: true,
              model: true,
              tokens: true,
              isArchived: true,
              lastMessageAt: true,
              createdAt: true,
              updatedAt: true,
              summary: true,
            },
            orderBy: { lastMessageAt: 'desc' },
            skip,
            take: limit,
          }),
          p.aIConversation.count({ where }),
        ]);

        return reply.send({
          success: true,
          data: conversations,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to list conversations',
        });
      }
    }
  );

  // GET /:id - Single conversation with messages
  fastify.get(
    '/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const { id } = idParamSchema.parse(request.params);

        const conversation = await p.aIConversation.findUnique({
          where: { id },
        });

        if (!conversation) {
          return reply.code(404).send({
            success: false,
            error: 'Conversation not found',
          });
        }

        if (conversation.userId !== user.id) {
          return reply.code(403).send({
            success: false,
            error: 'Access denied',
          });
        }

        return reply.send({
          success: true,
          data: {
            id: conversation.id,
            title: conversation.title,
            projectId: conversation.projectId,
            messages: conversation.messages || [],
            context: conversation.context,
            summary: conversation.summary,
            tokens: conversation.tokens,
            model: conversation.model,
            isArchived: conversation.isArchived,
            lastMessageAt: conversation.lastMessageAt,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to get conversation',
        });
      }
    }
  );

  // POST / - Create conversation
  fastify.post(
    '/',
    { preHandler: [validateBody(conversationCreateSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const data = conversationCreateSchema.parse(request.body);

        const messages = (data.messages || []).map((msg) => ({
          ...msg,
          timestamp: msg.timestamp || new Date().toISOString(),
        }));

        const conversation = await p.aIConversation.create({
          data: {
            userId: user.id,
            projectId: data.projectId,
            title: data.title || 'New Conversation',
            messages: messages,
            context: data.context || undefined,
            model: data.model,
            tokens: 0,
            lastMessageAt: new Date(),
          },
        });

        return reply.code(201).send({
          success: true,
          data: conversation,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Failed to create conversation',
        });
      }
    }
  );

  // POST /:id/messages - Add message to conversation
  fastify.post(
    '/:id/messages',
    {
      preHandler: [
        validateParams(idParamSchema),
        validateBody(messageAddSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const { id } = idParamSchema.parse(request.params);
        const messageData = messageAddSchema.parse(request.body);

        const conversation = await p.aIConversation.findUnique({
          where: { id },
        });

        if (!conversation) {
          return reply.code(404).send({
            success: false,
            error: 'Conversation not found',
          });
        }

        if (conversation.userId !== user.id) {
          return reply.code(403).send({
            success: false,
            error: 'Access denied',
          });
        }

        if (conversation.isArchived) {
          return reply.code(400).send({
            success: false,
            error: 'Cannot add messages to an archived conversation',
          });
        }

        // Append new message to existing messages array
        const existingMessages = Array.isArray(conversation.messages)
          ? conversation.messages
          : [];

        const newMessage = {
          role: messageData.role,
          content: messageData.content,
          timestamp: messageData.timestamp || new Date().toISOString(),
        };

        const updatedMessages = [...existingMessages, newMessage];

        const updated = await p.aIConversation.update({
          where: { id },
          data: {
            messages: updatedMessages,
            lastMessageAt: new Date(),
            tokens: messageData.tokens
              ? { increment: messageData.tokens }
              : undefined,
          },
        });

        return reply.send({
          success: true,
          data: {
            conversationId: updated.id,
            message: newMessage,
            totalMessages: updatedMessages.length,
            tokens: updated.tokens,
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Failed to add message',
        });
      }
    }
  );

  // DELETE /:id - Delete (archive) conversation
  fastify.delete(
    '/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const { id } = idParamSchema.parse(request.params);

        const conversation = await p.aIConversation.findUnique({
          where: { id },
          select: { id: true, userId: true },
        });

        if (!conversation) {
          return reply.code(404).send({
            success: false,
            error: 'Conversation not found',
          });
        }

        if (conversation.userId !== user.id) {
          return reply.code(403).send({
            success: false,
            error: 'Access denied',
          });
        }

        await p.aIConversation.update({
          where: { id },
          data: { isArchived: true },
        });

        return reply.send({
          success: true,
          message: 'Conversation archived',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to delete conversation',
        });
      }
    }
  );
}
