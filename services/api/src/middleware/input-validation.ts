/**
 * Input Validation and Sanitization Middleware
 * Prevents injection attacks and ensures data integrity
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodType } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

/**
 * SQL Injection patterns to detect
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  /(UNION.*SELECT)/gi,
  /(;|\-\-|\/\*|\*\/|xp_)/gi,
  /('|")(.*)(OR|AND)(.*)('|")/gi,
];

/**
 * XSS patterns to detect
 */
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /<img[^>]*onerror/gi,
];

/**
 * Path traversal patterns
 */
const PATH_TRAVERSAL_PATTERNS = [
  /\.\./g,
  /\.\.\\/g,
  /\.\.\//g,
  /%2e%2e/gi,
];

/**
 * Check for SQL injection attempts
 */
export function hasSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Check for XSS attempts
 */
export function hasXSS(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Check for path traversal attempts
 */
export function hasPathTraversal(input: string): boolean {
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // HTML encode special characters
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
  });

  return sanitized;
}

/**
 * Sanitize HTML input (for rich text fields)
 */
export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validate request body against Zod schema
 */
export function validateBody(schema: ZodType<any, any, any>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = schema.parse(request.body);
      request.body = validated;
    } catch (error: any) {
      request.log.warn('Body validation failed:', error.errors);

      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }
  };
}

/**
 * Validate query parameters against Zod schema
 */
export function validateQuery(schema: ZodType<any, any, any>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = schema.parse(request.query);
      request.query = validated;
    } catch (error: any) {
      request.log.warn('Query validation failed:', error.errors);

      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }
  };
}

/**
 * Validate URL parameters against Zod schema
 */
export function validateParams(schema: ZodType<any, any, any>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = schema.parse(request.params);
      request.params = validated;
    } catch (error: any) {
      request.log.warn('Params validation failed:', error.errors);

      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid URL parameters',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }
  };
}

/**
 * Sanitize request middleware
 */
export async function sanitizeRequest(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Sanitize body
  if (request.body && typeof request.body === 'object') {
    request.body = sanitizeObject(request.body);
  }

  // Sanitize query
  if (request.query && typeof request.query === 'object') {
    request.query = sanitizeObject(request.query);
  }

  // Sanitize params
  if (request.params && typeof request.params === 'object') {
    request.params = sanitizeObject(request.params);
  }
}

/**
 * Detect and block malicious input
 */
export async function detectMaliciousInput(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const checkValue = (value: any, path: string): boolean => {
    if (typeof value === 'string') {
      if (hasSQLInjection(value)) {
        request.log.warn(`SQL injection detected in ${path}: ${value}`);
        return true;
      }
      if (hasXSS(value)) {
        request.log.warn(`XSS attempt detected in ${path}: ${value}`);
        return true;
      }
      if (hasPathTraversal(value)) {
        request.log.warn(`Path traversal detected in ${path}: ${value}`);
        return true;
      }
    }

    if (Array.isArray(value)) {
      return value.some((item, index) => checkValue(item, `${path}[${index}]`));
    }

    if (value !== null && typeof value === 'object') {
      return Object.entries(value).some(([key, val]) => checkValue(val, `${path}.${key}`));
    }

    return false;
  };

  // Check body
  if (request.body) {
    if (checkValue(request.body, 'body')) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Malicious input detected',
        code: 'MALICIOUS_INPUT',
      });
    }
  }

  // Check query
  if (request.query) {
    if (checkValue(request.query, 'query')) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Malicious input detected',
        code: 'MALICIOUS_INPUT',
      });
    }
  }

  // Check params
  if (request.params) {
    if (checkValue(request.params, 'params')) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Malicious input detected',
        code: 'MALICIOUS_INPUT',
      });
    }
  }
}

/**
 * File upload validation
 */
export interface FileValidationConfig {
  maxSize: number; // in bytes
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

export const FILE_VALIDATION_PRESETS = {
  IMAGES: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },
  DOCUMENTS: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
  },
  ARCHIVES: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    allowedExtensions: ['.zip', '.rar', '.7z'],
  },
};

/**
 * Validate uploaded file
 */
export function validateFile(config: FileValidationConfig) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'No file uploaded',
        code: 'NO_FILE',
      });
    }

    // Check file size
    if (data.file.bytesRead > config.maxSize) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: `File size exceeds maximum allowed (${config.maxSize} bytes)`,
        code: 'FILE_TOO_LARGE',
      });
    }

    // Check MIME type
    if (!config.allowedMimeTypes.includes(data.mimetype)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'File type not allowed',
        code: 'INVALID_FILE_TYPE',
        allowedTypes: config.allowedMimeTypes,
      });
    }

    // Check file extension
    const ext = data.filename.toLowerCase().match(/\.[^.]*$/)?.[0];
    if (!ext || !config.allowedExtensions.includes(ext)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'File extension not allowed',
        code: 'INVALID_FILE_EXTENSION',
        allowedExtensions: config.allowedExtensions,
      });
    }

    // Attach file data to request for further processing
    (request as any).uploadedFile = data;
  };
}

/**
 * Common Zod schemas for reuse
 */
export const CommonSchemas = {
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  uuid: z.string().uuid(),
  url: z.string().url().max(2048),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  date: z.string().datetime(),
  positiveInt: z.number().int().positive(),
  nonNegativeInt: z.number().int().min(0),
  amount: z.number().positive().max(1000000000),
  percentage: z.number().min(0).max(100),
};

