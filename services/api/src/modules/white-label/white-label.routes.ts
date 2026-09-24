import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireAdmin } from '../../middleware/auth.middleware'
import { requireTenantSupportAccess } from '../../middleware/tenant-support-access'
import {
  createEvaluationSuiteSchema,
  createSupportAccessSchema,
  createTenantDomainSchema,
  createWhiteLabelTenantSchema,
  recordTenantUsageSchema,
  updateDeploymentSchema,
  updateSupportAccessSchema,
  updateTenantDomainSchema,
  updateTenantPlanSchema,
  updateTenantProductsSchema,
  updateWhiteLabelProfileSchema,
  usageQuerySchema,
  whiteLabelStatusSchema,
  whiteLabelTierSchema,
} from './white-label.dto'
import {
  createEvaluationSuite,
  createSupportAccess,
  createTenantDomain,
  createWhiteLabelTenant,
  deleteTenantDomain,
  getTenantDeployment,
  getTenantUsage,
  getWhiteLabelTenant,
  listEvaluationSuites,
  listProductTemplates,
  listSupportAccess,
  listTenantDomains,
  listWhiteLabelTenants,
  queueEvaluationRun,
  recordTenantUsage,
  replaceTenantProducts,
  updateSupportAccess,
  updateTenantDomain,
  updateWhiteLabelProfile,
  upsertTenantDeployment,
  upsertTenantPlan,
  type TenantActor,
} from './white-label.service'

const tenantParams = z.object({ tenantId: z.string().uuid() })
const domainParams = tenantParams.extend({ domainId: z.string().uuid() })
const suiteParams = tenantParams.extend({ suiteId: z.string().uuid() })
const supportParams = tenantParams.extend({ sessionId: z.string().uuid() })

function actorFrom(request: FastifyRequest): TenantActor {
  const user = (request as any).user
  return {
    userId: user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  }
}

export async function whiteLabelRoutes(fastify: FastifyInstance) {
  const platformAdmin = { preHandler: [authenticateUser, requireAdmin] }

  fastify.get('/products', platformAdmin, async () => ({ products: await listProductTemplates() }))

  fastify.get('/tenants', platformAdmin, async (request) => {
    const query = z.object({
      search: z.string().trim().optional(),
      status: whiteLabelStatusSchema.optional(),
      tier: whiteLabelTierSchema.optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(25),
    }).parse(request.query)
    return listWhiteLabelTenants(query)
  })

  fastify.post('/tenants', platformAdmin, async (request, reply) => {
    const input = createWhiteLabelTenantSchema.parse(request.body)
    const tenant = await createWhiteLabelTenant(input, actorFrom(request))
    return reply.code(201).send({ tenant })
  })

  fastify.get('/tenants/:tenantId', platformAdmin, async (request) => {
    const { tenantId } = tenantParams.parse(request.params)
    return { tenant: await getWhiteLabelTenant(tenantId) }
  })

  fastify.patch('/tenants/:tenantId/profile', platformAdmin, async (request) => {
    const { tenantId } = tenantParams.parse(request.params)
    const input = updateWhiteLabelProfileSchema.parse(request.body)
    return { profile: await updateWhiteLabelProfile(tenantId, input, actorFrom(request)) }
  })

  fastify.get('/tenants/:tenantId/domains', platformAdmin, async (request) => {
    const { tenantId } = tenantParams.parse(request.params)
    return { domains: await listTenantDomains(tenantId) }
  })

  fastify.post('/tenants/:tenantId/domains', platformAdmin, async (request, reply) => {
    const { tenantId } = tenantParams.parse(request.params)
    const input = createTenantDomainSchema.parse(request.body)
    const domain = await createTenantDomain(tenantId, input, actorFrom(request))
    return reply.code(201).send({ domain })
  })

  fastify.patch('/tenants/:tenantId/domains/:domainId', platformAdmin, async (request) => {
    const { tenantId, domainId } = domainParams.parse(request.params)
    const input = updateTenantDomainSchema.parse(request.body)
    return { domain: await updateTenantDomain(tenantId, domainId, input, actorFrom(request)) }
  })

  fastify.delete('/tenants/:tenantId/domains/:domainId', platformAdmin, async (request, reply) => {
    const { tenantId, domainId } = domainParams.parse(request.params)
    await deleteTenantDomain(tenantId, domainId, actorFrom(request))
    return reply.code(204).send()
  })

  fastify.put('/tenants/:tenantId/products', platformAdmin, async (request) => {
    const { tenantId } = tenantParams.parse(request.params)
    const input = updateTenantProductsSchema.parse(request.body)
    return { products: await replaceTenantProducts(tenantId, input, actorFrom(request)) }
  })

  fastify.get('/tenants/:tenantId/plan', platformAdmin, async (request) => {
    const { tenantId } = tenantParams.parse(request.params)
    const tenant = await getWhiteLabelTenant(tenantId)
    return { plan: tenant.plan }
  })

  fastify.patch('/tenants/:tenantId/plan', platformAdmin, async (request) => {
    const { tenantId } = tenantParams.parse(request.params)
    const input = updateTenantPlanSchema.parse(request.body)
    return { plan: await upsertTenantPlan(tenantId, input, actorFrom(request)) }
  })

  fastify.get('/tenants/:tenantId/usage', platformAdmin, async (request) => {
    const { tenantId } = tenantParams.parse(request.params)
    const query = usageQuerySchema.parse(request.query)
    return { usage: await getTenantUsage(tenantId, query) }
  })

  fastify.post('/tenants/:tenantId/usage/events', platformAdmin, async (request, reply) => {
    const { tenantId } = tenantParams.parse(request.params)
    const input = recordTenantUsageSchema.parse(request.body)
    const event = await recordTenantUsage(tenantId, input)
    return reply.code(201).send({ event })
  })

  fastify.get('/tenants/:tenantId/deployment', platformAdmin, async (request) => {
    const { tenantId } = tenantParams.parse(request.params)
    return { deployment: await getTenantDeployment(tenantId) }
  })

  fastify.patch('/tenants/:tenantId/deployment', platformAdmin, async (request) => {
    const { tenantId } = tenantParams.parse(request.params)
    const input = updateDeploymentSchema.parse(request.body)
    return { deployment: await upsertTenantDeployment(tenantId, input, actorFrom(request)) }
  })

  fastify.get('/tenants/:tenantId/evaluations', platformAdmin, async (request) => {
    const { tenantId } = tenantParams.parse(request.params)
    return { evaluationSuites: await listEvaluationSuites(tenantId) }
  })

  fastify.post('/tenants/:tenantId/evaluations', platformAdmin, async (request, reply) => {
    const { tenantId } = tenantParams.parse(request.params)
    const input = createEvaluationSuiteSchema.parse(request.body)
    const evaluationSuite = await createEvaluationSuite(tenantId, input, actorFrom(request))
    return reply.code(201).send({ evaluationSuite })
  })

  fastify.post('/tenants/:tenantId/evaluations/:suiteId/runs', platformAdmin, async (request, reply) => {
    const { tenantId, suiteId } = suiteParams.parse(request.params)
    const run = await queueEvaluationRun(tenantId, suiteId, actorFrom(request))
    return reply.code(202).send({ run })
  })

  fastify.get('/tenants/:tenantId/support-access', platformAdmin, async (request) => {
    const { tenantId } = tenantParams.parse(request.params)
    return { supportAccess: await listSupportAccess(tenantId) }
  })

  fastify.post('/tenants/:tenantId/support-access', platformAdmin, async (request, reply) => {
    const { tenantId } = tenantParams.parse(request.params)
    const input = createSupportAccessSchema.parse(request.body)
    const supportAccess = await createSupportAccess(tenantId, input, actorFrom(request))
    return reply.code(201).send({ supportAccess })
  })

  fastify.patch('/tenants/:tenantId/support-access/:sessionId', platformAdmin, async (request) => {
    const { tenantId, sessionId } = supportParams.parse(request.params)
    const input = updateSupportAccessSchema.parse(request.body)
    return { supportAccess: await updateSupportAccess(tenantId, sessionId, input, actorFrom(request)) }
  })

  // Entry into a customer's runtime context is deliberately separate from
  // ordinary control-plane administration and requires an active session.
  fastify.get(
    '/support/:tenantId/context',
    { preHandler: [authenticateUser, requireAdmin, requireTenantSupportAccess('TENANT_READ')] },
    async (request) => {
      const { tenantId } = tenantParams.parse(request.params)
      const tenant = await getWhiteLabelTenant(tenantId)
      return {
        supportContext: {
          session: request.tenantSupportAccess,
          tenant: {
            profile: tenant.profile,
            domains: tenant.domains,
            products: tenant.products,
            deployment: tenant.deployment,
          },
        },
      }
    },
  )
}
