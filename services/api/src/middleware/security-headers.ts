/**
 * Security Headers Middleware
 * Implements comprehensive security headers for production
 */

import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Content Security Policy (CSP)
 */
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://js.stripe.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': ["'self'", 'https://api.stripe.com', 'https://*.vercel.app'],
  'frame-src': ["'self'", 'https://js.stripe.com'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};

/**
 * Generate CSP header value
 */
function generateCSP(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * Security headers configuration
 */
export interface SecurityHeadersConfig {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableXFrameOptions?: boolean;
  enableXContentTypeOptions?: boolean;
  enableReferrerPolicy?: boolean;
  enablePermissionsPolicy?: boolean;
  customHeaders?: Record<string, string>;
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  enableCSP: true,
  enableHSTS: true,
  enableXFrameOptions: true,
  enableXContentTypeOptions: true,
  enableReferrerPolicy: true,
  enablePermissionsPolicy: true,
};

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(config: SecurityHeadersConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Content Security Policy
    if (finalConfig.enableCSP) {
      reply.header('Content-Security-Policy', generateCSP());
    }

    // HTTP Strict Transport Security (HSTS)
    if (finalConfig.enableHSTS) {
      reply.header(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // X-Frame-Options (prevent clickjacking)
    if (finalConfig.enableXFrameOptions) {
      reply.header('X-Frame-Options', 'DENY');
    }

    // X-Content-Type-Options (prevent MIME sniffing)
    if (finalConfig.enableXContentTypeOptions) {
      reply.header('X-Content-Type-Options', 'nosniff');
    }

    // X-XSS-Protection (legacy, but still useful)
    reply.header('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    if (finalConfig.enableReferrerPolicy) {
      reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // Permissions Policy (formerly Feature Policy)
    if (finalConfig.enablePermissionsPolicy) {
      reply.header(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=(), payment=(self)'
      );
    }

    // X-DNS-Prefetch-Control
    reply.header('X-DNS-Prefetch-Control', 'off');

    // X-Download-Options (IE8+)
    reply.header('X-Download-Options', 'noopen');

    // X-Permitted-Cross-Domain-Policies
    reply.header('X-Permitted-Cross-Domain-Policies', 'none');

    // Remove X-Powered-By header
    reply.removeHeader('X-Powered-By');

    // Add Server header (customize or remove)
    reply.header('Server', 'Kealee Platform');

    // Custom headers
    if (finalConfig.customHeaders) {
      Object.entries(finalConfig.customHeaders).forEach(([key, value]) => {
        reply.header(key, value);
      });
    }
  };
}

/**
 * CORS configuration
 */
export interface CORSConfig {
  origin: string | string[] | RegExp | ((origin: string) => boolean);
  credentials?: boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
}

/**
 * Production CORS configuration
 */
export const PRODUCTION_CORS: CORSConfig = {
  origin: (origin) => {
    const allowedOrigins = [
      'https://kealee.com',
      'https://www.kealee.com',
      'https://app.kealee.com',
      'https://*.kealee.com',
      'https://*.vercel.app', // For preview deployments
    ];

    if (!origin) return true; // Allow requests with no origin (mobile apps, Postman, etc.)

    return allowedOrigins.some((allowed) => {
      if (allowed.includes('*')) {
        const regex = new RegExp(allowed.replace('*', '.*'));
        return regex.test(origin);
      }
      return allowed === origin;
    });
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-Request-ID',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID',
  ],
  maxAge: 86400, // 24 hours
};

/**
 * Development CORS configuration (permissive)
 */
export const DEVELOPMENT_CORS: CORSConfig = {
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
  exposedHeaders: ['*'],
};

/**
 * Get CORS configuration based on environment
 */
export function getCORSConfig(): CORSConfig {
  return process.env.NODE_ENV === 'production' ? PRODUCTION_CORS : DEVELOPMENT_CORS;
}

/**
 * Security middleware for webhook endpoints
 */
export function webhookSecurityHeaders() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Webhooks should not set CSP or other restrictive headers
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.removeHeader('X-Powered-By');
  };
}

/**
 * API documentation security headers
 */
export function apiDocsSecurityHeaders() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Relax CSP for API documentation (Swagger UI)
    reply.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
    );
    reply.header('X-Frame-Options', 'SAMEORIGIN'); // Allow embedding in same origin
    reply.header('X-Content-Type-Options', 'nosniff');
  };
}

/**
 * File upload security headers
 */
export function uploadSecurityHeaders() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    // Set Content-Disposition to prevent inline execution
    reply.header('Content-Disposition', 'attachment');
  };
}

