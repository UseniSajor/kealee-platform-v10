import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { stampService } from './stamp.service'

const createStampTemplateSchema = z.object({
  stampType: z.enum(['ARCHITECT', 'LANDSCAPE_ARCHITECT', 'INTERIOR_DESIGNER', 'STRUCTURAL_ENGINEER', 'MEP_ENGINEER', 'OTHER']),
  stampName: z.string().min(1),
  licenseNumber: z.string().min(1),
  licenseState: z.enum(['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC']),
  licenseExpirationDate: z.string().optional(),
  sealImageUrl: z.string().optional(),
  sealImageData: z.any().optional(),
  metadata: z.any().optional(),
})

const verifyStampTemplateSchema = z.object({
  isVerified: z.boolean(),
  verificationNotes: z.string().optional(),
})

const applyStampSchema = z.object({
  stampTemplateId: z.string().uuid(),
  targetType: z.string().min(1),
  targetId: z.string().uuid(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  positionData: z.any().optional(),
  scale: z.number().optional(),
  rotation: z.number().optional(),
})

const verifyStampApplicationSchema = z.object({
  isVerified: z.boolean(),
  verificationNotes: z.string().optional(),
})

const checkTamperingSchema = z.object({
  currentDocumentHash: z.string().min(1),
})

const validateLicenseSchema = z.object({
  licenseNumber: z.string().min(1),
  licenseState: z.enum(['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC']),
  licenseType: z.enum(['ARCHITECT', 'LANDSCAPE_ARCHITECT', 'INTERIOR_DESIGNER', 'STRUCTURAL_ENGINEER', 'MEP_ENGINEER', 'OTHER']),
  licenseeName: z.string().min(1),
})

export async function stampRoutes(fastify: FastifyInstance) {
  // POST /architect/stamp-templates - Create stamp template
  fastify.post(
    '/stamp-templates',
    {
      preHandler: [
        authenticateUser,
        validateBody(createStampTemplateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof createStampTemplateSchema>
        const template = await stampService.createStampTemplate({
          ...body,
          licenseExpirationDate: body.licenseExpirationDate ? new Date(body.licenseExpirationDate) : undefined,
          userId: user.id,
        })
        return reply.code(201).send({ template })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create stamp template',
        })
      }
    }
  )

  // GET /architect/stamp-templates/:id - Get stamp template
  fastify.get(
    '/stamp-templates/:id',
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
        const template = await stampService.getStampTemplate(id, user.id)
        return reply.send({ template })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Stamp template not found',
        })
      }
    }
  )

  // GET /architect/stamp-templates - List stamp templates
  fastify.get(
    '/stamp-templates',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const query = request.query as {
          stampType?: string
          licenseState?: string
          status?: string
          isVerified?: string
        }
        const templates = await stampService.listStampTemplates({
          userId: user.id,
          ...query,
          isVerified: query.isVerified === 'true' ? true : query.isVerified === 'false' ? false : undefined,
        })
        return reply.send({ templates })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list stamp templates',
        })
      }
    }
  )

  // POST /architect/stamp-templates/:id/verify - Verify stamp template
  fastify.post(
    '/stamp-templates/:id/verify',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(verifyStampTemplateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof verifyStampTemplateSchema>
        const template = await stampService.verifyStampTemplate(id, {
          ...body,
          verifiedBy: user.id,
        })
        return reply.send({ template })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to verify stamp template',
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/stamp-applications - Apply stamp
  fastify.post(
    '/design-projects/:projectId/stamp-applications',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(applyStampSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof applyStampSchema>
        const application = await stampService.applyStamp({
          designProjectId: projectId,
          ...body,
          appliedById: user.id,
        })
        return reply.code(201).send({ application })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to apply stamp',
        })
      }
    }
  )

  // GET /architect/stamp-applications/:id - Get stamp application
  fastify.get(
    '/stamp-applications/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const application = await stampService.getStampApplication(id)
        return reply.send({ application })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Stamp application not found',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/stamp-applications - List stamp applications
  fastify.get(
    '/design-projects/:projectId/stamp-applications',
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
          applicationStatus?: string
          stampTemplateId?: string
        }
        const applications = await stampService.listStampApplications(projectId, query)
        return reply.send({ applications })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list stamp applications',
        })
      }
    }
  )

  // POST /architect/stamp-applications/:id/verify - Verify stamp application
  fastify.post(
    '/stamp-applications/:id/verify',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(verifyStampApplicationSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof verifyStampApplicationSchema>
        const application = await stampService.verifyStampApplication(id, {
          ...body,
          verifiedById: user.id,
        })
        return reply.send({ application })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to verify stamp application',
        })
      }
    }
  )

  // POST /architect/stamp-applications/:id/check-tampering - Check for tampering
  fastify.post(
    '/stamp-applications/:id/check-tampering',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(checkTamperingSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof checkTamperingSchema>
        const result = await stampService.checkTampering(id, body.currentDocumentHash)
        return reply.send({ result })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to check tampering',
        })
      }
    }
  )

  // GET /architect/stamp-applications/:id/log - Get stamp log
  fastify.get(
    '/stamp-applications/:id/log',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const logEntries = await stampService.getStampLog(id)
        return reply.send({ logEntries })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get stamp log',
        })
      }
    }
  )

  // POST /architect/license-validations - Validate license
  fastify.post(
    '/license-validations',
    {
      preHandler: [
        authenticateUser,
        validateBody(validateLicenseSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof validateLicenseSchema>
        const validation = await stampService.validateLicense({
          ...body,
          userId: user.id,
        })
        return reply.code(201).send({ validation })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to validate license',
        })
      }
    }
  )

  // GET /architect/license-validations/:id - Get license validation
  fastify.get(
    '/license-validations/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const validation = await stampService.getLicenseValidation(id)
        return reply.send({ validation })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'License validation not found',
        })
      }
    }
  )

  // GET /architect/license-validations - List license validations
  fastify.get(
    '/license-validations',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const query = request.query as {
          licenseState?: string
          licenseType?: string
          isValid?: string
          status?: string
        }
        const validations = await stampService.listLicenseValidations({
          userId: user.id,
          ...query,
          isValid: query.isValid === 'true' ? true : query.isValid === 'false' ? false : undefined,
        })
        return reply.send({ validations })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list license validations',
        })
      }
    }
  )
}
