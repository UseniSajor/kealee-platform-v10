/**
 * API Key Management Service
 * Secure API key generation, validation, and rotation
 */

import { PrismaClient } from '@kealee/database';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface APIKey {
  id: string;
  name: string;
  keyPrefix: string | null; // First 8 chars of key (for identification)
  userId: string | null;
  scopes: string[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

/**
 * Generate API key
 */
export async function generateAPIKey(
  userId: string,
  name: string,
  scopes: string[],
  expiresInDays?: number
): Promise<{ key: string; apiKey: APIKey }> {
  // Generate secure random key
  const keyBuffer = crypto.randomBytes(32);
  const key = `kealee_${keyBuffer.toString('base64url')}`;

  // Hash key for storage
  const hashedKey = crypto.createHash('sha256').update(key).digest('hex');

  // Key prefix (first 8 chars for identification)
  const keyPrefix = key.substring(0, 15);

  // Calculate expiration
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  // Store in database
  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyHash: hashedKey,
      keyPrefix,
      scopes,
      expiresAt,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      userId: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return { key, apiKey };
}

/**
 * Validate API key
 */
export async function validateAPIKey(key: string): Promise<{
  isValid: boolean;
  apiKey?: APIKey;
  error?: string;
}> {
  if (!key.startsWith('kealee_')) {
    return { isValid: false, error: 'Invalid API key format' };
  }

  // Hash the key
  const hashedKey = crypto.createHash('sha256').update(key).digest('hex');

  // Find API key
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyHash: hashedKey,
      isRevoked: false,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      userId: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  if (!apiKey) {
    return { isValid: false, error: 'API key not found or revoked' };
  }

  // Check expiration
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { isValid: false, error: 'API key expired' };
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return { isValid: true, apiKey };
}

/**
 * Revoke API key
 */
export async function revokeAPIKey(apiKeyId: string, userId: string): Promise<boolean> {
  const apiKey = await prisma.apiKey.findFirst({
    where: { id: apiKeyId, userId },
  });

  if (!apiKey) {
    return false;
  }

  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { isRevoked: true },
  });

  return true;
}

/**
 * Rotate API key (generate new, revoke old)
 */
export async function rotateAPIKey(
  oldKeyId: string,
  userId: string,
  gracePeriodDays: number = 7
): Promise<{ key: string; apiKey: APIKey } | null> {
  const oldKey = await prisma.apiKey.findFirst({
    where: { id: oldKeyId, userId },
  });

  if (!oldKey) {
    return null;
  }

  // Generate new key with same scopes
  const newKey = await generateAPIKey(
    userId,
    `${oldKey.name} (Rotated)`,
    oldKey.scopes,
    oldKey.expiresAt
      ? Math.ceil((oldKey.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : undefined
  );

  // Schedule old key for revocation after grace period
  const revokeAt = new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000);
  await prisma.apiKey.update({
    where: { id: oldKeyId },
    data: {
      expiresAt: revokeAt,
      // Note: Add a note that this key is being phased out
    },
  });

  return newKey;
}

/**
 * List user's API keys
 */
export async function listAPIKeys(userId: string): Promise<APIKey[]> {
  return await prisma.apiKey.findMany({
    where: {
      userId,
      isRevoked: false,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      userId: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Check if API key has specific scope
 */
export function hasScope(apiKey: APIKey, requiredScope: string): boolean {
  return apiKey.scopes.includes(requiredScope) || apiKey.scopes.includes('*');
}

/**
 * API Key scopes
 */
export const API_KEY_SCOPES = {
  // Read scopes
  READ_USERS: 'users:read',
  READ_PROJECTS: 'projects:read',
  READ_CONTRACTS: 'contracts:read',
  READ_FINANCE: 'finance:read',
  
  // Write scopes
  WRITE_USERS: 'users:write',
  WRITE_PROJECTS: 'projects:write',
  WRITE_CONTRACTS: 'contracts:write',
  WRITE_FINANCE: 'finance:write',
  
  // Admin scopes
  ADMIN: 'admin:*',
  
  // Webhook scope
  WEBHOOKS: 'webhooks:receive',
  
  // Full access
  ALL: '*',
};

/**
 * Clean up expired API keys (run as cron job)
 */
export async function cleanupExpiredAPIKeys(): Promise<number> {
  const result = await prisma.apiKey.updateMany({
    where: {
      expiresAt: { lt: new Date() },
      isRevoked: false,
    },
    data: { isRevoked: true },
  });

  return result.count;
}

