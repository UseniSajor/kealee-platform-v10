/**
 * lib/api/bots.ts
 *
 * Typed API client for the KeaBots endpoints.
 * Used by the command-center /bots dashboard page.
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

export interface BotMeta {
  id:           string
  name:         string
  description:  string
  version:      string
  costProfile:  string
  requiresLLM:  boolean
}

export interface BotExecutionTrace {
  requestId:     string
  botId:         string
  startedAt:     string
  completedAt:   string
  durationMs:    number
  modelUsed?:    string
  inputTokens?:  number
  outputTokens?: number
  deterministic: boolean
  steps: Array<{
    stepId:         string
    type:           string
    name:           string
    inputSummary?:  string
    outputSummary?: string
    durationMs:     number
    error?:         string
  }>
  cost?: { estimatedUSD: number }
}

export interface BotExecuteResult {
  success: boolean
  result:  Record<string, unknown>
  trace:   BotExecutionTrace
  error?:  string
}

// ── API wrappers ──────────────────────────────────────────────────────────────

export async function listBots(): Promise<BotMeta[]> {
  const { bots } = await apiFetch<{ bots: BotMeta[] }>('/bots')
  return bots
}

export async function executeBot(
  botId: string,
  data:  Record<string, unknown>,
  options?: Record<string, unknown>,
): Promise<BotExecuteResult> {
  return apiFetch<BotExecuteResult>(`/bots/${botId}/execute`, {
    method: 'POST',
    body:   JSON.stringify({ data, options }),
  })
}

export async function listExecutions(params?: {
  botId?: string
  limit?: number
}): Promise<BotExecutionTrace[]> {
  const qs = new URLSearchParams()
  if (params?.botId) qs.set('botId', params.botId)
  if (params?.limit) qs.set('limit', String(params.limit))
  const { traces } = await apiFetch<{ traces: BotExecutionTrace[] }>(`/bots/executions?${qs}`)
  return traces
}

export async function getExecution(requestId: string): Promise<BotExecutionTrace> {
  const { trace } = await apiFetch<{ trace: BotExecutionTrace }>(`/bots/executions/${requestId}`)
  return trace
}
