/**
 * PM Inspections Routes
 */
import { FastifyInstance } from 'fastify'
import { pmInspectionsService } from './pm-inspections.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmInspectionsRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticateUser, validateQuery(z.object({
    projectId: z.string().uuid().optional(), type: z.string().optional(), status: z.string().optional(),
    result: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional(),
    page: z.coerce.number().default(1), limit: z.coerce.number().default(50),
  }))] }, async (request, reply) => {
    try {
      const result = await pmInspectionsService.list(request.query as any)
      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.get('/stats', { preHandler: [authenticateUser, validateQuery(z.object({
    projectId: z.string().uuid(),
  }))] }, async (request, reply) => {
    try {
      const { projectId } = request.query as any
      const result = await pmInspectionsService.getStats(projectId)
      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.get('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const result = await pmInspectionsService.getById(id)
      return reply.send({ inspection: result })
    } catch (error: any) {
      fastify.log.error(error)
      const code = error.message?.includes('not found') ? 404 : 400
      return reply.code(code).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.post('/', { preHandler: [authenticateUser, validateBody(z.object({
    projectId: z.string().uuid(), type: z.string().min(1), title: z.string().min(1),
    description: z.string().optional(), scheduledDate: z.string(), scheduledTime: z.string().optional(),
    inspectorId: z.string().uuid().optional(), inspectorName: z.string().optional(),
    location: z.string().optional(),
    checklistItems: z.array(z.object({ label: z.string(), required: z.boolean() })).optional(),
    preparationItems: z.array(z.object({ description: z.string(), assignedTo: z.string().optional(), dueDate: z.string().optional() })).optional(),
    metadata: z.record(z.any()).optional(),
  }))] }, async (request, reply) => {
    try {
      const user = (request as any).user
      const result = await pmInspectionsService.schedule(request.body as any, user.id)
      return reply.code(201).send({ inspection: result })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(400).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.patch('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({
    type: z.string().optional(), title: z.string().optional(), description: z.string().optional(),
    scheduledDate: z.string().optional(), scheduledTime: z.string().optional(),
    inspectorId: z.string().uuid().optional(), inspectorName: z.string().optional(), location: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }))] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const result = await pmInspectionsService.update(id, request.body as any)
      return reply.send({ inspection: result })
    } catch (error: any) {
      fastify.log.error(error)
      const code = error.message?.includes('not found') ? 404 : 400
      return reply.code(code).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.post('/:id/conduct', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({
    result: z.string().min(1), notes: z.string().optional(), conductedAt: z.string().optional(),
    conductedBy: z.string().optional(),
    checklistResults: z.array(z.object({ label: z.string(), passed: z.boolean(), notes: z.string().optional() })).optional(),
    metadata: z.record(z.any()).optional(),
  }))] }, async (request, reply) => {
    try {
      const user = (request as any).user
      const { id } = request.params as { id: string }
      const result = await pmInspectionsService.conduct(id, request.body as any, user.id)
      return reply.send({ inspection: result })
    } catch (error: any) {
      fastify.log.error(error)
      const code = error.message?.includes('not found') ? 404 : 400
      return reply.code(code).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.post('/:id/findings', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({
    type: z.string().min(1), severity: z.string().min(1), title: z.string().min(1),
    description: z.string().optional(), location: z.string().optional(),
    photoUrls: z.array(z.string()).optional(), correctionRequired: z.boolean().optional(),
    correctionDeadline: z.string().optional(), assignedTo: z.string().uuid().optional(),
    metadata: z.record(z.any()).optional(),
  }))] }, async (request, reply) => {
    try {
      const user = (request as any).user
      const { id } = request.params as { id: string }
      const result = await pmInspectionsService.addFinding(id, request.body as any, user.id)
      return reply.code(201).send({ finding: result })
    } catch (error: any) {
      fastify.log.error(error)
      const code = error.message?.includes('not found') ? 404 : 400
      return reply.code(code).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.patch('/:id/findings/:findingId', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid(), findingId: z.string().uuid() })), validateBody(z.object({
    type: z.string().optional(), severity: z.string().optional(), title: z.string().optional(),
    description: z.string().optional(), location: z.string().optional(),
    photoUrls: z.array(z.string()).optional(), correctionRequired: z.boolean().optional(),
    assignedTo: z.string().uuid().optional(),
  }))] }, async (request, reply) => {
    try {
      const { id, findingId } = request.params as { id: string; findingId: string }
      const result = await pmInspectionsService.updateFinding(id, findingId, request.body as any)
      return reply.send({ finding: result })
    } catch (error: any) {
      fastify.log.error(error)
      const code = error.message?.includes('not found') ? 404 : 400
      return reply.code(code).send({ error: sanitizeErrorMessage(error)})
    }
  })

  fastify.post('/:id/findings/:findingId/resolve', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid(), findingId: z.string().uuid() })), validateBody(z.object({
    notes: z.string().optional(), resolvedBy: z.string().uuid().optional(),
  }))] }, async (request, reply) => {
    try {
      const user = (request as any).user
      const { id, findingId } = request.params as { id: string; findingId: string }
      const result = await pmInspectionsService.resolveFinding(id, findingId, request.body as any, user.id)
      return reply.send({ finding: result })
    } catch (error: any) {
      fastify.log.error(error)
      const code = error.message?.includes('not found') ? 404 : error.message?.includes('already') ? 409 : 400
      return reply.code(code).send({ error: sanitizeErrorMessage(error)})
    }
  })
}
