import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { jurisdictionStaffService } from './jurisdiction-staff.service'

const createStaffSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['PLAN_REVIEWER', 'INSPECTOR', 'PERMIT_COORDINATOR', 'ADMINISTRATOR']),
  maxWorkload: z.number().int().positive().optional(),
  availabilitySchedule: z.any().optional(),
})

const balanceWorkloadSchema = z.object({
  assignmentType: z.string().min(1),
  entityId: z.string().uuid(),
  entityType: z.string().min(1),
  priority: z.number().int().optional(),
  dueDate: z.string().datetime().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  requiredRole: z.string().optional(),
  requiredSpecialty: z.string().optional(),
  zoneId: z.string().optional(),
})

const assignWorkloadSchema = z.object({
  staffId: z.string().uuid(),
  assignmentType: z.string().min(1),
  entityId: z.string().uuid(),
  entityType: z.string().min(1),
  priority: z.number().int().optional(),
  dueDate: z.string().datetime().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
})

const recordPerformanceMetricSchema = z.object({
  metricType: z.enum(['REVIEW_TIME', 'INSPECTION_TIME', 'ACCURACY_RATE', 'CUSTOMER_SATISFACTION', 'PRODUCTIVITY']),
  metricName: z.string().min(1),
  metricValue: z.number(),
  metricUnit: z.string().optional(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  periodType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  permitType: z.string().optional(),
  reviewDiscipline: z.string().optional(),
  notes: z.string().optional(),
})

const addCertificationSchema = z.object({
  certificationName: z.string().min(1),
  certificationNumber: z.string().optional(),
  issuingOrganization: z.string().min(1),
  issueDate: z.string().datetime(),
  expirationDate: z.string().datetime().optional(),
  certificateFileUrl: z.string().url().optional(),
  notes: z.string().optional(),
})

const assignTrainingSchema = z.object({
  trainingModuleId: z.string().min(1),
  trainingModuleName: z.string().min(1),
  trainingType: z.enum(['ONLINE', 'IN_PERSON', 'ON_THE_JOB']),
  description: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  passingScore: z.number().min(0).max(100).optional(),
})

const completeTrainingSchema = z.object({
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  certificateFileUrl: z.string().url().optional(),
  notes: z.string().optional(),
})

const provisionMobileAppSchema = z.object({
  deviceId: z.string().min(1),
  deviceType: z.enum(['IOS', 'ANDROID']),
  deviceName: z.string().optional(),
  deviceModel: z.string().optional(),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
})

export async function jurisdictionStaffRoutes(fastify: FastifyInstance) {
  // POST /permits/jurisdictions/:id/staff - Create staff member
  fastify.post(
    '/jurisdictions/:id/staff',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(createStaffSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof createStaffSchema>
        const staff = await jurisdictionStaffService.createStaff({
          ...body,
          jurisdictionId: id,
          createdById: user.id,
        })
        return reply.code(201).send({ staff })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create staff member',
        })
      }
    }
  )

  // GET /permits/jurisdictions/:id/staff - List staff members
  fastify.get(
    '/jurisdictions/:id/staff',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const query = request.query as {
          role?: string
          active?: string
          search?: string
        }
        const staff = await jurisdictionStaffService.listStaff(id, {
          ...query,
          active: query.active === 'true' ? true : query.active === 'false' ? false : undefined,
        })
        return reply.send({ staff })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list staff members',
        })
      }
    }
  )

  // GET /permits/staff/:id - Get staff member
  fastify.get(
    '/staff/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const staff = await jurisdictionStaffService.getStaff(id)
        return reply.send({ staff })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Staff member not found',
        })
      }
    }
  )

  // POST /permits/jurisdictions/:id/workload/balance - Balance workload
  fastify.post(
    '/jurisdictions/:id/workload/balance',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(balanceWorkloadSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof balanceWorkloadSchema>
        const result = await jurisdictionStaffService.balanceWorkload(id, {
          ...body,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        })
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to balance workload',
        })
      }
    }
  )

  // POST /permits/workload/assign - Assign workload
  fastify.post(
    '/workload/assign',
    {
      preHandler: [
        authenticateUser,
        validateBody(assignWorkloadSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof assignWorkloadSchema>
        const assignment = await jurisdictionStaffService.assignWorkload({
          jurisdictionId: body.entityId, // Map entityId to jurisdictionId
          staffId: body.staffId,
          permitIds: body.entityType === 'permit' ? [body.entityId] : [], // Map based on entityType
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          assignedById: user.id,
        })
        return reply.code(201).send({ assignment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to assign workload',
        })
      }
    }
  )

  // POST /permits/staff/:id/performance - Record performance metric
  fastify.post(
    '/staff/:id/performance',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(recordPerformanceMetricSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof recordPerformanceMetricSchema>
        // Get jurisdiction ID from staff
        const staff = await jurisdictionStaffService.getStaff(id)
        const metric = await jurisdictionStaffService.recordPerformanceMetric({
          ...body,
          staffId: id,
          jurisdictionId: staff.jurisdictionId,
          periodStart: new Date(body.periodStart),
          periodEnd: new Date(body.periodEnd),
        })
        return reply.code(201).send({ metric })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to record performance metric',
        })
      }
    }
  )

  // POST /permits/staff/:id/certifications - Add certification
  fastify.post(
    '/staff/:id/certifications',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(addCertificationSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof addCertificationSchema>
        const staff = await jurisdictionStaffService.getStaff(id)
        const certification = await jurisdictionStaffService.addCertification({
          ...body,
          staffId: id,
          jurisdictionId: staff.jurisdictionId,
          issueDate: new Date(body.issueDate),
          expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
          createdById: user.id,
        })
        return reply.code(201).send({ certification })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to add certification',
        })
      }
    }
  )

  // POST /permits/staff/:id/trainings - Assign training
  fastify.post(
    '/staff/:id/trainings',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(assignTrainingSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof assignTrainingSchema>
        const staff = await jurisdictionStaffService.getStaff(id)
        const training = await jurisdictionStaffService.assignTraining({
          ...body,
          staffId: id,
          jurisdictionId: staff.jurisdictionId,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
          assignedById: user.id,
        })
        return reply.code(201).send({ training })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to assign training',
        })
      }
    }
  )

  // POST /permits/trainings/:id/complete - Complete training
  fastify.post(
    '/trainings/:id/complete',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(completeTrainingSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof completeTrainingSchema>
        const training = await jurisdictionStaffService.completeTraining(id, body)
        return reply.send({ training })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to complete training',
        })
      }
    }
  )

  // POST /permits/staff/:id/mobile-app/provision - Provision mobile app
  fastify.post(
    '/staff/:id/mobile-app/provision',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(provisionMobileAppSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof provisionMobileAppSchema>
        const staff = await jurisdictionStaffService.getStaff(id)
        const provision = await jurisdictionStaffService.provisionMobileApp({
          ...body,
          staffId: id,
          jurisdictionId: staff.jurisdictionId,
          provisionedById: user.id,
        })
        return reply.code(201).send({ provision })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to provision mobile app',
        })
      }
    }
  )

  // GET /permits/staff/:id/performance-summary - Get performance summary
  fastify.get(
    '/staff/:id/performance-summary',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const query = request.query as {
          start?: string
          end?: string
        }
        const summary = await jurisdictionStaffService.getStaffPerformanceSummary(id, {
          start: query.start ? new Date(query.start) : undefined,
          end: query.end ? new Date(query.end) : undefined,
        })
        return reply.send({ summary })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get performance summary',
        })
      }
    }
  )
}
