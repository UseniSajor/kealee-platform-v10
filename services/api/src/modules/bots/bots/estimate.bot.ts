/**
 * estimate.bot.ts
 *
 * EstimateBot — Generates itemised construction cost estimates.
 *
 * Deterministic:  Location cost multiplier, quality tier multipliers
 * LLM:            Scope parsing, line-item generation, assumption extraction
 *
 * Output ranges reflect real DC/MD/VA market rates (2024-2025).
 * All estimates are for budgeting only — not contract-ready.
 */

import { randomUUID } from 'crypto'
import { callModel, parseJSON, isLLMAvailable } from '../bots.router'
import { startStep, newRequestId, recordTrace } from '../bots.logger'
import type {
  IBot, BotInput, BotOutput, BotContext,
  EstimateBotInput, EstimateBotOutput, EstimateLineItem,
} from '../bots.types'

// ── Deterministic rate tables ─────────────────────────────────────────────────

// Base $/sqft by project type and quality (DC metro baseline)
const BASE_RATES: Record<string, Record<string, [number, number]>> = {
  renovation: {
    standard: [80,  140],
    premium:  [140, 220],
    luxury:   [220, 400],
  },
  addition: {
    standard: [120, 180],
    premium:  [180, 280],
    luxury:   [280, 450],
  },
  new_build: {
    standard: [150, 230],
    premium:  [230, 350],
    luxury:   [350, 600],
  },
  multifamily: {
    standard: [100, 160],
    premium:  [160, 250],
    luxury:   [250, 400],
  },
  commercial: {
    standard: [90,  150],
    premium:  [150, 240],
    luxury:   [240, 380],
  },
}

const LOCATION_MULTIPLIER: Record<string, number> = {
  dc: 1.25, washington: 1.25,
  bethesda: 1.20, chevy_chase: 1.22, potomac: 1.20,
  arlington: 1.18, mclean: 1.20, tysons: 1.15,
  alexandria: 1.12, fairfax: 1.10,
  maryland: 1.05, virginia: 1.05,
  default: 1.0,
}

function getLocationMultiplier(location: string): number {
  const l = location.toLowerCase()
  for (const [key, mult] of Object.entries(LOCATION_MULTIPLIER)) {
    if (l.includes(key)) return mult
  }
  return LOCATION_MULTIPLIER.default
}

function getTypeKey(projectType: string): string {
  const t = projectType.toLowerCase()
  if (t.includes('renov') || t.includes('remodel')) return 'renovation'
  if (t.includes('addition')) return 'addition'
  if (t.includes('new') || t.includes('ground.up')) return 'new_build'
  if (t.includes('multi') || t.includes('apartment')) return 'multifamily'
  if (t.includes('commercial') || t.includes('office') || t.includes('retail')) return 'commercial'
  return 'renovation'
}

// ── LLM Prompt ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert construction cost estimator for the DC, Maryland, and Virginia market.

Given a project description, generate a detailed line-item cost estimate.

Return ONLY a JSON object (no prose, no markdown outside the JSON) with this exact structure:
{
  "breakdown": [
    {
      "category": "Demolition",
      "description": "Remove existing finishes, walls per scope",
      "unitCost": 8000,
      "quantity": 1,
      "unit": "LS",
      "totalLow": 6000,
      "totalHigh": 10000,
      "confidence": "high"
    }
  ],
  "assumptions": ["Permits excluded", "Owner provides selections"],
  "exclusions": ["Furniture", "IT/AV", "Moving services"],
  "confidence": 0.78
}

Categories to consider (use what's relevant):
Demolition, Structural, Foundation, Framing, Roofing, Exterior, Windows & Doors,
Insulation, Drywall, Flooring, Tile Work, Cabinetry & Millwork, Plumbing,
Electrical, HVAC, Painting, Fixtures & Hardware, Specialties, General Conditions,
Contractor OH&P (15-20%), Contingency (10-15%)

Use DC metro market rates (2024-2025).
Confidence: "high" (well-defined), "medium" (assumptions needed), "low" (rough order of magnitude).
Overall confidence 0.0-1.0 based on detail provided.`

// ── Bot class ─────────────────────────────────────────────────────────────────

export class EstimateBot implements IBot<EstimateBotInput, EstimateBotOutput> {
  readonly id          = 'estimate-bot' as const
  readonly name        = 'EstimateBot'
  readonly description = 'Generates itemised construction cost estimates for DC/MD/VA projects'
  readonly version     = '1.0.0'
  readonly costProfile = 'medium' as const
  readonly requiresLLM = true

  async execute(
    input: BotInput<EstimateBotInput>,
    ctx:   BotContext,
  ): Promise<BotOutput<EstimateBotOutput>> {
    const { data }  = input
    const requestId = ctx.requestId
    const startedAt = new Date()
    const steps     = []

    // ── Step 1: Deterministic pre-estimate ───────────────────────────────────
    const preTimer = startStep('deterministic', 'base_rate_estimate', data.projectType)
    const typeKey  = getTypeKey(data.projectType)
    const quality  = data.qualityLevel ?? 'standard'
    const rates    = BASE_RATES[typeKey]?.[quality] ?? BASE_RATES.renovation.standard
    const locMult  = getLocationMultiplier(data.location)
    const sqft     = data.squareFootage ?? 1000

    const preEstimateLow  = Math.round(rates[0] * locMult * sqft)
    const preEstimateHigh = Math.round(rates[1] * locMult * sqft)
    steps.push(preTimer.finish(`$${preEstimateLow.toLocaleString()}–$${preEstimateHigh.toLocaleString()}`))

    // ── Step 2: LLM line-item generation ──────────────────────────────────────
    let breakdown: EstimateLineItem[] = []
    let assumptions: string[] = ['Permits excluded unless noted', 'Owner provides selections']
    let exclusions:  string[] = ['Design fees', 'Furniture', 'Moving services']
    let confidence   = 0.65
    let modelUsed: string | undefined
    let inputTokens  = 0
    let outputTokens = 0
    let costUSD      = 0

    const userPrompt = `Project: ${data.projectType}
Location: ${data.location}${data.squareFootage ? `\nSq ft: ${data.squareFootage}` : ''}
Quality: ${quality}
Scope: ${data.scopeOfWork}${data.existingConditions ? `\nExisting: ${data.existingConditions}` : ''}
Budget range from pre-estimate: $${preEstimateLow.toLocaleString()}–$${preEstimateHigh.toLocaleString()}`

    if (isLLMAvailable()) {
      const llmTimer = startStep('llm', 'generate_line_items', data.projectType)
      try {
        const result = await callModel({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt,
          tier:         'standard',
          temperature:  0.2,
        })

        const parsed = parseJSON<{
          breakdown?:    EstimateLineItem[]
          assumptions?:  string[]
          exclusions?:   string[]
          confidence?:   number
        }>(result.content, {})

        breakdown    = parsed.breakdown    ?? breakdown
        assumptions  = parsed.assumptions  ?? assumptions
        exclusions   = parsed.exclusions   ?? exclusions
        confidence   = parsed.confidence   ?? confidence
        modelUsed    = result.model
        inputTokens  = result.inputTokens
        outputTokens = result.outputTokens
        costUSD      = result.estimatedCostUSD
        steps.push(llmTimer.finish(`${breakdown.length} line items`))
      } catch (err: any) {
        steps.push(llmTimer.finish(undefined, err.message))
        // Fall back to a generic breakdown
        breakdown = buildFallbackBreakdown(preEstimateLow, preEstimateHigh)
      }
    } else {
      breakdown = buildFallbackBreakdown(preEstimateLow, preEstimateHigh)
    }

    // ── Step 3: Reconcile totals ──────────────────────────────────────────────
    const totalsTimer = startStep('deterministic', 'reconcile_totals')
    const totalLow  = breakdown.length > 0
      ? breakdown.reduce((s, i) => s + i.totalLow,  0)
      : preEstimateLow
    const totalHigh = breakdown.length > 0
      ? breakdown.reduce((s, i) => s + i.totalHigh, 0)
      : preEstimateHigh
    steps.push(totalsTimer.finish(`$${totalLow.toLocaleString()}–$${totalHigh.toLocaleString()}`))

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
        estimateId:         randomUUID(),
        totalLow,
        totalHigh,
        breakdown,
        assumptions,
        exclusions,
        validityPeriodDays: 30,
        confidence,
      },
      trace,
    }
  }
}

// ── Fallback (no LLM) ─────────────────────────────────────────────────────────

function buildFallbackBreakdown(low: number, high: number): EstimateLineItem[] {
  // Generic 8-category split based on industry averages
  const ranges: [string, number][] = [
    ['Demolition & Site',            0.05],
    ['Framing & Structural',         0.12],
    ['MEP (Plumbing, Electric, HVAC)', 0.25],
    ['Exterior & Roofing',           0.10],
    ['Interior Finishes',            0.20],
    ['Fixtures & Equipment',         0.08],
    ['General Conditions',           0.07],
    ['Contractor OH&P + Contingency', 0.13],
  ]
  return ranges.map(([category, pct]) => ({
    category,
    description:  `Allowance for ${category.toLowerCase()}`,
    unitCost:     Math.round(low * pct),
    quantity:     1,
    unit:         'LS',
    totalLow:     Math.round(low  * pct),
    totalHigh:    Math.round(high * pct),
    confidence:   'low' as const,
  }))
}
