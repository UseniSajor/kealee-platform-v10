/**
 * KEALEE OBSERVABILITY - OPENTELEMETRY TRACING
 * Distributed tracing with OTLP export, Fastify plugin, and span helpers.
 *
 * IMPORTANT: `initTracing()` MUST be called before importing Fastify or
 * any instrumented library so the OTel SDK can monkey-patch them.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { Resource } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import {
  trace,
  context,
  SpanStatusCode,
  type Span,
  type Attributes,
} from '@opentelemetry/api';

// ============================================================================
// TYPES
// ============================================================================

export interface TracingOptions {
  /** OTLP endpoint URL. Falls back to OTEL_EXPORTER_OTLP_ENDPOINT env var. */
  endpoint?: string;
  /** Service version string. Falls back to npm_package_version. */
  version?: string;
  /** Deployment environment. Falls back to NODE_ENV. */
  environment?: string;
  /** Whether to enable tracing. Falls back to OTEL_ENABLED env var. Default: true. */
  enabled?: boolean;
}

// ============================================================================
// SDK SINGLETON
// ============================================================================

let sdk: NodeSDK | null = null;
let _serviceName = 'unknown';

/**
 * Initialize OpenTelemetry tracing.
 *
 * Call this **before** importing Fastify, IORedis, or any HTTP library
 * so that the auto-instrumentations can patch them.
 *
 * @example
 * ```ts
 * import { initTracing } from '@kealee/observability';
 * initTracing('kealee-api');
 *
 * // NOW import Fastify
 * import Fastify from 'fastify';
 * ```
 */
export function initTracing(serviceName: string, options?: TracingOptions): void {
  const enabled = options?.enabled ?? (process.env.OTEL_ENABLED !== 'false');
  if (!enabled) {
    console.log(`[Tracing] Disabled for ${serviceName}`);
    return;
  }

  if (sdk) {
    console.warn('[Tracing] Already initialized — skipping duplicate init');
    return;
  }

  _serviceName = serviceName;

  const endpoint =
    options?.endpoint ||
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    'http://localhost:4318/v1/traces';

  const version = options?.version || process.env.npm_package_version || '1.0.0';
  const environment = options?.environment || process.env.NODE_ENV || 'development';

  const exporter = new OTLPTraceExporter({ url: endpoint });

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: version,
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: environment,
  });

  sdk = new NodeSDK({
    resource,
    traceExporter: exporter,
    instrumentations: [
      new HttpInstrumentation({
        // Don't trace health check requests
        ignoreIncomingRequestHook: (req) => {
          return req.url?.startsWith('/health') || false;
        },
      }),
      new FastifyInstrumentation(),
      new IORedisInstrumentation(),
    ],
  });

  sdk.start();
  console.log(`[Tracing] Initialized for ${serviceName} (env: ${environment})`);

  // Graceful shutdown
  const shutdown = async () => {
    try {
      await sdk?.shutdown();
      console.log('[Tracing] Shutdown complete');
    } catch (err) {
      console.error('[Tracing] Shutdown error:', err);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// ============================================================================
// SPAN HELPERS
// ============================================================================

/**
 * Execute a function within a new child span.
 *
 * @example
 * ```ts
 * const result = await withSpan('db.getProject', async (span) => {
 *   span.setAttribute('project.id', projectId);
 *   return prisma.project.findUnique({ where: { id: projectId } });
 * });
 * ```
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Attributes,
): Promise<T> {
  const tracer = trace.getTracer(_serviceName);

  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (attributes) {
        span.setAttributes(attributes);
      }
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Get the traceId from the currently active span.
 * Returns undefined if no active span exists (e.g. tracing is disabled).
 *
 * Used by queue.ts and events.ts to propagate trace context across
 * async boundaries (BullMQ jobs, Redis Pub/Sub events).
 */
export function getTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  if (!span) return undefined;

  const ctx = span.spanContext();
  // OTel uses a zeroed traceId for invalid/no-op spans
  if (ctx.traceId === '00000000000000000000000000000000') return undefined;

  return ctx.traceId;
}

/**
 * Get the active span (if any). Useful for adding attributes in
 * deeply nested code without passing the span around.
 */
export function getActiveSpan(): Span | undefined {
  return trace.getActiveSpan() ?? undefined;
}

// ============================================================================
// FASTIFY PLUGIN
// ============================================================================

/**
 * Fastify plugin that:
 * 1. Decorates `request.traceId` with the current OTel traceId
 * 2. Adds an `x-trace-id` response header for client-side correlation
 *
 * Register AFTER Sentry hooks and BEFORE request-logger hooks.
 *
 * @example
 * ```ts
 * import { tracingPlugin } from '@kealee/observability';
 * await fastify.register(tracingPlugin);
 * ```
 */
export async function tracingPlugin(fastify: any): Promise<void> {
  // Decorate request with traceId (empty string default)
  fastify.decorateRequest('traceId', '');

  fastify.addHook('onRequest', async (request: any) => {
    const traceId = getTraceId();
    if (traceId) {
      request.traceId = traceId;
    }
  });

  fastify.addHook('onResponse', async (request: any, reply: any) => {
    if (request.traceId) {
      reply.header('x-trace-id', request.traceId);
    }
  });
}
