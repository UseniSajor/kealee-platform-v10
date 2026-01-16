import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodSchema } from 'zod'

/**
 * Validation middleware factory
 * Creates a middleware function that validates request body, query, or params
 */
export function validateRequest(
  schema: {
    body?: ZodSchema
    query?: ZodSchema
    params?: ZodSchema
  }
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Let the global error handler format validation failures consistently.
    // Fastify will route thrown ZodErrors to `errorHandler`.
    if (schema.body) request.body = schema.body.parse(request.body)
    if (schema.query) request.query = schema.query.parse(request.query)
    if (schema.params) request.params = schema.params.parse(request.params)
  }
}

/**
 * Convenience function for body validation only
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return validateRequest({ body: schema })
}

/**
 * Convenience function for query validation only
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return validateRequest({ query: schema })
}

/**
 * Convenience function for params validation only
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return validateRequest({ params: schema })
}
