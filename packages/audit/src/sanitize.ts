/**
 * Sensitive Data Sanitization
 *
 * Deep-walks objects to redact sensitive fields before they are
 * persisted to the audit log. Prevents accidental storage of
 * passwords, tokens, API keys, financial account numbers, etc.
 *
 * Pattern extracted from services/api/src/middleware/security-audit.ts
 */

// ============================================================================
// SENSITIVE FIELD NAMES (case-insensitive matching)
// ============================================================================

const SENSITIVE_FIELDS = new Set([
  'password',
  'passwd',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'secret',
  'clientsecret',
  'client_secret',
  'apikey',
  'api_key',
  'apitoken',
  'api_token',
  'cardnumber',
  'card_number',
  'creditcard',
  'credit_card',
  'cvv',
  'cvc',
  'ssn',
  'socialsecurity',
  'social_security',
  'bankaccount',
  'bank_account',
  'routingnumber',
  'routing_number',
  'accountnumber',
  'account_number',
  'privatekey',
  'private_key',
  'authorization',
  'cookie',
  'sessiontoken',
  'session_token',
  'bearertoken',
  'bearer_token',
]);

const REDACTED = '[REDACTED]';
const MAX_DEPTH = 10;

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Sanitize an object by redacting sensitive field values.
 * Returns a new object — the original is not mutated.
 *
 * @param obj — The object to sanitize
 * @returns Sanitized copy, or null if input is null/undefined
 */
export function sanitize(
  obj: Record<string, any> | null | undefined
): Record<string, any> | null {
  if (obj === null || obj === undefined) return null;
  return deepSanitize(obj, 0) as Record<string, any>;
}

/**
 * Check if a specific field name is considered sensitive.
 */
export function isSensitiveField(key: string): boolean {
  return SENSITIVE_FIELDS.has(key.toLowerCase().replace(/[-_]/g, ''));
}

/**
 * Sanitize a single value for a given key.
 * Returns REDACTED if the key matches a sensitive field.
 */
export function sanitizeValue(key: string, value: any): any {
  if (isSensitiveField(key)) return REDACTED;
  return value;
}

// ============================================================================
// INTERNAL
// ============================================================================

function deepSanitize(value: any, depth: number): any {
  if (depth > MAX_DEPTH) return '[MAX_DEPTH_EXCEEDED]';
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => deepSanitize(item, depth + 1));
  }

  if (typeof value === 'object' && !(value instanceof Date)) {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      if (isSensitiveField(key)) {
        result[key] = REDACTED;
      } else if (typeof val === 'object' && val !== null) {
        result[key] = deepSanitize(val, depth + 1);
      } else {
        result[key] = val;
      }
    }
    return result;
  }

  return value;
}
