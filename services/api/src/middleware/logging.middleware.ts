import { FastifyRequest, FastifyReply } from 'fastify'

/**
 * Request logging middleware
 * Logs all incoming requests with metadata
 */
export async function requestLogger(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Store start time on request for response logging
  ;(request as any).startTime = Date.now()

  // Log request
  request.log.info({
    type: 'request',
    method: request.method,
    url: request.url,
    path: request.routerPath || request.url,
    query: request.query,
    headers: {
      'user-agent': request.headers['user-agent'],
      'content-type': request.headers['content-type'],
      'content-length': request.headers['content-length'],
    },
    ip: request.ip,
    userId: (request as any).user?.id,
    orgId: (request.headers as any)['x-org-id'],
  })
}

export async function responseLogger(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const startTime = (request as any).startTime || Date.now()
  const duration = Date.now() - startTime

  request.log.info({
    type: 'response',
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    duration: `${duration}ms`,
    userId: (request as any).user?.id,
  })
}

/**
 * Error logging middleware
 * Enhanced error logging with context
 */
export function logError(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const errorContext = {
    type: 'error',
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
    },
    request: {
      method: request.method,
      url: request.url,
      path: request.routerPath || request.url,
      query: request.query,
      body: request.body,
      params: request.params,
      headers: {
        'user-agent': request.headers['user-agent'],
        'content-type': request.headers['content-type'],
      },
      ip: request.ip,
      userId: (request as any).user?.id,
      orgId: (request.headers as any)['x-org-id'],
    },
    response: {
      statusCode: reply.statusCode,
    },
    timestamp: new Date().toISOString(),
  }

  // Log error with appropriate level
  if (reply.statusCode >= 500) {
    request.log.error(errorContext)
  } else if (reply.statusCode >= 400) {
    request.log.warn(errorContext)
  } else {
    request.log.info(errorContext)
  }
}

/**
 * Configure Fastify logger
 */
export function configureLogger() {
  const logLevel = process.env.LOG_LEVEL || 'info'
  const isDevelopment = process.env.NODE_ENV === 'development'

  return {
    level: logLevel,
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    serializers: {
      req: (request: FastifyRequest) => ({
        method: request.method,
        url: request.url,
        path: request.routerPath,
        headers: {
          host: request.headers.host,
          'user-agent': request.headers['user-agent'],
        },
        remoteAddress: request.ip,
        remotePort: request.socket.remotePort,
      }),
      res: (reply: FastifyReply) => ({
        statusCode: reply.statusCode,
      }),
      err: (error: Error) => ({
        type: error.name,
        message: error.message,
        stack: error.stack,
      }),
    },
  }
}
