/**
 * PM Schedule Routes
 */
import { FastifyInstance } from 'fastify'
import { pmScheduleService } from './pm-schedule.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

export async function pmScheduleRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticateUser, validateQuery(z.object({
    projectId: z.string().uuid().optional(), status: z.string().optional(),
    assignedTo: z.string().uuid().optional(), trade: z.string().optional(),
    startDate: z.string().optional(), endDate: z.string().optional(),
    page: z.coerce.number().default(1), limit: z.coerce.number().default(50),
  }))] }, async (request, reply) => {
    try {
      const result = await pmScheduleService.list(request.query as any)
      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.get('/gantt', { preHandler: [authenticateUser, validateQuery(z.object({
    projectId: z.string().uuid(),
  }))] }, async (request, reply) => {
    try {
      const { projectId } = request.query as any
      const result = await pmScheduleService.getGanttData(projectId)
      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.get('/critical-path', { preHandler: [authenticateUser, validateQuery(z.object({
    projectId: z.string().uuid(),
  }))] }, async (request, reply) => {
    try {
      const { projectId } = request.query as any
      const result = await pmScheduleService.getCriticalPath(projectId)
      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.get('/milestones', { preHandler: [authenticateUser, validateQuery(z.object({
    projectId: z.string().uuid(),
  }))] }, async (request, reply) => {
    try {
      const { projectId } = request.query as any
      const result = await pmScheduleService.getMilestones(projectId)
      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.get('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const result = await pmScheduleService.getById(id)
      return reply.send({ item: result })
    } catch (error: any) {
      fastify.log.error(error)
      const code = (error instanceof Error && error.message?.includes('not found')) ? 404 : 400
      return reply.code(code).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.post('/', { preHandler: [authenticateUser, validateBody(z.object({
    projectId: z.string().uuid(), title: z.string().min(1), description: z.string().optional(),
    startDate: z.string(), endDate: z.string().optional(), duration: z.number().optional(),
    trade: z.string().optional(), assignedTo: z.string().uuid().optional(),
    dependencies: z.array(z.string().uuid()).optional(),
    milestone: z.boolean().optional(), criticalPath: z.boolean().optional(),
    progress: z.number().min(0).max(100).optional(), status: z.string().optional(),
    priority: z.string().optional(), color: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }))] }, async (request, reply) => {
    try {
      const user = (request as any).user
      const result = await pmScheduleService.create(request.body as any, user.id)
      return reply.code(201).send({ item: result })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.patch('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({
    title: z.string().optional(), description: z.string().optional(),
    startDate: z.string().optional(), endDate: z.string().optional(), duration: z.number().optional(),
    trade: z.string().optional(), assignedTo: z.string().uuid().optional(),
    dependencies: z.array(z.string().uuid()).optional(),
    milestone: z.boolean().optional(), criticalPath: z.boolean().optional(),
    progress: z.number().min(0).max(100).optional(), status: z.string().optional(),
    priority: z.string().optional(), color: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }))] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const result = await pmScheduleService.update(id, request.body as any)
      return reply.send({ item: result })
    } catch (error: any) {
      fastify.log.error(error)
      const code = (error instanceof Error && error.message?.includes('not found')) ? 404 : 400
      return reply.code(code).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.delete('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await pmScheduleService.delete(id)
      return reply.send({ success: true })
    } catch (error: any) {
      fastify.log.error(error)
      const code = (error instanceof Error && error.message?.includes('not found')) ? 404 : 400
      return reply.code(code).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.patch('/:id/progress', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({
    progress: z.number().min(0).max(100),
  }))] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { progress } = request.body as { progress: number }
      const result = await pmScheduleService.updateProgress(id, progress)
      return reply.send({ item: result })
    } catch (error: any) {
      fastify.log.error(error)
      const code = (error instanceof Error && error.message?.includes('not found')) ? 404 : 400
      return reply.code(code).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.post('/bulk-update', { preHandler: [authenticateUser, validateBody(z.object({
    items: z.array(z.object({
      id: z.string().uuid(),
      updates: z.record(z.any()),
    })),
  }))] }, async (request, reply) => {
    try {
      const { items } = request.body as any
      const result = await pmScheduleService.bulkUpdate(items)
      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })
}
