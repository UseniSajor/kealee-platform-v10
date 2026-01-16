/**
 * Immutable Audit Log Configuration
 * Configuration for secure audit log storage
 */

export interface AuditLogConfig {
  // Signing key for cryptographic signatures
  signingKey: string;
  
  // Storage configuration
  storage: {
    // Use separate database/table for audit logs
    separateStorage: boolean;
    // Archive old logs (optional)
    archiveAfterDays?: number;
  };
  
  // Security settings
  security: {
    // Hash request/response bodies (don't store plain text)
    hashSensitiveData: boolean;
    // Include request body in hash
    includeRequestBody: boolean;
    // Include response body in hash
    includeResponseBody: boolean;
  };
  
  // Retention policy
  retention: {
    // Keep logs for this many days
    retentionDays: number;
    // Archive instead of delete
    archiveEnabled: boolean;
  };
}

export function getAuditLogConfig(): AuditLogConfig {
  return {
    signingKey: process.env.AUDIT_SIGNING_KEY || (() => {
      console.warn('AUDIT_SIGNING_KEY not set. Using random key (not recommended for production).');
      return require('crypto').randomBytes(32).toString('hex');
    })(),
    storage: {
      separateStorage: process.env.AUDIT_SEPARATE_STORAGE === 'true',
      archiveAfterDays: parseInt(process.env.AUDIT_ARCHIVE_AFTER_DAYS || '365'),
    },
    security: {
      hashSensitiveData: process.env.AUDIT_HASH_SENSITIVE_DATA !== 'false',
      includeRequestBody: process.env.AUDIT_INCLUDE_REQUEST_BODY !== 'false',
      includeResponseBody: process.env.AUDIT_INCLUDE_RESPONSE_BODY === 'true',
    },
    retention: {
      retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '2555'), // 7 years default
      archiveEnabled: process.env.AUDIT_ARCHIVE_ENABLED === 'true',
    },
  };
}

export const auditLogConfig = getAuditLogConfig();
