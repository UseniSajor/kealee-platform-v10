/**
 * KEALEE PLATFORM - CHANGE ORDER ROUTES (SOP-013)
 * Manages scope changes with cost/schedule impact analysis
 */

import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validation.middleware'
import { z } from 'zod'
import { changeOrderService } from './change-order.service'

const createChangeOrderSchema = z.object({
  projectId: z.string().uuid(),
  contractId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(10),
  reason: z.enum([
    'OWNER_REQUEST',
    'DESIGN_CHANGE',
    'UNFORESEEN_CONDITIONS',
    'CODE_REQUIREMENT',
    'VALUE_ENGINEERING',
    'ERROR_CORRECTION',
  ]),
  costImpact: z.number(), // Can be positive or negative
  scheduleImpactDays: z.number().int().default(0),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitCost: z.number(),
    total: z.number(),
  })).optional(),
})

const approveChangeOrderSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
})

const idParamSchema = z.object({ id: z.string().uuid() })

export async function changeOrderRoutes(fastify: FastifyInstance) {
  // POST /change-orders - Create change order
  fastify.post(
    '/',
    { preHandler: [authenticateUser, validateBody(createChangeOrderSchema)] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const body = request.body as z.infer<typeof createChangeOrderSchema>

      const changeOrder = await changeOrderService.createChangeOrder(body, user.id)
      return reply.code(201).send({ changeOrder })
    }
  )

  // GET /change-orders/:id - Get change order
  fastify.get(
    '/:id',
    { preHandler: [authenticateUser, validateParams(idParamSchema)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const changeOrder = await changeOrderService.getChangeOrder(id)
      return reply.send({ changeOrder })
    }
  )

  // GET /change-orders/project/:projectId - List change orders for project
  fastify.get(
    '/project/:projectId',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const changeOrders = await changeOrderService.listByProject(projectId)
      return reply.send({ changeOrders })
    }
  )

  // POST /change-orders/:id/approve - Approve or reject change order
  fastify.post(
    '/:id/approve',
    { preHandler: [authenticateUser, validateParams(idParamSchema), validateBody(approveChangeOrderSchema)] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const body = request.body as z.infer<typeof approveChangeOrderSchema>

      const changeOrder = await changeOrderService.approveChangeOrder(id, user.id, body.approved, body.notes)
      return reply.send({ changeOrder })
    }
  )

  // POST /change-orders/:id/execute - Execute approved change order
  fastify.post(
    '/:id/execute',
    { preHandler: [authenticateUser, validateParams(idParamSchema)] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }

      const changeOrder = await changeOrderService.executeChangeOrder(id, user.id)
      return reply.send({ changeOrder })
    }
  )

  // GET /change-orders/project/:projectId/summary - Get cost/schedule impact summary
  fastify.get(
    '/project/:projectId/summary',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const summary = await changeOrderService.getProjectImpactSummary(projectId)
      return reply.send({ summary })
    }
  )
}
