'use client';

/**
 * WebVitals — Core Web Vitals Monitoring
 *
 * Tracks LCP, FID, CLS, TTFB, INP and reports to analytics.
 * Include once in the root layout of each app.
 *
 * Performance Budget:
 *   - LCP (Largest Contentful Paint): < 2.0s on 4G
 *   - FID (First Input Delay): < 100ms
 *   - CLS (Cumulative Layout Shift): < 0.1
 *   - TTFB (Time to First Byte): < 800ms
 *   - INP (Interaction to Next Paint): < 200ms
 *
 * Usage:
 *   // In app/layout.tsx
 *   <WebVitals />
 */

import { useEffect, useCallback, useRef } from 'react';

// ── Types ──
interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP' | 'FCP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

interface WebVitalsProps {
  /** Custom reporting endpoint */
  reportEndpoint?: string;
  /** Enable console logging in development */
  debug?: boolean;
  /** Custom reporter function */
  onReport?: (metric: WebVitalMetric) => void;
  /** Batch reporting interval in ms (default 5000) */
  batchInterval?: number;
}

// ── Thresholds (from web.dev) ──
const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'good';
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

export function WebVitals({
  reportEndpoint,
  debug = process.env.NODE_ENV === 'development',
  onReport,
  batchInterval = 5000,
}: WebVitalsProps) {
  const metricsBuffer = useRef<WebVitalMetric[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const reportMetric = useCallback((metric: WebVitalMetric) => {
    // Console logging in development
    if (debug) {
      const color = metric.rating === 'good' ? '🟢' : metric.rating === 'needs-improvement' ? '🟡' : '🔴';
      console.log(
        `${color} [WebVitals] ${metric.name}: ${metric.value.toFixed(metric.name === 'CLS' ? 4 : 0)}${metric.name === 'CLS' ? '' : 'ms'} (${metric.rating})`
      );
    }

    // Custom reporter
    onReport?.(metric);

    // Buffer for batch send
    metricsBuffer.current.push(metric);
  }, [debug, onReport]);

  const flushMetrics = useCallback(() => {
    if (metricsBuffer.current.length === 0) return;

    const metrics = [...metricsBuffer.current];
    metricsBuffer.current = [];

    // Send to analytics endpoint
    if (reportEndpoint) {
      try {
        // Use sendBeacon for reliability (survives page unload)
        const blob = new Blob([JSON.stringify({
          metrics,
          url: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          connection: (navigator as any).connection?.effectiveType ?? 'unknown',
        })], { type: 'application/json' });

        navigator.sendBeacon(reportEndpoint, blob);
      } catch {
        // Fallback to fetch
        fetch(reportEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics }),
          keepalive: true,
        }).catch(() => {/* ignore */});
      }
    }

    // Alert on poor metrics
    const poorMetrics = metrics.filter(m => m.rating === 'poor');
    if (poorMetrics.length > 0 && debug) {
      console.warn(
        `[WebVitals] ⚠️ Poor metrics detected:`,
        poorMetrics.map(m => `${m.name}=${m.value.toFixed(0)}ms`).join(', ')
      );
    }
  }, [reportEndpoint, debug]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamic import web-vitals library
    import('web-vitals').then((webVitals) => {
      const handleMetric = (metric: any) => {
        reportMetric({
          name: metric.name,
          value: metric.value,
          rating: getRating(metric.name, metric.value),
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType ?? 'unknown',
        });
      };

      webVitals.onLCP(handleMetric);
      webVitals.onCLS(handleMetric);
      webVitals.onTTFB(handleMetric);
      webVitals.onINP(handleMetric);
      webVitals.onFCP(handleMetric);
      // onFID was removed in web-vitals v4; use onINP instead
      if ('onFID' in webVitals && typeof (webVitals as any).onFID === 'function') {
        (webVitals as any).onFID(handleMetric);
      }
    }).catch(() => {
      // web-vitals not installed — degrade gracefully
      if (debug) console.warn('[WebVitals] web-vitals package not available');
    });

    // Set up batch flush timer
    flushTimerRef.current = setInterval(flushMetrics, batchInterval);

    // Flush on page hide (user navigates away)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushMetrics();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushMetrics(); // Final flush
    };
  }, [reportMetric, flushMetrics, batchInterval, debug]);

  // This component renders nothing
  return null;
}

export default WebVitals;
