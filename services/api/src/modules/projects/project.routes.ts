import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validation.middleware'
import { z } from 'zod'
import { addProjectMemberSchema, createProjectSchema, updateProjectSchema } from '../../schemas'
import { projectService } from './project.service'
import { NotFoundError, ValidationError } from '../../errors/app.error'

export async function projectRoutes(fastify: FastifyInstance) {
  // POST /projects - create draft project (wizard step 1)
  fastify.post(
    '/',
    {
      preHandler: [authenticateUser, validateBody(createProjectSchema)],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const body = request.body as any

      const project = await projectService.createProject(
        {
          ownerId: user.id,
          orgId: body.orgId,
          name: body.name,
          description: body.description,
          category: body.category,
          categoryMetadata: body.categoryMetadata,
          adminOverride: body.adminOverride,
          adminReason: body.adminReason,
        },
        user.id
      )

      return reply.code(201).send({ project })
    }
  )

  // GET /projects - list my projects
  fastify.get(
    '/',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const projects = await projectService.listMyProjects(user.id)
      return reply.send({ projects })
    }
  )

  // GET /projects/:id - get project (owner or member)
  fastify.get(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const project = await projectService.getProject(id, user.id)
      return reply.send({ project })
    }
  )

  // PATCH /projects/:id - progressive save across wizard steps
  fastify.patch(
    '/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateProjectSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const body = request.body as any

      const project = await projectService.updateProject(id, user.id, body)
      return reply.send({ project })
    }
  )

  // POST /projects/:id/members - add/update project member
  fastify.post(
    '/:id/members',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(addProjectMemberSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const body = request.body as { userId: string; role: 'OWNER' | 'CONTRACTOR' | 'PROJECT_MANAGER' | 'MEMBER' | 'VIEWER' }

      const member = await projectService.addMember(id, user.id, body.userId, body.role as any)
      return reply.code(201).send({ member })
    }
  )

  // POST /projects/from-lead/:leadId - Create project from WON lead (primary method)
  fastify.post(
    '/from-lead/:leadId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ leadId: z.string().uuid() })),
        validateBody(
          z.object({
            orgId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { leadId } = request.params as { leadId: string }
        const { orgId } = request.body as { orgId?: string }

        const project = await projectService.createProjectFromLead(leadId, user.id, orgId, user.id)

        return reply.code(201).send({ project })
      } catch (error: any) {
        fastify.log.error(error)
        if (error instanceof NotFoundError || error instanceof ValidationError) {
          return reply.code(400).send({
            error: error.message || 'Failed to create project from lead',
          })
        }
        return reply.code(500).send({
          error: 'Internal server error',
        })
      }
    }
  )
}

