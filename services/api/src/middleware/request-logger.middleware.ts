/**
 * API Request Logging Middleware
 * Logs all API requests to database for analytics and monitoring
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

/**
 * Flush logs to database
 */
async function flushLogs() {
  if (logQueue.length === 0) return

  const logs = logQueue.splice(0, BATCH_SIZE)

  try {
    // Insert logs in batch
    await prismaAny.$executeRaw`
      INSERT INTO api_request_logs (method, path, status_code, duration_ms, user_id, ip_address, user_agent, query_params, body_size, response_size, created_at)
      VALUES ${prismaAny.Prisma.join(
        logs.map(
          (log) => prismaAny.Prisma.sql`(
            ${log.method},
            ${log.path},
            ${log.statusCode},
            ${log.duration},
            ${log.userId || null},
            ${log.ipAddress || null},
            ${log.userAgent || null},
            ${log.query ? JSON.stringify(log.query) : null},
            ${log.bodySize || null},
            ${log.responseSize || null},
            NOW()
          )`
        )
      )}
    `
  } catch (error) {
    console.error('Failed to flush request logs:', error)
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
  const startTime = Date.now()
  const user = (request as any).user

  // Store start time for response hook
  ;(request as any).__startTime = startTime
  ;(request as any).__user = user

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
  const user = (request as any).__user

  // Skip logging health checks and static assets
  if (request.url.includes('/health') || request.url.includes('/_next')) {
    return
  }

  const log: RequestLog = {
    method: request.method,
    path: request.routerPath || request.url.split('?')[0],
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
