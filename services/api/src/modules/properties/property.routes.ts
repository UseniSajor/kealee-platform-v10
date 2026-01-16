import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'
import { createPropertySchema, searchPropertiesQuerySchema, validateAddressQuerySchema } from '../../schemas'
import { propertyService } from './property.service'

export async function propertyRoutes(fastify: FastifyInstance) {
  // POST /properties - create property (wizard step 2)
  fastify.post(
    '/',
    {
      preHandler: [authenticateUser, validateBody(createPropertySchema)],
    },
    async (request, reply) => {
      const body = request.body as any
      const result = await propertyService.createProperty(body)
      return reply.code(201).send(result)
    }
  )

  // GET /properties/:id - get property by id
  fastify.get(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const property = await propertyService.getProperty(id)
      return reply.send({ property })
    }
  )

  // GET /properties/search?q= - simple search (autocomplete support)
  fastify.get(
    '/search',
    {
      preHandler: [authenticateUser, validateQuery(searchPropertiesQuerySchema)],
    },
    async (request, reply) => {
      const { q, orgId, limit } = request.query as any
      const properties = await propertyService.searchProperties(q, orgId, limit)
      return reply.send({ properties })
    }
  )

  // GET /properties/validate-address?address=&city=&state=&zip=
  fastify.get(
    '/validate-address',
    {
      preHandler: [authenticateUser, validateQuery(validateAddressQuerySchema)],
    },
    async (request, reply) => {
      const { address, city, state, zip } = request.query as any
      const result = await propertyService.validateAddress(address, city, state, zip)
      return reply.send(result)
    }
  )
}

