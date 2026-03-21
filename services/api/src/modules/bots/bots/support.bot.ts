/**
 * support.bot.ts
 *
 * SupportBot — Handles user support questions inside the Kealee platform.
 *
 * Deterministic:  Category classification via keyword matching
 * LLM:            Contextual answers, suggested actions, escalation judgment
 *
 * Designed for authenticated users (contractor, owner, admin).
 * Falls back to graceful escalation when uncertain.
 */

import { callModel, isLLMAvailable } from '../bots.router'
import { startStep, recordTrace } from '../bots.logger'
import type {
  IBot, BotInput, BotOutput, BotContext,
  SupportBotInput, SupportBotOutput, SupportAction,
} from '../bots.types'

// ── Deterministic classification ──────────────────────────────────────────────

type SupportCategory = 'faq' | 'escalation' | 'navigation' | 'technical' | 'billing'

const CATEGORY_PATTERNS: Array<{ category: SupportCategory; patterns: RegExp[] }> = [
  {
    category: 'billing',
    patterns: [/billing|invoice|payment|charge|refund|subscription|stripe|credit card/i],
  },
  {
    category: 'technical',
    patterns: [/error|bug|broken|crash|not working|can't upload|login.*fail|502|500/i],
  },
  {
    category: 'navigation',
    patterns: [/where is|how do I find|navigate|dashboard|page|menu|section/i],
  },
  {
    category: 'escalation',
    patterns: [/legal|dispute|complaint|fraud|scam|urgent|emergency|lawsuit|attorney/i],
  },
  {
    category: 'faq',
    patterns: [/.*/], // catch-all
  },
]

function classifyMessage(message: string): SupportCategory {
  for (const { category, patterns } of CATEGORY_PATTERNS) {
    if (patterns.some(p => p.test(message))) return category
  }
  return 'faq'
}

function shouldEscalateByCategory(category: SupportCategory, message: string): boolean {
  if (category === 'escalation') return true
  if (category === 'billing' && /refund|dispute|chargeback/i.test(message)) return true
  return false
}

function getDefaultActions(category: SupportCategory, role?: string): SupportAction[] {
  const actions: SupportAction[] = []

  if (category === 'billing') {
    actions.push(
      { label: 'View billing history',     url: '/settings/billing' },
      { label: 'Contact billing support',  action: 'open_ticket' },
    )
  } else if (category === 'technical') {
    actions.push(
      { label: 'Report a bug',             action: 'open_ticket' },
      { label: 'Check system status',      url: '/status' },
    )
  } else if (category === 'navigation') {
    if (role === 'contractor') {
      actions.push(
        { label: 'Go to My Leads',        url: '/leads' },
        { label: 'Go to My Profile',      url: '/profile' },
      )
    } else {
      actions.push(
        { label: 'Go to My Projects',     url: '/projects' },
        { label: 'Go to Dashboard',       url: '/' },
      )
    }
  } else if (category === 'escalation') {
    actions.push({ label: 'Contact Support Team', action: 'open_ticket' })
  } else {
    actions.push({ label: 'Browse Help Center', url: '/help' })
  }

  return actions
}

// ── LLM prompt ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a helpful support assistant for Kealee, a construction marketplace and operating system.

Platform overview:
- Project Owners use Kealee to manage construction projects (IDEA → CONSTRUCTION → CLOSEOUT lifecycle)
- Contractors receive lead assignments, accept/decline within 72 hours, manage credentials
- Digital Twin System tracks project health (L1/L2/L3 tiers)
- Key features: lead routing, construction readiness gate, permit tracking, escrow payments

Your job:
1. Answer the user's question clearly and concisely
2. Suggest relevant platform navigation links when helpful
3. Know when to escalate to a human agent (legal, billing disputes, urgent emergencies)

Keep replies under 4 sentences for simple questions. Be warm but efficient.
If you don't know, say so and suggest escalation — don't guess.`

// ── Bot class ─────────────────────────────────────────────────────────────────

export class SupportBot implements IBot<SupportBotInput, SupportBotOutput> {
  readonly id          = 'support-bot' as const
  readonly name        = 'SupportBot'
  readonly description = 'Handles user support questions with contextual answers and smart escalation'
  readonly version     = '1.0.0'
  readonly costProfile = 'low' as const
  readonly requiresLLM = true

  async execute(
    input: BotInput<SupportBotInput>,
    ctx:   BotContext,
  ): Promise<BotOutput<SupportBotOutput>> {
    const { data }  = input
    const requestId = ctx.requestId
    const startedAt = new Date()
    const steps: ReturnType<typeof startStep>[] = []

    // ── Step 1: Classify category ────────────────────────────────────────────
    const classTimer = startStep('deterministic', 'classify_category', data.message.slice(0, 60))
    const category      = classifyMessage(data.message)
    const shouldEscalate = shouldEscalateByCategory(category, data.message)
    const defaultActions = getDefaultActions(category, data.userRole)
    steps.push(classTimer.finish(`category=${category}, escalate=${shouldEscalate}`))

    // ── Step 2: LLM answer ───────────────────────────────────────────────────
    let reply         = ''
    let modelUsed: string | undefined
    let inputTokens   = 0
    let outputTokens  = 0
    let costUSD       = 0

    const contextClause = data.context
      ? `\nUser context: page=${data.context.currentPage ?? 'unknown'}, phase=${data.context.currentPhase ?? 'unknown'}`
      : ''

    const escalationNote = shouldEscalate
      ? '\n\nNote: This question requires human support. Acknowledge the concern, provide initial guidance if possible, and tell the user a support agent will follow up.'
      : ''

    const systemWithContext = SYSTEM_PROMPT
      + (data.userRole ? `\n\nUser role: ${data.userRole}` : '')
      + contextClause
      + escalationNote

    if (isLLMAvailable()) {
      const llmTimer = startStep('llm', 'generate_answer', data.message.slice(0, 60))
      try {
        const result = await callModel({
          systemPrompt: systemWithContext,
          userPrompt:   data.message,
          history:      data.conversationHistory ?? [],
          tier:         'fast',
          maxTokens:    400,
          temperature:  0.4,
        })
        reply        = result.content.trim()
        modelUsed    = result.model
        inputTokens  = result.inputTokens
        outputTokens = result.outputTokens
        costUSD      = result.estimatedCostUSD
        steps.push(llmTimer.finish(reply.slice(0, 60)))
      } catch (err: any) {
        steps.push(llmTimer.finish(undefined, err.message))
        reply = getFallbackReply(category, shouldEscalate)
      }
    } else {
      reply = getFallbackReply(category, shouldEscalate)
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
      cost: { estimatedUSD: costUSD },
    }
    recordTrace(trace)

    return {
      success: true,
      result: {
        reply,
        category,
        shouldEscalate,
        suggestedActions: defaultActions,
        relatedArticles: getRelatedArticles(category),
      },
      trace,
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFallbackReply(category: SupportCategory, escalate: boolean): string {
  if (escalate) return `I've flagged your request for our support team who will follow up shortly. For urgent issues, please email support@kealee.com.`
  if (category === 'billing') return `For billing questions, please visit Settings → Billing or contact our support team.`
  if (category === 'technical') return `I've noted this technical issue. Please try refreshing the page or clearing your browser cache. If the issue persists, submit a bug report.`
  if (category === 'navigation') return `You can find what you need in the sidebar navigation. Try the Dashboard for an overview of all your projects and tasks.`
  return `Thank you for your question! Please browse our Help Center or contact support@kealee.com for detailed assistance.`
}

function getRelatedArticles(category: SupportCategory): string[] {
  const base: Record<SupportCategory, string[]> = {
    billing:    ['Understanding your subscription', 'Payment methods', 'Invoices and receipts'],
    technical:  ['System requirements', 'Browser compatibility', 'Troubleshooting login'],
    navigation: ['Dashboard overview', 'Project lifecycle guide', 'Getting started checklist'],
    escalation: ['Dispute resolution process', 'Terms of service'],
    faq:        ['Getting started with Kealee', 'Platform overview', 'Contractor onboarding guide'],
  }
  return base[category] ?? []
}
