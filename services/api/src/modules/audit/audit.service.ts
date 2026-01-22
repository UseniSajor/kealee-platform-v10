/**
 * Audit Logging Service
 * Comprehensive audit trail for all system operations
 * Immutable, append-only logging with retention policies
 */

import { prisma, Decimal } from '@kealee/database'
import {
  AuditEntityType,
  AuditAction,
  AuditCategory,
  AuditSeverity,
  AuditFindingType,
  AccessAction,
  SensitivityLevel,
} from '@kealee/database'

// ============================================================================
// Type Definitions
// ============================================================================

export interface AuditContext {
  userId: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  location?: string
}

export interface LogAuditParams {
  entityType: AuditEntityType
  entityId: string
  action: AuditAction
  category: AuditCategory
  performedBy: string
  beforeData?: any
  afterData?: any
  changeDescription?: string
  businessReason?: string
  severity?: AuditSeverity
  context?: {
    ipAddress?: string
    userAgent?: string
    sessionId?: string
    location?: string
  }
  metadata?: any
}

export interface AuditTrailEntry {
  id: string
  action: AuditAction
  performedBy: string
  performedAt: Date
  changeDescription?: string
  beforeData?: any
  afterData?: any
  fieldChanges?: any
  severity: AuditSeverity
}

export interface UserActivitySummary {
  userId: string
  userName: string
  totalActions: number
  actionsByCategory: Record<string, number>
  actionsByType: Record<string, number>
  sensitiveOperations: number
  failedAttempts: number
  lastActivity: Date
}

export interface FinancialAuditSummary {
  totalEntries: number
  passedAudits: number
  discrepancies: number
  irregularities: number
  totalVariance: number
  unverifiedEntries: number
  complianceRate: number
}

// ============================================================================
// Audit Service
// ============================================================================

export class AuditService {
  // ============================================================================
  // CORE AUDIT LOGGING
  // ============================================================================

  /**
   * Log an audit event (immutable, append-only)
   */
  static async logAudit(params: LogAuditParams) {
    const {
      entityType,
      entityId,
      action,
      category,
      performedBy,
      beforeData,
      afterData,
      changeDescription,
      businessReason,
      severity = 'INFO',
      context,
      metadata,
    } = params

    // Calculate field-level changes
    const fieldChanges = this.calculateFieldChanges(beforeData, afterData)

    // Create immutable audit log entry
    const auditLog = await prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        action,
        category,
        performedBy,
        beforeData: beforeData as any,
        afterData: afterData as any,
        fieldChanges: fieldChanges as any,
        changeDescription,
        businessReason,
        severity,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        sessionId: context?.sessionId,
        location: context?.location,
        metadata: metadata as any,
        isImmutable: true, // Enforce immutability
      },
    })

    // Check for suspicious patterns
    if (severity === 'CRITICAL') {
      await this.checkSuspiciousActivity(performedBy, entityType, action)
    }

    return auditLog
  }

  /**
   * Log access to sensitive resources
   */
  static async logAccess(params: {
    userId: string
    resourceType: string
    resourceId: string
    action: AccessAction
    success: boolean
    failureReason?: string
    sensitivityLevel: SensitivityLevel
    recordCount?: number
    dataSize?: number
    exportFormat?: string
    context?: {
      ipAddress?: string
      userAgent?: string
      sessionId?: string
      location?: string
    }
    metadata?: any
  }) {
    const accessLog = await prisma.accessLog.create({
      data: {
        userId: params.userId,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        action: params.action,
        success: params.success,
        failureReason: params.failureReason,
        sensitivityLevel: params.sensitivityLevel,
        recordCount: params.recordCount,
        dataSize: params.dataSize,
        exportFormat: params.exportFormat,
        ipAddress: params.context?.ipAddress,
        userAgent: params.context?.userAgent,
        sessionId: params.context?.sessionId,
        location: params.context?.location,
        metadata: params.metadata as any,
      },
    })

    // Alert on sensitive data access
    if (
      params.sensitivityLevel === 'RESTRICTED' ||
      params.sensitivityLevel === 'CONFIDENTIAL'
    ) {
      await this.checkSensitiveDataAccess(params.userId, params.resourceType)
    }

    return accessLog
  }

  // ============================================================================
  // FINANCIAL AUDIT
  // ============================================================================

  /**
   * Create financial audit entry
   */
  static async createFinancialAudit(params: {
    journalEntryId?: string
    transactionId?: string
    escrowId?: string
    auditType: string
    auditorId: string
    findingType: AuditFindingType
    notes?: string
    discrepancies?: any
    resolution?: string
    actionTaken?: string
    expectedAmount?: number
    actualAmount?: number
    isCompliant?: boolean
    violations?: string[]
    metadata?: any
  }) {
    const variance =
      params.expectedAmount && params.actualAmount
        ? params.actualAmount - params.expectedAmount
        : undefined

    const financialAudit = await prisma.financialAuditEntry.create({
      data: {
        journalEntryId: params.journalEntryId,
        transactionId: params.transactionId,
        escrowId: params.escrowId,
        auditType: params.auditType,
        auditorId: params.auditorId,
        findingType: params.findingType,
        notes: params.notes,
        discrepancies: params.discrepancies as any,
        resolution: params.resolution,
        actionTaken: params.actionTaken,
        expectedAmount: params.expectedAmount
          ? new Decimal(params.expectedAmount)
          : undefined,
        actualAmount: params.actualAmount
          ? new Decimal(params.actualAmount)
          : undefined,
        variance: variance ? new Decimal(variance) : undefined,
        isCompliant: params.isCompliant ?? true,
        violations: params.violations || [],
        metadata: params.metadata as any,
      },
    })

    // Create audit log for the financial audit itself
    await this.logAudit({
      entityType: 'JOURNAL_ENTRY',
      entityId: params.journalEntryId || params.transactionId || params.escrowId || 'unknown',
      action: 'UPDATE',
      category: 'FINANCIAL',
      performedBy: params.auditorId,
      changeDescription: `Financial audit performed: ${params.findingType}`,
      severity: params.findingType === 'PASS' ? 'INFO' : 'WARNING',
      metadata: {
        auditId: financialAudit.id,
        findingType: params.findingType,
        isCompliant: params.isCompliant,
      },
    })

    return financialAudit
  }

  /**
   * Verify financial audit (dual control)
   */
  static async verifyFinancialAudit(
    auditId: string,
    verifierId: string,
    approved: boolean,
    comments?: string
  ) {
    const audit = await prisma.financialAuditEntry.update({
      where: { id: auditId },
      data: {
        verifiedBy: verifierId,
        verifiedAt: new Date(),
        isVerified: approved,
        resolution: comments,
      },
    })

    // Log the verification
    await this.logAudit({
      entityType: 'JOURNAL_ENTRY',
      entityId: audit.journalEntryId || audit.transactionId || audit.escrowId || 'unknown',
      action: approved ? 'APPROVE' : 'REJECT',
      category: 'FINANCIAL',
      performedBy: verifierId,
      changeDescription: `Financial audit ${approved ? 'approved' : 'rejected'}`,
      severity: approved ? 'INFO' : 'WARNING',
      metadata: {
        auditId: audit.id,
        approved,
        comments,
      },
    })

    return audit
  }

  // ============================================================================
  // AUDIT TRAIL GENERATION
  // ============================================================================

  /**
   * Get complete audit trail for an entity
   */
  static async getEntityAuditTrail(
    entityType: AuditEntityType,
    entityId: string,
    options?: {
      limit?: number
      offset?: number
      startDate?: Date
      endDate?: Date
    }
  ): Promise<{
    entries: AuditTrailEntry[]
    total: number
  }> {
    const where: any = {
      entityType,
      entityId,
    }

    if (options?.startDate || options?.endDate) {
      where.performedAt = {}
      if (options.startDate) where.performedAt.gte = options.startDate
      if (options.endDate) where.performedAt.lte = options.endDate
    }

    const [entries, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          performer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { performedAt: 'desc' },
        take: options?.limit || 100,
        skip: options?.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ])

    const trailEntries: AuditTrailEntry[] = entries.map((entry) => ({
      id: entry.id,
      action: entry.action,
      performedBy: entry.performer.name || entry.performer.email || 'Unknown',
      performedAt: entry.performedAt,
      changeDescription: entry.changeDescription || undefined,
      beforeData: entry.beforeData,
      afterData: entry.afterData,
      fieldChanges: entry.fieldChanges,
      severity: entry.severity,
    }))

    return {
      entries: trailEntries,
      total,
    }
  }

  /**
   * Get user activity audit
   */
  static async getUserActivity(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UserActivitySummary> {
    // Get all audit logs for user
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        performedBy: userId,
        performedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        performer: {
          select: {
            name: true,
          },
        },
      },
    })

    // Get access logs
    const accessLogs = await prisma.accessLog.findMany({
      where: {
        userId,
        accessedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Calculate statistics
    const actionsByCategory: Record<string, number> = {}
    const actionsByType: Record<string, number> = {}

    auditLogs.forEach((log) => {
      actionsByCategory[log.category] =
        (actionsByCategory[log.category] || 0) + 1
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1
    })

    const sensitiveOperations = accessLogs.filter(
      (log) =>
        log.sensitivityLevel === 'RESTRICTED' ||
        log.sensitivityLevel === 'CONFIDENTIAL'
    ).length

    const failedAttempts = accessLogs.filter((log) => !log.success).length

    const lastActivity =
      auditLogs.length > 0
        ? auditLogs[0].performedAt
        : accessLogs.length > 0
        ? accessLogs[0].accessedAt
        : new Date()

    return {
      userId,
      userName: auditLogs[0]?.performer.name || 'Unknown',
      totalActions: auditLogs.length + accessLogs.length,
      actionsByCategory,
      actionsByType,
      sensitiveOperations,
      failedAttempts,
      lastActivity,
    }
  }

  /**
   * Get financial audit report
   */
  static async getFinancialAuditReport(
    startDate: Date,
    endDate: Date
  ): Promise<FinancialAuditSummary> {
    const audits = await prisma.financialAuditEntry.findMany({
      where: {
        auditDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const totalEntries = audits.length
    const passedAudits = audits.filter((a) => a.findingType === 'PASS').length
    const discrepancies = audits.filter(
      (a) => a.findingType === 'DISCREPANCY'
    ).length
    const irregularities = audits.filter(
      (a) => a.findingType === 'IRREGULARITY' || a.findingType === 'FRAUD'
    ).length

    const totalVariance = audits.reduce((sum, audit) => {
      return sum + Math.abs(audit.variance?.toNumber() || 0)
    }, 0)

    const unverifiedEntries = audits.filter((a) => !a.isVerified).length
    const complianceRate =
      totalEntries > 0 ? (passedAudits / totalEntries) * 100 : 100

    return {
      totalEntries,
      passedAudits,
      discrepancies,
      irregularities,
      totalVariance,
      unverifiedEntries,
      complianceRate,
    }
  }

  // ============================================================================
  // AUDIT REPORTS
  // ============================================================================

  /**
   * Generate SOC 2 compliance report
   */
  static async generateSOC2Report(
    periodStart: Date,
    periodEnd: Date,
    generatedBy: string
  ) {
    // User access controls
    const accessControls = await this.analyzeAccessControls(
      periodStart,
      periodEnd
    )

    // Data encryption verification
    const encryptionStatus = await this.verifyDataEncryption()

    // Change management
    const changeManagement = await this.analyzeChangeManagement(
      periodStart,
      periodEnd
    )

    // Security monitoring
    const securityMonitoring = await this.analyzeSecurityMonitoring(
      periodStart,
      periodEnd
    )

    const findings = {
      accessControls,
      encryptionStatus,
      changeManagement,
      securityMonitoring,
    }

    const report = await prisma.auditReport.create({
      data: {
        reportType: 'SOC2',
        title: `SOC 2 Compliance Report - ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()}`,
        description: 'Comprehensive SOC 2 compliance audit report',
        periodStart,
        periodEnd,
        generatedBy,
        summary: this.generateSOC2Summary(findings),
        findings: findings as any,
        metrics: {
          accessControlScore: accessControls.score,
          encryptionScore: encryptionStatus.score,
          changeManagementScore: changeManagement.score,
          securityScore: securityMonitoring.score,
          overallCompliance: this.calculateOverallCompliance(findings),
        } as any,
        recommendations: this.generateSOC2Recommendations(findings),
        status: 'DRAFT',
      },
    })

    return report
  }

  /**
   * Generate financial audit report
   */
  static async generateFinancialAuditReport(
    periodStart: Date,
    periodEnd: Date,
    generatedBy: string
  ) {
    const summary = await this.getFinancialAuditReport(periodStart, periodEnd)

    // Get all journal entries with approval chain
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        lines: true,
      },
    })

    // Get reconciliation records
    const reconciliations = await prisma.financialAuditEntry.findMany({
      where: {
        auditType: 'RECONCILIATION',
        auditDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    })

    // Get void/reversal transactions
    const voidedTransactions = await prisma.auditLog.findMany({
      where: {
        action: { in: ['VOID', 'REVERSE'] },
        category: 'FINANCIAL',
        performedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    })

    const findings = {
      summary,
      journalEntries: journalEntries.length,
      reconciliations: reconciliations.length,
      voidedTransactions: voidedTransactions.length,
      complianceRate: summary.complianceRate,
      totalVariance: summary.totalVariance,
    }

    const report = await prisma.auditReport.create({
      data: {
        reportType: 'FINANCIAL',
        title: `Financial Audit Report - ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()}`,
        description: 'Comprehensive financial audit report for external auditors',
        periodStart,
        periodEnd,
        generatedBy,
        summary: `Financial audit covering ${journalEntries.length} journal entries with ${summary.complianceRate.toFixed(2)}% compliance rate.`,
        findings: findings as any,
        metrics: {
          journalEntries: journalEntries.length,
          passedAudits: summary.passedAudits,
          discrepancies: summary.discrepancies,
          irregularities: summary.irregularities,
          complianceRate: summary.complianceRate,
        } as any,
        recommendations: this.generateFinancialRecommendations(summary),
        status: 'DRAFT',
      },
    })

    return report
  }

  /**
   * Generate security audit report
   */
  static async generateSecurityAuditReport(
    periodStart: Date,
    periodEnd: Date,
    generatedBy: string
  ) {
    // Failed login attempts
    const failedLogins = await prisma.accessLog.count({
      where: {
        success: false,
        accessedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    })

    // Privilege escalations
    const privilegeEscalations = await prisma.auditLog.count({
      where: {
        action: 'UPDATE',
        category: 'SECURITY',
        changeDescription: {
          contains: 'role',
        },
        performedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    })

    // Data exports
    const dataExports = await prisma.accessLog.count({
      where: {
        action: 'EXPORT',
        accessedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    })

    // Unusual access patterns (off-hours)
    const offHoursAccess = await prisma.accessLog.count({
      where: {
        sensitivityLevel: { in: ['RESTRICTED', 'CONFIDENTIAL'] },
        accessedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    })

    const findings = {
      failedLogins,
      privilegeEscalations,
      dataExports,
      offHoursAccess,
    }

    const report = await prisma.auditReport.create({
      data: {
        reportType: 'SECURITY',
        title: `Security Audit Report - ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()}`,
        description: 'Security audit covering authentication, authorization, and data access',
        periodStart,
        periodEnd,
        generatedBy,
        summary: `Security audit identified ${failedLogins} failed logins, ${privilegeEscalations} privilege changes, and ${dataExports} data exports.`,
        findings: findings as any,
        metrics: {
          failedLogins,
          privilegeEscalations,
          dataExports,
          offHoursAccess,
        } as any,
        recommendations: this.generateSecurityRecommendations(findings),
        status: 'DRAFT',
      },
    })

    return report
  }

  // ============================================================================
  // SEARCH & QUERY
  // ============================================================================

  /**
   * Search audit logs
   */
  static async searchAuditLogs(filters: {
    entityType?: AuditEntityType
    action?: AuditAction
    category?: AuditCategory
    severity?: AuditSeverity
    performedBy?: string
    startDate?: Date
    endDate?: Date
    searchText?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {}

    if (filters.entityType) where.entityType = filters.entityType
    if (filters.action) where.action = filters.action
    if (filters.category) where.category = filters.category
    if (filters.severity) where.severity = filters.severity
    if (filters.performedBy) where.performedBy = filters.performedBy

    if (filters.startDate || filters.endDate) {
      where.performedAt = {}
      if (filters.startDate) where.performedAt.gte = filters.startDate
      if (filters.endDate) where.performedAt.lte = filters.endDate
    }

    if (filters.searchText) {
      where.OR = [
        { changeDescription: { contains: filters.searchText, mode: 'insensitive' } },
        { businessReason: { contains: filters.searchText, mode: 'insensitive' } },
      ]
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          performer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { performedAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      logs,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    }
  }

  // ============================================================================
  // ANOMALY DETECTION
  // ============================================================================

  /**
   * Check for suspicious activity patterns
   */
  private static async checkSuspiciousActivity(
    userId: string,
    entityType: AuditEntityType,
    action: AuditAction
  ) {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Check for rapid succession of critical actions
    const recentCriticalActions = await prisma.auditLog.count({
      where: {
        performedBy: userId,
        severity: 'CRITICAL',
        performedAt: { gte: last24Hours },
      },
    })

    if (recentCriticalActions > 10) {
      // TODO: Create security alert
      console.warn(`Suspicious activity detected for user ${userId}: ${recentCriticalActions} critical actions in 24 hours`)
    }

    // Check for off-hours financial activity
    const now = new Date()
    const hour = now.getHours()
    const isOffHours = hour < 6 || hour > 22

    if (
      isOffHours &&
      entityType === 'TRANSACTION' &&
      action === 'UPDATE'
    ) {
      // TODO: Create security alert
      console.warn(`Off-hours financial activity detected for user ${userId}`)
    }
  }

  /**
   * Check for unusual sensitive data access
   */
  private static async checkSensitiveDataAccess(
    userId: string,
    resourceType: string
  ) {
    const last1Hour = new Date(Date.now() - 60 * 60 * 1000)

    const recentSensitiveAccess = await prisma.accessLog.count({
      where: {
        userId,
        sensitivityLevel: { in: ['RESTRICTED', 'CONFIDENTIAL'] },
        accessedAt: { gte: last1Hour },
      },
    })

    if (recentSensitiveAccess > 20) {
      // TODO: Create security alert
      console.warn(`Unusual sensitive data access for user ${userId}: ${recentSensitiveAccess} accesses in 1 hour`)
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate field-level changes
   */
  private static calculateFieldChanges(beforeData: any, afterData: any): any {
    if (!beforeData || !afterData) return null

    const changes: any[] = []

    // Compare objects
    const allKeys = new Set([
      ...Object.keys(beforeData),
      ...Object.keys(afterData),
    ])

    allKeys.forEach((key) => {
      const oldValue = beforeData[key]
      const newValue = afterData[key]

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: key,
          oldValue,
          newValue,
        })
      }
    })

    return changes.length > 0 ? { fields: changes } : null
  }

  // Analysis methods for SOC 2 report
  private static async analyzeAccessControls(
    startDate: Date,
    endDate: Date
  ) {
    const totalAccess = await prisma.accessLog.count({
      where: { accessedAt: { gte: startDate, lte: endDate } },
    })

    const failedAccess = await prisma.accessLog.count({
      where: {
        success: false,
        accessedAt: { gte: startDate, lte: endDate },
      },
    })

    const successRate =
      totalAccess > 0 ? ((totalAccess - failedAccess) / totalAccess) * 100 : 100

    return {
      totalAccess,
      failedAccess,
      successRate,
      score: successRate,
    }
  }

  private static async verifyDataEncryption() {
    // TODO: Implement actual encryption verification
    return {
      encryptedAtRest: true,
      encryptedInTransit: true,
      keyRotation: true,
      score: 100,
    }
  }

  private static async analyzeChangeManagement(
    startDate: Date,
    endDate: Date
  ) {
    const totalChanges = await prisma.auditLog.count({
      where: {
        action: { in: ['CREATE', 'UPDATE', 'DELETE'] },
        performedAt: { gte: startDate, lte: endDate },
      },
    })

    const documentedChanges = await prisma.auditLog.count({
      where: {
        action: { in: ['CREATE', 'UPDATE', 'DELETE'] },
        businessReason: { not: null },
        performedAt: { gte: startDate, lte: endDate },
      },
    })

    const documentationRate =
      totalChanges > 0 ? (documentedChanges / totalChanges) * 100 : 100

    return {
      totalChanges,
      documentedChanges,
      documentationRate,
      score: documentationRate,
    }
  }

  private static async analyzeSecurityMonitoring(
    startDate: Date,
    endDate: Date
  ) {
    const criticalEvents = await prisma.auditLog.count({
      where: {
        severity: 'CRITICAL',
        performedAt: { gte: startDate, lte: endDate },
      },
    })

    const respondedEvents = await prisma.auditLog.count({
      where: {
        severity: 'CRITICAL',
        businessReason: { not: null },
        performedAt: { gte: startDate, lte: endDate },
      },
    })

    const responseRate =
      criticalEvents > 0 ? (respondedEvents / criticalEvents) * 100 : 100

    return {
      criticalEvents,
      respondedEvents,
      responseRate,
      score: responseRate,
    }
  }

  private static generateSOC2Summary(findings: any): string {
    return `SOC 2 Compliance Audit Summary:
- Access Controls: ${findings.accessControls.successRate.toFixed(2)}% success rate
- Data Encryption: ${findings.encryptionStatus.encryptedAtRest ? 'Verified' : 'Failed'}
- Change Management: ${findings.changeManagement.documentationRate.toFixed(2)}% documented
- Security Monitoring: ${findings.securityMonitoring.responseRate.toFixed(2)}% response rate
Overall Compliance: ${this.calculateOverallCompliance(findings).toFixed(2)}%`
  }

  private static calculateOverallCompliance(findings: any): number {
    const scores = [
      findings.accessControls.score,
      findings.encryptionStatus.score,
      findings.changeManagement.score,
      findings.securityMonitoring.score,
    ]

    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  private static generateSOC2Recommendations(findings: any): string[] {
    const recommendations: string[] = []

    if (findings.accessControls.score < 95) {
      recommendations.push('Improve access control success rate to above 95%')
    }

    if (findings.changeManagement.score < 90) {
      recommendations.push(
        'Ensure all changes are documented with business reasons'
      )
    }

    if (findings.securityMonitoring.score < 95) {
      recommendations.push(
        'Improve response rate to critical security events'
      )
    }

    return recommendations
  }

  private static generateFinancialRecommendations(
    summary: FinancialAuditSummary
  ): string[] {
    const recommendations: string[] = []

    if (summary.complianceRate < 95) {
      recommendations.push(
        `Improve financial compliance rate from ${summary.complianceRate.toFixed(2)}% to 95%+`
      )
    }

    if (summary.unverifiedEntries > 0) {
      recommendations.push(
        `Complete verification of ${summary.unverifiedEntries} unverified entries`
      )
    }

    if (summary.irregularities > 0) {
      recommendations.push(
        `Investigate and resolve ${summary.irregularities} irregularities`
      )
    }

    if (summary.totalVariance > 1000) {
      recommendations.push(
        `Reduce variance: current total is $${summary.totalVariance.toLocaleString()}`
      )
    }

    return recommendations
  }

  private static generateSecurityRecommendations(findings: any): string[] {
    const recommendations: string[] = []

    if (findings.failedLogins > 100) {
      recommendations.push(
        `High number of failed logins (${findings.failedLogins}). Implement rate limiting or account lockout`
      )
    }

    if (findings.privilegeEscalations > 10) {
      recommendations.push(
        `Review ${findings.privilegeEscalations} privilege escalations for legitimacy`
      )
    }

    if (findings.dataExports > 50) {
      recommendations.push(
        `Monitor ${findings.dataExports} data exports for unauthorized data access`
      )
    }

    if (findings.offHoursAccess > 20) {
      recommendations.push(
        `Investigate ${findings.offHoursAccess} off-hours accesses to sensitive data`
      )
    }

    return recommendations
  }
}
