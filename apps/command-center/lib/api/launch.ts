/**
 * lib/api/launch.ts
 *
 * Typed API client for the P9 launch metrics and region management endpoints.
 * Used by the command-center /launch dashboard page.
 */

import { getAuthToken } from '../supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken()
  const res   = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as any).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MetricValue {
  name:           string
  label:          string
  value:          number
  unit:           'count' | 'percent' | 'usd' | 'days'
  category:       'supply' | 'demand' | 'financial' | 'quality'
  trend?:         'up' | 'down' | 'flat'
  changePercent?: number
  target?:        number
  isHealthy?:     boolean
}

export interface RegionStatus {
  id:          string
  slug:        string
  name:        string
  launched:    boolean
  launchedAt:  string | null
  contractors: number
  target:      number
}

export interface LaunchDashboard {
  generatedAt: string
  supply:      MetricValue[]
  demand:      MetricValue[]
  financial:   MetricValue[]
  quality:     MetricValue[]
  funnel:      Array<{ stage: string; count: number }>
  regions:     RegionStatus[]
  onboarding:  {
    avgDaysToApproval: number
    funnelByStage:     Record<string, number>
  }
}

export interface LaunchConfigItem {
  id:          string
  key:         string
  value:       unknown
  description: string | null
  category:    string
  isActive:    boolean
  updatedBy:   string | null
  updatedAt:   string
}

export interface OnboardingStats {
  byStage:           Record<string, number>
  conversions:       Array<{ from: string; to: string; rate: number }>
  total:             number
  approved:          number
  rejected:          number
  avgDaysToApproval: number
}

// ── API wrappers ──────────────────────────────────────────────────────────────

export async function getLaunchDashboard(): Promise<LaunchDashboard> {
  return apiFetch<LaunchDashboard>('/marketplace/launch/dashboard')
}

export async function getRegions(): Promise<RegionStatus[]> {
  const { regions } = await apiFetch<{ regions: RegionStatus[] }>('/marketplace/launch/regions')
  return regions
}

export async function launchRegion(id: string): Promise<void> {
  await apiFetch(`/marketplace/launch/regions/${id}/launch`, { method: 'POST' })
}

export async function pauseRegion(id: string): Promise<void> {
  await apiFetch(`/marketplace/launch/regions/${id}/pause`, { method: 'POST' })
}

export async function getLaunchConfig(): Promise<LaunchConfigItem[]> {
  const { config } = await apiFetch<{ config: LaunchConfigItem[] }>('/marketplace/launch/config')
  return config
}

export async function upsertConfigFlag(
  key:   string,
  value: unknown,
  opts?: { description?: string; category?: string },
): Promise<LaunchConfigItem> {
  const { config } = await apiFetch<{ config: LaunchConfigItem }>(
    `/marketplace/launch/config/${encodeURIComponent(key)}`,
    { method: 'PUT', body: JSON.stringify({ value, ...opts }) },
  )
  return config
}

export async function getOnboardingStats(): Promise<OnboardingStats> {
  return apiFetch<OnboardingStats>('/marketplace/onboarding/admin/stats')
}

export async function listOnboardings(params?: {
  stage?:    string
  region?:   string
  cohortId?: string
  limit?:    number
  cursor?:   string
}): Promise<Array<Record<string, unknown>>> {
  const qs = new URLSearchParams()
  if (params?.stage)    qs.set('stage',    params.stage)
  if (params?.region)   qs.set('region',   params.region)
  if (params?.cohortId) qs.set('cohortId', params.cohortId)
  if (params?.limit)    qs.set('limit',    String(params.limit))
  if (params?.cursor)   qs.set('cursor',   params.cursor)
  const { items } = await apiFetch<{ items: Array<Record<string, unknown>> }>(
    `/marketplace/onboarding/admin/list?${qs}`,
  )
  return items
}
