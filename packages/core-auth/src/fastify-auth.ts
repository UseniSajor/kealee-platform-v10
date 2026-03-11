/**
 * Shared Fastify Auth Plugin for OS Services
 *
 * Provides Supabase JWT authentication middleware for all v20 services.
 * Extracts Bearer token, verifies via Supabase, attaches user to request.
 *
 * Usage in any OS service:
 *   import { authPlugin, authenticate } from '@kealee/core-auth/fastify-auth'
 *   await app.register(authPlugin)
 *   app.get('/protected', { preHandler: [authenticate] }, handler)
 *
 * Or protect all routes in a plugin:
 *   app.addHook('onRequest', authenticate)
 */

import { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  role: string
  organizationId?: string | null
  [key: string]: unknown
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser
  }
}

let supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (supabase) return supabase
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }
  supabase = createClient(url, key)
  return supabase
}

/**
 * Authenticate a request via Supabase JWT.
 * Use as preHandler hook on individual routes or as onRequest hook for all routes.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing or invalid authorization header' })
    return
  }

  const token = authHeader.substring(7)

  try {
    const sb = getSupabase()
    const { data, error } = await sb.auth.getUser(token)
    if (error) throw error

    // Attach user to request
    request.user = {
      id: data.user.id,
      email: data.user.email || '',
      role: (data.user.user_metadata?.role as string) || 'USER',
      organizationId: (data.user.user_metadata?.organizationId as string) || null,
    }
  } catch {
    reply.code(401).send({ error: 'Invalid or expired token' })
  }
}

/**
 * Require specific role(s). Must be used AFTER authenticate.
 */
export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      reply.code(401).send({ error: 'Authentication required' })
      return
    }
    if (request.user.role === 'ADMIN') return // Admins bypass role checks
    if (!roles.includes(request.user.role)) {
      reply.code(403).send({ error: `Required role: ${roles.join(' or ')}` })
    }
  }
}

/**
 * Fastify plugin that registers the auth decorator.
 * Register once per Fastify instance.
 */
const authPluginCallback: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  // Decorate request with user (undefined by default)
  fastify.decorateRequest('user', undefined)
  done()
}

export const authPlugin = fp(authPluginCallback, {
  name: 'kealee-auth',
  fastify: '4.x',
})
