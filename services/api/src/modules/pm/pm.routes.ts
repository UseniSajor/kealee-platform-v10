import { FastifyInstance } from "fastify"
import { authenticateUser } from "../auth/auth.middleware"
import { pmService } from "./pm.service"
import { pmProductivityRoutes } from "./pm-productivity.routes"
import { pmRealtimeRoutes } from "./pm-realtime.routes"
import { pmFocusModeRoutes } from "./pm-focus-mode.routes"
import { pmTaskContextRoutes } from "./pm-task-context.routes"
import { pmComplianceCheckService } from "./pm-compliance-check.service"
import { prismaAny } from "../../utils/prisma-helper"
import { z } from "zod"
import { validateParams, validateQuery, validateBody } from "../../middleware/validation.middleware"

export async function pmRoutes(fastify: FastifyInstance) {
  // Register productivity dashboard routes
  await fastify.register(pmProductivityRoutes)
  
  // Register real-time update routes
  await fastify.register(pmRealtimeRoutes)
  
  // Register focus mode routes
  await fastify.register(pmFocusModeRoutes, { prefix: '/focus-mode' })
  
  // Register task context routes
  await fastify.register(pmTaskContextRoutes)
  // GET /pm/stats - PM dashboard stats
  fastify.get("/stats", { preHandler: authenticateUser }, async (request, reply) => {
    const user = (request as any).user
    const stats = await pmService.getStatsForUser(user.id)
    return reply.send({ stats })
  })

  // GET /pm/clients - List clients assigned to PM
  fastify.get(
    "/clients",
    {
      preHandler: [
        authenticateUser,
        validateQuery(
          z.object({
            active: z.string().optional(),
            limit: z.string().optional(),
            unassigned: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user
      const { active, limit, unassigned } = request.query as {
        active?: string
        limit?: string
        unassigned?: string
      }

      if (unassigned === "true") {
        // Get unassigned clients (orgs with no PM assigned)
        const clients = await pmService.getUnassignedClients()
        return reply.send({ clients })
      }

      const clients = await pmService.listMyClients(user.id, {
        active: active ? active === "true" : undefined,
        limit: limit ? Number(limit) : undefined,
      })
      return reply.send({ clients })
    }
  )

  // GET /pm/tasks - List tasks assigned to PM with filters, pagination, sorting
  fastify.get(
    "/tasks",
    {
      preHandler: [
        authenticateUser,
        validateQuery(
          z.object({
            status: z.string().optional(),
            priority: z.string().optional(),
            assignedTo: z.string().optional(),
            client: z.string().optional(),
            search: z.string().optional(),
            page: z.string().optional(),
            pageSize: z.string().optional(),
            sortBy: z.string().optional(),
            sortOrder: z.string().optional(),
            limit: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user
      const query = request.query as {
        status?: string
        priority?: string
        assignedTo?: string
        client?: string
        search?: string
        page?: string
        pageSize?: string
        sortBy?: string
        sortOrder?: string
        limit?: string
      }

      const result = await pmService.listMyTasks(user.id, {
        status: query.status,
        priority: query.priority,
        assignedTo: query.assignedTo,
        client: query.client,
        search: query.search,
        page: query.page ? Number(query.page) : undefined,
        pageSize: query.pageSize ? Number(query.pageSize) : undefined,
        sortBy: query.sortBy as any,
        sortOrder: query.sortOrder as any,
        limit: query.limit ? Number(query.limit) : undefined,
      })

      return reply.send(result)
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
        const completedTask = await prismaAny.task.update({
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

  // GET /pm/reports/weekly - Generate weekly report
  fastify.get(
    "/reports/weekly",
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({ weekStart: z.string().optional() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { weekStart: weekStartStr } = request.query as { weekStart?: string }
        const weekStart = weekStartStr ? new Date(weekStartStr) : undefined

        const report = await pmService.generateWeeklyReport(user.id, weekStart)
        return reply.send({ report })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || "Failed to generate report",
        })
      }
    }
  )

  // POST /pm/tasks/bulk-assign - Bulk assign tasks
  fastify.post(
    "/tasks/bulk-assign",
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          taskIds: z.array(z.string()),
          newAssigneeId: z.string(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { taskIds, newAssigneeId } = request.body as { taskIds: string[]; newAssigneeId: string }

        const updated = await pmService.bulkAssignTasks(user.id, taskIds, newAssigneeId)
        return reply.send({ updated: updated.length, tasks: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || "Failed to bulk assign tasks",
        })
      }
    }
  )

  // POST /pm/tasks/bulk-complete - Bulk complete tasks
  fastify.post(
    "/tasks/bulk-complete",
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          taskIds: z.array(z.string()),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { taskIds } = request.body as { taskIds: string[] }

        const updated = await pmService.bulkCompleteTasks(user.id, taskIds)
        return reply.send({ updated: updated.length, tasks: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || "Failed to bulk complete tasks",
        })
      }
    }
  )

  // PATCH /pm/tasks/:id - Update task
  fastify.patch(
    "/tasks/:id",
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
        validateBody(z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
          status: z.enum(["pending", "in_progress", "completed"]).optional(),
          dueDate: z.string().optional(),
          assignedTo: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const body = request.body as any

        const task = await pmService.updateTask(user.id, id, body)
        return reply.send({ task })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || "Failed to update task",
        })
      }
    }
  )

  // GET /pm/tasks/:id/comments - Get task comments
  fastify.get(
    "/tasks/:id/comments",
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }

        const comments = await pmService.getTaskComments(user.id, id)
        return reply.send({ comments })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || "Failed to get comments",
        })
      }
    }
  )

  // POST /pm/tasks/:id/comments - Add task comment
  fastify.post(
    "/tasks/:id/comments",
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
        validateBody(z.object({ message: z.string().min(1) })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const { message } = request.body as { message: string }

        const comment = await pmService.addTaskComment(user.id, id, message)
        return reply.send({ comment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || "Failed to add comment",
        })
      }
    }
  )

  // GET /pm/workload - Get workload stats for all PMs
  fastify.get(
    "/workload",
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const workloads = await pmService.getWorkloadStats()
        return reply.send({ workloads })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || "Failed to get workload stats",
        })
      }
    }
  )

  // POST /pm/reports/generate - Generate report with PDF
  fastify.post(
    "/reports/generate",
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          weekStart: z.string(),
          weekEnd: z.string(),
          pmId: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { weekStart, weekEnd, pmId } = request.body as { weekStart: string; weekEnd: string; pmId?: string }

        const report = await pmService.generateWeeklyReport(pmId || user.id, new Date(weekStart))
        // TODO: Generate PDF using puppeteer or similar
        // For now, return report data
        return reply.send({ report, pdfUrl: null })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || "Failed to generate report",
        })
      }
    }
  )

  // POST /pm/clients/:id/assign - Assign client to PM
  fastify.post(
    "/clients/:id/assign",
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
        validateBody(z.object({
          pmId: z.string(),
          effectiveDate: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const { pmId, effectiveDate } = request.body as { pmId: string; effectiveDate?: string }

        const client = await pmService.assignClientToPM(id, pmId, effectiveDate ? new Date(effectiveDate) : undefined)
        return reply.send({ client })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || "Failed to assign client",
        })
      }
    }
  )
}

