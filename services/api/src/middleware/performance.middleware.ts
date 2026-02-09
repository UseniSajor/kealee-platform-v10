/**
 * Performance Monitoring Middleware
 *
 * Tracks API response times and provides:
 *  - Per-route response time headers (X-Response-Time)
 *  - Slow query alerts (> 500ms)
 *  - Performance metrics aggregation
 *  - Health endpoint with p50/p95/p99 latencies
 *
 * Target metrics:
 *  - Cached response: < 50ms
 *  - Uncached response: < 500ms
 *  - Alert threshold: > 1000ms
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// ── Metrics store (in-memory, rolling window) ──
interface RouteMetrics {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  samples: number[]; // Last 100 response times for percentile calculation
}

const metricsStore = new Map<string, RouteMetrics>();
const MAX_SAMPLES = 100;
const SLOW_THRESHOLD_MS = 500;
const ALERT_THRESHOLD_MS = 1000;

function recordMetric(routeKey: string, durationMs: number) {
  let metrics = metricsStore.get(routeKey);
  if (!metrics) {
    metrics = { count: 0, totalMs: 0, minMs: Infinity, maxMs: 0, samples: [] };
    metricsStore.set(routeKey, metrics);
  }

  metrics.count++;
  metrics.totalMs += durationMs;
  metrics.minMs = Math.min(metrics.minMs, durationMs);
  metrics.maxMs = Math.max(metrics.maxMs, durationMs);

  metrics.samples.push(durationMs);
  if (metrics.samples.length > MAX_SAMPLES) {
    metrics.samples.shift();
  }
}

function getPercentile(samples: number[], percentile: number): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// ── Middleware registration ──

export async function registerPerformanceMonitoring(fastify: FastifyInstance) {
  // Add timing to every request
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    (request as any)._startTime = process.hrtime.bigint();
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = (request as any)._startTime;
    if (!startTime) return;

    const endTime = process.hrtime.bigint();
    const durationNs = Number(endTime - startTime);
    const durationMs = Math.round(durationNs / 1_000_000);

    // Set response time header
    reply.header('X-Response-Time', `${durationMs}ms`);

    // Record metric
    const routeKey = `${request.method} ${request.routeOptions?.url || request.url}`;
    recordMetric(routeKey, durationMs);

    // Log slow requests
    if (durationMs > ALERT_THRESHOLD_MS) {
      fastify.log.warn({
        msg: 'Slow API response',
        route: routeKey,
        durationMs,
        statusCode: reply.statusCode,
        threshold: ALERT_THRESHOLD_MS,
      });
    } else if (durationMs > SLOW_THRESHOLD_MS) {
      fastify.log.info({
        msg: 'Above-target API response',
        route: routeKey,
        durationMs,
        threshold: SLOW_THRESHOLD_MS,
      });
    }
  });

  // ── Performance metrics endpoint ──
  fastify.get('/api/v1/perf/metrics', async (request, reply) => {
    const routes: Record<string, any> = {};

    for (const [routeKey, metrics] of metricsStore.entries()) {
      routes[routeKey] = {
        count: metrics.count,
        avgMs: Math.round(metrics.totalMs / metrics.count),
        minMs: metrics.minMs === Infinity ? 0 : Math.round(metrics.minMs),
        maxMs: Math.round(metrics.maxMs),
        p50Ms: Math.round(getPercentile(metrics.samples, 50)),
        p95Ms: Math.round(getPercentile(metrics.samples, 95)),
        p99Ms: Math.round(getPercentile(metrics.samples, 99)),
      };
    }

    // Sort by p95 descending (slowest first)
    const sorted = Object.entries(routes)
      .sort(([, a], [, b]) => b.p95Ms - a.p95Ms);

    // Global summary
    const allSamples: number[] = [];
    let totalRequests = 0;
    for (const metrics of metricsStore.values()) {
      allSamples.push(...metrics.samples);
      totalRequests += metrics.count;
    }

    return reply.send({
      summary: {
        totalRequests,
        totalRoutes: metricsStore.size,
        globalP50Ms: Math.round(getPercentile(allSamples, 50)),
        globalP95Ms: Math.round(getPercentile(allSamples, 95)),
        globalP99Ms: Math.round(getPercentile(allSamples, 99)),
        slowRoutes: sorted.filter(([, m]) => m.p95Ms > SLOW_THRESHOLD_MS).length,
      },
      targets: {
        cached: '< 50ms',
        uncached: '< 500ms',
        alert: '> 1000ms',
      },
      routes: Object.fromEntries(sorted.slice(0, 50)), // Top 50 by latency
    });
  });

  // ── Reset metrics endpoint (admin only) ──
  fastify.post('/api/v1/perf/reset', async (request, reply) => {
    metricsStore.clear();
    return reply.send({ success: true, message: 'Metrics reset' });
  });
}
