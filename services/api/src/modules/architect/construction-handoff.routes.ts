import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { constructionHandoffService } from './construction-handoff.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const generateIFCPackageSchema = z.object({
  packageName: z.string().min(1),
  description: z.string().optional(),
  drawingSheetIds: z.array(z.string().uuid()).optional(),
  includeAllDrawings: z.boolean().optional(),
  includeSpecifications: z.boolean().optional(),
})

const issueIFCPackageSchema = z.object({
  issueDate: z.string().optional(),
})

const generateBidPackageSchema = z.object({
  packageName: z.string().min(1),
  bidDueDate: z.string().optional(),
  description: z.string().optional(),
  ifcPackageId: z.string().uuid().optional(),
  includesIFCPackage: z.boolean().optional(),
  includesSpecifications: z.boolean().optional(),
})

const createContractorQuestionSchema = z.object({
  bidPackageId: z.string().uuid().optional(),
  questionText: z.string().min(1),
  questionCategory: z.string().optional(),
  relatedDocumentId: z.string().uuid().optional(),
  relatedSheetNumber: z.string().optional(),
  relatedSpecificationSection: z.string().optional(),
  isPublic: z.boolean().optional(),
})

const answerContractorQuestionSchema = z.object({
  answerText: z.string().min(1),
})

const createRFISchema = z.object({
  subject: z.string().min(1),
  questionText: z.string().min(1),
  questionCategory: z.string().optional(),
  priority: z.string().optional(),
  relatedDrawingId: z.string().uuid().optional(),
  relatedSheetNumber: z.string().optional(),
  relatedSpecificationSection: z.string().optional(),
  relatedRFIId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
})

const answerRFISchema = z.object({
  answerText: z.string().min(1),
})

const createSubmittalSchema = z.object({
  submittalName: z.string().min(1),
  submittalType: z.string().min(1),
  specificationSection: z.string().optional(),
  relatedDrawingId: z.string().uuid().optional(),
  relatedSheetNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  productName: z.string().optional(),
  modelNumber: z.string().optional(),
  description: z.string().optional(),
})

const reviewSubmittalSchema = z.object({
  reviewAction: z.string().min(1),
  reviewComments: z.string().optional(),
  requiredResubmission: z.boolean().optional(),
})

const createAsBuiltSchema = z.object({
  documentationName: z.string().min(1),
  documentationType: z.string().min(1),
  description: z.string().optional(),
})

const reviewAsBuiltSchema = z.object({
  reviewComments: z.string().optional(),
  requiredRevisions: z.boolean().optional(),
})

const approveAsBuiltSchema = z.object({})

export async function constructionHandoffRoutes(fastify: FastifyInstance) {
  // POST /architect/design-projects/:projectId/ifc-packages/generate - Generate IFC package
  fastify.post(
    '/design-projects/:projectId/ifc-packages/generate',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(generateIFCPackageSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof generateIFCPackageSchema>
        const package_ = await constructionHandoffService.generateIFCPackage({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ package: package_ })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to generate IFC package'),
        })
      }
    }
  )

  // POST /architect/ifc-packages/:id/issue - Issue IFC package
  fastify.post(
    '/ifc-packages/:id/issue',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(issueIFCPackageSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof issueIFCPackageSchema>
        const package_ = await constructionHandoffService.issueIFCPackage(id, {
          issuedById: user.id,
          issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
        })
        return reply.send({ package: package_ })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to issue IFC package'),
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/bid-packages/generate - Generate bid package
  fastify.post(
    '/design-projects/:projectId/bid-packages/generate',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(generateBidPackageSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof generateBidPackageSchema>
        const package_ = await constructionHandoffService.generateBidPackage({
          designProjectId: projectId,
          ...body,
          bidDueDate: body.bidDueDate ? new Date(body.bidDueDate) : undefined,
          createdById: user.id,
        })
        return reply.code(201).send({ package: package_ })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to generate bid package'),
        })
      }
    }
  )

  // POST /architect/contractor-questions - Create contractor question
  fastify.post(
    '/contractor-questions',
    {
      preHandler: [
        authenticateUser,
        validateBody(createContractorQuestionSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof createContractorQuestionSchema>
        const question = await constructionHandoffService.createContractorQuestion({
          ...body,
          askedById: user.id,
        })
        return reply.code(201).send({ question })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create contractor question'),
        })
      }
    }
  )

  // POST /architect/contractor-questions/:id/answer - Answer contractor question
  fastify.post(
    '/contractor-questions/:id/answer',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(answerContractorQuestionSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof answerContractorQuestionSchema>
        const question = await constructionHandoffService.answerContractorQuestion(id, {
          ...body,
          answeredById: user.id,
        })
        return reply.send({ question })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to answer contractor question'),
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/rfis - Create RFI
  fastify.post(
    '/design-projects/:projectId/rfis',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createRFISchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createRFISchema>
        const rfi = await constructionHandoffService.createRFI({
          designProjectId: projectId,
          ...body,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          submittedById: user.id,
        })
        return reply.code(201).send({ rfi })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create RFI'),
        })
      }
    }
  )

  // POST /architect/rfis/:id/answer - Answer RFI
  fastify.post(
    '/rfis/:id/answer',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(answerRFISchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof answerRFISchema>
        const rfi = await constructionHandoffService.answerRFI(id, {
          ...body,
          answeredById: user.id,
        })
        return reply.send({ rfi })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to answer RFI'),
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/submittals - Create submittal
  fastify.post(
    '/design-projects/:projectId/submittals',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createSubmittalSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createSubmittalSchema>
        const submittal = await constructionHandoffService.createSubmittal({
          designProjectId: projectId,
          ...body,
          submittedById: user.id,
        })
        return reply.code(201).send({ submittal })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create submittal'),
        })
      }
    }
  )

  // POST /architect/submittals/:id/review - Review submittal
  fastify.post(
    '/submittals/:id/review',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(reviewSubmittalSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof reviewSubmittalSchema>
        const submittal = await constructionHandoffService.reviewSubmittal(id, {
          ...body,
          reviewedById: user.id,
        })
        return reply.send({ submittal })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to review submittal'),
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/as-built - Create as-built documentation
  fastify.post(
    '/design-projects/:projectId/as-built',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createAsBuiltSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createAsBuiltSchema>
        const documentation = await constructionHandoffService.createAsBuiltDocumentation({
          designProjectId: projectId,
          ...body,
          submittedById: user.id,
        })
        return reply.code(201).send({ documentation })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create as-built documentation'),
        })
      }
    }
  )

  // POST /architect/as-built/:id/review - Review as-built documentation
  fastify.post(
    '/as-built/:id/review',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(reviewAsBuiltSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof reviewAsBuiltSchema>
        const documentation = await constructionHandoffService.reviewAsBuiltDocumentation(id, {
          ...body,
          reviewedById: user.id,
        })
        return reply.send({ documentation })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to review as-built documentation'),
        })
      }
    }
  )

  // POST /architect/as-built/:id/approve - Approve as-built documentation
  fastify.post(
    '/as-built/:id/approve',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(approveAsBuiltSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const documentation = await constructionHandoffService.approveAsBuiltDocumentation(id, {
          approvedById: user.id,
        })
        return reply.send({ documentation })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to approve as-built documentation'),
        })
      }
    }
  )
}
