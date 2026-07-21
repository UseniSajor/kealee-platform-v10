/**
 * Readiness Gate System
 * Enforces requirements before project advancement
 */

export type ReadinessGate = {
  key: string
  name: string
  description: string
  required: boolean
  status: 'pending' | 'completed' | 'blocked'
  completionPercentage: number
  blockers: string[]
}

export type GateStatus = {
  gates: ReadinessGate[]
  overallCompletion: number
  canAdvance: boolean
  blockers: string[]
}

/**
 * Check readiness gates for a project
 */
export async function checkReadinessGates(projectId: string): Promise<GateStatus> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  
  const token = await getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}/readiness/projects/${projectId}/gates`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('Failed to check readiness gates')
  }

  return response.json()
}

/**
 * Get gate completion percentage
 */
export function calculateGateCompletion(gates: ReadinessGate[]): number {
  if (gates.length === 0) return 100

  const completed = gates.filter(g => g.status === 'completed').length
  return Math.round((completed / gates.length) * 100)
}

/**
 * Check if project can advance to next phase
 */
export function canAdvanceProject(gates: ReadinessGate[]): boolean {
  const requiredGates = gates.filter(g => g.required)
  return requiredGates.every(g => g.status === 'completed')
}

import { getAuthToken } from './supabase'
