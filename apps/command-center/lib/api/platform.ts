/**
 * lib/api/platform.ts
 *
 * Platform-wide stats + command-center data fetchers.
 * Endpoints: /api/v1/command-center/* and /users, /projects, /events
 */

import { getAuthToken } from '../supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function apiFetch<T>(path: string): Promise<T> {
  const token = await getAuthToken()
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${path}`)
  return res.json() as Promise<T>
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SystemStatus {
  status: string
  appCount: number
  healthyApps: number
  warningApps: number
  errorApps: number
  apps: Array<{
    appId: string
    appName: string
    status: string
    avgSuccessRate: number
    avgDuration: number
    recentJobs: number
  }>
}

export interface PlatformMetrics {
  totalJobs: number
  successRate: number
  avgDuration: number
  activeWorkers: number
}

export interface PlatformAlert {
  appId: string
  appName: string
  errorRate: number
  jobsTotal: number
  jobsFailed: number
  timestamp: string
}

export interface PlatformStats {
  totalUsers: number
  totalProjects: number
  activeAlerts: number
  metrics: PlatformMetrics
}

export interface PlatformEvent {
  id: string
  eventType: string
  payload: Record<string, unknown>
  occurredAt: string
  module?: string
  message?: string
}

// ── Fetchers ─────────────────────────────────────────────────────────────────

export async function getSystemStatus(): Promise<SystemStatus> {
  return apiFetch<SystemStatus>('/api/v1/command-center/status')
}

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  return apiFetch<PlatformMetrics>('/api/v1/command-center/metrics')
}

export async function getPlatformAlerts(): Promise<{ alerts: PlatformAlert[] }> {
  return apiFetch<{ alerts: PlatformAlert[] }>('/api/v1/command-center/alerts')
}

export async function getUserCount(): Promise<number> {
  try {
    const data = await apiFetch<{ total?: number; users?: unknown[] }>('/users?limit=1')
    return data.total ?? (data.users?.length ?? 0)
  } catch { return 0 }
}

export async function getProjectCount(): Promise<number> {
  try {
    const data = await apiFetch<{ total?: number; projects?: unknown[] }>('/projects?limit=1')
    return data.total ?? (data.projects?.length ?? 0)
  } catch { return 0 }
}

export async function getRecentEvents(limit = 10): Promise<PlatformEvent[]> {
  try {
    const data = await apiFetch<{ events?: PlatformEvent[] }>(`/events?limit=${limit}&sort=desc`)
    return data.events ?? []
  } catch { return [] }
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [metrics, alerts, userCount, projectCount] = await Promise.allSettled([
    getPlatformMetrics(),
    getPlatformAlerts(),
    getUserCount(),
    getProjectCount(),
  ])

  return {
    totalUsers:    userCount.status    === 'fulfilled' ? userCount.value    : 0,
    totalProjects: projectCount.status === 'fulfilled' ? projectCount.value : 0,
    activeAlerts:  alerts.status       === 'fulfilled' ? alerts.value.alerts.length : 0,
    metrics:       metrics.status      === 'fulfilled' ? metrics.value : { totalJobs: 0, successRate: 1, avgDuration: 0, activeWorkers: 0 },
  }
}
