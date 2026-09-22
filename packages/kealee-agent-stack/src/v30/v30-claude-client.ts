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
    // `system` as a ContentBlock array is accepted by the standard endpoint.
    //
    // No `betas` here. Prompt caching is GA — `cache_control` on the system
    // block is the whole mechanism. Sending `betas` to `messages.create` (the
    // non-beta endpoint) is rejected with
    // `400 invalid_request_error: betas: Extra inputs are not permitted`,
    // which failed every cache-enabled bot. `betas` is only valid on
    // `anthropic.beta.messages.create`.
    const response = (await (this.anthropic.messages as any).create({
      model: params.model,
      max_tokens: params.maxTokens,
      system: systemBlocks,
      messages: [{ role: 'user', content: params.user }],
    })) as Message

    // Take the first TEXT block, not content[0]. These bots run on
    // claude-opus-5 / claude-sonnet-5, where thinking is on by default, so
    // content[0] is a thinking block and content[0].type === 'text' is false.
    // Reading content[0] yielded '' on every uncached bot — a 200 response
    // that then died in extractJsonObject as "<Bot> JSON parse failed".
    const text = response.content.find((b) => b.type === 'text')?.text ?? ''
    return {
      text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    }
  }
}

/** Map registry model ids to Anthropic API model strings (wired spec). */
export function resolveV30AnthropicModel(defaultModel: string): string {
  if (defaultModel.includes('opus')) return 'claude-opus-5'
  return 'claude-sonnet-5'
}

export function maxTokensForV30Bot(botType: V30BotType): number {
  return maxTokensForWiredBot(botType)
}
