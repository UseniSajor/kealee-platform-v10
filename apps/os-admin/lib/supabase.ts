import { createBrowserClient } from '@supabase/ssr'

function supabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (url && anonKey) return { url, anonKey }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in the deployment environment.',
    )
  }

  // Non-secret placeholders keep local build-time imports deterministic.
  return {
    url: url || 'https://placeholder.supabase.co',
    anonKey: anonKey || 'placeholder-anon-key',
  }
}

const { url, anonKey } = supabaseEnv()

// Supabase is the data provider only; Clerk owns browser identity and sessions.
export const supabase = createBrowserClient(url, anonKey)
