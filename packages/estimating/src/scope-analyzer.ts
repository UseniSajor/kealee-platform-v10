/**
 * AI-Powered Scope Analyzer
 *
 * Converts natural-language project descriptions into detailed, assembly-level
 * cost estimates by combining Claude's reasoning with the platform's assembly
 * library and pricing engine.
 *
 * Flow:
 *   1. User describes project in plain English
 *   2. Claude maps description → assembly codes + quantities + assumptions
 *   3. EstimatingService prices each assembly using real cost data
 *   4. Returns structured scope breakdown with range, assumptions, and questions
 *
 * Integration:
 *   - Called by /api/v1/scope-analysis/analyze (public quick scope)
 *   - Called by /api/v1/scope-analysis/analyze-detailed (logged-in, persists)
 *   - Result feeds into Lead.suggestedPrice + Lead.priceRange
 *   - Contractors see assembly breakdown when bidding
 */

import Anthropic from '@anthropic-ai/sdk'
import Decimal from 'decimal.js'
import {
  PROJECT_TYPE_ASSEMBLIES,
  getProjectTypes,
  type ProjectTypeConfig,
} from './project-type-mappings'
import { MARKETPLACE_ASSEMBLIES, type MarketplaceAssembly } from './seed-assemblies'

// ============================================================================
// TYPES
// ============================================================================

export interface ScopeAnalysisInput {
  /** Natural language project description */
  description: string
  /** Optional pre-selected project type (helps narrow scope) */
  projectType?: string
  /** Approximate square footage */
  sqft?: number
  /** Project address or city/region for pricing */
  address?: string
  /** Quality preference */
  qualityTier?: 'low' | 'mid' | 'high'
  /** Additional context from photos (descriptions of what was seen) */
  photoDescriptions?: string[]
}

export interface ScopeLineItem {
  assemblyCode: string
  assemblyName: string
  quantity: number
  unit: string
  materialCost: number
  laborCost: number
  totalCost: number
  reasoning: string
}

export interface ScopeAssumption {
  category: string
  assumption: string
  impact: 'low' | 'medium' | 'high'
}

export interface ClarifyingQuestion {
  id: string
  question: string
  options?: string[]
  impact: string
  category: string
}

export interface ScopeAnalysisResult {
  /** Detected or confirmed project type */
  projectType: string
  projectTypeName: string
  /** Scope summary from AI */
  summary: string
  /** Estimated total (selected tier) */
  estimatedTotal: number
  /** Price range across quality tiers */
  priceRange: {
    low: number
    mid: number
    high: number
  }
  /** Assembly-level cost breakdown */
  lineItems: ScopeLineItem[]
  /** AI assumptions made during analysis */
  assumptions: ScopeAssumption[]
  /** Questions AI wants answered for better accuracy */
  clarifyingQuestions: ClarifyingQuestion[]
  /** Estimated duration in working days */
  estimatedDuration: number
  /** Trades required */
  tradesRequired: string[]
  /** Pricing metadata */
  pricingMeta: {
    qualityTier: string
    location: string
    sqft: number
    overheadPercent: number
    profitPercent: number
    contingencyPercent: number
    regionMultiplier: number
  }
  /** Confidence score 0-100 */
  confidence: number
  /** Raw AI response for debugging */
  aiModelUsed: string
}

export interface RefinementInput {
  /** The original analysis result */
  originalAnalysis: ScopeAnalysisResult
  /** User answers to clarifying questions */
  answers: Record<string, string>
  /** Additional description from user */
  additionalContext?: string
}

// Internal type for the Claude response
interface AIAnalysisResponse {
  projectType: string
  summary: string
  lineItems: Array<{
    assemblyCode: string
    quantity: number
    reasoning: string
  }>
  assumptions: Array<{
    category: string
    assumption: string
    impact: 'low' | 'medium' | 'high'
  }>
  clarifyingQuestions: Array<{
    question: string
    options?: string[]
    impact: string
    category: string
  }>
  estimatedDuration: number
  confidence: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 4096
const OVERHEAD_PERCENT = 12
const PROFIT_PERCENT = 15
const CONTINGENCY_PERCENT = 7

// ============================================================================
// SCOPE ANALYZER CLASS
// ============================================================================

export class ScopeAnalyzer {
  private claude: Anthropic
  private prisma: any
  private assemblyIndex: Map<string, MarketplaceAssembly>

  constructor(prisma: any) {
    this.prisma = prisma
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    // Build fast lookup index
    this.assemblyIndex = new Map()
    for (const assembly of MARKETPLACE_ASSEMBLIES) {
      this.assemblyIndex.set(assembly.code, assembly)
    }
  }

  // ──────────────────────────────────────────────────────────────
  // analyzeScope — Primary method
  // ──────────────────────────────────────────────────────────────

  /**
   * Analyze a natural-language project description and produce a scoped estimate.
   */
  async analyzeScope(input: ScopeAnalysisInput): Promise<ScopeAnalysisResult> {
    const tier = input.qualityTier ?? 'mid'
    const location = input.address ?? 'Baltimore'

    // Step 1: Ask Claude to interpret the scope
    const aiResult = await this.callClaude(input)

    // Step 2: Resolve project type
    const projectType = aiResult.projectType || input.projectType || 'general'
    const projectConfig = PROJECT_TYPE_ASSEMBLIES[projectType]
    const projectTypeName = projectConfig?.name ?? this.humanizeProjectType(projectType)

    // Step 3: Price each line item using real cost data
    const lineItems = await this.priceLineItems(aiResult.lineItems, tier, location)

    // Step 4: Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.totalCost, 0)
    const overhead = subtotal * (OVERHEAD_PERCENT / 100)
    const profit = subtotal * (PROFIT_PERCENT / 100)
    const contingency = subtotal * (CONTINGENCY_PERCENT / 100)
    const total = new Decimal(subtotal)
      .plus(overhead)
      .plus(profit)
      .plus(contingency)
      .toDecimalPlaces(2)
      .toNumber()

    // Step 5: Calculate low/high range
    const lineItemsLow = await this.priceLineItems(aiResult.lineItems, 'low', location)
    const lineItemsHigh = await this.priceLineItems(aiResult.lineItems, 'high', location)
    const subtotalLow = lineItemsLow.reduce((sum, item) => sum + item.totalCost, 0)
    const subtotalHigh = lineItemsHigh.reduce((sum, item) => sum + item.totalCost, 0)

    const calcTotal = (sub: number) => {
      const d = new Decimal(sub)
      return d
        .plus(d.times(OVERHEAD_PERCENT / 100))
        .plus(d.times(PROFIT_PERCENT / 100))
        .plus(d.times(CONTINGENCY_PERCENT / 100))
        .toDecimalPlaces(2)
        .toNumber()
    }

    // Step 6: Collect trades
    const tradesSet = new Set<string>()
    for (const item of lineItems) {
      const assembly = this.assemblyIndex.get(item.assemblyCode)
      if (assembly) {
        assembly.tradesRequired.forEach((t) => tradesSet.add(t))
      }
    }

    // Step 7: Determine region multiplier
    const regionMult = this.getLocationMultiplier(location)

    // Step 8: Compute sqft
    const sqft = input.sqft ?? projectConfig?.defaultSqft ?? 1000

    return {
      projectType,
      projectTypeName,
      summary: aiResult.summary,
      estimatedTotal: total,
      priceRange: {
        low: calcTotal(subtotalLow),
        mid: total,
        high: calcTotal(subtotalHigh),
      },
      lineItems,
      assumptions: aiResult.assumptions,
      clarifyingQuestions: aiResult.clarifyingQuestions.map((q, i) => ({
        id: `q-${i}`,
        ...q,
      })),
      estimatedDuration: aiResult.estimatedDuration,
      tradesRequired: [...tradesSet],
      pricingMeta: {
        qualityTier: tier,
        location,
        sqft,
        overheadPercent: OVERHEAD_PERCENT,
        profitPercent: PROFIT_PERCENT,
        contingencyPercent: CONTINGENCY_PERCENT,
        regionMultiplier: regionMult,
      },
      confidence: aiResult.confidence,
      aiModelUsed: MODEL,
    }
  }

  // ──────────────────────────────────────────────────────────────
  // refineEstimate — Re-analyze with user answers
  // ──────────────────────────────────────────────────────────────

  /**
   * Refine an existing estimate by incorporating user answers to clarifying questions.
   */
  async refineEstimate(refinement: RefinementInput): Promise<ScopeAnalysisResult> {
    const original = refinement.originalAnalysis

    // Build a more specific description that includes the answers
    const answersText = Object.entries(refinement.answers)
      .map(([questionId, answer]) => {
        const question = original.clarifyingQuestions.find((q) => q.id === questionId)
        return question ? `Q: ${question.question}\nA: ${answer}` : ''
      })
      .filter(Boolean)
      .join('\n\n')

    const refinedDescription = [
      `Original description: ${original.summary}`,
      `Project type: ${original.projectTypeName}`,
      `Square footage: ${original.pricingMeta.sqft}`,
      `Quality tier: ${original.pricingMeta.qualityTier}`,
      '',
      'Additional clarifications from the homeowner:',
      answersText,
      refinement.additionalContext
        ? `\nAdditional context: ${refinement.additionalContext}`
        : '',
    ].join('\n')

    return this.analyzeScope({
      description: refinedDescription,
      projectType: original.projectType,
      sqft: original.pricingMeta.sqft,
      address: original.pricingMeta.location,
      qualityTier: original.pricingMeta.qualityTier as 'low' | 'mid' | 'high',
    })
  }

  // ──────────────────────────────────────────────────────────────
  // Private: Claude API call
  // ──────────────────────────────────────────────────────────────

  private async callClaude(input: ScopeAnalysisInput): Promise<AIAnalysisResponse> {
    const systemPrompt = this.buildSystemPrompt()
    const userPrompt = this.buildUserPrompt(input)

    const response = await this.claude.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    // Extract text content
    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI model')
    }

    // Parse JSON from response
    const jsonMatch = textBlock.text.match(/```json\s*([\s\S]*?)\s*```/)
    const jsonStr = jsonMatch ? jsonMatch[1] : textBlock.text

    try {
      const parsed = JSON.parse(jsonStr.trim())
      return this.validateAIResponse(parsed)
    } catch (err) {
      // Try to extract JSON object directly
      const objectMatch = textBlock.text.match(/\{[\s\S]*\}/)
      if (objectMatch) {
        try {
          const parsed = JSON.parse(objectMatch[0])
          return this.validateAIResponse(parsed)
        } catch {
          // Fall through
        }
      }
      throw new Error(`Failed to parse AI response: ${(err as Error).message}`)
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Private: Build prompts
  // ──────────────────────────────────────────────────────────────

  private buildSystemPrompt(): string {
    // Build assembly catalog summary for context
    const categories = new Map<string, string[]>()
    for (const a of MARKETPLACE_ASSEMBLIES) {
      const cat = a.category
      if (!categories.has(cat)) categories.set(cat, [])
      categories.get(cat)!.push(`${a.code}: ${a.name} (${a.unit})`)
    }

    const catalogSummary = [...categories.entries()]
      .map(([cat, items]) => {
        // Limit items per category to keep prompt manageable
        const shown = items.slice(0, 15)
        const more = items.length > 15 ? ` ...and ${items.length - 15} more` : ''
        return `### ${cat}\n${shown.join('\n')}${more}`
      })
      .join('\n\n')

    // Available project types
    const projectTypes = getProjectTypes()
      .map((pt) => `- ${pt.key}: ${pt.name} (default ${pt.defaultSqft} sqft)`)
      .join('\n')

    return `You are an expert construction estimator for the DC-Baltimore metropolitan area. You work for Kealee, a construction project management platform.

Your job is to analyze a homeowner's project description and map it to specific assembly codes from our library. You must be precise — each assembly code you reference must exist in our catalog.

## Available Project Types
${projectTypes}

## Assembly Catalog
${catalogSummary}

## Rules
1. ONLY use assembly codes that exist in the catalog above. Do not invent codes.
2. Estimate quantities based on the described scope, square footage, and standard construction practices.
3. When the description is vague, make reasonable assumptions based on typical DC-Baltimore area residential projects.
4. Flag assumptions clearly — the homeowner needs to validate them.
5. Ask clarifying questions that would significantly impact the estimate (>5% cost change).
6. For duration, estimate in working days assuming a typical crew size for the project type.
7. Your confidence score (0-100) should reflect how well you understood the scope:
   - 90-100: Very clear description with specific details
   - 70-89: Good description but missing some details
   - 50-69: Vague description requiring several assumptions
   - Below 50: Very unclear, many assumptions needed

## Response Format
You MUST respond with a JSON object in this exact format (wrapped in \`\`\`json\`\`\`):

\`\`\`json
{
  "projectType": "kitchen_renovation",
  "summary": "Brief 1-2 sentence summary of the interpreted scope",
  "lineItems": [
    {
      "assemblyCode": "KIT-DEMO-FULL",
      "quantity": 150,
      "reasoning": "Full kitchen demo for 150 sqft kitchen"
    }
  ],
  "assumptions": [
    {
      "category": "Scope",
      "assumption": "Assuming standard layout without moving plumbing",
      "impact": "medium"
    }
  ],
  "clarifyingQuestions": [
    {
      "question": "Are you planning to keep the current kitchen layout or relocate the sink/stove?",
      "options": ["Keep current layout", "Relocate sink", "Relocate stove", "Full layout change"],
      "impact": "Layout changes could add $2,000-$8,000 for plumbing and electrical relocation",
      "category": "Layout"
    }
  ],
  "estimatedDuration": 15,
  "confidence": 72
}
\`\`\`

Important: Do not include any text before or after the JSON block.`
  }

  private buildUserPrompt(input: ScopeAnalysisInput): string {
    const parts: string[] = []

    parts.push(`Project Description:\n${input.description}`)

    if (input.projectType) {
      const config = PROJECT_TYPE_ASSEMBLIES[input.projectType]
      parts.push(`\nProject Type: ${input.projectType} (${config?.name ?? 'Unknown'})`)
    }

    if (input.sqft) {
      parts.push(`\nSquare Footage: ${input.sqft} sqft`)
    }

    if (input.address) {
      parts.push(`\nLocation: ${input.address}`)
    }

    if (input.qualityTier) {
      const tierLabels = { low: 'Budget/Economy', mid: 'Mid-Range/Standard', high: 'Premium/High-End' }
      parts.push(`\nQuality Level: ${tierLabels[input.qualityTier]}`)
    }

    if (input.photoDescriptions?.length) {
      parts.push(`\nPhoto Observations:\n${input.photoDescriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')}`)
    }

    return parts.join('\n')
  }

  // ──────────────────────────────────────────────────────────────
  // Private: Validate AI response
  // ──────────────────────────────────────────────────────────────

  private validateAIResponse(raw: any): AIAnalysisResponse {
    // Validate and sanitize the AI response
    const validProjectTypes = new Set(Object.keys(PROJECT_TYPE_ASSEMBLIES))

    let projectType = raw.projectType || 'general'
    if (!validProjectTypes.has(projectType)) {
      // Try to find closest match
      const lower = projectType.toLowerCase().replace(/[\s-]/g, '_')
      const match = [...validProjectTypes].find((pt) => pt === lower)
      projectType = match ?? 'general'
    }

    // Validate assembly codes
    const validLineItems = (raw.lineItems || [])
      .filter((item: any) => {
        const exists = this.assemblyIndex.has(item.assemblyCode)
        if (!exists) {
          console.warn(`[ScopeAnalyzer] AI referenced unknown assembly: ${item.assemblyCode}`)
        }
        return exists && item.quantity > 0
      })
      .map((item: any) => ({
        assemblyCode: item.assemblyCode,
        quantity: Math.max(0.01, Number(item.quantity) || 1),
        reasoning: String(item.reasoning || ''),
      }))

    // If AI returned no valid line items, fall back to project type defaults
    if (validLineItems.length === 0 && PROJECT_TYPE_ASSEMBLIES[projectType]) {
      const config = PROJECT_TYPE_ASSEMBLIES[projectType]
      for (const mapping of config.assemblies) {
        if (this.assemblyIndex.has(mapping.code)) {
          validLineItems.push({
            assemblyCode: mapping.code,
            quantity: mapping.quantityPer === 'sqft' ? (raw.sqft || config.defaultSqft) * (mapping.multiplier ?? 1) : (mapping.quantity ?? 1),
            reasoning: `Default assembly for ${config.name}`,
          })
        }
      }
    }

    return {
      projectType,
      summary: String(raw.summary || 'Project scope analysis'),
      lineItems: validLineItems,
      assumptions: (raw.assumptions || []).map((a: any) => ({
        category: String(a.category || 'General'),
        assumption: String(a.assumption || ''),
        impact: ['low', 'medium', 'high'].includes(a.impact) ? a.impact : 'medium',
      })),
      clarifyingQuestions: (raw.clarifyingQuestions || []).slice(0, 5).map((q: any) => ({
        question: String(q.question || ''),
        options: Array.isArray(q.options) ? q.options.map(String) : undefined,
        impact: String(q.impact || ''),
        category: String(q.category || 'General'),
      })),
      estimatedDuration: Math.max(1, Number(raw.estimatedDuration) || 5),
      confidence: Math.min(100, Math.max(0, Number(raw.confidence) || 50)),
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Private: Price line items
  // ──────────────────────────────────────────────────────────────

  private async priceLineItems(
    items: Array<{ assemblyCode: string; quantity: number; reasoning: string }>,
    tier: 'low' | 'mid' | 'high',
    location: string
  ): Promise<ScopeLineItem[]> {
    const result: ScopeLineItem[] = []

    // First try to get assemblies from database
    const codes = items.map((i) => i.assemblyCode)
    let dbAssemblies: Map<string, any> = new Map()

    try {
      const rows = await this.prisma.assembly.findMany({
        where: { code: { in: codes }, isActive: true },
      })
      for (const row of rows) {
        dbAssemblies.set(row.code, row)
      }
    } catch {
      // Database may not have assemblies seeded yet — fall back to seed data
    }

    for (const item of items) {
      const dbAssembly = dbAssemblies.get(item.assemblyCode)
      const seedAssembly = this.assemblyIndex.get(item.assemblyCode)

      if (!seedAssembly && !dbAssembly) continue

      const regionMult = this.getLocationMultiplier(location)
      let materialCost: number
      let laborCost: number
      let name: string
      let unit: string

      if (dbAssembly) {
        // Use database values (may have been customized)
        const matKey = `materialCost${tier.charAt(0).toUpperCase()}${tier.slice(1)}`
        const labKey = `laborCost${tier.charAt(0).toUpperCase()}${tier.slice(1)}`
        materialCost = new Decimal(dbAssembly[matKey] ?? dbAssembly.materialCost ?? 0)
          .times(item.quantity)
          .times(regionMult)
          .toDecimalPlaces(2)
          .toNumber()
        laborCost = new Decimal(dbAssembly[labKey] ?? dbAssembly.laborCost ?? 0)
          .times(item.quantity)
          .times(regionMult)
          .toDecimalPlaces(2)
          .toNumber()
        name = dbAssembly.name
        unit = dbAssembly.unit
      } else {
        // Use seed data
        const a = seedAssembly!
        const matCostPerUnit =
          tier === 'low' ? a.materialCostLow : tier === 'high' ? a.materialCostHigh : a.materialCostMid
        const labCostPerUnit =
          tier === 'low' ? a.laborCostLow : tier === 'high' ? a.laborCostHigh : a.laborCostMid

        materialCost = new Decimal(matCostPerUnit)
          .times(item.quantity)
          .times(regionMult)
          .toDecimalPlaces(2)
          .toNumber()
        laborCost = new Decimal(labCostPerUnit)
          .times(item.quantity)
          .times(regionMult)
          .toDecimalPlaces(2)
          .toNumber()
        name = a.name
        unit = a.unit
      }

      result.push({
        assemblyCode: item.assemblyCode,
        assemblyName: name,
        quantity: item.quantity,
        unit,
        materialCost,
        laborCost,
        totalCost: new Decimal(materialCost).plus(laborCost).toDecimalPlaces(2).toNumber(),
        reasoning: item.reasoning,
      })
    }

    return result
  }

  // ──────────────────────────────────────────────────────────────
  // Private: Location / region helpers
  // ──────────────────────────────────────────────────────────────

  private getLocationMultiplier(location: string): number {
    // Check seed data region multipliers
    const firstAssembly = MARKETPLACE_ASSEMBLIES[0]
    if (!firstAssembly) return 1.0

    const multipliers = firstAssembly.regionMultiplier
    if (multipliers[location] !== undefined) return multipliers[location]

    // Case-insensitive match
    const key = Object.keys(multipliers).find(
      (k) => k.toLowerCase() === location.toLowerCase()
    )
    if (key) return multipliers[key]

    // Try partial match (e.g. "Silver Spring, MD" → "Silver Spring")
    for (const [region, mult] of Object.entries(multipliers)) {
      if (location.toLowerCase().includes(region.toLowerCase())) {
        return mult
      }
    }

    return 1.0
  }

  private humanizeProjectType(type: string): string {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }
}
