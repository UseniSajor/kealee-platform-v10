import { FastifyRequest, FastifyReply } from 'fastify'
import { authService } from './auth.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import { verifyClerkJWT } from '../../utils/clerk-jwt.utils'

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string
    userId: string
    email: string
    role: string
    organizationId?: string | null
    profile?: any
    clerkUserId?: string // Clerk user ID if authenticated via Clerk
    authSource?: 'clerk' | 'supabase' // Which auth provider was used
    [key: string]: any
  }
}

export async function authenticateUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        error: 'Missing or invalid authorization header',
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Try Clerk first, then fall back to Supabase
    let user: any
    let authSource: 'clerk' | 'supabase' = 'supabase'

    // Try Clerk JWT (if CLERK_SECRET_KEY is set)
    if (process.env.CLERK_SECRET_KEY) {
      try {
        const clerkClaims = await verifyClerkJWT(token)
        if (clerkClaims) {
          user = {
            id: clerkClaims.sub,
            userId: clerkClaims.sub,
            email: clerkClaims.email,
            clerkUserId: clerkClaims.sub,
            role: clerkClaims.role || 'USER',
            authSource: 'clerk',
          }
          authSource = 'clerk'
        }
      } catch (clerkError) {
        // Clerk verification failed, try Supabase
      }
    }

    // Fall back to Supabase if Clerk didn't work
    if (!user) {
      user = await authService.verifyToken(token)
      user.authSource = 'supabase'
    }

    // Attach user to request for use in routes
    ;(request as any).user = user

    return
  } catch (error: any) {
    return reply.code(401).send({
      error: sanitizeErrorMessage(error, 'Invalid or expired token'),
    })
  }
}

export function requireRole(roles: string | string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user
    
    if (!user) {
      return reply.code(401).send({ error: 'Authentication required' })
    }
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    if (!allowedRoles.includes(user.role) && user.role !== 'ADMIN' && user.role !== 'admin') {
      return reply.code(403).send({ error: `One of these roles required: ${allowedRoles.join(', ')}` })
    }
  }
}
