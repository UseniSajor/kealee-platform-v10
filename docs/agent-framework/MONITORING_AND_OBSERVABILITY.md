# Monitoring and Observability for Agentic Bots

## Overview

The agentic bot framework includes built-in observability hooks for monitoring tool execution, detecting anomalies, and alerting on failures.

## Architecture

```
Agentic Execution
    ↓
Metrics + Events
    ↓
ObservabilityProvider (pluggable)
    ↓
External System (Sentry, Grafana, DataDog, CloudWatch)
```

## Setup

### 1. Initialize Observability

```typescript
import { AgenticObservability, ConsoleObservabilityProvider } from '@kealee/core-agents';

// Development: console logging
const observability = new AgenticObservability(new ConsoleObservabilityProvider());

// Production: Sentry integration
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN });
const observability = new AgenticObservability(new SentryObservabilityProvider(Sentry));

export { observability };
```

### 2. Hook into Execution

```typescript
// In queue worker or API route
const result = await callModelAgentic({
  systemPrompt: '...',
  userMessage: '...',
  tools: [ragTool, browserTool],
  memory,
});

// Record metrics
await observability.recordExecution(botName, {
  success: result.status === 'completed',
  durationMs: Date.now() - startTime,
  iterations: result.totalIterations,
  toolCalls: result.toolHistory.length,
  outputLength: result.finalText.length,
  error: result.error,
});
```

## Metrics

### Execution Metrics

| Metric | Unit | Description |
|--------|------|-------------|
| `agentic.execution.duration` | ms | Time from start to finish |
| `agentic.execution.iterations` | count | Number of Claude loops |
| `agentic.execution.tool_calls` | count | Total tool invocations |
| `agentic.execution.output_length` | chars | Final response length |

### Tool Metrics

| Metric | Unit | Description |
|--------|------|-------------|
| `agentic.tool.execution` | ms | Duration per tool call |
| `agentic.tool.failed` | count | Tool execution failures |
| `agentic.tool.success_rate` | % | % successful tool calls |

### Browser Metrics

| Metric | Unit | Description |
|--------|------|-------------|
| `agentic.browser.action` | count | Navigate, click, extract |
| `agentic.browser.blocked` | count | Blocked URL attempts |
| `agentic.browser.warning` | count | HTTP, suspicious patterns |

### System Metrics

| Metric | Unit | Description |
|--------|------|-------------|
| `agentic.browser.memory` | MB | Memory per browser session |
| `agentic.token.usage` | tokens | Total tokens consumed |

## Events

### Execution Events

```typescript
// Success
{
  name: 'agentic.execution.completed',
  level: 'info',
  message: 'Execution completed in 2.3s',
  context: { bot: 'design', iterations: 3, toolCalls: 5 },
}

// Failure
{
  name: 'agentic.execution.failed',
  level: 'error',
  message: 'Execution failed: max iterations reached',
  context: { bot: 'design', error: '...' },
}
```

### Tool Events

```typescript
// Tool failure
{
  name: 'agentic.tool.failed',
  level: 'warn',
  message: 'Tool retrieve_context failed: network timeout',
  context: { tool: 'retrieve_context', error: '...' },
}
```

### Security Events

```typescript
// Blocked URL
{
  name: 'agentic.browser.blocked',
  level: 'warn',
  message: 'Browser action blocked: navigate to localhost',
  context: { action: 'navigate', url: 'http://localhost:3000' },
}

// Suspicious activity
{
  name: 'agentic.suspicious_activity',
  level: 'warn',
  message: '5 blocked URL attempts — possible lateral movement',
  context: { bot: 'design' },
}
```

## Anomaly Detection

### Setup

```typescript
import { AnomalyDetector } from '@kealee/core-agents';

const thresholds = {
  maxDurationMs: 60000,           // 60s timeout
  maxIterations: 20,               // Prevent infinite loops
  minToolSuccessRate: 0.5,         // 50% failure rate alert
  maxToolFailures: 5,              // Alert after 5 failures
  maxBlockedUrlAttempts: 3,        // Alert after 3 blocks
};

const anomalyDetector = new AnomalyDetector(thresholds, observability);
```

### Detection in Execution

```typescript
const execution = {
  botName: 'design',
  durationMs: 45000,
  iterations: 18,
  toolCallCount: 8,
  successfulToolCalls: 6,
};

const anomalies = await anomalyDetector.detectExecutionAnomalies(execution);
// Returns: ['Tool success rate 0.75 below threshold 0.5']
// (This would trigger an alert)
```

## Observability Providers

### Console Provider (Development)

```typescript
import { ConsoleObservabilityProvider } from '@kealee/core-agents';

const provider = new ConsoleObservabilityProvider();
const observability = new AgenticObservability(provider);

// Output:
// 📊 agentic.execution.duration: 2300ms { bot: 'design', success: 'true' }
// 📝 [info] Execution completed in 2.3s { bot: 'design' }
```

### Sentry Integration (Production)

```typescript
import * as Sentry from '@sentry/node';
import { SentryObservabilityProvider } from '@kealee/core-agents';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

const observability = new AgenticObservability(
  new SentryObservabilityProvider(Sentry)
);

// Metrics → Sentry breadcrumbs
// Events → Sentry events
// Errors → Sentry error tracking
```

### Custom Provider

```typescript
import { ObservabilityProvider, MetricsEvent } from '@kealee/core-agents';

class DataDogProvider implements ObservabilityProvider {
  async recordMetric(event: MetricsEvent): Promise<void> {
    await datadog.recordMetric(event.name, event.value, {
      tags: Object.entries(event.tags || {}).map(([k, v]) => `${k}:${v}`),
    });
  }

  async recordEvent(event: ObservabilityEvent): Promise<void> {
    await datadog.recordEvent({
      title: event.name,
      text: event.message,
      alert_type: event.level === 'critical' ? 'error' : event.level,
      tags: Object.entries(event.context || {}).map(([k, v]) => `${k}:${v}`),
    });
  }

  async recordError(error: Error, context?: Record<string, unknown>): Promise<void> {
    await datadog.recordError(error, { context });
  }
}

const observability = new AgenticObservability(new DataDogProvider());
```

## Dashboards

### Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "Agentic Bots",
    "panels": [
      {
        "title": "Execution Duration (p95)",
        "targets": [{
          "expr": "histogram_quantile(0.95, agentic_execution_duration)"
        }]
      },
      {
        "title": "Tool Success Rate by Bot",
        "targets": [{
          "expr": "avg by (bot) (agentic_tool_success_rate)"
        }]
      },
      {
        "title": "Blocked URL Attempts",
        "targets": [{
          "expr": "rate(agentic_browser_blocked[5m])"
        }]
      },
      {
        "title": "Error Rate by Type",
        "targets": [{
          "expr": "sum by (type) (agentic_errors_total)"
        }]
      },
      {
        "title": "Browser Memory Usage",
        "targets": [{
          "expr": "agentic_browser_memory_mb"
        }]
      }
    ]
  }
}
```

### Key Metrics to Monitor

1. **Execution Duration** (p50, p95, p99)
   - Alert if p95 > 60s
   - Indicates bot performance degradation

2. **Tool Success Rate** (by tool, by bot)
   - Alert if < 50% for any tool
   - Indicates integration failures

3. **Iteration Count Distribution**
   - Alert if max > 20
   - Prevents infinite loops

4. **Blocked URL Attempts**
   - Alert if > 3 per session
   - May indicate security issues

5. **Browser Memory Usage**
   - Alert if > 256MB
   - Session pooling/cleanup working?

6. **Tool Latency Distribution**
   - RAG typically < 100ms
   - Browser typically < 5s
   - Alert if degraded

## Alerts

### Alert Rules (Prometheus syntax)

```yaml
groups:
  - name: agentic_bots
    rules:
      # Execution timeout
      - alert: AgenticExecutionTimeout
        expr: agentic_execution_duration_seconds > 60
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Agentic execution exceeded 60s"

      # High tool failure rate
      - alert: AgenticHighToolFailureRate
        expr: (1 - agentic_tool_success_rate) > 0.5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Tool failure rate > 50%"

      # Suspicious browser activity
      - alert: AgenticBrowserBlocked
        expr: rate(agentic_browser_blocked[5m]) > 1
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Multiple blocked URL attempts"

      # Memory leak in browser pool
      - alert: AgenticBrowserMemoryLeak
        expr: agentic_browser_memory_mb > 256
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Browser session exceeds memory limit"

      # Rate limiting (tool quota exceeded)
      - alert: AgenticRateLimited
        expr: agentic_tool_rate_limited > 0
        for: 1m
        labels:
          severity: info
        annotations:
          summary: "Rate limit exceeded for tool"
```

## Logging Integration

### Structured Logging

```typescript
// In queue worker
const logger = createLogger();

try {
  const result = await executeAgenticJob(job);
  
  logger.info('agentic_execution_complete', {
    requestId: job.requestId,
    bot: job.botId,
    success: result.success,
    durationMs: result.durationMs,
    iterations: result.totalIterations,
    toolCalls: result.toolHistory.length,
  });

  await observability.recordExecution(job.botId, {
    success: result.success,
    durationMs: result.durationMs,
    iterations: result.totalIterations,
    toolCalls: result.toolHistory.length,
    outputLength: result.finalText.length,
  });
} catch (err) {
  logger.error('agentic_execution_failed', {
    requestId: job.requestId,
    bot: job.botId,
    error: err.message,
    stack: err.stack,
  });

  await observability.recordError(err, { requestId: job.requestId, bot: job.botId });
}
```

## Alerting Runbook

### Scenario: High Tool Failure Rate

1. **Alert fires:** `agentic_tool_success_rate < 0.5`
2. **Investigation:**
   ```sql
   -- Which tools are failing?
   SELECT tool_name, COUNT(*) as failures
   FROM tool_execution_log
   WHERE success = false
   AND created_at > now() - interval '1 hour'
   GROUP BY tool_name;

   -- Common error messages?
   SELECT error, COUNT(*) as count
   FROM tool_execution_log
   WHERE success = false
   GROUP BY error
   LIMIT 5;
   ```
3. **Remediation:**
   - RAG tool: Check seed pack ingestion
   - Browser tool: Check network connectivity
   - Custom tool: Check external API status

### Scenario: Blocked URL Attempts

1. **Alert fires:** `agentic_browser_blocked > 3`
2. **Investigation:**
   ```sql
   SELECT url, COUNT(*) as attempts
   FROM browser_audit_event
   WHERE risk = 'blocked'
   AND timestamp > now() - interval '1 hour'
   GROUP BY url;
   ```
3. **Remediation:**
   - Review bot's system prompt (may be attempting internal navigation)
   - Check if IP allowlist is too restrictive
   - Verify user's jurisdiction/network setup

### Scenario: Execution Timeout

1. **Alert fires:** `agentic_execution_duration > 60s`
2. **Investigation:**
   ```sql
   SELECT bot_id, COUNT(*) as slow_executions, AVG(duration_ms) as avg_duration
   FROM agentic_job_execution
   WHERE duration_ms > 60000
   AND created_at > now() - interval '1 hour'
   GROUP BY bot_id;
   ```
3. **Remediation:**
   - Check Claude API latency (external)
   - Check network latency to external services (RAG, browser)
   - Reduce max iterations or tool count
   - Profile bot execution flow

## Testing Observability

```typescript
describe('AgenticObservability', () => {
  it('records execution metrics', async () => {
    const mockProvider = new MockObservabilityProvider();
    const observability = new AgenticObservability(mockProvider);

    await observability.recordExecution('testbot', {
      success: true,
      durationMs: 2500,
      iterations: 3,
      toolCalls: 5,
      outputLength: 250,
    });

    expect(mockProvider.recordedMetrics).toContainEqual(
      expect.objectContaining({
        name: 'agentic.execution.duration',
        value: 2500,
      })
    );
  });

  it('detects anomalies', async () => {
    const detector = new AnomalyDetector({ maxDurationMs: 5000 });
    const alerts = await detector.detectExecutionAnomalies({
      botName: 'test',
      durationMs: 10000,
      iterations: 5,
      toolCallCount: 3,
      successfulToolCalls: 3,
    });

    expect(alerts).toContain(
      expect.stringMatching(/exceeds threshold/)
    );
  });
});
```

## Best Practices

1. **Always record execution results** — even failures
2. **Tag metrics with context** — bot name, user ID, environment
3. **Set reasonable thresholds** — based on baseline metrics
4. **Review dashboards weekly** — catch trends early
5. **Test alert rules** — with synthetic test data
6. **Document runbooks** — for each critical alert
7. **Correlate metrics + logs** — use trace IDs for debugging
8. **Monitor costs** — track token usage + API calls

## Links

- [Sentry Integration](https://docs.sentry.io/product/)
- [Prometheus Alerting](https://prometheus.io/docs/alerting/latest/overview/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [DataDog APM](https://docs.datadoghq.com/tracing/)
