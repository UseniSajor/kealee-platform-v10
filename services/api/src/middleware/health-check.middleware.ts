/**
 * Enhanced Health Check Endpoint
 * Checks database, Redis, and external services
 */

import { FastifyInstance } from 'fastify'
import { prismaAny } from '../utils/prisma-helper'
import IORedis from 'ioredis'

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
    try {
      const stripe = require('../modules/billing/stripe.client').getStripe()
      await stripe.balance.retrieve()
      services.stripe = { status: 'healthy' }
    } catch (error: any) {
      services.stripe = { status: 'degraded', error: error.message }
    }
  }

  // Check Supabase
  if (process.env.SUPABASE_URL) {
    try {
      const supabase = require('../../utils/supabase-client').getSupabaseClient()
      const { error } = await supabase.auth.getSession()
      services.supabase = { status: error ? 'degraded' : 'healthy', error: error?.message }
    } catch (error: any) {
      services.supabase = { status: 'down', error: error.message }
    }
  }

  return services
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
