/**
 * API Request Logging Middleware
 * Logs all API requests to database for analytics and monitoring.
 * Gracefully degrades to stdout if the api_request_logs table doesn't exist.
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { prismaAny } from '../utils/prisma-helper'

interface RequestLog {
  method: string
  path: string
  statusCode: number
  duration: number
  userId?: string
  ipAddress?: string
  userAgent?: string
  query?: Record<string, any>
  bodySize?: number
  responseSize?: number
}

// Batch logging to reduce database writes
const logQueue: RequestLog[] = []
const BATCH_SIZE = 50
const FLUSH_INTERVAL = 5000 // 5 seconds

let flushTimer: NodeJS.Timeout | null = null
let dbAvailable: boolean | null = null // null = not yet checked

/**
 * Check if api_request_logs table exists (one-time check)
 */
async function checkTableExists(): Promise<boolean> {
  try {
    await prismaAny.$executeRawUnsafe(
      `SELECT 1 FROM api_request_logs LIMIT 0`
    )
    return true
  } catch {
    return false
  }
}

/**
 * Flush logs to database (or stdout if table missing)
 */
async function flushLogs() {
  if (logQueue.length === 0) return

  const logs = logQueue.splice(0, BATCH_SIZE)

  // One-time table existence check
  if (dbAvailable === null) {
    dbAvailable = await checkTableExists()
    if (!dbAvailable) {
      console.warn('⚠️  api_request_logs table not found — request logging will use stdout only')
    }
  }

  if (!dbAvailable) {
    // Degrade to structured stdout logging (picked up by Railway/Sentry)
    for (const log of logs) {
      console.log(JSON.stringify({
        type: 'request_log',
        method: log.method,
        path: log.path,
        status: log.statusCode,
        duration_ms: log.duration,
        user_id: log.userId || null,
      }))
    }
    return
  }

  try {
    // Build a multi-row INSERT with parameterized values
    const values: any[] = []
    const placeholders: string[] = []
    let paramIndex = 1

    for (const log of logs) {
      placeholders.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, NOW())`
      )
      values.push(
        log.method,
        log.path,
        log.statusCode,
        log.duration,
        log.userId || null,
        log.ipAddress || null,
        log.userAgent || null,
        log.query ? JSON.stringify(log.query) : null,
        log.bodySize || null,
        log.responseSize || null,
      )
    }

    await prismaAny.$executeRawUnsafe(
      `INSERT INTO api_request_logs (method, path, status_code, duration_ms, user_id, ip_address, user_agent, query_params, body_size, response_size, created_at) VALUES ${placeholders.join(', ')}`,
      ...values
    )
  } catch (error: any) {
    // If table was dropped after startup, switch to stdout
    if (error?.message?.includes('does not exist') || error?.code === '42P01') {
      dbAvailable = false
      console.warn('⚠️  api_request_logs table lost — falling back to stdout logging')
    } else {
      console.error('Failed to flush request logs:', error)
    }
  }
}

/**
 * Start periodic flush timer
 */
function startFlushTimer() {
  if (flushTimer) return

  flushTimer = setInterval(() => {
    flushLogs().catch(console.error)
  }, FLUSH_INTERVAL)
}

/**
 * Request logger hook
 */
export async function requestLogger(request: FastifyRequest, reply: FastifyReply) {
  ;(request as any).__startTime = Date.now()

  // Start flush timer if not started
  startFlushTimer()
}

/**
 * Response logger hook
 */
export async function responseLogger(request: FastifyRequest, reply: FastifyReply) {
  const startTime = (request as any).__startTime
  if (!startTime) return

  const duration = Date.now() - startTime
  const user = (request as any).user

  // Skip logging health checks and static assets
  if (request.url.includes('/health') || request.url.includes('/_next')) {
    return
  }

  const log: RequestLog = {
    method: request.method,
    path: (request.routeOptions?.url as string) || request.url.split('?')[0],
    statusCode: reply.statusCode,
    duration,
    userId: user?.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    query: Object.keys(request.query as any || {}).length > 0 ? request.query as any : undefined,
    bodySize: request.headers['content-length'] ? parseInt(request.headers['content-length']) : undefined,
    responseSize: reply.getHeader('content-length') ? parseInt(reply.getHeader('content-length') as string) : undefined,
  }

  // Add to queue
  logQueue.push(log)

  // Flush if queue is full
  if (logQueue.length >= BATCH_SIZE) {
    await flushLogs()
  }
}

/**
 * Graceful shutdown - flush remaining logs
 */
export async function flushAllLogs() {
  if (logQueue.length > 0) {
    await flushLogs()
  }
  if (flushTimer) {
    clearInterval(flushTimer)
    flushTimer = null
  }
}
