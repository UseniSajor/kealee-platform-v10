/**
 * Enhanced Health Check Endpoint
 * Checks database, Redis, external services, queue metrics, and AI usage
 */

import { FastifyInstance } from 'fastify'
import { prismaAny } from '../utils/prisma-helper'
import IORedis from 'ioredis'
import { Queue } from 'bullmq'

// ============================================================================
// TYPES
// ============================================================================

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down'
  timestamp: string
  checks: {
    database: { status: 'healthy' | 'degraded' | 'down'; latency?: number; error?: string }
    redis?: { status: 'healthy' | 'degraded' | 'down'; latency?: number; error?: string }
    external?: { status: 'healthy' | 'degraded' | 'down'; services: Record<string, any> }
  }
  version: string
  uptime: number
}

interface QueueMetrics {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  status: 'healthy' | 'warning' | 'critical'
}

interface MetricsResponse {
  timestamp: string
  system: {
    status: 'healthy' | 'degraded' | 'down'
    uptime: number
    version: string
    memoryUsage: { heapUsed: number; heapTotal: number; rss: number }
  }
  database: { status: 'healthy' | 'degraded' | 'down'; latency?: number; error?: string }
  redis: { status: 'healthy' | 'degraded' | 'down'; latency?: number; error?: string }
  queues: Record<string, QueueMetrics>
  queuesSummary: {
    totalActive: number
    totalFailed: number
    totalWaiting: number
    healthyCount: number
    warningCount: number
    criticalCount: number
  }
  services: Record<string, { status: string; latency?: number; error?: string }>
  ai: { configured: boolean; model?: string }
}

// ============================================================================
// QUEUE NAMES (mirrored from command-center/shared/queue.ts)
// ============================================================================

const QUEUE_NAMES: Record<string, string> = {
  BID_ENGINE: 'kealee-bid-engine',
  VISIT_SCHEDULER: 'kealee-visit-scheduler',
  CHANGE_ORDER: 'kealee-change-order',
  REPORT_GENERATOR: 'kealee-report-generator',
  PERMIT_TRACKER: 'kealee-permit-tracker',
  INSPECTION: 'kealee-inspection-coordinator',
  BUDGET_TRACKER: 'kealee-budget-tracker',
  COMMUNICATION: 'kealee-communication-hub',
  TASK_QUEUE: 'kealee-task-queue',
  DOCUMENT_GEN: 'kealee-document-gen',
  PREDICTIVE: 'kealee-predictive-engine',
  SMART_SCHEDULER: 'kealee-smart-scheduler',
  QA_INSPECTOR: 'kealee-qa-inspector',
  DECISION_SUPPORT: 'kealee-decision-support',
  ESTIMATION: 'kealee-estimation-engine',
}

// ============================================================================
// CONNECTIONS
// ============================================================================

let redisClient: IORedis | null = null

function getRedisClient(): IORedis | null {
  if (redisClient) return redisClient

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  try {
    redisClient = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      connectTimeout: 5000,
    })
    return redisClient
  } catch {
    return null
  }
}

// Lazy-created BullMQ Queue instances for metrics queries
let metricsQueues: Record<string, Queue> | null = null

function getMetricsQueues(): Record<string, Queue> | null {
  if (metricsQueues) return metricsQueues

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  try {
    metricsQueues = {}
    for (const [key, name] of Object.entries(QUEUE_NAMES)) {
      metricsQueues[key] = new Queue(name, {
        connection: {
          host: new URL(redisUrl.replace('redis://', 'http://')).hostname,
          port: parseInt(new URL(redisUrl.replace('redis://', 'http://')).port || '6379'),
          maxRetriesPerRequest: null,
        },
      })
    }
    return metricsQueues
  } catch {
    return null
  }
}

// ============================================================================
// CHECK FUNCTIONS
// ============================================================================

/**
 * Check database connection
 */
async function checkDatabase(): Promise<{ status: 'healthy' | 'degraded' | 'down'; latency?: number; error?: string }> {
  const startTime = Date.now()
  try {
    await prismaAny.$queryRaw`SELECT 1`
    const latency = Date.now() - startTime

    if (latency > 1000) {
      return { status: 'degraded', latency }
    }

    return { status: 'healthy', latency }
  } catch (error: any) {
    return {
      status: 'down',
      latency: Date.now() - startTime,
      error: error.message,
    }
  }
}

/**
 * Check Redis connection
 */
async function checkRedis(): Promise<{ status: 'healthy' | 'degraded' | 'down'; latency?: number; error?: string }> {
  const client = getRedisClient()
  if (!client) {
    return { status: 'down', error: 'Redis not configured' }
  }

  const startTime = Date.now()
  try {
    await client.ping()
    const latency = Date.now() - startTime

    if (latency > 500) {
      return { status: 'degraded', latency }
    }

    return { status: 'healthy', latency }
  } catch (error: any) {
    return {
      status: 'down',
      latency: Date.now() - startTime,
      error: error.message,
    }
  }
}

/**
 * Check external services
 */
async function checkExternalServices(): Promise<Record<string, any>> {
  const services: Record<string, any> = {}

  // Check Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    const startTime = Date.now()
    try {
      const stripe = require('../modules/billing/stripe.client').getStripe()
      await stripe.balance.retrieve()
      services.stripe = { status: 'healthy', latency: Date.now() - startTime }
    } catch (error: any) {
      services.stripe = { status: 'degraded', latency: Date.now() - startTime, error: error.message }
    }
  }

  // Check Supabase
  if (process.env.SUPABASE_URL) {
    const startTime = Date.now()
    try {
      const supabase = require('../../utils/supabase-client').getSupabaseClient()
      const { error } = await supabase.auth.getSession()
      services.supabase = {
        status: error ? 'degraded' : 'healthy',
        latency: Date.now() - startTime,
        error: error?.message,
      }
    } catch (error: any) {
      services.supabase = { status: 'down', latency: Date.now() - startTime, error: error.message }
    }
  }

  // Check Anthropic (Claude AI)
  if (process.env.ANTHROPIC_API_KEY) {
    services.anthropic = { status: 'healthy', configured: true }
  } else {
    services.anthropic = { status: 'down', configured: false, error: 'API key not configured' }
  }

  // Check Resend (Email)
  if (process.env.RESEND_API_KEY) {
    services.resend = { status: 'healthy', configured: true }
  } else {
    services.resend = { status: 'down', configured: false, error: 'API key not configured' }
  }

  return services
}

/**
 * Get metrics for all BullMQ queues
 */
async function getAllQueueMetrics(): Promise<Record<string, QueueMetrics>> {
  const queues = getMetricsQueues()
  if (!queues) return {}

  const metrics: Record<string, QueueMetrics> = {}

  for (const [key, queue] of Object.entries(queues)) {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ])

      // Determine queue health
      let status: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (failed >= 50 || waiting >= 500) {
        status = 'critical'
      } else if (failed >= 10 || waiting >= 100) {
        status = 'warning'
      }

      metrics[key] = { waiting, active, completed, failed, delayed, status }
    } catch {
      metrics[key] = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, status: 'critical' }
    }
  }

  return metrics
}

/**
 * Calculate overall health status
 */
function calculateOverallStatus(checks: HealthStatus['checks']): 'healthy' | 'degraded' | 'down' {
  const allChecks = [
    checks.database,
    checks.redis,
    ...Object.values(checks.external || {}),
  ].filter((c): c is { status: 'healthy' | 'degraded' | 'down'; latency?: number; error?: string } =>
    c !== undefined && typeof c === 'object' && 'status' in c
  )
  const downChecks = allChecks.filter((c) => c.status === 'down')
  const degradedChecks = allChecks.filter((c) => c.status === 'degraded')

  if (downChecks.length > 0 || checks.database.status === 'down') {
    return 'down'
  }

  if (degradedChecks.length > 0 || checks.database.status === 'degraded') {
    return 'degraded'
  }

  return 'healthy'
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

/**
 * Register health check routes
 */
export function registerHealthChecks(fastify: FastifyInstance) {
  const startTime = Date.now()

  // Basic health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Detailed health check
  fastify.get('/health/detailed', async (): Promise<HealthStatus> => {
    const [dbCheck, redisCheck, externalServices] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkExternalServices(),
    ])

    const checks: HealthStatus['checks'] = {
      database: dbCheck,
      ...(redisCheck && { redis: redisCheck }),
      ...(Object.keys(externalServices).length > 0 && { external: { status: 'healthy' as const, services: externalServices } }),
    }

    const status = calculateOverallStatus(checks)

    return {
      status,
      timestamp: new Date().toISOString(),
      checks,
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
    }
  })

  // Full metrics endpoint — used by monitoring dashboard
  fastify.get('/health/metrics', async (): Promise<MetricsResponse> => {
    const [dbCheck, redisCheck, externalServices, queueMetrics] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkExternalServices(),
      getAllQueueMetrics(),
    ])

    // Calculate queue summary
    const queueValues = Object.values(queueMetrics)
    const queuesSummary = {
      totalActive: queueValues.reduce((sum, q) => sum + q.active, 0),
      totalFailed: queueValues.reduce((sum, q) => sum + q.failed, 0),
      totalWaiting: queueValues.reduce((sum, q) => sum + q.waiting, 0),
      healthyCount: queueValues.filter((q) => q.status === 'healthy').length,
      warningCount: queueValues.filter((q) => q.status === 'warning').length,
      criticalCount: queueValues.filter((q) => q.status === 'critical').length,
    }

    // Determine overall status
    const checks: HealthStatus['checks'] = {
      database: dbCheck,
      redis: redisCheck,
      external: { status: 'healthy' as const, services: externalServices },
    }
    const overallStatus = calculateOverallStatus(checks)

    // Memory usage
    const mem = process.memoryUsage()

    return {
      timestamp: new Date().toISOString(),
      system: {
        status: overallStatus,
        uptime: Math.floor((Date.now() - startTime) / 1000),
        version: process.env.npm_package_version || '1.0.0',
        memoryUsage: {
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
          rss: Math.round(mem.rss / 1024 / 1024),
        },
      },
      database: dbCheck,
      redis: redisCheck,
      queues: queueMetrics,
      queuesSummary,
      services: externalServices,
      ai: {
        configured: !!process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_API_KEY ? 'claude-sonnet-4-20250514' : undefined,
      },
    }
  })

  // Database health check
  fastify.get('/health/db', async () => {
    const check = await checkDatabase()
    return {
      status: check.status,
      latency: check.latency,
      error: check.error,
    }
  })

  // Redis health check
  fastify.get('/health/redis', async () => {
    const check = await checkRedis()
    return {
      status: check.status,
      latency: check.latency,
      error: check.error,
    }
  })
}
