import { supabase } from './supabase'
import { cookies } from 'next/headers'

/**
 * Get the current session from server-side
 */
export async function getSession() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  const refreshToken = cookieStore.get('sb-refresh-token')?.value

  if (!accessToken) {
    return null
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return null
    }
    return { user, accessToken, refreshToken }
  } catch (error) {
    return null
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(error.message)
  }
}
