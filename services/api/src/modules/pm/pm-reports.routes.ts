/**
 * PM Reports Routes
 */
import { FastifyInstance } from 'fastify'
import { reportService } from './pm-reports.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'
import { prismaAny } from '../../utils/prisma-helper'

export async function pmReportRoutes(fastify: FastifyInstance) {
  // GET / - List generated reports for the current PM
  fastify.get(
    '/',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const query = request.query as { type?: string }

        // Look up generated documents that are reports
        const where: any = { createdById: user.id, category: 'report' }
        if (query.type) where.type = query.type

        let reports: any[] = []
        try {
          reports = await prismaAny.generatedDocument.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        } catch {
          // GeneratedDocument model may not exist yet — return empty
        }

        return reply.send({ reports })
      } catch (error: any) {
        fastify.log.warn('Reports list error:', error.message)
        return reply.send({ reports: [] })
      }
    }
  )

  // GET /:id/download - Download a generated report
  fastify.get(
    '/:id/download',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }

        let doc: any = null
        try {
          doc = await prismaAny.generatedDocument.findUnique({ where: { id } })
        } catch {
          return reply.code(404).send({ error: 'Report not found' })
        }

        if (!doc) {
          return reply.code(404).send({ error: 'Report not found' })
        }

        // If the report has a stored URL, redirect to it
        if (doc.url || doc.fileUrl) {
          return reply.redirect(doc.url || doc.fileUrl)
        }

        // If the report has content stored as base64, return as PDF
        if (doc.content) {
          reply.header('Content-Type', 'application/pdf')
          reply.header('Content-Disposition', `attachment; filename="report-${id}.pdf"`)
          return reply.send(Buffer.from(doc.content, 'base64'))
        }

        return reply.code(404).send({ error: 'Report file not available' })
      } catch (error: any) {
        fastify.log.error('Report download error:', error)
        return reply.code(500).send({ error: 'Failed to download report' })
      }
    }
  )

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
        return reply.code(code).send({ error: sanitizeErrorMessage(error)})
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
        return reply.code(code).send({ error: sanitizeErrorMessage(error)})
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
        return reply.code(code).send({ error: sanitizeErrorMessage(error)})
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
        return reply.code(code).send({ error: sanitizeErrorMessage(error)})
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
        return reply.code(code).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )
}
