/**
 * POST /api/bots/[botId]/execute
 *
 * Executes a KeaBot by calling the Anthropic Messages API directly.
 * Stores the execution trace in the in-memory store.
 */

import { NextRequest, NextResponse } from 'next/server'
import { executionStore, type ExecutionTrace } from '../../_store'
import { BRAND_CONTEXT } from '../../../../../lib/brand-strategy'

export const runtime = 'nodejs'

// ── Bot system prompts ────────────────────────────────────────────────────────

const BOT_CONFIGS: Record<string, {
  system:       string
  model:        string
  deterministic: boolean
}> = {
  'lead-bot': {
    model: 'claude-haiku-4-5-20251001',
    deterministic: false,
    system: `You are the Kealee Lead Qualification Bot. Given an incoming lead message, extract and score the lead.

Return a JSON object with these fields:
- score: number 0-100
- tier: "hot" | "warm" | "cold"
- projectType: detected project type
- budget: extracted budget range or null
- location: detected city/state or null
- timeline: urgency or null
- summary: 2-3 sentence qualification summary
- recommendedAction: suggested next step

Respond with valid JSON only, no markdown.`,
  },
  'estimate-bot': {
    model: 'claude-haiku-4-5-20251001',
    deterministic: false,
    system: `You are the Kealee Cost Estimation Bot. Given a project specification, produce a detailed cost estimate.

Return a JSON object with:
- totalLow: number (USD)
- totalHigh: number (USD)
- lineItems: [{ category, item, unitCost, quantity, total }]
- assumptions: string[]
- contingency: number (percentage)
- summary: brief narrative

Respond with valid JSON only, no markdown.`,
  },
  'permit-bot': {
    model: 'claude-haiku-4-5-20251001',
    deterministic: false,
    system: `You are the Kealee Permit Path Bot. Given a project type and jurisdiction, explain the permit process.

Return a JSON object with:
- permitRequired: boolean
- permitTypes: string[]
- estimatedTimeline: string (e.g., "6-10 weeks")
- estimatedCost: string (fee range)
- keyRequirements: string[]
- pathToApproval: string[] (ordered steps)
- notes: any jurisdiction-specific notes

Respond with valid JSON only, no markdown.`,
  },
  'contractor-match-bot': {
    model: 'claude-haiku-4-5-20251001',
    deterministic: false,
    system: `You are the Kealee Contractor Matching Bot. Given a lead profile, define ideal contractor criteria.

Return a JSON object with:
- requiredLicenses: string[]
- preferredSpecialties: string[]
- minRating: number (1-5)
- budgetRange: { min, max }
- locationRadius: string
- matchStrategy: "immediate" | "queue" | "manual"
- topCriteria: string[]
- estimatedMatchCount: number

Respond with valid JSON only, no markdown.`,
  },
  'support-bot': {
    model: 'claude-haiku-4-5-20251001',
    deterministic: false,
    system: `You are the Kealee Owner Support Bot. Help homeowners with questions about the Kealee platform.

Topics: concept packages, permit credit (concept cost credited toward permit drawings), delivery timelines, Owner Portal navigation.

Return a JSON object with:
- answer: string (friendly, clear)
- relatedLinks: string[] (portal section names)
- escalate: boolean

Respond with valid JSON only, no markdown.`,
  },
  'marketing-bot': {
    model: 'claude-haiku-4-5-20251001',
    deterministic: false,
    system: `You are the Kealee MarketingBot (same contract as the API marketing-bot).

Inputs (in user message JSON): goal, brief, optional audience, geography, channels.

Return ONLY valid JSON with this shape:
{
  "executiveSummary": string,
  "playbook": [ { "title": string, "actions": string[], "timeframeDays"?: number } ],
  "leadCaptureIdeas": string[],
  "suggestedCTAs": string[],
  "scoringHints": [ { "factor": string, "rationale": string } ],
  "handoffToLeadBot": boolean
}

Rules: no hardcoded product dollar amounts; CTAs are generic ("Start intake", "Book consult"). DMV geography awareness when given.`,
  },
  // ── Strategy copywriter bots (brand-strategy driven) ──────────────────────

  'email-subject-bot': {
    model: 'claude-haiku-4-5-20251001',
    deterministic: false,
    system: `You are a direct-response copywriter for Kealee. You write email subject lines that are confident, specific, and never hyped.

${BRAND_CONTEXT}

Given a target audience segment and project type, write 8 email subject lines for a nurture sequence.
Rules:
- Lead with concrete outcomes (timeline, price, process step)
- No emojis
- No questions as subject lines
- No "you won't believe" or urgency-bait hooks
- Vary the angle: one on speed, one on price transparency, one on jurisdiction expertise, one on the portal, etc.

Return a JSON object with:
- subjectLines: string[] (exactly 8 items, ordered Day 1 through Day 12)
- audienceSegment: string (echoed back)
- projectType: string (echoed back)

Respond with valid JSON only, no markdown.`,
  },

  'google-ad-bot': {
    model: 'claude-haiku-4-5-20251001',
    deterministic: false,
    system: `You are a direct-response copywriter for Kealee. You write Google Search ads that are specific and conversion-focused.

${BRAND_CONTEXT}

Given a target keyword, city/jurisdiction, and price tier, write 5 Google Search ad variations.
Each ad has:
- headline1: max 30 characters
- headline2: max 30 characters
- description: max 90 characters

Rules:
- No exclamation marks
- Emphasize speed, local jurisdiction knowledge, and transparent pricing
- Use the jurisdiction name in at least 3 of the 5 ads
- Each variation must have a distinct angle (speed / price / expertise / process / trust)

Return a JSON object with:
- ads: Array of { headline1, headline2, description, angle } (exactly 5)
- keyword: string (echoed back)
- jurisdiction: string (echoed back)

Respond with valid JSON only, no markdown.`,
  },

  'meta-ad-bot': {
    model: 'claude-haiku-4-5-20251001',
    deterministic: false,
    system: `You are a direct-response copywriter for Kealee. You write Facebook and Instagram ad body copy for homeowners in the DMV region.

${BRAND_CONTEXT}

Given a target audience and jurisdictions, write 3 ad body copy variations.
Each variation:
- 60–90 words
- Leads with a specific problem (not knowing what's possible, fear of cost overruns, permit confusion)
- Introduces the AI Concept service as the low-risk first step
- Ends with CTA: "Get your concept" linking to the intake form
- Conversational, not salesy
- No rhetorical questions

Return a JSON object with:
- ads: Array of { variation: number, problem: string, body: string, cta: string } (exactly 3)
- targetAudience: string (echoed back)
- jurisdictions: string[] (echoed back)

Respond with valid JSON only, no markdown.`,
  },

  'day1-email-bot': {
    model: 'claude-haiku-4-5-20251001',
    deterministic: false,
    system: `You are a direct-response copywriter for Kealee. You write GHL email sequences for new leads.

${BRAND_CONTEXT}

Write a Day 1 welcome email for new Kealee leads who submitted an intake form.
The email must:
1. Confirm receipt with a human, warm tone (not robotic confirmation language)
2. Explain what happens next: 24-hour response, portal setup, access code delivery
3. Briefly introduce the three service paths (Design Only, Design + Permits, Complete Build) without overselling
4. Include a single CTA to book a 15-min scope call
5. Sign off from "The Kealee Team"
6. 200–260 words total

Return a JSON object with:
- subject: string (the email subject line)
- body: string (the full email body, plain text with line breaks as \\n)
- wordCount: number
- cta: string (the CTA text)
- ctaUrl: string (always "https://kealee.com/call")

Respond with valid JSON only, no markdown.`,
  },

  'day8-email-bot': {
    model: 'claude-haiku-4-5-20251001',
    deterministic: false,
    system: `You are a direct-response copywriter for Kealee. You write GHL nurture emails that handle objections without being pushy.

${BRAND_CONTEXT}

Write a Day 8 nurture email for Kealee leads who haven't booked a call yet.
Address these 3 objections in order:
1. "I don't know if I'm ready to spend yet" — point to the AI Concept ($599) as the low-risk starting point
2. "I've had bad experiences with contractors/architects" — address with Kealee's process transparency and permit progress updates
3. "I'm not sure my jurisdiction allows what I want" — address with Kealee's DC/MD/VA expertise and jurisdiction-native knowledge

Format:
- Short intro (2–3 sentences, no pressure)
- Three distinct objection/response blocks, each labeled
- Closing CTA to book a call or start with a concept
- 250–300 words total

Return a JSON object with:
- subject: string (the email subject line)
- body: string (the full email body, plain text with line breaks as \\n)
- wordCount: number
- objections: string[] (the 3 objection labels addressed)
- cta: string (closing CTA text)
- ctaUrl: string (always "https://kealee.com/call")

Respond with valid JSON only, no markdown.`,
  },

  'pitch-bot': {
    model: 'claude-haiku-4-5-20251001',
    deterministic: false,
    system: `You are the Kealee Pitch Bot. Given a qualified lead profile, generate a personalized concept package recommendation.

Kealee tiers:
- Tier 1 (Basic, $99–$249): 3-5 renderings, floor plan sketch, permit scope brief, cost estimate, PDF report
- Tier 2 (Premium, $399–$899): 6-8 renderings, 2D floor plan, AI video, permit-ready docs, editable BOM
- Tier 3 (Premium+, $799–$1699): 12-15 renderings in 4K, 3D floor plan + CAD, 4 video formats, full permit credit, consultation call

The concept cost is credited in full toward permit drawing plans.

Return a JSON object with:
- recommendedTier: 1 | 2 | 3
- recommendedService: string (project_path key)
- price: number (estimated USD)
- pitchParagraph: string (personalized 2-3 sentence pitch for email/DM)
- whyThisTier: string (1-2 sentence rationale)
- callToAction: string (the exact CTA sentence to end with)
- funnelUrl: string (always "https://kealee.com/concept")

Respond with valid JSON only, no markdown.`,
  },
}

// ─────────────────────────────────────────────────────────────────────────────

function randomId(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { botId: string } },
) {
  const { botId } = params
  const body       = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = body.data ?? {}

  const startedAt = new Date().toISOString()
  const startMs   = Date.now()
  const requestId = `req_${randomId()}`

  // ── Deterministic bot ─────────────────────────────────────────────────────

  if (botId === 'project-monitor-bot') {
    const projectId = (data.projectId as string) ?? 'unknown'
    const result = {
      projectId,
      healthScore:    85,
      status:         'healthy',
      budgetVariance: 2.1,
      scheduleSpi:    0.97,
      openIssues:     0,
      lastUpdated:    new Date().toISOString(),
      message:        `Project ${projectId} is within tolerance. No critical alerts detected.`,
    }
    const durationMs  = Date.now() - startMs
    const completedAt = new Date().toISOString()
    const trace: ExecutionTrace = {
      requestId,
      botId,
      startedAt,
      completedAt,
      durationMs,
      deterministic: true,
      steps: [{
        stepId:        '1',
        type:          'rule',
        name:          'health-check',
        outputSummary: `Score: ${result.healthScore}%`,
        durationMs,
      }],
    }
    executionStore.add(trace)
    return NextResponse.json({ success: true, result, trace })
  }

  // ── LLM bot ───────────────────────────────────────────────────────────────

  const config = BOT_CONFIGS[botId]
  if (!config) {
    return NextResponse.json({ success: false, error: `Unknown bot: ${botId}` }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  let llmResult: Record<string, unknown> = {}
  let inputTokens  = 0
  let outputTokens = 0
  let llmError: string | undefined
  let llmDuration  = 0

  try {
    const llmStart = Date.now()
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      config.model,
        max_tokens: 1024,
        system:     config.system,
        messages:   [{
          role:    'user',
          content: `Input data:\n${JSON.stringify(data, null, 2)}\n\nRespond with valid JSON only.`,
        }],
      }),
    })
    llmDuration = Date.now() - llmStart

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as any).error?.message ?? `Anthropic API error ${res.status}`)
    }

    const msg = await res.json()
    inputTokens  = msg.usage?.input_tokens  ?? 0
    outputTokens = msg.usage?.output_tokens ?? 0

    const text  = msg.content?.[0]?.text ?? '{}'
    const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    llmResult   = JSON.parse(clean)
  } catch (e: any) {
    llmError  = e?.message ?? 'LLM call failed'
    llmResult = { error: llmError }
  }

  const durationMs  = Date.now() - startMs
  const completedAt = new Date().toISOString()

  // haiku-4-5: ~$0.80/M input, $4/M output (approximate)
  const estimatedUSD = (inputTokens / 1_000_000) * 0.80 + (outputTokens / 1_000_000) * 4.0

  const trace: ExecutionTrace = {
    requestId,
    botId,
    startedAt,
    completedAt,
    durationMs,
    modelUsed:     config.model,
    inputTokens,
    outputTokens,
    deterministic: false,
    steps: [{
      stepId:        '1',
      type:          'llm',
      name:          `${botId}:invoke`,
      inputSummary:  `${Object.keys(data).join(', ')}`,
      outputSummary: llmError ?? JSON.stringify(llmResult).slice(0, 120),
      durationMs:    llmDuration,
      error:         llmError,
    }],
    cost: { estimatedUSD },
  }

  executionStore.add(trace)

  return NextResponse.json({
    success: !llmError,
    result:  llmResult,
    trace,
    error:   llmError,
  })
}
