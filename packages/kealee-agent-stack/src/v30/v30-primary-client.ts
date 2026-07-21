import OpenAI from 'openai'
import { V30ClaudeCachedClient, resolveV30AnthropicModel } from './v30-claude-client'
import type { V30BotType } from './types'

export interface V30CompletionResult {
  text: string
  inputTokens: number
  outputTokens: number
  model: string
  provider: 'openai' | 'anthropic'
  fallbackUsed: boolean
}

const OPENAI_PRIMARY_BOTS = new Set<V30BotType>(['design', 'estimate', 'zoning', 'permit'])

export function resolveV30OpenAIModel(): string {
  return process.env.KEALEE_OPENAI_PRIMARY_MODEL ?? 'gpt-5.6-sol'
}

/** OpenAI-first completion for customer deliverables, with Claude as operational fallback. */
export async function completeV30WithFallback(params: {
  botType: V30BotType
  system: string
  user: string
  maxTokens: number
  anthropicDefaultModel: string
}): Promise<V30CompletionResult> {
  if (OPENAI_PRIMARY_BOTS.has(params.botType) && process.env.OPENAI_API_KEY) {
    try {
      const model = resolveV30OpenAIModel()
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const response = await openai.responses.create({
        model,
        instructions: params.system,
        input: params.user,
        max_output_tokens: params.maxTokens,
        text: { format: { type: 'json_object' }, verbosity: 'low' },
      })
      return {
        text: response.output_text,
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        model,
        provider: 'openai',
        fallbackUsed: false,
      }
    } catch (error) {
      if (!process.env.ANTHROPIC_API_KEY) throw error
      console.warn(`[v30-provider] OpenAI ${params.botType} execution failed; using Claude fallback`)
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(`No configured LLM provider for ${params.botType}`)
  }
  const model = resolveV30AnthropicModel(params.anthropicDefaultModel)
  const result = await new V30ClaudeCachedClient().complete({
    model,
    maxTokens: params.maxTokens,
    system: params.system,
    user: params.user,
    botType: params.botType,
  })
  return { ...result, model, provider: 'anthropic', fallbackUsed: true }
}

export function hasV30LlmProvider(): boolean {
  return Boolean((process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) && process.env.KEALEE_V30_LLM_ENABLED !== 'false')
}
