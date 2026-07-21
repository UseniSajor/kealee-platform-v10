/**
 * KEALEE OBSERVABILITY - STRUCTURED LOGGING
 * Pino-based structured logger with trace context, child loggers,
 * and Fastify integration.
 */

import pino, { type Logger, type LoggerOptions } from 'pino';
import { getTraceId } from './tracing.js';
import os from 'os';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateLoggerOptions {
  /** Log level override. Falls back to LOG_LEVEL env var, then 'info'. */
  level?: string;
  /** Enable pretty-printing. Falls back to true in development. */
  pretty?: boolean;
  /** Additional base context fields. */
  base?: Record<string, unknown>;
}

export type { Logger } from 'pino';

// ============================================================================
// LOGGER FACTORY
// ============================================================================

/**
 * Create a structured logger for a service or module.
 *
 * In development: pretty-printed colored output via pino-pretty.
 * In production: JSON lines for log aggregation (Datadog, Loki, etc.).
 *
 * @example
 * ```ts
 * const logger = createLogger('queue-worker');
 * logger.info({ jobId: '123', queue: 'bid-engine' }, 'Job completed');
 * logger.error({ err, jobId: '456' }, 'Job failed');
 * ```
 */
export function createLogger(name: string, options?: CreateLoggerOptions): Logger {
  const isDev = (process.env.NODE_ENV || 'development') === 'development';
  const level = options?.level || process.env.LOG_LEVEL || 'info';
  const usePretty = options?.pretty ?? isDev;

  const loggerOptions: LoggerOptions = {
    name,
    level,
    base: {
      service: name,
      env: process.env.NODE_ENV || 'development',
      pid: process.pid,
      hostname: os.hostname(),
      ...options?.base,
    },
    // Automatically include traceId in every log line via mixin
    mixin() {
      const traceId = getTraceId();
      return traceId ? { traceId } : {};
    },
    // Custom timestamp format — ISO string for human readability
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  // Pretty print in development
  if (usePretty) {
    loggerOptions.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    };
  }

  return pino(loggerOptions);
}

// ============================================================================
// CONTEXT HELPERS
// ============================================================================

/**
 * Create a child logger with additional context fields.
 *
 * Child loggers inherit the parent's configuration and add
 * fixed context fields to every log line.
 *
 * @example
 * ```ts
 * const baseLogger = createLogger('command-center');
 * const jobLogger = withContext(baseLogger, {
 *   queue: 'bid-engine',
 *   jobId: job.id,
 *   projectId: data.projectId,
 * });
 * jobLogger.info('Processing bid analysis');
 * // Output includes: queue, jobId, projectId on every line
 * ```
 */
export function withContext(
  logger: Logger,
  context: Record<string, unknown>,
): Logger {
  return logger.child(context);
}

/**
 * Create a request-scoped logger with traceId, method, and path.
 *
 * Useful for logging within route handlers where you want
 * every log line to include request context.
 *
 * @example
 * ```ts
 * fastify.get('/projects/:id', async (request, reply) => {
 *   const log = requestContextLogger(baseLogger, request);
 *   log.info('Fetching project');
 * });
 * ```
 */
export function requestContextLogger(
  logger: Logger,
  request: { traceId?: string; method?: string; url?: string; user?: { id?: string } },
): Logger {
  return logger.child({
    traceId: request.traceId || getTraceId(),
    method: request.method,
    path: request.url,
    userId: (request as any).user?.id,
  });
}

// ============================================================================
// FASTIFY LOGGER FACTORY
// ============================================================================

/**
 * Create a Pino logger instance configured for Fastify's built-in
 * logger option. Fastify uses pino internally — this gives it our
 * standard configuration.
 *
 * @example
 * ```ts
 * import Fastify from 'fastify';
 * import { createFastifyLogger } from '@kealee/observability';
 *
 * const fastify = Fastify({ logger: createFastifyLogger('kealee-api') });
 * ```
 */
export function createFastifyLogger(serviceName: string): LoggerOptions | boolean {
  const isDev = (process.env.NODE_ENV || 'development') === 'development';

  if (isDev) {
    return {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      },
    };
  }

  return {
    level: process.env.LOG_LEVEL || 'info',
    base: {
      service: serviceName,
      env: process.env.NODE_ENV,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };
}
