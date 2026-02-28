import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { permitPackageService } from './permit-package.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const createPermitPackageSchema = z.object({
  jurisdictionId: z.string().uuid().optional(),
  packageName: z.string().min(1),
  packageType: z.enum(['BUILDING', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL', 'STRUCTURAL', 'DEMOLITION', 'SITE_WORK', 'COMBINED']),
  permitType: z.string().optional(),
  description: z.string().optional(),
})

const autoGeneratePermitPackageSchema = z.object({
  jurisdictionId: z.string().uuid().optional(),
  packageName: z.string().min(1),
  packageType: z.enum(['BUILDING', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL', 'STRUCTURAL', 'DEMOLITION', 'SITE_WORK', 'COMBINED']),
  permitType: z.string().optional(),
  drawingSheetIds: z.array(z.string().uuid()).optional(),
  includeAllDrawings: z.boolean().optional(),
})

const addDocumentSchema = z.object({
  documentType: z.enum(['DRAWING', 'SPECIFICATION', 'CALCULATION', 'SURVEY', 'APPLICATION_FORM', 'COVER_SHEET', 'INDEX', 'OTHER']),
  documentName: z.string().min(1),
  documentDescription: z.string().optional(),
  sheetNumber: z.string().optional(),
  discipline: z.string().optional(),
  sourceType: z.string().min(1),
  sourceId: z.string().uuid().optional(),
  sourceFileUrl: z.string().url().optional(),
  fileUrl: z.string().url().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().optional(),
  fileType: z.string().optional(),
  pageCount: z.number().int().optional(),
  isRequired: z.boolean().optional(),
  metadata: z.any().optional(),
})

const updateApplicationFormSchema = z.object({
  formData: z.any(),
  isComplete: z.boolean().optional(),
})

const verifyApplicationFormSchema = z.object({})

const submitPermitPackageSchema = z.object({
  submissionMethod: z.enum(['API', 'MANUAL', 'EMAIL']),
  submissionNotes: z.string().optional(),
})

const addReviewCommentSchema = z.object({
  commentType: z.string().min(1),
  commentText: z.string().min(1),
  commentCategory: z.string().optional(),
  severity: z.enum(['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL']).optional(),
  sheetNumber: z.string().optional(),
  pageNumber: z.number().int().optional(),
  coordinates: z.any().optional(),
  markupImageUrl: z.string().url().optional(),
  source: z.string().min(1),
  reviewerName: z.string().optional(),
  reviewerEmail: z.string().email().optional(),
})

const resolveReviewCommentSchema = z.object({
  resolutionNotes: z.string().optional(),
})

export async function permitPackageRoutes(fastify: FastifyInstance) {
  // POST /architect/design-projects/:projectId/permit-packages - Create permit package
  fastify.post(
    '/design-projects/:projectId/permit-packages',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createPermitPackageSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createPermitPackageSchema>
        const package_ = await permitPackageService.createPermitPackage({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ package: package_ })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create permit package'),
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/permit-packages/auto-generate - Auto-generate permit package
  fastify.post(
    '/design-projects/:projectId/permit-packages/auto-generate',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(autoGeneratePermitPackageSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof autoGeneratePermitPackageSchema>
        const package_ = await permitPackageService.autoGeneratePermitPackage({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ package: package_ })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to auto-generate permit package'),
        })
      }
    }
  )

  // GET /architect/permit-packages/:id - Get permit package
  fastify.get(
    '/permit-packages/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const package_ = await permitPackageService.getPermitPackage(id)
        return reply.send({ package: package_ })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: sanitizeErrorMessage(error, 'Permit package not found'),
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/permit-packages - List permit packages
  fastify.get(
    '/design-projects/:projectId/permit-packages',
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
          status?: string
          packageType?: string
        }
        const packages = await permitPackageService.listPermitPackages(projectId, query)
        return reply.send({ packages })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to list permit packages'),
        })
      }
    }
  )

  // POST /architect/permit-packages/:id/documents - Add document to package
  fastify.post(
    '/permit-packages/:id/documents',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(addDocumentSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof addDocumentSchema>
        const document = await permitPackageService.addDocumentToPackage(id, body)
        return reply.code(201).send({ document })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to add document to package'),
        })
      }
    }
  )

  // PATCH /architect/permit-application-forms/:id - Update application form
  fastify.patch(
    '/permit-application-forms/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateApplicationFormSchema as any),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateApplicationFormSchema>
        const form = await permitPackageService.updateApplicationForm(id, { ...body, formData: body.formData || {} } as any)
        return reply.send({ form })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to update application form'),
        })
      }
    }
  )

  // POST /architect/permit-application-forms/:id/verify - Verify application form
  fastify.post(
    '/permit-application-forms/:id/verify',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(verifyApplicationFormSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const form = await permitPackageService.verifyApplicationForm(id, {
          verifiedById: user.id,
        })
        return reply.send({ form })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to verify application form'),
        })
      }
    }
  )

  // POST /architect/permit-packages/:id/submit - Submit permit package
  fastify.post(
    '/permit-packages/:id/submit',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(submitPermitPackageSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof submitPermitPackageSchema>
        const result = await permitPackageService.submitPermitPackage(id, {
          ...body,
          submittedById: user.id,
        })
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to submit permit package'),
        })
      }
    }
  )

  // POST /architect/permit-packages/:id/sync - Sync permit package status
  fastify.post(
    '/permit-packages/:id/sync',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const status = await permitPackageService.syncPermitPackageStatus(id)
        return reply.send({ status })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to sync permit package status'),
        })
      }
    }
  )

  // POST /architect/permit-packages/:id/review-comments - Add review comment
  fastify.post(
    '/permit-packages/:id/review-comments',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(addReviewCommentSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof addReviewCommentSchema>
        const comment = await permitPackageService.addReviewComment(id, body)
        return reply.code(201).send({ comment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to add review comment'),
        })
      }
    }
  )

  // POST /architect/permit-package-review-comments/:id/resolve - Resolve review comment
  fastify.post(
    '/permit-package-review-comments/:id/resolve',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(resolveReviewCommentSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof resolveReviewCommentSchema>
        const comment = await permitPackageService.resolveReviewComment(id, {
          ...body,
          resolvedById: user.id,
        })
        return reply.send({ comment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to resolve review comment'),
        })
      }
    }
  )
}
