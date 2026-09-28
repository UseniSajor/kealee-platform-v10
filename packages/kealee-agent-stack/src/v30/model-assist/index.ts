/**
 * Model assist — the hosted models, used only where Kealee's own engines stop.
 *
 * ORDER OF AUTHORITY
 *   1. Kealee's engines compute the deliverable (model-free/). Numbers, codes,
 *      jurisdictions and costs come only from there.
 *   2. Qwen — Kealee's internal model, served from INTERNAL_TEXT_BASE_URL
 *      (any OpenAI-compatible server: vLLM, TGI, Ollama) — handles routine
 *      language: polishing a narrative, drafting ops copy, first-pass
 *      reasoning on a scope the engines do not cover.
 *   3. Claude escalates: complex reasoning, or whenever Qwen is unavailable,
 *      fails, or returns something unusable.
 * With neither configured, or KEALEE_MODEL_FREE=true, every call returns
 * null and the engines' output stands.
 *
 * GUARDS
 *   · A rewrite of Kealee text is accepted only if it carries every number of
 *     the original and adds none (`numbersPreserved`). A model may make the
 *     prose better; it may not change a cost, a clearance or a count.
 *   · Every call is traced (`AssistTrace`) — task, provider, model, prompt,
 *     output — and the trace rides on the bot result into the knowledge
 *     registry. Outputs a person approves become Qwen training data
 *     (training/qwen/), Claude's included: that is how the internal model
 *     learns what the escalation model knows.
 */

import { modelFreeForced } from '../model-free/flags'
import { V30ClaudeCachedClient, resolveV30AnthropicModel } from '../v30-claude-client'

export type AssistProvider = 'qwen' | 'claude'
/** routine → Qwen first; complex → Claude first (Qwen if Claude is off). */
export type AssistTier = 'routine' | 'complex'

export interface AssistRequest {
  task: string
  system: string
  prompt: string
  tier?: AssistTier
  json?: boolean
  maxTokens?: number
  botType?: string
  /** Rejects an answer (so the next provider is tried); return a reason, or null to accept. */
  validate?: (text: string) => string | null
}

export interface AssistTrace {
  task: string
  botType?: string
  provider: AssistProvider
  model: string
  system: string
  prompt: string
  output: string
  accepted: boolean
  rejection?: string
  escalatedFrom?: AssistProvider
  latencyMs: number
}

/** `ok` false when no model produced an acceptable answer; the traces are kept either way (rejections are eval data). */
export interface AssistOutcome { ok: boolean; text: string; provider: AssistProvider | null; model: string | null; traces: AssistTrace[] }

export function qwenAvailable(): boolean {
  return !modelFreeForced() && process.env.INTERNAL_LLM_ENABLED === 'true' && Boolean(process.env.INTERNAL_TEXT_BASE_URL)
}
export function claudeAvailable(): boolean {
  return !modelFreeForced() && Boolean(process.env.ANTHROPIC_API_KEY) && process.env.KEALEE_CLAUDE_ASSIST !== 'false'
}
export function anyModelAvailable(): boolean { return qwenAvailable() || claudeAvailable() }

export function qwenModelName(): string { return process.env.INTERNAL_TEXT_MODEL ?? 'qwen' }

async function callQwen(req: AssistRequest): Promise<{ text: string; model: string }> {
  const base = (process.env.INTERNAL_TEXT_BASE_URL ?? '').replace(/\/$/, '')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Number(process.env.KEALEE_QWEN_TIMEOUT_MS ?? 60_000))
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST', signal: controller.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.INTERNAL_API_KEY ?? 'local'}` },
      body: JSON.stringify({
        model: qwenModelName(),
        messages: [{ role: 'system', content: req.system }, { role: 'user', content: req.prompt }],
        max_tokens: req.maxTokens ?? 1500, temperature: 0.3,
        ...(req.json ? { response_format: { type: 'json_object' } } : {}),
      }),
    })
    if (!res.ok) throw new Error(`Qwen HTTP ${res.status}`)
    const body = await res.json() as { choices?: { message?: { content?: string } }[]; model?: string }
    return { text: body.choices?.[0]?.message?.content ?? '', model: body.model ?? qwenModelName() }
  } finally { clearTimeout(timer) }
}

async function callClaude(req: AssistRequest): Promise<{ text: string; model: string }> {
  const model = resolveV30AnthropicModel(process.env.KEALEE_CLAUDE_ASSIST_MODEL ?? 'claude-sonnet')
  const r = await new V30ClaudeCachedClient().complete({
    model, maxTokens: req.maxTokens ?? 1500, system: req.system, user: req.prompt,
    botType: (req.botType ?? 'support') as never,
  })
  return { text: r.text, model }
}

function jsonProblem(text: string): string | null {
  const raw = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? text
  const s = raw.indexOf('{'); const e = raw.lastIndexOf('}')
  if (s < 0 || e <= s) return 'no JSON object'
  try { JSON.parse(raw.slice(s, e + 1)); return null } catch { return 'invalid JSON' }
}

/** Runs the request through Qwen and/or Claude, in tier order, until one answer is accepted. */
export async function assist(req: AssistRequest): Promise<AssistOutcome> {
  const order: AssistProvider[] = (req.tier ?? 'routine') === 'complex' ? ['claude', 'qwen'] : ['qwen', 'claude']
  const traces: AssistTrace[] = []
  let previous: AssistProvider | undefined
  for (const p of order) {
    if (p === 'qwen' ? !qwenAvailable() : !claudeAvailable()) continue
    const started = Date.now()
    let text = ''
    let model = p === 'qwen' ? qwenModelName() : 'claude'
    let rejection: string | null = null
    try {
      const r = p === 'qwen' ? await callQwen(req) : await callClaude(req)
      text = r.text; model = r.model
      rejection = !text.trim() ? 'empty answer' : req.json ? jsonProblem(text) : null
      if (!rejection && req.validate) rejection = req.validate(text)
    } catch (e) {
      rejection = e instanceof Error ? e.message : String(e)
    }
    traces.push({ task: req.task, botType: req.botType, provider: p, model, system: req.system, prompt: req.prompt, output: text,
      accepted: !rejection, ...(rejection ? { rejection } : {}), ...(previous ? { escalatedFrom: previous } : {}), latencyMs: Date.now() - started })
    if (!rejection) return { ok: true, text, provider: p, model, traces }
    previous = p
  }
  return { ok: false, text: '', provider: null, model: null, traces }
}

/** Every number in a text, normalised ("$12,345" → "12345", "7¾" kept as written). */
export function numbersIn(text: string): string[] {
  return [...text.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map(m => m[0].replace(/,/g, '').replace(/\.0+$/, ''))
}

/** True when `rewritten` carries every occurrence of every original number and introduces none. */
export function numbersPreserved(original: string, rewritten: string): string | null {
  const a = numbersIn(original); const b = numbersIn(rewritten)
  const count = (xs: string[]) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())
  const ca = count(a); const cb = count(b)
  const missing = [...ca.entries()].filter(([k, n]) => (cb.get(k) ?? 0) < n).map(([k]) => k)
  const added = [...cb.entries()].filter(([k, n]) => (ca.get(k) ?? 0) < n).map(([k]) => k)
  if (missing.length) return `dropped ${missing.slice(0, 5).join(', ')}`
  if (added.length) return `introduced ${added.slice(0, 5).join(', ')}`
  return null
}

const POLISH_SYSTEM =
  'You edit construction-project narratives for Kealee, a design-build platform. Rewrite the text so it reads clearly and warmly ' +
  'for a homeowner. Keep EVERY number, unit, dollar amount, code citation and fact exactly as written. Do not add facts, numbers, ' +
  'brands, prices, dates or promises. Return only the rewritten text.'

/** Polishes Kealee-written text with a model, or returns it unchanged. Never alters a number. */
export async function polishNarrative(text: string, context: { task: string; botType?: string }, traces: AssistTrace[]): Promise<string> {
  if (!text.trim() || !anyModelAvailable() || process.env.KEALEE_NARRATIVE_POLISH === 'off') return text
  const r = await assist({
    task: `narrative_polish:${context.task}`, botType: context.botType, tier: 'routine', system: POLISH_SYSTEM, prompt: text,
    maxTokens: Math.min(2000, Math.ceil(text.length / 2)),
    validate: out => numbersPreserved(text, out),
  })
  traces.push(...r.traces)
  return r.ok ? r.text.trim() : text
}
