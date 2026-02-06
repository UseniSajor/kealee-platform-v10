/**
 * KEALEE OS-PM - ESTIMATION ROUTES
 * API endpoints for project estimation and service ticket management
 */

import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'
import { estimationService } from './estimation.service'

// Validation schemas
const estimateRequestSchema = z.object({
  projectId: z.string().uuid().optional(),
  projectType: z.enum([
    'RESIDENTIAL_NEW',
    'RESIDENTIAL_REMODEL',
    'COMMERCIAL',
    'MIXED_USE',
    'REPAIR',
    'CHANGE_ORDER',
  ]),
  squareFootage: z.number().min(100).max(1000000),
  location: z.object({
    city: z.string().min(1),
    state: z.string().length(2),
    zipCode: z.string().min(5),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  complexity: z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'LUXURY']).optional(),
  customRequirements: z.array(z.string()).optional(),
  includePermits: z.boolean().optional(),
  includeContingency: z.boolean().optional(),
  contingencyPercent: z.number().min(5).max(15).optional(),
})

const laborEstimateSchema = z.object({
  projectType: z.string(),
  trades: z.array(z.string()).min(1),
  squareFootage: z.number().min(100),
  complexity: z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'LUXURY']).optional(),
})

const materialsEstimateSchema = z.object({
  projectType: z.string(),
  scope: z.string().min(10),
  squareFootage: z.number().min(100),
})

const timelineEstimateSchema = z.object({
  projectType: z.string(),
  squareFootage: z.number().min(100),
  complexity: z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'LUXURY']).optional(),
})

const serviceTicketSchema = z.object({
  type: z.enum([
    'NEW_PROJECT_INTAKE',
    'CHANGE_ORDER',
    'WARRANTY_CLAIM',
    'PUNCH_LIST',
    'MAINTENANCE',
    'EMERGENCY_REPAIR',
    'CONSULTATION',
  ]),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
  clientName: z.string().min(1),
  projectId: z.string().uuid().optional(),
  description: z.string().min(10),
  siteAddress: z
    .object({
      address: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
    })
    .optional(),
})

const ticketTransitionSchema = z.object({
  newStatus: z.enum([
    'INTAKE',
    'ESTIMATION',
    'APPROVAL',
    'SCHEDULING',
    'IN_PROGRESS',
    'QUALITY_CHECK',
    'CLOSEOUT',
    'COMPLETED',
    'CANCELLED',
  ]),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  estimateId: z.string().optional(),
})

const projectIntakeSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  projectType: z.string(),
  description: z.string().min(10),
  location: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
  }),
  squareFootage: z.number().optional(),
  estimatedBudget: z.number().optional(),
  preferredStartDate: z.string().optional(),
  orgId: z.string().uuid().optional(),
})

export async function estimationRoutes(fastify: FastifyInstance) {
  // ============================================
  // ESTIMATE GENERATION ENDPOINTS
  // ============================================

  // POST /estimation/estimate - Generate full estimate
  fastify.post(
    '/estimate',
    {
      preHandler: [authenticateUser, validateBody(estimateRequestSchema)],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const body = request.body as z.infer<typeof estimateRequestSchema>

      const estimate = await estimationService.generateEstimate(body, user.id)

      return reply.code(201).send({ estimate })
    }
  )

  // POST /estimation/labor - Get labor estimate only
  fastify.post(
    '/labor',
    {
      preHandler: [authenticateUser, validateBody(laborEstimateSchema)],
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof laborEstimateSchema>

      const labor = await estimationService.getLaborEstimate(
        body.projectType,
        body.trades,
        body.squareFootage,
        body.complexity
      )

      return reply.send({ labor })
    }
  )

  // POST /estimation/materials - Get materials estimate
  fastify.post(
    '/materials',
    {
      preHandler: [authenticateUser, validateBody(materialsEstimateSchema)],
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof materialsEstimateSchema>

      const materials = await estimationService.getMaterialsEstimate(
        body.projectType,
        body.scope,
        body.squareFootage
      )

      return reply.send({ materials })
    }
  )

  // POST /estimation/timeline - Get timeline estimate
  fastify.post(
    '/timeline',
    {
      preHandler: [authenticateUser, validateBody(timelineEstimateSchema)],
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof timelineEstimateSchema>

      const timeline = await estimationService.getTimelineEstimate(
        body.projectType,
        body.squareFootage,
        body.complexity
      )

      return reply.send({ timeline })
    }
  )

  // GET /estimation/project/:projectId - Get estimate for a project
  fastify.get(
    '/project/:projectId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }

      const estimate = await estimationService.getProjectEstimate(projectId)

      if (!estimate) {
        return reply.code(404).send({ error: 'No estimate found for this project' })
      }

      return reply.send({ estimate })
    }
  )

  // ============================================
  // SERVICE TICKET ENDPOINTS
  // ============================================

  // POST /estimation/tickets - Create service ticket
  fastify.post(
    '/tickets',
    {
      preHandler: [authenticateUser, validateBody(serviceTicketSchema)],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const body = request.body as z.infer<typeof serviceTicketSchema>

      const ticket = await estimationService.createServiceTicket(body, user.id)

      return reply.code(201).send({ ticket })
    }
  )

  // GET /estimation/tickets/:ticketId - Get service ticket
  fastify.get(
    '/tickets/:ticketId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ ticketId: z.string() })),
      ],
    },
    async (request, reply) => {
      const { ticketId } = request.params as { ticketId: string }

      const ticket = await estimationService.getServiceTicket(ticketId)

      return reply.send({ ticket })
    }
  )

  // POST /estimation/tickets/:ticketId/transition - Update ticket status
  fastify.post(
    '/tickets/:ticketId/transition',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ ticketId: z.string() })),
        validateBody(ticketTransitionSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { ticketId } = request.params as { ticketId: string }
      const body = request.body as z.infer<typeof ticketTransitionSchema>

      const ticket = await estimationService.transitionTicket(
        ticketId,
        body.newStatus,
        { assignedTo: body.assignedTo, notes: body.notes, estimateId: body.estimateId },
        user.id
      )

      return reply.send({ ticket })
    }
  )

  // GET /estimation/tickets - List tickets (optionally filtered by project)
  fastify.get(
    '/tickets',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({ projectId: z.string().uuid().optional() })),
      ],
    },
    async (request, reply) => {
      const { projectId } = request.query as { projectId?: string }

      if (projectId) {
        const tickets = await estimationService.getProjectTickets(projectId)
        return reply.send({ tickets })
      }

      // Return empty for now - could implement user's tickets
      return reply.send({ tickets: [] })
    }
  )

  // ============================================
  // PROJECT INTAKE ENDPOINTS
  // ============================================

  // POST /estimation/intake - Create project intake (ticket + optional estimate)
  fastify.post(
    '/intake',
    {
      preHandler: [authenticateUser, validateBody(projectIntakeSchema)],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const body = request.body as z.infer<typeof projectIntakeSchema>

      const result = await estimationService.createProjectIntake(body, user.id, body.orgId)

      return reply.code(201).send(result)
    }
  )

  // ============================================
  // DASHBOARD/METRICS ENDPOINTS
  // ============================================

  // GET /estimation/metrics - Get dashboard metrics
  fastify.get(
    '/metrics',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      const metrics = await estimationService.getDashboardMetrics()
      return reply.send({ metrics })
    }
  )
}
