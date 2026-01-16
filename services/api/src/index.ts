import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file (for API service)
config({ path: resolve(process.cwd(), '.env.local') })
// Ensure local dev picks up the database package's connection string.
// We intentionally override here because `.env.local` often contains app secrets,
// while the canonical DB credentials live in `packages/database/.env`.
if (process.env.NODE_ENV !== 'production') {
  // When running from services/api, the workspace package lives at ../../packages/database
  config({ path: resolve(process.cwd(), '../../packages/database/.env'), override: true })
}
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import rawBody from 'fastify-raw-body'
import multipart from '@fastify/multipart'
import { authRoutes } from './modules/auth/auth.routes'
import { orgRoutes } from './modules/orgs/org.routes'
import { userRoutes } from './modules/users/user.routes'
import { rbacRoutes } from './modules/rbac/rbac.routes'
import { entitlementRoutes } from './modules/entitlements/entitlement.routes'
import { eventRoutes } from './modules/events/event.routes'
import { auditRoutes } from './modules/audit/audit.routes'
import { pmRoutes } from './modules/pm/pm.routes'
import { billingRoutes } from './modules/billing/billing.routes'
import { projectRoutes } from './modules/projects/project.routes'
import { propertyRoutes } from './modules/properties/property.routes'
import { readinessRoutes } from './modules/readiness/readiness.routes'
import { contractTemplateRoutes } from './modules/contracts/contract-template.routes'
import { contractRoutes } from './modules/contracts/contract.routes'
import { marketplaceRoutes } from './modules/marketplace/marketplace.routes'
import { docusignRoutes } from './modules/docusign/docusign.routes'
import { designProjectRoutes } from './modules/architect/design-project.routes'
import { designPhaseRoutes } from './modules/architect/design-phase.routes'
import { designFileRoutes } from './modules/architect/design-file.routes'
import { deliverableRoutes } from './modules/architect/deliverable.routes'
import { drawingSetRoutes } from './modules/architect/drawing-set.routes'
import { bimModelRoutes } from './modules/architect/bim-model.routes'
import { reviewRoutes } from './modules/architect/review.routes'
import { collaborationRoutes } from './modules/architect/collaboration.routes'
import { versionControlRoutes } from './modules/architect/version-control.routes'
import { revisionRoutes } from './modules/architect/revision.routes'
import { validationRoutes } from './modules/architect/validation.routes'
import { approvalRoutes } from './modules/architect/approval.routes'
import { stampRoutes } from './modules/architect/stamp.routes'
import { qualityControlRoutes } from './modules/architect/quality-control.routes'
import { permitPackageRoutes } from './modules/architect/permit-package.routes'
import { constructionHandoffRoutes } from './modules/architect/construction-handoff.routes'
import { jurisdictionRoutes } from './modules/permits/jurisdiction.routes'
import { jurisdictionConfigRoutes } from './modules/permits/jurisdiction-config.routes'
import { jurisdictionStaffRoutes } from './modules/permits/jurisdiction-staff.routes'
import { permitApplicationRoutes } from './modules/permits/permit-application.routes'
import { permitRoutingRoutes } from './modules/permits/permit-routing.routes'
import { permitsApiRoutes } from './modules/permits-api/permits-api.routes'
import { apiKeyRoutes } from './modules/api-keys/api-key.routes'
import { webhookRoutes } from './modules/webhooks/webhook.routes'
import { createGraphQLServer } from './graphql/server'
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware'
import { registerGlobalRateLimit } from './middleware/rate-limit.middleware'
import { requestLogger, responseLogger } from './middleware/logging.middleware'
import { swaggerConfig, swaggerUIConfig } from './config/swagger.config'
import { prisma } from '@kealee/database'

const fastify = Fastify({
  logger: true,
})

// Start server
const start = async () => {
  try {
    // Register plugins
    await fastify.register(cors, {
      origin: true,
    })

    await fastify.register(helmet)

    // Register multipart for file uploads (Prompt 3.2)
    await fastify.register(multipart, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    })

    // Capture raw body for Stripe webhook signature verification (enabled per-route)
    await fastify.register(rawBody, {
      field: 'rawBody',
      global: false,
      encoding: 'utf8',
      runFirst: true,
    })

    // Register Swagger/OpenAPI documentation
    await fastify.register(swagger, swaggerConfig)
    await fastify.register(swaggerUI, swaggerUIConfig)

    // Register rate limiting (global)
    await registerGlobalRateLimit(fastify)

    // Register request/response logging
    fastify.addHook('onRequest', requestLogger)
    fastify.addHook('onResponse', responseLogger)

    // Register error handlers
    fastify.setErrorHandler(errorHandler)
    fastify.setNotFoundHandler(notFoundHandler)

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok' }
    })

    // DB health check (useful for local Windows/Docker debugging)
    fastify.get('/health/db', async () => {
      await prisma.$queryRaw`SELECT 1`
      return { status: 'ok', db: 'ok' }
    })

    // Register routes
    await fastify.register(authRoutes, { prefix: '/auth' })
    await fastify.register(orgRoutes, { prefix: '/orgs' })
    await fastify.register(userRoutes, { prefix: '/users' })
    await fastify.register(rbacRoutes, { prefix: '/rbac' })
    await fastify.register(entitlementRoutes, { prefix: '/entitlements' })
    await fastify.register(eventRoutes, { prefix: '/events' })
    await fastify.register(auditRoutes, { prefix: '/audit' })
    await fastify.register(pmRoutes, { prefix: '/pm' })
    await fastify.register(billingRoutes, { prefix: '/billing' })
    await fastify.register(projectRoutes, { prefix: '/projects' })
    await fastify.register(propertyRoutes, { prefix: '/properties' })
    await fastify.register(readinessRoutes, { prefix: '/readiness' })
    await fastify.register(contractTemplateRoutes, { prefix: '/contracts' })
    await fastify.register(contractRoutes, { prefix: '/contracts' })
    await fastify.register(contractDashboardRoutes, { prefix: '/contracts' })
    await fastify.register(contractComplianceRoutes, { prefix: '/contracts' })
    await fastify.register(contractSecurityRoutes, { prefix: '/contracts' })
    await fastify.register(milestoneRoutes, { prefix: '/milestones' })
    await fastify.register(milestoneUploadRoutes, { prefix: '/milestones' })
    await fastify.register(milestoneReviewRoutes, { prefix: '/milestones' })
    await fastify.register(marketplaceRoutes, { prefix: '/marketplace' })
    await fastify.register(leadsRoutes, { prefix: '/marketplace' })
    await fastify.register(paymentRoutes, { prefix: '/payments' })
    await fastify.register(disputeRoutes, { prefix: '/disputes' })
    await fastify.register(permitComplianceRoutes, { prefix: '/permits' })
    await fastify.register(closeoutRoutes, { prefix: '/closeout' })
    await fastify.register(handoffRoutes, { prefix: '/handoff' })
    await fastify.register(docusignRoutes, { prefix: '/docusign' })
    await fastify.register(designProjectRoutes, { prefix: '/architect' })
    await fastify.register(designPhaseRoutes, { prefix: '/architect' })
    await fastify.register(designFileRoutes, { prefix: '/architect' })
    await fastify.register(deliverableRoutes, { prefix: '/architect' })
    await fastify.register(drawingSetRoutes, { prefix: '/architect' })
    await fastify.register(bimModelRoutes, { prefix: '/architect' })
    await fastify.register(reviewRoutes, { prefix: '/architect' })
    await fastify.register(collaborationRoutes, { prefix: '/architect' })
    await fastify.register(versionControlRoutes, { prefix: '/architect' })
    await fastify.register(revisionRoutes, { prefix: '/architect' })
    await fastify.register(validationRoutes, { prefix: '/architect' })
    await fastify.register(approvalRoutes, { prefix: '/architect' })
    await fastify.register(stampRoutes, { prefix: '/architect' })
    await fastify.register(qualityControlRoutes, { prefix: '/architect' })
    await fastify.register(permitPackageRoutes, { prefix: '/architect' })
    await fastify.register(constructionHandoffRoutes, { prefix: '/architect' })
    await fastify.register(onboardingRoutes, { prefix: '/architect' })
    await fastify.register(templateLibraryRoutes, { prefix: '/architect' })
    await fastify.register(performanceBenchmarkRoutes, { prefix: '/architect' })
    await fastify.register(backupDRRoutes, { prefix: '/architect' })
    await fastify.register(jurisdictionRoutes, { prefix: '/permits' })
    await fastify.register(jurisdictionConfigRoutes, { prefix: '/permits' })
    await fastify.register(jurisdictionStaffRoutes, { prefix: '/permits' })
    await fastify.register(permitApplicationRoutes, { prefix: '/permits' })
    await fastify.register(permitRoutingRoutes, { prefix: '/permits' })
    await fastify.register(permitsApiRoutes) // Unified API routes (no prefix, uses /api/v1)
    await fastify.register(apiKeyRoutes) // API key management
    await fastify.register(webhookRoutes) // Webhook management
    await fastify.register(serviceRequestRoutes, { prefix: '/ops-services' })
    await fastify.register(servicePlanRoutes, { prefix: '/ops-services' })

    // Register GraphQL server
    const graphQLServer = createGraphQLServer()
    await graphQLServer.start()
    fastify.register(graphQLServer.createHandler({
      path: '/graphql',
    }))

    const port = Number(process.env.PORT) || 3001
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 API server running on port ${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
