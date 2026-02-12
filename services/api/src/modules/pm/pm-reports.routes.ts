/**
 * PM Reports Routes
 */
import { FastifyInstance } from 'fastify'
import { reportService } from './pm-reports.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmReportRoutes(fastify: FastifyInstance) {
  // GET /project/:projectId - Full project report
  fastify.get(
    '/project/:projectId',
    {
      preHandler: [authenticateUser, validateParams(z.object({ projectId: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const report = await reportService.getProjectReport(projectId)
        return reply.send(report)
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message?.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // GET /schedule/:projectId - Schedule report
  fastify.get(
    '/schedule/:projectId',
    {
      preHandler: [authenticateUser, validateParams(z.object({ projectId: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const report = await reportService.getScheduleReport(projectId)
        return reply.send(report)
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message?.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // GET /budget/:projectId - Budget report
  fastify.get(
    '/budget/:projectId',
    {
      preHandler: [authenticateUser, validateParams(z.object({ projectId: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const report = await reportService.getBudgetReport(projectId)
        return reply.send(report)
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message?.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // GET /safety/:projectId - Safety report
  fastify.get(
    '/safety/:projectId',
    {
      preHandler: [authenticateUser, validateParams(z.object({ projectId: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const report = await reportService.getSafetyReport(projectId)
        return reply.send(report)
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message?.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // POST /generate - Generate report by type
  fastify.post(
    '/generate',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          projectId: z.string().uuid(),
          type: z.enum(['project', 'schedule', 'budget', 'safety']),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId, type } = request.body as { projectId: string; type: string }
        const report = await reportService.generate(projectId, type)
        return reply.send(report)
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message?.includes('not found') ? 404 : error.message?.includes('Unknown report') ? 400 : 400
        return reply.code(code).send({ error: error.message })
      }
    }
  )
}
