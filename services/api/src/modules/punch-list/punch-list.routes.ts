/**
 * KEALEE PLATFORM - PUNCH LIST ROUTES (SOP-015)
 * Project closeout punch list management
 */

import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validation.middleware'
import { z } from 'zod'
import { punchListService } from './punch-list.service'

const createPunchListItemSchema = z.object({
  projectId: z.string().uuid(),
  milestoneId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum([
    'STRUCTURAL', 'FINISH', 'MEP', 'EXTERIOR', 'INTERIOR',
    'PLUMBING', 'ELECTRICAL', 'HVAC', 'LANDSCAPING', 'OTHER',
  ]).optional(),
  location: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  photoUrls: z.array(z.string()).optional(),
})

const updatePunchListItemSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'REJECTED']).optional(),
  assignedTo: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
  photoUrls: z.array(z.string()).optional(),
  rejectionNote: z.string().optional(),
})

const idParamSchema = z.object({ id: z.string().uuid() })

export async function punchListRoutes(fastify: FastifyInstance) {
  // POST /punch-list - Create punch list item
  fastify.post(
    '/',
    { preHandler: [authenticateUser, validateBody(createPunchListItemSchema)] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const body = request.body as z.infer<typeof createPunchListItemSchema>

      const item = await punchListService.createItem(body, user.id)
      return reply.code(201).send({ item })
    }
  )

  // GET /punch-list/project/:projectId - List all items for a project
  fastify.get(
    '/project/:projectId',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const { status } = request.query as { status?: string }

      const items = await punchListService.listByProject(projectId, status)
      return reply.send({ items })
    }
  )

  // GET /punch-list/:id - Get single item
  fastify.get(
    '/:id',
    { preHandler: [authenticateUser, validateParams(idParamSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const item = await punchListService.getItem(id)
      return reply.send({ item })
    }
  )

  // PATCH /punch-list/:id - Update item
  fastify.patch(
    '/:id',
    { preHandler: [authenticateUser, validateParams(idParamSchema), validateBody(updatePunchListItemSchema)] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const body = request.body as z.infer<typeof updatePunchListItemSchema>

      const item = await punchListService.updateItem(id, body, user.id)
      return reply.send({ item })
    }
  )

  // POST /punch-list/:id/verify - Verify completed item
  fastify.post(
    '/:id/verify',
    { preHandler: [authenticateUser, validateParams(idParamSchema)] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }

      const item = await punchListService.verifyItem(id, user.id)
      return reply.send({ item })
    }
  )

  // POST /punch-list/:id/reject - Reject completed item
  fastify.post(
    '/:id/reject',
    { preHandler: [authenticateUser, validateParams(idParamSchema)] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const { note } = request.body as { note?: string }

      const item = await punchListService.rejectItem(id, user.id, note)
      return reply.send({ item })
    }
  )

  // GET /punch-list/project/:projectId/summary - Get completion summary
  fastify.get(
    '/project/:projectId/summary',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const summary = await punchListService.getProjectSummary(projectId)
      return reply.send({ summary })
    }
  )
}
