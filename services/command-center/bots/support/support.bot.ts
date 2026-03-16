/**
 * services/command-center/bots/support/support.bot.ts
 *
 * SupportBot — first-line user support triage.
 *
 * Subscribed events:
 *   - support.ticket.created
 *   - support.ticket.escalated
 *   - support.message.received
 *
 * Logic:
 *   1. Classify intent: permit / payment / credential / general
 *   2. Lookup FAQ for exact matches — if found, reply immediately
 *   3. Otherwise call Claude for an AI-generated response
 *   4. If confidence < 0.6 or category === 'LEGAL_DISPUTE' → escalate to human
 *
 * Actions:
 *   - EMAIL_SEQUENCE  → auto-reply to user
 *   - INTERNAL_ALERT  → escalate to human agent
 *   - DASHBOARD_METRIC_UPDATE → support queue stats
 */

import Anthropic from '@anthropic-ai/sdk'
import { createLogger } from '@kealee/observability'
import {
  OperationalBot,
  BotCategory,
  BotEvent,
  BotResult,
  BotAction,
} from '../shared/bot.interface.js'

const logger = createLogger('support-bot')

// ─── FAQ store (expand via CMS or DB in production) ──────────────────────────

const FAQ: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ['permit', 'permit status', 'permit approved', 'permit rejected'],
    answer:   'Your permit status is tracked in the Permits section of your project. Typical review times are 2–6 weeks depending on your jurisdiction. If approved, we notify you automatically.',
  },
  {
    keywords: ['payment', 'invoice', 'charge', 'refund'],
    answer:   'All payments flow through Kealee Escrow. Funds are released to contractors upon milestone approval. For disputes, contact support@kealee.com with your project ID.',
  },
  {
    keywords: ['credential', 'license', 'insurance', 'verification'],
    answer:   'Contractor credentials are verified within 48 hours of upload. Upload your license and insurance docs in the Credentials section of your portal.',
  },
  {
    keywords: ['bid', 'proposal', 'estimate', 'scope'],
    answer:   'Bids are typically submitted within 72 hours of project invitation. You can review and compare bids in the Bids section of your project.',
  },
]

function lookupFaq(message: string): string | null {
  const lower = message.toLowerCase()
  for (const entry of FAQ) {
    if (entry.keywords.some(k => lower.includes(k))) {
      return entry.answer
    }
  }
  return null
}

// ─── Intent classification keywords ──────────────────────────────────────────

type SupportCategory = 'PERMIT' | 'PAYMENT' | 'CREDENTIAL' | 'BID' | 'LEGAL_DISPUTE' | 'GENERAL'

function classifyIntent(message: string): SupportCategory {
  const lower = message.toLowerCase()
  if (/dispute|lawsuit|legal|lawyer|attorney/.test(lower)) return 'LEGAL_DISPUTE'
  if (/permit|inspection|code|zoning/.test(lower))          return 'PERMIT'
  if (/pay|invoice|refund|charge|escrow/.test(lower))       return 'PAYMENT'
  if (/license|credential|insurance|verify/.test(lower))    return 'CREDENTIAL'
  if (/bid|proposal|estimate|scope/.test(lower))            return 'BID'
  return 'GENERAL'
}

// ─── Bot ──────────────────────────────────────────────────────────────────────

export class SupportBot extends OperationalBot {
  readonly id          = 'support-bot'
  readonly name        = 'SupportBot'
  readonly category: BotCategory = 'SUPPORT_COMMS'
  readonly description = 'First-line support triage — FAQ lookup, AI response generation, and human escalation for complex issues.'
  readonly subscribedEvents = [
    'support.ticket.created',
    'support.ticket.escalated',
    'support.message.received',
  ]
  readonly requiresHumanApproval = false  // auto-replies don't require approval; escalations do
  readonly synchronous           = false
  readonly internalOnly          = false

  private readonly ai: Anthropic

  constructor() {
    super()
    this.ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  async handle(event: BotEvent): Promise<BotResult> {
    const start = Date.now()
    logger.info({ botId: this.id, eventType: event.type }, 'SupportBot handling event')

    try {
      const { ticketId, userId, message, userEmail } = event.payload as {
        ticketId:  string
        userId:    string
        message:   string
        userEmail: string
      }

      if (!message) {
        return this.makeResult(event.type, [], [], start)
      }

      const category = classifyIntent(message)

      // Legal disputes always escalate immediately
      if (category === 'LEGAL_DISPUTE') {
        const actions = [
          this.makeAction(
            'INTERNAL_ALERT',
            {
              message:  `Legal dispute ticket from ${userEmail}: ${message.slice(0, 200)}`,
              ticketId,
              userId,
              severity: 'CRITICAL',
              assignTo: 'legal-team',
            },
            { requiresApproval: false, autoExecute: true },
          ),
          this.makeAction(
            'EMAIL_SEQUENCE',
            {
              templateId: 'support_escalated',
              to:         userEmail,
              ticketId,
              message:    'Your ticket has been escalated to our team and will be reviewed within 4 business hours.',
            },
            { requiresApproval: false, autoExecute: true },
          ),
        ]
        return this.makeResult(event.type, actions, [], start)
      }

      // FAQ lookup
      const faqAnswer = lookupFaq(message)
      if (faqAnswer) {
        logger.info({ ticketId, category }, 'SupportBot: FAQ match found')
        const actions = [
          this.makeAction(
            'EMAIL_SEQUENCE',
            {
              templateId: 'support_faq_reply',
              to:         userEmail,
              ticketId,
              answer:     faqAnswer,
              category,
            },
            { requiresApproval: false, autoExecute: true },
          ),
          this.makeAction(
            'DASHBOARD_METRIC_UPDATE',
            { metric: 'support_faq_deflected', value: 1 },
            { requiresApproval: false, autoExecute: true },
          ),
        ]
        return this.makeResult(event.type, actions, [], start)
      }

      // AI-generated response
      const { answer, confidence } = await this._callClaude(message, category)

      if (confidence < 0.6) {
        // Low confidence → escalate
        const actions = [
          this.makeAction(
            'INTERNAL_ALERT',
            {
              message:    `Low-confidence support ticket (${confidence.toFixed(2)}): ${message.slice(0, 200)}`,
              ticketId,
              userId,
              severity:   'MEDIUM',
              assignTo:   'support-team',
              aiDraft:    answer,
            },
            { requiresApproval: false, autoExecute: true },
          ),
          this.makeAction(
            'EMAIL_SEQUENCE',
            {
              templateId: 'support_escalated',
              to:         userEmail,
              ticketId,
              message:    'A team member will review your request and respond within 4 business hours.',
            },
            { requiresApproval: false, autoExecute: true },
          ),
        ]
        return this.makeResult(event.type, actions, [], start)
      }

      // Auto-reply with AI answer
      const actions = [
        this.makeAction(
          'EMAIL_SEQUENCE',
          {
            templateId: 'support_ai_reply',
            to:         userEmail,
            ticketId,
            answer,
            category,
          },
          { requiresApproval: false, autoExecute: true },
        ),
        this.makeAction(
          'DASHBOARD_METRIC_UPDATE',
          { metric: 'support_ai_resolved', value: 1 },
          { requiresApproval: false, autoExecute: true },
        ),
      ]
      return this.makeResult(event.type, actions, [], start)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error({ botId: this.id, err: msg }, 'SupportBot error')
      return {
        botId: this.id,
        eventType: event.type,
        actionsTriggered: [],
        recommendationsEmitted: [],
        processingMs: Date.now() - start,
        error: msg,
      }
    }
  }

  // ─── Claude AI response ────────────────────────────────────────────────────

  private async _callClaude(
    userMessage: string,
    category: SupportCategory,
  ): Promise<{ answer: string; confidence: number }> {
    const systemPrompt = `You are a helpful support agent for Kealee, a construction development platform.
Answer user questions concisely and accurately. If you are not sure, say so.
Category context: ${category}.
Platform context: Kealee connects project owners with architects, engineers, and general contractors.
Key features: permit tracking, contractor bidding, milestone-based escrow payments, digital project twins.
Respond in 2-4 sentences. End with: CONFIDENCE:[0.0-1.0]`

    const response = await this.ai.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [
        { role: 'user', content: userMessage },
      ],
      system: systemPrompt,
    })

    const text = (response.content[0] as { type: 'text'; text: string }).text
    const confidenceMatch = text.match(/CONFIDENCE:\s*([\d.]+)/)
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5
    const answer = text.replace(/CONFIDENCE:[\s\d.]+$/, '').trim()

    return { answer, confidence }
  }
}
