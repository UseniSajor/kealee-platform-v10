import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  authenticateUser as authenticateClerkUser,
  requireRole as requireClerkRole,
  type AuthenticatedUser,
} from '../../middleware/auth.middleware'

export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthenticatedUser & {
    userId?: string
    clerkUserId?: string
    authSource?: 'clerk'
  }
}

export async function authenticateUser(request: FastifyRequest, reply: FastifyReply) {
  return authenticateClerkUser(request, reply)
}

export function requireRole(roles: string | string[]) {
  return requireClerkRole(Array.isArray(roles) ? roles : [roles])
}
