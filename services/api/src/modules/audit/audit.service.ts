import { prismaAny } from '../../utils/prisma-helper'

export interface CreateAuditData {
  action: string
  entityType: string
  entityId: string
  userId: string
  reason?: string
  before?: any
  after?: any
  ipAddress?: string
  userAgent?: string
}

// List of privileged actions that require a reason
const PRIVILEGED_ACTIONS = [
  'DELETE_PROJECT',
  'DELETE_ORG',
  'SUSPEND_USER',
  'DELETE_USER',
  'APPROVE_MILESTONE',
  'REJECT_MILESTONE',
  'RELEASE_ESCROW',
  'FREEZE_ESCROW',
  'DISABLE_MODULE',
  'CHANGE_ROLE',
]

export class AuditService {
  // Record an audit log entry (append-only)
  async recordAudit(data: CreateAuditData) {
    // Check if action requires a reason
    if (PRIVILEGED_ACTIONS.includes(data.action) && !data.reason) {
      throw new Error(
        `Reason is required for privileged action: ${data.action}`
      )
    }

    const auditLog = await prismaAny.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        reason: data.reason,
        before: data.before || null,
        after: data.after || null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })

    return auditLog
  }

  // Get audit log by ID
  async getAuditById(auditId: string) {
    const auditLog = await prismaAny.auditLog.findUnique({
      where: { id: auditId },
    })

    if (!auditLog) {
      throw new Error('Audit log not found')
    }

    return auditLog
  }

  // Get audit logs with filtering
  async getAuditLogs(filters: {
    action?: string
    entityType?: string
    entityId?: string
    userId?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }) {
    const page = filters.page || 1
    const limit = filters.limit || 50
    const skip = (page - 1) * limit

    const where: any = {}

    if (filters.action) {
      where.action = filters.action
    }

    if (filters.entityType) {
      where.entityType = filters.entityType
    }

    if (filters.entityId) {
      where.entityId = filters.entityId
    }

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    const [auditLogs, total] = await Promise.all([
      prismaAny.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prismaAny.auditLog.count({ where }),
    ])

    return {
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // Get audit trail for a specific entity
  async getEntityAuditTrail(entityType: string, entityId: string) {
    const auditLogs = await prismaAny.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'asc' },
    })

    return auditLogs
  }

  // Get audit logs for a user
  async getUserAuditLogs(userId: string, limit?: number) {
    const auditLogs = await prismaAny.auditLog.findMany({
      where: { userId },
      take: limit || 100,
      orderBy: { createdAt: 'desc' },
    })

    return auditLogs
  }

  // Get audit logs by action
  async getAuditLogsByAction(action: string, limit?: number) {
    const auditLogs = await prismaAny.auditLog.findMany({
      where: { action },
      take: limit || 100,
      orderBy: { createdAt: 'desc' },
    })

    return auditLogs
  }

  // Get privileged actions (actions that require reason)
  async getPrivilegedActions(filters?: {
    userId?: string
    startDate?: Date
    endDate?: Date
  }) {
    const where: any = {
      action: {
        in: PRIVILEGED_ACTIONS,
      },
    }

    if (filters?.userId) {
      where.userId = filters.userId
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    const auditLogs = await prismaAny.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return auditLogs
  }

  // Get audit statistics
  async getAuditStats(filters?: {
    userId?: string
    startDate?: Date
    endDate?: Date
  }) {
    const where: any = {}

    if (filters?.userId) {
      where.userId = filters.userId
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    const [totalAudits, auditsByAction, privilegedCount] = await Promise.all([
      prismaAny.auditLog.count({ where }),
      prismaAny.auditLog.groupBy({
        by: ['action'],
        where,
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 10,
      }),
      prismaAny.auditLog.count({
        where: {
          ...where,
          action: {
            in: PRIVILEGED_ACTIONS,
          },
        },
      }),
    ])

    return {
      totalAudits,
      auditsByAction: auditsByAction.map((a: any) => ({
        action: a.action,
        count: a._count.action,
      })),
      privilegedActionsCount: privilegedCount,
    }
  }

  // Check if action is privileged
  isPrivilegedAction(action: string): boolean {
    return PRIVILEGED_ACTIONS.includes(action)
  }
}

export const auditService = new AuditService()

// Helper function to easily log audits
export async function logAudit(data: CreateAuditData) {
  return auditService.recordAudit(data)
}
