/**
 * Audit Middleware — Auto-audit Fastify onResponse hook
 *
 * Automatically logs audit entries for all mutating API requests
 * (POST, PUT, PATCH, DELETE) that return success status codes.
 *
 * This is a catch-all safety net. Critical operations (financial,
 * contracts, auth) also have explicit audit calls in their service
 * methods for richer context.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { auditService } from '../modules/audit/audit.service';

// ============================================================================
// CONFIGURATION
// ============================================================================

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Skip audit for these path prefixes (health checks, metrics, etc.) */
const SKIP_PATHS = [
  '/health',
  '/ready',
  '/metrics',
  '/swagger',
  '/documentation',
  '/audit/log',        // Prevent audit-of-audit recursion
  '/audit/activity',
  '/audit/track-change',
];

/**
 * Map URL patterns to resource types and action overrides.
 * More specific patterns should come first.
 */
const ROUTE_AUDIT_MAP: Array<{
  pattern: RegExp;
  resource: string;
  actionMap?: Record<string, string>;
  category?: string;
  severity?: string;
}> = [
  // Financial — high severity
  { pattern: /\/escrow\/.*\/release/, resource: 'ESCROW', actionMap: { POST: 'APPROVE' }, category: 'FINANCIAL', severity: 'CRITICAL' },
  { pattern: /\/escrow\/.*\/deposit/, resource: 'ESCROW', actionMap: { POST: 'CREATE' }, category: 'FINANCIAL', severity: 'CRITICAL' },
  { pattern: /\/escrow/, resource: 'ESCROW', category: 'FINANCIAL' },
  { pattern: /\/billing\/subscription/, resource: 'SUBSCRIPTION', category: 'FINANCIAL' },
  { pattern: /\/billing\/checkout/, resource: 'PAYMENT', actionMap: { POST: 'CREATE' }, category: 'FINANCIAL' },
  { pattern: /\/billing/, resource: 'PAYMENT', category: 'FINANCIAL' },
  { pattern: /\/payments/, resource: 'PAYMENT', category: 'FINANCIAL' },

  // Contracts
  { pattern: /\/contracts\/.*\/sign/, resource: 'CONTRACT', actionMap: { POST: 'SIGN' }, category: 'COMPLIANCE', severity: 'CRITICAL' },
  { pattern: /\/contracts\/.*\/change-orders/, resource: 'CHANGE_ORDER', category: 'COMPLIANCE' },
  { pattern: /\/contracts/, resource: 'CONTRACT', category: 'COMPLIANCE' },
  { pattern: /\/contract-templates/, resource: 'CONTRACT', category: 'OPERATIONAL' },

  // Projects
  { pattern: /\/projects\/.*\/milestones/, resource: 'MILESTONE', category: 'OPERATIONAL' },
  { pattern: /\/projects/, resource: 'PROJECT', category: 'OPERATIONAL' },

  // Users & Auth
  { pattern: /\/auth\/login/, resource: 'SESSION', actionMap: { POST: 'LOGIN' }, category: 'SECURITY' },
  { pattern: /\/auth\/logout/, resource: 'SESSION', actionMap: { POST: 'LOGOUT' }, category: 'SECURITY' },
  { pattern: /\/auth\/register/, resource: 'USER', actionMap: { POST: 'CREATE' }, category: 'SECURITY' },
  { pattern: /\/users\/.*\/roles/, resource: 'ROLE', category: 'SECURITY', severity: 'CRITICAL' },
  { pattern: /\/users/, resource: 'USER', category: 'SECURITY' },
  { pattern: /\/rbac/, resource: 'ROLE', category: 'SECURITY' },

  // Marketplace
  { pattern: /\/marketplace\/.*\/bids/, resource: 'BID', category: 'OPERATIONAL' },
  { pattern: /\/marketplace/, resource: 'PROJECT', category: 'OPERATIONAL' },

  // Organizations
  { pattern: /\/orgs\/.*\/invitations/, resource: 'INVITATION', category: 'ADMINISTRATIVE' },
  { pattern: /\/orgs/, resource: 'USER', category: 'ADMINISTRATIVE' },

  // Events
  { pattern: /\/events/, resource: 'PROJECT', category: 'OPERATIONAL' },
];

// ============================================================================
// MIDDLEWARE
// ============================================================================

export function registerAuditMiddleware(fastify: FastifyInstance): void {
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only audit mutating requests
    if (!MUTATING_METHODS.has(request.method)) return;

    // Skip failed requests (client errors, server errors)
    if (reply.statusCode >= 400) return;

    // Skip internal/system paths
    const url = request.url.split('?')[0]; // Strip query params
    if (SKIP_PATHS.some((prefix) => url.startsWith(prefix))) return;

    // Match route to resource type
    const match = ROUTE_AUDIT_MAP.find((r) => r.pattern.test(url));
    if (!match) return;

    // Determine action
    const defaultActionMap: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    const action = match.actionMap?.[request.method] || defaultActionMap[request.method] || 'UPDATE';

    // Extract user from request
    const user = (request as any).user;
    if (!user?.id) return; // Cannot audit unauthenticated requests

    // Extract entity ID from URL if available
    const entityId = extractEntityId(url);

    // Extract project ID from URL if available
    const projectId = extractProjectId(url);

    // Fire-and-forget audit log
    auditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action,
      entityType: match.resource,
      entityId: entityId || 'unknown',
      description: `${request.method} ${url}`,
      projectId,
      organizationId: user.organizationId,
      ipAddress: getClientIp(request),
      userAgent: request.headers['user-agent'] || undefined,
      category: match.category || 'OPERATIONAL',
      severity: match.severity || 'INFO',
      source: 'api',
    });
  });
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extract entity ID from URL path.
 * Assumes UUIDs in path segments.
 */
function extractEntityId(url: string): string | undefined {
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const matches = url.match(uuidRegex);
  // Return the last UUID in the path (most specific entity)
  return matches ? matches[matches.length - 1] : undefined;
}

/**
 * Extract project ID from URL path.
 * Looks for /projects/:projectId pattern.
 */
function extractProjectId(url: string): string | undefined {
  const match = url.match(/\/projects\/([0-9a-f-]{36})/i);
  return match ? match[1] : undefined;
}

/**
 * Get client IP from request headers.
 */
function getClientIp(request: FastifyRequest): string | undefined {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
  }
  return request.ip;
}
