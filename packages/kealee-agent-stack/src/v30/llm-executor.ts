import { ClaudeCachedClient } from '@kealee/core-bots'
import { getV30Bot } from './bots'
import { v30DryRunExecution } from './orchestrator'
import type { V30BotExecutionInput, V30BotExecutionResult } from './types'

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

/**
 * Live LLM for DesignBot; other bots remain deterministic stubs until wired.
 */
export async function executeV30BotWithLlm(
  input: V30BotExecutionInput & { systemPrompt: string },
): Promise<V30BotExecutionResult> {
  const def = getV30Bot(input.botType)
  const started = Date.now()

  if (input.botType !== 'design' || !process.env.ANTHROPIC_API_KEY) {
    return v30DryRunExecution(input)
  }

  const client = new ClaudeCachedClient()
  const userPrompt = `Analyze this project intake and return DesignBot output as JSON only.

Intake and context:
${JSON.stringify(input.inputData, null, 2)}

Required: 3 concepts (BUDGET, BALANCED, PREMIUM) per system prompt schema.`

  try {
    const result = await client.callClaudeWithCache(
      `v30-design-${input.projectId}`,
      userPrompt,
      def.defaultModel.replace('claude-opus-4-1', 'claude-sonnet-4-20250514'),
      { botType: 'design', projectId: input.projectId },
    )

    const parsed = extractJsonObject(result.content)
    const tokens = result.cacheMetrics.inputTokens + result.cacheMetrics.outputTokens

    return {
      botType: 'design',
      status: parsed ? 'COMPLETE' : 'FAILED',
      progress: parsed ? 100 : 0,
      outputData: parsed ?? { raw: result.content.slice(0, 8000), parseError: true },
      modelUsed: def.defaultModel,
      tokensUsed: tokens,
      costUSD: def.estimatedCostUsd,
      durationMs: Date.now() - started,
      errorMessage: parsed ? undefined : 'DesignBot JSON parse failed',
    }
  } catch (err: unknown) {
    return {
      botType: 'design',
      status: 'FAILED',
      progress: 0,
      outputData: { error: err instanceof Error ? err.message : 'DesignBot LLM failed' },
      modelUsed: def.defaultModel,
      tokensUsed: 0,
      costUSD: 0,
      durationMs: Date.now() - started,
      errorMessage: err instanceof Error ? err.message : 'DesignBot LLM failed',
    }
  }
}

export function shouldUseV30Llm(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY && process.env.KEALEE_V30_LLM_ENABLED !== 'false')
}
