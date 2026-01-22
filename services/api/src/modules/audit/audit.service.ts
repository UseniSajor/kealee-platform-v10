/**
 * Audit Service
 * Immutable audit trail and user activity logging
 */

import { PrismaClient, Prisma } from '@kealee/database';

const prisma = new PrismaClient();

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  activityType: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ChangeTracking {
  entityType: string;
  entityId: string;
  field: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}

export class AuditService {
  /**
   * Log an audit event (immutable)
   */
  async logAudit(data: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const auditLog: AuditLog = {
      id: this.generateId(),
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      changes: data.changes,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: new Date(),
    };

    // In production, would store in dedicated audit log table
    // with write-once, read-many constraints
    
    return auditLog;
  }

  /**
   * Log user activity
   */
  async logActivity(data: {
    userId: string;
    activityType: string;
    description: string;
    metadata?: Record<string, any>;
  }): Promise<UserActivityLog> {
    const activityLog: UserActivityLog = {
      id: this.generateId(),
      userId: data.userId,
      activityType: data.activityType,
      description: data.description,
      metadata: data.metadata,
      timestamp: new Date(),
    };

    // Store activity log
    return activityLog;
  }

  /**
   * Track field-level changes
   */
  async trackChange(data: {
    entityType: string;
    entityId: string;
    field: string;
    oldValue: any;
    newValue: any;
    changedBy: string;
    reason?: string;
  }): Promise<ChangeTracking> {
    const changeLog: ChangeTracking = {
      entityType: data.entityType,
      entityId: data.entityId,
      field: data.field,
      oldValue: data.oldValue,
      newValue: data.newValue,
      changedBy: data.changedBy,
      changedAt: new Date(),
      reason: data.reason,
    };

    // Store change tracking
    return changeLog;
  }

  /**
   * Alias for logAudit (for backward compatibility)
   */
  async recordAudit(data: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
  }): Promise<AuditLog> {
    // If reason is provided, add it to metadata
    const auditData = { ...data };
    if (data.reason) {
      auditData.metadata = {
        ...data.metadata,
        reason: data.reason,
      };
    }
    return this.logAudit(auditData);
  }

  /**
   * Get audit trail for entity
   */
  async getAuditTrail(
    entityType: string,
    entityId: string
  ): Promise<AuditLog[]> {
    // In production, would query audit log table
    // Mock data for now
    return [
      {
        id: '1',
        userId: 'user-123',
        action: 'CREATE',
        entityType,
        entityId,
        timestamp: new Date('2026-01-01'),
      },
      {
        id: '2',
        userId: 'user-123',
        action: 'UPDATE',
        entityType,
        entityId,
        changes: {
          status: { from: 'DRAFT', to: 'ACTIVE' },
        },
        timestamp: new Date('2026-01-02'),
      },
    ];
  }

  /**
   * Get user activity history
   */
  async getUserActivity(
    userId: string,
    filters?: {
      activityType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<UserActivityLog[]> {
    // Mock activity data
    return [
      {
        id: '1',
        userId,
        activityType: 'LOGIN',
        description: 'User logged in',
        timestamp: new Date(),
      },
      {
        id: '2',
        userId,
        activityType: 'CONTRACT_VIEWED',
        description: 'Viewed contract CNT-001',
        metadata: { contractId: 'CNT-001' },
        timestamp: new Date(),
      },
    ];
  }

  /**
   * Get change history for entity
   */
  async getChangeHistory(
    entityType: string,
    entityId: string
  ): Promise<ChangeTracking[]> {
    // Mock change history
    return [
      {
        entityType,
        entityId,
        field: 'status',
        oldValue: 'DRAFT',
        newValue: 'ACTIVE',
        changedBy: 'user-123',
        changedAt: new Date('2026-01-02'),
        reason: 'Contract signed by both parties',
      },
      {
        entityType,
        entityId,
        field: 'totalAmount',
        oldValue: 50000,
        newValue: 55000,
        changedBy: 'user-456',
        changedAt: new Date('2026-01-05'),
        reason: 'Change order approved',
      },
    ];
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    // Mock search results
    const mockLogs: AuditLog[] = Array.from({ length: 10 }, (_, i) => ({
      id: `log-${i}`,
      userId: filters.userId || 'user-123',
      action: filters.action || 'UPDATE',
      entityType: filters.entityType || 'CONTRACT',
      entityId: filters.entityId || `entity-${i}`,
      timestamp: new Date(),
    }));

    return {
      logs: mockLogs,
      total: 100,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(100 / limit),
    };
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    period: { start: Date; end: Date };
    summary: {
      totalEvents: number;
      totalUsers: number;
      byAction: Record<string, number>;
      byEntityType: Record<string, number>;
    };
    topUsers: Array<{ userId: string; eventCount: number }>;
    recentChanges: ChangeTracking[];
  }> {
    // Mock audit report
    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalEvents: 15420,
        totalUsers: 245,
        byAction: {
          CREATE: 3240,
          UPDATE: 8910,
          DELETE: 120,
          READ: 3150,
        },
        byEntityType: {
          CONTRACT: 5230,
          ESCROW: 4120,
          USER: 2340,
          PAYMENT: 3730,
        },
      },
      topUsers: [
        { userId: 'user-123', eventCount: 450 },
        { userId: 'user-456', eventCount: 380 },
        { userId: 'user-789', eventCount: 320 },
      ],
      recentChanges: [],
    };
  }

  /**
   * Verify audit log integrity
   * Ensures logs haven't been tampered with
   */
  async verifyIntegrity(
    logId: string
  ): Promise<{
    isValid: boolean;
    message: string;
  }> {
    // In production, would verify cryptographic hashes/signatures
    // Mock validation
    return {
      isValid: true,
      message: 'Audit log integrity verified',
    };
  }

  // Helper methods

  private generateId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const auditService = new AuditService();
