/**
 * Security Audit Middleware and Utilities for Payment Endpoints
 *
 * Implements:
 * - Input validation
 * - Rate limiting
 * - Authentication verification
 * - Authorization checks
 * - SQL injection prevention
 * - XSS prevention
 * - CSRF protection
 * - Request logging
 * - Anomaly detection
 */

import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import crypto from 'crypto';

// ============ Configuration ============

const SECURITY_CONFIG = {
  // Rate limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: {
      default: 100,
      payment: 10,
      sensitive: 5,
    },
  },

  // Token settings
  tokenExpiry: 3600, // 1 hour
  refreshTokenExpiry: 604800, // 7 days

  // Input validation
  maxRequestBodySize: 1024 * 1024, // 1MB
  maxUrlLength: 2048,

  // Logging
  logSensitiveFields: false,
  auditLogRetentionDays: 90,
};

// ============ Rate Limiting ============

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function rateLimiter(category: 'default' | 'payment' | 'sensitive' = 'default') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const clientId = getClientIdentifier(request);
    const key = `${category}:${clientId}`;
    const now = Date.now();
    const maxRequests = SECURITY_CONFIG.rateLimit.maxRequests[category];
    const windowMs = SECURITY_CONFIG.rateLimit.windowMs;

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    reply.header('X-RateLimit-Limit', maxRequests);
    reply.header('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    reply.header('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > maxRequests) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', request, { category, count: entry.count });
      reply.status(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
      return;
    }
  };
}

// ============ Input Validation ============

export interface ValidationRule {
  type: 'string' | 'number' | 'email' | 'uuid' | 'amount' | 'date';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  sanitize?: boolean;
}

export function validateInput(
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): { valid: boolean; errors: string[]; sanitized: Record<string, any> } {
  const errors: string[] = [];
  const sanitized: Record<string, any> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        } else {
          // XSS prevention - sanitize HTML
          const sanitizedValue = rule.sanitize ? sanitizeHtml(value) : value;

          if (rule.min && sanitizedValue.length < rule.min) {
            errors.push(`${field} must be at least ${rule.min} characters`);
          }
          if (rule.max && sanitizedValue.length > rule.max) {
            errors.push(`${field} must be at most ${rule.max} characters`);
          }
          if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
            errors.push(`${field} has invalid format`);
          }
          sanitized[field] = sanitizedValue;
        }
        break;

      case 'number':
        const num = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(num)) {
          errors.push(`${field} must be a number`);
        } else {
          if (rule.min !== undefined && num < rule.min) {
            errors.push(`${field} must be at least ${rule.min}`);
          }
          if (rule.max !== undefined && num > rule.max) {
            errors.push(`${field} must be at most ${rule.max}`);
          }
          sanitized[field] = num;
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value !== 'string' || !emailRegex.test(value)) {
          errors.push(`${field} must be a valid email`);
        } else {
          sanitized[field] = value.toLowerCase().trim();
        }
        break;

      case 'uuid':
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (typeof value !== 'string' || !uuidRegex.test(value)) {
          errors.push(`${field} must be a valid UUID`);
        } else {
          sanitized[field] = value;
        }
        break;

      case 'amount':
        const amount = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(amount) || amount < 0) {
          errors.push(`${field} must be a positive number`);
        } else {
          // Max amount check (prevent integer overflow)
          if (amount > 999999999) {
            errors.push(`${field} exceeds maximum allowed amount`);
          }
          sanitized[field] = Math.round(amount * 100) / 100; // Round to cents
        }
        break;

      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push(`${field} must be a valid date`);
        } else {
          sanitized[field] = date.toISOString();
        }
        break;
    }
  }

  return { valid: errors.length === 0, errors, sanitized };
}

// ============ XSS Prevention ============

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ============ SQL Injection Prevention ============

export function sanitizeSqlInput(input: string): string {
  // Replace dangerous characters
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/i,
    /(\b(UNION|JOIN|WHERE|AND|OR)\b.*\b(SELECT|FROM)\b)/i,
    /('.*--)/,
    /(\bOR\b.*=.*)/i,
    /(1\s*=\s*1)/,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

// ============ Authentication ============

export interface AuthContext {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'contractor' | 'engineer';
  permissions: string[];
  sessionId: string;
}

export async function verifyAuthentication(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AuthContext | null> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logSecurityEvent('AUTH_MISSING', request);
    reply.status(401).send({ error: 'Authentication required' });
    return null;
  }

  const token = authHeader.substring(7);

  try {
    // In production, verify JWT token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // For now, return mock context
    const context: AuthContext = {
      userId: 'user_123',
      email: 'user@example.com',
      role: 'user',
      permissions: ['read', 'write'],
      sessionId: crypto.randomUUID(),
    };

    return context;
  } catch (error) {
    logSecurityEvent('AUTH_INVALID', request, { error: (error as Error).message });
    reply.status(401).send({ error: 'Invalid authentication token' });
    return null;
  }
}

// ============ Authorization ============

export function requirePermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = (request as any).auth as AuthContext;

    if (!auth) {
      reply.status(401).send({ error: 'Authentication required' });
      return;
    }

    if (!auth.permissions.includes(permission) && auth.role !== 'admin') {
      logSecurityEvent('AUTHORIZATION_DENIED', request, { permission, userId: auth.userId });
      reply.status(403).send({ error: 'Insufficient permissions' });
      return;
    }
  };
}

export function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = (request as any).auth as AuthContext;

    if (!auth) {
      reply.status(401).send({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(auth.role)) {
      logSecurityEvent('ROLE_DENIED', request, { requiredRoles: roles, userRole: auth.role });
      reply.status(403).send({ error: 'Access denied' });
      return;
    }
  };
}

// ============ CSRF Protection ============

const csrfTokens = new Map<string, { token: string; expiry: number }>();

export function generateCsrfToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + 3600000; // 1 hour

  csrfTokens.set(sessionId, { token, expiry });
  return token;
}

export function validateCsrfToken(request: FastifyRequest, reply: FastifyReply): boolean {
  const sessionId = (request as any).auth?.sessionId;
  const providedToken = request.headers['x-csrf-token'] as string;

  if (!sessionId || !providedToken) {
    logSecurityEvent('CSRF_MISSING', request);
    reply.status(403).send({ error: 'CSRF token required' });
    return false;
  }

  const stored = csrfTokens.get(sessionId);

  if (!stored || stored.token !== providedToken || Date.now() > stored.expiry) {
    logSecurityEvent('CSRF_INVALID', request);
    reply.status(403).send({ error: 'Invalid CSRF token' });
    return false;
  }

  return true;
}

// ============ Anomaly Detection ============

interface RequestPattern {
  count: number;
  timestamps: number[];
  endpoints: string[];
}

const requestPatterns = new Map<string, RequestPattern>();

export function detectAnomalies(request: FastifyRequest): string[] {
  const clientId = getClientIdentifier(request);
  const now = Date.now();
  const anomalies: string[] = [];

  let pattern = requestPatterns.get(clientId);
  if (!pattern) {
    pattern = { count: 0, timestamps: [], endpoints: [] };
    requestPatterns.set(clientId, pattern);
  }

  // Clean old entries (older than 5 minutes)
  pattern.timestamps = pattern.timestamps.filter((t) => now - t < 300000);
  pattern.endpoints = pattern.endpoints.slice(-100);

  pattern.count++;
  pattern.timestamps.push(now);
  pattern.endpoints.push(request.url);

  // Check for anomalies
  const recentRequests = pattern.timestamps.filter((t) => now - t < 60000).length;

  // High frequency from single IP
  if (recentRequests > 200) {
    anomalies.push('HIGH_REQUEST_FREQUENCY');
  }

  // Scanning behavior (many different endpoints)
  const uniqueEndpoints = new Set(pattern.endpoints.slice(-50)).size;
  if (uniqueEndpoints > 30) {
    anomalies.push('ENDPOINT_SCANNING');
  }

  // Repeated failed auth attempts would be tracked separately

  if (anomalies.length > 0) {
    logSecurityEvent('ANOMALY_DETECTED', request, { anomalies, recentRequests, uniqueEndpoints });
  }

  return anomalies;
}

// ============ Security Event Logging ============

interface SecurityEvent {
  timestamp: string;
  type: string;
  clientIp: string;
  userAgent: string;
  path: string;
  method: string;
  userId?: string;
  details?: Record<string, any>;
}

const securityEvents: SecurityEvent[] = [];

export function logSecurityEvent(
  type: string,
  request: FastifyRequest,
  details?: Record<string, any>
): void {
  const event: SecurityEvent = {
    timestamp: new Date().toISOString(),
    type,
    clientIp: getClientIp(request),
    userAgent: request.headers['user-agent'] || 'unknown',
    path: request.url,
    method: request.method,
    userId: (request as any).auth?.userId,
    details: SECURITY_CONFIG.logSensitiveFields ? details : sanitizeLogDetails(details),
  };

  securityEvents.push(event);
  console.log(`[SECURITY] ${type}:`, JSON.stringify(event));

  // In production, send to security monitoring service
  // await securityMonitor.log(event);
}

function sanitizeLogDetails(details?: Record<string, any>): Record<string, any> | undefined {
  if (!details) return undefined;

  const sanitized = { ...details };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'cardNumber', 'cvv'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

// ============ Helpers ============

function getClientIdentifier(request: FastifyRequest): string {
  const ip = getClientIp(request);
  const userId = (request as any).auth?.userId;
  return userId ? `user:${userId}` : `ip:${ip}`;
}

function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
  }
  return request.ip;
}

// ============ Security Middleware Registration ============

export function registerSecurityMiddleware(fastify: FastifyInstance): void {
  // Global security headers
  fastify.addHook('onSend', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    reply.header('Content-Security-Policy', "default-src 'self'");
  });

  // Request logging
  fastify.addHook('onRequest', async (request) => {
    detectAnomalies(request);
  });
}

// ============ Security Audit Report ============

export function generateSecurityAuditReport(): {
  summary: Record<string, number>;
  recentEvents: SecurityEvent[];
  recommendations: string[];
} {
  const summary: Record<string, number> = {};

  securityEvents.forEach((event) => {
    summary[event.type] = (summary[event.type] || 0) + 1;
  });

  const recommendations: string[] = [];

  if (summary['AUTH_INVALID'] > 10) {
    recommendations.push('High number of invalid auth attempts - consider implementing account lockout');
  }
  if (summary['RATE_LIMIT_EXCEEDED'] > 50) {
    recommendations.push('Frequent rate limiting - review rate limit thresholds');
  }
  if (summary['ANOMALY_DETECTED'] > 5) {
    recommendations.push('Anomalous behavior detected - review traffic patterns');
  }

  return {
    summary,
    recentEvents: securityEvents.slice(-100),
    recommendations,
  };
}

export default {
  rateLimiter,
  validateInput,
  verifyAuthentication,
  requirePermission,
  requireRole,
  generateCsrfToken,
  validateCsrfToken,
  detectAnomalies,
  logSecurityEvent,
  registerSecurityMiddleware,
  generateSecurityAuditReport,
};
