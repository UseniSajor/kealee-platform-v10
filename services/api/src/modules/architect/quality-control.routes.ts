import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { qualityControlService } from './quality-control.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const createChecklistTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  phase: z.string().optional(),
  projectType: z.string().optional(),
  items: z.array(z.any()).min(1),
  isDefault: z.boolean().optional(),
})

const createChecklistSchema = z.object({
  phaseId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  checklistName: z.string().min(1),
  phase: z.string().optional(),
  items: z.array(z.any()).optional(),
})

const updateChecklistItemStatusSchema = z.object({
  itemStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'EXEMPT']),
  checkNotes: z.string().optional(),
  result: z.string().optional(),
  evidenceFileIds: z.array(z.string().uuid()).optional(),
})

const createRandomSampleCheckSchema = z.object({
  checkName: z.string().min(1),
  checkDescription: z.string().optional(),
  targetType: z.string().min(1),
  targetId: z.string().uuid().optional(),
  sampleSize: z.number().int().min(1),
  sampleMethod: z.enum(['RANDOM', 'STRATIFIED', 'SYSTEMATIC']).optional(),
})

const reportErrorSchema = z.object({
  checklistItemId: z.string().uuid().optional(),
  checkId: z.string().uuid().optional(),
  errorCategory: z.enum(['DIMENSIONAL', 'SPECIFICATION', 'CODE_COMPLIANCE', 'COORDINATION', 'DOCUMENTATION', 'STANDARDS', 'OTHER']),
  errorSeverity: z.enum(['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL']),
  errorDescription: z.string().min(1),
  errorLocation: z.string().optional(),
  errorDetails: z.any().optional(),
  affectedItems: z.array(z.string()).optional(),
  evidenceFileIds: z.array(z.string().uuid()).optional(),
})

const resolveErrorSchema = z.object({
  resolutionNotes: z.string().optional(),
})

const createCorrectiveActionSchema = z.object({
  actionDescription: z.string().min(1),
  actionType: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
})

const updateCorrectiveActionStatusSchema = z.object({
  actionStatus: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CANCELLED']),
  completionNotes: z.string().optional(),
  evidenceFileIds: z.array(z.string().uuid()).optional(),
})

const verifyCorrectiveActionSchema = z.object({
  verificationNotes: z.string().optional(),
})

const createImprovementFeedbackSchema = z.object({
  feedbackType: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().optional(),
  relatedChecklistId: z.string().uuid().optional(),
  relatedErrorId: z.string().uuid().optional(),
  relatedPhase: z.string().optional(),
  impactLevel: z.string().optional(),
  estimatedBenefit: z.string().optional(),
})

export async function qualityControlRoutes(fastify: FastifyInstance) {
  // POST /architect/qc-checklist-templates - Create QC checklist template
  fastify.post(
    '/qc-checklist-templates',
    {
      preHandler: [
        authenticateUser,
        validateBody(createChecklistTemplateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof createChecklistTemplateSchema>
        const template = await qualityControlService.createQCChecklistTemplate({
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ template })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create QC checklist template'),
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/qc-checklists - Create QC checklist
  fastify.post(
    '/design-projects/:projectId/qc-checklists',
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
        const checklist = await qualityControlService.createQCChecklist({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ checklist })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create QC checklist'),
        })
      }
    }
  )

  // GET /architect/qc-checklists/:id - Get QC checklist
  fastify.get(
    '/qc-checklists/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const checklist = await qualityControlService.getQCChecklist(id)
        return reply.send({ checklist })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: sanitizeErrorMessage(error, 'QC checklist not found'),
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/qc-checklists - List QC checklists
  fastify.get(
    '/design-projects/:projectId/qc-checklists',
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
          phaseId?: string
          phase?: string
          status?: string
        }
        const checklists = await qualityControlService.listQCChecklists(projectId, query)
        return reply.send({ checklists })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to list QC checklists'),
        })
      }
    }
  )

  // PATCH /architect/qc-checklist-items/:id/status - Update checklist item status
  fastify.patch(
    '/qc-checklist-items/:id/status',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateChecklistItemStatusSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateChecklistItemStatusSchema>
        const item = await qualityControlService.updateChecklistItemStatus(id, {
          ...body,
          checkedById: user.id,
        })
        return reply.send({ item })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to update checklist item status'),
        })
      }
    }
  )

  // POST /architect/qc-checklists/:id/random-sample-check - Create random sample check
  fastify.post(
    '/qc-checklists/:id/random-sample-check',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(createRandomSampleCheckSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof createRandomSampleCheckSchema>
        const check = await qualityControlService.createRandomSampleCheck({
          checklistId: id,
          ...body,
          checkedById: user.id,
        })
        return reply.code(201).send({ check })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create random sample check'),
        })
      }
    }
  )

  // POST /architect/qc-checklists/:id/errors - Report QC error
  fastify.post(
    '/qc-checklists/:id/errors',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(reportErrorSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof reportErrorSchema>
        const error = await qualityControlService.reportQCError({
          checklistId: id,
          ...body,
          reportedById: user.id,
        })
        return reply.code(201).send({ error })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to report QC error'),
        })
      }
    }
  )

  // POST /architect/qc-errors/:id/resolve - Resolve QC error
  fastify.post(
    '/qc-errors/:id/resolve',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(resolveErrorSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof resolveErrorSchema>
        const error = await qualityControlService.resolveQCError(id, {
          ...body,
          resolvedById: user.id,
        })
        return reply.send({ error })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to resolve QC error'),
        })
      }
    }
  )

  // POST /architect/qc-errors/:id/corrective-actions - Create corrective action
  fastify.post(
    '/qc-errors/:id/corrective-actions',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(createCorrectiveActionSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof createCorrectiveActionSchema>
        const action = await qualityControlService.createCorrectiveAction({
          errorId: id,
          ...body,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          assignedById: user.id,
        })
        return reply.code(201).send({ action })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create corrective action'),
        })
      }
    }
  )

  // PATCH /architect/corrective-actions/:id/status - Update corrective action status
  fastify.patch(
    '/corrective-actions/:id/status',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateCorrectiveActionStatusSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateCorrectiveActionStatusSchema>
        const action = await qualityControlService.updateCorrectiveActionStatus(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ action })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to update corrective action status'),
        })
      }
    }
  )

  // POST /architect/corrective-actions/:id/verify - Verify corrective action
  fastify.post(
    '/corrective-actions/:id/verify',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(verifyCorrectiveActionSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof verifyCorrectiveActionSchema>
        const action = await qualityControlService.verifyCorrectiveAction(id, {
          ...body,
          verifiedById: user.id,
        })
        return reply.send({ action })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to verify corrective action'),
        })
      }
    }
  )

  // GET /architect/qc-checklists/:id/metrics - Get QC metrics
  fastify.get(
    '/qc-checklists/:id/metrics',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const metrics = await qualityControlService.getQCMetrics(id)
        return reply.send({ metrics })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to get QC metrics'),
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/qc-improvement-feedback - Create improvement feedback
  fastify.post(
    '/design-projects/:projectId/qc-improvement-feedback',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createImprovementFeedbackSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createImprovementFeedbackSchema>
        const feedback = await qualityControlService.createImprovementFeedback({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ feedback })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create improvement feedback'),
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/qc-improvement-feedback - List improvement feedback
  fastify.get(
    '/design-projects/:projectId/qc-improvement-feedback',
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
          feedbackType?: string
          isImplemented?: string
          category?: string
        }
        const feedback = await qualityControlService.listImprovementFeedback(projectId, {
          ...query,
          isImplemented: query.isImplemented === 'true' ? true : query.isImplemented === 'false' ? false : undefined,
        })
        return reply.send({ feedback })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to list improvement feedback'),
        })
      }
    }
  )

  // POST /architect/qc-improvement-feedback/:id/implement - Mark feedback as implemented
  fastify.post(
    '/qc-improvement-feedback/:id/implement',
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
        const feedback = await qualityControlService.implementImprovementFeedback(id, {
          implementedById: user.id,
        })
        return reply.send({ feedback })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to implement improvement feedback'),
        })
      }
    }
  )
}
