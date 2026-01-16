import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'

describe('Health Check', () => {
  it('should return 200 and status ok', async () => {
    const fastify = Fastify()

    await fastify.register(cors, { origin: true })
    await fastify.register(helmet)

    fastify.get('/health', async () => {
      return { status: 'ok' }
    })

    await fastify.ready()

    const response = await fastify.inject({
      method: 'GET',
      url: '/health',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })

    await fastify.close()
  })
})
