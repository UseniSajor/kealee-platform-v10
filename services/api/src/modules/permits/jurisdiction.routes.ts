import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { jurisdictionService } from './jurisdiction.service'

const createJurisdictionSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).regex(/^[A-Z0-9-]+$/),
  state: z.string().min(2).max(2),
  county: z.string().optional(),
  city: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  websiteUrl: z.string().url().optional(),
  serviceArea: z.any(), // GeoJSON
})

const updateSubscriptionTierSchema = z.object({
  subscriptionTier: z.enum(['BASIC', 'PROFESSIONAL', 'ENTERPRISE']),
  monthlyFee: z.number().positive(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_SETUP']),
})

export async function jurisdictionRoutes(fastify: FastifyInstance) {
  // POST /permits/jurisdictions - Create jurisdiction (onboarding)
  fastify.post(
    '/jurisdictions',
    {
      preHandler: [
        authenticateUser,
        validateBody(createJurisdictionSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof createJurisdictionSchema>
        const jurisdiction = await jurisdictionService.createJurisdiction({
          name: body.name,
          code: body.code,
          state: body.state,
          county: body.county,
          city: body.city,
          contactEmail: body.contactEmail,
          contactPhone: body.contactPhone,
          websiteUrl: body.websiteUrl,
          serviceArea: body.serviceArea,
          createdById: user.id,
        })
        return reply.code(201).send({ jurisdiction })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create jurisdiction',
        })
      }
    }
  )

  // GET /permits/jurisdictions - List jurisdictions
  fastify.get(
    '/jurisdictions',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          status?: string
          subscriptionTier?: string
          state?: string
          search?: string
        }
        const jurisdictions = await jurisdictionService.listJurisdictions(query)
        return reply.send({ jurisdictions })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list jurisdictions',
        })
      }
    }
  )

  // GET /permits/jurisdictions/:id - Get jurisdiction
  fastify.get(
    '/jurisdictions/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const jurisdiction = await jurisdictionService.getJurisdiction(id)
        return reply.send({ jurisdiction })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Jurisdiction not found',
        })
      }
    }
  )

  // PUT /permits/jurisdictions/:id/subscription - Update subscription tier
  fastify.put(
    '/jurisdictions/:id/subscription',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateSubscriptionTierSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateSubscriptionTierSchema>
        const jurisdiction = await jurisdictionService.updateSubscriptionTier(id, {
          ...body,
          updatedById: user.id,
        })
        return reply.send({ jurisdiction })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to update subscription',
        })
      }
    }
  )

  // POST /permits/jurisdictions/:id/regenerate-license - Regenerate license key
  fastify.post(
    '/jurisdictions/:id/regenerate-license',
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
        const jurisdiction = await jurisdictionService.regenerateLicenseKey(id, {
          updatedById: user.id,
        })
        return reply.send({ jurisdiction })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to regenerate license key',
        })
      }
    }
  )

  // POST /permits/jurisdictions/validate-license - Validate license key
  fastify.post(
    '/jurisdictions/validate-license',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({ licenseKey: z.string().min(1) })),
      ],
    },
    async (request, reply) => {
      try {
        const { licenseKey } = request.body as { licenseKey: string }
        const result = await jurisdictionService.validateLicenseKey(licenseKey)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to validate license key',
        })
      }
    }
  )

  // GET /permits/jurisdictions/:id/metrics - Get usage metrics dashboard
  fastify.get(
    '/jurisdictions/:id/metrics',
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
          year?: string
          month?: string
        }
        const metrics = await jurisdictionService.getUsageMetrics(id, {
          year: query.year ? parseInt(query.year) : undefined,
          month: query.month ? parseInt(query.month) : undefined,
        })
        return reply.send(metrics)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get usage metrics',
        })
      }
    }
  )

  // PUT /permits/jurisdictions/:id/status - Update jurisdiction status
  fastify.put(
    '/jurisdictions/:id/status',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateStatusSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateStatusSchema>
        const jurisdiction = await jurisdictionService.updateStatus(id, {
          ...body,
          updatedById: user.id,
        })
        return reply.send({ jurisdiction })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to update status',
        })
      }
    }
  )
}
