/**
 * Enhanced API Key Security Service
 * Implements bcrypt option and enhanced security features
 */

import {createClient} from '@supabase/supabase-js';
import crypto from 'crypto';

export interface ApiKeySecurityConfig {
  hashAlgorithm: 'sha256' | 'bcrypt';
  bcryptRounds?: number;
  keyPrefix: string;
  keyLength: number;
}

const DEFAULT_CONFIG: ApiKeySecurityConfig = {
  hashAlgorithm: 'sha256', // Use SHA-256 by default (faster for API keys)
  bcryptRounds: 12, // For bcrypt option
  keyPrefix: 'kealee_',
  keyLength: 32, // bytes
};

export class ApiKeySecurityService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  private config: ApiKeySecurityConfig;

  constructor(config?: Partial<ApiKeySecurityConfig>) {
    this.config = {...DEFAULT_CONFIG, ...config};
  }

  /**
   * Generate secure API key
   */
  generateSecureKey(): string {
    const randomBytes = crypto.randomBytes(this.config.keyLength);
    return `${this.config.keyPrefix}${randomBytes.toString('hex')}`;
  }

  /**
   * Hash API key based on configured algorithm
   */
  async hashKey(key: string): Promise<string> {
    if (this.config.hashAlgorithm === 'bcrypt') {
      // bcryptjs is now installed as a dependency
      const bcrypt = require('bcryptjs');
      return await bcrypt.hash(key, this.config.bcryptRounds || 12);
    }
    // SHA-256 (default, faster for API keys)
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Verify API key against stored hash
   */
  async verifyKey(key: string, storedHash: string): Promise<boolean> {
    if (this.config.hashAlgorithm === 'bcrypt') {
      const bcrypt = require('bcryptjs');
      return await bcrypt.compare(key, storedHash);
    }
    // SHA-256 comparison
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(keyHash),
      Buffer.from(storedHash)
    );
  }

  /**
   * Generate key with secure random salt
   */
  generateKeyWithSalt(): {key: string; salt: string} {
    const salt = crypto.randomBytes(16).toString('hex');
    const key = this.generateSecureKey();
    return {key, salt};
  }

  /**
   * Enhanced key validation with timing attack protection
   */
  async validateKeySecure(key: string, storedHash: string): Promise<boolean> {
    try {
      return await this.verifyKey(key, storedHash);
    } catch (error) {
      // Always perform hash operation even on error to prevent timing attacks
      await this.hashKey('dummy');
      return false;
    }
  }
}

export const apiKeySecurityService = new ApiKeySecurityService();
