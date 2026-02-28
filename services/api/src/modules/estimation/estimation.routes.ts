/**
 * KEALEE OS-PM - ESTIMATION ROUTES
 * API endpoints for project estimation and service ticket management
 */

import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'
import { estimationService } from './estimation.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

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
  contingencyPercent: z.number().min(0).max(50).optional(),
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

  // ============================================
  // PROJECT WIZARD ENDPOINT
  // ============================================

  const projectWizardSchema = z.object({
    // Step 1: Project basics
    projectName: z.string().min(1),
    projectType: z.string(),
    description: z.string().optional(),
    location: z.object({
      address: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
    }),
    squareFootage: z.number().optional(),

    // Step 2: Client info
    clientName: z.string().optional(),
    clientEmail: z.string().email().optional(),
    clientPhone: z.string().optional(),
    organizationId: z.string().uuid().optional(),

    // Step 3: Estimation
    estimateSource: z.enum(['ctc', 'marketplace', 'manual', 'ai-takeoff']).optional(),
    ctcTasks: z.array(z.object({
      ctcTaskNumber: z.string(),
      quantity: z.number(),
      modifiers: z.array(z.string()).optional(),
    })).optional(),
    takeoffJobId: z.string().uuid().optional(),

    // Step 4: Timeline
    estimatedStartDate: z.string().optional(),
    estimatedDuration: z.number().optional(),

    // Step 5: Bid request
    createBidRequest: z.boolean().optional(),
    bidDueDate: z.string().optional(),
    invitedContractorIds: z.array(z.string()).optional(),

    // Markups
    overheadPercent: z.number().optional(),
    profitPercent: z.number().optional(),
    contingencyPercent: z.number().optional(),
  })

  // POST /estimation/project-wizard — Orchestrates full project creation flow
  fastify.post(
    '/project-wizard',
    {
      preHandler: [authenticateUser, validateBody(projectWizardSchema)],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string; orgId?: string; organizationId?: string }
      const body = request.body as z.infer<typeof projectWizardSchema>
      const { prismaAny } = await import('../../utils/prisma-helper')

      try {
        // Look up user's org membership, or use provided orgId
        let orgId = body.organizationId || user.orgId || user.organizationId || null
        if (!orgId) {
          const membership = await prismaAny.orgMember.findFirst({
            where: { userId: user.id },
            select: { orgId: true },
          })
          orgId = membership?.orgId || null
        }
        const results: Record<string, any> = {}

        // Step 1: Create project
        const project = await prismaAny.project.create({
          data: {
            orgId: orgId,
            name: body.projectName,
            description: body.description,
            category: body.projectType,
            status: 'PRE_CONSTRUCTION',
            address: body.location.address,
            city: body.location.city,
            state: body.location.state,
            zipCode: body.location.zipCode,
            scheduledStartDate: body.estimatedStartDate ? new Date(body.estimatedStartDate) : null,
          },
        })
        results.project = { id: project.id, name: project.name }

        // Step 2: Create estimate (if CTC tasks provided)
        if (body.estimateSource === 'ctc' && body.ctcTasks && body.ctcTasks.length > 0) {
          const taskNumbers = body.ctcTasks.map(t => t.ctcTaskNumber)
          const allModifiers = body.ctcTasks.flatMap(t => t.modifiers || [])
          const allNumbers = [...new Set([...taskNumbers, ...allModifiers])]

          const assemblies = await prismaAny.assembly.findMany({
            where: {
              ctcTaskNumber: { in: allNumbers },
              sourceDatabase: 'CTC-Gordian-MD-DGS-2023',
            },
          })
          const asmMap = new Map(assemblies.map((a: any) => [a.ctcTaskNumber, a]))

          let subtotalMaterial = 0, subtotalLabor = 0, subtotalEquipment = 0
          const lineItemsData: any[] = []

          for (const taskReq of body.ctcTasks) {
            const asm = asmMap.get(taskReq.ctcTaskNumber) as any
            if (!asm) continue

            let unitCost = Number(asm.unitCost) || 0
            let laborCost = Number(asm.laborCost) || 0
            let materialCost = Number(asm.materialCost) || 0
            let equipmentCost = Number(asm.equipmentCost) || 0

            for (const modNum of (taskReq.modifiers || [])) {
              const mod = asmMap.get(modNum) as any
              if (!mod) continue
              unitCost += Number(mod.unitCost) || 0
              laborCost += Number(mod.laborCost) || 0
              materialCost += Number(mod.materialCost) || 0
              equipmentCost += Number(mod.equipmentCost) || 0
            }

            const qty = taskReq.quantity
            lineItemsData.push({
              description: asm.name,
              assemblyId: asm.id,
              itemType: 'ASSEMBLY_LINE',
              quantity: qty,
              unit: asm.unit,
              unitCost,
              laborCost: laborCost * qty,
              materialCostAmt: materialCost * qty,
              equipmentCostAmt: equipmentCost * qty,
              totalCost: unitCost * qty,
              metadata: { ctcTaskNumber: taskReq.ctcTaskNumber },
            })

            subtotalMaterial += materialCost * qty
            subtotalLabor += laborCost * qty
            subtotalEquipment += equipmentCost * qty
          }

          const subtotalDirect = subtotalMaterial + subtotalLabor + subtotalEquipment
          const overheadPct = body.overheadPercent ?? 10
          const profitPct = body.profitPercent ?? 10
          const contingencyPct = body.contingencyPercent ?? 5
          const overhead = subtotalDirect * (overheadPct / 100)
          const profit = subtotalDirect * (profitPct / 100)
          const contingency = subtotalDirect * (contingencyPct / 100)
          const totalCost = subtotalDirect + overhead + profit + contingency

          const ctcDb = await prismaAny.costDatabase.findFirst({
            where: { source: 'CTC-Gordian-MD-DGS-2023' },
          })

          const estimate = await prismaAny.estimate.create({
            data: {
              organizationId: orgId,
              projectId: project.id,
              costDatabaseId: ctcDb?.id || undefined,
              name: `${body.projectName} - CTC Estimate`,
              type: 'PRELIMINARY',
              status: 'DRAFT_ESTIMATE',
              projectName: body.projectName,
              projectAddress: body.location.address,
              projectCity: body.location.city,
              projectState: body.location.state,
              projectZip: body.location.zipCode,
              squareFootage: body.squareFootage,
              projectType: body.projectType,
              subtotalMaterial,
              subtotalLabor,
              subtotalEquipment,
              subtotalDirect,
              overhead,
              overheadPercent: overheadPct,
              profit,
              profitPercent: profitPct,
              contingency,
              contingencyPercent: contingencyPct,
              totalCost,
              preparedById: user.id,
              metadata: { source: 'project-wizard', estimateSource: 'ctc' },
            },
          })

          for (const item of lineItemsData) {
            await prismaAny.estimateLineItem.create({
              data: { estimateId: estimate.id, ...item },
            })
          }

          results.estimate = {
            id: estimate.id,
            lineItems: lineItemsData.length,
            totalCost,
          }

          // Update project budget
          await prismaAny.project.update({
            where: { id: project.id },
            data: { budgetTotal: totalCost },
          })
        }

        // Step 3: Optionally create bid request
        if (body.createBidRequest && results.estimate) {
          try {
            const bidRequest = await prismaAny.bidRequest.create({
              data: {
                projectId: project.id,
                title: `${body.projectName} - Bid Request`,
                status: 'DRAFT',
                deadline: body.bidDueDate ? new Date(body.bidDueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                estimatedBudget: results.estimate.totalCost,
                scope: { description: body.description || `Bid request for ${body.projectName}` },
              },
            })
            results.bidRequest = { id: bidRequest.id, status: 'DRAFT' }
          } catch (err: any) {
            // Bid request creation is optional; log but don't fail
            fastify.log.warn(err, 'Failed to create bid request in wizard')
          }
        }

        // Emit project.created event (for CLAWS)
        try {
          const { eventService } = await import('../events/event.service')
          await eventService.recordEvent({
            type: 'PROJECT_CREATED',
            entityType: 'Project',
            entityId: project.id,
            userId: user.id,
            payload: {
              projectId: project.id,
              projectName: body.projectName,
              estimateId: results.estimate?.id,
              bidRequestId: results.bidRequest?.id,
              source: 'project-wizard',
            },
          })
        } catch {
          // Non-critical
        }

        return reply.code(201).send({
          success: true,
          data: results,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Project wizard failed') })
      }
    }
  )
}
