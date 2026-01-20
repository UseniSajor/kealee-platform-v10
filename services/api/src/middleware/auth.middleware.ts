import { FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email?: string;
    [key: string]: any;
  };
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
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return reply.code(401).send({ 
        error: 'Invalid or expired token',
        message: error?.message || 'Authentication failed'
      });
    }

    // Attach user to request
    request.user = {
      id: user.id,
      email: user.email,
      ...user
    };
    
  } catch (error: any) {
    return reply.code(401).send({ 
      error: 'Authentication failed',
      message: error.message || 'Unable to authenticate user'
    });
  }
}

export async function requireRole(roles: string[]) {
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
