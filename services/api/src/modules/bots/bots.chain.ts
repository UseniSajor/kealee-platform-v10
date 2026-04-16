/**
 * bots.chain.ts
 *
 * KeaBots three-stage chain: DesignBot → EstimateBot → PermitBot
 *
 * Features:
 *   - Claude prompt caching (cache_control: ephemeral) on every system prompt
 *   - Chain-gating: EstimateBot blocks unless DesignBot run is COMPLETED
 *                   PermitBot blocks unless EstimateBot run is COMPLETED
 *   - RAG context injected into PermitBot system prompt (jurisdiction data)
 *   - CTC 2026 pricing injected into EstimateBot system prompt
 *   - KeaBotRun / BotDesignConcept / BotEstimateLineItem / PermitCase DB persistence
 *     (all DB calls are wrapped in try/catch — chain works without DB if needed)
 */

import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'crypto'

// ── Orchestrator imports (consolidated in lib/orchestrator/) ──────────────────
import {
  loadRAGData,
  isRAGLoaded,
  retrievePermitContext,
  retrieveCostContext,
  retrieveZoningContext,
  type PermitRecord,
  type CostRecord,
} from '../../lib/orchestrator/retrieval/rag-retriever'
import {
  calculateCTC,
  type CTCInput,
} from '../../lib/orchestrator/costing/ctc-calculator'

// ── Lazy Prisma client ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _prisma: any | null = null

function getPrisma() {
  if (_prisma) return _prisma
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('@prisma/client')
    _prisma = new PrismaClient()
    return _prisma
  } catch {
    return null
  }
}

// ── Anthropic client singleton ────────────────────────────────────────────────

let _anthropic: Anthropic | null = null
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _anthropic
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChainInput {
  projectId:         string
  userId?:           string
  orgId?:            string
  projectType:       string
  location:          string
  scope:             string
  sqft?:             number
  budgetUsd?:        number
  /** Used by PermitBot — defaults to `location` */
  jurisdiction?:     string
  zipCode?:          string
  structuralChanges?: boolean
  electricalChanges?: boolean
  plumbingChanges?:   boolean
  hvacChanges?:       boolean
}

export interface CachedCallResult {
  content:                  string
  model:                    string
  inputTokens:              number
  outputTokens:             number
  cacheCreationTokens:      number
  cacheReadTokens:          number
  estimatedCostUsd:         number
  /** True when cacheReadTokens > 0 */
  cacheHit:                 boolean
  savedTokens:              number
}

export interface DesignBotResult {
  botRunId:             string
  projectType:          string
  location:             string
  sqft:                 number
  budgetUsd:            number
  ctcTotal:             number
  ctcRange:             [number, number]
  ctcBreakdown:         Record<string, number>
  mepSystem:            Record<string, unknown>
  bom:                  BomItem[]
  bomItemCount:         number
  aiConceptCostUsd:     number
  estimatedTotalCostUsd: number
  cacheMetrics:         CacheMetrics
  durationMs:           number
}

export interface BomItem {
  item:             string
  quantity:         number
  unit:             string
  estimatedCost:    number
  ctcTaskNumber?:   string
  csiCode?:         string
}

export interface EstimateBotResult {
  botRunId:       string
  parentRunId:    string
  lineItems:      ChainLineItem[]
  totalLow:       number
  totalHigh:      number
  assumptions:    string[]
  exclusions:     string[]
  confidence:     number
  cacheMetrics:   CacheMetrics
  durationMs:     number
}

export interface ChainLineItem {
  category:      string
  description:   string
  csiCode?:      string
  ctcTaskNumber?: string
  quantity:      number
  unit:          string
  unitCost:      number
  inflationFactor: number
  subtotal:      number
  totalLow:      number
  totalHigh:     number
  laborHours?:   number
  laborRate?:    number
}

export interface PermitBotResult {
  botRunId:             string
  parentRunId:          string
  jurisdiction:         string
  zipCode:              string
  state:                string
  permits:              PermitOutput[]
  totalPermitCostUsd:   number
  totalProcessingDays:  number
  readinessScore:       number
  issues:               PermitIssueOutput[]
  recommendation:       string
  jurisdictionCacheHit: boolean
  cacheMetrics:         CacheMetrics
  durationMs:           number
}

export interface PermitOutput {
  permitType:       string
  agency:           string
  estimatedFee:     number
  processingDays:   number
  requiresPlans:    boolean
  requiresPE:       boolean
  notes:            string
}

export interface PermitIssueOutput {
  severity:   'blocking' | 'warning' | 'info'
  message:    string
  resolution: string
}

export interface CacheMetrics {
  cacheCreationTokens: number
  cacheReadTokens:     number
  cacheHit:            boolean
  savedTokens:         number
}

export interface ChainRunResult {
  chainId:           string
  projectId:         string
  design:            DesignBotResult
  estimate:          EstimateBotResult
  permit:            PermitBotResult
  totalChainCostUsd: number
  totalDurationMs:   number
}

// ── Chain error (gating) ──────────────────────────────────────────────────────

export class ChainGateError extends Error {
  constructor(
    message: string,
    public readonly stage: string,
    public readonly parentRunId?: string,
    public readonly parentStatus?: string,
  ) {
    super(message)
    this.name = 'ChainGateError'
  }
}

// ── Cost constants for cache pricing ─────────────────────────────────────────
// USD per 1 000 tokens — Anthropic prompt caching pricing
const COST_INPUT: Record<string, number>  = {
  'claude-opus-4-6':    0.015,
  'claude-sonnet-4-6':  0.003,
}
const COST_OUTPUT: Record<string, number> = {
  'claude-opus-4-6':    0.075,
  'claude-sonnet-4-6':  0.015,
}
// Cache write: 25% of base input price; cache read: ~10% of base input price
const CACHE_WRITE_MULTIPLIER = 0.25
const CACHE_READ_MULTIPLIER  = 0.10

function estimateCost(
  model:         string,
  inputTokens:   number,
  outputTokens:  number,
  cacheWrite:    number,
  cacheRead:     number,
): number {
  const inputRate  = COST_INPUT[model]  ?? 0.003
  const outputRate = COST_OUTPUT[model] ?? 0.015
  const regular    = (inputTokens  / 1000) * inputRate
  const output     = (outputTokens / 1000) * outputRate
  const write      = (cacheWrite   / 1000) * inputRate * CACHE_WRITE_MULTIPLIER
  const read       = (cacheRead    / 1000) * inputRate * CACHE_READ_MULTIPLIER
  return regular + output + write + read
}

// ── callModelCached — Anthropic call with prompt caching ──────────────────────

/**
 * Call Claude with `cache_control: {type: "ephemeral"}` on the system prompt.
 * Returns standard result plus cache creation / read token counts.
 */
async function callModelCached(params: {
  systemPrompt: string
  userPrompt:   string
  model:        string
  maxTokens?:   number
  temperature?: number
}): Promise<CachedCallResult> {
  const client    = getAnthropic()
  const maxTokens = params.maxTokens ?? 4096

  // cache_control is not in the SDK's default typings yet — cast through unknown
  const createParams = {
    model:       params.model,
    max_tokens:  maxTokens,
    temperature: params.temperature ?? 0.2,
    system: [
      {
        type:          'text',
        text:          params.systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      { role: 'user', content: params.userPrompt },
    ],
  } as unknown as Parameters<typeof client.messages.create>[0]

  const response = await client.messages.create(createParams)

  const content = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('')

  const usage = response.usage as typeof response.usage & {
    cache_creation_input_tokens?: number
    cache_read_input_tokens?:     number
  }

  const inputTokens          = usage.input_tokens
  const outputTokens         = usage.output_tokens
  const cacheCreationTokens  = usage.cache_creation_input_tokens ?? 0
  const cacheReadTokens      = usage.cache_read_input_tokens     ?? 0
  const cacheHit             = cacheReadTokens > 0
  const savedTokens          = cacheReadTokens

  const estimatedCostUsd = estimateCost(
    params.model, inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens,
  )

  return {
    content,
    model:  params.model,
    inputTokens,
    outputTokens,
    cacheCreationTokens,
    cacheReadTokens,
    estimatedCostUsd,
    cacheHit,
    savedTokens,
  }
}

// ── JSON extractor ────────────────────────────────────────────────────────────

function parseJSON<T>(raw: string, fallback: T): T {
  const fenced    = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  const candidate = fenced ? fenced[1] : raw.match(/(\{[\s\S]*\})/)?.[1]
  if (!candidate) return fallback
  try {
    return JSON.parse(candidate) as T
  } catch {
    return fallback
  }
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function dbCreateRun(params: {
  id:         string
  projectId:  string
  botType:    string
  chainOrder: number
  parentRunId?: string
  inputData:  unknown
}): Promise<void> {
  const prisma = getPrisma()
  if (!prisma) return
  try {
    await prisma.keaBotRun.create({
      data: {
        id:          params.id,
        projectId:   params.projectId,
        botType:     params.botType,
        status:      'IN_PROGRESS',
        chainOrder:  params.chainOrder,
        parentRunId: params.parentRunId ?? null,
        inputData:   params.inputData,
        startedAt:   new Date(),
      },
    })
  } catch (e: unknown) {
    console.warn('[Chain] dbCreateRun failed (Prisma may need generate):', (e as Error).message)
  }
}

async function dbCompleteRun(params: {
  id:               string
  outputData:       unknown
  modelUsed:        string
  inputTokens:      number
  outputTokens:     number
  cacheMetrics:     CacheMetrics
  estimatedCostUsd: number
  durationMs:       number
}): Promise<void> {
  const prisma = getPrisma()
  if (!prisma) return
  try {
    await prisma.keaBotRun.update({
      where: { id: params.id },
      data:  {
        status:          'COMPLETED',
        outputData:      params.outputData,
        modelUsed:       params.modelUsed,
        inputTokens:     params.inputTokens,
        outputTokens:    params.outputTokens,
        cacheMetrics:    params.cacheMetrics,
        estimatedCostUsd: params.estimatedCostUsd,
        durationMs:      params.durationMs,
        completedAt:     new Date(),
      },
    })
  } catch (e: unknown) {
    console.warn('[Chain] dbCompleteRun failed:', (e as Error).message)
  }
}

async function dbFailRun(id: string, errorMessage: string): Promise<void> {
  const prisma = getPrisma()
  if (!prisma) return
  try {
    await prisma.keaBotRun.update({
      where: { id },
      data:  { status: 'FAILED', errorMessage, completedAt: new Date() },
    })
  } catch {}
}

async function dbGetRunStatus(id: string): Promise<string | null> {
  const prisma = getPrisma()
  if (!prisma) return null
  try {
    const run = await prisma.keaBotRun.findUnique({ where: { id }, select: { status: true } })
    return run?.status ?? null
  } catch {
    return null
  }
}

// ── Ensure RAG is loaded ──────────────────────────────────────────────────────

function ensureRAG(): void {
  if (!isRAGLoaded()) {
    loadRAGData()
  }
}

// ── Stage 1: DesignBot ────────────────────────────────────────────────────────

const DESIGN_BOT_SYSTEM = `You are Kealee's DesignBot — an expert construction systems designer for the DC, Maryland, and Virginia (DMV) region.

Given a project brief, generate:
1. A MEP (Mechanical, Electrical, Plumbing) system design overview
2. A Bill of Materials (BOM) with CTC 2026 DMV pricing

Return ONLY valid JSON — no prose before or after:
{
  "mepSystem": {
    "hvac": "System description (e.g. ducted split, mini-split zones)",
    "electrical": "Service size, panel notes, key circuits",
    "plumbing": "Supply/waste strategy, fixture count estimate",
    "lighting": "Lighting strategy and control notes",
    "drainage": "Stormwater/drainage approach"
  },
  "bom": [
    {
      "item": "2×6 Framing Lumber",
      "quantity": 1200,
      "unit": "LF",
      "estimatedCost": 4500,
      "ctcTaskNumber": "06-11-10",
      "csiCode": "06 11 10"
    }
  ],
  "designNotes": "Brief design rationale (1-2 sentences)"
}

Use realistic 2026 DMV market quantities and costs.
ctcTaskNumber format: Division-Section-Task (e.g. "15-30-40" for HVAC ductwork).
csiCode format: CSI MasterFormat (e.g. "23 31 13").
Include 15-25 BOM items covering all major systems.`

export async function runDesignBot(input: ChainInput): Promise<DesignBotResult> {
  ensureRAG()
  const runId    = randomUUID()
  const sqft     = input.sqft ?? 1000
  const budgetUsd = input.budgetUsd ?? 0
  const startedAt = Date.now()

  await dbCreateRun({
    id:         runId,
    projectId:  input.projectId,
    botType:    'DesignBot',
    chainOrder: 1,
    inputData:  { ...input },
  })

  try {
    // ── CTC calculation using RAG cost data ─────────────────────────────────
    const jurisdiction = input.jurisdiction ?? input.location
    const costRecords  = retrieveCostContext(input.projectType, jurisdiction)
    const permitRecs   = retrievePermitContext(jurisdiction, input.projectType)
    const zoningRecs   = retrieveZoningContext(jurisdiction)

    const ctcInput: CTCInput = {
      projectType:   input.projectType,
      jurisdiction,
      sqft,
      costRecords,
      permitRecords: permitRecs,
      zoningRecords: zoningRecs,
    }
    const ctc = calculateCTC(ctcInput)

    const userPrompt = `Project Type: ${input.projectType}
Location: ${input.location}
Square Footage: ${sqft} SF
Budget: ${budgetUsd > 0 ? `$${budgetUsd.toLocaleString()}` : 'TBD'}
Scope: ${input.scope}

CTC 2026 DMV Estimate:
- Hard Cost: $${ctc.breakdown.construction.toLocaleString()}
- Soft Cost: $${ctc.breakdown.soft.toLocaleString()}
- Risk/Contingency: $${ctc.breakdown.risk.toLocaleString()}
- Execution: $${ctc.breakdown.execution.toLocaleString()}
- Total CTC: $${ctc.total.toLocaleString()} (range $${ctc.range[0].toLocaleString()}–$${ctc.range[1].toLocaleString()})

Generate the MEP system design and full BOM for this project.`

    const llmResult = await callModelCached({
      systemPrompt: DESIGN_BOT_SYSTEM,
      userPrompt,
      model:        'claude-opus-4-6',
      maxTokens:    4096,
      temperature:  0.3,
    })

    const parsed = parseJSON<{
      mepSystem?:    Record<string, unknown>
      bom?:          BomItem[]
      designNotes?:  string
    }>(llmResult.content, {})

    const mepSystem    = parsed.mepSystem ?? {}
    const bom          = parsed.bom ?? []
    const bomItemCount = bom.length

    // Kealee AI Concept service fee — from seed catalog (AI_DESIGN tier)
    // Minimum $445 per the 2026 CTC-justified service pricing
    const aiConceptCostUsd = Math.max(445, Math.round(ctc.total * 0.002))

    const cacheMetrics: CacheMetrics = {
      cacheCreationTokens: llmResult.cacheCreationTokens,
      cacheReadTokens:     llmResult.cacheReadTokens,
      cacheHit:            llmResult.cacheHit,
      savedTokens:         llmResult.savedTokens,
    }

    const durationMs = Date.now() - startedAt

    // ── Persist DesignConcept ────────────────────────────────────────────────
    const prisma = getPrisma()
    if (prisma) {
      try {
        await prisma.botDesignConcept.create({
          data: {
            projectId:             input.projectId,
            botRunId:              runId,
            projectType:           input.projectType,
            scope:                 input.scope,
            location:              input.location,
            sqft,
            budgetUsd:             budgetUsd > 0 ? budgetUsd : null,
            mepSystem,
            bom,
            aiConceptCostUsd,
            estimatedTotalCostUsd: ctc.total,
            ctcBreakdown:          { ...ctc.breakdown, total: ctc.total, range: ctc.range },
            bomItemCount,
          },
        })
      } catch (e: unknown) {
        console.warn('[Chain] DesignConcept persist failed:', (e as Error).message)
      }
    }

    await dbCompleteRun({
      id:               runId,
      outputData:       { ctcTotal: ctc.total, bomItemCount, cacheMetrics },
      modelUsed:        llmResult.model,
      inputTokens:      llmResult.inputTokens,
      outputTokens:     llmResult.outputTokens,
      cacheMetrics,
      estimatedCostUsd: llmResult.estimatedCostUsd,
      durationMs,
    })

    console.log(`[Chain:DesignBot] run=${runId} BOM=${bomItemCount} CTC=$${ctc.total.toLocaleString()} cache_hit=${llmResult.cacheHit} cost=$${llmResult.estimatedCostUsd.toFixed(4)}`)

    return {
      botRunId:              runId,
      projectType:           input.projectType,
      location:              input.location,
      sqft,
      budgetUsd,
      ctcTotal:              ctc.total,
      ctcRange:              ctc.range,
      ctcBreakdown:          ctc.breakdown as unknown as Record<string, number>,
      mepSystem,
      bom,
      bomItemCount,
      aiConceptCostUsd,
      estimatedTotalCostUsd: ctc.total,
      cacheMetrics,
      durationMs,
    }
  } catch (err: unknown) {
    const msg = (err instanceof Error) ? err.message : String(err)
    await dbFailRun(runId, msg)
    throw err
  }
}

// ── Stage 2: EstimateBot ──────────────────────────────────────────────────────

function buildEstimateSystemPrompt(ctcTotal: number, costRecords: CostRecord[]): string {
  const avgSqftCost = costRecords.length
    ? Math.round(costRecords.reduce((s, c) => s + c.cost_per_sqft, 0) / costRecords.length * 1.13)
    : 185

  return `You are Kealee's EstimateBot — a certified construction cost estimator for the DMV region using 2026 CTC pricing.

CTC 2026 Reference Data (inflation factor 1.13 applied):
- DMV average: $${avgSqftCost}/sqft (2026)
- Project CTC total: $${ctcTotal.toLocaleString()}
- Inflation factor: 1.13 (2023 base × 1.13 = 2026 DMV rates)

Generate a detailed line-item estimate. Return ONLY valid JSON:
{
  "lineItems": [
    {
      "category": "Framing",
      "description": "2×6 exterior wall framing @ 16\" OC",
      "csiCode": "06 11 10",
      "ctcTaskNumber": "06-11-10",
      "quantity": 1200,
      "unit": "LF",
      "unitCost": 15.82,
      "inflationFactor": 1.13,
      "subtotal": 18984,
      "totalLow": 17086,
      "totalHigh": 22781,
      "laborHours": 96,
      "laborRate": 89.50
    }
  ],
  "assumptions": ["Permits not included", "Owner selects finishes"],
  "exclusions": ["Furniture", "IT/AV", "Moving services"],
  "confidence": 0.82
}

Use CTC 2026 DMV unit costs. inflationFactor must be 1.13 for all items.
subtotal = quantity × unitCost × inflationFactor.
Include 15-25 line items covering all CSI divisions relevant to scope.
Categories: Demolition, Sitework, Concrete, Masonry, Framing, Roofing, Exterior,
Windows & Doors, Insulation, Drywall, Flooring, Tile, Cabinetry, Plumbing,
Electrical, HVAC, Painting, Specialties, General Conditions, OH&P (15%), Contingency (10%).`
}

export async function runEstimateBot(
  input:          ChainInput,
  designResult:   DesignBotResult,
): Promise<EstimateBotResult> {
  ensureRAG()
  const runId     = randomUUID()
  const startedAt = Date.now()

  // ── Chain gate ───────────────────────────────────────────────────────────
  // If DB is available, verify the design run is truly COMPLETED
  const parentStatus = await dbGetRunStatus(designResult.botRunId)
  if (parentStatus !== null && parentStatus !== 'COMPLETED') {
    throw new ChainGateError(
      `EstimateBot blocked — DesignBot run ${designResult.botRunId} has status ${parentStatus} (must be COMPLETED)`,
      'EstimateBot',
      designResult.botRunId,
      parentStatus,
    )
  }

  await dbCreateRun({
    id:          runId,
    projectId:   input.projectId,
    botType:     'EstimateBot',
    chainOrder:  2,
    parentRunId: designResult.botRunId,
    inputData:   {
      projectType: input.projectType,
      location:    input.location,
      sqft:        designResult.sqft,
      ctcTotal:    designResult.ctcTotal,
      bomItems:    designResult.bomItemCount,
    },
  })

  try {
    const jurisdiction = input.jurisdiction ?? input.location
    const costRecords  = retrieveCostContext(input.projectType, jurisdiction)

    const systemPrompt = buildEstimateSystemPrompt(designResult.ctcTotal, costRecords)

    // Summarise BOM for context (cap at 15 items to keep prompt reasonable)
    const bomSummary = designResult.bom.slice(0, 15).map(b =>
      `  - ${b.item}: ${b.quantity} ${b.unit} @ ~$${b.estimatedCost.toLocaleString()}`
    ).join('\n')

    const userPrompt = `Project: ${input.projectType}
Location: ${input.location}
Square Footage: ${designResult.sqft} SF
Scope: ${input.scope}
Design BOM (sample, ${designResult.bomItemCount} items total):
${bomSummary}

MEP Systems:
- HVAC: ${(designResult.mepSystem.hvac as string) ?? 'Per design'}
- Electrical: ${(designResult.mepSystem.electrical as string) ?? 'Per design'}
- Plumbing: ${(designResult.mepSystem.plumbing as string) ?? 'Per design'}

CTC Budget: $${designResult.ctcTotal.toLocaleString()} (range $${designResult.ctcRange[0].toLocaleString()}–$${designResult.ctcRange[1].toLocaleString()})

Generate the full 2026 CTC line-item estimate.`

    const llmResult = await callModelCached({
      systemPrompt,
      userPrompt,
      model:       'claude-sonnet-4-6',
      maxTokens:   4096,
      temperature: 0.15,
    })

    const parsed = parseJSON<{
      lineItems?:   ChainLineItem[]
      assumptions?: string[]
      exclusions?:  string[]
      confidence?:  number
    }>(llmResult.content, {})

    const lineItems  = (parsed.lineItems ?? []).map((li, i) => ({ ...li, sortOrder: i }))
    const totalLow   = lineItems.reduce((s, li) => s + (li.totalLow  ?? li.subtotal * 0.9), 0)
    const totalHigh  = lineItems.reduce((s, li) => s + (li.totalHigh ?? li.subtotal * 1.2), 0)
    const assumptions = parsed.assumptions ?? ['Permits not included']
    const exclusions  = parsed.exclusions  ?? ['Design fees', 'Furniture']
    const confidence  = parsed.confidence  ?? 0.75

    const cacheMetrics: CacheMetrics = {
      cacheCreationTokens: llmResult.cacheCreationTokens,
      cacheReadTokens:     llmResult.cacheReadTokens,
      cacheHit:            llmResult.cacheHit,
      savedTokens:         llmResult.savedTokens,
    }

    const durationMs = Date.now() - startedAt

    // ── Persist EstimateLineItems ────────────────────────────────────────────
    const prisma = getPrisma()
    if (prisma && lineItems.length > 0) {
      try {
        await prisma.botEstimateLineItem.createMany({
          data: lineItems.map((li, i) => ({
            id:              randomUUID(),
            projectId:       input.projectId,
            botRunId:        runId,
            category:        li.category,
            description:     li.description,
            csiCode:         li.csiCode ?? null,
            ctcTaskNumber:   li.ctcTaskNumber ?? null,
            quantity:        li.quantity,
            unit:            li.unit,
            unitCost:        li.unitCost,
            inflationFactor: li.inflationFactor ?? 1.13,
            subtotal:        li.subtotal,
            laborHours:      li.laborHours ?? null,
            laborRate:       li.laborRate  ?? null,
            sortOrder:       i,
          })),
        })
      } catch (e: unknown) {
        console.warn('[Chain] EstimateLineItem persist failed:', (e as Error).message)
      }
    }

    await dbCompleteRun({
      id:               runId,
      outputData:       { lineItemCount: lineItems.length, totalLow, totalHigh, confidence, cacheMetrics },
      modelUsed:        llmResult.model,
      inputTokens:      llmResult.inputTokens,
      outputTokens:     llmResult.outputTokens,
      cacheMetrics,
      estimatedCostUsd: llmResult.estimatedCostUsd,
      durationMs,
    })

    console.log(`[Chain:EstimateBot] run=${runId} items=${lineItems.length} total=$${totalLow.toLocaleString()}–$${totalHigh.toLocaleString()} cache_hit=${llmResult.cacheHit} cost=$${llmResult.estimatedCostUsd.toFixed(4)}`)

    return {
      botRunId:    runId,
      parentRunId: designResult.botRunId,
      lineItems,
      totalLow,
      totalHigh,
      assumptions,
      exclusions,
      confidence,
      cacheMetrics,
      durationMs,
    }
  } catch (err: unknown) {
    const msg = (err instanceof Error) ? err.message : String(err)
    await dbFailRun(runId, msg)
    throw err
  }
}

// ── Stage 3: PermitBot ────────────────────────────────────────────────────────

function buildPermitSystemPrompt(
  jurisdiction: string,
  permitRecords: PermitRecord[],
): string {
  const ragSection = permitRecords.length > 0
    ? `\n\nRAG Permit Data for "${jurisdiction}":\n` +
      permitRecords.slice(0, 8).map(p =>
        `- ${p.permit_type}: ${p.processing_days} days, base fee $${p.fee_base}` +
        (p.fee_per_sqft ? ` + $${p.fee_per_sqft}/sqft` : '') +
        (p.expedited_available ? ' (expedited available)' : '')
      ).join('\n')
    : '\n\nNo RAG permit data found for jurisdiction — use general DMV knowledge.'

  return `You are Kealee's PermitBot — a permit specialist with 15+ years experience in DC, Maryland, and Virginia building codes.
${ragSection}

Given a construction project, identify all required permits and any issues.

Return ONLY valid JSON:
{
  "permits": [
    {
      "permitType": "Building Permit",
      "agency": "Prince George's County DPIE",
      "estimatedFee": 1850,
      "processingDays": 45,
      "requiresPlans": true,
      "requiresPE": false,
      "notes": "Online submission available at pgcounty.gov/DPIE"
    }
  ],
  "issues": [
    {
      "severity": "warning",
      "message": "Zoning variance may be needed for proposed height",
      "resolution": "Submit variance application to Board of Zoning Appeals"
    }
  ],
  "readinessScore": 65,
  "recommendation": "1-2 sentence action plan"
}

severity: "blocking" | "warning" | "info"
Use real agency names, realistic timelines, and DMV-specific requirements.
If RAG data is provided above, prioritize those fees and timelines.`
}

function inferState(jurisdiction: string, location: string): string {
  const j = (jurisdiction + ' ' + location).toLowerCase()
  if (j.includes(' dc') || j.includes('washington dc') || j.includes('district')) return 'DC'
  if (j.includes(' md') || j.includes('maryland') || j.match(/\b(bethesda|rockville|silver spring|prince george|montgomery|pg county)\b/)) return 'MD'
  if (j.includes(' va') || j.includes('virginia') || j.match(/\b(arlington|fairfax|mclean|tysons|alexandria|loudoun)\b/)) return 'VA'
  return 'MD' // DMV default
}

export async function runPermitBot(
  input:          ChainInput,
  estimateResult: EstimateBotResult,
): Promise<PermitBotResult> {
  ensureRAG()
  const runId      = randomUUID()
  const startedAt  = Date.now()
  const jurisdiction = input.jurisdiction ?? input.location
  const zipCode      = input.zipCode ?? '00000'

  // ── Chain gate ───────────────────────────────────────────────────────────
  const parentStatus = await dbGetRunStatus(estimateResult.botRunId)
  if (parentStatus !== null && parentStatus !== 'COMPLETED') {
    throw new ChainGateError(
      `PermitBot blocked — EstimateBot run ${estimateResult.botRunId} has status ${parentStatus} (must be COMPLETED)`,
      'PermitBot',
      estimateResult.botRunId,
      parentStatus,
    )
  }

  await dbCreateRun({
    id:          runId,
    projectId:   input.projectId,
    botType:     'PermitBot',
    chainOrder:  3,
    parentRunId: estimateResult.botRunId,
    inputData:   {
      projectType:  input.projectType,
      jurisdiction,
      zipCode,
      sqft:         input.sqft,
      totalEstimate: estimateResult.totalLow,
    },
  })

  try {
    // ── RAG permit retrieval ─────────────────────────────────────────────────
    const permitRecords = retrievePermitContext(jurisdiction, input.projectType)
    const jurisdictionCacheHit = permitRecords.length > 0

    const systemPrompt = buildPermitSystemPrompt(jurisdiction, permitRecords)

    const userPrompt = `Project Type: ${input.projectType}
Location: ${input.location}
Jurisdiction: ${jurisdiction}
Square Footage: ${input.sqft ?? 'TBD'} SF
Scope: ${input.scope}
Structural Changes: ${input.structuralChanges ?? false}
Electrical Changes: ${input.electricalChanges ?? false}
Plumbing Changes: ${input.plumbingChanges ?? false}
HVAC Changes: ${input.hvacChanges ?? false}
Estimated Construction Cost: $${estimateResult.totalLow.toLocaleString()}–$${estimateResult.totalHigh.toLocaleString()}

Identify all required permits, issues, and provide a permitting action plan.`

    const llmResult = await callModelCached({
      systemPrompt,
      userPrompt,
      model:       'claude-sonnet-4-6',
      maxTokens:   4096,
      temperature: 0.15,
    })

    const parsed = parseJSON<{
      permits?:        PermitOutput[]
      issues?:         PermitIssueOutput[]
      readinessScore?: number
      recommendation?: string
    }>(llmResult.content, {})

    const permits             = parsed.permits         ?? []
    const issues              = parsed.issues          ?? []
    const readinessScore      = parsed.readinessScore  ?? 50
    const recommendation      = parsed.recommendation  ?? 'Engage a licensed permit expediter for jurisdiction-specific guidance.'
    const totalPermitCostUsd  = permits.reduce((s, p) => s + (p.estimatedFee ?? 0), 0)
    const totalProcessingDays = permits.length > 0
      ? Math.max(...permits.map(p => p.processingDays ?? 0))
      : 0

    const state = inferState(jurisdiction, input.location)

    const cacheMetrics: CacheMetrics = {
      cacheCreationTokens: llmResult.cacheCreationTokens,
      cacheReadTokens:     llmResult.cacheReadTokens,
      cacheHit:            llmResult.cacheHit,
      savedTokens:         llmResult.savedTokens,
    }

    const durationMs = Date.now() - startedAt

    // ── Persist PermitCase ───────────────────────────────────────────────────
    const prisma = getPrisma()
    if (prisma) {
      try {
        await prisma.permitCase.create({
          data: {
            projectId:            input.projectId,
            botRunId:             runId,
            zipCode,
            jurisdiction,
            state,
            permits,
            totalPermitCostUsd,
            totalProcessingDays,
            jurisdictionCacheHit,
          },
        })
      } catch (e: unknown) {
        console.warn('[Chain] PermitCase persist failed:', (e as Error).message)
      }
    }

    await dbCompleteRun({
      id:               runId,
      outputData:       { permitCount: permits.length, totalPermitCostUsd, totalProcessingDays, readinessScore, cacheMetrics },
      modelUsed:        llmResult.model,
      inputTokens:      llmResult.inputTokens,
      outputTokens:     llmResult.outputTokens,
      cacheMetrics,
      estimatedCostUsd: llmResult.estimatedCostUsd,
      durationMs,
    })

    console.log(`[Chain:PermitBot] run=${runId} permits=${permits.length} ragHit=${jurisdictionCacheHit} cache_hit=${llmResult.cacheHit} cost=$${llmResult.estimatedCostUsd.toFixed(4)}`)

    return {
      botRunId:             runId,
      parentRunId:          estimateResult.botRunId,
      jurisdiction,
      zipCode,
      state,
      permits,
      totalPermitCostUsd,
      totalProcessingDays,
      readinessScore,
      issues,
      recommendation,
      jurisdictionCacheHit,
      cacheMetrics,
      durationMs,
    }
  } catch (err: unknown) {
    const msg = (err instanceof Error) ? err.message : String(err)
    await dbFailRun(runId, msg)
    throw err
  }
}

// ── Full chain orchestrator ───────────────────────────────────────────────────

/**
 * Run the full DesignBot → EstimateBot → PermitBot chain.
 *
 * Returns all three results plus aggregate metrics.
 * Throws `ChainGateError` if any stage's parent is not COMPLETED.
 * Throws the underlying error for LLM failures.
 */
export async function runChain(input: ChainInput): Promise<ChainRunResult> {
  const chainId  = randomUUID()
  const wallStart = Date.now()

  console.log(`[Chain] START chainId=${chainId} project=${input.projectId} type=${input.projectType}`)

  const design   = await runDesignBot(input)
  const estimate = await runEstimateBot(input, design)
  const permit   = await runPermitBot(input, estimate)

  const totalChainCostUsd =
    (design.cacheMetrics.cacheCreationTokens + design.cacheMetrics.cacheReadTokens) * 0 + // tracked in runs
    design.durationMs * 0 // just accumulate estimate costs below

  // Sum up from what we stored in runs — re-derive from result metrics approximation
  // (exact costs are stored in KeaBotRun.estimatedCostUsd in DB)
  const totalDurationMs = Date.now() - wallStart

  console.log(`[Chain] DONE chainId=${chainId} duration=${totalDurationMs}ms`)

  return {
    chainId,
    projectId: input.projectId,
    design,
    estimate,
    permit,
    totalChainCostUsd: 0, // populated from DB if needed; stored per-run
    totalDurationMs,
  }
}
