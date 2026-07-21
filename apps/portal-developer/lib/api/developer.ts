/**
 * lib/api/developer.ts
 * Typed wrappers for developer portal API endpoints.
 */

import { apiFetch } from './client'

export interface DevProject {
  id: string
  name: string
  projectType: string
  lifecyclePhase: string | null
  twinTier: string | null
  twinHealthScore: number | null
  totalBudget: number | null
  spentToDate: number | null
  address: string | null
  city: string | null
  state: string | null
  status: string
  createdAt: string
  estimatedCompletionDate: string | null
}

export interface DevStats {
  totalProjects: number
  activeProjects: number
  totalBudget: number
  portfolioHealth: number
}

function normalizePhase(phase: string | null | undefined): string {
  const p = (phase ?? 'IDEA').toUpperCase().trim();
  if (p === 'FEASIBILITY' || p === 'CONCEPT' || p === 'LAND' || p === 'FEASIBILITY STUDY') return 'IDEA';
  if (p === 'PRECONSTRUCTION' || p === 'COSTING') return 'ESTIMATE';
  if (p === 'PERMITS') return 'PERMIT';
  if (p === 'CONTRACTOR_MATCH') return 'CONTRACTOR';
  if (p === 'CONSTRUCTION' || p === 'INSPECTIONS') return 'EXECUTION';
  if (p === 'CLOSEOUT' || p === 'COMPLETED' || p === 'OPERATIONS' || p === 'ARCHIVE' || p === 'PAYMENTS') return 'COMPLETION';
  return p;
}

export async function listDevProjects(): Promise<{ projects: DevProject[]; total: number }> {
  return apiFetch('/projects?limit=50')
}

export async function getDevStats(): Promise<DevStats> {
  const data = await apiFetch<{ projects: DevProject[]; total: number }>('/projects?limit=100')
  const projects = data.projects ?? []
  const active   = projects.filter(p => normalizePhase(p.lifecyclePhase) !== 'COMPLETION')
  const totalBudget = projects.reduce((s, p) => s + (p.totalBudget ?? 0), 0)
  const healthScores = projects.filter(p => p.twinHealthScore).map(p => p.twinHealthScore!)
  const avgHealth = healthScores.length ? Math.round(healthScores.reduce((a, b) => a + b) / healthScores.length) : 0
  return {
    totalProjects:   data.total ?? projects.length,
    activeProjects:  active.length,
    totalBudget,
    portfolioHealth: avgHealth,
  }
}

export interface FeasibilityScenario {
  id: string
  projectId: string
  name: string
  status: string
  irr: number | null
  npv: number | null
  createdAt: string
}

export async function listFeasibilityScenarios(): Promise<{ scenarios: FeasibilityScenario[] }> {
  return apiFetch<{ scenarios: FeasibilityScenario[] }>('/api/v1/feasibility/scenarios?limit=20')
    .catch(() => ({ scenarios: [] }))
}
