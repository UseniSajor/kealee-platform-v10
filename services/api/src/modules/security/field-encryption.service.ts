/**
 * Field-Level Encryption Service
 * Encrypts sensitive data fields (SSN, bank accounts, etc.)
 */

import crypto from 'crypto';

export class FieldEncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits

  // In production, use AWS KMS or similar
  // For now, use environment variable
  private masterKey: Buffer;

  constructor() {
    const key = process.env.ENCRYPTION_MASTER_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_MASTER_KEY environment variable is required');
    }

    // Derive key from environment variable
    this.masterKey = crypto.scryptSync(key, 'salt', this.keyLength);
  }

  /**
   * Encrypt sensitive field
   */
  encrypt(plaintext: string): string {
    try {
      // Generate random IV (Initialization Vector)
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

      // Encrypt
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine: iv + authTag + encrypted
      const combined = Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, 'hex'),
      ]);

      // Return base64 encoded
      return combined.toString('base64');
    } catch (error: any) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive field
   */
  decrypt(ciphertext: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(ciphertext, 'base64');

      // Extract components
      const iv = combined.slice(0, 16);
      const authTag = combined.slice(16, 32);
      const encrypted = combined.slice(32);

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error: any) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt Social Security Number
   */
  encryptSSN(ssn: string): string {
    // Validate SSN format (XXX-XX-XXXX)
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(ssn)) {
      throw new Error('Invalid SSN format. Expected: XXX-XX-XXXX');
    }

    return this.encrypt(ssn);
  }

  /**
   * Decrypt Social Security Number
   */
  decryptSSN(encryptedSSN: string): string {
    return this.decrypt(encryptedSSN);
  }

  /**
   * Mask SSN for display (XXX-XX-1234)
   */
  maskSSN(ssn: string): string {
    return `XXX-XX-${ssn.slice(-4)}`;
  }

  /**
   * Encrypt Bank Account Number
   */
  encryptBankAccount(accountNumber: string): string {
    // Remove any non-digit characters
    const cleaned = accountNumber.replace(/\D/g, '');

    // Validate length (typically 8-17 digits)
    if (cleaned.length < 8 || cleaned.length > 17) {
      throw new Error('Invalid bank account number length');
    }

    return this.encrypt(cleaned);
  }

  /**
   * Decrypt Bank Account Number
   */
  decryptBankAccount(encryptedAccount: string): string {
    return this.decrypt(encryptedAccount);
  }

  /**
   * Mask Bank Account for display (****1234)
   */
  maskBankAccount(accountNumber: string): string {
    const cleaned = accountNumber.replace(/\D/g, '');
    return `****${cleaned.slice(-4)}`;
  }

  /**
   * Hash sensitive data for indexing/searching
   * One-way hash - cannot be decrypted
   */
  hash(value: string): string {
    return crypto
      .createHash('sha256')
      .update(value)
      .digest('hex');
  }

  /**
   * Verify hashed value
   */
  verifyHash(value: string, hash: string): boolean {
    return this.hash(value) === hash;
  }
}

export const fieldEncryptionService = new FieldEncryptionService();

