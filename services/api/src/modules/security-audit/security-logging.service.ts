/**
 * Security Event Logging Service
 * Centralized logging for security-related events
 */

import { FastifyRequest } from 'fastify';

import { prismaAny as prisma } from '../../utils/prisma-helper';

export enum SecurityEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  
  // 2FA Events
  TWO_FA_ENABLED = 'TWO_FA_ENABLED',
  TWO_FA_DISABLED = 'TWO_FA_DISABLED',
  TWO_FA_SUCCESS = 'TWO_FA_SUCCESS',
  TWO_FA_FAILED = 'TWO_FA_FAILED',
  BACKUP_CODE_USED = 'BACKUP_CODE_USED',
  
  // Authorization Events
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  
  // Account Events
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_BLOCKED = 'ACCOUNT_BLOCKED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  
  // Session Events
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',
  
  // Financial Events
  ESCROW_CREATED = 'ESCROW_CREATED',
  DEPOSIT_INITIATED = 'DEPOSIT_INITIATED',
  PAYMENT_RELEASED = 'PAYMENT_RELEASED',
  ESCROW_FROZEN = 'ESCROW_FROZEN',
  ESCROW_UNFROZEN = 'ESCROW_UNFROZEN',
  
  // Security Threats
  MALICIOUS_INPUT_DETECTED = 'MALICIOUS_INPUT_DETECTED',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  
  // Admin Actions
  ADMIN_OVERRIDE = 'ADMIN_OVERRIDE',
  USER_IMPERSONATION = 'USER_IMPERSONATION',
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED',
  
  // Compliance Events
  OFAC_SCREENING_MATCH = 'OFAC_SCREENING_MATCH',
  COMPLIANCE_CHECK_FAILED = 'COMPLIANCE_CHECK_FAILED',
  AUDIT_LOG_ACCESSED = 'AUDIT_LOG_ACCESSED',
}

export enum SecurityEventSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface SecurityEventData {
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  result?: 'SUCCESS' | 'FAILURE';
  metadata?: Record<string, any>;
  message?: string;
}

/**
 * Log security event
 */
export async function logSecurityEvent(data: SecurityEventData): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        eventType: data.type,
        type: data.type,
        severity: data.severity,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        resource: data.resource,
        action: data.action,
        result: data.result,
        metadata: data.metadata || {},
        description: data.message || `${data.type} - ${data.action || 'unknown'}`,
        timestamp: new Date(),
      },
    });

    // Send critical alerts immediately
    if (data.severity === SecurityEventSeverity.CRITICAL) {
      await sendSecurityAlert(data);
    }
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't throw error to prevent disrupting main flow
  }
}

/**
 * Extract request metadata for logging
 */
export function extractRequestMetadata(request: FastifyRequest): {
  ipAddress: string;
  userAgent: string;
  userId?: string;
} {
  const ipAddress = 
    (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (request.headers['x-real-ip'] as string) ||
    request.ip ||
    'unknown';

  const userAgent = request.headers['user-agent'] || 'unknown';

  const userId = (request as any).user?.id;

  return { ipAddress, userAgent, userId };
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  type: SecurityEventType,
  request: FastifyRequest,
  result: 'SUCCESS' | 'FAILURE',
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const { ipAddress, userAgent } = extractRequestMetadata(request);

  await logSecurityEvent({
    type,
    severity: result === 'FAILURE' ? SecurityEventSeverity.WARNING : SecurityEventSeverity.INFO,
    userId,
    ipAddress,
    userAgent,
    action: 'AUTHENTICATION',
    result,
    metadata,
  });
}

/**
 * Log authorization failure
 */
export async function logAuthorizationFailure(
  request: FastifyRequest,
  resource: string,
  requiredPermission: string
): Promise<void> {
  const { ipAddress, userAgent, userId } = extractRequestMetadata(request);

  await logSecurityEvent({
    type: SecurityEventType.PERMISSION_DENIED,
    severity: SecurityEventSeverity.WARNING,
    userId,
    ipAddress,
    userAgent,
    resource,
    action: 'ACCESS_DENIED',
    result: 'FAILURE',
    metadata: { requiredPermission },
    message: `Access denied to ${resource} - missing permission: ${requiredPermission}`,
  });
}

/**
 * Log security threat
 */
export async function logSecurityThreat(
  type: SecurityEventType,
  request: FastifyRequest,
  details: string,
  metadata?: Record<string, any>
): Promise<void> {
  const { ipAddress, userAgent, userId } = extractRequestMetadata(request);

  await logSecurityEvent({
    type,
    severity: SecurityEventSeverity.CRITICAL,
    userId,
    ipAddress,
    userAgent,
    action: 'SECURITY_THREAT',
    result: 'FAILURE',
    metadata: {
      ...metadata,
      requestPath: request.url,
      requestMethod: request.method,
    },
    message: details,
  });
}

/**
 * Log financial event
 */
export async function logFinancialEvent(
  type: SecurityEventType,
  userId: string,
  resource: string,
  amount: number,
  metadata?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    type,
    severity: SecurityEventSeverity.INFO,
    userId,
    resource,
    action: 'FINANCIAL_OPERATION',
    result: 'SUCCESS',
    metadata: {
      ...metadata,
      amount,
    },
  });
}

/**
 * Log admin action
 */
export async function logAdminAction(
  type: SecurityEventType,
  adminUserId: string,
  action: string,
  targetUserId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    type,
    severity: SecurityEventSeverity.WARNING, // Admin actions should be monitored
    userId: adminUserId,
    action,
    result: 'SUCCESS',
    metadata: {
      ...metadata,
      targetUserId,
    },
  });
}

/**
 * Get security events for user
 */
export async function getUserSecurityEvents(
  userId: string,
  limit: number = 100
) {
  return await prisma.securityEvent.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

/**
 * Get recent security threats
 */
export async function getRecentSecurityThreats(hours: number = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  return await prisma.securityEvent.findMany({
    where: {
      severity: SecurityEventSeverity.CRITICAL,
      timestamp: { gte: since },
    },
    orderBy: { timestamp: 'desc' },
  });
}

/**
 * Get failed login attempts for IP
 */
export async function getFailedLoginAttempts(
  ipAddress: string,
  minutes: number = 15
): Promise<number> {
  const since = new Date(Date.now() - minutes * 60 * 1000);

  return await prisma.securityEvent.count({
    where: {
      type: SecurityEventType.LOGIN_FAILED,
      ipAddress,
      timestamp: { gte: since },
    },
  });
}

/**
 * Send security alert (integrate with your alerting system)
 */
async function sendSecurityAlert(data: SecurityEventData): Promise<void> {
  // TODO: Integrate with alerting system (Slack, PagerDuty, email, etc.)
  console.error('🚨 CRITICAL SECURITY EVENT:', {
    type: data.type,
    userId: data.userId,
    ipAddress: data.ipAddress,
    message: data.message,
    metadata: data.metadata,
  });

  // Example: Send to Slack webhook
  // await fetch(process.env.SLACK_SECURITY_WEBHOOK_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     text: `🚨 Critical Security Event: ${data.type}`,
  //     blocks: [
  //       {
  //         type: 'section',
  //         text: { type: 'mrkdwn', text: data.message || 'No message' },
  //       },
  //     ],
  //   }),
  // });
}

/**
 * Clean up old security events (run as cron job)
 */
export async function cleanupOldSecurityEvents(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  const result = await prisma.securityEvent.deleteMany({
    where: {
      timestamp: { lt: cutoffDate },
      // Keep critical events longer
      severity: { not: SecurityEventSeverity.CRITICAL },
    },
  });

  return result.count;
}

