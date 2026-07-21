/**
 * m-estimation — CLAW Agent Integration
 *
 * CLAWs power estimation from project creation:
 *   - Claw A: AI-driven cost analysis, CSI MasterFormat mapping, assembly costing
 *   - Claw D: Budget seeding from approved estimates
 *   - Claw G: Cost prediction and variance analysis
 *   - Claw H: Orchestration and job queue management
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

// Estimation-specific CLAW actions
export async function runAIEstimate(projectId: string) {
  return claws.getEstimate(projectId)
}

export async function seedBudget(projectId: string) {
  return claws.getBudget(projectId)
}
