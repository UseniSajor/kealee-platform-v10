import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

/**
 * AIProvider — Claude primary, OpenAI automatic fallback.
 * See: _docs/kealee-architecture.md §15
 *
 * AI THINKS inside claws — it does not RUN them.
 */
export class AIProvider {
  private claude: Anthropic;
  private openai: OpenAI;

  constructor() {
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Reason about a task with context.
   * Claude is primary (claude-sonnet-4-5-20250929). Auto-failover to OpenAI gpt-4o-mini.
   */
  async reason(params: {
    task: string;
    context: Record<string, unknown>;
    schema?: Record<string, unknown>;
    provider?: 'claude' | 'openai';
    model?: string;
    systemPrompt?: string;
  }): Promise<string> {
    const systemPrompt =
      params.systemPrompt ??
      'You are a construction management AI assistant for the Kealee platform. Provide precise, actionable responses based on the data provided.';

    const userMessage = `Task: ${params.task}\n\nContext:\n${JSON.stringify(params.context, null, 2)}${
      params.schema ? `\n\nExpected Output Schema:\n${JSON.stringify(params.schema, null, 2)}` : ''
    }`;

    // Try Claude first (default), fall back to OpenAI
    if (params.provider !== 'openai') {
      try {
        const response = await this.claude.messages.create({
          model: params.model ?? 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        });

        return this.parseClaudeResponse(response);
      } catch (err) {
        console.warn('[AIProvider] Claude failed, falling back to OpenAI:', (err as Error).message);
        return this.reason({ ...params, provider: 'openai' });
      }
    }

    // OpenAI fallback
    try {
      const response = await this.openai.chat.completions.create({
        model: params.model ?? 'gpt-4o-mini',
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      });

      return response.choices[0]?.message?.content ?? '';
    } catch (err) {
      console.error('[AIProvider] OpenAI also failed:', (err as Error).message);
      throw new Error(`AI reasoning failed: both Claude and OpenAI unavailable`);
    }
  }

  /**
   * Analyze an image — ALWAYS uses Claude Vision API.
   */
  async analyzeImage(imageUrl: string, task: string): Promise<string> {
    try {
      const response = await this.claude.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'url', url: imageUrl },
              },
              {
                type: 'text',
                text: task,
              },
            ],
          },
        ],
      });

      return this.parseClaudeResponse(response);
    } catch (err) {
      console.error('[AIProvider] Image analysis failed:', (err as Error).message);
      throw err;
    }
  }

  /**
   * Extract text content from Claude API response.
   */
  private parseClaudeResponse(response: { content: Array<{ type: string; text?: string }> }): string {
    for (const block of response.content) {
      if (block.type === 'text') return block.text ?? '';
    }
    return '';
  }
}
