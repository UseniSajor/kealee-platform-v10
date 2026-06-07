/**
 * V30 Claude client — same cached beta pattern as web-main ClaudeCachedClient.
 * Uses per-bot system prompts from Kealee Platform Agents specs.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { Message } from '@anthropic-ai/sdk/resources/messages'
import { maxTokensForWiredBot, useEphemeralCacheForBot } from './wired-bot-config'
import type { V30BotType } from './types'

export interface V30ClaudeCallResult {
  text: string
  inputTokens: number
  outputTokens: number
}

export class V30ClaudeCachedClient {
  private anthropic: Anthropic

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
    })
  }

  async complete(params: {
    model: string
    maxTokens: number
    system: string
    user: string
    botType?: V30BotType
  }): Promise<V30ClaudeCallResult> {
    const cache =
      params.botType === undefined || useEphemeralCacheForBot(params.botType)
    const systemBlocks = cache
      ? [
          {
            type: 'text' as const,
            text: params.system,
            cache_control: { type: 'ephemeral' as const },
          },
        ]
      : [{ type: 'text' as const, text: params.system }]

    // Cast through `any` so TypeScript doesn't widen to Stream|Message union.
    // The prompt-caching beta requires system to be a ContentBlock array, which
    // the SDK non-beta types don't accept — the runtime API handles both forms.
    const response = (await (this.anthropic.messages as any).create({
      model: params.model,
      max_tokens: params.maxTokens,
      system: systemBlocks,
      messages: [{ role: 'user', content: params.user }],
      ...(cache ? { betas: ['prompt-caching-2024-07-31'] } : {}),
    })) as Message

    const block = response.content[0]
    const text = block?.type === 'text' ? block.text : ''
    return {
      text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    }
  }
}

/** Map registry model ids to Anthropic API model strings (wired spec). */
export function resolveV30AnthropicModel(defaultModel: string): string {
  if (defaultModel.includes('opus')) return 'claude-opus-4-6'
  return 'claude-sonnet-4-20250514'
}

export function maxTokensForV30Bot(botType: V30BotType): number {
  return maxTokensForWiredBot(botType)
}
