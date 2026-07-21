import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { closeoutService } from './closeout.service'

const updateCloseoutItemSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).optional(),
  notes: z.string().optional(),
  completed: z.boolean().optional(),
})

const addAttachmentSchema = z.object({
  url: z.string().url(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().positive().optional(),
  description: z.string().optional(),
})

const createPunchListItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  location: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  checklistItemId: z.string().uuid().optional(),
})

const updatePunchListItemSchema = z.object({
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
  completionNotes: z.string().optional(),
  photos: z.array(z.string().url()).optional(),
  assignedTo: z.string().uuid().optional(),
})

export async function closeoutRoutes(fastify: FastifyInstance) {
  // Get closeout checklist (Prompt 3.7)
  fastify.get(
    '/projects/:projectId/checklist',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const checklist = await closeoutService.getCloseoutChecklist(projectId, user.id)
      return reply.send({ checklist })
    }
  )

  // Update closeout item (Prompt 3.7)
  fastify.patch(
    '/items/:itemId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ itemId: z.string().uuid() })),
        validateBody(updateCloseoutItemSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { itemId } = request.params as { itemId: string }
      const item = await closeoutService.updateCloseoutItem(itemId, user.id, request.body as any)
      return reply.send({ item })
    }
  )

  // Add attachment to closeout item (Prompt 3.7)
  fastify.post(
    '/items/:itemId/attachments',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ itemId: z.string().uuid() })),
        validateBody(addAttachmentSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { itemId } = request.params as { itemId: string }
      const attachment = await closeoutService.addAttachment(itemId, user.id, request.body as any)
      return reply.code(201).send({ attachment })
    }
  )

  // Complete closeout (Prompt 3.7)
  fastify.post(
    '/projects/:projectId/complete',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const result = await closeoutService.completeCloseout(projectId, user.id)
      return reply.send(result)
    }
  )

  // Create punch list item (Prompt 3.7)
  fastify.post(
    '/projects/:projectId/punch-list',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createPunchListItemSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const body = request.body as any
      const item = await closeoutService.createPunchListItem(projectId, user.id, {
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      })
      return reply.code(201).send({ item })
    }
  )

  // Get punch list items (Prompt 3.7)
  fastify.get(
    '/projects/:projectId/punch-list',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const items = await closeoutService.getPunchListItems(projectId, user.id)
      return reply.send({ items })
    }
  )

  // Update punch list item (Prompt 3.7)
  fastify.patch(
    '/punch-list/:itemId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ itemId: z.string().uuid() })),
        validateBody(updatePunchListItemSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { itemId } = request.params as { itemId: string }
      const item = await closeoutService.updatePunchListItem(itemId, user.id, request.body as any)
      return reply.send({ item })
    }
  )
}
