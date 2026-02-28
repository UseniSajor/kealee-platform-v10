/**
 * PM Budget Routes
 */
import { FastifyInstance } from 'fastify'
import { pmBudgetService } from './pm-budget.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmBudgetRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid() }))] }, async (request, reply) => {
    try {
      const { projectId } = request.query as any
      const result = await pmBudgetService.getOverview(projectId)
      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.get('/lines', { preHandler: [authenticateUser, validateQuery(z.object({
    projectId: z.string().uuid().optional(), category: z.string().optional(), status: z.string().optional(),
    page: z.coerce.number().default(1), limit: z.coerce.number().default(50),
  }))] }, async (request, reply) => {
    try {
      const result = await pmBudgetService.listLines(request.query as any)
      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.post('/lines', { preHandler: [authenticateUser, validateBody(z.object({
    projectId: z.string().uuid(), code: z.string().optional(), name: z.string().min(1),
    category: z.string().optional(), description: z.string().optional(),
    budgetAmount: z.number().optional(), sortOrder: z.number().optional(),
    metadata: z.record(z.any()).optional(),
  }))] }, async (request, reply) => {
    try {
      const user = (request as any).user
      const result = await pmBudgetService.createLine(request.body as any, user.id)
      return reply.code(201).send({ line: result })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.patch('/lines/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({
    code: z.string().optional(), name: z.string().optional(), category: z.string().optional(),
    description: z.string().optional(), budgetAmount: z.number().optional(),
    sortOrder: z.number().optional(), status: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }))] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const result = await pmBudgetService.updateLine(id, request.body as any)
      return reply.send({ line: result })
    } catch (error: any) {
      fastify.log.error(error)
      const code = error.message?.includes('not found') ? 404 : 400
      return reply.code(code).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.delete('/lines/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await pmBudgetService.deleteLine(id)
      return reply.send({ success: true })
    } catch (error: any) {
      fastify.log.error(error)
      const code = error.message?.includes('not found') ? 404 : 400
      return reply.code(code).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.get('/entries', { preHandler: [authenticateUser, validateQuery(z.object({
    projectId: z.string().uuid().optional(), budgetLineId: z.string().uuid().optional(),
    type: z.string().optional(), page: z.coerce.number().default(1), limit: z.coerce.number().default(50),
  }))] }, async (request, reply) => {
    try {
      const result = await pmBudgetService.listEntries(request.query as any)
      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.post('/entries', { preHandler: [authenticateUser, validateBody(z.object({
    budgetLineId: z.string().uuid(), type: z.string().min(1), amount: z.number(),
    description: z.string().optional(), vendor: z.string().optional(),
    invoiceNumber: z.string().optional(), date: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }))] }, async (request, reply) => {
    try {
      const user = (request as any).user
      const result = await pmBudgetService.createEntry(request.body as any, user.id)
      return reply.code(201).send({ entry: result })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.patch('/entries/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({
    amount: z.number().optional(), description: z.string().optional(),
    vendor: z.string().optional(), invoiceNumber: z.string().optional(),
    date: z.string().optional(), metadata: z.record(z.any()).optional(),
  }))] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const result = await pmBudgetService.updateEntry(id, request.body as any)
      return reply.send({ entry: result })
    } catch (error: any) {
      fastify.log.error(error)
      const code = error.message?.includes('not found') ? 404 : 400
      return reply.code(code).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.get('/snapshots', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid() }))] }, async (request, reply) => {
    try {
      const { projectId } = request.query as any
      const result = await pmBudgetService.getSnapshots(projectId)
      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.post('/snapshots', { preHandler: [authenticateUser, validateBody(z.object({
    projectId: z.string().uuid(), label: z.string().optional(),
  }))] }, async (request, reply) => {
    try {
      const user = (request as any).user
      const { projectId, label } = request.body as any
      const result = await pmBudgetService.takeSnapshot(projectId, user.id, label)
      return reply.code(201).send({ snapshot: result })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.get('/alerts', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid() }))] }, async (request, reply) => {
    try {
      const { projectId } = request.query as any
      const result = await pmBudgetService.getAlerts(projectId)
      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.post('/alerts/:id/acknowledge', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    try {
      const user = (request as any).user
      const { id } = request.params as { id: string }
      const result = await pmBudgetService.acknowledgeAlert(id, user.id)
      return reply.send({ alert: result })
    } catch (error: any) {
      fastify.log.error(error)
      const code = error.message?.includes('not found') ? 404 : 400
      return reply.code(code).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.get('/variance', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid() }))] }, async (request, reply) => {
    try {
      const { projectId } = request.query as any
      const result = await pmBudgetService.getVarianceReport(projectId)
      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.get('/forecast', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid() }))] }, async (request, reply) => {
    try {
      const { projectId } = request.query as any
      const result = await pmBudgetService.getForecast(projectId)
      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })
}
