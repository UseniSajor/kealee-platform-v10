import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file ONLY in development (for local development)
// In production (Railway/Vercel), environment variables are set via platform dashboards
// and available in process.env - no .env.local file needed or used
if (process.env.NODE_ENV !== 'production') {
  // Load .env.local file (for API service) - only exists locally, gitignored
  config({ path: resolve(process.cwd(), '.env.local') })
  // Ensure local dev picks up the database package's connection string.
  // We intentionally override here because `.env.local` often contains app secrets,
  // while the canonical DB credentials live in `packages/database/.env`.
  // When running from services/api, the workspace package lives at ../../packages/database
  config({ path: resolve(process.cwd(), '../../packages/database/.env'), override: true })
}
// In production, deployment platforms (Railway/Vercel) set environment variables via their dashboards
// No .env.local file is needed or used in production
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
import { architectFileUploadRoutes } from './modules/architect/architect-file-upload.routes'
import { architectVersionControlRoutes } from './modules/architect/architect-version-control.routes'
import { architectReviewWorkflowRoutes } from './modules/architect/architect-review-workflow.routes'
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
import { permitComplianceRoutes } from './modules/permits/permit-compliance.routes'
import { permitsApiRoutes } from './modules/permits-api/permits-api.routes'
import { apiKeyRoutes } from './modules/api-keys/api-key.routes'
import { webhookRoutes } from './modules/webhooks/webhook.routes'
import { webhookStatusRoutes } from './modules/webhooks/webhook-status.routes'
import { milestoneRoutes } from './modules/milestones/milestone.routes'
import { milestoneUploadRoutes } from './modules/milestones/milestone-upload.routes'
import { milestoneReviewRoutes } from './modules/milestones/milestone-review.routes'
import { contractDashboardRoutes } from './modules/contracts/contract-dashboard.routes'
import { contractComplianceRoutes } from './modules/contracts/contract-compliance.routes'
import { contractSecurityRoutes } from './modules/contracts/contract-security.routes'
import { leadsRoutes } from './modules/marketplace/leads.routes'
import { paymentRoutes } from './modules/payments/payment.routes'
import { disputeRoutes } from './modules/disputes/dispute.routes'
import { closeoutRoutes } from './modules/closeout/closeout.routes'
import { handoffRoutes } from './modules/handoff/handoff.routes'
import { serviceRequestRoutes } from './modules/ops-services/service-request.routes'
import { servicePlanRoutes } from './modules/ops-services/service-plan.routes'
import { workflowRoutes } from './modules/workflow/workflow.routes'
import { fileRoutes } from './modules/files/file.routes'
import { analyticsRoutes } from './modules/analytics/analytics.routes'
import { monitoringDashboardRoutes } from './modules/monitoring/monitoring-dashboard.routes'
import { taskGeneratorRoutes } from './modules/tasks/task-generator.routes'
import { complianceCheckpointRoutes } from './modules/compliance/compliance-checkpoint.routes'
import { complianceGatesRoutes } from './modules/compliance/compliance-gates.routes'
import { createGraphQLServer } from './graphql/server'
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware'
import { registerGlobalRateLimit } from './middleware/rate-limit.middleware'
import { registerCSRFProtection } from './middleware/csrf.middleware'
import { requestLogger, responseLogger } from './middleware/logging.middleware'
import { swaggerConfig, swaggerUIConfig } from './config/swagger.config'
import { prisma } from '@kealee/database'
import { environment, logEnvironment, validateProductionConfig, getSafeConfig } from './config/environment'

const fastify = Fastify({
  logger: true,
})

// Start server
const start = async () => {
  try {
    // Log environment information
    logEnvironment();
    
    // Validate production-only configuration
    if (environment.isProduction) {
      validateProductionConfig();
    }
    
    // Get safe configuration based on environment
    const config = getSafeConfig();
    
    // Log configuration warnings
    if (environment.isPreview) {
      console.log('🔵 Running in PREVIEW mode:');
      console.log('   - Using test/preview credentials');
      console.log('   - Production integrations disabled');
      console.log('   - External services may be mocked');
      console.log('');
    }
    
    // Register plugins
    // CORS configuration - allow all client-facing and internal domains
    const corsOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
      : [
          // CLIENT-FACING
          'https://kealee.com',
          'https://www.kealee.com',
          'https://ops.kealee.com',
          'https://app.kealee.com',
          'https://architect.kealee.com',
          'https://permits.kealee.com',
          // INTERNAL
          'https://pm.kealee.com',
          'https://admin.kealee.com',
          // DEVELOPMENT
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://localhost:3003',
          'http://localhost:3004',
          'http://localhost:3005',
          'http://localhost:3006',
          'http://localhost:3007',
        ]

    await fastify.register(cors, {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true)
        // Check if origin is in allowed list
        if (corsOrigins.includes(origin)) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'), false)
        }
      },
      credentials: true,
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
    await fastify.register(swagger, swaggerConfig as any)
    await fastify.register(swaggerUI, swaggerUIConfig)

    // Register rate limiting (global)
    await registerGlobalRateLimit(fastify)

    // Register CSRF protection (enabled in all environments for security)
    await registerCSRFProtection(fastify)

    // Initialize Sentry
    const { initSentry } = require('./middleware/sentry.middleware')
    initSentry()

    // Register Sentry hooks
    const { sentryRequestHandler, sentryResponseHandler } = require('./middleware/sentry.middleware')
    fastify.addHook('onRequest', sentryRequestHandler)
    fastify.addHook('onResponse', sentryResponseHandler)

    // Register request/response logging
    const { requestLogger, responseLogger } = require('./middleware/request-logger.middleware')
    fastify.addHook('onRequest', requestLogger)
    fastify.addHook('onResponse', responseLogger)

    // Register error handlers
    fastify.setErrorHandler(errorHandler)
    fastify.setNotFoundHandler(notFoundHandler)

    // Register enhanced health checks
    const { registerHealthChecks } = require('./middleware/health-check.middleware')
    registerHealthChecks(fastify)

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
    await fastify.register(architectFileUploadRoutes, { prefix: '/architect' })
    await fastify.register(architectVersionControlRoutes, { prefix: '/architect' })
    await fastify.register(architectReviewWorkflowRoutes, { prefix: '/architect' })
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
    // TODO: Implement these routes
    // await fastify.register(onboardingRoutes, { prefix: '/architect' })
    // await fastify.register(templateLibraryRoutes, { prefix: '/architect' })
    // await fastify.register(performanceBenchmarkRoutes, { prefix: '/architect' })
    // await fastify.register(backupDRRoutes, { prefix: '/architect' })
    await fastify.register(jurisdictionRoutes, { prefix: '/permits' })
    await fastify.register(jurisdictionConfigRoutes, { prefix: '/permits' })
    await fastify.register(jurisdictionStaffRoutes, { prefix: '/permits' })
    
    // Register jurisdiction subscription routes
    const { jurisdictionSubscriptionRoutes } = await import('./modules/permits/jurisdiction-subscription.routes')
    await fastify.register(jurisdictionSubscriptionRoutes, { prefix: '/jurisdictions' })
    await fastify.register(permitApplicationRoutes, { prefix: '/permits' })
    await fastify.register(permitRoutingRoutes, { prefix: '/permits' })
    await fastify.register(permitsApiRoutes) // Unified API routes (no prefix, uses /api/v1)
    await fastify.register(apiKeyRoutes) // API key management
    await fastify.register(webhookRoutes) // Webhook management
    await fastify.register(webhookStatusRoutes) // Webhook status and monitoring
    await fastify.register(serviceRequestRoutes, { prefix: '/ops-services' })
    await fastify.register(servicePlanRoutes, { prefix: '/ops-services' })
    await fastify.register(workflowRoutes, { prefix: '/workflow' })
    await fastify.register(fileRoutes, { prefix: '/files' })
    await fastify.register(analyticsRoutes)
    await fastify.register(monitoringDashboardRoutes)
    await fastify.register(taskGeneratorRoutes, { prefix: '/tasks' })
    await fastify.register(complianceCheckpointRoutes, { prefix: '/compliance' })
    await fastify.register(complianceGatesRoutes, { prefix: '/compliance' })
    
    // Register new API routes for PM workspace
    const { clientRoutes } = await import('./routes/client.routes')
    const { taskRoutes } = await import('./routes/task.routes')
    const { permitRoutes } = await import('./routes/permit.routes')
    const { reportRoutes } = await import('./routes/report.routes')
    
    await fastify.register(clientRoutes, { prefix: '/api/clients' })
    await fastify.register(taskRoutes, { prefix: '/api/tasks' })
    await fastify.register(permitRoutes, { prefix: '/api/permits' })
    
    // Register permit payment routes
    const { permitPaymentRoutes } = await import('./modules/permits/permit-payment.routes')
    await fastify.register(permitPaymentRoutes, { prefix: '/permits' })
    await fastify.register(reportRoutes, { prefix: '/api/reports' })
    
    // Register Stripe routes
    const { stripeRoutes } = await import('./routes/stripe.routes')
    await fastify.register(stripeRoutes, { prefix: '/api/stripe' })
    
    // Register Google Places routes
    const { googlePlacesRoutes } = await import('./routes/google-places.routes')
    await fastify.register(googlePlacesRoutes, { prefix: '/api/google-places' })
    
    // Note: File routes already registered at line 284 with prefix '/files'

    // Register GraphQL server (Apollo Server v4)
    const graphQLServer = createGraphQLServer()
    await graphQLServer.start()
    
    // Use the new Fastify integration for Apollo Server v4
    const { default: fastifyApollo } = await import('@as-integrations/fastify')
    
    await fastify.register(fastifyApollo(graphQLServer), {
      context: async (request: any, reply: any) => {
        // Extract API key or auth token from request
        const apiKey = request.headers?.['x-api-key']
        const authToken = request.headers?.authorization
        
        return {
          apiKey,
          authToken,
          request,
          reply,
        }
      },
    } as any)

    // Railway provides PORT env var, default to 3000 for local dev
    const port = Number(process.env.PORT) || 3000
    
    await fastify.listen({ port, host: '0.0.0.0' })
    
    // Startup complete message
    const emoji = environment.isProduction ? '🚀' : environment.isStaging ? '🔶' : environment.isPreview ? '🔵' : '💻';
    console.log('');
    console.log('='.repeat(60));
    console.log(`${emoji} API Server Started Successfully ${emoji}`);
    console.log('='.repeat(60));
    console.log(`Environment:  ${environment.env.toUpperCase()}`);
    console.log(`Port:         ${port}`);
    console.log(`Host:         0.0.0.0`);
    console.log(`Health:       /health`);
    console.log(`Docs:         /docs`);
    console.log(`GraphQL:      /graphql`);
    console.log('='.repeat(60));
    console.log('');
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
