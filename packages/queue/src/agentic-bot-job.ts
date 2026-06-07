/**
 * Agentic Bot Job Handler
 *
 * Handles multi-step agentic bot execution in queue workers.
 * Persists execution history and tool metadata for audit trail.
 */

import type { BotJobData } from './bot-jobs';
import type { SessionMemory, ToolExecutionRecord } from '@kealee/core-agents';

export interface AgenticBotJobData extends BotJobData {
  agentic: true;
  systemPrompt: string;
  tools?: string[]; // Tool names to include ('rag', 'browser', etc.)
  enableBrowserTool?: boolean;
}

export interface AgenticJobResult {
  requestId: string;
  success: boolean;
  status: 'completed' | 'failed' | 'max_iterations_reached';
  finalText: string;
  toolHistory: ToolExecutionRecord[];
  totalIterations: number;
  durationMs: number;
  error?: string;
  timestamp: string;
}

export interface AgenticJobMetrics {
  totalToolCalls: number;
  successfulToolCalls: number;
  failedToolCalls: number;
  failureRate: number; // 0–1
  averageToolDurationMs: number;
  toolBreakdown: Record<string, number>; // tool name → count
  browserAuditLog?: Array<{ timestamp: string; action: string; url?: string; risk?: string }>;
}

/**
 * Check if a bot job is agentic
 */
export function isAgenticBotJob(job: BotJobData): job is AgenticBotJobData {
  return 'agentic' in job && job.agentic === true;
}

/**
 * Analyze execution results and generate metrics
 */
export function analyzeAgenticExecution(
  result: AgenticJobResult,
  auditLog?: Array<{ timestamp: string; action: string; url?: string; risk?: string }>
): AgenticJobMetrics {
  const successful = result.toolHistory.filter(t => t.success).length;
  const failed = result.toolHistory.filter(t => !t.success).length;

  const toolBreakdown = result.toolHistory.reduce(
    (acc, t) => {
      acc[t.toolName] = (acc[t.toolName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const averageDuration =
    result.toolHistory.length > 0
      ? result.toolHistory.reduce((sum, t) => {
          const duration =
            new Date(t.completedAt!).getTime() - new Date(t.startedAt).getTime();
          return sum + duration;
        }, 0) / result.toolHistory.length
      : 0;

  return {
    totalToolCalls: result.toolHistory.length,
    successfulToolCalls: successful,
    failedToolCalls: failed,
    failureRate: result.toolHistory.length > 0 ? failed / result.toolHistory.length : 0,
    averageToolDurationMs: averageDuration,
    toolBreakdown,
    browserAuditLog: auditLog,
  };
}

/**
 * Detect suspicious activity patterns
 */
export function detectSuspiciousActivity(
  result: AgenticJobResult,
  metrics: AgenticJobMetrics
): string[] {
  const warnings: string[] = [];

  // High failure rate
  if (metrics.failureRate > 0.5) {
    warnings.push(
      `High tool failure rate: ${(metrics.failureRate * 100).toFixed(1)}% (${metrics.failedToolCalls}/${metrics.totalToolCalls})`
    );
  }

  // Many iterations without output
  if (result.totalIterations > 15 && result.finalText.length < 100) {
    warnings.push(
      `High iterations (${result.totalIterations}) but short output (${result.finalText.length} chars)`
    );
  }

  // Repeated browser errors
  const browserCalls = result.toolHistory.filter(t => t.toolName === 'browse_web');
  const browserErrors = browserCalls.filter(t => !t.success);
  if (browserErrors.length > 5) {
    warnings.push(
      `${browserErrors.length} browser errors: possible site blocking or network issues`
    );
  }

  // URL blocking attempts
  if (result.toolHistory.some(t => t.error?.includes('URL blocked'))) {
    const blockedAttempts = result.toolHistory.filter(t =>
      t.error?.includes('URL blocked')
    ).length;
    if (blockedAttempts > 3) {
      warnings.push(`${blockedAttempts} blocked URL attempts — possible lateral movement`);
    }
  }

  return warnings;
}

/**
 * Format execution result for logging/persistence
 */
export function formatAgenticJobResult(
  result: AgenticJobResult,
  metrics: AgenticJobMetrics,
  warnings: string[]
): Record<string, unknown> {
  return {
    requestId: result.requestId,
    success: result.success,
    status: result.status,
    summary: {
      durationMs: result.durationMs,
      iterations: result.totalIterations,
      outputLength: result.finalText.length,
    },
    metrics: {
      toolCalls: {
        total: metrics.totalToolCalls,
        successful: metrics.successfulToolCalls,
        failed: metrics.failedToolCalls,
        failureRate: metrics.failureRate.toFixed(4),
      },
      performance: {
        averageToolDurationMs: metrics.averageToolDurationMs.toFixed(0),
      },
      breakdown: metrics.toolBreakdown,
    },
    warnings,
    error: result.error,
    timestamp: result.timestamp,
  };
}

/**
 * Example queue worker handler (reference implementation)
 *
 * Usage in queue worker:
 * ```
 * const job = await queue.getJob(jobId);
 * if (isAgenticBotJob(job.data)) {
 *   const result = await executeAgenticBotJob(job.data);
 *   await db.agenticJobResults.create({
 *     requestId: result.requestId,
 *     data: formatAgenticJobResult(result, metrics, warnings),
 *   });
 * }
 * ```
 */
export async function executeAgenticBotJob(jobData: AgenticBotJobData): Promise<AgenticJobResult> {
  const startTime = Date.now();

  try {
    // This is a reference implementation signature
    // Actual implementation would:
    // 1. Load the bot by ID from registry
    // 2. Create SessionMemory with tool history tracking
    // 3. Call bot.handleMessage() with agentic execution
    // 4. Capture tool history and metrics
    // 5. Return formatted result

    throw new Error('executeAgenticBotJob: requires bot registry implementation');
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return {
      requestId: jobData.requestId,
      success: false,
      status: 'failed',
      finalText: '',
      toolHistory: [],
      totalIterations: 0,
      durationMs: Date.now() - startTime,
      error,
      timestamp: new Date().toISOString(),
    };
  }
}
