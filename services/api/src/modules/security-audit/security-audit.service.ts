/**
 * Security Audit Logging Service
 * Comprehensive security audit logging for API access
 */

import {createClient} from '@supabase/supabase-js';

export interface SecurityAuditLog {
  id: string;
  eventType: 'API_ACCESS' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_ACCESS' | 'CONFIG_CHANGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  apiKeyId?: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  statusCode: number;
  requestBody?: any;
  responseBody?: any;
  jurisdictionId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export class SecurityAuditService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * Log security event
   */
  async logEvent(log: SecurityAuditLog): Promise<void> {
    await this.supabase.from('SecurityAuditLog').insert({
      eventType: log.eventType,
      severity: log.severity,
      userId: log.userId,
      apiKeyId: log.apiKeyId,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      endpoint: log.endpoint,
      method: log.method,
      statusCode: log.statusCode,
      requestBody: log.requestBody,
      responseBody: log.responseBody,
      jurisdictionId: log.jurisdictionId,
      organizationId: log.organizationId,
      metadata: log.metadata,
      timestamp: log.timestamp.toISOString(),
    });
  }

  /**
   * Query audit logs
   */
  async queryAuditLogs(filters: {
    eventType?: string;
    severity?: string;
    userId?: string;
    apiKeyId?: string;
    jurisdictionId?: string;
    organizationId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<SecurityAuditLog[]> {
    let query = this.supabase.from('SecurityAuditLog').select('*');

    if (filters.eventType) {
      query = query.eq('eventType', filters.eventType);
    }
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.userId) {
      query = query.eq('userId', filters.userId);
    }
    if (filters.apiKeyId) {
      query = query.eq('apiKeyId', filters.apiKeyId);
    }
    if (filters.jurisdictionId) {
      query = query.eq('jurisdictionId', filters.jurisdictionId);
    }
    if (filters.organizationId) {
      query = query.eq('organizationId', filters.organizationId);
    }
    if (filters.startDate) {
      query = query.gte('timestamp', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query = query.lte('timestamp', filters.endDate.toISOString());
    }

    query = query
      .order('timestamp', {ascending: false})
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1);

    const {data} = await query;
    return (data || []) as SecurityAuditLog[];
  }
}

export const securityAuditService = new SecurityAuditService();
