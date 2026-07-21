/**
 * Audit Types — Shared interfaces for the audit logging system.
 *
 * These types are used by the AuditClient (write path) and by
 * the API audit service (read path) across the platform.
 */

// ============================================================================
// AUDIT ENTRY (input to AuditClient.log)
// ============================================================================

export interface AuditEntry {
  /** User who performed the action */
  userId: string;

  /** Denormalized user email for fast search */
  userEmail?: string;

  /** User role at the time of the action */
  userRole?: string;

  /** Action performed — maps to Prisma AuditAction enum values */
  action: string;

  /** Type of entity affected — maps to Prisma AuditEntityType enum values */
  entityType: string;

  /** ID of the entity affected */
  entityId: string;

  /** State before the change (for UPDATE/DELETE) */
  previousValue?: Record<string, any> | null;

  /** State after the change (for CREATE/UPDATE) */
  newValue?: Record<string, any> | null;

  /**
   * List of field paths that changed.
   * Auto-computed from previousValue/newValue if not provided.
   */
  changedFields?: string[];

  /** Human-readable description of the action */
  description?: string;

  /** Project scope (if action is project-scoped) */
  projectId?: string;

  /** Organization scope */
  organizationId?: string;

  /** Client IP address */
  ipAddress?: string;

  /** Client user agent */
  userAgent?: string;

  /** OpenTelemetry trace ID for correlation */
  traceId?: string;

  /** Origin of the action: 'api', 'command-center', 'webhook', 'cron', 'system' */
  source?: string;

  /** Classification category: 'FINANCIAL', 'OPERATIONAL', 'SECURITY', 'COMPLIANCE', 'ADMINISTRATIVE' */
  category?: string;

  /** Severity level: 'INFO', 'WARNING', 'CRITICAL' */
  severity?: string;

  /** Additional metadata */
  metadata?: Record<string, any>;

  /** Business reason for the change */
  businessReason?: string;
}

// ============================================================================
// AUDIT CLIENT OPTIONS
// ============================================================================

export interface AuditClientOptions {
  /** Prisma client instance for database writes */
  prisma: any; // PrismaClient — typed as any to avoid import issues across packages

  /** Source identifier for all entries from this client */
  source?: string;

  /** Number of entries to batch before flushing (default: 25) */
  batchSize?: number;

  /** Milliseconds between automatic flushes (default: 3000) */
  flushIntervalMs?: number;

  /** Logger instance (optional — falls back to console) */
  logger?: {
    error: (msg: string, ...args: any[]) => void;
    warn: (msg: string, ...args: any[]) => void;
    info: (msg: string, ...args: any[]) => void;
  };
}

// ============================================================================
// AUDIT SEARCH/READ TYPES
// ============================================================================

export interface AuditSearchFilters {
  userId?: string;
  userEmail?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  projectId?: string;
  organizationId?: string;
  source?: string;
  severity?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditSearchResult {
  logs: AuditLogRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AuditLogRecord {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  userEmail?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  beforeData?: any;
  afterData?: any;
  fieldChanges?: any;
  description?: string | null;
  changeDescription?: string | null;
  businessReason?: string | null;
  projectId?: string | null;
  organizationId?: string | null;
  traceId?: string | null;
  source?: string | null;
  category: string;
  severity: string;
  metadata?: any;
  createdAt: Date;
}

export interface AuditStats {
  totalEvents: number;
  eventsToday: number;
  criticalEvents: number;
  uniqueUsers: number;
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
}
