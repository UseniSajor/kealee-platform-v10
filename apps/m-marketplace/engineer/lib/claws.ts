/**
 * m-engineer — CLAW Agent Integration
 *
 * CLAWs support engineering workflows:
 *   - Claw A: Structural scope analysis
 *   - Claw E: Engineering permit coordination
 *   - Claw F: Document generation (calculations, specs)
 *   - Claw G: Structural risk assessment
 *   - Claw H: Task automation
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
