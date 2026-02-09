/**
 * Permit Template Routes
 * CRUD for PermitTemplate, JurisdictionFormTemplate, ExpeditedPermitService,
 * PermitNotification, RemoteInspection
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma } from '@kealee/database'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const permitTemplateCreateSchema = z.object({
  jurisdictionId: z.string().uuid(),
  templateName: z.string().min(1),
  permitType: z.string().min(1),
  templateData: z.any(),
  isActive: z.boolean().optional(),
})

const permitTemplateUpdateSchema = z.object({
  templateName: z.string().min(1).optional(),
  permitType: z.string().min(1).optional(),
  templateData: z.any().optional(),
  isActive: z.boolean().optional(),
})

const formTemplateCreateSchema = z.object({
  jurisdictionId: z.string().uuid(),
  permitType: z.string().min(1),
  formName: z.string().min(1),
  formVersion: z.string().optional(),
  formCode: z.string().optional(),
  formSchema: z.any(),
  fieldMappings: z.any(),
  validationRules: z.any(),
  templateUrl: z.string().url().optional(),
  generationMethod: z.string().min(1),
})

const expeditedServiceCreateSchema = z.object({
  permitApplicationId: z.string().uuid(),
  serviceType: z.string().min(1),
  jurisdictionFee: z.number().min(0),
  kealeeMarkup: z.number().min(0),
  totalCharge: z.number().min(0),
  guaranteedDays: z.number().int().min(1),
})

const notificationSendSchema = z.object({
  permitId: z.string().uuid(),
  permitApplicationId: z.string().uuid().optional(),
  notificationType: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  recipientId: z.string().uuid(),
  recipientEmail: z.string().email().optional(),
  deliveryMethod: z.array(z.string()).optional(),
})

const remoteInspectionCreateSchema = z.object({
  inspectionId: z.string().uuid(),
  sessionId: z.string().min(1),
  startedAt: z.string().datetime(),
  inspectorId: z.string().uuid(),
  contractorName: z.string().optional(),
  contractorPhone: z.string().optional(),
  participants: z.any(),
})

const remoteInspectionUpdateSchema = z.object({
  endedAt: z.string().datetime().optional(),
  duration: z.number().int().optional(),
  recordingUrl: z.string().url().optional(),
  recordingSize: z.number().int().optional(),
  videoQuality: z.string().optional(),
  connectionIssues: z.boolean().optional(),
  aiAnalysis: z.any().optional(),
  aiConfidence: z.number().optional(),
  manualOverride: z.boolean().optional(),
  qaReviewed: z.boolean().optional(),
})

const paginationQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function permitTemplateRoutes(fastify: FastifyInstance) {
  // Apply auth to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // ========================================================================
  // PERMIT TEMPLATES
  // ========================================================================

  // GET /templates - List permit templates
  fastify.get(
    '/templates',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            jurisdictionId: z.string().uuid().optional(),
            permitType: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; jurisdictionId?: string; permitType?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.jurisdictionId) where.jurisdictionId = query.jurisdictionId
        if (query.permitType) where.permitType = query.permitType

        const [templates, total] = await Promise.all([
          (prisma as any).permitTemplate.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { jurisdiction: { select: { id: true, name: true } } },
          }),
          (prisma as any).permitTemplate.count({ where }),
        ])

        return reply.send({
          data: templates,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list permit templates' })
      }
    }
  )

  // POST /templates - Create permit template
  fastify.post(
    '/templates',
    {
      preHandler: [validateBody(permitTemplateCreateSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof permitTemplateCreateSchema>

        const template = await (prisma as any).permitTemplate.create({
          data: {
            ...body,
            createdById: user.id,
          },
        })

        return reply.code(201).send({ data: template })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create permit template' })
      }
    }
  )

  // PATCH /templates/:id - Update permit template
  fastify.patch(
    '/templates/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(permitTemplateUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof permitTemplateUpdateSchema>

        const updated = await (prisma as any).permitTemplate.update({
          where: { id },
          data: body,
        })

        return reply.send({ data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to update permit template' })
      }
    }
  )

  // ========================================================================
  // FORM TEMPLATES
  // ========================================================================

  // GET /form-templates - List form templates
  fastify.get(
    '/form-templates',
    {
      preHandler: [validateQuery(paginationQuery)],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const [templates, total] = await Promise.all([
          (prisma as any).jurisdictionFormTemplate.findMany({
            where: { isActive: true },
            skip,
            take: limit,
            orderBy: { lastUpdated: 'desc' },
          }),
          (prisma as any).jurisdictionFormTemplate.count({ where: { isActive: true } }),
        ])

        return reply.send({
          data: templates,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list form templates' })
      }
    }
  )

  // POST /form-templates - Create form template
  fastify.post(
    '/form-templates',
    {
      preHandler: [validateBody(formTemplateCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof formTemplateCreateSchema>

        const template = await (prisma as any).jurisdictionFormTemplate.create({
          data: body,
        })

        return reply.code(201).send({ data: template })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create form template' })
      }
    }
  )

  // ========================================================================
  // EXPEDITED SERVICES
  // ========================================================================

  // GET /expedited-services - List expedited services
  fastify.get(
    '/expedited-services',
    {
      preHandler: [validateQuery(paginationQuery)],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const [services, total] = await Promise.all([
          (prisma as any).expeditedPermitService.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).expeditedPermitService.count(),
        ])

        return reply.send({
          data: services,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list expedited services' })
      }
    }
  )

  // POST /expedited-services - Create expedited service
  fastify.post(
    '/expedited-services',
    {
      preHandler: [validateBody(expeditedServiceCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof expeditedServiceCreateSchema>

        const service = await (prisma as any).expeditedPermitService.create({
          data: body,
        })

        return reply.code(201).send({ data: service })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create expedited service' })
      }
    }
  )

  // ========================================================================
  // PERMIT NOTIFICATIONS
  // ========================================================================

  // GET /notifications - List permit notifications (filter by permitId)
  fastify.get(
    '/notifications',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            permitId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; permitId?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.permitId) where.permitId = query.permitId

        const [notifications, total] = await Promise.all([
          (prisma as any).permitNotification.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).permitNotification.count({ where }),
        ])

        return reply.send({
          data: notifications,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list notifications' })
      }
    }
  )

  // POST /notifications/send - Send permit notification
  fastify.post(
    '/notifications/send',
    {
      preHandler: [validateBody(notificationSendSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof notificationSendSchema>

        const notification = await (prisma as any).permitNotification.create({
          data: {
            ...body,
            deliveryMethod: body.deliveryMethod ?? ['IN_APP'],
            sent: true,
            sentAt: new Date(),
            inAppSent: true,
          },
        })

        return reply.code(201).send({ data: notification })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to send notification' })
      }
    }
  )

  // ========================================================================
  // REMOTE INSPECTIONS
  // ========================================================================

  // GET /remote-inspections - List remote inspections
  fastify.get(
    '/remote-inspections',
    {
      preHandler: [validateQuery(paginationQuery)],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const [inspections, total] = await Promise.all([
          (prisma as any).remoteInspection.findMany({
            skip,
            take: limit,
            orderBy: { startedAt: 'desc' },
          }),
          (prisma as any).remoteInspection.count(),
        ])

        return reply.send({
          data: inspections,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list remote inspections' })
      }
    }
  )

  // POST /remote-inspections - Create remote inspection
  fastify.post(
    '/remote-inspections',
    {
      preHandler: [validateBody(remoteInspectionCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof remoteInspectionCreateSchema>

        const inspection = await (prisma as any).remoteInspection.create({
          data: {
            ...body,
            startedAt: new Date(body.startedAt),
          },
        })

        return reply.code(201).send({ data: inspection })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create remote inspection' })
      }
    }
  )

  // PATCH /remote-inspections/:id - Update remote inspection
  fastify.patch(
    '/remote-inspections/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(remoteInspectionUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof remoteInspectionUpdateSchema>

        const updated = await (prisma as any).remoteInspection.update({
          where: { id },
          data: {
            ...body,
            endedAt: body.endedAt ? new Date(body.endedAt) : undefined,
          },
        })

        return reply.send({ data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to update remote inspection' })
      }
    }
  )
}
