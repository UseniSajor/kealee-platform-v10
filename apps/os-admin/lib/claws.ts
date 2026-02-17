/**
 * os-admin — CLAW Agent Integration (Full System View)
 *
 * Admin has visibility into ALL 8 CLAWs across all projects:
 *   A: Acquisition & PreCon      E: Permits & Compliance
 *   B: Contract & Commercials    F: Docs & Communication
 *   C: Schedule & Field Ops      G: Risk & Predictions
 *   D: Budget & Cost Control     H: Command Center & Automation
 *
 * Admin can view CLAW health, override automation rules,
 * and manage system-wide CLAW configuration.
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
