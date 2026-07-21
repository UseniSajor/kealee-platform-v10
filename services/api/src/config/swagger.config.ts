import { FastifySwaggerOptions } from '@fastify/swagger'

/**
 * OpenAPI/Swagger configuration
 */
export const swaggerConfig: FastifySwaggerOptions = {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Kealee Platform API',
      description: 'API documentation for Kealee Platform V10',
      version: '1.0.0',
      contact: {
        name: 'Kealee Platform Support',
        email: 'support@kealee.com',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'auth', description: 'Authentication endpoints' },
      { name: 'users', description: 'User management endpoints' },
      { name: 'orgs', description: 'Organization management endpoints' },
      { name: 'rbac', description: 'Role-based access control endpoints' },
      { name: 'entitlements', description: 'Module entitlement endpoints' },
      { name: 'events', description: 'Event logging endpoints' },
      { name: 'audit', description: 'Audit logging endpoints' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from Supabase Auth',
        },
      },
    },
  },
} as any

/**
 * Swagger UI configuration
 */
export const swaggerUIConfig = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list' as const,
    deepLinking: true,
  },
  uiHooks: {
    onRequest: function (request: any, reply: any, next: any) {
      next()
    },
    preHandler: function (request: any, reply: any, next: any) {
      next()
    },
  },
  staticCSP: true,
  transformStaticCSP: (header: string) => header,
  transformSpecification: (swaggerObject: any) => {
    return swaggerObject
  },
  transformSpecificationClone: true,
}
