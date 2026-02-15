import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';

export function messengerRoutes(prisma: PrismaClient) {
  return async function (fastify: FastifyInstance) {
    // -----------------------------------------------------------------------
    // List conversations for a project
    // -----------------------------------------------------------------------
    fastify.get('/conversations', async (request) => {
      const { projectId, type } = request.query as {
        projectId?: string;
        type?: string;
      };

      const conversations = await prisma.conversation.findMany({
        where: {
          ...(projectId && { projectId }),
          ...(type && { type: type as any }),
          isArchived: false,
        },
        include: {
          participants: true,
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return { data: conversations };
    });

    // -----------------------------------------------------------------------
    // Get single conversation with recent messages
    // -----------------------------------------------------------------------
    fastify.get('/conversations/:id', async (request) => {
      const { id } = request.params as { id: string };
      const { limit } = request.query as { limit?: string };

      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
          participants: true,
          messages: {
            take: parseInt(limit ?? '50', 10),
            orderBy: { createdAt: 'desc' },
            include: {
              attachments: true,
              readBy: true,
            },
          },
        },
      });

      if (!conversation) {
        return { error: 'Conversation not found', statusCode: 404 };
      }

      return { data: conversation };
    });

    // -----------------------------------------------------------------------
    // Create a new conversation
    // -----------------------------------------------------------------------
    fastify.post('/conversations', async (request) => {
      const body = request.body as {
        projectId: string;
        organizationId: string;
        type: string;
        name?: string;
        participantIds: string[];
      };

      const conversation = await prisma.conversation.create({
        data: {
          projectId: body.projectId,
          organizationId: body.organizationId,
          type: body.type as any,
          name: body.name,
          participants: {
            create: body.participantIds.map((userId) => ({
              userId,
              role: 'MEMBER' as any,
            })),
          },
        },
        include: { participants: true },
      });

      return { data: conversation };
    });

    // -----------------------------------------------------------------------
    // Send a message in a conversation
    // -----------------------------------------------------------------------
    fastify.post('/conversations/:id/messages', async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        senderId: string;
        content: string;
        type?: string;
        replyToId?: string;
        attachments?: Array<{
          fileName: string;
          fileUrl: string;
          fileType: string;
          fileSize: number;
        }>;
      };

      const conversation = await prisma.conversation.findUnique({
        where: { id },
      });

      if (!conversation) {
        return { error: 'Conversation not found', statusCode: 404 };
      }

      // Create the message
      const message = await prisma.chatMessage.create({
        data: {
          conversationId: id,
          senderId: body.senderId,
          content: body.content,
          type: (body.type ?? 'TEXT') as any,
          replyToId: body.replyToId,
          attachments: body.attachments
            ? {
                create: body.attachments.map((a) => ({
                  fileName: a.fileName,
                  fileUrl: a.fileUrl,
                  fileType: a.fileType,
                  fileSize: a.fileSize,
                })),
              }
            : undefined,
        },
        include: {
          attachments: true,
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      // Detect @kealee mentions and route to messenger worker
      if (body.content.toLowerCase().includes('@kealee')) {
        const queue = createQueue(KEALEE_QUEUES.COMMUNICATION);
        await queue.add('kealee-messenger-detect', {
          messageId: message.id,
          conversationId: id,
          projectId: conversation.projectId,
          content: body.content,
          senderId: body.senderId,
        });
      }

      return { data: message };
    });

    // -----------------------------------------------------------------------
    // Mark messages as read
    // -----------------------------------------------------------------------
    fastify.post('/conversations/:id/read', async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        userId: string;
        messageIds: string[];
      };

      // Create read receipts for each message
      const readReceipts = await Promise.all(
        body.messageIds.map((messageId) =>
          prisma.chatMessageRead.upsert({
            where: {
              messageId_userId: {
                messageId,
                userId: body.userId,
              },
            },
            update: { readAt: new Date() },
            create: {
              messageId,
              userId: body.userId,
              readAt: new Date(),
            },
          }),
        ),
      );

      // Update participant's last read timestamp
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId: id,
          userId: body.userId,
        },
        data: { lastReadAt: new Date() },
      });

      return { data: { markedRead: readReceipts.length } };
    });

    // -----------------------------------------------------------------------
    // Add participant to conversation
    // -----------------------------------------------------------------------
    fastify.post('/conversations/:id/participants', async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        userId: string;
        role?: string;
      };

      const participant = await prisma.conversationParticipant.create({
        data: {
          conversationId: id,
          userId: body.userId,
          role: (body.role ?? 'MEMBER') as any,
        },
      });

      return { data: participant };
    });

    // -----------------------------------------------------------------------
    // Remove participant from conversation
    // -----------------------------------------------------------------------
    fastify.delete('/conversations/:conversationId/participants/:participantId', async (request) => {
      const { participantId } = request.params as {
        conversationId: string;
        participantId: string;
      };

      await prisma.conversationParticipant.delete({
        where: { id: participantId },
      });

      return { data: { ok: true } };
    });

    // -----------------------------------------------------------------------
    // Search messages across conversations in a project
    // -----------------------------------------------------------------------
    fastify.get('/search', async (request) => {
      const { projectId, query, limit } = request.query as {
        projectId: string;
        query: string;
        limit?: string;
      };

      if (!projectId || !query) {
        return { error: 'projectId and query are required', statusCode: 400 };
      }

      const messages = await prisma.chatMessage.findMany({
        where: {
          conversation: { projectId },
          content: { contains: query, mode: 'insensitive' },
        },
        include: {
          conversation: { select: { id: true, name: true } },
          sender: { select: { id: true, name: true } },
        },
        take: parseInt(limit ?? '25', 10),
        orderBy: { createdAt: 'desc' },
      });

      return { data: messages };
    });

    // -----------------------------------------------------------------------
    // Send @kealee query directly (outside of a conversation)
    // -----------------------------------------------------------------------
    fastify.post('/kealee/query', async (request) => {
      const body = request.body as {
        projectId: string;
        query: string;
        senderId: string;
      };

      const queue = createQueue(KEALEE_QUEUES.COMMUNICATION);
      await queue.add('kealee-messenger-query', {
        messageId: null,
        conversationId: null,
        projectId: body.projectId,
        query: body.query,
        senderId: body.senderId,
      });

      return {
        data: {
          queued: true,
          projectId: body.projectId,
        },
      };
    });

    // -----------------------------------------------------------------------
    // List communication templates
    // -----------------------------------------------------------------------
    fastify.get('/templates', async (request) => {
      const { channel, organizationId } = request.query as {
        channel?: string;
        organizationId?: string;
      };

      const templates = await prisma.communicationTemplate.findMany({
        where: {
          isActive: true,
          ...(channel && { channel }),
          ...(organizationId && { organizationId }),
        },
        orderBy: { name: 'asc' },
      });

      return { data: templates };
    });
  };
}
