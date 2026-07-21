import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody, validateQuery } from '../../middleware/validation.middleware'
import { designProjectService } from './design-project.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const createDesignProjectSchema = z.object({
  projectId: z.string().uuid().optional(), // Optional - can create standalone
  name: z.string().min(1),
  description: z.string().optional(),
  projectType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INSTITUTIONAL', 'MIXED_USE']),
  clientId: z.string().uuid().optional(),
  scope: z.string().optional(),
  budget: z.number().positive().optional(),
})

const updateDesignProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  projectType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INSTITUTIONAL', 'MIXED_USE']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  clientAccessEnabled: z.boolean().optional(),
})

const addTeamMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['PRINCIPAL', 'PROJECT_ARCHITECT', 'DESIGNER', 'DRAFTER']),
})

const listDesignProjectsQuerySchema = z.object({
  projectType: z.string().optional(),
  status: z.string().optional(),
})

export async function designProjectRoutes(fastify: FastifyInstance) {
  // POST /architect/design-projects - Create design project
  fastify.post(
    '/design-projects',
    {
      preHandler: [
        authenticateUser,
        validateBody(createDesignProjectSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof createDesignProjectSchema>

        const designProject = await designProjectService.createDesignProject({
          ...body,
          userId: user.id,
        })

        return reply.code(201).send({ designProject })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create design project'),
        })
      }
    }
  )

  // GET /architect/design-projects - List design projects
  fastify.get(
    '/design-projects',
    {
      preHandler: [
        authenticateUser,
        validateQuery(listDesignProjectsQuerySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const query = request.query as z.infer<typeof listDesignProjectsQuerySchema>

        const designProjects = await designProjectService.listDesignProjects(user.id, query)
        return reply.send({ designProjects })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to list design projects'),
        })
      }
    }
  )

  // GET /architect/design-projects/available-projects - Get available Project Owner projects
  fastify.get(
    '/design-projects/available-projects',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const projects = await designProjectService.getAvailableProjects(user.id)
        return reply.send({ projects })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to get available projects'),
        })
      }
    }
  )

  // GET /architect/design-projects/:id - Get design project
  fastify.get(
    '/design-projects/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const designProject = await designProjectService.getDesignProject(id)
        return reply.send({ designProject })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: sanitizeErrorMessage(error, 'Design project not found'),
        })
      }
    }
  )

  // PATCH /architect/design-projects/:id - Update design project
  fastify.patch(
    '/design-projects/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateDesignProjectSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateDesignProjectSchema>

        const designProject = await designProjectService.updateDesignProject(id, {
          ...body,
          userId: user.id,
        })

        return reply.send({ designProject })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to update design project'),
        })
      }
    }
  )

  // POST /architect/design-projects/:id/team-members - Add team member
  fastify.post(
    '/design-projects/:id/team-members',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(addTeamMemberSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof addTeamMemberSchema>

        const teamMember = await designProjectService.addTeamMember({
          designProjectId: id,
          ...body,
          addedByUserId: user.id,
        })

        return reply.code(201).send({ teamMember })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to add team member'),
        })
      }
    }
  )
}
