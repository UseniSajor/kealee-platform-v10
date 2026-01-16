import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { jurisdictionConfigService } from './jurisdiction-config.service'

const createFeeScheduleSchema = z.object({
  feeName: z.string().min(1),
  permitType: z.string().min(1),
  description: z.string().optional(),
  calculationMethod: z.enum(['FIXED', 'PERCENTAGE', 'PER_SQUARE_FOOT', 'PER_UNIT', 'FORMULA', 'TIERED']),
  formula: z.string().optional(),
  baseAmount: z.number().positive().optional(),
  percentage: z.number().min(0).max(100).optional(),
  perSquareFoot: z.number().positive().optional(),
  perUnit: z.number().positive().optional(),
  tiers: z.array(z.any()).optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  applicableConditions: z.any().optional(),
  effectiveDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
})

const calculateFeeSchema = z.object({
  valuation: z.number().optional(),
  squareFootage: z.number().optional(),
  unitCount: z.number().optional(),
})

const createPermitTypeConfigSchema = z.object({
  permitType: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  requiresArchitect: z.boolean().optional(),
  requiresEngineer: z.boolean().optional(),
  requiresContractor: z.boolean().optional(),
  requiresOwnerSignature: z.boolean().optional(),
  requiredDocuments: z.array(z.string()).optional(),
  requiredReviewDisciplines: z.array(z.string()).optional(),
  defaultFeeScheduleId: z.string().uuid().optional(),
  autoApprovalThreshold: z.number().positive().optional(),
  expeditedThreshold: z.number().positive().optional(),
})

const createReviewDisciplineSchema = z.object({
  disciplineType: z.enum(['ZONING', 'BUILDING', 'FIRE', 'ENVIRONMENTAL', 'STRUCTURAL', 'MECHANICAL', 'ELECTRICAL', 'PLUMBING', 'ACCESSIBILITY', 'ENERGY', 'LANDSCAPE', 'HISTORIC']),
  displayName: z.string().min(1),
  description: z.string().optional(),
  isRequired: z.boolean().optional(),
  reviewOrder: z.number().int().optional(),
  estimatedReviewDays: z.number().int().positive().optional(),
  autoAssign: z.boolean().optional(),
  assignmentCriteria: z.any().optional(),
})

const createInspectorAssignmentSchema = z.object({
  staffId: z.string().uuid(),
  reviewDisciplineId: z.string().uuid().optional(),
  specialty: z.enum(['BUILDING', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL', 'FIRE', 'ACCESSIBILITY', 'ENERGY', 'STRUCTURAL', 'ENVIRONMENTAL', 'GENERAL']),
  zoneId: z.string().optional(),
  zoneBoundary: z.any().optional(),
  permitTypes: z.array(z.string()).optional(),
  maxConcurrentAssignments: z.number().int().positive().optional(),
  priority: z.number().int().optional(),
  availableDaysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  availableHoursStart: z.number().int().min(0).max(23).optional(),
  availableHoursEnd: z.number().int().min(0).max(23).optional(),
})

const createBusinessRuleSchema = z.object({
  ruleName: z.string().min(1),
  ruleType: z.enum(['AUTO_APPROVAL', 'EXPEDITED_THRESHOLD', 'REQUIRED_REVIEW', 'FEE_WAIVER', 'PERMIT_EXEMPTION', 'INSPECTION_REQUIREMENT']),
  description: z.string().optional(),
  conditions: z.any(),
  actions: z.any(),
  thresholdValue: z.number().positive().optional(),
  thresholdField: z.string().optional(),
  priority: z.number().int().optional(),
})

const createHolidaySchema = z.object({
  holidayName: z.string().min(1),
  holidayDate: z.string().datetime(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
  affectsPermits: z.boolean().optional(),
  affectsInspections: z.boolean().optional(),
  affectsReviews: z.boolean().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  description: z.string().optional(),
})

const evaluateBusinessRulesSchema = z.object({
  permitType: z.string().min(1),
  valuation: z.number().optional(),
  squareFootage: z.number().optional(),
  projectType: z.string().optional(),
})

export async function jurisdictionConfigRoutes(fastify: FastifyInstance) {
  // POST /permits/jurisdictions/:id/fee-schedules - Create fee schedule
  fastify.post(
    '/jurisdictions/:id/fee-schedules',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(createFeeScheduleSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof createFeeScheduleSchema>
        const feeSchedule = await jurisdictionConfigService.createFeeSchedule({
          ...body,
          jurisdictionId: id,
          effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : undefined,
          expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
          createdById: user.id,
        })
        return reply.code(201).send({ feeSchedule })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create fee schedule',
        })
      }
    }
  )

  // POST /permits/fee-schedules/:id/calculate - Calculate fee
  fastify.post(
    '/fee-schedules/:id/calculate',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(calculateFeeSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof calculateFeeSchema>
        const result = await jurisdictionConfigService.calculateFee(id, body)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to calculate fee',
        })
      }
    }
  )

  // POST /permits/jurisdictions/:id/permit-type-configs - Create permit type config
  fastify.post(
    '/jurisdictions/:id/permit-type-configs',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(createPermitTypeConfigSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof createPermitTypeConfigSchema>
        const config = await jurisdictionConfigService.createPermitTypeConfig({
          ...body,
          jurisdictionId: id,
          createdById: user.id,
        })
        return reply.code(201).send({ config })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create permit type config',
        })
      }
    }
  )

  // POST /permits/jurisdictions/:id/review-disciplines - Create review discipline
  fastify.post(
    '/jurisdictions/:id/review-disciplines',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(createReviewDisciplineSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof createReviewDisciplineSchema>
        const discipline = await jurisdictionConfigService.createReviewDiscipline({
          ...body,
          jurisdictionId: id,
          createdById: user.id,
        })
        return reply.code(201).send({ discipline })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create review discipline',
        })
      }
    }
  )

  // POST /permits/jurisdictions/:id/inspector-assignments - Create inspector assignment
  fastify.post(
    '/jurisdictions/:id/inspector-assignments',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(createInspectorAssignmentSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof createInspectorAssignmentSchema>
        const assignment = await jurisdictionConfigService.createInspectorAssignment({
          ...body,
          jurisdictionId: id,
          createdById: user.id,
        })
        return reply.code(201).send({ assignment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create inspector assignment',
        })
      }
    }
  )

  // POST /permits/jurisdictions/:id/business-rules - Create business rule
  fastify.post(
    '/jurisdictions/:id/business-rules',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(createBusinessRuleSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof createBusinessRuleSchema>
        const rule = await jurisdictionConfigService.createBusinessRule({
          ...body,
          jurisdictionId: id,
          createdById: user.id,
        })
        return reply.code(201).send({ rule })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create business rule',
        })
      }
    }
  )

  // POST /permits/jurisdictions/:id/business-rules/evaluate - Evaluate business rules
  fastify.post(
    '/jurisdictions/:id/business-rules/evaluate',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(evaluateBusinessRulesSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof evaluateBusinessRulesSchema>
        const result = await jurisdictionConfigService.evaluateBusinessRules(id, body)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to evaluate business rules',
        })
      }
    }
  )

  // POST /permits/jurisdictions/:id/holidays - Create holiday
  fastify.post(
    '/jurisdictions/:id/holidays',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(createHolidaySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof createHolidaySchema>
        const holiday = await jurisdictionConfigService.createHoliday({
          ...body,
          jurisdictionId: id,
          holidayDate: new Date(body.holidayDate),
          startTime: body.startTime ? new Date(body.startTime) : undefined,
          endTime: body.endTime ? new Date(body.endTime) : undefined,
          createdById: user.id,
        })
        return reply.code(201).send({ holiday })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create holiday',
        })
      }
    }
  )

  // GET /permits/jurisdictions/:id/holidays/check - Check if date is holiday
  fastify.get(
    '/jurisdictions/:id/holidays/check',
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
          date: string
          type?: 'permits' | 'inspections' | 'reviews'
        }
        if (!query.date) {
          return reply.code(400).send({ error: 'Date parameter required' })
        }
        const result = await jurisdictionConfigService.isHoliday(id, new Date(query.date), query.type)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to check holiday',
        })
      }
    }
  )

  // GET /permits/jurisdictions/:id/configuration - List all configuration
  fastify.get(
    '/jurisdictions/:id/configuration',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const config = await jurisdictionConfigService.listConfiguration(id)
        return reply.send(config)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get configuration',
        })
      }
    }
  )
}
