/**
 * AuditClient — Batched, fire-and-forget audit log writer.
 *
 * Designed for high-throughput environments. Entries are queued in memory
 * and flushed to the database in batches to minimize write overhead.
 *
 * Usage:
 *   const audit = new AuditClient({ prisma, source: 'api' });
 *   audit.log({ userId, action: 'CREATE', entityType: 'CONTRACT', entityId, ... });
 *   // On shutdown:
 *   await audit.shutdown();
 *
 * Modeled after the batch pattern in services/api/src/middleware/request-logger.middleware.ts.
 */

import { diffObjects } from './diff.js';
import { sanitize } from './sanitize.js';
import type { AuditEntry, AuditClientOptions } from './types.js';

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_BATCH_SIZE = 25;
const DEFAULT_FLUSH_INTERVAL_MS = 3000;
const MAX_RETRY_ATTEMPTS = 1;

// ============================================================================
// AUDIT CLIENT
// ============================================================================

export class AuditClient {
  private prisma: any;
  private source: string;
  private batchSize: number;
  private flushIntervalMs: number;
  private queue: InternalAuditRecord[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;
  private isShutdown = false;
  private logger: AuditClientOptions['logger'];

  constructor(options: AuditClientOptions) {
    this.prisma = options.prisma;
    this.source = options.source || 'unknown';
    this.batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
    this.flushIntervalMs = options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
    this.logger = options.logger || {
      error: console.error,
      warn: console.warn,
      info: console.info,
    };

    this.startFlushTimer();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Log an audit entry — fire-and-forget.
   *
   * - Auto-diffs previousValue/newValue to compute changedFields
   * - Sanitizes sensitive data in before/after values
   * - Attaches traceId from OpenTelemetry context (if available)
   * - Queues the entry for batch insert
   *
   * This method is synchronous and never throws — safe to call anywhere.
   */
  log(entry: AuditEntry): void {
    if (this.isShutdown) return;

    try {
      // Auto-compute changedFields from diff if not explicitly provided
      let changedFields = entry.changedFields;
      if (!changedFields && entry.previousValue && entry.newValue) {
        changedFields = diffObjects(entry.previousValue, entry.newValue);
      }

      // Sanitize before/after data
      const sanitizedBefore = sanitize(entry.previousValue);
      const sanitizedAfter = sanitize(entry.newValue);

      // Try to get traceId from OpenTelemetry
      let traceId = entry.traceId;
      if (!traceId) {
        try {
          // Dynamic import to avoid hard dependency
          const { getTraceId } = require('@kealee/observability');
          traceId = getTraceId?.() || undefined;
        } catch {
          // observability package not available — skip
        }
      }

      const record: InternalAuditRecord = {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        performedBy: entry.userId,
        userEmail: entry.userEmail || undefined,
        userRole: entry.userRole || undefined,
        ipAddress: entry.ipAddress || undefined,
        userAgent: entry.userAgent || undefined,
        beforeData: sanitizedBefore,
        afterData: sanitizedAfter,
        fieldChanges: changedFields ? changedFields : undefined,
        description: entry.description || undefined,
        changeDescription: entry.description || undefined,
        businessReason: entry.businessReason || undefined,
        projectId: entry.projectId || undefined,
        organizationId: entry.organizationId || undefined,
        traceId: traceId || undefined,
        source: entry.source || this.source,
        category: entry.category || 'OPERATIONAL',
        severity: entry.severity || 'INFO',
        metadata: entry.metadata ? sanitize(entry.metadata) : undefined,
      };

      this.queue.push(record);

      // Flush immediately if queue reaches batch size
      if (this.queue.length >= this.batchSize) {
        this.flush().catch((err) => {
          this.logger?.error('[AuditClient] Batch flush failed:', err);
        });
      }
    } catch (err) {
      this.logger?.error('[AuditClient] Failed to enqueue audit entry:', err);
    }
  }

  /**
   * Convenience method: extract user/IP/UA from a Fastify-like request
   * and log an audit entry.
   */
  logFromRequest(
    request: {
      headers?: Record<string, any>;
      ip?: string;
      url?: string;
      method?: string;
      user?: { id: string; email?: string; role?: string; organizationId?: string };
    },
    resource: string,
    action: string,
    details?: Partial<AuditEntry>
  ): void {
    const user = (request as any).user;
    if (!user?.id) return; // Cannot audit without a user

    const ipAddress =
      (request.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.ip ||
      undefined;

    this.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action,
      entityType: resource,
      entityId: details?.entityId || 'unknown',
      ipAddress,
      userAgent: request.headers?.['user-agent'] || undefined,
      organizationId: user.organizationId || details?.organizationId,
      description: details?.description || `${(request as any).method || ''} ${(request as any).url || ''}`.trim(),
      ...details,
    });
  }

  /**
   * Force flush all queued entries to the database.
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;

    this.isFlushing = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      await this.writeBatch(batch);
    } catch (err) {
      this.logger?.error(`[AuditClient] Flush failed for ${batch.length} entries:`, err);

      // Retry once — put entries back at front of queue
      if (batch.length > 0) {
        this.queue.unshift(...batch);
      }
    } finally {
      this.isFlushing = false;

      // If there are still entries in the queue, flush again
      if (this.queue.length >= this.batchSize) {
        await this.flush();
      }
    }
  }

  /**
   * Graceful shutdown — flush remaining entries and stop timer.
   */
  async shutdown(): Promise<void> {
    this.isShutdown = true;
    this.stopFlushTimer();

    // Flush any remaining entries
    while (this.queue.length > 0) {
      await this.flush();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTERNAL
  // ══════════════════════════════════════════════════════════════════════════

  private startFlushTimer(): void {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        this.logger?.error('[AuditClient] Periodic flush failed:', err);
      });
    }, this.flushIntervalMs);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Write a batch of audit records to the database using createMany.
   */
  private async writeBatch(records: InternalAuditRecord[]): Promise<void> {
    if (records.length === 0) return;

    const data = records.map((r) => ({
      entityType: r.entityType as any,
      entityId: r.entityId,
      action: r.action as any,
      performedBy: r.performedBy,
      userEmail: r.userEmail ?? null,
      userRole: r.userRole ?? null,
      ipAddress: r.ipAddress ?? null,
      userAgent: r.userAgent ?? null,
      beforeData: r.beforeData ?? undefined,
      afterData: r.afterData ?? undefined,
      fieldChanges: r.fieldChanges ?? undefined,
      description: r.description ?? null,
      changeDescription: r.changeDescription ?? null,
      businessReason: r.businessReason ?? null,
      projectId: r.projectId ?? null,
      organizationId: r.organizationId ?? null,
      traceId: r.traceId ?? null,
      source: r.source ?? null,
      category: r.category as any,
      severity: (r.severity as any) ?? 'INFO',
      metadata: r.metadata ?? undefined,
      isImmutable: true,
    }));

    await this.prisma.auditLog.createMany({ data });
  }
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

interface InternalAuditRecord {
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
  fieldChanges?: string[];
  description?: string;
  changeDescription?: string;
  businessReason?: string;
  projectId?: string;
  organizationId?: string;
  traceId?: string;
  source?: string;
  category: string;
  severity: string;
  metadata?: Record<string, any> | null;
}
