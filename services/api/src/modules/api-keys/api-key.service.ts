/**
 * API Key Management Service
 * Handles API key generation, validation, and rate limiting
 */

import {createClient} from '@supabase/supabase-js';
import crypto from 'crypto';

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  jurisdictionId?: string;
  userId?: string;
  organizationId?: string;
  scopes: string[];
  rateLimit: number; // requests per minute
  createdAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  active: boolean;
}

export interface ApiKeyUsage {
  keyId: string;
  endpoint: string;
  timestamp: Date;
  responseTime: number;
  statusCode: number;
}

export class ApiKeyService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * Generate new API key
   */
  async generateApiKey(
    name: string,
    jurisdictionId?: string,
    userId?: string,
    organizationId?: string,
    scopes: string[] = ['read'],
    rateLimit: number = 100
  ): Promise<ApiKey> {
    // Generate secure API key
    const key = `kealee_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    const apiKeyData = {
      keyHash,
      name,
      jurisdictionId,
      userId,
      organizationId,
      scopes,
      rateLimit,
      active: true,
    };

    const {data, error} = await this.supabase
      .from('ApiKey')
      .insert(apiKeyData)
      .select()
      .single();

    if (error) throw error;

    // Return with actual key (only shown once)
    return {
      ...data,
      key, // Only returned on creation
    } as ApiKey;
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey: string): Promise<ApiKey | null> {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const {data, error} = await this.supabase
      .from('ApiKey')
      .select('*')
      .eq('keyHash', keyHash)
      .eq('active', true)
      .single();

    if (error || !data) {
      return null;
    }

    // Check expiration
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      return null;
    }

    // Update last used
    await this.supabase
      .from('ApiKey')
      .update({lastUsedAt: new Date().toISOString()})
      .eq('id', data.id);

    return data as ApiKey;
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(keyId: string): Promise<{allowed: boolean; remaining: number}> {
    // Get API key
    const {data: apiKey} = await this.supabase
      .from('ApiKey')
      .select('rateLimit')
      .eq('id', keyId)
      .single();

    if (!apiKey) {
      return {allowed: false, remaining: 0};
    }

    // Check usage in last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const {count} = await this.supabase
      .from('ApiKeyUsage')
      .select('*', {count: 'exact', head: true})
      .eq('keyId', keyId)
      .gte('timestamp', oneMinuteAgo.toISOString());

    const used = count || 0;
    const remaining = Math.max(0, apiKey.rateLimit - used);
    const allowed = remaining > 0;

    return {allowed, remaining};
  }

  /**
   * Record API usage
   */
  async recordUsage(
    keyId: string,
    endpoint: string,
    responseTime: number,
    statusCode: number
  ): Promise<void> {
    await this.supabase.from('ApiKeyUsage').insert({
      keyId,
      endpoint,
      responseTime,
      statusCode,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * List API keys for user/organization
   */
  async listApiKeys(
    userId?: string,
    organizationId?: string,
    jurisdictionId?: string
  ): Promise<ApiKey[]> {
    let query = this.supabase.from('ApiKey').select('*').eq('active', true);

    if (userId) {
      query = query.eq('userId', userId);
    }
    if (organizationId) {
      query = query.eq('organizationId', organizationId);
    }
    if (jurisdictionId) {
      query = query.eq('jurisdictionId', jurisdictionId);
    }

    const {data, error} = await query.order('createdAt', {ascending: false});

    if (error) throw error;

    return (data || []).map(key => ({
      ...key,
      key: '***', // Never return actual key
    })) as ApiKey[];
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(keyId: string): Promise<void> {
    await this.supabase.from('ApiKey').update({active: false}).eq('id', keyId);
  }
}

export const apiKeyService = new ApiKeyService();
