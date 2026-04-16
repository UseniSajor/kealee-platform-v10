/**
 * Session Manager
 * Handles server-side session creation, verification, and user context
 */

import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client for server-side operations
 * Used in Server Components and Route Handlers
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignore cookie setting errors
          }
        }
      }
    }
  )
}

/**
 * Get current user in server context
 */
export async function getServerUser() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
      return null
    }

    return data.user
  } catch (error) {
    console.error('Error getting server user:', error)
    return null
  }
}

/**
 * Get current session in server context
 */
export async function getServerSession() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session) {
      return null
    }

    return data.session
  } catch (error) {
    console.error('Error getting server session:', error)
    return null
  }
}

/**
 * Verify user is authenticated (server-side)
 * Throws error if not authenticated
 */
export async function requireServerAuth() {
  const user = await getServerUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}

/**
 * Get user with database profile
 */
export async function getUserWithProfile(userId: string) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('supabaseId', userId)
      .single()

    if (userError || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

/**
 * Verify user has required role
 */
export async function requireRole(requiredRole: string) {
  const user = await getServerUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  const userRole = user.user_metadata?.role

  if (userRole !== requiredRole && userRole !== 'ADMIN') {
    throw new Error(`Unauthorized: requires ${requiredRole} role`)
  }

  return user
}

/**
 * Sign out user (server-side)
 */
export async function serverSignOut() {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(`Sign out failed: ${error.message}`)
  }
}

/**
 * Create user profile in database after auth signup
 */
export async function createUserProfile(
  supabaseId: string,
  email: string,
  name: string | null,
  role: string = 'USER',
  orgId?: string
) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('users')
      .insert({
        supabaseId,
        email,
        name,
        role,
        orgId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error creating user profile:', error)
    throw error
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  supabaseId: string,
  updates: Record<string, any>
) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('supabaseId', supabaseId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}
