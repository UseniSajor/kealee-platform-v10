/**
 * m-finance-trust — CLAW Agent Integration
 *
 * CLAWs handle financial operations:
 *   - Claw B: Contract execution, payment processing, retainage
 *   - Claw D: Budget control, variance monitoring
 *   - Claw F: Payment notifications, lien waiver generation
 *   - Claw G: Financial risk prediction
 *   - Claw H: Payment automation, milestone tracking
 */

import { createClawsClient } from '@kealee/ui'

async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const { createBrowserClient } = await import('@supabase/ssr')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    )
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch {
    return null
  }
}

export const claws = createClawsClient({ getToken })
