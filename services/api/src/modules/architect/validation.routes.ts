import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { validationService } from './validation.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const createValidationRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['DRAWING_CHECKLIST', 'CODE_COMPLIANCE', 'ACCESSIBILITY', 'BUILDING_CODE', 'ENERGY_CODE', 'STRUCTURAL', 'MEP', 'FIRE_SAFETY', 'OTHER']),
  codeStandard: z.enum(['IBC', 'IRC', 'NFPA', 'ADA', 'ANSI_A117_1', 'ASHRAE_90_1', 'IECC', 'LOCAL_CODE', 'OTHER']).optional(),
  codeReference: z.string().optional(),
  ruleType: z.string().min(1),
  ruleLogic: z.any().optional(),
  validationScript: z.string().optional(),
  appliesTo: z.array(z.string()).optional(),
  requiredFor: z.array(z.string()).optional(),
  phaseApplicability: z.array(z.string()).optional(),
  isRequired: z.boolean().optional(),
})

const runValidationSchema = z.object({
  targetType: z.string().min(1),
  targetId: z.string().uuid(),
  ruleId: z.string().uuid().optional(),
  ruleIds: z.array(z.string().uuid()).optional(),
  validationMethod: z.string().optional(),
})

const updateValidationSchema = z.object({
  validationStatus: z.enum(['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'WARNING', 'EXEMPT']),
  severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
  validationMessage: z.string().optional(),
  validationDetails: z.any().optional(),
  issuesFound: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  complianceStatus: z.string().optional(),
})

const approveValidationSchema = z.object({
  approvalNotes: z.string().optional(),
  exemptionGranted: z.boolean().optional(),
  exemptionReason: z.string().optional(),
})

const generateReportSchema = z.object({
  reportName: z.string().min(1),
  reportType: z.string().min(1),
  targetType: z.string().optional(),
  targetId: z.string().uuid().optional(),
  ruleIds: z.array(z.string().uuid()).optional(),
  format: z.string().optional(),
})

const createChecklistSchema = z.object({
  sheetId: z.string().uuid().optional(),
  items: z.array(z.object({
    itemName: z.string().min(1),
    itemCategory: z.string().optional(),
    isRequired: z.boolean().optional(),
    locationOnSheet: z.string().optional(),
    expectedValue: z.string().optional(),
  })).min(1),
})

const validateChecklistItemSchema = z.object({
  isPresent: z.boolean(),
  isValid: z.boolean().optional(),
  validationNotes: z.string().optional(),
})

const createCodeComplianceSchema = z.object({
  codeStandard: z.enum(['IBC', 'IRC', 'NFPA', 'ADA', 'ANSI_A117_1', 'ASHRAE_90_1', 'IECC', 'LOCAL_CODE', 'OTHER']),
  codeSection: z.string().min(1),
  codeDescription: z.string().optional(),
  complianceStatus: z.string().min(1),
  complianceNotes: z.string().optional(),
  evidenceFileIds: z.array(z.string().uuid()).optional(),
  relatedSheetIds: z.array(z.string().uuid()).optional(),
  relatedDeliverableIds: z.array(z.string().uuid()).optional(),
})

const validateCodeComplianceSchema = z.object({
  complianceStatus: z.string().min(1),
  complianceNotes: z.string().optional(),
  validationMethod: z.string().optional(),
})

export async function validationRoutes(fastify: FastifyInstance) {
  // POST /architect/validation-rules - Create validation rule
  fastify.post(
    '/validation-rules',
    {
      preHandler: [
        authenticateUser,
        validateBody(createValidationRuleSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof createValidationRuleSchema>
        const rule = await validationService.createValidationRule({
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ rule })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create validation rule'),
        })
      }
    }
  )

  // GET /architect/validation-rules - List validation rules
  fastify.get(
    '/validation-rules',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          category?: string
          codeStandard?: string
          isActive?: string
          isRequired?: string
        }
        const rules = await validationService.listValidationRules({
          category: query.category,
          codeStandard: query.codeStandard,
          isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
          isRequired: query.isRequired === 'true' ? true : query.isRequired === 'false' ? false : undefined,
        })
        return reply.send({ rules })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to list validation rules'),
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/validations - Run validation
  fastify.post(
    '/design-projects/:projectId/validations',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(runValidationSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof runValidationSchema>
        const validations = await validationService.runValidation({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ validations })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to run validation'),
        })
      }
    }
  )

  // GET /architect/validations/:id - Get validation
  fastify.get(
    '/validations/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const validation = await validationService.getValidation(id)
        return reply.send({ validation })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: sanitizeErrorMessage(error, 'Validation not found'),
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/validations - List validations
  fastify.get(
    '/design-projects/:projectId/validations',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const query = request.query as {
          targetType?: string
          targetId?: string
          validationStatus?: string
          category?: string
          codeStandard?: string
        }
        const validations = await validationService.listValidations(projectId, query)
        return reply.send({ validations })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to list validations'),
        })
      }
    }
  )

  // PATCH /architect/validations/:id - Update validation
  fastify.patch(
    '/validations/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateValidationSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateValidationSchema>
        const validation = await validationService.updateValidation(id, {
          ...body,
          validatedById: user.id,
        })
        return reply.send({ validation })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to update validation'),
        })
      }
    }
  )

  // POST /architect/validations/:id/approve - Approve validation
  fastify.post(
    '/validations/:id/approve',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(approveValidationSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof approveValidationSchema>
        const validation = await validationService.approveValidation(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ validation })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to approve validation'),
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/validation-reports - Generate report
  fastify.post(
    '/design-projects/:projectId/validation-reports',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(generateReportSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof generateReportSchema>
        const report = await validationService.generateValidationReport({
          designProjectId: projectId,
          ...body,
          generatedById: user.id,
        })
        return reply.code(201).send({ report })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to generate validation report'),
        })
      }
    }
  )

  // GET /architect/validation-reports/:id - Get validation report
  fastify.get(
    '/validation-reports/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const report = await validationService.getValidationReport(id)
        return reply.send({ report })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: sanitizeErrorMessage(error, 'Validation report not found'),
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/drawing-checklist - Create checklist
  fastify.post(
    '/design-projects/:projectId/drawing-checklist',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createChecklistSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createChecklistSchema>
        const items = await validationService.createDrawingChecklist({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ items })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create drawing checklist'),
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/drawing-checklist - Get checklist
  fastify.get(
    '/design-projects/:projectId/drawing-checklist',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const query = request.query as { sheetId?: string }
        const items = await validationService.getDrawingChecklist(projectId, query.sheetId)
        return reply.send({ items })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to get drawing checklist'),
        })
      }
    }
  )

  // PATCH /architect/drawing-checklist/:id - Validate checklist item
  fastify.patch(
    '/drawing-checklist/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(validateChecklistItemSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof validateChecklistItemSchema>
        const item = await validationService.validateChecklistItem(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ item })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to validate checklist item'),
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/code-compliance - Create code compliance record
  fastify.post(
    '/design-projects/:projectId/code-compliance',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createCodeComplianceSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createCodeComplianceSchema>
        const record = await validationService.createCodeComplianceRecord({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ record })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create code compliance record'),
        })
      }
    }
  )

  // PATCH /architect/code-compliance/:id/validate - Validate code compliance
  fastify.patch(
    '/code-compliance/:id/validate',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(validateCodeComplianceSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof validateCodeComplianceSchema>
        const record = await validationService.validateCodeCompliance(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ record })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to validate code compliance'),
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/code-compliance - List code compliance records
  fastify.get(
    '/design-projects/:projectId/code-compliance',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const query = request.query as {
          codeStandard?: string
          complianceStatus?: string
        }
        const records = await validationService.listCodeComplianceRecords(projectId, query)
        return reply.send({ records })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to list code compliance records'),
        })
      }
    }
  )
}
