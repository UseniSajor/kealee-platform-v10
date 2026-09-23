import { NextRequest, NextResponse } from 'next/server'
import { AnthropicClient as Anthropic } from '@kealee/core-llm'

export const dynamic = 'force-dynamic'

// --- System prompts ---

// Legacy single-turn: must return JSON (backward compat for any callers passing stream=false)
const JSON_SYSTEM_PROMPT = `You are Kea, a helpful assistant for Kealee — a construction project platform serving the DC/MD/VA (DMV) area.

Kealee's services:
- Design Concept Package: One scope-priced preliminary package with three directions, six project-specific views, concept plan, materials/BOM, basic planning estimate, zoning code and allowances, permit scope, PDF, portal, and one revision. Exact price is shown after intake. Video, extra views, CAD/DXF, consultation, and extra revisions are add-ons. NOT permit-ready plans.
- Design Services: Architect-stamped permit-ready construction drawings with a detailed construction estimate included. Required before permit filing.
- Permit Services: We file, track, and respond to comments at DC DOB, Montgomery DPS, Fairfax LDS, and all DMV agencies. Simple $149, Package $950, Coordination $2,750, Expediting from $5,500. Requires existing plans.
- Contractor Marketplace: Vetted GCs and specialists matched by trade and county. Free to browse. Contractor network screened for licensing and insurance.
- Project Management: PM Advisory $950, PM Oversight $2,950. Milestone-based escrow — payment only releases when you approve each phase.
- Milestone Pay / Escrow: Funds held securely, released only after milestone approval. Lien waiver tracking included.

Key distinctions to always make clear:
- design concept = pre-design visualization, NOT permit-ready
- Permit-ready plans require a licensed architect (Design Services)
- Permit filing requires existing plans
- "Do I need a permit?" — almost always yes for structural work, additions, and electrical/mechanical changes

Routing paths:
- Have plans, need permit → /permits
- Need plans first → /design-services
- Want to visualize idea → /concept-engine
- Need an early cost range → /services/design-concept (basic planning estimate included)
- Need a detailed estimate → /intake/professional_drawings (included with permit-set plans)
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

// Conversational streaming mode: plain text, multi-turn (public website)
const CHAT_SYSTEM_PROMPT = `You are Kea, a helpful assistant for Kealee — a construction project platform serving the DC/MD/VA (DMV) area.

Kealee's services:
- Design Concept Package: One scope-priced preliminary package with three directions, six project-specific views, concept plan, materials/BOM, basic planning estimate, zoning code and allowances, permit scope, PDF, portal, and one revision. Exact price is shown after intake. Video, extra views, CAD/DXF, consultation, and extra revisions are add-ons. NOT permit-ready plans.
- Design Services: Architect-stamped permit-ready construction drawings with a detailed construction estimate included. Required before permit filing.
- Permit Services: We file, track, and respond to comments at DC DOB, Montgomery DPS, Fairfax LDS, and all DMV agencies. From $499. Requires existing plans.
- Contractor Marketplace: Vetted GCs and specialists matched by trade and county. Free to browse.
- Project Management: PM Advisory $950, PM Oversight $2,950. Milestone-based escrow payments.
- Milestone Pay / Escrow: Funds held securely, released only after milestone approval.

Key distinctions:
- design concept = pre-design visualization, NOT permit-ready
- Permit-ready plans require a licensed architect (Design Services)
- Permit filing requires existing plans
- Structural work, additions, and electrical/mechanical changes almost always need a permit
- Concept packages include AI renders, cost band, and scope brief — not stamped construction drawings

Respond conversationally in plain text. No JSON, no markdown headers or bullets. Keep answers concise (2–4 sentences). Always end with a clear next step or a helpful follow-up question.`

// Portal-owner context: full product + order fulfillment knowledge
const PORTAL_OWNER_SYSTEM_PROMPT = `You are Kea, the AI assistant built into the Kealee owner portal.

THE PLATFORM
Kealee (kealee.com) is an end-to-end design-build platform for project owners and professionals in DC / MD / VA. Every concept order opens a shared project workspace in the owner portal. The service journey is: site planning → design concept → permit-set plans and filing → contractor match → protected construction. Estimating is included in the relevant plan package, not sold as a separate step.

DESIGN CONCEPT PACKAGE — EXACT DELIVERABLES
- One package, priced from project type, size, and scope after intake
- Three concept directions with one recommendation
- Six project-specific concept views
- Preliminary labelled concept plan
- Materials and finish direction with planning BOM
- Trade-level scope and preliminary construction cost range
- Zoning district/code, preliminary allowances, source, and verification flags
- Permit scope, AHJ checklist, likely fees/timeline, and trade-permit flags
- Six-page PDF, owner portal, one revision, and 30 days support
- Video, extra views, editable CAD/DXF, consultation, and extra revisions are optional add-ons

WHERE TO FIND DELIVERABLES
All renders, videos, and PDF are in the Concept Packages tab (/deliverables). Click "View Package" to see renders and video. Click "Download PDF" for the full package PDF. Status shows "Ready" when complete — if still "Generating," it completes within 24 hours of purchase.

If customer context is provided above this message, use it to answer specifically about their order.

ORDER FULFILLMENT — ANSWER DIRECTLY, DON'T DEFLECT
- "Where are my images/renders?" → Concept Packages tab, click View Package
- "Where is my video?" → Confirm the order includes a video add-on, then direct them to Concept Packages → View Package → Design presentation video.
- "Where is my PDF?" → Concept Packages tab → Download PDF button (appears when status is Ready)
- "When will my concept be ready?" → Typically within 24 hours of order. They'll receive an email notification.
- "What does my plan include?" → Use the single-package deliverables above and identify any purchased add-ons separately.

NEXT STEPS AFTER CONCEPT (PORTAL-INTERNAL PATHS)
1. Permit-set building plans → Services page (/services) — includes a detailed construction estimate.
2. Permit filing → Services page (/services) — DC/MD/VA agency filing and tracking.
3. Full / detailed site plans → Services page (/services) — includes a detailed construction estimate.
4. Contractor Match → Available after the plan and approval scope are ready.

CONSTRUCTION DOMAIN KNOWLEDGE
- "Do I need a permit?" → Almost always yes for structural changes, additions, electrical panel work, plumbing rough-in, HVAC ductwork, decks over 30 inches. Cosmetic work (paint, flooring, cabinets) typically does not.
- Permit timeline in DC/MD/VA: simple permits 2–4 weeks; complex/structural 6–12 weeks.
- design concept renders are illustrative and pre-design — not permit-ready construction drawings.
- Permit-ready plans require a licensed architect and PE stamp for structural work.

PORTAL NAVIGATION
- Concept packages + deliverables: /deliverables
- Order plans, permits, and next services: /services
- Projects: /projects
- Payments: /payments
- Documents: /documents

Never direct portal users to public marketing pages. Use portal paths. Speak as a confident Kealee team member. Plain text only — no markdown, no bullets. Keep answers to 2–4 sentences. Always end with a clear next step.`

// --- Path map ---
const PATH_MAP: Record<string, { label: string; href: string }> = {
  PERMIT:        { label: 'Get Permit Services',        href: '/permits' },
  DESIGN:        { label: 'See Design Services',        href: '/intake/professional_drawings' },
  ESTIMATE:      { label: 'Choose the Right Plan',       href: '/services' },
  AI_CONCEPT:    { label: 'Start design concept',       href: '/concept' },
  MARKETPLACE:   { label: 'Find a Contractor',          href: '/intake/contractor_match' },
  MILESTONE_PAY: { label: 'Set Up Milestone Pay',       href: '/request-service?service=milestone-pay&name=Protected+Escrow+Payments' },
}

// Keyword fallback when Anthropic API is unavailable
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
    ESTIMATE: 'A basic planning estimate is included with every design concept and preliminary site plan. A detailed construction estimate is included with permit-set building plans and full detailed site plans, so choose the plan package that matches how far your project has advanced.',
    AI_CONCEPT: 'An Concept Package turns your photos into concept designs, a room-by-room scope, and a cost range — delivered in 24 hours from $395. Note: this is pre-design, not permit-ready.',
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

// --- Route handler ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      query: string
      context?: string
      messages?: { role: 'user' | 'assistant'; content: string }[]
      stream?: boolean
    }
    const { query, context, messages = [], stream: wantStream = false } = body

    if (!query?.trim()) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      if (wantStream) {
        const fb = keywordFallback(query)
        return new Response(fb.answer, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      }
      return NextResponse.json(keywordFallback(query))
    }

    const client = new Anthropic({ apiKey })

    // Build message history (previous turns + current question)
    const history: Anthropic.MessageParam[] = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const userContent = context && context !== 'default'
      ? `Context: user is on the ${context} page. Question: ${query}`
      : query

    history.push({ role: 'user', content: userContent })

    // --- STREAMING mode ---
    if (wantStream) {
      const isPortalOwner = typeof context === 'string' && context.startsWith('portal-owner')
      const stream = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: isPortalOwner ? PORTAL_OWNER_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT,
        messages: history,
        stream: true,
      })

      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (
                event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta'
              ) {
                controller.enqueue(encoder.encode(event.delta.text))
              }
            }
          } finally {
            controller.close()
          }
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-store',
        },
      })
    }

    // --- NON-STREAMING mode (backward compat, returns JSON) ---
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: JSON_SYSTEM_PROMPT,
      messages: history,
    })

    const textBlock = message.content.find(block => block.type === 'text')
    const raw = textBlock?.type === 'text' ? textBlock.text : ''
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

    const cta = PATH_MAP[parsed.recommendedPath] ?? parsed.cta ?? PATH_MAP['AI_CONCEPT']

    return NextResponse.json({
      answer: parsed.answer,
      recommendedPath: parsed.recommendedPath,
      cta,
      related: parsed.related ?? [],
    })
  } catch (err: any) {
    console.error('[/api/ask] error:', err?.message)
    try {
      const { query, stream: wantStream } = await req.clone().json() as { query: string; stream?: boolean }
      const fb = keywordFallback(query)
      if (wantStream) {
        return new Response(fb.answer, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      }
      return NextResponse.json(fb)
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
