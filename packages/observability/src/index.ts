/**
 * @kealee/observability
 *
 * OpenTelemetry tracing, structured logging, and metrics for the Kealee Platform.
 *
 * Usage:
 * ```ts
 * // In your service entry point (BEFORE other imports):
 * import { initTracing } from '@kealee/observability';
 * initTracing('my-service');
 *
 * // Create loggers:
 * import { createLogger, withContext } from '@kealee/observability';
 * const logger = createLogger('my-module');
 *
 * // Wrap operations in spans:
 * import { withSpan, getTraceId } from '@kealee/observability';
 * const result = await withSpan('db.query', async (span) => { ... });
 * ```
 */

// Tracing
export {
  initTracing,
  withSpan,
  getTraceId,
  getActiveSpan,
  tracingPlugin,
  type TracingOptions,
} from './tracing.js';

// Logging
export {
  createLogger,
  withContext,
  requestContextLogger,
  createFastifyLogger,
  type CreateLoggerOptions,
  type Logger,
} from './logger.js';
