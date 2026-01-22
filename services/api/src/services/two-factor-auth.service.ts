/**
 * Two-Factor Authentication (2FA) Service
 * TOTP-based 2FA using authenticator apps (Google Authenticator, Authy, etc.)
 */

import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaClient } from '@kealee/database';

const prisma = new PrismaClient();

const APP_NAME = 'Kealee Platform';

/**
 * Generate 2FA secret for user
 */
export async function generate2FASecret(userId: string): Promise<{
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${user.email})`,
    issuer: APP_NAME,
    length: 32,
  });

  if (!secret.otpauth_url) {
    throw new Error('Failed to generate OTP URL');
  }

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  // Store secret (temporarily, until verified)
  await prisma.twoFactorSecret.upsert({
    where: { userId },
    create: {
      userId,
      secret: secret.base32,
      isVerified: false,
    },
    update: {
      secret: secret.base32,
      isVerified: false,
    },
  });

  return {
    secret: secret.base32,
    qrCodeUrl,
    manualEntryKey: secret.base32,
  };
}

/**
 * Verify 2FA code during setup
 */
export async function verify2FASetup(userId: string, token: string): Promise<boolean> {
  const twoFactorSecret = await prisma.twoFactorSecret.findUnique({
    where: { userId },
  });

  if (!twoFactorSecret) {
    throw new Error('2FA not initialized');
  }

  // Verify token
  const isValid = speakeasy.totp.verify({
    secret: twoFactorSecret.secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after (1 minute window)
  });

  if (isValid) {
    // Mark as verified and enable 2FA
    await prisma.$transaction([
      prisma.twoFactorSecret.update({
        where: { userId },
        data: { isVerified: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
      }),
    ]);

    // Generate backup codes
    await generateBackupCodes(userId);

    return true;
  }

  return false;
}

/**
 * Verify 2FA code during login
 */
export async function verify2FALogin(userId: string, token: string): Promise<boolean> {
  const twoFactorSecret = await prisma.twoFactorSecret.findUnique({
    where: { userId },
  });

  if (!twoFactorSecret || !twoFactorSecret.isVerified) {
    throw new Error('2FA not enabled');
  }

  // Verify token
  const isValid = speakeasy.totp.verify({
    secret: twoFactorSecret.secret,
    encoding: 'base32',
    token,
    window: 2,
  });

  if (isValid) {
    // Update last used
    await prisma.twoFactorSecret.update({
      where: { userId },
      data: { lastUsedAt: new Date() },
    });

    return true;
  }

  return false;
}

/**
 * Disable 2FA for user
 */
export async function disable2FA(userId: string, token: string): Promise<boolean> {
  // Verify token before disabling
  const isValid = await verify2FALogin(userId, token);

  if (!isValid) {
    return false;
  }

  // Disable 2FA
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false },
    }),
    prisma.twoFactorSecret.delete({
      where: { userId },
    }),
    prisma.backupCode.deleteMany({
      where: { userId },
    }),
  ]);

  return true;
}

/**
 * Generate backup codes (one-time use)
 */
export async function generateBackupCodes(userId: string): Promise<string[]> {
  const codes: string[] = [];

  // Generate 10 backup codes
  for (let i = 0; i < 10; i++) {
    const code = generateRandomCode(8);
    codes.push(code);

    // Hash the code before storing
    const crypto = require('crypto');
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    await prisma.backupCode.create({
      data: {
        userId,
        code: hashedCode,
      },
    });
  }

  return codes;
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const crypto = require('crypto');
  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

  const backupCode = await prisma.backupCode.findFirst({
    where: {
      userId,
      code: hashedCode,
      usedAt: null,
    },
  });

  if (!backupCode) {
    return false;
  }

  // Mark backup code as used
  await prisma.backupCode.update({
    where: { id: backupCode.id },
    data: { usedAt: new Date() },
  });

  return true;
}

/**
 * Get remaining backup codes count
 */
export async function getRemainingBackupCodes(userId: string): Promise<number> {
  return await prisma.backupCode.count({
    where: {
      userId,
      usedAt: null,
    },
  });
}

/**
 * Check if 2FA is enabled for user
 */
export async function is2FAEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });

  return user?.twoFactorEnabled || false;
}

/**
 * Generate random alphanumeric code
 */
function generateRandomCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  const crypto = require('crypto');
  const bytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }

  // Add hyphen every 4 characters for readability
  return code.match(/.{1,4}/g)?.join('-') || code;
}

