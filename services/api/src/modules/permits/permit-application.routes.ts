import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { permitApplicationService } from './permit-application.service'

const createApplicationSchema = z.object({
  jurisdictionId: z.string(),
  permitType: z.enum(['BUILDING', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL', 'FIRE', 'GRADING', 'DEMOLITION', 'SIGN', 'FENCE', 'ROOFING']),
  projectData: z.object({
    address: z.string().min(1),
    parcelId: z.string().optional(),
    valuation: z.number().positive(),
    scope: z.string().min(1),
    ownerName: z.string().optional(),
    contractorName: z.string().optional(),
    contractorLicense: z.string().optional(),
    squareFootage: z.number().positive().optional(),
  }),
  documents: z.array(z.object({
    type: z.string().min(1),
    url: z.string().url(),
  })),
  expedited: z.boolean().optional().default(false),
})

const createApplicationLegacySchema = z.object({
  jurisdictionId: z.string().uuid(),
})

const updateStepSchema = z.object({
  stepNumber: z.number().int().min(1).max(10),
  stepData: z.any(),
  completed: z.boolean().optional(),
})

const setProjectTypeSchema = z.object({
  projectType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MIXED_USE', 'INSTITUTIONAL', 'OTHER']),
  permitType: z.string().min(1),
  conditionalAnswers: z.record(z.any()).optional(),
})

const lookupPropertySchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().min(5),
  parcelNumber: z.string().optional(),
})

const setProjectDetailsSchema = z.object({
  projectDescription: z.string().min(1),
  valuation: z.number().positive(),
  squareFootage: z.number().positive().optional(),
  unitCount: z.number().int().positive().optional(),
})

const uploadDocumentSchema = z.object({
  documentType: z.string().min(1),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
})

export async function permitApplicationRoutes(fastify: FastifyInstance) {
  // POST /permits/applications - Create and submit new application (streamlined)
  fastify.post(
    '/applications',
    {
      preHandler: [
        authenticateUser,
        validateBody(createApplicationSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof createApplicationSchema>
        const result = await permitApplicationService.createAndSubmitApplication({
          ...body,
          submittedById: user.id,
        })
        return reply.code(201).send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create and submit application',
        })
      }
    }
  )

  // GET /permits/applications - List user's applications
  fastify.get(
    '/applications',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const query = request.query as {
          jurisdictionId?: string
          status?: string
        }
        const applications = await permitApplicationService.listApplications({
          applicantId: user.id,
          ...query,
        })
        return reply.send({ applications })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list applications',
        })
      }
    }
  )

  // GET /permits/applications/:id - Get application
  fastify.get(
    '/applications/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const application = await permitApplicationService.getApplication(id)
        return reply.send({ application })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Application not found',
        })
      }
    }
  )

  // PUT /permits/applications/:id/steps/:stepNumber - Update step
  fastify.put(
    '/applications/:id/steps/:stepNumber',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({
          id: z.string(),
          stepNumber: z.string(),
        })),
        validateBody(updateStepSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id, stepNumber } = request.params as { id: string; stepNumber: string }
        const body = request.body as z.infer<typeof updateStepSchema>
        const step = await permitApplicationService.updateStep(id, {
          ...body,
          stepNumber: parseInt(stepNumber),
        })
        return reply.send({ step })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to update step',
        })
      }
    }
  )

  // POST /permits/applications/:id/project-type - Set project type (Step 1)
  fastify.post(
    '/applications/:id/project-type',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
        validateBody(setProjectTypeSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof setProjectTypeSchema>
        const application = await permitApplicationService.setProjectType(id, body)
        return reply.send({ application })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to set project type',
        })
      }
    }
  )

  // POST /permits/applications/:id/property-lookup - Lookup property (Step 2)
  fastify.post(
    '/applications/:id/property-lookup',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
        validateBody(lookupPropertySchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof lookupPropertySchema>
        const result = await permitApplicationService.lookupProperty(id, body)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to lookup property',
        })
      }
    }
  )

  // POST /permits/applications/:id/project-details - Set project details (Step 3)
  fastify.post(
    '/applications/:id/project-details',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
        validateBody(setProjectDetailsSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof setProjectDetailsSchema>
        const application = await permitApplicationService.setProjectDetails(id, body)
        return reply.send({ application })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to set project details',
        })
      }
    }
  )

  // GET /permits/applications/:id/required-documents - Get required documents (Step 4)
  fastify.get(
    '/applications/:id/required-documents',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const documents = await permitApplicationService.getRequiredDocuments(id)
        return reply.send({ documents })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get required documents',
        })
      }
    }
  )

  // POST /permits/applications/:id/documents - Upload document
  fastify.post(
    '/applications/:id/documents',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
        validateBody(uploadDocumentSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof uploadDocumentSchema>
        const application = await permitApplicationService.uploadDocument(id, {
          ...body,
          uploadedById: user.id,
        })
        return reply.code(201).send({ application })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to upload document',
        })
      }
    }
  )

  // POST /permits/applications/:id/save - Save application (auto-save)
  fastify.post(
    '/applications/:id/save',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const application = await permitApplicationService.saveApplication(id)
        return reply.send({ application })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to save application',
        })
      }
    }
  )

  // POST /permits/applications/:id/submit - Submit application
  fastify.post(
    '/applications/:id/submit',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const result = await permitApplicationService.submitApplication(id, {
          submittedById: user.id,
        })
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to submit application',
        })
      }
    }
  )
}
