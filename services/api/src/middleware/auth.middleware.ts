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

export function requireRole(roles: string[]) {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    const user = request.user;
    
    if (!user) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }

    try {
      // Get user profile with role from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        return reply.code(403).send({ 
          error: 'User profile not found',
          message: 'Please complete your profile setup'
        });
      }

      if (!roles.includes(profile.role)) {
        return reply.code(403).send({ 
          error: 'Insufficient permissions',
          message: `This action requires one of the following roles: ${roles.join(', ')}`
        });
      }

      // Attach role to request
      (request as any).userRole = profile.role;
      
    } catch (error: any) {
      return reply.code(500).send({ 
        error: 'Failed to verify permissions',
        message: error.message
      });
    }
  };
}

// Convenience function for admin-only routes
export const requireAdmin = requireRole(['admin']);

// Convenience function for PM-only routes
export const requirePM = requireRole(['pm', 'admin']);
