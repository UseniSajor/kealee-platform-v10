import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      email?: string
      role: string
      organizationId?: string | null
      profile?: any
      [key: string]: any
    }
  }
}
