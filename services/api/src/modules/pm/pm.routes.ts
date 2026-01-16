import { FastifyInstance } from "fastify"
import { authenticateUser } from "../auth/auth.middleware"
import { pmService } from "./pm.service"
import { pmProductivityRoutes } from "./pm-productivity.routes"
import { z } from "zod"
import { validateParams, validateQuery } from "../../middleware/validation.middleware"

export async function pmRoutes(fastify: FastifyInstance) {
  // Register productivity dashboard routes
  await fastify.register(pmProductivityRoutes)
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

  // POST /pm/tasks/:id/complete - Mark task complete (stub)
  fastify.post(
    "/tasks/:id/complete",
    { preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))] },
    async (_request, reply) => {
      return reply.code(501).send({ error: "Not implemented yet" })
    }
  )
}

