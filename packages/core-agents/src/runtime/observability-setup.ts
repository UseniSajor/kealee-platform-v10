/**
 * Observability Setup & Initialization
 *
 * Configures observability providers based on environment.
 * Production uses Sentry; development uses console logging.
 */

import {
  AgenticObservability,
  SentryObservabilityProvider,
  ConsoleObservabilityProvider,
  AnomalyDetector,
  type AlertThresholds,
} from './observability';

/**
 * Initialize observability based on environment
 *
 * Usage:
 * ```typescript
 * const { observability, anomalyDetector } = initializeObservability({
 *   sentryDsn: process.env.SENTRY_DSN,
 *   environment: process.env.NODE_ENV,
 * });
 * ```
 */
export function initializeObservability(config: {
  sentryDsn?: string;
  environment?: string;
  alertThresholds?: Partial<AlertThresholds>;
}) {
  const isDev = config.environment === 'development' || config.environment === 'test';

  let provider;

  if (isDev || !config.sentryDsn) {
    // Development: console logging
    provider = new ConsoleObservabilityProvider();
  } else {
    // Production: Sentry
    try {
      const Sentry = require('@sentry/node');
      Sentry.init({
        dsn: config.sentryDsn,
        environment: config.environment || 'production',
        tracesSampleRate: 0.1, // 10% sampling in production
      });
      provider = new SentryObservabilityProvider(Sentry);
    } catch (err) {
      console.warn('Sentry not available, falling back to console logging:', err);
      provider = new ConsoleObservabilityProvider();
    }
  }

  const observability = new AgenticObservability(provider);

  // Default alert thresholds (can be overridden via config)
  const thresholds: AlertThresholds = {
    maxDurationMs: 60000, // 60 seconds
    maxIterations: 20,
    minToolSuccessRate: 0.5, // 50%
    maxToolFailures: 5,
    maxBlockedUrlAttempts: 3,
    maxMemoryMb: 256,
    ...config.alertThresholds,
  };

  const anomalyDetector = new AnomalyDetector(thresholds, observability);

  return {
    observability,
    anomalyDetector,
    provider,
  };
}

/**
 * Singleton instance — use if no custom config needed
 */
let globalObservability: AgenticObservability | null = null;
let globalAnomalyDetector: AnomalyDetector | null = null;

export function getObservability(): AgenticObservability {
  if (!globalObservability) {
    const { observability } = initializeObservability({
      sentryDsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
    });
    globalObservability = observability;
  }
  return globalObservability;
}

export function getAnomalyDetector(): AnomalyDetector {
  if (!globalAnomalyDetector) {
    const { anomalyDetector } = initializeObservability({
      sentryDsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
    });
    globalAnomalyDetector = anomalyDetector;
  }
  return globalAnomalyDetector;
}

/**
 * Example environment setup (.env)
 *
 * Development:
 * ```
 * NODE_ENV=development
 * # No SENTRY_DSN needed, uses console logging
 * ```
 *
 * Production:
 * ```
 * NODE_ENV=production
 * SENTRY_DSN=https://examplePublicKey@sentry.example.com/project-id
 * ```
 */
