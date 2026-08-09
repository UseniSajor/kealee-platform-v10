/**
 * Observability & Monitoring for Agentic Bots
 *
 * Exports metrics and events for external observability systems.
 * Integration points: Sentry, Grafana, DataDog, CloudWatch, etc.
 */

export interface MetricsEvent {
  timestamp: string;
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
}

export interface ObservabilityProvider {
  recordMetric(event: MetricsEvent): Promise<void>;
  recordEvent(event: ObservabilityEvent): Promise<void>;
  recordError(error: Error, context?: Record<string, unknown>): Promise<void>;
}

export interface ObservabilityEvent {
  timestamp: string;
  name: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  message: string;
  context?: Record<string, unknown>;
}

export interface AgenticMetrics {
  // Execution metrics
  executionDuration: MetricsEvent;
  iterationCount: MetricsEvent;
  toolCallCount: MetricsEvent;
  toolSuccessRate: MetricsEvent;

  // Tool breakdown
  ragCallCount: MetricsEvent;
  browserCallCount: MetricsEvent;
  toolFailureCount: MetricsEvent;

  // Quality metrics
  outputLength: MetricsEvent;
  confidence?: MetricsEvent;

  // Resource metrics
  memoryUsageMb?: MetricsEvent;
  tokenUsage?: MetricsEvent;
}

/**
 * Default no-op observability provider (for testing)
 */
export class NoOpObservabilityProvider implements ObservabilityProvider {
  async recordMetric(_event: MetricsEvent): Promise<void> {}
  async recordEvent(_event: ObservabilityEvent): Promise<void> {}
  async recordError(_error: Error, _context?: Record<string, unknown>): Promise<void> {}
}

/**
 * Observability aggregator for agentic execution
 */
export class AgenticObservability {
  constructor(private provider: ObservabilityProvider = new NoOpObservabilityProvider()) {}

  /**
   * Record execution completion
   */
  async recordExecution(
    botName: string,
    result: {
      success: boolean;
      durationMs: number;
      iterations: number;
      toolCalls: number;
      outputLength: number;
      error?: string;
    }
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const tags = { bot: botName, success: String(result.success) };

    await Promise.all([
      this.provider.recordMetric({
        timestamp,
        name: 'agentic.execution.duration',
        value: result.durationMs,
        unit: 'ms',
        tags,
      }),
      this.provider.recordMetric({
        timestamp,
        name: 'agentic.execution.iterations',
        value: result.iterations,
        tags,
      }),
      this.provider.recordMetric({
        timestamp,
        name: 'agentic.execution.tool_calls',
        value: result.toolCalls,
        tags,
      }),
      this.provider.recordMetric({
        timestamp,
        name: 'agentic.execution.output_length',
        value: result.outputLength,
        unit: 'chars',
        tags,
      }),
    ]);

    if (!result.success && result.error) {
      await this.provider.recordEvent({
        timestamp,
        name: 'agentic.execution.failed',
        level: 'error',
        message: `Bot execution failed: ${result.error}`,
        context: { bot: botName, ...result },
      });
    }
  }

  /**
   * Record tool execution
   */
  async recordToolExecution(
    toolName: string,
    result: {
      success: boolean;
      durationMs: number;
      error?: string;
    }
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const tags = { tool: toolName, success: String(result.success) };

    await this.provider.recordMetric({
      timestamp,
      name: 'agentic.tool.execution',
      value: result.durationMs,
      unit: 'ms',
      tags,
    });

    if (!result.success && result.error) {
      await this.provider.recordEvent({
        timestamp,
        name: 'agentic.tool.failed',
        level: 'warn',
        message: `Tool ${toolName} failed: ${result.error}`,
        context: { tool: toolName, ...result },
      });
    }
  }

  /**
   * Record browser security event
   */
  async recordBrowserEvent(
    result: {
      action: string;
      url?: string;
      risk: 'safe' | 'warning' | 'blocked';
      success: boolean;
    }
  ): Promise<void> {
    const timestamp = new Date().toISOString();

    if (result.risk === 'blocked') {
      await this.provider.recordEvent({
        timestamp,
        name: 'agentic.browser.blocked',
        level: 'warn',
        message: `Browser action blocked: ${result.action}`,
        context: { action: result.action, url: result.url },
      });
    }

    if (result.risk === 'warning') {
      await this.provider.recordMetric({
        timestamp,
        name: 'agentic.browser.warning',
        value: 1,
        tags: { action: result.action, risk: 'warning' },
      });
    }
  }

  /**
   * Record suspicious activity detection
   */
  async recordSuspiciousActivity(
    botName: string,
    warnings: string[]
  ): Promise<void> {
    if (warnings.length === 0) return;

    const timestamp = new Date().toISOString();

    for (const warning of warnings) {
      await this.provider.recordEvent({
        timestamp,
        name: 'agentic.suspicious_activity',
        level: 'warn',
        message: warning,
        context: { bot: botName },
      });
    }
  }

  /**
   * Record performance anomaly
   */
  async recordAnomaly(
    name: string,
    severity: 'info' | 'warn' | 'critical',
    context?: Record<string, unknown>
  ): Promise<void> {
    await this.provider.recordEvent({
      timestamp: new Date().toISOString(),
      name: `agentic.anomaly.${name}`,
      level: severity,
      message: `Agentic anomaly detected: ${name}`,
      context,
    });
  }
}

/**
 * Sentry integration example
 *
 * Usage:
 * ```typescript
 * import * as Sentry from '@sentry/node';
 *
 * const sentryProvider = new SentryObservabilityProvider(Sentry);
 * const observability = new AgenticObservability(sentryProvider);
 * ```
 */
export class SentryObservabilityProvider implements ObservabilityProvider {
  constructor(private sentry: any) {}

  async recordMetric(event: MetricsEvent): Promise<void> {
    this.sentry.captureMessage(`[METRIC] ${event.name}: ${event.value}${event.unit ? event.unit : ''}`, 'info', {
      contexts: {
        metrics: event.tags || {},
      },
    });
  }

  async recordEvent(event: ObservabilityEvent): Promise<void> {
    this.sentry.captureMessage(event.message, event.level, {
      contexts: {
        event: event.context || {},
      },
    });
  }

  async recordError(error: Error, context?: Record<string, unknown>): Promise<void> {
    this.sentry.captureException(error, { contexts: { agentic: context } });
  }
}

/**
 * Simple console logger for development
 */
export class ConsoleObservabilityProvider implements ObservabilityProvider {
  async recordMetric(event: MetricsEvent): Promise<void> {
    console.log(`📊 ${event.name}: ${event.value}${event.unit ? event.unit : ''}`, event.tags);
  }

  async recordEvent(event: ObservabilityEvent): Promise<void> {
    const prefix = {
      info: '📝',
      warn: '⚠️',
      error: '❌',
      critical: '🚨',
    }[event.level];
    console.log(`${prefix} [${event.level}] ${event.message}`, event.context);
  }

  async recordError(error: Error, context?: Record<string, unknown>): Promise<void> {
    console.error('❌ [ERROR]', error.message, context);
  }
}

/**
 * Alert thresholds for anomaly detection
 */
export interface AlertThresholds {
  maxDurationMs?: number;        // Max execution time
  maxIterations?: number;         // Max iterations before timeout
  minToolSuccessRate?: number;    // Min success rate (0–1)
  maxToolFailures?: number;       // Max failures before alert
  maxBlockedUrlAttempts?: number; // Max blocked URLs before alert
  maxMemoryMb?: number;          // Max memory per browser
}

/**
 * Anomaly detector for agentic execution
 */
export class AnomalyDetector {
  constructor(
    private thresholds: AlertThresholds = {},
    private observability?: AgenticObservability
  ) {}

  /**
   * Detect execution anomalies
   */
  async detectExecutionAnomalies(execution: {
    botName: string;
    durationMs: number;
    iterations: number;
    toolCallCount: number;
    successfulToolCalls: number;
    error?: string;
  }): Promise<string[]> {
    const alerts: string[] = [];

    if (this.thresholds.maxDurationMs && execution.durationMs > this.thresholds.maxDurationMs) {
      const msg = `Execution duration ${execution.durationMs}ms exceeds threshold ${this.thresholds.maxDurationMs}ms`;
      alerts.push(msg);
      await this.observability?.recordAnomaly('slow_execution', 'warn', {
        bot: execution.botName,
        duration: execution.durationMs,
        threshold: this.thresholds.maxDurationMs,
      });
    }

    if (this.thresholds.maxIterations && execution.iterations > this.thresholds.maxIterations) {
      const msg = `Iterations ${execution.iterations} exceed threshold ${this.thresholds.maxIterations}`;
      alerts.push(msg);
      await this.observability?.recordAnomaly('max_iterations', 'warn', {
        bot: execution.botName,
        iterations: execution.iterations,
      });
    }

    if (
      this.thresholds.minToolSuccessRate &&
      execution.toolCallCount > 0 &&
      execution.successfulToolCalls / execution.toolCallCount < this.thresholds.minToolSuccessRate
    ) {
      const rate = (execution.successfulToolCalls / execution.toolCallCount).toFixed(2);
      const msg = `Tool success rate ${rate} below threshold ${this.thresholds.minToolSuccessRate}`;
      alerts.push(msg);
      await this.observability?.recordAnomaly('low_tool_success_rate', 'warn', {
        bot: execution.botName,
        rate,
      });
    }

    return alerts;
  }
}

/**
 * Export default no-op observability for testing
 */
export const defaultObservability = new AgenticObservability();
