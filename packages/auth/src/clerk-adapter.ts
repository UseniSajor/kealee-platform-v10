/**
 * Clerk + Supabase Unified Auth Adapter
 * Provides a consistent interface for both auth providers
 * Strategy: Try Clerk first, fall back to Supabase
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

export interface UnifiedUser {
  id: string
  email: string | null
  role?: string
  appMetadata?: Record<string, any>
  source: 'clerk' | 'supabase'
}

/**
 * Extract Clerk user from request headers
 * Clerk stores user info in __clerk_db_jwt cookie and __clerk_cache
 */
export async function getClerkUser(request: NextRequest): Promise<UnifiedUser | null> {
  try {
    // Check if Clerk is configured
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      return null
    }

    // Clerk auth is typically available in the request via middleware
    // The ClerkProvider and useAuth hook handle this on client side
    // For server-side: extract from headers set by Clerk middleware
    const clerkUserId = request.headers.get('x-clerk-user-id')
    const clerkEmail = request.headers.get('x-clerk-user-email')
    const clerkRole = request.headers.get('x-clerk-user-role')

    if (!clerkUserId) {
      return null
    }

    return {
      id: clerkUserId,
      email: clerkEmail,
      role: clerkRole || undefined,
      source: 'clerk',
    }
  } catch (error) {
    console.error('[clerk-adapter] Error getting Clerk user:', error)
    return null
  }
}

/**
 * Extract Supabase user from request
 */
export async function getSupabaseUser(
  request: NextRequest,
  cookies?: { getAll: () => any[]; setAll: (v: any[]) => void },
): Promise<UnifiedUser | null> {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => (cookies?.getAll?.() || request.cookies.getAll()),
          setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
            if (cookies?.setAll) {
              cookies.setAll(cookiesToSet)
            } else {
              cookiesToSet.forEach(({ name, value, options }) => {
                request.cookies.set(name, value)
              })
            }
          },
        },
      },
    )

    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email || null,
      role: (user.app_metadata?.role as string | undefined) || undefined,
      appMetadata: user.app_metadata || {},
      source: 'supabase',
    }
  } catch (error) {
    console.error('[clerk-adapter] Error getting Supabase user:', error)
    return null
  }
}

/**
 * Get unified user: try Clerk first, fall back to Supabase
 * This is the primary function to use in middleware
 */
export async function getUnifiedUser(
  request: NextRequest,
  cookies?: { getAll: () => any[]; setAll: (v: any[]) => void },
): Promise<UnifiedUser | null> {
  // Try Clerk first (primary)
  const clerkUser = await getClerkUser(request)
  if (clerkUser) {
    return clerkUser
  }

  // Fall back to Supabase
  const supabaseUser = await getSupabaseUser(request, cookies)
  if (supabaseUser) {
    return supabaseUser
  }

  return null
}

/**
 * Get user from both providers (for debugging or dual-auth scenarios)
 */
export async function getUserFromBoth(
  request: NextRequest,
  cookies?: { getAll: () => any[]; setAll: (v: any[]) => void },
): Promise<{ clerk: UnifiedUser | null; supabase: UnifiedUser | null }> {
  const [clerk, supabase] = await Promise.all([
    getClerkUser(request),
    getSupabaseUser(request, cookies),
  ])

  return { clerk, supabase }
}

/**
 * Check if user is authenticated (either provider)
 */
export async function isAuthenticated(
  request: NextRequest,
  cookies?: { getAll: () => any[]; setAll: (v: any[]) => void },
): Promise<boolean> {
  const user = await getUnifiedUser(request, cookies)
  return !!user
}

/**
 * Check if user has required role
 */
export async function hasRole(
  request: NextRequest,
  allowedRoles: string[] | Set<string>,
  cookies?: { getAll: () => any[]; setAll: (v: any[]) => void },
): Promise<boolean> {
  const user = await getUnifiedUser(request, cookies)
  if (!user?.role) {
    return false
  }

  const roles = Array.isArray(allowedRoles) ? new Set(allowedRoles) : allowedRoles
  return roles.has(user.role.toLowerCase())
}

/**
 * Extract Clerk session from middleware (for Response cookies)
 * This enables Clerk cookies to be set on the response
 */
export function setupClerkCookies(request: NextRequest) {
  // Clerk middleware will automatically handle cookie setting
  // This is just a placeholder for future enhancements
  return {
    getAll: () => request.cookies.getAll(),
  }
}
