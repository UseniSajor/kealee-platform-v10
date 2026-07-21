/**
 * lead.bot.ts
 *
 * LeadBot — Qualifies construction leads through conversational AI.
 *
 * Scoring model (deterministic, 0-100):
 *   Project type identified  +15
 *   Service-area location    +20
 *   Budget mentioned         +15
 *   Timeline indicated       +10
 *   Expressed urgency        +10
 *   Pricing interest         +10
 *   Ready to start           +20
 *
 * LLM is used only for:
 *   - Generating a contextual reply
 *   - Extracting structured project data from free text
 *
 * Threshold for handoff: score >= 65
 */

import { randomUUID } from 'crypto'
import { callModel, parseJSON, isLLMAvailable } from '../bots.router'
import { startStep, newRequestId, recordTrace } from '../bots.logger'
import type {
  IBot, BotInput, BotOutput, BotContext, BotStep,
  LeadBotInput, LeadBotOutput,
} from '../bots.types'

// ── Scoring ───────────────────────────────────────────────────────────────────

const SERVICE_AREA = [
  'dc', 'washington', 'virginia', 'va', 'maryland', 'md',
  'baltimore', 'arlington', 'bethesda', 'silver spring', 'alexandria',
  'fairfax', 'reston', 'tysons', 'annapolis',
]

function scoreText(text: string, history: string): number {
  const all = `${text} ${history}`.toLowerCase()
  let score = 0

  if (/residential|commercial|renovation|new.?build|addition|multifamily|office|retail/i.test(all)) score += 15
  if (SERVICE_AREA.some(w => all.includes(w))) score += 20
  if (/\$[\d,]+|\d+[kK]|\d+\s*(thousand|million)|budget/i.test(all)) score += 15
  if (/asap|soon|this year|next month|by \w+ \d{4}|timeline|schedule/i.test(all)) score += 10
  if (/urgent|immediately|emergency|quickly|right away/i.test(all)) score += 10
  if (/price|cost|how much|quote|estimate|rates/i.test(all)) score += 10
  if (/ready to start|hire|get started|sign up|move forward|next step/i.test(all)) score += 20

  return Math.min(score, 100)
}

function determineUrgency(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are LeadBot, a professional lead qualification assistant for Kealee — a construction marketplace serving DC, Maryland, and Virginia.

Your job:
1. Have a natural, helpful conversation to understand the owner's project
2. Extract: project type, location, budget, timeline
3. Qualify whether this is a real, actionable construction project
4. Guide high-quality leads toward booking a consultation

Tone: warm, professional, knowledgeable about construction
Never pressure the user. Always ask clarifying questions.
Keep replies to 2-4 sentences unless explaining something technical.

After your reply, output a JSON block like this:
\`\`\`json
{
  "projectType": "residential renovation",
  "location": "Bethesda, MD",
  "estimatedBudget": 150000,
  "urgency": "medium",
  "suggestedActions": ["Schedule a free consultation", "See architect portfolio"]
}
\`\`\``

// ── Bot class ─────────────────────────────────────────────────────────────────

export class LeadBot implements IBot<LeadBotInput, LeadBotOutput> {
  readonly id          = 'lead-bot' as const
  readonly name        = 'LeadBot'
  readonly description = 'Qualifies construction leads through conversation and extracts structured project data'
  readonly version     = '1.0.0'
  readonly costProfile = 'low' as const
  readonly requiresLLM = true

  async execute(
    input: BotInput<LeadBotInput>,
    ctx:   BotContext,
  ): Promise<BotOutput<LeadBotOutput>> {
    const requestId = ctx.requestId
    const startedAt = new Date()
    const steps: BotStep[] = []

    // ── Step 1: Deterministic scoring ────────────────────────────────────────
    const scoreTimer = startStep('deterministic', 'score_lead', input.data.message.slice(0, 80))
    const historyText = (input.data.conversationHistory ?? [])
      .map(m => m.content)
      .join(' ')
    const leadScore = scoreText(input.data.message, historyText)
    steps.push(scoreTimer.finish(`score=${leadScore}`))

    // ── Step 2: LLM reply + data extraction ───────────────────────────────────
    let reply            = ''
    let extractedData    = {}
    let suggestedActions = ['Schedule a free consultation', 'View project gallery']
    let modelUsed: string | undefined
    let inputTokens  = 0
    let outputTokens = 0
    let cost         = 0

    if (isLLMAvailable()) {
      const llmTimer = startStep('llm', 'generate_reply', input.data.message.slice(0, 80))
      try {
        const result = await callModel({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt:   input.data.message,
          history:      input.data.conversationHistory ?? [],
          tier:         'fast',
          maxTokens:    600,
          temperature:  0.5,
        })

        // Split reply from JSON block
        const jsonStart = result.content.indexOf('```json')
        if (jsonStart !== -1) {
          reply = result.content.slice(0, jsonStart).trim()
          const parsed = parseJSON<{
            projectType?: string
            location?: string
            estimatedBudget?: number
            urgency?: 'low' | 'medium' | 'high'
            suggestedActions?: string[]
          }>(result.content.slice(jsonStart), {})
          extractedData    = parsed
          suggestedActions = parsed.suggestedActions ?? suggestedActions
        } else {
          reply = result.content.trim()
        }

        modelUsed    = result.model
        inputTokens  = result.inputTokens
        outputTokens = result.outputTokens
        cost         = result.estimatedCostUSD
        steps.push(llmTimer.finish(reply.slice(0, 60)))
      } catch (err: any) {
        steps.push(llmTimer.finish(undefined, err.message))
        reply = `Thanks for reaching out! I'd love to learn more about your project. Could you tell me the location and rough budget you have in mind?`
      }
    } else {
      // Fallback for environments without API key
      reply = `Thanks for reaching out! I'd love to help with your project. Could you share the location and your approximate budget?`
    }

    const completedAt = new Date()
    const trace = {
      requestId,
      botId:        this.id,
      startedAt,
      completedAt,
      durationMs:   completedAt.getTime() - startedAt.getTime(),
      modelUsed,
      inputTokens,
      outputTokens,
      deterministic: false,
      steps,
      cost: { estimatedUSD: cost },
    }
    recordTrace(trace)

    return {
      success: true,
      result: {
        reply,
        leadScore,
        readyForHandoff: leadScore >= 65,
        suggestedActions,
        extractedData: {
          urgency: determineUrgency(leadScore),
          ...(extractedData as any),
        },
      },
      trace,
    }
  }
}
