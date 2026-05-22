import { getV30Bot, V30_PARALLEL_BOT_TYPES } from './bots'
import { buildV30BotUserPrompt } from './bot-task-prompts'
import { getV30SystemPrompt } from './prompts'
import { v30DryRunExecution } from './orchestrator'
import {
  maxTokensForV30Bot,
  resolveV30AnthropicModel,
  V30ClaudeCachedClient,
} from './v30-claude-client'
import type { V30BotExecutionInput, V30BotExecutionResult, V30BotType } from './types'

function extractJsonObject(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced?.[1]?.trim() ?? text.trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

function isLlmBot(botType: V30BotType): boolean {
  return botType === 'intake' || V30_PARALLEL_BOT_TYPES.includes(botType)
}

/**
 * Execute any of the 10 KeaBot v3.0 post-payment bots via cached Claude + Platform Agents prompts.
 */
export async function executeV30BotWithLlm(
  input: V30BotExecutionInput & { systemPrompt: string },
): Promise<V30BotExecutionResult> {
  const def = getV30Bot(input.botType)
  const started = Date.now()

  if (!shouldUseV30Llm() || !isLlmBot(input.botType)) {
    return v30DryRunExecution(input)
  }

  const client = new V30ClaudeCachedClient()
  const system = input.systemPrompt || getV30SystemPrompt(input.botType)
  const user = buildV30BotUserPrompt(input.botType, input.inputData)
  const model = resolveV30AnthropicModel(def.defaultModel)

  try {
    const result = await client.complete({
      model,
      maxTokens: maxTokensForV30Bot(input.botType),
      system,
      user,
      botType: input.botType,
    })

    const parsed = extractJsonObject(result.text)
    const tokens = result.inputTokens + result.outputTokens

    return {
      botType: input.botType,
      status: parsed ? 'COMPLETE' : 'FAILED',
      progress: parsed ? 100 : 0,
      outputData: parsed ?? {
        raw: result.text.slice(0, 12_000),
        parseError: true,
        bot: def.displayName,
      },
      modelUsed: model,
      tokensUsed: tokens,
      costUSD: def.estimatedCostUsd,
      durationMs: Date.now() - started,
      errorMessage: parsed ? undefined : `${def.displayName} JSON parse failed`,
    }
  } catch (err: unknown) {
    return {
      botType: input.botType,
      status: 'FAILED',
      progress: 0,
      outputData: {
        error: err instanceof Error ? err.message : `${def.displayName} LLM failed`,
      },
      modelUsed: model,
      tokensUsed: 0,
      costUSD: 0,
      durationMs: Date.now() - started,
      errorMessage: err instanceof Error ? err.message : `${def.displayName} LLM failed`,
    }
  }
}

export function shouldUseV30Llm(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY && process.env.KEALEE_V30_LLM_ENABLED !== 'false')
}

/** All 10 parallel post-payment bots (Kealee Platform Agents KeaBot v3.0). */
export { V30_PARALLEL_BOT_TYPES }
