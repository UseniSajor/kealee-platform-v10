import { createBrowserClient } from '@supabase/ssr'
import { getClerkToken } from '@/lib/clerk-token'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set')
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

/**
 * Get the Clerk session token used by the Kealee API and Supabase third-party auth.
 */
export async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    return await getClerkToken()
  } catch {
    return null
  }
}
