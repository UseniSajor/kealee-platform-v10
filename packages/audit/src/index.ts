/**
 * @kealee/audit — Platform-wide audit logging package
 *
 * Provides an append-only audit trail with:
 * - Batched fire-and-forget writes (minimizes DB overhead)
 * - Automatic JSON diff to compute changedFields
 * - Sensitive data redaction (passwords, tokens, API keys, etc.)
 * - OpenTelemetry trace correlation
 *
 * Usage:
 *   import { AuditClient } from '@kealee/audit';
 *
 *   const audit = new AuditClient({ prisma, source: 'api' });
 *   audit.log({
 *     userId: user.id,
 *     action: 'UPDATE',
 *     entityType: 'CONTRACT',
 *     entityId: contract.id,
 *     previousValue: oldContract,
 *     newValue: newContract,
 *     description: 'Updated contract terms',
 *     category: 'COMPLIANCE',
 *   });
 */

export { AuditClient } from './audit-client.js';
export { sanitize, sanitizeValue, isSensitiveField } from './sanitize.js';
export { diffObjects } from './diff.js';
export type {
  AuditEntry,
  AuditClientOptions,
  AuditSearchFilters,
  AuditSearchResult,
  AuditLogRecord,
  AuditStats,
} from './types.js';
