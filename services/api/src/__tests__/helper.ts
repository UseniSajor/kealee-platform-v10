/**
 * Test Helper Module
 * Provides utilities for setting up Fastify test instances
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { errorHandler, notFoundHandler } from '../middleware/error-handler.middleware';

/**
 * Build a test Fastify instance
 * This creates a minimal Fastify app for testing with common middleware
 * 
 * @param options - Configuration options for the test instance
 * @returns Configured Fastify instance ready for testing
 */
export async function build(options: {
  logger?: boolean;
  registerRoutes?: boolean;
} = {}): Promise<FastifyInstance> {
  const { logger = false, registerRoutes = false } = options;

  const fastify = Fastify({
    logger,
    // Disable request logging in tests for cleaner output
    disableRequestLogging: true,
  });

  // Register common middleware
  await fastify.register(cors, { 
    origin: true,
    credentials: true,
  });
  
  await fastify.register(helmet);

  // Register error handlers
  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);

  // Health check endpoint (always available)
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Optionally register routes (for integration tests)
  if (registerRoutes) {
    // Import routes dynamically to avoid circular dependencies
    const { authRoutes } = await import('../modules/auth/auth.routes');
    const { orgRoutes } = await import('../modules/orgs/org.routes');
    const { userRoutes } = await import('../modules/users/user.routes');
    const { projectRoutes } = await import('../modules/projects/project.routes');
    
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(orgRoutes, { prefix: '/orgs' });
    await fastify.register(userRoutes, { prefix: '/users' });
    await fastify.register(projectRoutes, { prefix: '/api/projects' });
  }

  await fastify.ready();

  return fastify;
}

/**
 * Create a minimal test Fastify instance (no routes)
 * Useful for unit testing middleware or simple endpoints
 */
export async function buildMinimal(): Promise<FastifyInstance> {
  return build({ logger: false, registerRoutes: false });
}

/**
 * Create a full test Fastify instance with all routes
 * Useful for integration testing
 */
export async function buildFull(): Promise<FastifyInstance> {
  return build({ logger: false, registerRoutes: true });
}

/**
 * Helper to create a test user token (mock)
 * In real tests, you would create a user and get a real token
 */
export function createTestToken(userId: string = 'test-user-id'): string {
  // This is a mock token - in real tests, use actual Supabase auth
  return `test-token-${userId}`;
}

/**
 * Helper to create test request headers with auth
 */
export function createAuthHeaders(token?: string): Record<string, string> {
  return {
    authorization: `Bearer ${token || createTestToken()}`,
    'content-type': 'application/json',
  };
}




