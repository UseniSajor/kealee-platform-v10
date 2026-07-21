/**
 * Immutable Audit Logging Service
 * Writes audit logs to immutable storage (append-only)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { getSupabaseClient } from '../../utils/supabase-client';

export interface ImmutableAuditLog {
  id: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  apiKeyId?: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  statusCode: number;
  requestHash: string; // Hash of request body (not stored in plain text)
  responseHash?: string; // Hash of response body
  jurisdictionId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  signature: string; // Cryptographic signature for integrity
  previousHash?: string; // Chain hash for immutability
}

export class ImmutableAuditService {
  private _supabase?: SupabaseClient;
  private secretKey: string;

  private get supabase(): SupabaseClient {
    if (!this._supabase) {
      this._supabase = getSupabaseClient();
    }
    return this._supabase;
  }

  constructor() {
    // Use environment variable for signing key
    this.secretKey = process.env.AUDIT_SIGNING_KEY || crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create cryptographic signature for audit log
   */
  private createSignature(log: Omit<ImmutableAuditLog, 'signature' | 'id'>): string {
    const data = JSON.stringify({
      eventType: log.eventType,
      severity: log.severity,
      userId: log.userId,
      apiKeyId: log.apiKeyId,
      ipAddress: log.ipAddress,
      endpoint: log.endpoint,
      method: log.method,
      statusCode: log.statusCode,
      timestamp: log.timestamp.toISOString(),
      previousHash: log.previousHash,
    });

    return crypto
      .createHmac('sha256', this.secretKey)
      .update(data)
      .digest('hex');
  }

  /**
   * Get previous log hash for chaining
   */
  private async getPreviousHash(apiKeyId?: string): Promise<string | undefined> {
    let query = this.supabase
      .from('SecurityAuditLog')
      .select('signature, timestamp')
      .order('timestamp', {ascending: false})
      .limit(1);

    if (apiKeyId) {
      query = query.eq('apiKeyId', apiKeyId);
    }

    const {data} = await query;
    if (data && data.length > 0) {
      // Use signature as previous hash for chaining
      return data[0].signature;
    }
    return undefined;
  }

  /**
   * Hash sensitive data (request/response bodies)
   */
  private hashData(data: any): string {
    const json = JSON.stringify(data);
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  /**
   * Write immutable audit log
   */
  async writeAuditLog(log: Omit<ImmutableAuditLog, 'id' | 'signature' | 'previousHash' | 'requestHash'> & {
    requestBody?: any;
    responseBody?: any;
  }): Promise<ImmutableAuditLog> {
    // Get previous hash for chaining
    const previousHash = await this.getPreviousHash(log.apiKeyId);

    // Hash sensitive data
    const requestHash = log.requestBody ? this.hashData(log.requestBody) : '';
    const responseHash = log.responseBody ? this.hashData(log.responseBody) : '';

    // Create immutable log entry
    const immutableLog: Omit<ImmutableAuditLog, 'id' | 'signature'> = {
      ...log,
      requestHash,
      responseHash,
      previousHash,
      timestamp: log.timestamp || new Date(),
    };

    // Create signature
    const signature = this.createSignature(immutableLog);

    // Insert into database (with write-only permissions in production)
    const {data, error} = await this.supabase
      .from('SecurityAuditLog')
      .insert({
        ...immutableLog,
        signature,
        requestBody: null, // Don't store sensitive data
        responseBody: null, // Don't store sensitive data
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      signature,
      previousHash,
      requestHash,
      responseHash,
    } as ImmutableAuditLog;
  }

  /**
   * Verify audit log integrity
   */
  async verifyLogIntegrity(logId: string): Promise<boolean> {
    const {data, error} = await this.supabase
      .from('SecurityAuditLog')
      .select('*')
      .eq('id', logId)
      .single();

    if (error || !data) return false;

    // Recreate signature and compare
    const logData: Omit<ImmutableAuditLog, 'signature' | 'id'> = {
      eventType: data.eventType,
      severity: data.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      userId: data.userId,
      apiKeyId: data.apiKeyId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent || '',
      endpoint: data.endpoint,
      method: data.method,
      statusCode: data.statusCode,
      requestHash: data.requestHash || '',
      responseHash: data.responseHash,
      jurisdictionId: data.jurisdictionId,
      organizationId: data.organizationId,
      metadata: data.metadata,
      timestamp: new Date(data.timestamp),
      previousHash: data.previousHash,
    };
    const expectedSignature = this.createSignature(logData);

    return crypto.timingSafeEqual(
      Buffer.from(data.signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Verify audit log chain integrity
   */
  async verifyChainIntegrity(apiKeyId?: string, limit: number = 100): Promise<{
    valid: boolean;
    invalidLogs: string[];
  }> {
    let query = this.supabase
      .from('SecurityAuditLog')
      .select('*')
      .order('timestamp', {ascending: true})
      .limit(limit);

    if (apiKeyId) {
      query = query.eq('apiKeyId', apiKeyId);
    }

    const {data} = await query;
    if (!data || data.length === 0) {
      return {valid: true, invalidLogs: []};
    }

    const invalidLogs: string[] = [];
    let previousHash: string | undefined;

    for (const log of data) {
      // Verify signature
      const isValid = await this.verifyLogIntegrity(log.id);
      if (!isValid) {
        invalidLogs.push(log.id);
      }

      // Verify chain
      if (previousHash && log.previousHash !== previousHash) {
        invalidLogs.push(log.id);
      }

      previousHash = log.signature;
    }

    return {
      valid: invalidLogs.length === 0,
      invalidLogs,
    };
  }
}

export const immutableAuditService = new ImmutableAuditService();
