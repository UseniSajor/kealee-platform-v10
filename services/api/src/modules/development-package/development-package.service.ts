/**
 * KEALEE - AI DEVELOPMENT PACKAGE GENERATOR SERVICE
 * 21st Century ROAD to Housing Act — All Provisions Combined
 *
 * One-click generation of comprehensive development package:
 * Zoning → Compliance → NEPA → Design → Cost → Pro Forma → Permits
 */

import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'
import { zoningService } from '../zoning/zoning.service'
import { patternBookService } from '../pattern-book/pattern-book.service'

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface PackageInput {
  address: string
  city: string
  state: string
  zipCode: string
  parcelNumber?: string
  housingType: string
  proposedUnits: number
  totalSqFt: number
  stories: number
  targetAMI?: number // for affordable housing analysis
  affordableUnits?: number
}

// ─── Service ────────────────────────────────────────────────────────────────────

class DevelopmentPackageService {
  /**
   * Generate a complete development package (async — returns packageId immediately).
   */
  async generatePackage(input: PackageInput, userId: string) {
    // Create package record in INTAKE status
    const pkg = await prismaAny.developmentPackage.create({
      data: {
        userId,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        parcelNumber: input.parcelNumber,
        housingType: input.housingType,
        proposedUnits: input.proposedUnits,
        totalSqFt: input.totalSqFt,
        stories: input.stories,
        status: 'INTAKE',
        zoningReport: null,
        complianceReport: null,
        nepaAssessment: null,
        conceptPlans: null,
        costEstimate: null,
        proForma: null,
        permitChecklist: null,
      },
    })

    // Run generation steps (in production this would be queued via BullMQ)
    this.runGeneration(pkg.id, input, userId).catch((err) => {
      console.error(`Package generation failed for ${pkg.id}:`, err)
    })

    return { packageId: pkg.id, status: 'INTAKE' }
  }

  /**
   * Run the multi-step generation pipeline.
   */
  private async runGeneration(packageId: string, input: PackageInput, userId: string) {
    try {
      // Step 1: Zoning Analysis
      await this.updateStatus(packageId, 'ZONING_ANALYSIS')
      const zoningProfile = await zoningService.analyzeZoning({
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        parcelNumber: input.parcelNumber,
      }, userId)

      await prismaAny.developmentPackage.update({
        where: { id: packageId },
        data: {
          zoningProfileId: zoningProfile.id,
          zoningReport: {
            profileId: zoningProfile.id,
            district: zoningProfile.districtCode,
            districtName: zoningProfile.districtName,
            allowedUses: zoningProfile.allowedUses,
            maxHeight: zoningProfile.maxBuildingHeightFt,
            maxStories: zoningProfile.maxStories,
            maxFAR: zoningProfile.maxFAR,
            confidence: zoningProfile.aiConfidence,
          },
        },
      })

      // Step 2: Compliance Check
      await this.updateStatus(packageId, 'DESIGN_GENERATION')
      const compliance = await zoningService.checkCompliance({
        zoningProfileId: zoningProfile.id,
        housingType: input.housingType,
        proposedUnits: input.proposedUnits,
        stories: input.stories,
        totalSqFt: input.totalSqFt,
      }, userId)

      await prismaAny.developmentPackage.update({
        where: { id: packageId },
        data: {
          complianceReport: {
            reportId: compliance.id,
            score: compliance.complianceScore,
            isCompliant: compliance.isCompliant,
            violations: compliance.violations,
            variances: compliance.requiredVariances,
          },
        },
      })

      // Step 3: NEPA Assessment
      const nepa = await zoningService.checkNEPAExemption({
        address: input.address,
        housingType: input.housingType,
        proposedUnits: input.proposedUnits,
      })

      await prismaAny.developmentPackage.update({
        where: { id: packageId },
        data: { nepaAssessment: nepa },
      })

      // Step 4: Match Pattern Book Designs
      const designs = await patternBookService.listDesigns({
        housingType: input.housingType,
        limit: 3,
      })

      await prismaAny.developmentPackage.update({
        where: { id: packageId },
        data: {
          conceptPlans: {
            matchedDesigns: designs.designs.map((d: any) => ({
              id: d.id,
              name: d.name,
              sqFt: d.totalSqFt,
              bedrooms: d.bedrooms,
              bathrooms: d.bathrooms,
              costRange: { low: d.costRangeLow, high: d.costRangeHigh },
            })),
            totalMatches: designs.pagination.total,
          },
        },
      })

      // Step 5: Cost Estimation
      await this.updateStatus(packageId, 'COST_ESTIMATION')
      const costPerSqFt = this.getBaseCostPerSqFt(input.housingType)
      const stateMultiplier = this.getStateMultiplier(input.state)
      const baseCost = Math.round(input.totalSqFt * costPerSqFt * stateMultiplier)
      const softCosts = Math.round(baseCost * 0.15) // 15% for design, permits, fees
      const contingency = Math.round(baseCost * 0.10) // 10% contingency
      const totalCost = baseCost + softCosts + contingency

      await prismaAny.developmentPackage.update({
        where: { id: packageId },
        data: {
          costEstimate: {
            baseCost,
            softCosts,
            contingency,
            totalCost,
            costPerSqFt: Math.round(totalCost / input.totalSqFt),
            stateMultiplier,
            breakdown: {
              sitework: Math.round(baseCost * 0.08),
              foundation: Math.round(baseCost * 0.12),
              framing: Math.round(baseCost * 0.18),
              exterior: Math.round(baseCost * 0.12),
              roofing: Math.round(baseCost * 0.06),
              mep: Math.round(baseCost * 0.22),
              interiorFinishes: Math.round(baseCost * 0.15),
              landscaping: Math.round(baseCost * 0.07),
            },
          },
        },
      })

      // Step 6: Pro Forma
      await this.updateStatus(packageId, 'PRO_FORMA')
      const monthlyRentPerUnit = this.getEstimatedRent(input.housingType, input.state)
      const annualGrossIncome = monthlyRentPerUnit * input.proposedUnits * 12
      const vacancyLoss = annualGrossIncome * 0.05
      const effectiveGrossIncome = annualGrossIncome - vacancyLoss
      const operatingExpenses = effectiveGrossIncome * 0.35
      const noi = effectiveGrossIncome - operatingExpenses
      const capRate = totalCost > 0 ? (noi / totalCost) * 100 : 0
      const dscr = noi / (totalCost * 0.065 / 12 * 12) // assume 6.5% interest

      await prismaAny.developmentPackage.update({
        where: { id: packageId },
        data: {
          proForma: {
            totalProjectCost: totalCost,
            monthlyRentPerUnit,
            annualGrossIncome,
            vacancyLoss,
            effectiveGrossIncome,
            operatingExpenses,
            noi,
            capRate: Math.round(capRate * 100) / 100,
            dscr: Math.round(dscr * 100) / 100,
            cashOnCash: Math.round(capRate * 0.8 * 100) / 100, // simplified
            assumptions: {
              vacancyRate: '5%',
              operatingExpenseRatio: '35%',
              interestRate: '6.5%',
              loanToValue: '75%',
            },
          },
        },
      })

      // Step 7: Permit Checklist
      await this.updateStatus(packageId, 'PERMIT_CHECKLIST')
      const permitChecklist = await zoningService.generatePermitChecklist({
        zoningProfileId: zoningProfile.id,
        housingType: input.housingType,
      })

      await prismaAny.developmentPackage.update({
        where: { id: packageId },
        data: { permitChecklist },
      })

      // Step 8: Compile & Mark Ready
      await this.updateStatus(packageId, 'READY')

    } catch (error) {
      console.error(`Package generation error for ${packageId}:`, error)
      await prismaAny.developmentPackage.update({
        where: { id: packageId },
        data: { status: 'INTAKE' }, // reset on failure
      }).catch(() => {})
    }
  }

  private async updateStatus(packageId: string, status: string) {
    await prismaAny.developmentPackage.update({
      where: { id: packageId },
      data: { status },
    })
  }

  private getBaseCostPerSqFt(housingType: string): number {
    const costs: Record<string, number> = {
      SINGLE_FAMILY: 175, ADU: 200, DUPLEX: 165, TRIPLEX: 155,
      FOURPLEX: 150, TOWNHOUSE: 145, SMALL_APARTMENT: 140,
      MID_RISE: 180, MIXED_USE: 190, MANUFACTURED: 90, MODULAR: 120,
    }
    return costs[housingType] || 160
  }

  private getStateMultiplier(state: string): number {
    const multipliers: Record<string, number> = {
      CA: 1.25, NY: 1.20, MA: 1.18, CT: 1.15, NJ: 1.15,
      HI: 1.35, DC: 1.10, MD: 1.05, WA: 1.08, CO: 0.98,
      TX: 0.88, FL: 0.90, GA: 0.85, NC: 0.86, OH: 0.90,
    }
    return multipliers[state.toUpperCase()] || 1.0
  }

  private getEstimatedRent(housingType: string, state: string): number {
    const baseRents: Record<string, number> = {
      SINGLE_FAMILY: 2200, ADU: 1400, DUPLEX: 1800, TRIPLEX: 1600,
      FOURPLEX: 1500, TOWNHOUSE: 2000, SMALL_APARTMENT: 1400,
      MID_RISE: 1600, MIXED_USE: 1700, MANUFACTURED: 1000, MODULAR: 1200,
    }
    const stateMultiplier = this.getStateMultiplier(state)
    return Math.round((baseRents[housingType] || 1500) * stateMultiplier)
  }

  /**
   * Get a package by ID.
   */
  async getPackage(id: string) {
    const pkg = await prismaAny.developmentPackage.findUnique({
      where: { id },
      include: { zoningProfile: true },
    })
    if (!pkg) throw new NotFoundError('Development package not found')
    return pkg
  }

  /**
   * Get package status (lightweight poll).
   */
  async getPackageStatus(id: string) {
    const pkg = await prismaAny.developmentPackage.findUnique({
      where: { id },
      select: { id: true, status: true, updatedAt: true },
    })
    if (!pkg) throw new NotFoundError('Development package not found')
    return pkg
  }

  /**
   * Get user's packages.
   */
  async getMyPackages(userId: string) {
    return prismaAny.developmentPackage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, address: true, city: true, state: true,
        housingType: true, proposedUnits: true, status: true,
        createdAt: true, updatedAt: true,
      },
    })
  }
}

export const developmentPackageService = new DevelopmentPackageService()
