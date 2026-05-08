/**
 * marketing.bot.ts
 *
 * MarketingBot — HTTP-executable marketing / growth orchestration for the API.
 * Domain and outputs align with `bots/keabot-marketing` (launch playbooks, lead capture,
 * scoring hints) while using the shared `callModel` path (no duplicate Anthropic client).
 *
 * Typical flow: MarketingBot proposes campaigns and capture mechanics → visitor hits
 * LeadBot / intake for conversational qualification (see `handoffToLeadBot`).
 */

import { callModel, parseJSON, isLLMAvailable } from '../bots.router'
import { startStep, recordTrace } from '../bots.logger'
import type {
  IBot,
  BotInput,
  BotOutput,
  BotContext,
  BotStep,
  MarketingBotInput,
  MarketingBotOutput,
  MarketingPlaybookStep,
} from '../bots.types'

const SYSTEM_PROMPT = `You are MarketingBot for Kealee — a construction marketplace and OS (DC / MD / VA focus).

You help operators plan demand generation: landing hooks, email/social sequences, lead capture,
and lightweight scoring hints that feed contractor routing later.

Rules:
- Never invent dollar prices for Kealee products; describe CTAs generically (e.g. "Start intake", "Book consult").
- Prefer measurable steps (UTM, form fields, thank-you page, GHL / CRM handoff).
- Keep JSON valid and concise.`

function buildUserPrompt(data: MarketingBotInput): string {
  const ch = (data.channels ?? []).join(', ') || 'web + email'
  return [
    `Goal: ${data.goal}`,
    `Brief: ${data.brief}`,
    data.audience ? `Audience: ${data.audience}` : '',
    data.geography ? `Geography: ${data.geography}` : '',
    `Channels: ${ch}`,
    '',
    'Return ONLY a JSON object (no markdown fences) with this exact shape:',
    '{',
    '  "executiveSummary": string,',
    '  "playbook": [ { "title": string, "actions": string[], "timeframeDays"?: number } ],',
    '  "leadCaptureIdeas": string[],',
    '  "suggestedCTAs": string[],',
    '  "scoringHints": [ { "factor": string, "rationale": string } ],',
    '  "handoffToLeadBot": boolean',
    '}',
  ]
    .filter(Boolean)
    .join('\n')
}

function fallbackOutput(data: MarketingBotInput): MarketingBotOutput {
  const playbook: MarketingPlaybookStep[] = [
    {
      title: 'Clarify offer & ICP',
      actions: ['Define one primary CTA', 'List 3 pain points the brief addresses'],
      timeframeDays: 1,
    },
    {
      title: 'Capture & route',
      actions: ['Short form: project type, location, budget band', 'Thank-you + next step to LeadBot / intake'],
      timeframeDays: 2,
    },
  ]

  return {
    executiveSummary:
      `Offline plan for goal "${data.goal}" — connect LLM (ANTHROPIC_API_KEY) for full copy and sequencing.`,
    playbook,
    leadCaptureIdeas: [
      'Progressive form: email → project type → ZIP → budget band',
      'Optional phone for hot leads only',
    ],
    suggestedCTAs: ['Start your project', 'See if we serve your area', 'Talk to a specialist'],
    scoringHints: [
      { factor: 'budget_band', rationale: 'Higher stated budget → warmer routing' },
      { factor: 'geo_in_service_area', rationale: 'DMV match improves contractor match rate' },
    ],
    handoffToLeadBot: true,
  }
}

export class MarketingBot implements IBot<MarketingBotInput, MarketingBotOutput> {
  readonly id = 'marketing-bot' as const
  readonly name = 'MarketingBot'
  readonly description =
    'Plans campaigns, lead capture, and scoring hints (aligned with keabot-marketing); hands off to LeadBot for qualification'
  readonly version = '1.0.0'
  readonly costProfile = 'medium' as const
  readonly requiresLLM = true

  async execute(
    input: BotInput<MarketingBotInput>,
    ctx: BotContext,
  ): Promise<BotOutput<MarketingBotOutput>> {
    const { data } = input
    const requestId = ctx.requestId
    const startedAt = new Date()
    const steps: BotStep[] = []

    const briefTimer = startStep('deterministic', 'normalize_brief', data.brief.slice(0, 80))
    steps.push(briefTimer.finish(`goal=${data.goal}`))

    let out = fallbackOutput(data)
    let modelUsed: string | undefined
    let inputTokens = 0
    let outputTokens = 0
    let costUSD = 0

    if (isLLMAvailable()) {
      const llmTimer = startStep('llm', 'marketing_plan', data.goal)
      try {
        const result = await callModel({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: buildUserPrompt(data),
          history: [],
          tier: 'standard',
          maxTokens: 1200,
          temperature: 0.35,
        })
        const parsed = parseJSON<MarketingBotOutput>(result.content, out)
        out = {
          executiveSummary: parsed.executiveSummary ?? out.executiveSummary,
          playbook: Array.isArray(parsed.playbook) && parsed.playbook.length ? parsed.playbook : out.playbook,
          leadCaptureIdeas:
            Array.isArray(parsed.leadCaptureIdeas) && parsed.leadCaptureIdeas.length
              ? parsed.leadCaptureIdeas
              : out.leadCaptureIdeas,
          suggestedCTAs:
            Array.isArray(parsed.suggestedCTAs) && parsed.suggestedCTAs.length
              ? parsed.suggestedCTAs
              : out.suggestedCTAs,
          scoringHints:
            Array.isArray(parsed.scoringHints) && parsed.scoringHints.length
              ? parsed.scoringHints
              : out.scoringHints,
          handoffToLeadBot: typeof parsed.handoffToLeadBot === 'boolean' ? parsed.handoffToLeadBot : true,
        }
        modelUsed = result.model
        inputTokens = result.inputTokens
        outputTokens = result.outputTokens
        costUSD = result.estimatedCostUSD
        steps.push(llmTimer.finish(out.executiveSummary.slice(0, 80)))
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        steps.push(llmTimer.finish(undefined, msg))
      }
    }

    const completedAt = new Date()
    const trace = {
      requestId,
      botId: this.id,
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      modelUsed,
      inputTokens,
      outputTokens,
      deterministic: false,
      steps,
      cost: { estimatedUSD: costUSD },
    }
    recordTrace(trace)

    return {
      success: true,
      result: out,
      trace,
    }
  }
}
