import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set')
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const clerk = (window as typeof window & {
      Clerk?: { session?: { getToken: () => Promise<string | null> } }
    }).Clerk
    return await clerk?.session?.getToken() ?? null
  } catch {
    return null
  }
}
