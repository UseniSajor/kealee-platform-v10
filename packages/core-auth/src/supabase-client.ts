/**
 * Supabase Authentication Client
 * Handles email/password auth, OAuth, and session management
 */

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration (SUPABASE_URL, SUPABASE_ANON_KEY)')
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Sign up with email and password
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: Record<string, any>
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {},
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`
    }
  })

  if (error) {
    throw new Error(`Sign up failed: ${error.message}`)
  }

  return { user: data.user, session: data.session }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    throw new Error(`Sign in failed: ${error.message}`)
  }

  return { user: data.user, session: data.session }
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithOAuth(provider: 'google' | 'github' | 'apple') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`
    }
  })

  if (error) {
    throw new Error(`OAuth sign in failed: ${error.message}`)
  }

  return data
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(`Sign out failed: ${error.message}`)
  }
}

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw new Error(`Get session failed: ${error.message}`)
  }

  return data.session
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    throw new Error(`Get user failed: ${error.message}`)
  }

  return data.user
}

/**
 * Verify OTP (for email verification)
 */
export async function verifyOtp(email: string, token: string, type: 'signup' | 'recovery' = 'signup') {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type
  })

  if (error) {
    throw new Error(`Verify OTP failed: ${error.message}`)
  }

  return { user: data.user, session: data.session }
}

/**
 * Reset password request
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/reset-password`
  })

  if (error) {
    throw new Error(`Reset password failed: ${error.message}`)
  }
}

/**
 * Update password with token
 */
export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({ password })

  if (error) {
    throw new Error(`Update password failed: ${error.message}`)
  }

  return data.user
}

/**
 * Update user metadata
 */
export async function updateUserMetadata(metadata: Record<string, any>) {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata
  })

  if (error) {
    throw new Error(`Update metadata failed: ${error.message}`)
  }

  return data.user
}

/**
 * Get auth state change listener
 */
export function onAuthStateChange(callback: (user: any, session: any) => void) {
  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user, session)
  })

  return authListener?.subscription.unsubscribe
}
