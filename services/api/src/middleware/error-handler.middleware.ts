import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { AppError } from '../errors/app.error'
import { logError } from './logging.middleware'
import { sanitizeErrorMessage } from '../utils/sanitize-error'

/**
 * Structured error response format
 */
export interface ErrorResponse {
  error: {
    message: string
    code?: string
    statusCode: number
    details?: any
    timestamp: string
    path?: string
  }
}

/**
 * Global error handler
 */
export async function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error with enhanced context
  logError(error, request, reply)

  // Handle Zod validation errors
  // NOTE: In monorepos/bundled test environments, `instanceof ZodError` can be unreliable.
  const isZodError =
    error instanceof ZodError ||
    (error as any)?.name === 'ZodError' ||
    Array.isArray((error as any)?.errors)

  if (isZodError) {
    const zod = error as unknown as ZodError
    return reply.code(400).send({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: zod.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    })
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    })
  }

  // Handle Fastify/AJV validation errors (route schema validation)
  if (Array.isArray((error as any).validation) && (error as any).statusCode === 400) {
    return reply.code(400).send({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: (error as any).validation,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    })
  }

  // Handle Fastify errors
  if ((error as any).statusCode) {
    return reply.code((error as any).statusCode).send({
      error: {
        message: sanitizeErrorMessage(error, 'An error occurred'),
        statusCode: (error as any).statusCode,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    })
  }

  // Handle unknown errors
  const isDevelopment = process.env.NODE_ENV === 'development'
  return reply.code(500).send({
    error: {
      message: isDevelopment ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      ...(isDevelopment && { stack: error.stack }),
      timestamp: new Date().toISOString(),
      path: request.url,
    },
  })
}

/**
 * Not found handler
 */
export async function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return reply.code(404).send({
    error: {
      message: `Route ${request.method} ${request.url} not found`,
      code: 'NOT_FOUND',
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: request.url,
    },
  })
}
