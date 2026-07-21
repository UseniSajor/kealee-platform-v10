import { FastifyPluginAsync } from 'fastify'

// ── Routing intent → path mapping ────────────────────────────────────────────

type RoutingIntent = 'PERMIT' | 'DESIGN' | 'ESTIMATE' | 'AI_CONCEPT' | 'MARKETPLACE' | 'MILESTONE_PAY'

interface AskResponse {
  answer: string
  recommendedPath: RoutingIntent
  cta: { label: string; href: string }
  related?: { label: string; href: string }[]
}

const PATH_MAP: Record<RoutingIntent, { label: string; href: string }> = {
  PERMIT:        { label: 'Get Permit Services',    href: '/permits' },
  DESIGN:        { label: 'See Design Services',    href: '/design-services' },
  ESTIMATE:      { label: 'Get an Estimate',        href: '/estimate' },
  AI_CONCEPT:    { label: 'Start AI Concept',       href: '/concept-engine' },
  MARKETPLACE:   { label: 'Find a Contractor',      href: '/marketplace' },
  MILESTONE_PAY: { label: 'Learn About Milestone Pay', href: '/milestone-pay' },
}

const RELATED_LINKS: Record<RoutingIntent, { label: string; href: string }[]> = {
  PERMIT: [
    { label: 'Design Services', href: '/design-services' },
    { label: 'County timelines', href: '/permits#jurisdictions' },
  ],
  DESIGN: [
    { label: 'AI Concept first', href: '/concept-engine' },
    { label: 'Permit Services', href: '/permits' },
  ],
  ESTIMATE: [
    { label: 'AI Concept', href: '/concept-engine' },
    { label: 'Design Services', href: '/design-services' },
  ],
  AI_CONCEPT: [
    { label: 'Design Services', href: '/design-services' },
    { label: 'Get an Estimate', href: '/estimate' },
  ],
  MARKETPLACE: [
    { label: 'How vetting works', href: '/faq#contractor-marketplace' },
    { label: 'Milestone Pay', href: '/milestone-pay' },
  ],
  MILESTONE_PAY: [
    { label: 'Contractor Network', href: '/marketplace' },
    { label: 'Escrow FAQ', href: '/faq#escrow-payments' },
  ],
}

// ── Keyword routing logic ─────────────────────────────────────────────────────

function classifyQuery(query: string): RoutingIntent {
  const q = query.toLowerCase()

  // Permit + plan state detection first (most specific)
  if (/permit/.test(q) && /have\s+(my\s+)?plans?|already\s+have\s+plans?|existing\s+plans?/.test(q)) {
    return 'PERMIT'
  }
  if (/permit/.test(q) && /no\s+plans?|don.?t\s+have\s+plans?|need\s+plans?|without\s+plans?/.test(q)) {
    return 'DESIGN'
  }

  // Cost / estimate
  if (/\b(cost|price|estimate|budget|how\s+much|quote)\b/.test(q)) return 'ESTIMATE'

  // Contractor / hire / find
  if (/\b(contractor|hire|find|builder|plumber|electrician|who\s+do|who\s+can)\b/.test(q)) return 'MARKETPLACE'

  // Pay / escrow / milestone
  if (/\b(pay|payment|escrow|milestone|lien|deposit|release)\b/.test(q)) return 'MILESTONE_PAY'

  // Architect / drawings / plans / permit
  if (/\b(architect|drawings?|stamped|permit.ready|engineered|plans?|permit)\b/.test(q)) {
    if (/\b(concept|idea|vision|see|visuali|render)\b/.test(q)) return 'AI_CONCEPT'
    return 'DESIGN'
  }

  // AI concept / design idea
  if (/\b(idea|design|layout|concept|render|visuali|what\s+could|before\s+build)\b/.test(q)) {
    return 'AI_CONCEPT'
  }

  // Default
  return 'AI_CONCEPT'
}

// ── Answer generation ─────────────────────────────────────────────────────────

function generateAnswer(query: string, intent: RoutingIntent): string {
  const q = query.toLowerCase()

  switch (intent) {
    case 'PERMIT':
      return "Great — if you already have permit-ready (architect-stamped) plans, our permit team can prepare and submit your application directly. We serve DC, MD, and VA jurisdictions with typical simple-project timelines of 2–8 weeks depending on county."

    case 'DESIGN':
      if (/permit/.test(q)) {
        return "Most projects require architect-stamped drawings before you can pull a building permit. An AI concept package shows you the vision, but permit-ready plans are a separate step. Our Design Services start at $1,200 and produce stamped documents your jurisdiction will accept."
      }
      return "For permit-ready plans, our Design Services team produces architect-stamped construction documents starting at $1,200. If you want to visualize the project first before committing to full design, start with an AI concept package from $395."

    case 'ESTIMATE':
      return "We offer three levels of estimation: AI Design Estimates (from $395, 48-hr delivery) for early budgeting, Detailed Cost Estimates (from $695) for contractor bid comparison, and Certified Estimates (from $1,200) for permit applications and financing."

    case 'AI_CONCEPT':
      return "An AI Concept Package gives you 3 property-specific design concepts — renderings, layout direction, material palette, and a rough cost range — delivered in 5–7 business days with a consultation call included. Note: concepts are pre-design visualization, not permit-ready plans."

    case 'MARKETPLACE':
      return "Our contractor network is screened for active licensing, liability insurance, and project fit. You describe your project and we surface matched, verified contractors in your area. Matching is free — you only pay when you hire."

    case 'MILESTONE_PAY':
      return "Milestone-based escrow means your funds are held securely and only released to your contractor when you approve each completed phase. This protects you from overpaying for incomplete work — and protects your contractor by ensuring payment follows verified progress."

    default:
      return "Kealee covers the full project lifecycle — from AI concept design and cost estimation through permit services, contractor matching, and milestone-protected payments. Tell us more about your project and we'll point you in the right direction."
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export const askRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: { query: string; context?: string; email?: string }
  }>('/api/v1/ask', {
    schema: {
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query:   { type: 'string', maxLength: 500 },
          context: { type: 'string' },
          email:   { type: 'string', format: 'email' },
        },
      },
    },
  }, async (request, reply) => {
    const { query, context, email } = request.body

    if (!query?.trim()) {
      return reply.status(400).send({ error: 'query is required' })
    }

    const intent = classifyQuery(query)
    const answer = generateAnswer(query, intent)
    const cta = PATH_MAP[intent]
    const related = RELATED_LINKS[intent]

    // Async lead scoring — fire-and-forget, no await
    if (email) {
      void (async () => {
        try {
          const { LeadIntelligenceService } = await import('../../services/lead-intelligence.service.js')
          await LeadIntelligenceService.upsertLeadProfile({
            email,
            source: `ask:${context ?? 'unknown'}`,
            stage: 'AWARENESS',
          })
          await LeadIntelligenceService.scoreLeadByEmail(email, 'ask_anything', +10)
        } catch {
          // non-critical
        }
      })()
    }

    const response: AskResponse = {
      answer,
      recommendedPath: intent,
      cta,
      related,
    }

    return reply.send(response)
  })
}
