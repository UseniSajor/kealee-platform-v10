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

// ============================================================================
// STARTUP GUARDS - Critical Security Checks
// ============================================================================

/**
 * Validates required environment variables and prevents environment/database mismatches
 * This guard runs before any server initialization to prevent security issues
 */
function validateStartupGuards() {
  // Guard 1: Require APP_ENV or detect from NODE_ENV/Railway
  // Support multiple environment variable patterns for flexibility
  const appEnv =
    process.env.APP_ENV ||
    process.env.NODE_ENV ||
    (process.env.RAILWAY_SERVICE_NAME?.toLowerCase().includes('staging') ? 'staging' : undefined) ||
    process.env.RAILWAY_ENVIRONMENT_NAME

  if (!appEnv) {
    console.error('')
    console.error('='.repeat(80))
    console.error('❌ FATAL ERROR: Environment not configured')
    console.error('='.repeat(80))
    console.error('')
    console.error('No environment variable found to determine the application environment.')
    console.error('Please set ONE of the following:')
    console.error('  - APP_ENV (recommended): development, staging, production')
    console.error('  - NODE_ENV: development, staging, production')
    console.error('  - RAILWAY_ENVIRONMENT_NAME: Set automatically by Railway')
    console.error('')
    console.error('Current values:')
    console.error(`  APP_ENV:                    ${process.env.APP_ENV || '(not set)'}`)
    console.error(`  NODE_ENV:                   ${process.env.NODE_ENV || '(not set)'}`)
    console.error(`  RAILWAY_ENVIRONMENT_NAME:   ${process.env.RAILWAY_ENVIRONMENT_NAME || '(not set)'}`)
    console.error(`  RAILWAY_SERVICE_NAME:       ${process.env.RAILWAY_SERVICE_NAME || '(not set)'}`)
    console.error('')
    console.error('Set environment in:')
    console.error('  - Local: Add APP_ENV to .env.local')
    console.error('  - Railway: Set APP_ENV or NODE_ENV in Railway dashboard → Variables')
    console.error('  - Vercel: Set NODE_ENV in Vercel dashboard → Environment Variables')
    console.error('')
    console.error('='.repeat(80))
    process.exit(1)
  }

  // Normalize environment value
  const normalizedEnv = appEnv.toLowerCase()

  // Log detected environment
  console.log(`✅ Environment detected: ${normalizedEnv}`)

  // Ensure we have a valid environment value
  if (!['development', 'staging', 'production', 'preview'].includes(normalizedEnv)) {
    console.warn(`⚠️  Warning: Unusual environment value "${normalizedEnv}". Expected: development, staging, production, or preview`)
  }

  // Guard 2: Require DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('')
    console.error('='.repeat(80))
    console.error('❌ FATAL ERROR: DATABASE_URL is not set')
    console.error('='.repeat(80))
    console.error('')
    console.error('DATABASE_URL is required to connect to the database.')
    console.error('')
    console.error('Set DATABASE_URL in your environment variables:')
    console.error('  - Local: Add to .env.local or packages/database/.env')
    console.error('  - Railway: Set in Railway dashboard → Service → Variables')
    console.error('')
    console.error('⚠️  IMPORTANT: DATABASE_URL must only exist in backend services.')
    console.error('   Never add DATABASE_URL to frontend applications (Vercel).')
    console.error('')
    console.error('='.repeat(80))
    process.exit(1)
  }

  // Guard 3: Prevent staging from connecting to production database
  if (normalizedEnv === 'staging') {
    const isProductionDb =
      databaseUrl.includes('production-postgres') ||
      databaseUrl.includes('production-postgres.internal') ||
      databaseUrl.includes('prod-postgres') ||
      databaseUrl.includes('prod-postgres.internal') ||
      databaseUrl.toLowerCase().includes('production') && databaseUrl.includes('postgres')

    if (isProductionDb) {
      console.error('')
      console.error('='.repeat(80))
      console.error('❌ FATAL ERROR: Environment/Database Mismatch')
      console.error('='.repeat(80))
      console.error('')
      console.error('SECURITY VIOLATION: Staging environment is attempting to connect to production database!')
      console.error('')
      console.error(`APP_ENV:        ${appEnv}`)
      console.error(`DATABASE_URL:   ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`)
      console.error('')
      console.error('This is a critical security issue that could result in:')
      console.error('  - Data corruption in production')
      console.error('  - Accidental deletion of production data')
      console.error('  - Security breaches')
      console.error('')
      console.error('REQUIRED FIX:')
      console.error('  1. Verify APP_ENV is set to "staging"')
      console.error('  2. Verify DATABASE_URL points to staging database (staging-postgres.internal)')
      console.error('  3. Ensure staging and production use separate Railway services')
      console.error('  4. Check Railway dashboard → Service → Variables')
      console.error('')
      console.error('='.repeat(80))
      process.exit(1)
    }
  }

  // Guard 4: Prevent production from connecting to staging database
  if (normalizedEnv === 'production') {
    const isStagingDb =
      databaseUrl.includes('staging-postgres') ||
      databaseUrl.includes('staging-postgres.internal') ||
      databaseUrl.includes('stage-postgres') ||
      databaseUrl.includes('stage-postgres.internal') ||
      databaseUrl.toLowerCase().includes('staging') && databaseUrl.includes('postgres')

    if (isStagingDb) {
      console.error('')
      console.error('='.repeat(80))
      console.error('❌ FATAL ERROR: Environment/Database Mismatch')
      console.error('='.repeat(80))
      console.error('')
      console.error('SECURITY VIOLATION: Production environment is attempting to connect to staging database!')
      console.error('')
      console.error(`APP_ENV:        ${appEnv}`)
      console.error(`DATABASE_URL:   ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`)
      console.error('')
      console.error('This is a critical security issue that could result in:')
      console.error('  - Production using test/staging data')
      console.error('  - Data loss if staging database is reset')
      console.error('  - Incorrect data being served to production users')
      console.error('')
      console.error('REQUIRED FIX:')
      console.error('  1. Verify APP_ENV is set to "production"')
      console.error('  2. Verify DATABASE_URL points to production database (production-postgres.internal)')
      console.error('  3. Ensure production and staging use separate Railway services')
      console.error('  4. Check Railway dashboard → Service → Variables')
      console.error('')
      console.error('='.repeat(80))
      process.exit(1)
    }
  }

  // Log successful validation (only in non-production to avoid log noise)
  if (normalizedEnv !== 'production') {
    console.log('✅ Startup guards passed:')
    console.log(`   Environment: ${normalizedEnv}`)
    console.log(`   DATABASE_URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`)
    console.log('')
  }
}

// Run startup guards immediately after environment loading
validateStartupGuards()

// Initialize OpenTelemetry tracing BEFORE importing Fastify
// so auto-instrumentations can monkey-patch HTTP, Fastify, and IORedis
import { initTracing } from '@kealee/observability';
initTracing('kealee-api');

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
import { registerAuditMiddleware } from './middleware/audit.middleware'
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
import { quotesRoutes } from './modules/marketplace/quotes.routes'
import { designRoutes } from './modules/marketplace/design.routes'
import { paymentRoutes } from './modules/payments/payment.routes'
import { escrowRoutes } from './modules/escrow/escrow.routes'
import { depositRoutes } from './modules/deposits/deposit.routes'
import { disputeRoutes } from './modules/disputes/dispute.routes'
import { closeoutRoutes } from './modules/closeout/closeout.routes'
import { handoffRoutes } from './modules/handoff/handoff.routes'
import { serviceRequestRoutes } from './modules/ops-services/service-request.routes'
import { servicePlanRoutes } from './modules/ops-services/service-plan.routes'
import { workflowRoutes } from './modules/workflow/workflow.routes'
import { fileRoutes } from './modules/files/file.routes'
// Temporarily disabled - DTO type mismatches
// import { accountingRoutes } from './routes/accounting.routes'
import { stripeConnectRoutes } from './routes/stripe-connect.routes'

// File Upload Pipeline (connects user uploads → Supabase Storage → Command Center)
import { uploadRoutes } from './modules/uploads/upload.routes'

// Marketplace Estimating Engine (assembly library, quick pricing, bid validation)
import { marketplaceEstimatingRoutes } from './modules/marketplace-estimating/marketplace-estimating.routes'

// User Responsibilities Routes (from Kealee_User_Responsibilities_Guide.md)
import contractorUploadsRoutes from './modules/contractor/contractor-uploads.routes'
import clientActionsRoutes from './modules/client/client-actions.routes'
import architectUploadsRoutes from './modules/architect/architect-uploads.routes'
import { estimationRoutes } from './modules/estimation/estimation.routes'
import { preconRoutes } from './modules/precon/precon.routes'
import { engineerRoutes } from './modules/engineer/engineer.routes'
// Analytics temporarily disabled
// import { analyticsRoutes } from './modules/analytics/analytics.routes'
import { monitoringDashboardRoutes } from './modules/monitoring/monitoring-dashboard.routes'
import { taskGeneratorRoutes } from './modules/tasks/task-generator.routes'
import { complianceCheckpointRoutes } from './modules/compliance/compliance-checkpoint.routes'
// Temporarily disabled - missing @kealee/compliance package
// import { complianceGatesRoutes } from './modules/compliance/compliance-gates.routes'
// Temporarily disabled - type issues in route handlers
// import { complianceRoutes } from './routes/compliance.routes'
// Deposit temporarily disabled
// import { depositRoutes } from './routes/deposit.routes'
// Stripe webhook temporarily disabled
// import { stripeWebhookRoutes } from './routes/stripe-webhook.routes'
// Oversight temporarily disabled
// import { oversightRoutes } from './routes/oversight.routes'
import testRoutes from './routes/test.routes'
// import { createGraphQLServer } from './graphql/server' // DISABLED: GraphQL not critical for MVP
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware'
import { registerGlobalRateLimit } from './middleware/rate-limit.middleware'
// Temporarily disabled - @fastify/csrf-protection v5.x incompatible with Fastify v4.x
// import { registerCSRFProtection } from './middleware/csrf.middleware'
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
    // AFTER: const fastify = Fastify({ ... })
    // BEFORE: registering routes

    fastify.register(async function apiScope(api) {
      // All these become /api/<prefix>/<route>
      await api.register(stripeConnectRoutes, { prefix: '/connect' })
      await api.register(projectRoutes, { prefix: '/projects' })
      await api.register(propertyRoutes, { prefix: '/properties' })
      await api.register(readinessRoutes, { prefix: '/readiness' })

      await api.register(contractTemplateRoutes, { prefix: '/contracts' })
      await api.register(contractRoutes, { prefix: '/contracts' })
      await api.register(contractDashboardRoutes, { prefix: '/contracts' })
      await api.register(contractComplianceRoutes, { prefix: '/contracts' })
      await api.register(contractSecurityRoutes, { prefix: '/contracts' })

      await api.register(milestoneRoutes, { prefix: '/milestones' })
      await api.register(milestoneUploadRoutes, { prefix: '/milestones' })
      await api.register(milestoneReviewRoutes, { prefix: '/milestones' })

      await api.register(marketplaceRoutes, { prefix: '/marketplace' })
      await api.register(leadsRoutes, { prefix: '/marketplace' })
      await api.register(quotesRoutes, { prefix: '/marketplace' })
      await api.register(designRoutes, { prefix: '/marketplace' })

      await api.register(paymentRoutes, { prefix: '/payments' })
    }, { prefix: '/api' })


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
    // Temporarily disabled - @fastify/csrf-protection v5.x incompatible with Fastify v4.x
    // await registerCSRFProtection(fastify)

    // Initialize Sentry
    const { initSentry } = require('./middleware/sentry.middleware')
    initSentry()

    // Register Sentry hooks
    const { sentryRequestHandler, sentryResponseHandler } = require('./middleware/sentry.middleware')
    fastify.addHook('onRequest', sentryRequestHandler)
    fastify.addHook('onResponse', sentryResponseHandler)

    // Register OpenTelemetry tracing plugin (adds request.traceId + x-trace-id header)
    const { tracingPlugin } = require('@kealee/observability')
    await fastify.register(tracingPlugin)

    // Initialize event-driven architecture - TEMPORARILY DISABLED
    // const { escrowEventHandlers } = require('./events/escrow-event-handlers')
    // escrowEventHandlers.registerHandlers()
    console.log('⚠️  Escrow event handlers temporarily disabled')

    // Register performance monitoring (response time tracking, slow query alerts)
    const { registerPerformanceMonitoring } = require('./middleware/performance.middleware')
    await registerPerformanceMonitoring(fastify)

    // Register API response cache plugin (Redis-backed with in-memory fallback)
    const { registerCachePlugin } = require('./middleware/cache.middleware')
    await registerCachePlugin(fastify)

    // Register request/response logging
    const { requestLogger, responseLogger } = require('./middleware/request-logger.middleware')
    fastify.addHook('onRequest', requestLogger)
    fastify.addHook('onResponse', responseLogger)

    // Register error handlers
    fastify.setErrorHandler(errorHandler)
    fastify.setNotFoundHandler(notFoundHandler)

    // Register enhanced health checks (includes /health/db route)
    const { registerHealthChecks } = require('./middleware/health-check.middleware')
    registerHealthChecks(fastify)

    // Register routes
    await fastify.register(testRoutes, { prefix: '/api' })
    await fastify.register(authRoutes, { prefix: '/auth' })
    await fastify.register(orgRoutes, { prefix: '/orgs' })
    await fastify.register(userRoutes, { prefix: '/users' })
    await fastify.register(rbacRoutes, { prefix: '/rbac' })
    await fastify.register(entitlementRoutes, { prefix: '/entitlements' })
    await fastify.register(eventRoutes, { prefix: '/events' })
    await fastify.register(auditRoutes, { prefix: '/audit' })
    await fastify.register(pmRoutes, { prefix: '/pm' })
    await fastify.register(billingRoutes, { prefix: '/billing' })
    await fastify.register(escrowRoutes, { prefix: '/escrow' })
    await fastify.register(depositRoutes, { prefix: '/deposits' })
    await fastify.register(disputeRoutes, { prefix: '/disputes' })

    // Analytics and Compliance - Now enabled
    const { analyticsRoutes } = await import('./modules/analytics/analytics.routes')
    const { analyticsDashboardRoutes } = await import('./modules/analytics/analytics-dashboard.routes')
    const { complianceRoutes: complianceMonitoringRoutes } = await import('./modules/compliance/compliance.routes')
    await fastify.register(analyticsRoutes, { prefix: '/analytics' })
    await fastify.register(analyticsDashboardRoutes, { prefix: '/analytics' })
    await fastify.register(complianceMonitoringRoutes, { prefix: '/compliance/monitoring' })

    // Temporarily disabled - DTO type mismatches
    // await fastify.register(accountingRoutes, { prefix: '/accounting' })
    await fastify.register(stripeConnectRoutes, { prefix: '/connect' })
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
    // Temporarily disabled - needs service method fixes
    // await fastify.register(disputeRoutes, { prefix: '/disputes' })
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
    // Architect onboarding, templates, benchmarks, and backup/DR
    const { onboardingRoutes } = await import('./modules/architect/onboarding.routes')
    const { backupDRRoutes } = await import('./modules/architect/backup-dr.routes')
    await fastify.register(onboardingRoutes, { prefix: '/architect' })
    await fastify.register(backupDRRoutes, { prefix: '/architect' })
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
    // File Upload Pipeline (site photos, receipts, documents → Supabase → Command Center)
    await fastify.register(uploadRoutes, { prefix: '/api/v1/uploads' })
    // Chunked uploads for large files (>5MB)
    const { chunkedUploadRoutes } = await import('./modules/uploads/chunked-upload.routes')
    await fastify.register(chunkedUploadRoutes, { prefix: '/api/v1/uploads' })
    // Marketplace Estimating Engine (assembly library, quick pricing, bid validation)
    await fastify.register(marketplaceEstimatingRoutes, { prefix: '/api/v1' })
    // Analytics temporarily disabled
    // await fastify.register(analyticsRoutes)
    await fastify.register(monitoringDashboardRoutes)

    // User Responsibilities Routes (from Kealee_User_Responsibilities_Guide.md)
    await fastify.register(contractorUploadsRoutes, { prefix: '/api/contractor' })
    await fastify.register(clientActionsRoutes, { prefix: '/api/client' })
    await fastify.register(architectUploadsRoutes, { prefix: '/api/architect' })
    await fastify.register(taskGeneratorRoutes, { prefix: '/tasks' })
    await fastify.register(complianceCheckpointRoutes, { prefix: '/compliance' })

    // Estimation (Command Center integration)
    await fastify.register(estimationRoutes, { prefix: '/estimation' })

    // Pre-Construction Workflow (Project Owner Module)
    await fastify.register(preconRoutes, { prefix: '/precon' })

    // Engineering Services
    await fastify.register(engineerRoutes, { prefix: '/engineer' })

    // Site Check-In / Crew Tracking
    const { checkInRoutes } = await import('./modules/check-in/check-in.routes')
    await fastify.register(checkInRoutes, { prefix: '/api/v1/check-in' })

    // IoT Sensor Data Ingestion
    const { sensorRoutes } = await import('./modules/sensors/sensor.routes')
    await fastify.register(sensorRoutes, { prefix: '/api/v1/sensors' })

    // Web Push Notifications
    const { pushRoutes } = await import('./modules/push/push.routes')
    await fastify.register(pushRoutes, { prefix: '/api/v1/push' })

    // AI Scope Analysis
    const { scopeAnalysisRoutes } = await import('./modules/scope-analysis/scope-analysis.routes')
    await fastify.register(scopeAnalysisRoutes, { prefix: '/api/v1/scope-analysis' })

    // Conversational AI Chat
    const { chatRoutes } = await import('./modules/chat/chat.routes')
    await fastify.register(chatRoutes, { prefix: '/chat' })

    // Autonomous Action Engine
    const { autonomyRoutes } = await import('./modules/autonomy/autonomy.routes')
    await fastify.register(autonomyRoutes, { prefix: '/autonomy' })

    // Contractor Reliability Scoring
    const { scoringRoutes } = await import('./modules/scoring/scoring.routes')
    await fastify.register(scoringRoutes, { prefix: '/scoring' })

    // Temporarily disabled - missing @kealee/compliance package
    // await fastify.register(complianceGatesRoutes, { prefix: '/compliance' })
    // Temporarily disabled - type issues in route handlers
    // await fastify.register(complianceRoutes, { prefix: '/api/compliance' })
    // Deposit temporarily disabled
    // await fastify.register(depositRoutes, { prefix: '/api/deposits' })
    // Stripe webhook temporarily disabled
    // await fastify.register(stripeWebhookRoutes, { prefix: '/webhooks' })
    // Oversight temporarily disabled
    // await fastify.register(oversightRoutes, { prefix: '/api/admin/oversight' })

    // Command Center dashboard routes (APP-15)
    const { commandCenterRoutes } = await import('./routes/command-center/index')
    await fastify.register(commandCenterRoutes, { prefix: '/api/v1/command-center' })

    // Command Center per-app routes (decisions, bids, visits, reports, predictions, qa, budget)
    const { decisionRoutes } = await import('./routes/decisions/index')
    const { bidRoutes } = await import('./routes/bids/index')
    const { visitRoutes } = await import('./routes/visits/index')
    const { ccReportRoutes } = await import('./routes/reports/index')
    const { predictionRoutes } = await import('./routes/predictions/index')
    const { qaRoutes } = await import('./routes/qa/index')
    const { budgetRoutes } = await import('./routes/budget/index')

    await fastify.register(decisionRoutes, { prefix: '/api/v1/decisions' })
    await fastify.register(bidRoutes, { prefix: '/api/v1/bids' })
    await fastify.register(visitRoutes, { prefix: '/api/v1/visits' })
    await fastify.register(ccReportRoutes, { prefix: '/api/v1/reports' })
    await fastify.register(predictionRoutes, { prefix: '/api/v1/predictions' })
    await fastify.register(qaRoutes, { prefix: '/api/v1/qa' })
    await fastify.register(budgetRoutes, { prefix: '/api/v1/budget' })

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

    // ══════════════════════════════════════════════════════════════
    // Phase 1: New API routes for previously unserved Prisma models
    // ══════════════════════════════════════════════════════════════

    // Finance & Accounting
    const { accountRoutes } = await import('./modules/finance/account.routes')
    const { journalEntryRoutes } = await import('./modules/finance/journal-entry.routes')
    const { accountBalanceRoutes } = await import('./modules/finance/account-balance.routes')
    const { payoutRoutes } = await import('./modules/finance/payout.routes')
    const { statementRoutes } = await import('./modules/finance/statement.routes')
    const { paymentMethodRoutes } = await import('./modules/finance/payment-method.routes')
    const { scheduledPaymentRoutes } = await import('./modules/finance/scheduled-payment.routes')
    const { platformFeeRoutes } = await import('./modules/finance/platform-fee.routes')
    await fastify.register(accountRoutes, { prefix: '/accounting/accounts' })
    await fastify.register(journalEntryRoutes, { prefix: '/accounting/journal-entries' })
    await fastify.register(accountBalanceRoutes, { prefix: '/accounting/balances' })
    await fastify.register(payoutRoutes, { prefix: '/accounting/payouts' })
    await fastify.register(statementRoutes, { prefix: '/accounting/statements' })
    await fastify.register(paymentMethodRoutes, { prefix: '/accounting/payment-methods' })
    await fastify.register(scheduledPaymentRoutes, { prefix: '/accounting/scheduled-payments' })
    await fastify.register(platformFeeRoutes, { prefix: '/accounting/platform-fees' })

    // Security & Auth
    const { securityRoutes } = await import('./modules/security/security.routes')
    const { authSecurityRoutes } = await import('./modules/security/auth-security.routes')
    await fastify.register(securityRoutes, { prefix: '/security' })
    await fastify.register(authSecurityRoutes, { prefix: '/security/auth' })

    // Compliance & Licensing
    const { complianceRulesRoutes } = await import('./modules/compliance/compliance-rules.routes')
    const { licenseTrackingRoutes } = await import('./modules/compliance/license-tracking.routes')
    const { ofacRoutes } = await import('./modules/compliance/ofac.routes')
    await fastify.register(complianceRulesRoutes, { prefix: '/compliance/rules' })
    await fastify.register(licenseTrackingRoutes, { prefix: '/compliance/licensing' })
    await fastify.register(ofacRoutes, { prefix: '/compliance/ofac' })

    // Financial Audit
    const { financialAuditRoutes } = await import('./modules/audit/financial-audit.routes')
    await fastify.register(financialAuditRoutes, { prefix: '/audit/financial' })

    // Analytics Snapshots, KPIs, Fraud Detection
    const { analyticsSnapshotRoutes } = await import('./modules/analytics/analytics-snapshot.routes')
    const { fraudDetectionRoutes } = await import('./modules/analytics/fraud-detection.routes')
    await fastify.register(analyticsSnapshotRoutes, { prefix: '/analytics/snapshots' })
    await fastify.register(fraudDetectionRoutes, { prefix: '/analytics/fraud' })

    // Notifications
    const { notificationRoutes } = await import('./modules/notifications/notification.routes')
    await fastify.register(notificationRoutes, { prefix: '/notifications' })

    // System Config, Jobs, AI Conversations
    const { systemConfigRoutes } = await import('./modules/system/system-config.routes')
    const { jobManagementRoutes } = await import('./modules/system/job-management.routes')
    const { aiConversationRoutes } = await import('./modules/system/ai-conversation.routes')
    await fastify.register(systemConfigRoutes, { prefix: '/system' })
    await fastify.register(jobManagementRoutes, { prefix: '/system/jobs' })
    await fastify.register(aiConversationRoutes, { prefix: '/ai/conversations' })

    // App Health & Monitoring
    const { appHealthRoutes } = await import('./modules/monitoring/app-health.routes')
    await fastify.register(appHealthRoutes, { prefix: '/monitoring' })

    // Permit Templates, Analytics, API Integrations
    const { permitTemplateRoutes } = await import('./modules/permits/permit-template.routes')
    const { permitAnalyticsRoutes } = await import('./modules/permits/permit-analytics.routes')
    const { apiIntegrationRoutes } = await import('./modules/permits/api-integration.routes')
    await fastify.register(permitTemplateRoutes, { prefix: '/permits/templates' })
    await fastify.register(permitAnalyticsRoutes, { prefix: '/permits/analytics' })
    await fastify.register(apiIntegrationRoutes, { prefix: '/permits/integrations' })

    // Project Phase History
    const { projectHistoryRoutes } = await import('./modules/projects/project-history.routes')
    await fastify.register(projectHistoryRoutes, { prefix: '/projects' })

    // Portfolios & Contractor Projects
    const { portfolioRoutes } = await import('./modules/marketplace/portfolio.routes')
    await fastify.register(portfolioRoutes, { prefix: '/marketplace/portfolios' })

    // Pre-Construction Extras
    const { preconExtrasRoutes } = await import('./modules/precon/precon-extras.routes')
    await fastify.register(preconExtrasRoutes, { prefix: '/precon' })

    // Approval Rules, Attachments, Comments
    const { approvalManagementRoutes } = await import('./modules/approvals/approval.routes')
    await fastify.register(approvalManagementRoutes, { prefix: '/approvals' })

    // Webhook Logs & Retries
    const { webhookLogRoutes } = await import('./modules/webhooks/webhook-logs.routes')
    await fastify.register(webhookLogRoutes, { prefix: '/webhooks' })

    // Estimation Data (Materials, Labor, Equipment)
    const { estimationDataRoutes } = await import('./modules/estimation/estimation-data.routes')
    await fastify.register(estimationDataRoutes, { prefix: '/estimation/data' })

    // Communication Logs, Activity, Issues
    const { communicationRoutes: commRoutes } = await import('./modules/communication/communication.routes')
    await fastify.register(commRoutes, { prefix: '/communication' })

    // Subscriptions (PM, Permit, A-la-carte, Marketplace Fees)
    const { subscriptionRoutes } = await import('./modules/subscriptions/subscription.routes')
    await fastify.register(subscriptionRoutes, { prefix: '/subscriptions' })

    // Tracking (User Actions, Quick Estimates, Automation Events, Crew Check-ins)
    const { trackingRoutes } = await import('./modules/tracking/tracking.routes')
    await fastify.register(trackingRoutes, { prefix: '/tracking' })

    // ══════════════════════════════════════════════════════════════

    // GraphQL DISABLED FOR MVP - Uncomment when needed
    /*
    const graphQLServer = createGraphQLServer()
    await graphQLServer.start()
    
    const { default: fastifyApollo } = await import('@as-integrations/fastify')
    
    await fastify.register(fastifyApollo(graphQLServer), {
      context: async (request: any, reply: any) => {
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
    */
    // GraphQL disabled - end comment block

    // ── Audit Middleware ──
    // Auto-audit all mutating API requests (POST/PUT/PATCH/DELETE)
    registerAuditMiddleware(fastify)

    // Graceful shutdown: flush pending audit logs
    fastify.addHook('onClose', async () => {
      const { auditService } = await import('./modules/audit/audit.service')
      await auditService.shutdown()
    })

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
    // console.log(`GraphQL:      /graphql`); // GraphQL disabled for MVP
    console.log('='.repeat(60));
    console.log('');
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
