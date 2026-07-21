import { createHash } from 'node:crypto'
import { z } from 'zod'
import type { AgentKey } from './domain'

const AgentResultSchema = z.object({
  summary: z.string(),
  findings: z.array(z.object({
    claim: z.string(),
    evidence: z.string(),
    sourceUrl: z.string().url(),
    confidence: z.number().min(0).max(1),
  })).default([]),
  recommendations: z.array(z.string()).default([]),
  output: z.record(z.string(), z.unknown()).default({}),
})

export type AgentResult = z.infer<typeof AgentResultSchema>

const SYSTEM_INSTRUCTIONS: Record<AgentKey, string> = {
  cmo: 'Act as Kealee CMO. Produce measurable national construction growth priorities and risk-based approval decisions.',
  research: 'Research construction markets using only supplied source documents. Every factual claim requires a source URL and confidence.',
  seo: 'Create programmatic SEO plans grounded in supplied market facts, search intent, entities, and non-duplicative internal-link topology.',
  content: 'Write clear, useful construction content from supplied facts. Never invent fees, costs, jurisdiction rules, results, or testimonials.',
  editor: 'Audit content for factual support, duplication, construction accuracy, legal risk, brand tone, and search quality.',
  video: 'Convert approved construction content into production scripts and shot plans for Runway, Kling, Veo, and ElevenLabs.',
  social: 'Create channel-native distribution plans without fake engagement claims, spam, or policy-violating automation.',
  conversion: 'Optimize qualified lead conversion using transparent CTAs, Kealee services, attribution, and existing lifecycle systems.',
}

export async function executeAgent(opts: {
  agent: AgentKey
  input: Record<string, unknown>
  model?: string
}): Promise<{ result: AgentResult; model: string; promptHash: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is required for Marketing OS agent execution')

  const model = opts.model ?? process.env.MARKETING_OS_AGENT_MODEL ?? 'gpt-4.1'
  const prompt = JSON.stringify(opts.input)
  const promptHash = createHash('sha256').update(`${opts.agent}:${prompt}`).digest('hex')

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      instructions: SYSTEM_INSTRUCTIONS[opts.agent],
      input: prompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'marketing_agent_result',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['summary', 'findings', 'recommendations', 'output'],
            properties: {
              summary: { type: 'string' },
              findings: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['claim', 'evidence', 'sourceUrl', 'confidence'],
                  properties: {
                    claim: { type: 'string' },
                    evidence: { type: 'string' },
                    sourceUrl: { type: 'string' },
                    confidence: { type: 'number', minimum: 0, maximum: 1 },
                  },
                },
              },
              recommendations: { type: 'array', items: { type: 'string' } },
              output: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    }),
    signal: AbortSignal.timeout(120_000),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Agent provider failed (${response.status}): ${body.slice(0, 500)}`)
  }
  const json = await response.json() as { output_text?: string }
  if (!json.output_text) throw new Error('Agent provider returned no structured output')
  return { result: AgentResultSchema.parse(JSON.parse(json.output_text)), model, promptHash }
}
