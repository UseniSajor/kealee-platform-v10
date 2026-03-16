/**
 * services/command-center/utils/retry.ts
 *
 * Sprint 5B — retryWithBackoff utility for external API calls (Zoho etc.)
 *
 * Usage:
 *   import { retryWithBackoff } from '../utils/retry.js'
 *
 *   await retryWithBackoff(
 *     () => fetch(...),
 *     { attempts: 3, baseDelayMs: 1000, label: 'zoho.createLead' }
 *   )
 *
 * If all retries fail:
 *   - logs the failure
 *   - optionally records a FailedSync entry (via recordFailedSync)
 *   - returns null (never throws)
 */

import { createLogger } from '@kealee/observability'
import { getPrisma } from '@kealee/database'

const logger = createLogger('retry')

export interface RetryOptions {
  /** Total attempts (including the first try). Default: 3 */
  attempts?: number
  /** Base delay in ms for exponential backoff. Default: 1000 */
  baseDelayMs?: number
  /** Max delay cap. Default: 30_000 (30s) */
  maxDelayMs?: number
  /** Human-readable label for logging. Default: 'unknown' */
  label?: string
  /** Whether to record persistent FailedSync on final failure. Default: true */
  recordSync?: boolean
  /** Optional context to store in FailedSync.payload */
  syncPayload?: Record<string, unknown>
}

const DEFAULT_OPTS: Required<RetryOptions> = {
  attempts:    3,
  baseDelayMs: 1000,
  maxDelayMs:  30_000,
  label:       'unknown',
  recordSync:  true,
  syncPayload: {},
}

/**
 * Execute `fn` with exponential backoff retries.
 * Returns the resolved value, or null if all attempts fail.
 * Never throws.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T | null> {
  const { attempts, baseDelayMs, maxDelayMs, label, recordSync, syncPayload } = {
    ...DEFAULT_OPTS,
    ...opts,
  }

  let lastErr: unknown

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await fn()
      if (attempt > 1) {
        logger.info({ label, attempt }, 'Retry succeeded')
      }
      return result
    } catch (err: unknown) {
      lastErr = err
      const errMsg = err instanceof Error ? err.message : String(err)

      if (attempt < attempts) {
        const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs)
        logger.warn(
          { label, attempt, attemptsLeft: attempts - attempt, delay, err: errMsg },
          'Retrying after failure',
        )
        await _sleep(delay)
      } else {
        logger.error(
          { label, attempt, err: errMsg },
          'All retry attempts exhausted',
        )
      }
    }
  }

  // Record FailedSync for recovery job
  if (recordSync) {
    void recordFailedSync(label, lastErr, syncPayload)
  }

  return null
}

/**
 * Persist a FailedSync record so the background recovery job can retry.
 * Non-blocking — errors are swallowed.
 */
export async function recordFailedSync(
  label:   string,
  err:     unknown,
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    const prisma = getPrisma()
    await (prisma as any).failedSync.create({
      data: {
        service:    label.split('.')[0] ?? 'unknown',
        operation:  label,
        errorMsg:   err instanceof Error ? err.message : String(err),
        payload:    payload,
        retryCount: 0,
        status:     'PENDING',
      },
    })
  } catch {
    // silently ignore — sync recording failure must not bubble up
  }
}

function _sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
