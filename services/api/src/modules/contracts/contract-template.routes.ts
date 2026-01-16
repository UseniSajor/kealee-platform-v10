import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import {
  contractTemplateCreateSchema,
  contractTemplateUpdateSchema,
  contractTemplatePreviewSchema,
  listContractTemplatesQuerySchema,
} from '../../schemas/contract.schemas'
import { contractTemplateService } from './contract-template.service'

export async function contractTemplateRoutes(fastify: FastifyInstance) {
  // List templates (admin or public for global templates)
  fastify.get(
    '/templates',
    { preHandler: [authenticateUser, validateQuery(listContractTemplatesQuerySchema)] },
    async (request, reply) => {
      const { orgId, activeOnly, name } = request.query as any
      const templates = await contractTemplateService.listTemplates({
        orgId,
        activeOnly,
        name,
      })
      return reply.send({ templates })
    }
  )

  // Get single template
  fastify.get(
    '/templates/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const template = await contractTemplateService.getTemplate(id)
      return reply.send({ template })
    }
  )

  // Create template (admin only)
  fastify.post(
    '/templates',
    { preHandler: [authenticateUser, validateBody(contractTemplateCreateSchema)] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const body = request.body as any
      const template = await contractTemplateService.createTemplate(body, user.id)
      return reply.code(201).send({ template })
    }
  )

  // Update template (admin only, creates new version if body/variables change)
  fastify.patch(
    '/templates/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(contractTemplateUpdateSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const body = request.body as any
      const template = await contractTemplateService.updateTemplate(id, body, user.id)
      return reply.send({ template })
    }
  )

  // Delete template (admin only, soft delete if in use)
  fastify.delete(
    '/templates/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const template = await contractTemplateService.deleteTemplate(id, user.id)
      return reply.send({ template })
    }
  )

  // Preview template with variable substitution (Prompt 2.1)
  fastify.post(
    '/templates/:id/preview',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(contractTemplatePreviewSchema.partial().extend({ templateId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as { projectId?: string; variables?: Record<string, string> }
      const preview = await contractTemplateService.previewTemplate(id, body.projectId, body.variables)
      return reply.send({ preview })
    }
  )
}
