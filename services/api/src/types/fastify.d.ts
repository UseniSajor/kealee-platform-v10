import 'fastify'

declare module 'fastify' {
  interface FastifySchema {
    tags?: string[]
    summary?: string
    description?: string
    security?: Array<Record<string, string[]>>
    consumes?: string[]
    produces?: string[]
  }

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
