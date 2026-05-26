import { createBrowserClient } from '@supabase/ssr'

function supabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (url && anonKey) return { url, anonKey }

  // Allow `next build` page-data collection when CI has no secrets (runtime still needs real env).
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel. Add them in Project → Settings → Environment Variables.',
    )
  }

  return {
    url: url || 'https://placeholder.supabase.co',
    anonKey:
      anonKey ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  }
}

const { url, anonKey } = supabaseEnv()

// createBrowserClient from @supabase/ssr — shares auth cookies with middleware.
export const supabase = createBrowserClient(url, anonKey)
