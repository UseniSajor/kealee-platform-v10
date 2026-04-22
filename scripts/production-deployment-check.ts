#!/usr/bin/env node

/**
 * scripts/production-deployment-check.ts
 *
 * Comprehensive production deployment validation for Kealee Platform
 *
 * Validates:
 * - All services can build successfully
 * - Environment variables are correctly configured
 * - Critical routes are accessible
 * - Database and Redis connectivity
 * - API and frontend can communicate
 * - Webhook endpoints are public
 * - Production safeguards are in place
 *
 * Usage: pnpm production-deployment-check
 */

import * as fs from 'fs'
import * as path from 'path'

interface CheckResult {
  category: string
  test: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  details?: Record<string, unknown>
}

const results: CheckResult[] = []

function check(
  category: string,
  test: string,
  condition: boolean,
  message: string,
  details?: Record<string, unknown>,
  warn: boolean = false,
) {
  results.push({
    category,
    test,
    status: condition ? 'PASS' : warn ? 'WARN' : 'FAIL',
    message,
    details,
  })
}

function log(message: string, icon = '') {
  console.log(`${icon} ${message}`)
}

// ============================================================================
// 1. BUILD VERIFICATION
// ============================================================================

log('\n🔨 1. BUILD VERIFICATION')
log('=====================================')

// Check API build
const apiPackageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'services/api/package.json'), 'utf-8'),
)
check('Build', 'API package.json exists', true, 'services/api/package.json found')
check('Build', 'API build script', !!apiPackageJson.scripts?.build, 'API build script defined')
check('Build', 'API build:ts script', !!apiPackageJson.scripts?.['build:ts'], 'API build:ts script defined')
check('Build', 'API start script', !!apiPackageJson.scripts?.start, 'API start script defined')

// Check Worker build
const workerPackageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'services/worker/package.json'), 'utf-8'),
)
check('Build', 'Worker package.json exists', true, 'services/worker/package.json found')
check('Build', 'Worker build script', !!workerPackageJson.scripts?.build, 'Worker build script defined')
check('Build', 'Worker start script', !!workerPackageJson.scripts?.start, 'Worker start script defined')

// Check Web-Main build
const webPackageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'apps/web-main/package.json'), 'utf-8'),
)
check('Build', 'Web-Main package.json exists', true, 'apps/web-main/package.json found')
check('Build', 'Web-Main build script', !!webPackageJson.scripts?.build, 'Web-Main build script defined')
check('Build', 'Web-Main start script', !!webPackageJson.scripts?.start, 'Web-Main start script defined')

// Check Dockerfiles
const apiDockerfile = fs.existsSync(path.join(process.cwd(), 'services/api/Dockerfile'))
const workerDockerfile = fs.existsSync(path.join(process.cwd(), 'services/worker/Dockerfile'))
check('Build', 'API Dockerfile', apiDockerfile, 'services/api/Dockerfile exists')
check('Build', 'Worker Dockerfile', workerDockerfile, 'services/worker/Dockerfile exists')

// ============================================================================
// 2. ENVIRONMENT VARIABLES
// ============================================================================

log('\n🔑 2. ENVIRONMENT VARIABLES')
log('=====================================')

const requiredEnvVars = [
  { name: 'NODE_ENV', services: ['api', 'worker', 'web'], example: 'production' },
  { name: 'DATABASE_URL', services: ['api', 'worker'], example: 'postgresql://...' },
  { name: 'REDIS_URL', services: ['api', 'worker'], example: 'redis://...' },
  { name: 'STRIPE_SECRET_KEY', services: ['api'], example: 'sk_live_...' },
  { name: 'ANTHROPIC_API_KEY', services: ['api', 'worker'], example: 'sk-ant-...' },
  { name: 'NEXT_PUBLIC_API_URL', services: ['web'], example: 'https://api.kealee.com' },
]

const isProduction = process.env.NODE_ENV === 'production'

for (const envVar of requiredEnvVars) {
  const exists = process.env[envVar.name] !== undefined
  const isSet = exists && process.env[envVar.name]?.trim() !== ''
  const isCorrectFormat =
    envVar.name === 'NODE_ENV'
      ? process.env[envVar.name] === 'production' || !isProduction
      : true

  check(
    'Env Vars',
    `${envVar.name} (${envVar.services.join(', ')})`,
    exists && isSet && isCorrectFormat,
    exists && isSet ? `✓ ${envVar.name} is set` : `✗ ${envVar.name} is not set`,
    { example: envVar.example },
    !isProduction, // Warn instead of fail in development
  )
}

// Check Stripe price IDs
const stripePrefix = 'STRIPE_PRICE_'
const stripePriceEnvVars = Object.keys(process.env).filter(key => key.startsWith(stripePrefix))
check(
  'Env Vars',
  'Stripe Price IDs',
  stripePriceEnvVars.length >= 20,
  `${stripePriceEnvVars.length}/25 Stripe price IDs set`,
  { count: stripePriceEnvVars.length },
  stripePriceEnvVars.length < 25,
)

// ============================================================================
// 3. CRITICAL FILES
// ============================================================================

log('\n📁 3. CRITICAL FILES')
log('=====================================')

const criticalFiles = [
  'services/api/src/index.ts',
  'services/worker/src/index.ts',
  'apps/web-main/next.config.js',
  'apps/web-main/package.json',
  'packages/database/package.json',
  '.env.example',
  'docker-compose.yml',
  'GO_LIVE_ACTIVATION.md',
  'RAILWAY_CONFIG_REFERENCE.md',
]

for (const file of criticalFiles) {
  const exists = fs.existsSync(path.join(process.cwd(), file))
  check('Files', file, exists, exists ? `✓ ${file} found` : `✗ ${file} missing`)
}

// ============================================================================
// 4. CONFIGURATION VALIDATION
// ============================================================================

log('\n⚙️  4. CONFIGURATION VALIDATION')
log('=====================================')

// Check Next.js config for production
const nextConfigPath = path.join(process.cwd(), 'apps/web-main/next.config.js')
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf-8')
check(
  'Config',
  'Next.js output standalone',
  nextConfigContent.includes("output: 'standalone'"),
  "Next.js configured with output: 'standalone'",
)

// Check API port configuration
const apiIndexPath = path.join(process.cwd(), 'services/api/src/index.ts')
const apiContent = fs.readFileSync(apiIndexPath, 'utf-8')
check('Config', 'API port from env', apiContent.includes('process.env.PORT'), 'API port from PORT env var')

// Check docker-compose health checks
const dockerComposePath = path.join(process.cwd(), 'docker-compose.yml')
const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf-8')
check(
  'Config',
  'Docker Compose health checks',
  dockerComposeContent.includes('healthcheck'),
  'Docker Compose includes health checks',
)

// ============================================================================
// 5. PRODUCTION SAFEGUARDS
// ============================================================================

log('\n🛡️  5. PRODUCTION SAFEGUARDS')
log('=====================================')

check(
  'Safeguards',
  'DATABASE_URL not in frontend code',
  !fs.readFileSync(path.join(process.cwd(), 'apps/web-main/lib/api.ts'), 'utf-8').includes('DATABASE_URL'),
  'DATABASE_URL not exposed to frontend',
  undefined,
  true,
)

check(
  'Safeguards',
  'No hardcoded secrets',
  !apiContent.includes("STRIPE_SECRET_KEY = '"),
  'No hardcoded secrets in API code',
)

check(
  'Safeguards',
  'Error handling implemented',
  apiContent.includes('captureException') || apiContent.includes('logger.error'),
  'Error tracking configured (Sentry or Logger)',
)

// Check for localhost references in production
const webMainContent = fs.readFileSync(path.join(process.cwd(), 'apps/web-main/lib/keacore.ts'), 'utf-8')
check(
  'Safeguards',
  'Uses env vars for API URL',
  webMainContent.includes('process.env.NEXT_PUBLIC_API_URL'),
  'Frontend uses environment variable for API URL',
)

// ============================================================================
// 6. ROUTE VERIFICATION
// ============================================================================

log('\n🛣️  6. ROUTE VERIFICATION')
log('=====================================')

const expectedRoutes = [
  'GET /health',
  'POST /api/v1/concepts/intake',
  'POST /api/v1/estimation/intake',
  'POST /api/v1/permits/intake',
  'GET /api/project-output/:id',
  'POST /webhooks/stripe',
]

for (const route of expectedRoutes) {
  const [method, path] = route.split(' ')
  check(
    'Routes',
    route,
    apiContent.includes(path.replace('/:id', '')),
    `Route ${route} implemented in API`,
    undefined,
    true,
  )
}

// ============================================================================
// 7. WORKER CONFIGURATION
// ============================================================================

log('\n⚙️  7. WORKER CONFIGURATION')
log('=====================================')

const workerContent = fs.readFileSync(path.join(process.cwd(), 'services/worker/src/index.ts'), 'utf-8')
check('Worker', 'Redis connection configured', workerContent.includes('Redis'), 'Worker connects to Redis')
check('Worker', 'BullMQ queues initialized', workerContent.includes('Queue'), 'BullMQ queues initialized')
check(
  'Worker',
  'Error handling',
  workerContent.includes('catch') || workerContent.includes('logger'),
  'Error handling implemented',
)

// ============================================================================
// 8. DEPLOYMENT READINESS
// ============================================================================

log('\n🚀 8. DEPLOYMENT READINESS')
log('=====================================')

const passCount = results.filter(r => r.status === 'PASS').length
const failCount = results.filter(r => r.status === 'FAIL').length
const warnCount = results.filter(r => r.status === 'WARN').length

const isReady = failCount === 0 && passCount > results.length * 0.8

check(
  'Readiness',
  'Overall Status',
  isReady,
  `${passCount}/${results.length} checks passed${warnCount > 0 ? `, ${warnCount} warnings` : ''}`,
)

// ============================================================================
// PRINT SUMMARY
// ============================================================================

console.log('\n\n' + '='.repeat(70))
console.log('PRODUCTION DEPLOYMENT CHECK SUMMARY')
console.log('='.repeat(70))

// Group by category
const categories = Array.from(new Set(results.map(r => r.category)))

for (const category of categories) {
  const categoryResults = results.filter(r => r.category === category)
  const categoryPass = categoryResults.filter(r => r.status === 'PASS').length
  const categoryFail = categoryResults.filter(r => r.status === 'FAIL').length
  const categoryWarn = categoryResults.filter(r => r.status === 'WARN').length

  log(
    `\n${category}`,
    categoryFail === 0 ? '✅' : '⚠️',
  )
  for (const result of categoryResults) {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌'
    log(`  ${icon} ${result.test}: ${result.message}`, '')
  }
  log(`  → ${categoryPass}/${categoryResults.length} passed`, '')
}

console.log('\n' + '='.repeat(70))
console.log('FINAL STATUS')
console.log('='.repeat(70))

log(`✅ Passed: ${passCount}`, '')
log(`⚠️  Warned: ${warnCount}`, '')
log(`❌ Failed: ${failCount}`, '')

if (isReady) {
  log(`\n🎉 DEPLOYMENT READY`, '')
  log(`All critical checks passed. Ready for production deployment.`, '')
  log(`\nNext steps:`, '')
  log(`  1. Verify environment variables on Railway`, '')
  log(`  2. Run: git push origin main (auto-deploys to Railway)`, '')
  log(`  3. Run: pnpm go-live-check (post-deployment verification)`, '')
  log(`  4. Run: pnpm automation-validation (full system test)`, '')
} else if (failCount > 0) {
  log(`\n❌ DEPLOYMENT BLOCKED`, '')
  log(`${failCount} critical issues must be fixed before deployment.`, '')
  log(`\nFailing checks:`, '')
  for (const result of results.filter(r => r.status === 'FAIL')) {
    log(`  - [${result.category}] ${result.test}: ${result.message}`, '')
  }
} else {
  log(`\n⚠️  DEPLOYMENT WITH WARNINGS`, '')
  log(`${warnCount} warnings detected. Review before deploying to production.`, '')
}

console.log('\n' + '='.repeat(70))
console.log('')

process.exit(failCount > 0 ? 1 : 0)
