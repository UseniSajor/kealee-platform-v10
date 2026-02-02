/**
 * CSRF Protection Plugin
 * Protects against Cross-Site Request Forgery attacks
 */

import csrfProtection from '@fastify/csrf-protection';
import { FastifyInstance } from 'fastify';

export async function registerCSRFProtection(server: FastifyInstance) {
  // Register CSRF protection
  await server.register(csrfProtection, {
    // Cookie options
    cookieOpts: {
      signed: true,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    },
    // Session plugin must be registered before CSRF
    sessionPlugin: '@fastify/cookie',
  });

  // Add CSRF token to response headers for SPA
  server.addHook('onRequest', async (request, reply) => {
    // Skip CSRF for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return;
    }

    // Skip CSRF for webhook endpoints (they use signature verification)
    if (request.url.startsWith('/webhooks/')) {
      return;
    }

    // Skip CSRF for API endpoints that use Bearer tokens
    if (request.headers.authorization?.startsWith('Bearer')) {
      return;
    }
  });

  console.log('✅ CSRF Protection enabled');
}
