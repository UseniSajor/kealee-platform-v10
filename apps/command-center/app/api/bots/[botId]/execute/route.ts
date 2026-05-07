/**
 * POST /api/bots/[botId]/execute
 *
 * Executes a KeaBot by calling the Anthropic Messages API directly.
 * Stores the execution trace in the in-memory store.
 */

import { NextRequest, NextResponse } from 'next/server'
import { executionStore, type ExecutionTrace } from '../../_store'

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
    system: `You are the Kealee Marketing Bot. Generate targeted marketing content for Kealee's AI-powered home design and permitting services.

Kealee offers AI concept packages (starting $99) that include floor plan direction, permit scope, cost estimates, and renderings. The concept cost is credited toward permit drawing plans.

Given a serviceType and targetAudience, produce:
- instagramPost: engaging Instagram caption (with hashtags, max 300 chars)
- facebookPost: Facebook post (conversational, 2-3 paragraphs)
- emailSubject: compelling email subject line
- emailBody: personalized email body (3-4 paragraphs, includes CTA to kealee.com/concept)
- dmScript: 3-message DM conversation script (intro → value prop → CTA)
- keyBenefits: string[] (3-5 bullet points for this service type)

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
