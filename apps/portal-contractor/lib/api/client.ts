/**
 * portal-contractor/lib/api/client.ts
 *
 * Authenticated fetch wrapper for the Kealee API.
 * Reads NEXT_PUBLIC_API_URL and injects the Supabase JWT on every request.
 */

import { getAuthToken } from '@/lib/supabase'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAuthToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    let body: unknown
    try { body = await res.json() } catch { /* ignore */ }
    const message =
      (body as any)?.error ?? `API error ${res.status}`
    throw new ApiError(res.status, message, body)
  }

  return res.json() as Promise<T>
}
