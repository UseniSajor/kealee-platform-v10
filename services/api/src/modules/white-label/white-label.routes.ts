import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requirePlatformAdmin, requireSelectedOrganizationRole } from '../../middleware/auth.middleware'
import { isPlatformRole } from '../../middleware/tenant-context'
import { requireTenantSupportAccess } from '../../middleware/tenant-support-access'
import {
  createEvaluationSuiteSchema,
  createSupportAccessSchema,
  createTenantDataRequestSchema,
  createTenantDomainSchema,
  createWhiteLabelTenantSchema,
  recordTenantUsageSchema,
  reconcileUsageSchema,
  cancelTenantDataRequestSchema,
  executeTenantDeletionSchema,
  reviewTenantDataRequestSchema,
  updateDeploymentSchema,
  updateSupportAccessSchema,
  updateTenantDomainSchema,
  updateTenantAdminProfileSchema,
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
  resolvePublicTenantContext,
  updateSupportAccess,
  updateTenantDomain,
  updateWhiteLabelProfile,
  upsertTenantDeployment,
  upsertTenantPlan,
  type TenantActor,
} from './white-label.service'
import { reconcileTenantUsage } from './white-label-metering.service'
import { executeTenantEvaluationRun } from './white-label-evaluation.service'
import { deprovisionTenantDomain, provisionTenantDomain, verifyProvisionedTenantDomain } from './white-label-domain.service'
import {
  cancelTenantDataRequest,
  createTenantDataRequest,
  executeTenantDataDeletion,
  executeTenantDataExport,
  executeTenantRetentionChange,
  getTenantDataExport,
  listTenantDataRequests,
  purgeExpiredTenantExports,
  reviewTenantDataRequest,
} from './white-label-data-lifecycle.service'

const tenantParams = z.object({ tenantId: z.string().uuid() })
const domainParams = tenantParams.extend({ domainId: z.string().uuid() })
const suiteParams = tenantParams.extend({ suiteId: z.string().uuid() })
const supportParams = tenantParams.extend({ sessionId: z.string().uuid() })
const runParams = suiteParams.extend({ runId: z.string().uuid() })
const selfDataRequestParams = z.object({ requestId: z.string().uuid() })
const tenantDataRequestParams = tenantParams.extend({ requestId: z.string().uuid() })

function actorFrom(request: FastifyRequest): TenantActor {
  const user = (request as any).user
  return {
    userId: user.id,
    actorType: isPlatformRole(user.platformRole || user.role) ? 'PLATFORM_ADMIN' : 'TENANT_ADMIN',
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  }
}

function lifecycleActorFrom(request: FastifyRequest, actorType: 'PLATFORM_ADMIN' | 'TENANT_ADMIN') {
  return { ...actorFrom(request), actorType }
}

export async function whiteLabelRoutes(fastify: FastifyInstance) {
  const platformAdmin = { preHandler: [authenticateUser, requirePlatformAdmin] }
  const requireDelegatedTenantAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user
    const tenant = await getWhiteLabelTenant(user.organizationId)
    if (!tenant.profile.clientAdminEnabled) {
      return reply.code(403).send({ error: 'Delegated tenant administration is not enabled' })
    }
  }
  const tenantAdmin = {
    preHandler: [
      authenticateUser,
      requireSelectedOrganizationRole(['org_owner', 'org_admin', 'owner', 'admin']),
      requireDelegatedTenantAdmin,
    ],
  }

  fastify.get('/context', async (request, reply) => {
    const { host } = z.object({ host: z.string().trim().min(3).max(253) }).parse(request.query)
    const tenantContext = await resolvePublicTenantContext(host)
    if (!tenantContext) return reply.code(404).send({ error: 'Active tenant domain not found' })
    reply.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    return { tenantContext }
  })

  fastify.get('/self', tenantAdmin, async (request) => {
    const user = (request as any).user
    const tenant = await getWhiteLabelTenant(user.organizationId)
    return {
      tenant: {
        profile: {
          companyName: tenant.profile.companyName,
          productName: tenant.profile.productName,
          logoUrl: tenant.profile.logoUrl,
          faviconUrl: tenant.profile.faviconUrl,
          primaryColor: tenant.profile.primaryColor,
          secondaryColor: tenant.profile.secondaryColor,
          accentColor: tenant.profile.accentColor,
          emailFromName: tenant.profile.emailFromName,
          emailReplyToAddress: tenant.profile.emailReplyToAddress,
          reportHeader: tenant.profile.reportHeader,
          reportFooter: tenant.profile.reportFooter,
          supportName: tenant.profile.supportName,
          supportEmail: tenant.profile.supportEmail,
          supportPhone: tenant.profile.supportPhone,
          supportUrl: tenant.profile.supportUrl,
          locale: tenant.profile.locale,
          currency: tenant.profile.currency,
          timeZone: tenant.profile.timeZone,
          navigationConfig: tenant.profile.navigationConfig,
        },
        products: tenant.products.map((assignment: any) => ({
          enabled: assignment.enabled,
          displayName: assignment.displayName,
          productTemplate: {
            key: assignment.productTemplate.key,
            name: assignment.productTemplate.name,
            version: assignment.productTemplate.version,
            enabledModuleKeys: assignment.productTemplate.enabledModuleKeys,
          },
        })),
        plan: tenant.plan ? {
          planKey: tenant.plan.planKey,
          planName: tenant.plan.planName,
          supportTier: tenant.plan.supportTier,
          billingStatus: tenant.plan.billingStatus,
          includedUsage: tenant.plan.includedUsage,
          currentPeriodStart: tenant.plan.currentPeriodStart,
          currentPeriodEnd: tenant.plan.currentPeriodEnd,
          cancelAtPeriodEnd: tenant.plan.cancelAtPeriodEnd,
        } : null,
        usageRollups: tenant.usageRollups,
        evaluationSuites: tenant.evaluationSuites,
      },
    }
  })

  fastify.patch('/self/profile', tenantAdmin, async (request) => {
    const user = (request as any).user
    const input = updateTenantAdminProfileSchema.parse(request.body)
    const profile = await updateWhiteLabelProfile(user.organizationId, input, actorFrom(request))
    return { profile }
  })

  fastify.get('/self/usage', tenantAdmin, async (request) => {
    const user = (request as any).user
    const query = usageQuerySchema.parse(request.query)
    return { usage: await getTenantUsage(user.organizationId, query) }
  })

  fastify.get('/self/evaluations', tenantAdmin, async (request) => {
    const user = (request as any).user
    return { evaluationSuites: await listEvaluationSuites(user.organizationId) }
  })

  fastify.get('/self/data-requests', tenantAdmin, async (request) => {
    const user = (request as any).user
    return { dataRequests: await listTenantDataRequests(user.organizationId) }
  })

  fastify.post('/self/data-requests', tenantAdmin, async (request, reply) => {
    const user = (request as any).user
    const input = createTenantDataRequestSchema.parse(request.body)
    const dataRequest = await createTenantDataRequest(
      user.organizationId,
      input,
      lifecycleActorFrom(request, 'TENANT_ADMIN'),
      { autoApproveTenantExport: true },
    )
    return reply.code(201).send({ dataRequest })
  })

  fastify.post('/self/data-requests/:requestId/cancel', tenantAdmin, async (request) => {
    const user = (request as any).user
    const { requestId } = selfDataRequestParams.parse(request.params)
    const { reason } = cancelTenantDataRequestSchema.parse(request.body)
    return {
      dataRequest: await cancelTenantDataRequest(
        user.organizationId,
        requestId,
        reason,
        lifecycleActorFrom(request, 'TENANT_ADMIN'),
      ),
    }
  })

  fastify.post('/self/data-requests/:requestId/export/execute', tenantAdmin, async (request) => {
    const user = (request as any).user
    const { requestId } = selfDataRequestParams.parse(request.params)
    return {
      dataRequest: await executeTenantDataExport(
        user.organizationId,
        requestId,
        lifecycleActorFrom(request, 'TENANT_ADMIN'),
      ),
    }
  })

  fastify.get('/self/data-requests/:requestId/export', tenantAdmin, async (request, reply) => {
    const user = (request as any).user
    const { requestId } = selfDataRequestParams.parse(request.params)
    const exported = await getTenantDataExport(user.organizationId, requestId)
    reply.header('Cache-Control', 'private, no-store')
    reply.header('Content-Disposition', `attachment; filename="kealee-tenant-${user.organizationId}-${requestId}.json"`)
    return exported
  })

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
    await deprovisionTenantDomain(tenantId, domainId, actorFrom(request))
    await deleteTenantDomain(tenantId, domainId, actorFrom(request))
    return reply.code(204).send()
  })

  fastify.post('/tenants/:tenantId/domains/:domainId/provision', platformAdmin, async (request) => {
    const { tenantId, domainId } = domainParams.parse(request.params)
    return { domain: await provisionTenantDomain(tenantId, domainId, actorFrom(request)) }
  })

  fastify.post('/tenants/:tenantId/domains/:domainId/verify', platformAdmin, async (request) => {
    const { tenantId, domainId } = domainParams.parse(request.params)
    return { domain: await verifyProvisionedTenantDomain(tenantId, domainId, actorFrom(request)) }
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

  fastify.post('/tenants/:tenantId/usage/reconcile', platformAdmin, async (request) => {
    const { tenantId } = tenantParams.parse(request.params)
    const { periodStart, periodEnd } = reconcileUsageSchema.parse(request.body)
    return { reconciliation: await reconcileTenantUsage(tenantId, periodStart, periodEnd) }
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

  fastify.get('/tenants/:tenantId/data-requests', platformAdmin, async (request) => {
    const { tenantId } = tenantParams.parse(request.params)
    return { dataRequests: await listTenantDataRequests(tenantId) }
  })

  fastify.post('/tenants/:tenantId/data-requests', platformAdmin, async (request, reply) => {
    const { tenantId } = tenantParams.parse(request.params)
    const input = createTenantDataRequestSchema.parse(request.body)
    const dataRequest = await createTenantDataRequest(
      tenantId,
      input,
      lifecycleActorFrom(request, 'PLATFORM_ADMIN'),
    )
    return reply.code(201).send({ dataRequest })
  })

  fastify.patch('/tenants/:tenantId/data-requests/:requestId/review', platformAdmin, async (request) => {
    const { tenantId, requestId } = tenantDataRequestParams.parse(request.params)
    const input = reviewTenantDataRequestSchema.parse(request.body)
    return {
      dataRequest: await reviewTenantDataRequest(
        tenantId,
        requestId,
        input,
        lifecycleActorFrom(request, 'PLATFORM_ADMIN'),
      ),
    }
  })

  fastify.post('/tenants/:tenantId/data-requests/:requestId/cancel', platformAdmin, async (request) => {
    const { tenantId, requestId } = tenantDataRequestParams.parse(request.params)
    const { reason } = cancelTenantDataRequestSchema.parse(request.body)
    return {
      dataRequest: await cancelTenantDataRequest(
        tenantId,
        requestId,
        reason,
        lifecycleActorFrom(request, 'PLATFORM_ADMIN'),
      ),
    }
  })

  fastify.post('/tenants/:tenantId/data-requests/:requestId/export/execute', platformAdmin, async (request) => {
    const { tenantId, requestId } = tenantDataRequestParams.parse(request.params)
    return {
      dataRequest: await executeTenantDataExport(
        tenantId,
        requestId,
        lifecycleActorFrom(request, 'PLATFORM_ADMIN'),
      ),
    }
  })

  fastify.get('/tenants/:tenantId/data-requests/:requestId/export', platformAdmin, async (request, reply) => {
    const { tenantId, requestId } = tenantDataRequestParams.parse(request.params)
    const exported = await getTenantDataExport(tenantId, requestId)
    reply.header('Cache-Control', 'private, no-store')
    reply.header('Content-Disposition', `attachment; filename="kealee-tenant-${tenantId}-${requestId}.json"`)
    return exported
  })

  fastify.post('/tenants/:tenantId/data-requests/:requestId/deletion/execute', platformAdmin, async (request) => {
    const { tenantId, requestId } = tenantDataRequestParams.parse(request.params)
    const { confirmation, reason } = executeTenantDeletionSchema.parse(request.body)
    return {
      dataRequest: await executeTenantDataDeletion(
        tenantId,
        requestId,
        confirmation,
        reason,
        lifecycleActorFrom(request, 'PLATFORM_ADMIN'),
      ),
    }
  })

  fastify.post('/tenants/:tenantId/data-requests/:requestId/retention/execute', platformAdmin, async (request) => {
    const { tenantId, requestId } = tenantDataRequestParams.parse(request.params)
    return {
      dataRequest: await executeTenantRetentionChange(
        tenantId,
        requestId,
        lifecycleActorFrom(request, 'PLATFORM_ADMIN'),
      ),
    }
  })

  fastify.post('/tenants/:tenantId/data-requests/purge-expired-exports', platformAdmin, async (request) => {
    const { tenantId } = tenantParams.parse(request.params)
    return purgeExpiredTenantExports(tenantId, lifecycleActorFrom(request, 'PLATFORM_ADMIN'))
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

  fastify.post('/tenants/:tenantId/evaluations/:suiteId/runs/:runId/execute', platformAdmin, async (request) => {
    const { tenantId, suiteId, runId } = runParams.parse(request.params)
    const suites = await listEvaluationSuites(tenantId)
    if (!suites.some((suite: any) => suite.id === suiteId)) {
      throw Object.assign(new Error('Evaluation suite not found'), { statusCode: 404 })
    }
    return { run: await executeTenantEvaluationRun(runId, { orgId: tenantId, suiteId }) }
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
    { preHandler: [authenticateUser, requirePlatformAdmin, requireTenantSupportAccess('TENANT_READ')] },
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
