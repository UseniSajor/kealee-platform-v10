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
  /**
   * Why generation stopped. `max_tokens` means the body was cut off and any
   * JSON in it is incomplete — callers should report truncation rather than a
   * parse failure, which is what made the original bug so hard to read.
   */
  stopReason: string | null
  /** True when the response hit the token ceiling and is therefore partial. */
  truncated: boolean
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
    const request = {
      model: params.model,
      max_tokens: params.maxTokens,
      system: systemBlocks,
      messages: [{ role: 'user', content: params.user }],
    }
    // Anthropic rejects potentially >10-minute non-streaming requests. Design
    // and floorplan intentionally have 32k-token ceilings so their JSON is not
    // truncated; use the SDK streaming helper and await the final assembled
    // Message. This keeps the downstream parser unchanged while satisfying
    // the long-request contract.
    const response = (params.maxTokens > 16_000
      ? await (this.anthropic.messages as any).stream(request).finalMessage()
      : await (this.anthropic.messages as any).create(request)) as Message

    // Take the first TEXT block, not content[0]. These bots run on
    // claude-opus-5 / claude-sonnet-5, where thinking is on by default, so
    // content[0] is a thinking block and content[0].type === 'text' is false.
    // Reading content[0] yielded '' on every uncached bot — a 200 response
    // that then died in extractJsonObject as "<Bot> JSON parse failed".
    const text = response.content.find((b) => b.type === 'text')?.text ?? ''
    const stopReason = response.stop_reason ?? null
    return {
      text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      stopReason,
      truncated: stopReason === 'max_tokens',
    }
  }
}

/**
 * Map registry model ids to Anthropic API model strings.
 *
 * Every bot runs on Opus. These bots produce what the customer paid for —
 * design directions, an estimate, a zoning read, a permit scope — and a
 * cheaper model on any one of them shows up in the delivered package, not in
 * the bill. The previous fallback silently downgraded every non-design bot to
 * Sonnet.
 */
export function resolveV30AnthropicModel(_defaultModel: string): string {
  return 'claude-opus-5'
}

export function maxTokensForV30Bot(botType: V30BotType): number {
  return maxTokensForWiredBot(botType)
}
