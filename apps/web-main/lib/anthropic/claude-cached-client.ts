/**
 * ClaudeCachedClient
 *
 * Thin wrapper around the Anthropic SDK that automatically applies
 * Anthropic prompt-caching headers to system prompts (cache_control: ephemeral).
 * Caching reduces latency and cost on repeated calls that share the same
 * system prompt (e.g. SMS classification, lead qualification).
 *
 * Uses the beta messages API (prompt-caching-2024-07-31) required by SDK v0.30.x.
 *
 * Usage:
 *   const client = new ClaudeCachedClient()
 *   const response = await client.message({ model, max_tokens, system, messages })
 *   const text = response.content[0].type === 'text' ? response.content[0].text : ''
 */

import Anthropic from '@anthropic-ai/sdk'

type MessageParams = {
  model: string
  max_tokens: number
  system?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

export class ClaudeCachedClient {
  private anthropic: Anthropic

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
    })
  }

  async message(params: MessageParams): Promise<Anthropic.Beta.Messages.BetaMessage> {
    const { model, max_tokens, system, messages } = params

    // Build system array with cache_control when a system prompt is provided.
    // The ephemeral cache persists for ~5 minutes — sufficient for burst traffic.
    const systemContent: Anthropic.Beta.Messages.BetaTextBlockParam[] | undefined = system
      ? [
          {
            type: 'text',
            text: system,
            cache_control: { type: 'ephemeral' },
          },
        ]
      : undefined

    return this.anthropic.beta.messages.create({
      model,
      max_tokens,
      ...(systemContent ? { system: systemContent } : {}),
      messages,
      betas: ['prompt-caching-2024-07-31'],
    })
  }
}
