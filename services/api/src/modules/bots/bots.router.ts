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

import { AnthropicClient as Anthropic } from '@kealee/core-llm'
import type { MessageParam, TextBlock } from '@anthropic-ai/sdk/resources/messages/messages'
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

  let response: any
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

// ── Agentic types ─────────────────────────────────────────────────────────────

/**
 * A tool that can be invoked by the model during an agentic loop.
 * input_schema follows the Anthropic tool definition format.
 */
export interface AgenticTool {
  name:         string
  description:  string
  input_schema: {
    type:       'object'
    properties: Record<string, { type: string; description: string }>
    required?:  string[]
  }
  handler(input: Record<string, unknown>): Promise<unknown>
}

export interface AgenticCallParams {
  systemPrompt:   string
  userPrompt:     string
  tools:          AgenticTool[]
  tier?:          ModelTier
  model?:         string
  maxTokens?:     number
  temperature?:   number
  /** Default 10 — matches the System A KeaBot tool-use loop iteration limit */
  maxIterations?: number
  history?:       ConvMessage[]
  timeoutMs?:     number
}

export interface AgenticCallResult extends ModelCallResult {
  /** Number of API calls made (1 = single-turn, >1 = tool-use iterations) */
  iterations:   number
  /** Ordered list of tool names invoked across all iterations */
  toolsInvoked: string[]
  stoppedBy:    'end_turn' | 'max_iterations'
}

// ── callModelAgentic ──────────────────────────────────────────────────────────

/**
 * 10-iteration agentic tool-use loop.  Mirrors System A KeaBot behaviour.
 *
 * - On each iteration the model is called with the full message history + tools
 * - stop_reason='tool_use' → execute all requested tools, append results, loop
 * - stop_reason='end_turn' → extract text content and return
 * - maxIterations guard prevents runaway loops (default 10)
 * - Unknown tool name  → error tool_result (model can recover gracefully)
 * - Handler throws     → error tool_result (model can recover gracefully)
 * - Tokens are summed across all iterations for accurate cost tracking
 */
export async function callModelAgentic(params: AgenticCallParams): Promise<AgenticCallResult> {
  const tier          = params.tier ?? 'standard'
  const model         = params.model ?? MODEL_MAP[tier]
  const maxTokens     = params.maxTokens ?? TOKEN_LIMITS[tier]
  const maxIterations = params.maxIterations ?? 10
  const BOT_LLM_TIMEOUT_MS = params.timeoutMs ?? 60_000

  // Use any[] for message accumulation — the Anthropic SDK content types for
  // assistant (ContentBlock[]) and tool results (ToolResultBlockParam[]) are
  // not assignable to MessageParam['content'] in all SDK versions.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [
    ...(params.history?.map(m => ({ role: m.role, content: m.content })) ?? []),
    { role: 'user', content: params.userPrompt },
  ]

  // Anthropic tool definition format (cast through unknown — cache_control pattern)
  const toolDefs = params.tools.map(t => ({
    name:         t.name,
    description:  t.description,
    input_schema: t.input_schema,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any

  let totalInputTokens  = 0
  let totalOutputTokens = 0
  let iterations        = 0
  const toolsInvoked:   string[] = []
  let lastTextContent   = ''
  let stoppedBy: 'end_turn' | 'max_iterations' = 'max_iterations'

  while (iterations < maxIterations) {
    iterations++

    const timeoutId = setTimeout(() => {
      throw new Error(
        `Agentic LLM call timed out after ${BOT_LLM_TIMEOUT_MS}ms — model: ${model}, iteration: ${iterations}`,
      )
    }, BOT_LLM_TIMEOUT_MS)

    let response: any
    try {
      response = await getClient().messages.create({
        model,
        max_tokens:  maxTokens,
        temperature: params.temperature ?? 0.3,
        system:      params.systemPrompt,
        tools:       toolDefs,
        messages,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    totalInputTokens  += response.usage.input_tokens
    totalOutputTokens += response.usage.output_tokens

    // Capture text content from this turn
    const textBlocks = response.content.filter((b): b is TextBlock => b.type === 'text')
    if (textBlocks.length > 0) {
      lastTextContent = textBlocks.map(b => b.text).join('')
    }

    if (response.stop_reason === 'end_turn') {
      stoppedBy = 'end_turn'
      break
    }

    if (response.stop_reason === 'tool_use') {
      // Append full assistant response — preserves tool_use blocks required by API
      messages.push({ role: 'assistant', content: response.content })

      // Execute each tool_use block and collect results
      const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = []

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        // Inline type — avoids importing ToolUseBlock which SDK may not export from all paths
        const tu = block as { type: 'tool_use'; id: string; name: string; input: unknown }
        toolsInvoked.push(tu.name)

        const toolDef = params.tools.find(t => t.name === tu.name)
        let toolOutput: unknown

        if (toolDef) {
          try {
            toolOutput = await toolDef.handler(tu.input as Record<string, unknown>)
          } catch (err: unknown) {
            toolOutput = { error: err instanceof Error ? err.message : String(err) }
          }
        } else {
          toolOutput = { error: `Unknown tool: ${tu.name}` }
        }

        toolResults.push({
          type:        'tool_result',
          tool_use_id: tu.id,
          content:     JSON.stringify(toolOutput),
        })
      }

      messages.push({ role: 'user', content: toolResults })
      continue
    }

    // Any other stop reason (max_tokens, stop_sequence) — exit loop
    break
  }

  const costIn  = (totalInputTokens  / 1000) * (COST_INPUT[model]  ?? 0.003)
  const costOut = (totalOutputTokens / 1000) * (COST_OUTPUT[model] ?? 0.015)

  return {
    content:          lastTextContent,
    model,
    inputTokens:      totalInputTokens,
    outputTokens:     totalOutputTokens,
    estimatedCostUSD: costIn + costOut,
    iterations,
    toolsInvoked,
    stoppedBy,
  }
}

// buildRAGTool() lives in bots.rag-tool.ts to avoid coupling this module to
// the RAG retriever (which would affect module loading in existing tests).
