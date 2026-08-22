import { AnthropicClient as Anthropic } from '@kealee/core-llm'
import type { CardMediaSpec } from './card-media-spec'

const MARKETING_MEDIA_SYSTEM = `You are MarketingBot for Kealee — DC/MD/VA construction platform.
Write ONE DALL-E 3 image prompt (max 280 chars) for a square 1:1 marketing card.
Rules: photorealistic, no people, no logos, no watermarks, professional real-estate quality.
Return ONLY the prompt text, no quotes or markdown.`

/**
 * Optional MarketingBot pass — refines image description for concept-engine / DALL-E.
 */
export async function refineImagePromptWithMarketingBot(spec: CardMediaSpec): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return spec.imageDescription

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const res = await client.messages.create({
      model: process.env.ANTHROPIC_MARKETING_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 200,
      temperature: 0.4,
      system: MARKETING_MEDIA_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Card: ${spec.title} (${spec.scope}/${spec.id}). Style: ${spec.style}. Room: ${spec.roomType ?? 'general'}.
Brief: ${spec.imageDescription}`,
        },
      ],
    })
    const block = res.content.find((b) => b.type === 'text')
    const text = block && block.type === 'text' ? block.text.trim() : ''
    return text.length > 40 ? text : spec.imageDescription
  } catch (err) {
    console.warn('[card-media] MarketingBot prompt refine skipped:', err)
    return spec.imageDescription
  }
}
