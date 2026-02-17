import { createBrowserClient } from '@supabase/ssr'

// Use createBrowserClient from @supabase/ssr (replaces deprecated
// createClientComponentClient from @supabase/auth-helpers-nextjs).
// Shares auth cookies set by middleware, ensuring getSession()
// returns the active session on client components.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
