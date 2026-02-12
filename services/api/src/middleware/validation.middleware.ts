import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodType } from 'zod'

/**
 * Validation middleware factory
 * Creates a middleware function that validates request body, query, or params
 *
 * Uses ZodType<any, any, any> instead of ZodSchema<T> to support schemas
 * that use .transform(), .default(), .coerce, etc. where input and output
 * types differ.
 */
export function validateRequest(
  schema: {
    body?: ZodType<any, any, any>
    query?: ZodType<any, any, any>
    params?: ZodType<any, any, any>
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
export function validateBody(schema: ZodType<any, any, any>) {
  return validateRequest({ body: schema })
}

/**
 * Convenience function for query validation only
 */
export function validateQuery(schema: ZodType<any, any, any>) {
  return validateRequest({ query: schema })
}

/**
 * Convenience function for params validation only
 */
export function validateParams(schema: ZodType<any, any, any>) {
  return validateRequest({ params: schema })
}
