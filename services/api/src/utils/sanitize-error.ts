/**
 * Sanitize error messages for client responses.
 *
 * Prevents leaking internal implementation details (database errors,
 * file paths, stack traces) while still providing useful feedback.
 */

/** Known safe error prefixes that can be shown to clients */
const SAFE_PREFIXES = [
  'Not found',
  'Unauthorized',
  'Forbidden',
  'Invalid',
  'Missing',
  'Already exists',
  'Duplicate',
  'Expired',
  'Rate limit',
  'Validation',
  'Permission denied',
  'Account',
  'Payment',
  'Subscription',
]

/** Patterns that indicate internal/sensitive error messages */
const INTERNAL_PATTERNS = [
  /prisma/i,
  /database/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /ETIMEDOUT/i,
  /P\d{4}/,          // Prisma error codes (P2002, P2025, etc.)
  /column/i,
  /relation/i,
  /constraint/i,
  /\.ts:/,            // TypeScript file paths
  /\.js:/,            // JavaScript file paths
  /node_modules/i,
  /at\s+\w+\s*\(/,   // Stack trace lines
  /SELECT|INSERT|UPDATE|DELETE/i, // SQL fragments
]

/**
 * Returns a client-safe error message.
 * If the error message contains internal details, returns the fallback instead.
 */
export function sanitizeErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred'
): string {
  if (!error) return fallback

  const message = error instanceof Error ? error.message : String(error)

  // Check if the message contains internal patterns
  for (const pattern of INTERNAL_PATTERNS) {
    if (pattern.test(message)) {
      return fallback
    }
  }

  // Check if it starts with a known safe prefix
  for (const prefix of SAFE_PREFIXES) {
    if (message.toLowerCase().startsWith(prefix.toLowerCase())) {
      return message
    }
  }

  // Short messages (< 100 chars) without internal patterns are likely intentional
  if (message.length < 100) {
    return message
  }

  return fallback
}
