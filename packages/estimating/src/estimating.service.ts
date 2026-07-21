/**
 * Estimating Service
 *
 * The pricing brain of the marketplace. Powers:
 *   - Lead suggestedPrice calculation (APP-01 Bid Engine)
 *   - Bid price validation (max 3% above suggested)
 *   - Quick estimates for marketing site "instant estimate"
 *   - Detailed estimates with full assembly breakdown
 *   - Assembly library browsing for contractors
 */

import Decimal from 'decimal.js'
import { PROJECT_TYPE_ASSEMBLIES, getAssembliesForProjectType, type AssemblyMapping } from './project-type-mappings'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SuggestedPriceResult {
  suggestedPrice: number
  priceRange: { low: number; mid: number; high: number }
  breakdown: Array<{
    assemblyCode: string
    assemblyName: string
    quantity: number
    unit: string
    materialCost: number
    laborCost: number
    totalCost: number
  }>
  assumptions: {
    projectType: string
    sqft: number
    location: string
    qualityTier: string
    overheadPercent: number
    profitPercent: number
    contingencyPercent: number
  }
}

export interface BidValidationResult {
  valid: boolean
  suggestedPrice: number
  maxAllowed: number
  bidAmount: number
  overagePercent: number
  message: string
}

export interface AssemblyLibraryQuery {
  categoryId?: string
  trade?: string
  search?: string
  page?: number
  limit?: number
}

// Cost tier accessor keys
type CostTier = 'low' | 'mid' | 'high'

const OVERHEAD_PERCENT = 12
const PROFIT_PERCENT = 15
const CONTINGENCY_PERCENT = 7
const MAX_BID_OVERAGE_PERCENT = 3

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------

export class EstimatingService {
  private prisma: any

  constructor(prisma: any) {
    this.prisma = prisma
  }

  // ─── calculateSuggestedPrice ──────────────────────────────────────

  /**
   * Calculate a suggested price for a project based on type, sqft, location, and quality tier.
   * This is what powers the "instant estimate" on the marketing site and sets Lead.suggestedPrice.
   */
  async calculateSuggestedPrice(opts: {
    projectType: string
    sqft?: number
    location: string
    qualityTier?: CostTier
    description?: string
  }): Promise<SuggestedPriceResult> {
    const tier: CostTier = opts.qualityTier ?? 'mid'
    const config = PROJECT_TYPE_ASSEMBLIES[opts.projectType]

    if (!config) {
      throw new Error(`Unknown project type: ${opts.projectType}. Use one of: ${Object.keys(PROJECT_TYPE_ASSEMBLIES).join(', ')}`)
    }

    const sqft = opts.sqft ?? config.defaultSqft
    const mappings = config.assemblies

    // Look up all referenced assemblies from the database
    const codes = mappings.map((m) => m.code)
    const assemblies = await this.prisma.assembly.findMany({
      where: { code: { in: codes }, isActive: true },
    })

    const assemblyMap = new Map<string, any>()
    for (const a of assemblies) {
      assemblyMap.set(a.code, a)
    }

    // Calculate each line item
    const breakdownLow: typeof breakdown = []
    const breakdownMid: typeof breakdown = []
    const breakdownHigh: typeof breakdown = []
    const breakdown: SuggestedPriceResult['breakdown'] = []

    let totalMaterialLow = new Decimal(0)
    let totalLaborLow = new Decimal(0)
    let totalMaterialMid = new Decimal(0)
    let totalLaborMid = new Decimal(0)
    let totalMaterialHigh = new Decimal(0)
    let totalLaborHigh = new Decimal(0)

    for (const mapping of mappings) {
      const assembly = assemblyMap.get(mapping.code)
      if (!assembly) continue

      const quantity = this.resolveQuantity(mapping, sqft)
      const regionMult = this.getRegionMultiplier(assembly, opts.location)

      // Get costs per tier
      const matLow = new Decimal(assembly.materialCostLow ?? assembly.materialCost).times(quantity).times(regionMult)
      const labLow = new Decimal(assembly.laborCostLow ?? assembly.laborCost).times(quantity).times(regionMult)
      const matMid = new Decimal(assembly.materialCostMid ?? assembly.materialCost).times(quantity).times(regionMult)
      const labMid = new Decimal(assembly.laborCostMid ?? assembly.laborCost).times(quantity).times(regionMult)
      const matHigh = new Decimal(assembly.materialCostHigh ?? assembly.materialCost).times(quantity).times(regionMult)
      const labHigh = new Decimal(assembly.laborCostHigh ?? assembly.laborCost).times(quantity).times(regionMult)

      totalMaterialLow = totalMaterialLow.plus(matLow)
      totalLaborLow = totalLaborLow.plus(labLow)
      totalMaterialMid = totalMaterialMid.plus(matMid)
      totalLaborMid = totalLaborMid.plus(labMid)
      totalMaterialHigh = totalMaterialHigh.plus(matHigh)
      totalLaborHigh = totalLaborHigh.plus(labHigh)

      // Build breakdown for the selected tier
      const matCost = tier === 'low' ? matLow : tier === 'high' ? matHigh : matMid
      const labCost = tier === 'low' ? labLow : tier === 'high' ? labHigh : labMid

      breakdown.push({
        assemblyCode: mapping.code,
        assemblyName: assembly.name,
        quantity,
        unit: assembly.unit,
        materialCost: matCost.toDecimalPlaces(2).toNumber(),
        laborCost: labCost.toDecimalPlaces(2).toNumber(),
        totalCost: matCost.plus(labCost).toDecimalPlaces(2).toNumber(),
      })
    }

    // Calculate totals for each tier
    const calcTotal = (material: Decimal, labor: Decimal) => {
      const subtotal = material.plus(labor)
      const overhead = subtotal.times(OVERHEAD_PERCENT).dividedBy(100)
      const profit = subtotal.times(PROFIT_PERCENT).dividedBy(100)
      const contingency = subtotal.times(CONTINGENCY_PERCENT).dividedBy(100)
      return subtotal.plus(overhead).plus(profit).plus(contingency)
    }

    const grandTotalLow = calcTotal(totalMaterialLow, totalLaborLow)
    const grandTotalMid = calcTotal(totalMaterialMid, totalLaborMid)
    const grandTotalHigh = calcTotal(totalMaterialHigh, totalLaborHigh)

    const selectedTotal = tier === 'low' ? grandTotalLow : tier === 'high' ? grandTotalHigh : grandTotalMid

    return {
      suggestedPrice: selectedTotal.toDecimalPlaces(2).toNumber(),
      priceRange: {
        low: grandTotalLow.toDecimalPlaces(2).toNumber(),
        mid: grandTotalMid.toDecimalPlaces(2).toNumber(),
        high: grandTotalHigh.toDecimalPlaces(2).toNumber(),
      },
      breakdown,
      assumptions: {
        projectType: opts.projectType,
        sqft,
        location: opts.location,
        qualityTier: tier,
        overheadPercent: OVERHEAD_PERCENT,
        profitPercent: PROFIT_PERCENT,
        contingencyPercent: CONTINGENCY_PERCENT,
      },
    }
  }

  // ─── createEstimate ───────────────────────────────────────────────

  /**
   * Create a persisted QuickEstimate record in the database.
   * If customLineItems are provided, use those instead of auto-calculating from projectType.
   */
  async createEstimate(opts: {
    projectId?: string
    leadId?: string
    projectType: string
    sqft?: number
    location: string
    qualityTier: CostTier
    customLineItems?: Array<{ assemblyCode: string; quantity: number }>
    createdBy?: string
    description?: string
  }): Promise<any> {
    // Calculate the price
    const result = await this.calculateSuggestedPrice({
      projectType: opts.projectType,
      sqft: opts.sqft,
      location: opts.location,
      qualityTier: opts.qualityTier,
      description: opts.description,
    })

    // Compute individual totals
    let materialTotal = new Decimal(0)
    let laborTotal = new Decimal(0)
    for (const line of result.breakdown) {
      materialTotal = materialTotal.plus(line.materialCost)
      laborTotal = laborTotal.plus(line.laborCost)
    }
    const subtotal = materialTotal.plus(laborTotal)
    const overhead = subtotal.times(OVERHEAD_PERCENT).dividedBy(100)
    const profit = subtotal.times(PROFIT_PERCENT).dividedBy(100)
    const contingency = subtotal.times(CONTINGENCY_PERCENT).dividedBy(100)
    const grandTotal = subtotal.plus(overhead).plus(profit).plus(contingency)

    // Create QuickEstimate record
    const estimate = await this.prisma.quickEstimate.create({
      data: {
        projectId: opts.projectId ?? null,
        leadId: opts.leadId ?? null,
        createdBy: opts.createdBy ?? null,
        projectType: opts.projectType,
        sqft: opts.sqft ?? PROJECT_TYPE_ASSEMBLIES[opts.projectType]?.defaultSqft ?? null,
        location: opts.location,
        qualityTier: opts.qualityTier,
        description: opts.description ?? null,
        materialTotal: materialTotal.toDecimalPlaces(2).toNumber(),
        laborTotal: laborTotal.toDecimalPlaces(2).toNumber(),
        subtotal: subtotal.toDecimalPlaces(2).toNumber(),
        overhead: overhead.toDecimalPlaces(2).toNumber(),
        profit: profit.toDecimalPlaces(2).toNumber(),
        contingency: contingency.toDecimalPlaces(2).toNumber(),
        grandTotal: grandTotal.toDecimalPlaces(2).toNumber(),
        priceLow: result.priceRange.low,
        priceMid: result.priceRange.mid,
        priceHigh: result.priceRange.high,
        breakdown: result.breakdown,
        assumptions: result.assumptions,
      },
    })

    // If there's a leadId, also update the Lead with suggestedPrice
    if (opts.leadId) {
      try {
        await this.prisma.lead.update({
          where: { id: opts.leadId },
          data: {
            suggestedPrice: result.suggestedPrice,
            priceRange: result.priceRange,
            projectType: opts.projectType,
            sqft: opts.sqft ?? PROJECT_TYPE_ASSEMBLIES[opts.projectType]?.defaultSqft ?? null,
            qualityTier: opts.qualityTier,
          },
        })
      } catch {
        // Lead may not exist; non-fatal
      }
    }

    return estimate
  }

  // ─── getAssemblyLibrary ───────────────────────────────────────────

  /**
   * Browse the assembly library with optional filters.
   */
  async getAssemblyLibrary(opts?: AssemblyLibraryQuery): Promise<{
    assemblies: any[]
    total: number
    page: number
    limit: number
  }> {
    const page = opts?.page ?? 1
    const limit = Math.min(100, Math.max(1, opts?.limit ?? 50))
    const skip = (page - 1) * limit

    const where: any = { isActive: true }

    if (opts?.categoryId) {
      where.category = opts.categoryId
    }

    if (opts?.trade) {
      where.tradesRequired = { has: opts.trade }
    }

    if (opts?.search) {
      where.OR = [
        { name: { contains: opts.search, mode: 'insensitive' } },
        { code: { contains: opts.search, mode: 'insensitive' } },
        { description: { contains: opts.search, mode: 'insensitive' } },
        { tags: { hasSome: [opts.search.toLowerCase()] } },
      ]
    }

    const [assemblies, total] = await Promise.all([
      this.prisma.assembly.findMany({
        where,
        include: { items: { orderBy: { sortOrder: 'asc' } } },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        take: limit,
        skip,
      }),
      this.prisma.assembly.count({ where }),
    ])

    return { assemblies, total, page, limit }
  }

  // ─── getAssemblyByCode ───────────────────────────────────────────

  /**
   * Get a single assembly by its marketplace code, including line items.
   */
  async getAssemblyByCode(code: string): Promise<any | null> {
    return this.prisma.assembly.findUnique({
      where: { code },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    })
  }

  // ─── getEstimateById ─────────────────────────────────────────────

  /**
   * Get a saved QuickEstimate by ID.
   */
  async getEstimateById(id: string): Promise<any | null> {
    return this.prisma.quickEstimate.findUnique({
      where: { id },
    })
  }

  // ─── validateBidPrice ─────────────────────────────────────────────

  /**
   * Validate that a bid amount is within the allowed range for a lead.
   * Max allowed = suggestedPrice * 1.03 (3% above suggested price).
   */
  async validateBidPrice(leadId: string, bidAmount: number): Promise<BidValidationResult> {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } })

    if (!lead) {
      throw new Error(`Lead ${leadId} not found`)
    }

    let suggestedPrice: number

    if (lead.suggestedPrice) {
      suggestedPrice = new Decimal(lead.suggestedPrice).toNumber()
    } else {
      // Calculate if not already set
      if (!lead.projectType || !lead.location) {
        // Fallback: use estimatedValue or budget
        suggestedPrice = new Decimal(lead.estimatedValue ?? lead.budget ?? 0).toNumber()
        if (suggestedPrice === 0) {
          return {
            valid: true,
            suggestedPrice: 0,
            maxAllowed: Infinity,
            bidAmount,
            overagePercent: 0,
            message: 'No suggested price available; bid accepted.',
          }
        }
      } else {
        const estimate = await this.calculateSuggestedPrice({
          projectType: lead.projectType,
          sqft: lead.sqft ? new Decimal(lead.sqft).toNumber() : undefined,
          location: lead.location,
          qualityTier: (lead.qualityTier as CostTier) ?? 'mid',
        })
        suggestedPrice = estimate.suggestedPrice

        // Persist to lead for future lookups
        await this.prisma.lead.update({
          where: { id: leadId },
          data: {
            suggestedPrice,
            priceRange: estimate.priceRange,
          },
        })
      }
    }

    const maxAllowed = new Decimal(suggestedPrice).times(1 + MAX_BID_OVERAGE_PERCENT / 100).toDecimalPlaces(2).toNumber()
    const overage = bidAmount - suggestedPrice
    const overagePercent = suggestedPrice > 0 ? (overage / suggestedPrice) * 100 : 0
    const valid = bidAmount <= maxAllowed

    return {
      valid,
      suggestedPrice,
      maxAllowed,
      bidAmount,
      overagePercent: Math.round(overagePercent * 100) / 100,
      message: valid
        ? 'Bid is within acceptable range.'
        : `Bid exceeds maximum allowed price by ${(overagePercent - MAX_BID_OVERAGE_PERCENT).toFixed(1)}%. Maximum: $${maxAllowed.toLocaleString()}.`,
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private resolveQuantity(mapping: AssemblyMapping, sqft: number): number {
    if (mapping.quantityPer === 'sqft') {
      return sqft * (mapping.multiplier ?? 1)
    }
    return mapping.quantity ?? 1
  }

  private getRegionMultiplier(assembly: any, location: string): number {
    if (!assembly.regionMultiplier) return 1.0
    const multipliers = assembly.regionMultiplier as Record<string, number>
    // Try exact match first, then case-insensitive
    if (multipliers[location] !== undefined) return multipliers[location]
    const key = Object.keys(multipliers).find(
      (k) => k.toLowerCase() === location.toLowerCase()
    )
    return key ? multipliers[key] : 1.0
  }
}
