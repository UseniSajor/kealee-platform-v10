/**
 * bots.router.ts
 *
 * Model routing abstraction for KeaBots.
 * Wraps the Anthropic API with:
 *   - Tiered model selection (fast / standard / premium)
 *   - Token budget enforcement
 *   - Cost estimation
 *   - JSON extraction helper
 *   - Conversation-format helper (multi-turn)
 */

import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam, TextBlock } from '@anthropic-ai/sdk/resources/messages'
import type { ModelTier, ConvMessage } from './bots.types'

// ── Constants ─────────────────────────────────────────────────────────────────

const MODEL_MAP: Record<ModelTier, string> = {
  fast:     'claude-haiku-4-5-20251001',
  standard: 'claude-sonnet-4-6',
  premium:  'claude-opus-4-6',
}

const TOKEN_LIMITS: Record<ModelTier, number> = {
  fast:     1024,
  standard: 4096,
  premium:  8192,
}

// USD per 1 000 tokens (approximate published rates)
const COST_INPUT: Record<string, number> = {
  'claude-haiku-4-5-20251001': 0.00025,
  'claude-sonnet-4-6':         0.003,
  'claude-opus-4-6':           0.015,
}
const COST_OUTPUT: Record<string, number> = {
  'claude-haiku-4-5-20251001': 0.00125,
  'claude-sonnet-4-6':         0.015,
  'claude-opus-4-6':           0.075,
}

// ── Client singleton ──────────────────────────────────────────────────────────

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ModelCallParams {
  systemPrompt: string
  userPrompt:   string
  tier?:        ModelTier
  model?:       string
  maxTokens?:   number
  temperature?: number
  history?:     ConvMessage[]
  timeoutMs?:   number  // default 25000ms — enforced on the Anthropic call
}

export interface ModelCallResult {
  content:           string
  model:             string
  inputTokens:       number
  outputTokens:      number
  estimatedCostUSD:  number
}

// ── Core call ─────────────────────────────────────────────────────────────────

export async function callModel(params: ModelCallParams): Promise<ModelCallResult> {
  const tier      = params.tier ?? 'standard'
  const model     = params.model ?? MODEL_MAP[tier]
  const maxTokens = params.maxTokens ?? TOKEN_LIMITS[tier]

  // Build messages array (optionally prepend conversation history)
  const messages: MessageParam[] = [
    ...(params.history?.map(m => ({ role: m.role, content: m.content })) ?? []),
    { role: 'user', content: params.userPrompt },
  ]

  const BOT_LLM_TIMEOUT_MS = params.timeoutMs ?? 25000

  const timeoutId = setTimeout(() => {
    throw new Error(`LLM call timed out after ${BOT_LLM_TIMEOUT_MS}ms — model: ${model}`)
  }, BOT_LLM_TIMEOUT_MS)

  let response: Anthropic.Message
  try {
    response = await getClient().messages.create({
      model,
      max_tokens:  maxTokens,
      temperature: params.temperature ?? 0.3,
      system:      params.systemPrompt,
      messages,
    })
  } finally {
    clearTimeout(timeoutId)
  }

  const content = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as TextBlock).text)
    .join('')

  const inputTokens  = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const costIn  = (inputTokens  / 1000) * (COST_INPUT[model]  ?? 0.003)
  const costOut = (outputTokens / 1000) * (COST_OUTPUT[model] ?? 0.015)

  return { content, model, inputTokens, outputTokens, estimatedCostUSD: costIn + costOut }
}

// ── JSON extraction ───────────────────────────────────────────────────────────

/**
 * Extract a JSON object from model output.
 * Handles both ```json ... ``` fenced blocks and bare JSON objects.
 * Returns `fallback` if parsing fails.
 */
export function parseJSON<T>(raw: string, fallback: T): T {
  // Try fenced block first
  const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  const candidate = fenced ? fenced[1] : raw.match(/(\{[\s\S]*\})/)?.[1]
  if (!candidate) return fallback
  try {
    return JSON.parse(candidate) as T
  } catch {
    return fallback
  }
}

// ── Cost guard ────────────────────────────────────────────────────────────────

// Simple in-memory rate limiter: max N calls per userId/orgId per sliding window
const _callLog = new Map<string, number[]>()

export interface CostGuardConfig {
  key:         string   // userId or orgId
  maxPerHour?: number   // default 50
  maxPerDay?:  number   // default 500
}

export function checkCostGuard(cfg: CostGuardConfig): { allowed: boolean; reason?: string } {
  const maxHour = cfg.maxPerHour ?? 50
  const maxDay  = cfg.maxPerDay  ?? 500
  const now     = Date.now()
  const key     = cfg.key

  const log = _callLog.get(key) ?? []
  const hourAgo = now - 3_600_000
  const dayAgo  = now - 86_400_000

  const inHour = log.filter(t => t > hourAgo).length
  const inDay  = log.filter(t => t > dayAgo).length

  if (inHour >= maxHour) {
    return { allowed: false, reason: `Rate limit: ${maxHour} calls/hour exceeded` }
  }
  if (inDay >= maxDay) {
    return { allowed: false, reason: `Rate limit: ${maxDay} calls/day exceeded` }
  }

  // Record and prune
  log.push(now)
  _callLog.set(key, log.filter(t => t > dayAgo))
  return { allowed: true }
}

export function isLLMAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}
