/**
 * Audit Log Integrity Service
 * Implements cryptographic hash chain for tamper detection
 */

import crypto from 'crypto';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: Date;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface IntegrityData {
  hash: string;
  previousHash: string;
  timestamp: Date;
  signature?: string;
}

export class AuditIntegrityService {
  private algorithm = 'sha256';

  /**
   * Calculate hash for audit log entry
   * Creates tamper-evident hash chain
   */
  calculateHash(entry: AuditLogEntry, previousHash: string): string {
    const data = {
      id: entry.id,
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      timestamp: entry.timestamp.toISOString(),
      changes: entry.changes,
      metadata: entry.metadata,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      previousHash, // Link to previous entry (blockchain-style)
    };

    const dataString = JSON.stringify(data, Object.keys(data).sort());

    return crypto
      .createHash(this.algorithm)
      .update(dataString)
      .digest('hex');
  }

  /**
   * Verify audit log integrity
   * Checks if log has been tampered with
   */
  verifyIntegrity(
    entry: AuditLogEntry,
    storedHash: string,
    previousHash: string
  ): {
    isValid: boolean;
    message: string;
    calculatedHash?: string;
  } {
    try {
      const calculatedHash = this.calculateHash(entry, previousHash);

      if (calculatedHash === storedHash) {
        return {
          isValid: true,
          message: 'Audit log integrity verified',
          calculatedHash,
        };
      } else {
        return {
          isValid: false,
          message: 'Audit log has been tampered with!',
          calculatedHash,
        };
      }
    } catch (error: any) {
      return {
        isValid: false,
        message: `Integrity verification failed: ${error.message}`,
      };
    }
  }

  /**
   * Verify entire audit log chain
   * Ensures no entry has been modified
   */
  verifyChain(entries: Array<AuditLogEntry & IntegrityData>): {
    isValid: boolean;
    brokenAt?: number;
    message: string;
  } {
    if (entries.length === 0) {
      return {
        isValid: true,
        message: 'No entries to verify',
      };
    }

    // First entry should have empty previousHash
    if (entries[0].previousHash !== '') {
      return {
        isValid: false,
        brokenAt: 0,
        message: 'First entry previousHash should be empty',
      };
    }

    // Verify each entry links correctly to previous
    for (let i = 1; i < entries.length; i++) {
      const current = entries[i];
      const previous = entries[i - 1];

      // Verify current entry's previousHash matches previous entry's hash
      if (current.previousHash !== previous.hash) {
        return {
          isValid: false,
          brokenAt: i,
          message: `Chain broken at entry ${i}: previousHash mismatch`,
        };
      }

      // Verify current entry's hash is correct
      const verification = this.verifyIntegrity(
        current,
        current.hash,
        current.previousHash
      );

      if (!verification.isValid) {
        return {
          isValid: false,
          brokenAt: i,
          message: `Chain broken at entry ${i}: ${verification.message}`,
        };
      }
    }

    return {
      isValid: true,
      message: 'Entire audit chain verified',
    };
  }

  /**
   * Sign audit log entry
   * Optional: Add digital signature for extra security
   */
  signEntry(entry: AuditLogEntry, privateKey: string): string {
    const hash = this.calculateHash(entry, '');

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(hash);
    sign.end();

    return sign.sign(privateKey, 'hex');
  }

  /**
   * Verify digital signature
   */
  verifySignature(
    entry: AuditLogEntry,
    signature: string,
    publicKey: string
  ): boolean {
    const hash = this.calculateHash(entry, '');

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(hash);
    verify.end();

    return verify.verify(publicKey, signature, 'hex');
  }

  /**
   * Generate integrity report
   * For auditor review
   */
  generateIntegrityReport(entries: Array<AuditLogEntry & IntegrityData>): {
    totalEntries: number;
    chainValid: boolean;
    firstEntry: Date;
    lastEntry: Date;
    brokenAt?: number;
    details: string;
  } {
    const chainVerification = this.verifyChain(entries);

    return {
      totalEntries: entries.length,
      chainValid: chainVerification.isValid,
      firstEntry: entries[0]?.timestamp || new Date(),
      lastEntry: entries[entries.length - 1]?.timestamp || new Date(),
      brokenAt: chainVerification.brokenAt,
      details: chainVerification.message,
    };
  }

  /**
   * Seal audit log for long-term storage
   * Creates final hash of entire audit period
   */
  sealAuditPeriod(entries: Array<AuditLogEntry & IntegrityData>): {
    periodSeal: string;
    entryCount: number;
    startDate: Date;
    endDate: Date;
    sealedAt: Date;
  } {
    const allHashes = entries.map(e => e.hash).join('');
    const periodSeal = crypto
      .createHash(this.algorithm)
      .update(allHashes)
      .digest('hex');

    return {
      periodSeal,
      entryCount: entries.length,
      startDate: entries[0]?.timestamp || new Date(),
      endDate: entries[entries.length - 1]?.timestamp || new Date(),
      sealedAt: new Date(),
    };
  }
}

export const auditIntegrityService = new AuditIntegrityService();

/**
 * USAGE EXAMPLE:
 * 
 * // When creating audit log:
 * const previousHash = await getLastAuditHash(); // Empty string for first entry
 * const entry: AuditLogEntry = {
 *   id: 'audit-123',
 *   userId: 'user-456',
 *   action: 'UPDATE',
 *   entityType: 'CONTRACT',
 *   entityId: 'contract-789',
 *   timestamp: new Date(),
 *   changes: { status: { from: 'DRAFT', to: 'ACTIVE' } },
 * };
 * 
 * const hash = auditIntegrityService.calculateHash(entry, previousHash);
 * 
 * // Store in database:
 * await prisma.auditLog.create({
 *   data: {
 *     ...entry,
 *     hash,
 *     previousHash,
 *   },
 * });
 * 
 * // To verify:
 * const verification = auditIntegrityService.verifyIntegrity(entry, hash, previousHash);
 * if (!verification.isValid) {
 *   console.error('⚠️ TAMPERING DETECTED!');
 * }
 * 
 * // To verify entire chain:
 * const allEntries = await prisma.auditLog.findMany({ orderBy: { timestamp: 'asc' } });
 * const chainVerification = auditIntegrityService.verifyChain(allEntries);
 * console.log(chainVerification.message);
 */

