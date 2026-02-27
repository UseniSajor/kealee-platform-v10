import type { FunnelSessionData } from './types'

const API_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
  : ''

interface CreateSessionResponse {
  id: string
}

interface SessionResponse {
  id: string
  userType: string | null
  projectType: string | null
  city: string | null
  state: string | null
  budget: string | null
  timeline: string | null
  currentStep: number
  status: string
}

export async function createSession(utmParams?: Record<string, string>): Promise<string> {
  const res = await fetch(`${API_URL}/funnel/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ utmParams }),
  })
  if (!res.ok) throw new Error('Failed to create funnel session')
  const data: CreateSessionResponse = await res.json()
  return data.id
}

export async function updateSession(
  sessionId: string,
  data: Partial<FunnelSessionData> & { currentStep?: number }
): Promise<void> {
  const res = await fetch(`${API_URL}/funnel/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update funnel session')
}

export async function getSession(sessionId: string): Promise<SessionResponse> {
  const res = await fetch(`${API_URL}/funnel/sessions/${sessionId}`)
  if (!res.ok) throw new Error('Failed to get funnel session')
  return res.json()
}

export async function triggerGeneration(sessionId: string): Promise<void> {
  const res = await fetch(`${API_URL}/funnel/sessions/${sessionId}/generate`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to trigger page generation')
}

export async function getProgress(sessionId: string): Promise<number> {
  const res = await fetch(`${API_URL}/funnel/sessions/${sessionId}/progress`)
  if (!res.ok) return 0
  const data = await res.json()
  return data.progress ?? 0
}

export async function getGeneratedPage(sessionId: string): Promise<unknown> {
  const res = await fetch(`${API_URL}/funnel/sessions/${sessionId}/page`)
  if (!res.ok) throw new Error('Page not ready')
  return res.json()
}
