/**
 * Retry utility for transient 3rd-party API failures.
 *
 * - Retries on network / timeout / 5xx errors with exponential back-off.
 * - Does NOT retry on 4xx client errors (they indicate a caller bug).
 * - Logs every retry attempt so we have observability.
 */

export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default: 3 */
  maxRetries?: number;
  /** Base delay between retries in ms. Actual delay = baseDelay * 2^attempt. Default: 500 */
  baseDelayMs?: number;
  /** Optional label for log messages. */
  label?: string;
  /** Custom logger; falls back to console. */
  logger?: Pick<Console, 'warn' | 'error'>;
}

/**
 * Returns `true` when the error looks like a transient problem worth retrying.
 *
 * Covers:
 *  - Network errors (ECONNRESET, ETIMEDOUT, fetch failures, etc.)
 *  - HTTP 5xx responses (including non-standard 429 rate-limit)
 *  - Timeout errors from popular HTTP libraries (axios, node-fetch, got)
 */
function isRetryable(error: any): boolean {
  // --- Network-level errors ---
  const networkCodes = new Set([
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EPIPE',
    'EAI_AGAIN',
    'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_SOCKET',
  ]);

  if (error?.code && networkCodes.has(error.code)) return true;
  if (error?.type === 'system') return true; // node-fetch system error

  // --- HTTP status codes ---
  const status: number | undefined =
    error?.status ??
    error?.statusCode ??
    error?.response?.status ??
    error?.response?.statusCode;

  if (status !== undefined) {
    // 4xx = client error, do NOT retry (except 408 Request Timeout and 429 Too Many Requests)
    if (status === 408 || status === 429) return true;
    if (status >= 400 && status < 500) return false;
    // 5xx = server error, retry
    if (status >= 500) return true;
  }

  // --- Timeout keywords in the error message ---
  const msg: string = (error?.message ?? '').toLowerCase();
  if (msg.includes('timeout') || msg.includes('network') || msg.includes('socket hang up')) {
    return true;
  }

  return false;
}

/**
 * Execute `fn` with automatic retry on transient failures.
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => docusignApi.getEnvelope(accountId, envelopeId),
 *   { maxRetries: 3, label: 'DocuSign.getEnvelope' }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 500,
    label = 'withRetry',
    logger = console,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      const isLast = attempt === maxRetries - 1;

      if (!isRetryable(error) || isLast) {
        // Non-retryable or final attempt -- surface the error.
        if (isLast && attempt > 0) {
          logger.error(
            `[${label}] All ${maxRetries} attempts exhausted. Last error: ${error?.message ?? error}`,
          );
        }
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      logger.warn(
        `[${label}] Attempt ${attempt + 1}/${maxRetries} failed (${error?.message ?? error}). ` +
          `Retrying in ${delay}ms...`,
      );

      await sleep(delay);
    }
  }

  // Shouldn't reach here, but just in case:
  throw lastError;
}

/** Promise-based sleep helper. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
