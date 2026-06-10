import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const MARKETING_OS_ROLES = new Set(['admin', 'super_admin', 'marketing_admin'])

export async function requireMarketingAdmin() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => undefined,
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  const role = String(user?.app_metadata?.role ?? '').toLowerCase()
  if (!user || !MARKETING_OS_ROLES.has(role)) return null
  return { user, role }
}
