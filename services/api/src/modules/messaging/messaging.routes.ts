/**
 * Project Messaging Routes
 *
 * Real-time-ready messaging using Conversation + ChatMessage Prisma models.
 * Currently REST-based (polling); Socket.io upgrade planned for Phase 4.
 *
 * Conversations:
 *   GET    /conversations                — List user's conversations
 *   POST   /conversations                — Create conversation (DIRECT or GROUP)
 *   GET    /conversations/:id            — Get conversation with recent messages
 *   PATCH  /conversations/:id            — Update conversation (rename, archive)
 *   DELETE /conversations/:id            — Archive conversation
 *
 * Messages:
 *   GET    /conversations/:id/messages   — Get messages (paginated, newest-first)
 *   POST   /conversations/:id/messages   — Send a message
 *   PATCH  /messages/:id                 — Edit a message
 *   DELETE /messages/:id                 — Delete a message (soft)
 *   POST   /conversations/:id/read       — Mark conversation as read
 *
 * Participants:
 *   GET    /conversations/:id/participants — List participants
 *   POST   /conversations/:id/participants — Add participant
 *   DELETE /conversations/:id/participants/:userId — Remove participant
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser, AuthenticatedRequest } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma } from '@kealee/database'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const p = prisma as any

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const conversationCreateSchema = z.object({
  projectId: z.string(),
  type: z.enum(['DIRECT', 'GROUP', 'PROJECT_CHANNEL', 'SUPPORT']).default('DIRECT'),
  name: z.string().optional(),
  participantIds: z.array(z.string()).min(1, 'At least one participant required'),
})

const conversationUpdateSchema = z.object({
  name: z.string().optional(),
  isArchived: z.boolean().optional(),
})

const messageCreateSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  type: z.enum(['TEXT', 'FILE', 'IMAGE', 'SYSTEM', 'CHANGE_ORDER', 'PAYMENT', 'RFI']).default('TEXT'),
  replyToId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

const messageUpdateSchema = z.object({
  content: z.string().min(1),
})

const participantAddSchema = z.object({
  userId: z.string(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
})

const idParam = z.object({ id: z.string() })
const convIdParam = z.object({ id: z.string() })

const listQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  projectId: z.string().optional(),
  type: z.string().optional(),
})

const messageListQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  before: z.string().optional(), // cursor-based: get messages before this ID
  after: z.string().optional(),  // cursor-based: get messages after this ID
})

// ============================================================================
// ROUTES
// ============================================================================

export async function messagingRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateUser)

  // ========================================================================
  // CONVERSATIONS
  // ========================================================================

  // GET /conversations — List user's conversations
  fastify.get(
    '/conversations',
    { preHandler: [validateQuery(listQuery)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const query = request.query as { page?: string; limit?: string; projectId?: string; type?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        // Find conversations where user is a participant
        const participantWhere: any = { userId: user.id }

        const participantRecords = await p.conversationParticipant.findMany({
          where: participantWhere,
          select: { conversationId: true },
        })

        const conversationIds = participantRecords.map((pr: any) => pr.conversationId)

        if (conversationIds.length === 0) {
          return reply.send({
            success: true,
            data: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          })
        }

        const where: any = {
          id: { in: conversationIds },
          isArchived: false,
        }
        if (query.projectId) where.projectId = query.projectId
        if (query.type) where.type = query.type

        const [conversations, total] = await Promise.all([
          p.conversation.findMany({
            where,
            include: {
              participants: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                  sender: { select: { id: true, name: true } },
                },
              },
            },
            orderBy: { updatedAt: 'desc' },
            skip,
            take: limit,
          }),
          p.conversation.count({ where }),
        ])

        // Add unread count per conversation
        const enriched = await Promise.all(
          conversations.map(async (conv: any) => {
            const participant = conv.participants.find((p: any) => p.userId === user.id)
            const lastReadAt = participant?.lastReadAt || new Date(0)

            const unreadCount = await p.chatMessage.count({
              where: {
                conversationId: conv.id,
                createdAt: { gt: lastReadAt },
                senderId: { not: user.id },
              },
            })

            return {
              ...conv,
              unreadCount,
              lastMessage: conv.messages[0] || null,
              messages: undefined, // Remove full messages array
            }
          })
        )

        return reply.send({
          success: true,
          data: enriched,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to list conversations') })
      }
    }
  )

  // POST /conversations — Create conversation
  fastify.post(
    '/conversations',
    { preHandler: [validateBody(conversationCreateSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const body = conversationCreateSchema.parse(request.body)

        // For DIRECT conversations, check if one already exists between these two users
        if (body.type === 'DIRECT' && body.participantIds.length === 1) {
          const otherUserId = body.participantIds[0]

          // Find existing direct conversation in this project
          const existingConvs = await p.conversation.findMany({
            where: {
              projectId: body.projectId,
              type: 'DIRECT',
              isArchived: false,
              AND: [
                { participants: { some: { userId: user.id } } },
                { participants: { some: { userId: otherUserId } } },
              ],
            },
            include: {
              participants: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          })

          if (existingConvs.length > 0) {
            return reply.send({ success: true, data: existingConvs[0], existing: true })
          }
        }

        // Look up the organization from the project
        const project = await p.project.findUnique({
          where: { id: body.projectId },
          select: { orgId: true, organizationId: true },
        })

        const orgId = project?.orgId || project?.organizationId || ''

        // Create conversation with participants
        const conversation = await p.conversation.create({
          data: {
            projectId: body.projectId,
            organizationId: orgId,
            type: body.type,
            name: body.name,
            participants: {
              create: [
                // Creator is OWNER
                { userId: user.id, role: 'OWNER' },
                // Other participants are MEMBER
                ...body.participantIds
                  .filter((id: string) => id !== user.id)
                  .map((id: string) => ({
                    userId: id,
                    role: 'MEMBER' as const,
                  })),
              ],
            },
          },
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        })

        // Create a system message for conversation start
        await p.chatMessage.create({
          data: {
            conversationId: conversation.id,
            senderId: user.id,
            content: `Conversation started by ${user.name || user.email || 'a user'}`,
            type: 'SYSTEM',
          },
        })

        return reply.code(201).send({ success: true, data: conversation })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to create conversation') })
      }
    }
  )

  // GET /conversations/:id — Get conversation with recent messages
  fastify.get(
    '/conversations/:id',
    { preHandler: [validateParams(idParam)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { id } = request.params as { id: string }

        const conversation = await p.conversation.findUnique({
          where: { id },
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 50,
              include: {
                sender: { select: { id: true, name: true, email: true } },
                replyTo: {
                  select: { id: true, content: true, senderId: true },
                },
                attachments: true,
              },
            },
          },
        })

        if (!conversation) {
          return reply.code(404).send({ success: false, error: 'Conversation not found' })
        }

        // Verify user is a participant
        const isParticipant = conversation.participants.some((p: any) => p.userId === user.id)
        if (!isParticipant) {
          return reply.code(403).send({ success: false, error: 'Not a participant in this conversation' })
        }

        // Reverse messages to chronological order for the client
        conversation.messages.reverse()

        return reply.send({ success: true, data: conversation })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to get conversation') })
      }
    }
  )

  // PATCH /conversations/:id — Update conversation
  fastify.patch(
    '/conversations/:id',
    {
      preHandler: [
        validateParams(idParam),
        validateBody(conversationUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { id } = request.params as { id: string }
        const body = conversationUpdateSchema.parse(request.body)

        // Verify user is participant with OWNER or ADMIN role
        const participant = await p.conversationParticipant.findUnique({
          where: { conversationId_userId: { conversationId: id, userId: user.id } },
        })

        if (!participant) {
          return reply.code(403).send({ success: false, error: 'Not a participant' })
        }

        if (body.isArchived !== undefined && !['OWNER', 'ADMIN'].includes(participant.role)) {
          return reply.code(403).send({ success: false, error: 'Only owners/admins can archive' })
        }

        const updated = await p.conversation.update({
          where: { id },
          data: body,
        })

        return reply.send({ success: true, data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to update conversation') })
      }
    }
  )

  // DELETE /conversations/:id — Archive conversation
  fastify.delete(
    '/conversations/:id',
    { preHandler: [validateParams(idParam)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { id } = request.params as { id: string }

        const participant = await p.conversationParticipant.findUnique({
          where: { conversationId_userId: { conversationId: id, userId: user.id } },
        })

        if (!participant || !['OWNER', 'ADMIN'].includes(participant.role)) {
          return reply.code(403).send({ success: false, error: 'Only owners/admins can archive conversations' })
        }

        await p.conversation.update({
          where: { id },
          data: { isArchived: true },
        })

        return reply.send({ success: true, message: 'Conversation archived' })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to archive conversation') })
      }
    }
  )

  // ========================================================================
  // MESSAGES
  // ========================================================================

  // GET /conversations/:id/messages — Get messages (paginated)
  fastify.get(
    '/conversations/:id/messages',
    {
      preHandler: [
        validateParams(convIdParam),
        validateQuery(messageListQuery),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { id } = request.params as { id: string }
        const query = request.query as { page?: string; limit?: string; before?: string; after?: string }

        // Verify participation
        const participant = await p.conversationParticipant.findUnique({
          where: { conversationId_userId: { conversationId: id, userId: user.id } },
        })

        if (!participant) {
          return reply.code(403).send({ success: false, error: 'Not a participant' })
        }

        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50', 10)))

        const where: any = { conversationId: id }

        // Cursor-based pagination
        if (query.before) {
          where.createdAt = { lt: new Date(query.before) }
        }
        if (query.after) {
          where.createdAt = { gt: new Date(query.after) }
        }

        const [messages, total] = await Promise.all([
          p.chatMessage.findMany({
            where,
            include: {
              sender: { select: { id: true, name: true, email: true } },
              replyTo: {
                select: { id: true, content: true, senderId: true },
              },
              attachments: true,
              readBy: {
                select: { userId: true, readAt: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
          }),
          p.chatMessage.count({ where: { conversationId: id } }),
        ])

        // Return in chronological order
        messages.reverse()

        return reply.send({
          success: true,
          data: messages,
          total,
          hasMore: total > messages.length,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to list messages') })
      }
    }
  )

  // POST /conversations/:id/messages — Send a message
  fastify.post(
    '/conversations/:id/messages',
    {
      preHandler: [
        validateParams(convIdParam),
        validateBody(messageCreateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { id } = request.params as { id: string }
        const body = messageCreateSchema.parse(request.body)

        // Verify participation
        const participant = await p.conversationParticipant.findUnique({
          where: { conversationId_userId: { conversationId: id, userId: user.id } },
        })

        if (!participant) {
          return reply.code(403).send({ success: false, error: 'Not a participant' })
        }

        if (participant.role === 'VIEWER') {
          return reply.code(403).send({ success: false, error: 'Viewers cannot send messages' })
        }

        // Create the message
        const message = await p.chatMessage.create({
          data: {
            conversationId: id,
            senderId: user.id,
            content: body.content,
            type: body.type,
            replyToId: body.replyToId,
            metadata: body.metadata,
          },
          include: {
            sender: { select: { id: true, name: true, email: true } },
            replyTo: body.replyToId ? {
              select: { id: true, content: true, senderId: true },
            } : false,
          },
        })

        // Update conversation's updatedAt
        await p.conversation.update({
          where: { id },
          data: { updatedAt: new Date() },
        })

        // Auto-mark as read for sender
        await p.chatMessageRead.upsert({
          where: { messageId_userId: { messageId: message.id, userId: user.id } },
          update: { readAt: new Date() },
          create: { messageId: message.id, userId: user.id },
        })

        // Update sender's lastReadAt
        await p.conversationParticipant.update({
          where: { conversationId_userId: { conversationId: id, userId: user.id } },
          data: { lastReadAt: new Date() },
        })

        // TODO: Send push notifications to other participants
        // (Will integrate with pushService in Phase 4)

        return reply.code(201).send({ success: true, data: message })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to send message') })
      }
    }
  )

  // PATCH /messages/:id — Edit a message
  fastify.patch(
    '/messages/:id',
    {
      preHandler: [
        validateParams(idParam),
        validateBody(messageUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { id } = request.params as { id: string }
        const body = messageUpdateSchema.parse(request.body)

        const message = await p.chatMessage.findUnique({
          where: { id },
          select: { id: true, senderId: true },
        })

        if (!message) {
          return reply.code(404).send({ success: false, error: 'Message not found' })
        }

        if (message.senderId !== user.id) {
          return reply.code(403).send({ success: false, error: 'Can only edit your own messages' })
        }

        const updated = await p.chatMessage.update({
          where: { id },
          data: {
            content: body.content,
            isEdited: true,
          },
          include: {
            sender: { select: { id: true, name: true, email: true } },
          },
        })

        return reply.send({ success: true, data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to edit message') })
      }
    }
  )

  // DELETE /messages/:id — Delete a message (replace content)
  fastify.delete(
    '/messages/:id',
    { preHandler: [validateParams(idParam)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { id } = request.params as { id: string }

        const message = await p.chatMessage.findUnique({
          where: { id },
          select: { id: true, senderId: true, conversationId: true },
        })

        if (!message) {
          return reply.code(404).send({ success: false, error: 'Message not found' })
        }

        // Check if user is sender or conversation owner/admin
        if (message.senderId !== user.id) {
          const participant = await p.conversationParticipant.findUnique({
            where: {
              conversationId_userId: {
                conversationId: message.conversationId,
                userId: user.id,
              },
            },
          })

          if (!participant || !['OWNER', 'ADMIN'].includes(participant.role)) {
            return reply.code(403).send({ success: false, error: 'Not authorized to delete this message' })
          }
        }

        // Soft delete — replace content with "[deleted]"
        await p.chatMessage.update({
          where: { id },
          data: {
            content: '[This message was deleted]',
            type: 'SYSTEM',
            metadata: { deleted: true, deletedAt: new Date().toISOString(), deletedBy: user.id },
          },
        })

        return reply.send({ success: true, message: 'Message deleted' })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to delete message') })
      }
    }
  )

  // POST /conversations/:id/read — Mark conversation as read
  fastify.post(
    '/conversations/:id/read',
    { preHandler: [validateParams(convIdParam)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { id } = request.params as { id: string }

        // Update lastReadAt for this participant
        await p.conversationParticipant.update({
          where: { conversationId_userId: { conversationId: id, userId: user.id } },
          data: { lastReadAt: new Date() },
        })

        // Bulk create read receipts for unread messages
        const unreadMessages = await p.chatMessage.findMany({
          where: {
            conversationId: id,
            senderId: { not: user.id },
            readBy: { none: { userId: user.id } },
          },
          select: { id: true },
        })

        if (unreadMessages.length > 0) {
          await p.chatMessageRead.createMany({
            data: unreadMessages.map((m: any) => ({
              messageId: m.id,
              userId: user.id,
            })),
            skipDuplicates: true,
          })
        }

        return reply.send({
          success: true,
          message: `${unreadMessages.length} messages marked as read`,
          count: unreadMessages.length,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to mark as read') })
      }
    }
  )

  // ========================================================================
  // PARTICIPANTS
  // ========================================================================

  // GET /conversations/:id/participants — List participants
  fastify.get(
    '/conversations/:id/participants',
    { preHandler: [validateParams(convIdParam)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { id } = request.params as { id: string }

        // Verify participation
        const myParticipation = await p.conversationParticipant.findUnique({
          where: { conversationId_userId: { conversationId: id, userId: user.id } },
        })

        if (!myParticipation) {
          return reply.code(403).send({ success: false, error: 'Not a participant' })
        }

        const participants = await p.conversationParticipant.findMany({
          where: { conversationId: id },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { joinedAt: 'asc' },
        })

        return reply.send({ success: true, data: participants })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to list participants') })
      }
    }
  )

  // POST /conversations/:id/participants — Add participant
  fastify.post(
    '/conversations/:id/participants',
    {
      preHandler: [
        validateParams(convIdParam),
        validateBody(participantAddSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { id } = request.params as { id: string }
        const body = participantAddSchema.parse(request.body)

        // Verify user is OWNER or ADMIN
        const myParticipation = await p.conversationParticipant.findUnique({
          where: { conversationId_userId: { conversationId: id, userId: user.id } },
        })

        if (!myParticipation || !['OWNER', 'ADMIN'].includes(myParticipation.role)) {
          return reply.code(403).send({ success: false, error: 'Only owners/admins can add participants' })
        }

        // Check if already a participant
        const existing = await p.conversationParticipant.findUnique({
          where: { conversationId_userId: { conversationId: id, userId: body.userId } },
        })

        if (existing) {
          return reply.code(409).send({ success: false, error: 'User is already a participant' })
        }

        const participant = await p.conversationParticipant.create({
          data: {
            conversationId: id,
            userId: body.userId,
            role: body.role,
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        })

        // Create system message
        const addedUser = await p.user.findUnique({
          where: { id: body.userId },
          select: { name: true, email: true },
        })

        await p.chatMessage.create({
          data: {
            conversationId: id,
            senderId: user.id,
            content: `${addedUser?.name || addedUser?.email || 'A user'} was added to the conversation`,
            type: 'SYSTEM',
          },
        })

        return reply.code(201).send({ success: true, data: participant })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to add participant') })
      }
    }
  )

  // DELETE /conversations/:id/participants/:userId — Remove participant
  fastify.delete(
    '/conversations/:id/participants/:userId',
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { id, userId: targetUserId } = request.params as { id: string; userId: string }

        // Allow self-removal or owner/admin removal
        if (targetUserId !== user.id) {
          const myParticipation = await p.conversationParticipant.findUnique({
            where: { conversationId_userId: { conversationId: id, userId: user.id } },
          })

          if (!myParticipation || !['OWNER', 'ADMIN'].includes(myParticipation.role)) {
            return reply.code(403).send({ success: false, error: 'Only owners/admins can remove others' })
          }
        }

        await p.conversationParticipant.delete({
          where: { conversationId_userId: { conversationId: id, userId: targetUserId } },
        })

        // System message
        const removedUser = await p.user.findUnique({
          where: { id: targetUserId },
          select: { name: true, email: true },
        })

        await p.chatMessage.create({
          data: {
            conversationId: id,
            senderId: user.id,
            content: targetUserId === user.id
              ? `${removedUser?.name || 'A user'} left the conversation`
              : `${removedUser?.name || 'A user'} was removed from the conversation`,
            type: 'SYSTEM',
          },
        })

        return reply.send({ success: true, message: 'Participant removed' })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to remove participant') })
      }
    }
  )

  // ========================================================================
  // UNREAD COUNT (lightweight endpoint for notification badges)
  // ========================================================================

  // GET /unread-count — Get total unread message count across all conversations
  fastify.get(
    '/unread-count',
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!

        const participants = await p.conversationParticipant.findMany({
          where: { userId: user.id },
          select: { conversationId: true, lastReadAt: true },
        })

        let totalUnread = 0

        for (const part of participants) {
          const lastReadAt = part.lastReadAt || new Date(0)
          const count = await p.chatMessage.count({
            where: {
              conversationId: part.conversationId,
              createdAt: { gt: lastReadAt },
              senderId: { not: user.id },
            },
          })
          totalUnread += count
        }

        return reply.send({ success: true, unreadCount: totalUnread })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to get unread count') })
      }
    }
  )
}
