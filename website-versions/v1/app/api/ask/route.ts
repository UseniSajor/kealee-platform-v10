import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are Kea, a helpful assistant for Kealee — a construction project platform serving the DC/MD/VA (DMV) area.

Kealee's services:
- AI Concept Packages: Upload photos, get concept floor plan + design brief + cost band + permit scope in 24 hrs. $395–$695. Pre-design only — NOT permit-ready plans.
- Design Services: Architect-stamped permit-ready construction drawings. From $895. Required before permit filing.
- Permit Services: We file, track, and respond to comments at DC DOB, Montgomery DPS, Fairfax LDS, and all DMV agencies. Simple $149, Package $950, Coordination $2,750, Expediting from $5,500. Requires existing plans.
- Cost Estimation: AI estimates from $95, Certified estimates from $595.
- Contractor Marketplace: Vetted GCs and specialists matched by trade and county. Free to browse. Contractor network screened for licensing and insurance.
- Project Management: PM Advisory $950, PM Oversight $2,950. Milestone-based escrow — payment only releases when you approve each phase.
- Milestone Pay / Escrow: Funds held securely, released only after milestone approval. Lien waiver tracking included.

Key distinctions to always make clear:
- AI Concept = pre-design visualization, NOT permit-ready
- Permit-ready plans require a licensed architect (Design Services)
- Permit filing requires existing plans
- "Do I need a permit?" — almost always yes for structural work, additions, and electrical/mechanical changes

Routing paths:
- Have plans, need permit → /permits
- Need plans first → /design-services
- Want to visualize idea → /concept-engine
- Need cost estimate → /estimate
- Looking for a contractor → /marketplace
- Questions about payments → /milestone-pay

Keep answers concise (2–4 sentences). Always end with a clear next step.

Respond ONLY with valid JSON in this exact shape:
{
  "answer": "...",
  "recommendedPath": "PERMIT|DESIGN|ESTIMATE|AI_CONCEPT|MARKETPLACE|MILESTONE_PAY",
  "cta": { "label": "...", "href": "..." },
  "related": [{ "label": "...", "href": "..." }, { "label": "...", "href": "..." }]
}`

const PATH_MAP: Record<string, { label: string; href: string }> = {
  PERMIT:        { label: 'Get Permit Services',         href: '/permits' },
  DESIGN:        { label: 'See Design Services',         href: '/design-services' },
  ESTIMATE:      { label: 'Get an Estimate',             href: '/estimate' },
  AI_CONCEPT:    { label: 'Start AI Concept',            href: '/concept-engine' },
  MARKETPLACE:   { label: 'Find a Contractor',           href: '/marketplace' },
  MILESTONE_PAY: { label: 'Learn About Milestone Pay',   href: '/milestone-pay' },
}

// Keyword fallback if Claude is unavailable
function keywordFallback(query: string) {
  const q = query.toLowerCase()
  let intent = 'AI_CONCEPT'
  if (/permit/.test(q) && /have.*plans?|existing/.test(q)) intent = 'PERMIT'
  else if (/permit/.test(q) && /no.*plans?|need.*plans?/.test(q)) intent = 'DESIGN'
  else if (/\b(cost|price|estimate|how much)\b/.test(q)) intent = 'ESTIMATE'
  else if (/\b(contractor|hire|find|builder)\b/.test(q)) intent = 'MARKETPLACE'
  else if (/\b(pay|escrow|milestone|deposit)\b/.test(q)) intent = 'MILESTONE_PAY'
  else if (/\b(architect|stamped|permit.ready|drawings?|plans?)\b/.test(q)) intent = 'DESIGN'

  const answers: Record<string, string> = {
    PERMIT: 'If you have permit-ready plans, our team handles filing, tracking, and responding to reviewer comments at all DMV agencies. Simple permits start at $149.',
    DESIGN: 'Most projects need architect-stamped drawings before a permit can be filed. Our Design Services start at $895 and produce the stamped documents your jurisdiction requires.',
    ESTIMATE: 'We offer AI-powered cost estimates from $95 and certified estimates from $595 — useful for budgeting, financing, and contractor bid comparison.',
    AI_CONCEPT: 'An AI Concept Package turns your photos into concept designs, a room-by-room scope, and a cost range — delivered in 24 hours from $395. Note: this is pre-design, not permit-ready.',
    MARKETPLACE: 'Our contractor network is screened for licensing, insurance, and project fit. Browse verified contractors or get matched automatically to your project.',
    MILESTONE_PAY: 'Milestone-based escrow holds your funds securely and only releases payment to your contractor when you approve each completed phase. Lien waiver tracking is included.',
  }

  return {
    answer: answers[intent],
    recommendedPath: intent,
    cta: PATH_MAP[intent],
    related: [],
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query, context } = await req.json() as { query: string; context?: string }

    if (!query?.trim()) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(keywordFallback(query))
    }

    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: context && context !== 'default'
            ? `Context: user is on the ${context} page. Question: ${query}`
            : query,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse JSON from Claude response
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(keywordFallback(query))
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      answer: string
      recommendedPath: string
      cta?: { label: string; href: string }
      related?: { label: string; href: string }[]
    }

    // Ensure CTA maps to a known path
    const cta = PATH_MAP[parsed.recommendedPath] ?? parsed.cta ?? PATH_MAP['AI_CONCEPT']

    return NextResponse.json({
      answer: parsed.answer,
      recommendedPath: parsed.recommendedPath,
      cta,
      related: parsed.related ?? [],
    })
  } catch (err: any) {
    console.error('[/api/ask] error:', err?.message)
    // Fail-open: return keyword fallback
    try {
      const { query } = await req.clone().json() as { query: string }
      return NextResponse.json(keywordFallback(query))
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
