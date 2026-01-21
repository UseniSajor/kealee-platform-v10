import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { prismaAny } from '../../utils/prisma-helper'

/**
 * Server-Sent Events (SSE) route for real-time task updates
 * Provides real-time updates for PM productivity dashboard
 */
export async function pmRealtimeRoutes(fastify: FastifyInstance) {
  // GET /pm/realtime/tasks - SSE stream for task updates
  fastify.get(
    '/realtime/tasks',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }

        // Set SSE headers
        reply.raw.setHeader('Content-Type', 'text/event-stream')
        reply.raw.setHeader('Cache-Control', 'no-cache')
        reply.raw.setHeader('Connection', 'keep-alive')
        reply.raw.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering

        // Send initial connection message
        reply.raw.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)

        // Poll for task changes every 5 seconds
        const interval = setInterval(async () => {
          try {
            // Get updated tasks
            const tasks = await prismaAny.task.findMany({
              where: {
                assignedTo: user.id,
                status: { in: ['pending', 'in_progress'] },
                updatedAt: {
                  gte: new Date(Date.now() - 60000), // Updated in last minute
                },
              },
              take: 10,
              orderBy: { updatedAt: 'desc' },
            })

            if (tasks.length > 0) {
              reply.raw.write(
                `data: ${JSON.stringify({
                  type: 'tasks_updated',
                  tasks: tasks.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    status: t.status,
                    priority: t.priority,
                    dueDate: t.dueDate,
                    updatedAt: t.updatedAt,
                  })),
                  timestamp: new Date().toISOString(),
                })}\n\n`
              )
            }

            // Send heartbeat every 30 seconds
            reply.raw.write(
              `data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`
            )
          } catch (error: any) {
            fastify.log.error('SSE error:', error)
            reply.raw.write(
              `data: ${JSON.stringify({
                type: 'error',
                message: error.message,
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          }
        }, 5000) // Poll every 5 seconds

        // Clean up on client disconnect
        request.raw.on('close', () => {
          clearInterval(interval)
          reply.raw.end()
        })

        // Keep connection alive
        request.raw.on('aborted', () => {
          clearInterval(interval)
          reply.raw.end()
        })
      } catch (error: any) {
        fastify.log.error(error)
        if (!reply.sent) {
          return reply.code(500).send({
            error: error.message || 'Failed to establish real-time connection',
          })
        }
      }
    }
  )

  // GET /pm/realtime/productivity - SSE stream for productivity dashboard updates
  fastify.get(
    '/realtime/productivity',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }

        // Set SSE headers
        reply.raw.setHeader('Content-Type', 'text/event-stream')
        reply.raw.setHeader('Cache-Control', 'no-cache')
        reply.raw.setHeader('Connection', 'keep-alive')
        reply.raw.setHeader('X-Accel-Buffering', 'no')

        // Send initial connection
        reply.raw.write(
          `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`
        )

        // Poll for productivity metrics every 10 seconds
        const interval = setInterval(async () => {
          try {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Get today's completed tasks for active hours
            const tasksCompletedToday = await prismaAny.task.findMany({
              where: {
                assignedTo: user.id,
                status: 'completed',
                completedAt: {
                  gte: today,
                },
              },
            })

            const activeHoursToday = Math.round(
              (tasksCompletedToday.reduce((sum: number, task: any) => sum + (task.estimatedTime || 15), 0) / 60) * 10
            ) / 10

            // Get workload counts
            const [gcProjects, homeownerProjects, permitsPending, escrowReleases] = await Promise.all([
              prismaAny.serviceRequest?.count({
                where: {
                  organizationId: (await prismaAny.user.findUnique({ where: { id: user.id } }))?.organizationId,
                  status: { in: ['OPEN', 'IN_PROGRESS'] },
                },
              }).catch(() => 0),
              prismaAny.project?.count({
                where: {
                  organizationId: (await prismaAny.user.findUnique({ where: { id: user.id } }))?.organizationId,
                  status: { in: ['ACTIVE', 'IN_PROGRESS'] },
                },
              }).catch(() => 0),
              prismaAny.permitApplication?.count({
                where: {
                  organizationId: (await prismaAny.user.findUnique({ where: { id: user.id } }))?.organizationId,
                  status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED'] },
                },
              }).catch(() => 0),
              prismaAny.escrowRelease?.count({
                where: {
                  organizationId: (await prismaAny.user.findUnique({ where: { id: user.id } }))?.organizationId,
                  status: 'PENDING',
                },
              }).catch(() => 0),
            ])

            reply.raw.write(
              `data: ${JSON.stringify({
                type: 'productivity_update',
                data: {
                  activeHoursToday,
                  workload: {
                    gcProjects: gcProjects || 0,
                    homeownerProjects: homeownerProjects || 0,
                    permitsPending: permitsPending || 0,
                    escrowReleases: escrowReleases || 0,
                  },
                },
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          } catch (error: any) {
            fastify.log.error('SSE productivity error:', error)
          }
        }, 10000) // Poll every 10 seconds

        // Clean up on disconnect
        request.raw.on('close', () => {
          clearInterval(interval)
          reply.raw.end()
        })

        request.raw.on('aborted', () => {
          clearInterval(interval)
          reply.raw.end()
        })
      } catch (error: any) {
        fastify.log.error(error)
        if (!reply.sent) {
          return reply.code(500).send({
            error: error.message || 'Failed to establish real-time connection',
          })
        }
      }
    }
  )
}

