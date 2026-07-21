import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
// Temporarily disabled - missing @anthropic-ai/sdk dependency
// import { generateTasksFromSOW, saveTaskTemplate, getTaskTemplate, listTaskTemplates } from './ai-task-generator.service'
const generateTasksFromSOW = null as any;
const saveTaskTemplate = null as any;
const getTaskTemplate = null as any;
const listTaskTemplates = null as any;
import { z } from 'zod'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const projectTypeSchema = z.enum(['KITCHEN', 'BATHROOM', 'ADDITION', 'NEW_CONSTRUCTION', 'RENOVATION', 'CUSTOM'])
const phaseSchema = z.enum(['INITIATION', 'PLANNING', 'EXECUTION', 'MONITORING', 'CLOSEOUT'])

const generateTasksSchema = z.object({
  sowText: z.string().min(50, 'SOW text must be at least 50 characters'),
  projectType: projectTypeSchema,
  projectId: z.string().uuid(),
  phase: phaseSchema.optional(),
  includeDeliverables: z.boolean().optional().default(true),
})

export async function taskGeneratorRoutes(fastify: FastifyInstance) {
  // POST /tasks/generate - Generate tasks from SOW using AI
  fastify.post(
    '/generate',
    {
      preHandler: [authenticateUser, validateBody(generateTasksSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof generateTasksSchema>

        const result = await generateTasksFromSOW({
          sowText: body.sowText,
          projectType: body.projectType,
          projectId: body.projectId,
          phase: body.phase,
          includeDeliverables: body.includeDeliverables,
        })

        return reply.code(201).send({ result })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to generate tasks'),
        })
      }
    }
  )

  // POST /tasks/templates - Save a task template
  fastify.post(
    '/templates',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const template = request.body as any
        const saved = await saveTaskTemplate(template)
        return reply.code(201).send({ template: saved })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to save template'),
        })
      }
    }
  )

  // GET /tasks/templates/:id - Get a task template
  fastify.get(
    '/templates/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const template = await getTaskTemplate(id)

        if (!template) {
          return reply.code(404).send({ error: 'Template not found' })
        }

        return reply.send({ template })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to get template'),
        })
      }
    }
  )

  // GET /tasks/templates - List task templates
  fastify.get(
    '/templates',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({ projectType: projectTypeSchema.optional() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectType } = request.query as { projectType?: string }
        const templates = await listTaskTemplates(projectType)
        return reply.send({ templates })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to list templates'),
        })
      }
    }
  )
}




