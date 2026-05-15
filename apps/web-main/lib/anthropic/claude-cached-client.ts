import Anthropic from '@anthropic-ai/sdk'

export interface ClaudeMessageParams {
  model: string
  max_tokens: number
  system?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

export class ClaudeCachedClient {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }

  async message(params: ClaudeMessageParams) {
    const { system, ...rest } = params

    return this.client.messages.create({
      ...rest,
      ...(system
        ? {
            system: [
              {
                type: 'text' as const,
                text: system,
                cache_control: { type: 'ephemeral' as const },
              },
            ],
          }
        : {}),
    })
  }
}
