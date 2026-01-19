import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import csrf from '@fastify/csrf-protection'

/**
 * CSRF Protection Middleware
 * Protects all POST/PUT/PATCH/DELETE routes from CSRF attacks
 * 
 * Security Critical: This prevents Cross-Site Request Forgery attacks
 */
export async function registerCSRFProtection(fastify: FastifyInstance) {
  // Register CSRF protection plugin
  await fastify.register(csrf, {
    // Generate CSRF token secret from environment or use default
    secret: process.env.CSRF_SECRET || 'change-this-secret-in-production',
    // Cookie options
    cookieOpts: {
      signed: true,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  })

  // Add hook to verify CSRF token on state-changing requests
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip CSRF for webhooks (they use signature verification instead)
    if (
      request.url.startsWith('/webhooks/') ||
      request.url.startsWith('/billing/stripe/webhook') ||
      request.url.startsWith('/docusign/webhook')
    ) {
      return
    }

    // Skip CSRF for health check endpoints
    if (request.url.startsWith('/health')) {
      return
    }

    // Skip CSRF for GET/HEAD/OPTIONS requests (idempotent)
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return
    }

    // For POST/PUT/PATCH/DELETE, verify CSRF token
    // Token can be in header (X-CSRF-Token) or body (_csrf)
    const tokenFromHeader = request.headers['x-csrf-token'] as string
    const tokenFromBody = (request.body as any)?._csrf as string
    const token = tokenFromHeader || tokenFromBody

    if (!token) {
      fastify.log.warn({
        message: 'CSRF token missing',
        url: request.url,
        method: request.method,
        ip: request.ip,
      })
      return reply.code(403).send({
        error: {
          message: 'CSRF token missing',
          code: 'CSRF_TOKEN_MISSING',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        },
      })
    }

    // Verify token using Fastify's CSRF plugin
    try {
      await reply.verifyCsrf(token)
    } catch (error: any) {
      fastify.log.warn({
        message: 'CSRF token verification failed',
        url: request.url,
        method: request.method,
        ip: request.ip,
        error: error.message,
      })
      return reply.code(403).send({
        error: {
          message: 'Invalid CSRF token',
          code: 'CSRF_TOKEN_INVALID',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        },
      })
    }
  })

  // Add route to get CSRF token (for frontend)
  fastify.get('/csrf-token', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = await reply.generateCsrf()
    return {
      csrfToken: token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    }
  })
}

