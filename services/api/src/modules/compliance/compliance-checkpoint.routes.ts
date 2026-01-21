import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { complianceCheckpointService } from './compliance-checkpoint.service'
import { prismaAny } from '../../utils/prisma-helper'
import { z } from 'zod'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'

export async function complianceCheckpointRoutes(fastify: FastifyInstance) {
  // POST /compliance/checkpoint/:checkpointId/run - Run compliance checks for a checkpoint
  fastify.post(
    '/checkpoint/:checkpointId/run',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ checkpointId: z.string() })),
        validateBody(
          z.object({
            projectId: z.string().uuid(),
            taskId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { checkpointId } = request.params as { checkpointId: string }
        const { projectId, taskId } = request.body as { projectId: string; taskId?: string }

        // Get checkpoint (would fetch from DB)
        const checkpoint = complianceCheckpointService.getCheckpointForTask(
          taskId || 'default',
          'POST_TASK'
        )

        const result = await complianceCheckpointService.runComplianceChecks(
          checkpoint,
          projectId,
          taskId
        )

        return reply.send({ result })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to run compliance checks',
        })
      }
    }
  )

  // GET /compliance/task/:taskId/check - Check if task can be completed
  fastify.get(
    '/task/:taskId/check',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ taskId: z.string().uuid() })),
        validateQuery(z.object({ type: z.enum(['PRE_TASK', 'POST_TASK']).optional() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { taskId } = request.params as { taskId: string }
        const { type = 'POST_TASK' } = request.query as { type?: 'PRE_TASK' | 'POST_TASK' }

        // Get task to find project
        const task = await prismaAny.task.findUnique({
          where: { id: taskId },
          include: { project: true },
        })

        if (!task || !task.project) {
          return reply.code(404).send({ error: 'Task or project not found' })
        }

        const checkpoint = complianceCheckpointService.getCheckpointForTask(taskId, type)
        const result = await complianceCheckpointService.runComplianceChecks(
          checkpoint,
          task.project.id,
          taskId
        )

        return reply.send({ canComplete: result.allPassed, checks: result })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to check compliance',
        })
      }
    }
  )
}


