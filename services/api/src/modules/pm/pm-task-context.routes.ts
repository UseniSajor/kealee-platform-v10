import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { pmTaskContextService } from './pm-task-context.service'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmTaskContextRoutes(fastify: FastifyInstance) {
  // GET /pm/tasks/:taskId/context - Get task context
  fastify.get(
    '/tasks/:taskId/context',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ taskId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { taskId } = request.params as { taskId: string }

        const context = await pmTaskContextService.getTaskContext(taskId, user.id)

        if (!context) {
          return reply.code(404).send({ error: 'Task not found' })
        }

        return reply.send({ context })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to get task context',
        })
      }
    }
  )

  // POST /pm/tasks/:taskId/requirements/:requirementId/complete - Complete a requirement
  fastify.post(
    '/tasks/:taskId/requirements/:requirementId/complete',
    {
      preHandler: [
        authenticateUser,
        validateParams(
          z.object({
            taskId: z.string().uuid(),
            requirementId: z.string(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { taskId, requirementId } = request.params as {
          taskId: string
          requirementId: string
        }

        // Mark requirement as complete (would update in database)
        // For now, just return success

        return reply.send({ success: true, requirementId })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to complete requirement',
        })
      }
    }
  )

  // POST /pm/tasks/:taskId/notes - Add note to task
  fastify.post(
    '/tasks/:taskId/notes',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ taskId: z.string().uuid() })),
        validateBody(z.object({ note: z.string().min(1) })),
      ],
    },
    async (request, reply) => {
      try {
        const { taskId } = request.params as { taskId: string }
        const { note } = request.body as { note: string }

        // Add note to task (would save to database)
        // For now, just return success

        return reply.send({ success: true, note })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to add note',
        })
      }
    }
  )

  // POST /pm/tasks/:taskId/help-request - Request help
  fastify.post(
    '/tasks/:taskId/help-request',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ taskId: z.string().uuid() })),
        validateBody(z.object({ message: z.string().min(1) })),
      ],
    },
    async (request, reply) => {
      try {
        const { taskId } = request.params as { taskId: string }
        const { message } = request.body as { message: string }

        // Create help request (would save to database and notify supervisor)
        // For now, just return success

        return reply.send({ success: true, message })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to request help',
        })
      }
    }
  )

  // POST /pm/tasks/:taskId/skip - Skip task
  fastify.post(
    '/tasks/:taskId/skip',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ taskId: z.string().uuid() })),
        validateBody(z.object({ reason: z.string().min(1) })),
      ],
    },
    async (request, reply) => {
      try {
        const { taskId } = request.params as { taskId: string }
        const { reason } = request.body as { reason: string }

        // Mark task as skipped (would update in database)
        // For now, just return success

        return reply.send({ success: true, reason })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to skip task',
        })
      }
    }
  )

  // POST /pm/focus-sessions - Log focus session
  fastify.post(
    '/focus-sessions',
    {
      preHandler: [
        authenticateUser,
        validateBody(
          z.object({
            taskId: z.string().uuid(),
            startTime: z.string(),
            estimatedEffort: z.number(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { taskId, startTime, estimatedEffort } = request.body as {
          taskId: string
          startTime: string
          estimatedEffort: number
        }

        // Log focus session (would save to database)
        const session = await prismaAny.focusSession?.create({
          data: {
            pmId: user.id,
            taskId,
            startTime: new Date(startTime),
            duration: estimatedEffort,
            status: 'ACTIVE',
            integrations: [],
          },
        }).catch(() => null)

        return reply.send({ success: true, session })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to log focus session',
        })
      }
    }
  )
}

import { prismaAny } from '../../utils/prisma-helper'


