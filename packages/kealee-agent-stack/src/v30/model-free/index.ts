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

export const MODEL_FREE_ENGINE_ID = 'kealee-model-free'

/** True when the operator has asked for no model at all. */
export function modelFreeForced(): boolean {
  return process.env.KEALEE_MODEL_FREE === 'true'
}

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
