import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  PUBLIC_PRODUCT_CATALOG,
  formatCatalogPrice,
  getPublicCatalogAssistantContext,
} from '@kealee/core-rules'

export const dynamic = 'force-dynamic'

// --- System prompts ---

// Legacy single-turn: must return JSON (backward compat for any callers passing stream=false)
const CATALOG_CONTEXT = getPublicCatalogAssistantContext()

const DOMAIN_GUIDANCE = `You can answer questions across residential and commercial construction, renovation, real estate due diligence, land development, zoning, permitting, site planning, estimating, contractor selection, schedules, procurement, financing concepts, multifamily yield, parking, massing, preliminary earthwork, cost, NOI, entitlements, and Kealee platform capabilities.

Answer educational questions directly. For current laws, zoning, parcel facts, permit requirements, market values, or site-specific conclusions, explain that the answer must be verified against authoritative jurisdiction/property sources. Never invent parcel geometry, setbacks, zoning, utility locations, survey data, engineering results, or market data.

When asked what construction itself will cost, distinguish construction cost from Kealee's service fee. Give a broad preliminary range only when supportable, state assumptions, and ask for location, project type, square footage, existing condition, finish level, and target schedule to narrow it. Never imply that a public catalog fee is the cost to build.

All feasibility, concept, site-plan, and generative outputs must be described as "Preliminary feasibility / not for construction / subject to licensed professional review." A Preliminary Site Plan is not a boundary survey. A permit-ready or sealed deliverable requires the appropriately licensed professional and jurisdiction-specific scope.`

const JSON_SYSTEM_PROMPT = `You are Kea, Kealee's nationwide construction, real estate, and land-development assistant.

${DOMAIN_GUIDANCE}

CURRENT KEALEE PUBLIC CATALOG — use these exact prices and links; never substitute remembered prices:
${CATALOG_CONTEXT}

Key distinctions to always make clear:
- AI Concept = pre-design visualization, NOT permit-ready
- Permit-ready plans require a licensed architect (Design Services)
- Permit filing requires existing plans
- Permit requirements vary by project and jurisdiction and must be verified before work.

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

// Conversational streaming mode: plain text, multi-turn (public website)
const CHAT_SYSTEM_PROMPT = `You are Kea, Kealee's nationwide construction, real estate, and land-development assistant.

${DOMAIN_GUIDANCE}

CURRENT KEALEE PUBLIC CATALOG — use these exact prices and links; never substitute remembered prices:
${CATALOG_CONTEXT}

Respond conversationally in plain text. Use short paragraphs or a compact list when it improves clarity. For a simple question, answer in 2–5 sentences. For a feasibility or cost question, state assumptions and the missing inputs. Always end with a practical next step or one useful follow-up question.`

// Portal-owner context: full product + order fulfillment knowledge
const PORTAL_OWNER_SYSTEM_PROMPT = `You are Kea, the AI assistant built into the Kealee owner portal.

THE PLATFORM
Kealee (kealee.com) is an end-to-end design-build platform for homeowners in DC / MD / VA. Every concept order opens a personal project workspace in the owner portal. The full service journey: AI Concept → Cost Estimate → Permit Filing → Architect Plans → Contractor Match → Build.

CONCEPT PACKAGE TIERS — EXACT DELIVERABLES
Tier 1 · Starter Concept ($295–$395)
- 3 AI renders (1920×1080 resolution)
- Concept floor plan sketch
- Room-by-room scope brief
- Permit scope brief (permits likely needed, estimated fees and timeline)
- Estimated construction cost band
- Downloadable PDF package
- No video included at this tier

Tier 2 · Visualization Package / Premium ($495–$695)
- 6 AI renders (2560×1440 resolution)
- 60-second transformation video — downloadable MP4
- Concept floor plan
- Detailed scope brief + MEP direction
- Permit scope deep-dive (AHJ checklist, trade permits, zoning notes)
- RSMeans cost band
- Downloadable PDF package
- 30 days email support

Tier 3 · Pre-Design Package / Premium+ ($795–$1,500)
- 12 AI renders (4K resolution)
- 4-video suite: 60s cinematic master + 30s + 15s + 10s cuts (HD master download)
- 15-minute consultation call with design team
- Full permit/zoning package (permit package credit, entitlement notes, PE flag where required)
- Detailed scope brief + MEP direction
- Downloadable PDF package
- 90 days email support

WHERE TO FIND DELIVERABLES
All renders, videos, and PDF are in the Concept Packages tab (/deliverables). Click "View Package" to see renders and video. Click "Download PDF" for the full package PDF. Status shows "Ready" when complete — if still "Generating," it completes within 24 hours of purchase.

If customer context is provided above this message, use it to answer specifically about their order.

ORDER FULFILLMENT — ANSWER DIRECTLY, DON'T DEFLECT
- "Where are my images/renders?" → Concept Packages tab, click View Package
- "Where is my video?" → Concept Packages tab. Tier 2 has 1 video (60s MP4). Tier 3 has 4 videos. Tier 1 has no video.
- "I ordered Premium+ and don't see my video" → Confirm Tier 3 includes a 4-video suite. Direct them to Concept Packages tab → View Package → look for the video download section.
- "Where is my PDF?" → Concept Packages tab → Download PDF button (appears when status is Ready)
- "When will my concept be ready?" → Typically within 24 hours of order. They'll receive an email notification.
- "What does my plan include?" → Use the tier details above to answer specifically for their tier.

NEXT STEPS AFTER CONCEPT (PORTAL-INTERNAL PATHS)
1. Cost Estimate → Services page (/services) — RSMeans-validated, from $595. Lender-ready PDF.
2. Permit Filing → Services page (/services) — DC/MD/VA agency filing, from $499.
3. Architect Plans → Required for additions and whole-home projects before permit filing.
4. Contractor Match → Available after estimate. Vetted DMV contractors matched to scope.

CONSTRUCTION DOMAIN KNOWLEDGE
- "Do I need a permit?" → Almost always yes for structural changes, additions, electrical panel work, plumbing rough-in, HVAC ductwork, decks over 30 inches. Cosmetic work (paint, flooring, cabinets) typically does not.
- Permit timeline in DC/MD/VA: simple permits 2–4 weeks; complex/structural 6–12 weeks.
- AI concept renders are illustrative and pre-design — not permit-ready construction drawings.
- Permit-ready plans require a licensed architect and PE stamp for structural work.

PORTAL NAVIGATION
- Concept packages + deliverables: /deliverables
- Order estimate, permits, next services: /services
- Projects: /projects
- Payments: /payments
- Documents: /documents

Never direct portal users to public marketing pages (/permits, /concept, /estimate on kealee.com). Use portal paths. Speak as a confident Kealee team member. Plain text only — no markdown, no bullets. Keep answers to 2–4 sentences. Always end with a clear next step.`

// --- Path map ---
const PATH_MAP: Record<string, { label: string; href: string }> = {
  PERMIT:        { label: 'Get Permit Services',        href: '/permits' },
  DESIGN:        { label: 'See Design Services',        href: '/design-services' },
  ESTIMATE:      { label: 'Get an Estimate',            href: '/estimate' },
  AI_CONCEPT:    { label: 'Start AI Concept',           href: '/concept-engine' },
  MARKETPLACE:   { label: 'Find a Contractor',          href: '/marketplace' },
  MILESTONE_PAY: { label: 'Learn About Milestone Pay',  href: '/milestone-pay' },
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

  const findProduct = (key: string) => PUBLIC_PRODUCT_CATALOG.find(product => product.key === key)
  const permit = findProduct('permit_assessment')!
  const design = findProduct('professional_design')!
  const estimate = findProduct('detailed_estimate')!
  const concept = findProduct('concept')!

  if (/\b(site\s*plan|plot\s*plan|buildable|setback|parcel|zoning|land development)\b/.test(q)) {
    const preliminary = findProduct('preliminary_site_plan')!
    const verified = findProduct('verified_site_feasibility')!
    return {
      answer: `Kealee can analyze a parcel, setbacks, overlays, preliminary buildable area, and a proposed footprint. The ${preliminary.name} is ${formatCatalogPrice(preliminary)} and the ${verified.name} is ${formatCatalogPrice(verified)}; both are preliminary, not a survey or construction document, and require source verification and licensed professional review.`,
      recommendedPath: 'DESIGN',
      cta: { label: 'Explore Site Intelligence', href: '/products#site-intelligence' },
      related: [],
    }
  }

  const answers: Record<string, string> = {
    PERMIT: `Kealee's ${permit.name} is ${formatCatalogPrice(permit)} and identifies jurisdiction requirements, documents, and the submission path. Filing, professional drawings, agency fees, and comment-response coordination are scoped separately when required.`,
    DESIGN: `${design.name} starts at ${formatCatalogPrice(design)} and is scoped around the jurisdiction and required licensed professionals. For early decisions, use a concept or feasibility product first; preliminary outputs are not for construction.`,
    ESTIMATE: `Kealee's ${estimate.name} is ${formatCatalogPrice(estimate)} for a documented planning estimate. The actual cost to build is separate and depends on location, scope, square footage, existing conditions, finish level, and schedule.`,
    AI_CONCEPT: `The ${concept.name} starts at ${formatCatalogPrice(concept)} and provides property-specific visualization, preliminary layout, scope, and permit-path direction. It is preliminary feasibility, not for construction, and subject to licensed professional review.`,
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

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
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
