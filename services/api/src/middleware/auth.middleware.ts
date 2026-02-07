import { FastifyRequest, FastifyReply } from 'fastify';
import { getSupabaseClient } from '../utils/supabase-client';

// Get the centralized Supabase client (handles missing credentials gracefully)
const supabase = getSupabaseClient();

export interface AuthenticatedUser {
  id: string
  email?: string
  role: string
  organizationId?: string | null
  profile?: any
  [key: string]: any
}

export interface AuthenticatedRequest extends FastifyRequest {
  user?: AuthenticatedUser
}

export async function authenticateUser(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        error: 'Missing or invalid authorization header',
        message: 'Please provide a valid Bearer token'
      });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return reply.code(401).send({
        error: 'Invalid or expired token',
        message: error?.message || 'Authentication failed'
      });
    }

    // Get user with organization memberships from database
    const { prismaAny } = await import('../utils/prisma-helper');
    const userWithOrgs = await prismaAny.user.findUnique({
      where: { id: user.id },
      include: {
        orgMemberships: {
          include: {
            org: true,
          },
          take: 1, // Get first org as primary
          orderBy: { joinedAt: 'asc' },
        },
      }
    });

    if (!userWithOrgs) {
      return reply.code(404).send({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    // Get primary organization (first membership)
    const primaryMembership = userWithOrgs.orgMemberships?.[0];
    const primaryOrg = primaryMembership?.org;

    // Attach user to request with proper type checking
    const { id, email, ...userRest } = user
    const authenticatedUser: AuthenticatedUser = {
      id,
      email: email || undefined,
      role: primaryMembership?.roleKey || 'user',
      organizationId: primaryOrg?.id || null,
      profile: userWithOrgs,
      ...userRest
    }

    // Type guard to ensure user has required properties
    if (authenticatedUser.id && authenticatedUser.role) {
      request.user = authenticatedUser
    } else {
      return reply.code(401).send({
        error: 'Invalid user data',
        message: 'User missing required properties'
      })
    }

  } catch (error: any) {
    return reply.code(401).send({
      error: 'Authentication failed',
      message: error.message || 'Unable to authenticate user'
    });
  }
}

/**
 * Require the authenticated user to have one of the specified roles.
 * Uses the role already resolved by authenticateUser (from OrgMember.roleKey).
 */
export function requireRole(roles: string[]) {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    const user = request.user;

    if (!user) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }

    const normalizedRoles = roles.map(r => r.toLowerCase())
    if (!normalizedRoles.includes(user.role.toLowerCase())) {
      return reply.code(403).send({
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${roles.join(', ')}`
      });
    }
  };
}

// Convenience function for admin-only routes
export const requireAdmin = requireRole(['admin', 'super_admin']);

// Convenience function for PM-only routes
export const requirePM = requireRole(['pm', 'admin', 'super_admin']);

// ---------------------------------------------------------------------------
// Project Membership Guard
// ---------------------------------------------------------------------------

/**
 * Verify the authenticated user is a member of the project specified by
 * :projectId in request params or body.
 *
 * Membership check:
 *  - User is the PM (Project.pmId)
 *  - User is in projectManagers table
 *  - User is the Client (Client.email matches user email)
 *  - User is in the project's organization
 *  - User has admin role (admins can access all projects)
 */
export function requireProjectMembership() {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    const user = request.user
    if (!user) {
      return reply.code(401).send({ error: 'Not authenticated' })
    }

    // Admins bypass project membership checks
    if (['admin', 'super_admin'].includes(user.role.toLowerCase())) {
      return
    }

    // Extract projectId from params or body
    const params = request.params as Record<string, string>
    const body = request.body as Record<string, string> | undefined
    const projectId = params?.projectId || body?.projectId

    if (!projectId) {
      return reply.code(400).send({ error: 'projectId is required' })
    }

    const { prismaAny } = await import('../utils/prisma-helper')

    const project = await prismaAny.project.findFirst({
      where: {
        id: projectId,
        OR: [
          // Direct PM
          { pmId: user.id },
          // Project manager assignment
          { projectManagers: { some: { userId: user.id } } },
          // Client (match by email through Client table)
          ...(user.email
            ? [{ client: { email: user.email } }]
            : []),
          // Same organization
          ...(user.organizationId
            ? [{ orgId: user.organizationId }]
            : []),
        ],
      },
      select: { id: true },
    })

    if (!project) {
      return reply.code(403).send({ error: 'Not a member of this project' })
    }
  }
}

// ---------------------------------------------------------------------------
// Organization Membership Guard
// ---------------------------------------------------------------------------

/**
 * Verify the authenticated user belongs to the organization specified by
 * :orgId in request params.
 */
export function requireOrgMembership() {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    const user = request.user
    if (!user) {
      return reply.code(401).send({ error: 'Not authenticated' })
    }

    // Admins bypass org membership checks
    if (['admin', 'super_admin'].includes(user.role.toLowerCase())) {
      return
    }

    const params = request.params as Record<string, string>
    const orgId = params?.orgId

    if (!orgId) {
      return reply.code(400).send({ error: 'orgId is required' })
    }

    const { prismaAny } = await import('../utils/prisma-helper')

    const membership = await prismaAny.orgMember.findFirst({
      where: {
        userId: user.id,
        orgId,
      },
      select: { id: true },
    })

    if (!membership) {
      return reply.code(403).send({ error: 'Not a member of this organization' })
    }
  }
}

// ---------------------------------------------------------------------------
// Self-or-Admin Guard
// ---------------------------------------------------------------------------

/**
 * Verify the request is for the authenticated user's own data (:userId or
 * :pmId matches) OR the user has admin role.
 */
export function requireSelfOrAdmin(paramName: string = 'userId') {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    const user = request.user
    if (!user) {
      return reply.code(401).send({ error: 'Not authenticated' })
    }

    if (['admin', 'super_admin'].includes(user.role.toLowerCase())) {
      return
    }

    const params = request.params as Record<string, string>
    const targetId = params?.[paramName]

    if (targetId && targetId !== user.id) {
      return reply.code(403).send({ error: 'Access denied: you can only access your own data' })
    }
  }
}
