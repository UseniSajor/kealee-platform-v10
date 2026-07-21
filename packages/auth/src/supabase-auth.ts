/**
 * Supabase Server-Side Auth Module
 *
 * Shared across ALL apps (Next.js server components, API routes, middleware).
 * Uses @supabase/ssr for cookie-based session management.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { prisma } from '@kealee/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string
  email: string
  role: string
  firstName: string | null
  lastName: string | null
  organizationId: string | null
  orgRole: string | null
  permissions: string[]
}

/** Minimal cookie interface matching Next.js ReadonlyRequestCookies */
export interface CookieStore {
  get(name: string): { name: string; value: string } | undefined
  getAll(): { name: string; value: string }[]
  set?(name: string, value: string, options?: CookieOptions): void
  delete?(name: string, options?: CookieOptions): void
}

// ---------------------------------------------------------------------------
// App role mapping — which roles are allowed in which app
// ---------------------------------------------------------------------------

export const APP_ALLOWED_ROLES: Record<string, string[]> = {
  'os-admin': ['admin', 'super_admin'],
  'os-pm': ['pm', 'admin', 'super_admin'],
  'm-project-owner': ['homeowner', 'developer', 'property_manager', 'business_owner', 'client'],
  'm-architect': ['architect', 'engineer', 'admin'],
  'm-marketplace': ['contractor', 'vendor', 'homeowner', 'developer', 'admin'],
  'm-ops-services': ['pm', 'admin', 'contractor'],
  'm-permits-inspections': ['pm', 'admin', 'inspector'],
  'm-finance-trust': ['pm', 'admin', 'client', 'homeowner'],
}

// ---------------------------------------------------------------------------
// Redirect targets per role — when a user hits the wrong app
// ---------------------------------------------------------------------------

export const ROLE_APP_REDIRECT: Record<string, string> = {
  admin: '/admin',
  super_admin: '/admin',
  pm: '/pm',
  homeowner: '/projects',
  developer: '/projects',
  property_manager: '/projects',
  business_owner: '/projects',
  architect: '/architect',
  engineer: '/architect',
  contractor: '/marketplace',
  vendor: '/marketplace',
  inspector: '/permits',
}

// ---------------------------------------------------------------------------
// Server Clients
// ---------------------------------------------------------------------------

/**
 * Create a Supabase server client that reads/writes session cookies.
 * Use in Next.js Server Components, Server Actions, and Route Handlers.
 */
export function createSupabaseServerClient(cookies: CookieStore) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookies.set?.(name, value, options)
        } catch {
          // Server Components can't set cookies — ignore
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookies.delete?.(name, options)
        } catch {
          // Server Components can't delete cookies — ignore
        }
      },
    },
  })
}

/**
 * Create a Supabase admin client using the service role key.
 * Bypasses RLS — use only on the server for admin operations.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ---------------------------------------------------------------------------
// User Resolution
// ---------------------------------------------------------------------------

/**
 * Get the currently authenticated user with full profile from the database.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(
  cookies: CookieStore,
): Promise<AuthUser | null> {
  const supabase = createSupabaseServerClient(cookies)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) return null

  // Load user from Prisma with org membership + permissions
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      orgMemberships: {
        include: {
          org: true,
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
        take: 1,
        orderBy: { joinedAt: 'asc' },
      },
    },
  })

  if (!dbUser) return null

  const primaryMembership = dbUser.orgMemberships?.[0]

  return {
    id: dbUser.id,
    email: dbUser.email || session.user.email || '',
    role: primaryMembership?.roleKey || dbUser.role || 'user',
    firstName: (dbUser as any).firstName ?? dbUser.name?.split(' ')[0] ?? null,
    lastName: (dbUser as any).lastName ?? dbUser.name?.split(' ').slice(1).join(' ') ?? null,
    organizationId: primaryMembership?.orgId ?? null,
    orgRole: primaryMembership?.roleKey ?? null,
    permissions:
      primaryMembership?.role?.permissions?.map(
        (rp: any) => rp.permission?.key,
      ).filter(Boolean) ?? [],
  }
}

/**
 * Require an authenticated user. Throws a redirect to /login if not found.
 */
export async function requireAuth(cookies: CookieStore): Promise<AuthUser> {
  const user = await getCurrentUser(cookies)

  if (!user) {
    // In Next.js 14+ this throw is caught by the framework and triggers a redirect
    throw new Error('REDIRECT:/login')
  }

  return user
}

/**
 * Require the user to have one of the specified roles.
 * Throws 403 if the user lacks the required role.
 */
export async function requireRole(
  cookies: CookieStore,
  roles: string[],
): Promise<AuthUser> {
  const user = await requireAuth(cookies)

  const normalizedRoles = roles.map((r) => r.toLowerCase())
  if (!normalizedRoles.includes(user.role.toLowerCase())) {
    throw new Error('FORBIDDEN:Insufficient permissions')
  }

  return user
}
