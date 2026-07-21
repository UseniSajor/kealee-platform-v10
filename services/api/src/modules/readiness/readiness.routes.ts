import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import {
  attachEvidenceSchema,
  listReadinessTemplatesQuerySchema,
  readinessTemplateCreateSchema,
  readinessTemplateItemCreateSchema,
  updateReadinessItemSchema,
} from '../../schemas'
import { readinessService } from './readiness.service'

export async function readinessRoutes(fastify: FastifyInstance) {
  // Templates (configured via os-admin)
  fastify.get(
    '/templates',
    { preHandler: [authenticateUser, validateQuery(listReadinessTemplatesQuerySchema)] },
    async (request, reply) => {
      const { orgId, category, activeOnly } = request.query as any
      const templates = await readinessService.listTemplates({
        orgId,
        category,
        activeOnly,
      })
      return reply.send({ templates })
    }
  )

  fastify.post(
    '/templates',
    { preHandler: [authenticateUser, validateBody(readinessTemplateCreateSchema)] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const body = request.body as any
      const template = await readinessService.createTemplate(body, user.id)
      return reply.code(201).send({ template })
    }
  )

  fastify.post(
    '/templates/:id/items',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(readinessTemplateItemCreateSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const body = request.body as any
      const item = await readinessService.addTemplateItem(id, body, user.id)
      return reply.code(201).send({ item })
    }
  )

  // Project readiness generation & list
  fastify.post(
    '/projects/:projectId/generate',
    { preHandler: [authenticateUser, validateParams(z.object({ projectId: z.string().uuid() }))] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const items = await readinessService.generateProjectReadiness(projectId, user.id)
      return reply.code(201).send({ items })
    }
  )

  fastify.get(
    '/projects/:projectId/items',
    { preHandler: [authenticateUser, validateParams(z.object({ projectId: z.string().uuid() }))] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const items = await readinessService.listProjectReadiness(projectId, user.id)
      return reply.send({ items })
    }
  )

  // Update readiness item (status/response)
  fastify.patch(
    '/items/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateReadinessItemSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const body = request.body as any
      const item = await readinessService.updateReadinessItem(id, user.id, body)
      return reply.send({ item })
    }
  )

  // Evidence attach (file upload support via URL pointer)
  fastify.post(
    '/items/:id/evidence',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(attachEvidenceSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const body = request.body as any
      const evidence = await readinessService.attachEvidenceToReadinessItem(id, user.id, body)
      return reply.code(201).send({ evidence })
    }
  )

  // Prompt 1.5: Readiness completion tracking and bulk operations
  fastify.get(
    '/projects/:projectId/completion',
    { preHandler: [authenticateUser, validateParams(z.object({ projectId: z.string().uuid() }))] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const completion = await readinessService.getReadinessCompletion(projectId, user.id)
      return reply.send({ completion })
    }
  )

  fastify.post(
    '/projects/:projectId/bulk-complete',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(
          z.object({
            itemIds: z.array(z.string().uuid()).min(1),
            reason: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const { itemIds, reason } = request.body as { itemIds: string[]; reason?: string }
      const items = await readinessService.bulkCompleteItems(projectId, user.id, itemIds, reason)
      return reply.send({ items })
    }
  )

  // GET /readiness/projects/:projectId/gates - Get readiness gates status
  fastify.get(
    '/projects/:projectId/gates',
    {
      preHandler: [authenticateUser, validateParams(z.object({ projectId: z.string().uuid() }))],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const gates = await readinessService.getReadinessGates(projectId, user.id)
      return reply.send(gates)
    }
  )
}

