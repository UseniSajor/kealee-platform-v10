/**
 * Enhanced Authentication Middleware
 * Production-grade JWT authentication with refresh tokens
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@kealee/database';

const prisma = new PrismaClient();

// JWT Configuration
const JWT_SECRET: string = (process.env.JWT_SECRET || 'your-secret-key-min-64-chars') as string;
const JWT_REFRESH_SECRET: string = (process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-min-64-chars') as string;
const JWT_EXPIRY: string = (process.env.JWT_EXPIRY || '15m') as string; // Short-lived access tokens
const JWT_REFRESH_EXPIRY: string = (process.env.JWT_REFRESH_EXPIRY || '7d') as string; // Long-lived refresh tokens

if (JWT_SECRET.length < 64 || JWT_REFRESH_SECRET.length < 64) {
  console.warn('⚠️ WARNING: JWT secrets should be at least 64 characters for production!');
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    role: string;
    sessionId: string;
  };
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(userId: string, email: string, role: string, sessionId: string): string {
  return jwt.sign(
    { userId, email, role, sessionId },
    JWT_SECRET as jwt.Secret,
    { expiresIn: JWT_EXPIRY } as jwt.SignOptions
  );
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(userId: string, sessionId: string): string {
  return jwt.sign(
    { userId, sessionId },
    JWT_REFRESH_SECRET as jwt.Secret,
    { expiresIn: JWT_REFRESH_EXPIRY } as jwt.SignOptions
  );
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS512'] }) as JWTPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('INVALID_TOKEN');
    }
    throw new Error('TOKEN_VERIFICATION_FAILED');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): { userId: string; sessionId: string } {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ['HS512'] }) as { userId: string; sessionId: string };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }
    throw new Error('INVALID_REFRESH_TOKEN');
  }
}

/**
 * Enhanced authentication middleware
 */
export async function enhancedAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'No authorization header provided',
        code: 'NO_AUTH_HEADER',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid authorization header format',
        code: 'INVALID_AUTH_FORMAT',
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    let payload: JWTPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (error: any) {
      if (error.message === 'TOKEN_EXPIRED') {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Access token expired',
          code: 'TOKEN_EXPIRED',
        });
      }
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid access token',
        code: 'INVALID_TOKEN',
      });
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Account is blocked or suspended',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    // Verify session is still valid
    const session = await prisma.userSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.isRevoked) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Session expired or revoked',
        code: 'SESSION_INVALID',
      });
    }

    // Update last activity
    await prisma.userSession.update({
      where: { id: payload.sessionId },
      data: { lastActivity: new Date() },
    });

    // Attach user to request
    (request as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: payload.sessionId,
    };

    // Log successful authentication
    request.log.info(`Authenticated user: ${user.email} (${user.role})`);
  } catch (error: any) {
    request.log.error('Authentication error:', error);
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Authentication failed',
      code: 'AUTH_ERROR',
    });
  }
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without authentication
    return;
  }

  // If token is provided, validate it
  try {
    await enhancedAuthMiddleware(request, reply);
  } catch (error) {
    // Token is invalid, but since this is optional, just log and continue
    request.log.warn('Optional auth failed, continuing without authentication');
  }
}

/**
 * Create new session
 */
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{
  sessionId: string;
  accessToken: string;
  refreshToken: string;
}> {
  // Create session record
  const session = await prisma.userSession.create({
    data: {
      userId,
      userAgent: userAgent || 'Unknown',
      ipAddress: ipAddress || 'Unknown',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      isRevoked: false,
      lastActivity: new Date(),
    },
  });

  // Get user details
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, role: true },
  });

  // Generate tokens
  const accessToken = generateAccessToken(userId, user.email, user.role, session.id);
  const refreshToken = generateRefreshToken(userId, session.id);

  return {
    sessionId: session.id,
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  // Verify refresh token
  let payload: { userId: string; sessionId: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error: any) {
    throw new Error('Invalid or expired refresh token');
  }

  // Verify session
  const session = await prisma.userSession.findUnique({
    where: { id: payload.sessionId },
  });

  if (!session || session.isRevoked || session.expiresAt < new Date()) {
    throw new Error('Session expired or revoked');
  }

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { email: true, role: true, status: true },
  });

  if (!user || user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
    throw new Error('User account is inactive');
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(payload.userId, user.email, user.role, payload.sessionId);
  const newRefreshToken = generateRefreshToken(payload.userId, payload.sessionId);

  // Update session activity
  await prisma.userSession.update({
    where: { id: payload.sessionId },
    data: { lastActivity: new Date() },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Revoke session (logout)
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.userSession.update({
    where: { id: sessionId },
    data: { isRevoked: true },
  });
}

/**
 * Revoke all user sessions (logout everywhere)
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  const result = await prisma.userSession.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });

  return result.count;
}

/**
 * Get active sessions for user
 */
export async function getUserActiveSessions(userId: string) {
  return await prisma.userSession.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActivity: 'desc' },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      lastActivity: true,
    },
  });
}

/**
 * Clean up expired sessions (run as cron job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.userSession.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { isRevoked: true, lastActivity: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // Delete revoked sessions older than 30 days
      ],
    },
  });

  return result.count;
}

