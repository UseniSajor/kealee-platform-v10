import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { sopService } from './sop.service'
import { z } from 'zod'
import { validateParams, validateQuery, validateBody } from '../../middleware/validation.middleware'

export async function sopRoutes(fastify: FastifyInstance) {
  // ════════════════════════════════════════════════════════════════
  // TEMPLATES
  // ════════════════════════════════════════════════════════════════

  // POST /sop/templates - Create SOP template
  fastify.post(
    '/templates',
    {
      preHandler: [
        authenticateUser,
        validateBody(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            projectType: z.string(),
            phases: z.array(
              z.object({
                name: z.string(),
                description: z.string().optional(),
                order: z.number(),
                entryCondition: z.string().optional(),
                exitCondition: z.string().optional(),
                steps: z.array(
                  z.object({
                    name: z.string(),
                    description: z.string().optional(),
                    order: z.number(),
                    mandatory: z.boolean().optional(),
                    estimatedMinutes: z.number().optional(),
                    requiredIntegration: z.string().optional(),
                    validations: z.any().optional(),
                    dependencies: z.array(z.string()).optional(),
                    metadata: z.any().optional(),
                  })
                ),
              })
            ),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const template = await sopService.createTemplate({
          ...(request.body as any),
          createdBy: user.id,
        })
        return reply.code(201).send({ template })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message })
      }
    }
  )

  // GET /sop/templates?projectType=&active=&status=
  fastify.get(
    '/templates',
    {
      preHandler: [
        authenticateUser,
        validateQuery(
          z.object({
            projectType: z.string().optional(),
            active: z.string().optional(),
            status: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { projectType, active, status } = request.query as any
        const templates = await sopService.listTemplates({
          projectType,
          active: active !== undefined ? active === 'true' : undefined,
          status,
        })
        return reply.send({ templates, total: templates.length })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message })
      }
    }
  )

  // GET /sop/templates/:id
  fastify.get(
    '/templates/:id',
    { preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const template = await sopService.getTemplate(id)
        return reply.send({ template })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.statusCode || 500
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // PATCH /sop/templates/:id
  fastify.patch(
    '/templates/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
        validateBody(
          z.object({
            name: z.string().optional(),
            description: z.string().optional(),
            status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
            active: z.boolean().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const template = await sopService.updateTemplate(id, request.body as any)
        return reply.send({ template })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.statusCode || 500
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // DELETE /sop/templates/:id
  fastify.delete(
    '/templates/:id',
    { preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        await sopService.deleteTemplate(id)
        return reply.code(204).send()
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.statusCode || 500
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // POST /sop/templates/seed - Seed default templates
  fastify.post(
    '/templates/seed',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const template = await sopService.seedNewConstructionTemplate()
        return reply.send({ template, message: 'NEW_CONSTRUCTION multifamily SOP template seeded' })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message })
      }
    }
  )

  // ════════════════════════════════════════════════════════════════
  // EXECUTIONS
  // ════════════════════════════════════════════════════════════════

  // POST /sop/executions - Start SOP execution
  fastify.post(
    '/executions',
    {
      preHandler: [
        authenticateUser,
        validateBody(
          z.object({
            templateId: z.string(),
            projectId: z.string(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { templateId, projectId } = request.body as { templateId: string; projectId: string }
        const execution = await sopService.startExecution(templateId, projectId)
        return reply.code(201).send({ execution })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.statusCode || 500
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // GET /sop/executions?projectId=
  fastify.get(
    '/executions',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({ projectId: z.string() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.query as { projectId: string }
        const executions = await sopService.listExecutions(projectId)
        return reply.send({ executions, total: executions.length })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message })
      }
    }
  )

  // GET /sop/executions/:id
  fastify.get(
    '/executions/:id',
    { preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const execution = await sopService.getExecution(id)
        return reply.send({ execution })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.statusCode || 500
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // POST /sop/executions/:id/steps/:stepId/complete
  fastify.post(
    '/executions/:id/steps/:stepId/complete',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string(), stepId: z.string() })),
        validateBody(
          z.object({
            notes: z.string().optional(),
            evidence: z.any().optional(),
          }).optional()
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { id, stepId } = request.params as { id: string; stepId: string }
        const user = (request as any).user
        const execution = await sopService.completeStep(id, stepId, user.id, request.body as any)
        return reply.send({ execution })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.statusCode || 500
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // POST /sop/executions/:id/steps/:stepId/skip
  fastify.post(
    '/executions/:id/steps/:stepId/skip',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string(), stepId: z.string() })),
        validateBody(z.object({ reason: z.string() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id, stepId } = request.params as { id: string; stepId: string }
        const user = (request as any).user
        const { reason } = request.body as { reason: string }
        const execution = await sopService.skipStep(id, stepId, user.id, reason)
        return reply.send({ execution })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.statusCode || 500
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // POST /sop/executions/:id/pause
  fastify.post(
    '/executions/:id/pause',
    { preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const execution = await sopService.pauseExecution(id)
        return reply.send({ execution })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.statusCode || 500
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // POST /sop/executions/:id/resume
  fastify.post(
    '/executions/:id/resume',
    { preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const execution = await sopService.resumeExecution(id)
        return reply.send({ execution })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.statusCode || 500
        return reply.code(code).send({ error: error.message })
      }
    }
  )
}
