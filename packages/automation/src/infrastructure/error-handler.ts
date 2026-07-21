/**
 * Command Center Error Handler
 *
 * Centralized error handling for all BullMQ workers across the Command Center.
 * Classifies errors, logs structured output, updates AutomationTask status,
 * tracks health metrics, and triggers escalation for critical failures.
 */

import { moveToDeadLetter } from './dead-letter';
import { alertService, AlertLevel } from './alerting';

// ── Sensitive field names to strip from log output ───────────

const SENSITIVE_FIELDS = new Set([
  'email', 'phone', 'password', 'token', 'secret', 'apiKey', 'api_key',
  'stripeCustomerId', 'stripe_customer_id', 'accessToken', 'access_token',
  'refreshToken', 'refresh_token', 'ssn', 'creditCard', 'credit_card',
  'accountNumber', 'account_number', 'routingNumber', 'routing_number',
  'bankAccount', 'bank_account', 'credentials', 'authorization',
]);

// Critical apps that get immediate escalation on final failure
const CRITICAL_APPS = new Set([
  'APP-01', // Bid Engine
  'APP-07', // OCR Processing
  'APP-08', // Payment Processing
  'APP-15', // Command Center
]);

// ── Error Classification ─────────────────────────────────────

export interface ErrorClassification {
  retryable: boolean;
  category: 'transient' | 'permanent' | 'rate_limit' | 'data' | 'external';
  suggestedDelay?: number;
}

// ── Queue-to-App Mapping ─────────────────────────────────────

const QUEUE_APP_MAP: Record<string, string> = {
  'bid-engine': 'APP-01',
  'cost-database': 'APP-02',
  'vendor-matching': 'APP-03',
  'report-generator': 'APP-04',
  'contract-engine': 'APP-05',
  'estimation-tool': 'APP-06',
  'ocr-processing': 'APP-07',
  'payment-processing': 'APP-08',
  'permit-tracker': 'APP-09',
  'inspection-scheduler': 'APP-10',
  'communication-hub': 'APP-11',
  'scheduling-engine': 'APP-12',
  'qa-vision': 'APP-13',
  'marketplace': 'APP-14',
  'command-center': 'APP-15',
  'email': 'SYS-EMAIL',
  'dead-letter': 'SYS-DLQ',
};

export function mapQueueToAppId(queueName: string): string {
  return QUEUE_APP_MAP[queueName] || `UNKNOWN-${queueName}`;
}

// ── Main Error Handler ───────────────────────────────────────

export class CommandCenterErrorHandler {
  /**
   * Handle a job failure with structured logging, DB tracking, and escalation.
   */
  static async handleJobError(opts: {
    appId: string;
    jobId: string;
    jobName: string;
    error: Error;
    data: any;
    attempt: number;
    maxAttempts: number;
    prisma?: any;
  }): Promise<void> {
    const { appId, jobId, jobName, error, data, attempt, maxAttempts, prisma } = opts;
    const isFinalAttempt = attempt >= maxAttempts;
    const classification = CommandCenterErrorHandler.classifyError(error);

    // 1. Structured error log
    const logEntry = {
      level: 'error',
      app: appId,
      job: jobId,
      name: jobName,
      attempt: `${attempt}/${maxAttempts}`,
      retryable: classification.retryable,
      category: classification.category,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      data: CommandCenterErrorHandler.sanitizeData(data),
      timestamp: new Date().toISOString(),
    };
    console.error(JSON.stringify(logEntry));

    // 2. Update AutomationTask in DB (if prisma available)
    if (prisma) {
      try {
        // Try to find an existing AutomationTask for this job
        const existing = await prisma.automationTask.findFirst({
          where: {
            OR: [
              { id: jobId },
              { payload: { path: ['jobId'], equals: jobId } },
            ],
          },
        });

        if (existing) {
          await prisma.automationTask.update({
            where: { id: existing.id },
            data: {
              status: isFinalAttempt ? 'FAILED' : 'PENDING',
              error: error.message,
              retryCount: attempt,
              result: {
                lastAttempt: attempt,
                classification: classification.category,
                timestamp: new Date().toISOString(),
              },
            },
          });
        }
      } catch (dbErr) {
        // Don't let DB errors prevent error handling from completing
        console.error('[ErrorHandler] Failed to update AutomationTask:', dbErr);
      }

      // 3. Track in AppHealthMetric
      try {
        const periodStart = new Date();
        periodStart.setSeconds(0, 0); // truncate to minute

        await prisma.appHealthMetric.upsert({
          where: {
            appId_period: {
              appId,
              period: periodStart,
            },
          },
          update: {
            jobsFailed: { increment: 1 },
            jobsTotal: { increment: 1 },
          },
          create: {
            appId,
            period: periodStart,
            jobsFailed: 1,
            jobsTotal: 1,
          },
        });
      } catch (metricErr) {
        console.error('[ErrorHandler] Failed to update health metric:', metricErr);
      }
    }

    // 4. Final attempt handling
    if (isFinalAttempt) {
      // Move to dead letter queue
      try {
        await moveToDeadLetter({
          originalQueue: jobName.split(':')[0] || 'unknown',
          jobId,
          jobName,
          data: CommandCenterErrorHandler.sanitizeData(data),
          error: error.message,
          attempts: attempt,
          appId,
          prisma,
        });
      } catch (dlqErr) {
        console.error('[ErrorHandler] Failed to move to dead letter:', dlqErr);
      }

      // Create alert
      const level = CRITICAL_APPS.has(appId) ? AlertLevel.CRITICAL : AlertLevel.ERROR;
      try {
        await alertService.createAlert({
          level,
          source: appId,
          title: `Job Failed: ${jobName}`,
          message: `Job ${jobId} in ${appId} failed after ${attempt} attempts: ${error.message}`,
          data: {
            jobId,
            jobName,
            attempts: attempt,
            category: classification.category,
            error: error.message,
          },
          prisma,
        });
      } catch (alertErr) {
        console.error('[ErrorHandler] Failed to create alert:', alertErr);
      }
    }
  }

  /**
   * Classify an error to determine retry strategy.
   */
  static classifyError(error: Error): ErrorClassification {
    const msg = error.message?.toLowerCase() || '';
    const name = error.name?.toLowerCase() || '';

    // Rate limiting (429)
    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('too many requests')) {
      return { retryable: true, category: 'rate_limit', suggestedDelay: 60_000 };
    }

    // Server errors (500-503, timeout)
    if (
      msg.includes('500') || msg.includes('502') || msg.includes('503') ||
      msg.includes('timeout') || msg.includes('timed out') ||
      msg.includes('econnrefused') || msg.includes('econnreset') ||
      msg.includes('socket hang up') || msg.includes('network')
    ) {
      return { retryable: true, category: 'transient', suggestedDelay: 5_000 };
    }

    // Prisma / data errors
    if (
      name.includes('prisma') ||
      msg.includes('unique constraint') ||
      msg.includes('foreign key') ||
      msg.includes('not found') ||
      msg.includes('validation') ||
      msg.includes('invalid') && !msg.includes('invalid token')
    ) {
      return { retryable: false, category: 'data' };
    }

    // Anthropic / OpenAI API errors
    if (msg.includes('anthropic') || msg.includes('openai')) {
      if (msg.includes('429') || msg.includes('500') || msg.includes('overloaded')) {
        return { retryable: true, category: 'external', suggestedDelay: 30_000 };
      }
      return { retryable: false, category: 'external' };
    }

    // Stripe errors
    if (msg.includes('stripe')) {
      if (msg.includes('rate_limit') || msg.includes('500') || msg.includes('timeout')) {
        return { retryable: true, category: 'external', suggestedDelay: 10_000 };
      }
      // 400-level Stripe errors (invalid card, etc.) are not retryable
      return { retryable: false, category: 'external' };
    }

    // Generic retryable patterns
    if (msg.includes('enotfound') || msg.includes('dns') || msg.includes('ehostunreach')) {
      return { retryable: true, category: 'transient', suggestedDelay: 10_000 };
    }

    // Default: not retryable (play it safe — unknown errors shouldn't endlessly retry)
    return { retryable: false, category: 'permanent' };
  }

  /**
   * Strip sensitive fields from job data before logging.
   */
  static sanitizeData(data: any): any {
    if (data === null || data === undefined) return data;
    if (typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map((item) => CommandCenterErrorHandler.sanitizeData(item));

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_FIELDS.has(key) || SENSITIVE_FIELDS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = CommandCenterErrorHandler.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}
