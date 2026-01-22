import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { pmFocusModeService } from './pm-focus-mode.service'
import { z } from 'zod'
import { validateBody, validateParams } from '../../middleware/validation.middleware'

export async function pmFocusModeRoutes(fastify: FastifyInstance) {
  // POST /pm/focus-mode/enable - Enable focus mode
  fastify.post(
    '/enable',
    {
      preHandler: [
        authenticateUser,
        validateBody(
          z.object({
            taskId: z.string().uuid(),
            duration: z.number().min(5).max(60).default(25),
            integrations: z.array(z.string()).default(['slack', 'teams', 'email']),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { taskId, duration, integrations } = request.body as {
          taskId: string
          duration: number
          integrations: string[]
        }

        const session = await pmFocusModeService.enableFocusMode(user.id, taskId, duration, integrations)

        return reply.send({ session })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to enable focus mode',
        })
      }
    }
  )

  // POST /pm/focus-mode/disable - Disable focus mode
  fastify.post(
    '/disable',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }

        await pmFocusModeService.disableFocusMode(user.id)

        return reply.send({ success: true })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to disable focus mode',
        })
      }
    }
  )

  // GET /pm/focus-mode/status - Get active focus session
  fastify.get(
    '/status',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }

        const session = await pmFocusModeService.getActiveFocusSession(user.id)

        return reply.send({ session })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to get focus mode status',
        })
      }
    }
  )
}




