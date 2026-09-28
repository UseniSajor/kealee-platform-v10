/**
 * Runs a v30 bot with no language model.
 *
 * Used when no model is configured (no ANTHROPIC_API_KEY, or
 * KEALEE_V30_LLM_ENABLED=false, or KEALEE_MODEL_FREE=true), and as the
 * fallback when a model call fails or returns unparseable output — so a paid
 * order never depends on a model being reachable.
 *
 * It replaces the old dry run, which returned status COMPLETE with
 * `{ dryRun: true }` and no deliverable: a paid order was "completed" with
 * nothing in it. A bot this module cannot compute is recorded FAILED with
 * `requiresHumanFulfillment: true` and the reason, so a person picks it up.
 */

import type { V30BotExecutionInput, V30BotExecutionResult } from '../types'
import { engineInputFrom, MODEL_FREE_ENGINES } from './engines'
import { assist, anyModelAvailable, polishNarrative, type AssistTrace } from '../model-assist'
import { getV30SystemPrompt } from '../prompts'
import { buildV30BotUserPrompt } from '../bot-task-prompts'

export const MODEL_FREE_ENGINE_ID = 'kealee-model-free'

export { modelFreeForced, botMode } from './flags'

export function executeV30BotWithoutModel(
  input: V30BotExecutionInput,
  context: { modelFailure?: string } = {},
): V30BotExecutionResult {
  const started = Date.now()
  const engine = MODEL_FREE_ENGINES[input.botType]
  const base = { botType: input.botType, modelUsed: MODEL_FREE_ENGINE_ID, tokensUsed: 0, costUSD: 0 }
  const staff = (reason: string, partial?: Record<string, unknown>): V30BotExecutionResult => ({
    ...base, status: 'FAILED', progress: 0, durationMs: Date.now() - started,
    outputData: { requiresHumanFulfillment: true, reason, engine: 'model-free', ...(context.modelFailure ? { modelFailure: context.modelFailure } : {}), ...(partial ? { partial } : {}) },
    errorMessage: `Needs staff: ${reason}`,
  })
  if (!engine) return staff(`No model-free engine for the ${input.botType} bot; it needs a model or a person.`)
  try {
    const r = engine(engineInputFrom(input.inputData ?? {}))
    if (r.kind === 'staff') return staff(r.reason, r.partial)
    return {
      ...base, status: 'COMPLETE', progress: 100, durationMs: Date.now() - started,
      outputData: { ...r.output, ...(context.modelFailure ? { modelFailure: context.modelFailure } : {}) },
    }
  } catch (e) {
    return staff(`Model-free ${input.botType} engine error: ${e instanceof Error ? e.message : String(e)}`)
  }
}

export { MODEL_FREE_ENGINES } from './engines'
export { COST_RECIPES, priceRecipe, recipeFor, regionFor } from './costs'

// ── Engine-first, with the hosted models where the engines stop ────────────


/** Bots whose model draft may complete them: ops-facing copy, no customer facts at stake. */
const MODEL_MAY_COMPLETE = new Set(['sales', 'marketing'])
/** Bots a model must never produce: it would invent the facts (contractor names, licences, reviews). */
const MODEL_NEVER = new Set(['contractor'])

function parseJson(text: string): Record<string, unknown> | null {
  const raw = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? text
  const s = raw.indexOf('{'); const e = raw.lastIndexOf('}')
  if (s < 0 || e <= s) return null
  try { return JSON.parse(raw.slice(s, e + 1)) as Record<string, unknown> } catch { return null }
}

async function polishOutput(botType: string, out: Record<string, unknown>, traces: AssistTrace[]): Promise<Record<string, unknown>> {
  const jobs: Promise<void>[] = []
  const polishField = (obj: Record<string, unknown>, key: string, task: string) => {
    const v = obj[key]
    if (typeof v !== 'string' || !v.trim()) return
    jobs.push(polishNarrative(v, { task, botType }, traces).then(t => {
      if (t !== v) { obj[`${key}Kealee`] = v; obj[key] = t }
    }))
  }
  polishField(out, 'summary', `${botType}.summary`)
  polishField(out, 'narrative', `${botType}.narrative`)
  for (const c of (Array.isArray(out.concepts) ? out.concepts : []) as Record<string, unknown>[]) polishField(c, 'narrative', `${botType}.concept`)
  await Promise.all(jobs)
  return out
}

/**
 * Produces a bot the way Kealee should: its own engine first, Qwen for
 * language and first-pass reasoning, Claude when the reasoning is beyond Qwen
 * or Qwen is not answering. The result's `modelTrace` records every model
 * call, for review and for training the internal model.
 */
export async function executeV30BotEngineFirst(input: V30BotExecutionInput): Promise<V30BotExecutionResult> {
  const computed = executeV30BotWithoutModel(input)
  const traces: AssistTrace[] = []
  const withTrace = (r: V30BotExecutionResult): V30BotExecutionResult => {
    if (!traces.length) return r
    const used = traces.filter(t => t.accepted).map(t => `${t.provider}:${t.model}`)
    return {
      ...r,
      modelUsed: used.length ? `${MODEL_FREE_ENGINE_ID}+${[...new Set(used)].join('+')}` : r.modelUsed,
      outputData: { ...(r.outputData ?? {}), modelTrace: traces },
    }
  }
  if (!anyModelAvailable()) return computed

  if (computed.status === 'COMPLETE' && computed.outputData) {
    const polished = await polishOutput(input.botType, { ...computed.outputData }, traces)
    return withTrace({ ...computed, outputData: polished })
  }

  // The engine could not produce it. Reason with a model — never for a bot
  // whose facts a model would have to invent.
  if (MODEL_NEVER.has(input.botType)) return computed
  const outcome = await assist({
    task: `bot_gap:${input.botType}`, botType: input.botType,
    // Ops copy is routine; a customer deliverable the engines cannot compute is the hard case.
    tier: MODEL_MAY_COMPLETE.has(input.botType) ? 'routine' : 'complex',
    json: true, maxTokens: 6000,
    system: getV30SystemPrompt(input.botType),
    prompt: buildV30BotUserPrompt(input.botType, input.inputData ?? {}),
  })
  traces.push(...outcome.traces)
  const draft = outcome.ok ? parseJson(outcome.text) : null
  if (!draft) return withTrace(computed)
  if (MODEL_MAY_COMPLETE.has(input.botType)) {
    return withTrace({
      ...computed, status: 'COMPLETE', progress: 100, errorMessage: undefined,
      outputData: { ...draft, generatedBy: `${outcome.provider}:${outcome.model}`, engine: 'model-assist' },
    })
  }
  // A customer deliverable drafted by a model is a starting point for staff, not a delivery.
  return withTrace({
    ...computed,
    outputData: { ...(computed.outputData ?? {}), modelDraft: draft, modelDraftBy: `${outcome.provider}:${outcome.model}` },
  })
}
