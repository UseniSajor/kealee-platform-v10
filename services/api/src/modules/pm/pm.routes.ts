import { FastifyInstance } from "fastify"
import { authenticateUser } from "../auth/auth.middleware"
import { pmService } from "./pm.service"
import { pmProductivityRoutes } from "./pm-productivity.routes"
import { pmRealtimeRoutes } from "./pm-realtime.routes"
import { pmComplianceCheckService } from "./pm-compliance-check.service"
import { prisma } from "@kealee/database"
import { z } from "zod"
import { validateParams, validateQuery } from "../../middleware/validation.middleware"

export async function pmRoutes(fastify: FastifyInstance) {
  // Register productivity dashboard routes
  await fastify.register(pmProductivityRoutes)
  
  // Register real-time update routes
  await fastify.register(pmRealtimeRoutes)
  // GET /pm/stats - PM dashboard stats
  fastify.get("/stats", { preHandler: authenticateUser }, async (request, reply) => {
    const user = (request as any).user
    const stats = await pmService.getStatsForUser(user.id)
    return reply.send({ stats })
  })

  // GET /pm/clients - List clients assigned to PM (stub)
  fastify.get(
    "/clients",
    {
      preHandler: [authenticateUser, validateQuery(z.object({ active: z.string().optional(), limit: z.string().optional() }))],
    },
    async (request, reply) => {
      const user = (request as any).user
      const { active, limit } = request.query as { active?: string; limit?: string }
      const clients = await pmService.listMyClients(user.id, {
        active: active ? active === "true" : undefined,
        limit: limit ? Number(limit) : undefined,
      })
      return reply.send({ clients })
    }
  )

  // GET /pm/tasks - List tasks assigned to PM (stub)
  fastify.get(
    "/tasks",
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({ priority: z.string().optional(), limit: z.string().optional() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user
      const { priority, limit } = request.query as { priority?: string; limit?: string }
      const tasks = await pmService.listMyTasks(user.id, {
        priority,
        limit: limit ? Number(limit) : undefined,
      })
      return reply.send({ tasks })
    }
  )

  // GET /pm/tasks/:id - Task detail (stub)
  fastify.get(
    "/tasks/:id",
    { preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))] },
    async (request, reply) => {
      const user = (request as any).user
      const { id } = request.params as { id: string }
      const task = await pmService.getTask(user.id, id)
      if (!task) return reply.code(404).send({ error: "Task not found" })
      return reply.send({ task })
    }
  )

  // POST /pm/tasks/:id/complete - Mark task complete with compliance check
  fastify.post(
    "/tasks/:id/complete",
    { preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))] },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const { force = false } = (request.body as { force?: boolean }) || {}

        // Get task to find project
        const task = await pmService.getTask(user.id, id)
        if (!task) {
          return reply.code(404).send({ error: "Task not found" })
        }

        // Check compliance before allowing completion
        const complianceCheck = await pmComplianceCheckService.checkTaskCompletionCompliance(
          id,
          user.id,
          (task as any).projectId
        )

        if (!complianceCheck.canComplete && !force) {
          return reply.code(403).send({
            error: "Task completion blocked by compliance requirements",
            compliance: complianceCheck,
          })
        }

        // Mark task as completed
        const completedTask = await prisma.task.update({
          where: { id },
          data: {
            status: "completed",
            completedAt: new Date(),
          },
        })

        return reply.send({
          task: completedTask,
          compliance: complianceCheck,
          warning: complianceCheck.warnings.length > 0
            ? "Task completed with compliance warnings"
            : undefined,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || "Failed to complete task",
        })
      }
    }
  )

  // GET /pm/tasks/:id/compliance - Check compliance status for task
  fastify.get(
    "/tasks/:id/compliance",
    { preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))] },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }

        const task = await pmService.getTask(user.id, id)
        if (!task) {
          return reply.code(404).send({ error: "Task not found" })
        }

        const compliance = await pmComplianceCheckService.checkTaskCompletionCompliance(
          id,
          user.id,
          (task as any).projectId
        )

        return reply.send({ compliance })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || "Failed to check compliance",
        })
      }
    }
  )
}

