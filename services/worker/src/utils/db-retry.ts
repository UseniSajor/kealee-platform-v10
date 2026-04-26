/**
 * services/worker/src/utils/db-retry.ts
 *
 * Exponential-backoff retry wrapper for critical DB writes.
 * Used by worker processors to ensure transient failures don't cause
 * permanent data loss.
 *
 * Default: 3 attempts, 500ms base delay (500 → 1000 → 2000ms).
 */

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 500,
): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (attempt < attempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  throw lastErr
}
