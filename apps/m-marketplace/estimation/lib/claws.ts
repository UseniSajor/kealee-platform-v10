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
import { getClerkToken } from '@/lib/clerk-token'

export const claws = createClawsClient({ getToken: getClerkToken })

// Estimation-specific CLAW actions
export async function runAIEstimate(projectId: string) {
  return claws.getEstimate(projectId)
}

export async function seedBudget(projectId: string) {
  return claws.getBudget(projectId)
}
