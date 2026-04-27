import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { serviceRequestService } from './service-request.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import { prismaAny as prisma } from '../../utils/prisma-helper'
import { getProjectExecutionQueue } from '../../utils/project-execution-queue'

// Categories that map to AI pipeline execution types
const CATEGORY_TO_OUTPUT_TYPE: Record<string, 'design' | 'estimate' | 'permit' | 'concept'> = {
  land_analysis:   'concept',
  design:          'design',
  estimation:      'estimate',
  estimate:        'estimate',
  permit:          'permit',
  permits:         'permit',
  concept:         'concept',
  ai_concept:      'concept',
}

const createServiceRequestSchema = z.object({
  orgId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  dueDate: z.string().optional(),
  projectId: z.string().uuid().optional(), // When provided + category maps to pipeline type, triggers AI execution
})

const updateStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'completed', 'canceled']),
  assignedTo: z.string().uuid().optional(),
})

const assignRequestSchema = z.object({
  assignedTo: z.string().uuid(),
})

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().optional(),
})

const updateTaskStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
})

export async function serviceRequestRoutes(fastify: FastifyInstance) {
  // POST /ops-services/service-requests - Create service request
  fastify.post(
    '/service-requests',
    {
      preHandler: [
        authenticateUser,
        validateBody(createServiceRequestSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof createServiceRequestSchema>
        const serviceRequest = await serviceRequestService.createServiceRequest({
          ...body,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          userId: user.id,
        })

        // If a projectId is provided and the category maps to an AI pipeline type,
        // create a ProjectOutput and enqueue execution (OS-Land pipeline connection)
        const outputType = CATEGORY_TO_OUTPUT_TYPE[body.category?.toLowerCase()]
        if (body.projectId && outputType) {
          try {
            const output = await prisma.projectOutput.create({
              data: {
                projectId: body.projectId,
                type: outputType,
                status: 'pending',
                metadata: { source: 'os_service_request', serviceRequestId: serviceRequest.id, orgId: body.orgId },
              },
            })
            const queue = getProjectExecutionQueue()
            await queue.add(
              'execute',
              { outputId: output.id, type: outputType, projectId: body.projectId, metadata: { source: 'os_service_request', category: body.category } },
              { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
            )
            fastify.log.info({ outputId: output.id, projectId: body.projectId, category: body.category }, '[OS-LAND] ProjectOutput created and execution enqueued')
          } catch (err: any) {
            fastify.log.error({ err: err.message, projectId: body.projectId }, '[OS-LAND] Failed to enqueue execution — service request saved, execution skipped')
            // Non-fatal: service request is persisted; operator can re-trigger manually
          }
        }

        return reply.code(201).send({ serviceRequest })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create service request'),
        })
      }
    }
  )

  // GET /ops-services/service-requests/:id - Get service request
  fastify.get(
    '/service-requests/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const serviceRequest = await serviceRequestService.getServiceRequest(id, user.id)
        return reply.send({ serviceRequest })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: sanitizeErrorMessage(error, 'Service request not found'),
        })
      }
    }
  )

  // GET /ops-services/service-requests - List service requests
  fastify.get(
    '/service-requests',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const query = request.query as {
          planId?: string
          status?: string
          requestType?: string
          assignedTo?: string
        }
        const serviceRequests = await serviceRequestService.listServiceRequests({
          userId: user.id,
          ...query,
        })
        return reply.send({ serviceRequests })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to list service requests'),
        })
      }
    }
  )

  // PATCH /ops-services/service-requests/:id/status - Update service request status
  fastify.patch(
    '/service-requests/:id/status',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateStatusSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateStatusSchema>
        const serviceRequest = await serviceRequestService.updateServiceRequestStatus(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ serviceRequest })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to update service request status'),
        })
      }
    }
  )

  // POST /ops-services/service-requests/:id/assign - Assign service request to PM
  fastify.post(
    '/service-requests/:id/assign',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(assignRequestSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof assignRequestSchema>
        const serviceRequest = await serviceRequestService.assignServiceRequest(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ serviceRequest })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to assign service request'),
        })
      }
    }
  )

  // POST /ops-services/service-requests/:id/tasks - Create task for service request
  fastify.post(
    '/service-requests/:id/tasks',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(createTaskSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof createTaskSchema>
        const task = await serviceRequestService.createTask(id, {
          ...body,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          userId: user.id,
        })
        return reply.code(201).send({ task })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create task'),
        })
      }
    }
  )

  // GET /ops-services/tasks - List tasks
  fastify.get(
    '/tasks',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          requestId?: string
          assignedTo?: string
          status?: string
        }
        const tasks = await serviceRequestService.listTasks(query)
        return reply.send({ tasks })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to list tasks'),
        })
      }
    }
  )

  // PATCH /ops-services/tasks/:id/status - Update task status
  fastify.patch(
    '/tasks/:id/status',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateTaskStatusSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateTaskStatusSchema>
        const task = await serviceRequestService.updateTaskStatus(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ task })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to update task status'),
        })
      }
    }
  )

  // POST /ops-services/service-requests/:id/messages - Add message to service request
  fastify.post(
    '/service-requests/:id/messages',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({ message: z.string().min(1) })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as { message: string }
        const serviceRequest = await serviceRequestService.addMessage(id, {
          message: body.message,
          userId: user.id,
        })
        return reply.send({ serviceRequest })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to add message'),
        })
      }
    }
  )

  // POST /ops-services/service-requests/:id/satisfaction - Set satisfaction rating
  fastify.post(
    '/service-requests/:id/satisfaction',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({ rating: z.number().min(1).max(5) })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as { rating: number }
        const serviceRequest = await serviceRequestService.setSatisfaction(id, {
          rating: body.rating,
          userId: user.id,
        })
        return reply.send({ serviceRequest })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to set satisfaction'),
        })
      }
    }
  )
}
