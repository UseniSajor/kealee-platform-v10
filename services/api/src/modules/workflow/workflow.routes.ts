import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { workflowService } from './workflow.service'
import { z } from 'zod'
import { validateParams, validateQuery } from '../../middleware/validation.middleware'

const workflowPhaseSchema = z.enum(['INITIATION', 'PLANNING', 'EXECUTION', 'MONITORING', 'CLOSEOUT'])

export async function workflowRoutes(fastify: FastifyInstance) {
  // GET /workflow/status/:projectId - Get workflow status for a project
  fastify.get(
    '/status/:projectId',
    {
      preHandler: [authenticateUser, validateParams(z.object({ projectId: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const { phase } = request.query as { phase?: string }

        if (!phase || !workflowPhaseSchema.safeParse(phase).success) {
          return reply.code(400).send({
            error: 'Valid phase parameter required (INITIATION, PLANNING, EXECUTION, MONITORING, CLOSEOUT)',
          })
        }

        const status = await workflowService.getWorkflowStatus(projectId, phase as any)
        return reply.send({ status })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to get workflow status',
        })
      }
    }
  )

  // GET /workflow/gate/:phase/:projectId - Check if a gate can be passed
  fastify.get(
    '/gate/:phase/:projectId',
    {
      preHandler: [
        authenticateUser,
        validateParams(
          z.object({
            phase: workflowPhaseSchema,
            projectId: z.string().uuid(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { phase, projectId } = request.params as { phase: string; projectId: string }
        const result = await workflowService.checkGate(phase as any, projectId)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to check gate',
        })
      }
    }
  )

  // GET /workflow/can-advance/:projectId - Check if project can advance to a phase
  fastify.get(
    '/can-advance/:projectId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateQuery(z.object({ phase: workflowPhaseSchema })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const { phase } = request.query as { phase: string }
        const result = await workflowService.canAdvanceToPhase(projectId, phase as any)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to check phase advancement',
        })
      }
    }
  )

  // GET /workflow/phases - Get all phase configurations
  fastify.get(
    '/phases',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const phases = workflowService.getPhaseConfigs()
        return reply.send({ phases })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to get phase configurations',
        })
      }
    }
  )
}




