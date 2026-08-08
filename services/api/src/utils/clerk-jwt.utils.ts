/**
 * Clerk JWT Verification Utility
 * Verifies Clerk-issued JWT tokens using the CLERK_SECRET_KEY
 */

import jwt from 'jsonwebtoken'

export interface ClerkJWTClaims {
  sub: string // Clerk user ID
  email?: string
  email_verified?: boolean
  name?: string
  first_name?: string
  last_name?: string
  role?: string
  iat: number
  exp: number
  [key: string]: any
}

/**
 * Verify a Clerk JWT token
 * Returns the decoded claims if valid, null if invalid
 */
export async function verifyClerkJWT(token: string): Promise<ClerkJWTClaims | null> {
  const secret = process.env.CLERK_SECRET_KEY

  if (!secret) {
    // Clerk not configured
    return null
  }

  try {
    // Verify JWT signature using HS256 (Clerk uses this for session tokens)
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as ClerkJWTClaims

    return decoded
  } catch (error: any) {
    // Token is invalid, expired, or not a Clerk token
    return null
  }
}

/**
 * Extract Clerk user ID from token without verification
 * USE WITH CAUTION - only for logging/debugging
 */
export function getClerkUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as any
    return decoded?.sub || null
  } catch {
    return null
  }
}
