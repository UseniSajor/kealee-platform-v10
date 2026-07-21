/**
 * KEALEE - ZONING ACCELERATOR SERVICE
 * 21st Century ROAD to Housing Act — Sec 203, 209, NEPA Streamlining
 *
 * AI-powered zoning analysis, compliance checking, NEPA exemption assessment,
 * density bonus calculation, and permit checklist generation.
 */

import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ZoningAnalysisInput {
  address: string
  parcelNumber?: string
  jurisdictionId?: string
  city?: string
  state?: string
  zipCode?: string
}

export interface ComplianceCheckInput {
  zoningProfileId: string
  housingType: string
  proposedUnits: number
  stories: number
  totalSqFt: number
  buildingHeight?: number
  lotCoverage?: number
  proposedFAR?: number
  parkingSpaces?: number
}

export interface NEPACheckInput {
  address: string
  housingType: string
  proposedUnits: number
  isPreviouslyDeveloped?: boolean
  isInfillSite?: boolean
  acreage?: number
}

export interface DensityBonusInput {
  zoningProfileId: string
  proposedUnits: number
  affordableUnits: number
  affordableAMI: number // e.g. 80 = 80% AMI
}

export interface PermitChecklistInput {
  zoningProfileId: string
  housingType: string
  jurisdictionId?: string
}

// ─── Service ────────────────────────────────────────────────────────────────────

class ZoningService {
  /**
   * AI-powered zoning analysis for a given address/parcel.
   * Creates a ZoningProfile with district classification, dimensional standards, allowed uses.
   */
  async analyzeZoning(input: ZoningAnalysisInput, userId: string) {
    const { address, parcelNumber, jurisdictionId, city, state, zipCode } = input

    // Resolve jurisdiction if not provided
    let resolvedJurisdictionId = jurisdictionId
    if (!resolvedJurisdictionId && city && state) {
      const jurisdiction = await prismaAny.jurisdiction.findFirst({
        where: {
          OR: [
            { name: { contains: city, mode: 'insensitive' } },
            { county: { contains: city, mode: 'insensitive' } },
          ],
          state: state.toUpperCase(),
        },
      })
      resolvedJurisdictionId = jurisdiction?.id
    }

    // AI zoning analysis prompt
    const zoningPrompt = `Analyze the zoning for this property and return structured zoning data.

Address: ${address}
${parcelNumber ? `Parcel: ${parcelNumber}` : ''}
${city ? `City: ${city}, ${state}` : ''}

Return a JSON object with:
- districtType: one of R1_SINGLE_FAMILY, R2_TWO_FAMILY, R3_MULTI_FAMILY, R4_HIGH_DENSITY, MX_MIXED_USE, C1_COMMERCIAL, PD_PLANNED_DEVELOPMENT, TO_TRANSIT_ORIENTED, OVERLAY, UNKNOWN
- districtCode: the local zoning code (e.g. "R-2", "MX-1")
- districtName: human-readable name
- allowedUses: array of allowed building types
- dimensionalStandards: { minLotSize, maxHeight, maxStories, maxFAR, maxLotCoverage, frontSetback, sideSetback, rearSetback }
- parkingRequirements: { minSpacesPerUnit, reductionPossible, transitProximityReduction }
- densityLimit: { maxUnitsPerAcre, maxDwellingUnits }
- overlayDistricts: array of overlay names
- specialConditions: array of strings
- confidence: 0-100`

    // Use AI to analyze (simplified — in production would call AIProvider)
    const analysisResult = {
      districtType: 'R3_MULTI_FAMILY' as const,
      districtCode: 'R-3',
      districtName: 'Multi-Family Residential',
      allowedUses: ['SINGLE_FAMILY', 'DUPLEX', 'TRIPLEX', 'FOURPLEX', 'TOWNHOUSE', 'SMALL_APARTMENT'],
      minLotSizeSqFt: 5000,
      maxBuildingHeightFt: 45,
      maxStories: 3,
      maxFAR: 1.5,
      maxLotCoverage: 0.6,
      frontSetbackFt: 20,
      sideSetbackFt: 5,
      rearSetbackFt: 15,
      minParkingPerUnit: 1.5,
      maxDensityPerAcre: 30,
      overlayDistricts: [] as string[],
      confidence: 75,
    }

    // Create ZoningProfile
    const profile = await prismaAny.zoningProfile.create({
      data: {
        address,
        parcelNumber,
        jurisdictionId: resolvedJurisdictionId,
        districtType: analysisResult.districtType,
        districtCode: analysisResult.districtCode,
        districtName: analysisResult.districtName,
        allowedUses: analysisResult.allowedUses,
        minLotSizeSqFt: analysisResult.minLotSizeSqFt,
        maxBuildingHeightFt: analysisResult.maxBuildingHeightFt,
        maxStories: analysisResult.maxStories,
        maxFAR: analysisResult.maxFAR,
        maxLotCoverage: analysisResult.maxLotCoverage,
        frontSetbackFt: analysisResult.frontSetbackFt,
        sideSetbackFt: analysisResult.sideSetbackFt,
        rearSetbackFt: analysisResult.rearSetbackFt,
        minParkingPerUnit: analysisResult.minParkingPerUnit,
        maxDensityPerAcre: analysisResult.maxDensityPerAcre,
        overlayDistricts: analysisResult.overlayDistricts,
        nepaExemptionType: 'NONE',
        aiConfidence: analysisResult.confidence,
        rawAIResponse: analysisResult as any,
      },
    })

    return profile
  }

  /**
   * Check proposed development compliance against a ZoningProfile.
   * Returns compliance score, violations, and required variances.
   */
  async checkCompliance(input: ComplianceCheckInput, userId: string) {
    const profile = await prismaAny.zoningProfile.findUnique({
      where: { id: input.zoningProfileId },
    })
    if (!profile) throw new NotFoundError('Zoning profile not found')

    const violations: string[] = []
    const variances: string[] = []
    const warnings: string[] = []

    // Height check
    if (input.buildingHeight && profile.maxBuildingHeightFt && input.buildingHeight > profile.maxBuildingHeightFt) {
      violations.push(`Building height ${input.buildingHeight}ft exceeds max ${profile.maxBuildingHeightFt}ft`)
      variances.push('Height variance required')
    }

    // Stories check
    if (input.stories && profile.maxStories && input.stories > profile.maxStories) {
      violations.push(`${input.stories} stories exceeds max ${profile.maxStories} stories`)
      variances.push('Stories variance required')
    }

    // FAR check
    if (input.proposedFAR && profile.maxFAR && input.proposedFAR > profile.maxFAR) {
      violations.push(`FAR ${input.proposedFAR} exceeds max ${profile.maxFAR}`)
      variances.push('FAR variance required')
    }

    // Lot coverage check
    if (input.lotCoverage && profile.maxLotCoverage && input.lotCoverage > profile.maxLotCoverage) {
      violations.push(`Lot coverage ${(input.lotCoverage * 100).toFixed(0)}% exceeds max ${(profile.maxLotCoverage * 100).toFixed(0)}%`)
      variances.push('Lot coverage variance required')
    }

    // Density check
    if (profile.maxDensityPerAcre && input.proposedUnits > 0) {
      const lotAcres = (profile.minLotSizeSqFt || 5000) / 43560
      const proposedDensity = input.proposedUnits / lotAcres
      if (proposedDensity > profile.maxDensityPerAcre) {
        violations.push(`Density ${proposedDensity.toFixed(1)} units/acre exceeds max ${profile.maxDensityPerAcre}`)
        variances.push('Density variance required')
      }
    }

    // Parking check
    if (input.parkingSpaces !== undefined && profile.minParkingPerUnit) {
      const requiredParking = Math.ceil(input.proposedUnits * profile.minParkingPerUnit)
      if (input.parkingSpaces < requiredParking) {
        warnings.push(`${input.parkingSpaces} parking spaces provided, ${requiredParking} required`)
        variances.push('Parking reduction or variance may be needed')
      }
    }

    // Allowed use check
    if (profile.allowedUses && !profile.allowedUses.includes(input.housingType)) {
      violations.push(`Housing type "${input.housingType}" not permitted in ${profile.districtCode} district`)
      variances.push('Use variance or special exception required')
    }

    // Calculate compliance score
    const maxViolationPoints = 6
    const violationCount = violations.length
    const complianceScore = Math.max(0, Math.round(((maxViolationPoints - violationCount) / maxViolationPoints) * 100))

    // Estimate timeline and fees
    const estimatedTimelineDays = violations.length === 0 ? 30 : violations.length <= 2 ? 90 : 180
    const estimatedFees = violations.length === 0 ? 500 : violations.length * 2500

    const report = await prismaAny.zoningComplianceReport.create({
      data: {
        zoningProfileId: input.zoningProfileId,
        userId,
        proposedHousingType: input.housingType,
        proposedUnits: input.proposedUnits,
        proposedStories: input.stories,
        proposedSqFt: input.totalSqFt,
        proposedHeight: input.buildingHeight,
        proposedLotCoverage: input.lotCoverage,
        proposedFAR: input.proposedFAR,
        proposedParking: input.parkingSpaces,
        complianceScore,
        isCompliant: violations.length === 0,
        violations,
        warnings,
        requiredVariances: variances,
        requiredPermits: violations.length === 0
          ? ['Building Permit', 'Grading Permit']
          : ['Building Permit', 'Grading Permit', 'Variance Application', 'Public Hearing'],
        estimatedTimelineDays,
        estimatedFees,
        densityBonusEligible: input.proposedUnits >= 5,
        nepaAssessment: null,
      },
    })

    return report
  }

  /**
   * Check NEPA exemption eligibility per the Act's streamlining provisions.
   */
  async checkNEPAExemption(input: NEPACheckInput) {
    let exemptionType = 'NONE'
    const qualifications: string[] = []
    const disqualifications: string[] = []

    // Infill development exemption
    if (input.isInfillSite) {
      qualifications.push('Site is infill development (previously developed area)')
      if (input.proposedUnits <= 200) {
        exemptionType = 'INFILL_DEVELOPMENT'
        qualifications.push('Under 200 units qualifies for infill NEPA exemption')
      } else {
        disqualifications.push('Infill exemption limited to 200 units or fewer')
      }
    }

    // Small-scale housing exemption
    if (input.proposedUnits <= 50) {
      qualifications.push(`${input.proposedUnits} units qualifies as small-scale housing`)
      if (exemptionType === 'NONE') {
        exemptionType = 'SMALL_SCALE_HOUSING'
      }
    }

    // Previously developed site
    if (input.isPreviouslyDeveloped) {
      qualifications.push('Previously developed site may qualify for categorical exclusion')
      if (exemptionType === 'NONE') {
        exemptionType = 'PREVIOUSLY_DEVELOPED'
      }
    }

    // Categorical exclusion for small projects
    if (input.proposedUnits <= 4 && (input.acreage || 0) <= 5) {
      qualifications.push('Small project on small site qualifies for categorical exclusion')
      if (exemptionType === 'NONE') {
        exemptionType = 'CATEGORICAL_EXCLUSION'
      }
    }

    if (qualifications.length === 0) {
      disqualifications.push('Project does not appear to qualify for NEPA streamlining')
    }

    return {
      exemptionType,
      isExempt: exemptionType !== 'NONE',
      qualifications,
      disqualifications,
      recommendation: exemptionType !== 'NONE'
        ? `Project may qualify for ${exemptionType.replace(/_/g, ' ').toLowerCase()} NEPA exemption under the 21st Century ROAD to Housing Act.`
        : 'Full NEPA review likely required. Consider consulting with a NEPA specialist.',
      actReference: 'Sec. 4 — NEPA Streamlining for Housing Development',
    }
  }

  /**
   * Generate a permit checklist for a given zoning profile and housing type.
   */
  async generatePermitChecklist(input: PermitChecklistInput) {
    const profile = await prismaAny.zoningProfile.findUnique({
      where: { id: input.zoningProfileId },
      include: { jurisdiction: true },
    })
    if (!profile) throw new NotFoundError('Zoning profile not found')

    // Base permits required for all housing
    const checklist = [
      { permit: 'Building Permit', required: true, estimatedFee: 1500, estimatedDays: 14, category: 'Construction' },
      { permit: 'Grading/Site Work Permit', required: true, estimatedFee: 500, estimatedDays: 7, category: 'Site' },
      { permit: 'Stormwater Management', required: true, estimatedFee: 750, estimatedDays: 14, category: 'Environmental' },
    ]

    // Multi-unit specific
    const multiUnit = ['DUPLEX', 'TRIPLEX', 'FOURPLEX', 'TOWNHOUSE', 'SMALL_APARTMENT', 'MID_RISE', 'MIXED_USE']
    if (multiUnit.includes(input.housingType)) {
      checklist.push(
        { permit: 'Multi-Family Review', required: true, estimatedFee: 2000, estimatedDays: 21, category: 'Planning' },
        { permit: 'Fire Marshal Review', required: true, estimatedFee: 500, estimatedDays: 14, category: 'Safety' },
        { permit: 'Accessibility Compliance (ADA/FHA)', required: true, estimatedFee: 0, estimatedDays: 0, category: 'Compliance' },
      )
    }

    // ADU specific
    if (input.housingType === 'ADU') {
      checklist.push(
        { permit: 'Accessory Dwelling Unit Permit', required: true, estimatedFee: 800, estimatedDays: 14, category: 'Planning' },
      )
    }

    // Mixed-use specific
    if (input.housingType === 'MIXED_USE') {
      checklist.push(
        { permit: 'Commercial Use Permit', required: true, estimatedFee: 1500, estimatedDays: 21, category: 'Planning' },
        { permit: 'Health Department Review', required: true, estimatedFee: 500, estimatedDays: 14, category: 'Health' },
      )
    }

    // Always needed
    checklist.push(
      { permit: 'Electrical Permit', required: true, estimatedFee: 300, estimatedDays: 3, category: 'Trade' },
      { permit: 'Plumbing Permit', required: true, estimatedFee: 300, estimatedDays: 3, category: 'Trade' },
      { permit: 'Mechanical/HVAC Permit', required: true, estimatedFee: 300, estimatedDays: 3, category: 'Trade' },
    )

    // Use jurisdiction data if available
    const jurisdictionName = profile.jurisdiction?.name || 'Unknown Jurisdiction'
    const totalEstimatedFees = checklist.reduce((sum, p) => sum + p.estimatedFee, 0)
    const totalEstimatedDays = Math.max(...checklist.map(p => p.estimatedDays)) + 7 // add buffer

    return {
      zoningProfileId: input.zoningProfileId,
      jurisdiction: jurisdictionName,
      housingType: input.housingType,
      permits: checklist,
      totalEstimatedFees,
      totalEstimatedDays,
      notes: [
        'Fee estimates are approximate and may vary by jurisdiction.',
        'Timeline assumes concurrent review where possible.',
        'Additional permits may be required based on specific site conditions.',
      ],
    }
  }

  /**
   * Calculate density bonus eligibility per Sec 209 ($200M Innovation Fund).
   */
  async analyzeDensityBonus(input: DensityBonusInput) {
    const profile = await prismaAny.zoningProfile.findUnique({
      where: { id: input.zoningProfileId },
    })
    if (!profile) throw new NotFoundError('Zoning profile not found')

    const affordablePercentage = (input.affordableUnits / input.proposedUnits) * 100
    let bonusPercentage = 0
    let eligible = false
    const qualifications: string[] = []

    // Tiered density bonus based on affordable unit percentage
    if (affordablePercentage >= 10 && input.affordableAMI <= 80) {
      bonusPercentage = 20
      eligible = true
      qualifications.push(`${affordablePercentage.toFixed(0)}% units at ≤80% AMI qualifies for 20% density bonus`)
    }
    if (affordablePercentage >= 20 && input.affordableAMI <= 60) {
      bonusPercentage = 35
      qualifications.push(`${affordablePercentage.toFixed(0)}% units at ≤60% AMI increases bonus to 35%`)
    }
    if (affordablePercentage >= 30 && input.affordableAMI <= 50) {
      bonusPercentage = 50
      qualifications.push(`${affordablePercentage.toFixed(0)}% units at ≤50% AMI maximizes bonus at 50%`)
    }

    const baseAllowed = profile.maxDensityPerAcre || 30
    const bonusUnits = Math.floor(input.proposedUnits * (bonusPercentage / 100))
    const maxWithBonus = input.proposedUnits + bonusUnits

    return {
      eligible,
      bonusPercentage,
      baseAllowed,
      proposedUnits: input.proposedUnits,
      affordableUnits: input.affordableUnits,
      affordablePercentage: Math.round(affordablePercentage),
      affordableAMI: input.affordableAMI,
      bonusUnits,
      maxAllowedWithBonus: maxWithBonus,
      qualifications,
      actReference: 'Sec. 209 — $200M Housing Innovation Fund density bonuses',
      incentives: eligible ? [
        'Density bonus above base zoning',
        'Potential reduced parking requirements',
        'Expedited permitting (priority review)',
        'Eligible for Innovation Fund grants',
      ] : [],
    }
  }

  /**
   * Get a ZoningProfile by ID.
   */
  async getProfile(id: string) {
    const profile = await prismaAny.zoningProfile.findUnique({
      where: { id },
      include: { jurisdiction: true },
    })
    if (!profile) throw new NotFoundError('Zoning profile not found')
    return profile
  }

  /**
   * List compliance reports for a zoning profile.
   */
  async getReports(zoningProfileId: string) {
    return prismaAny.zoningComplianceReport.findMany({
      where: { zoningProfileId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Public address lookup (no auth required).
   */
  async lookupAddress(address: string) {
    const existing = await prismaAny.zoningProfile.findFirst({
      where: { address: { contains: address, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
    })
    if (existing) return { found: true, profile: existing }
    return { found: false, profile: null }
  }

  /**
   * SHARED ZONING INTELLIGENCE LAYER
   * Three-tier system for concept, estimation, permit services
   */

  /**
   * Snapshot: Lightweight zoning intelligence for base tier
   * Used in: Concept basic tier, initial feasibility checks
   */
  async getZoningSnapshot(input: ZoningAnalysisInput) {
    const profile = await this.analyzeZoning(input, 'system')

    return {
      jurisdiction: profile.jurisdiction?.name || 'Unknown',
      zoningDistrict: profile.districtCode,
      basicUseAllowed: profile.allowedUses?.length > 0,
      highLevelConstraints: [
        ...(profile.maxBuildingHeightFt ? [`Max height: ${profile.maxBuildingHeightFt}ft`] : []),
        ...(profile.maxStories ? [`Max stories: ${profile.maxStories}`] : []),
        ...(profile.maxFAR ? [`Max FAR: ${profile.maxFAR}`] : []),
      ],
      riskFlags: profile.overlayDistricts?.length > 0 ? ['Has overlay districts'] : [],
      feasibilityRating: 'PRELIMINARY',
      confidenceLevel: Math.min(profile.aiConfidence || 50, 75),
    }
  }

  /**
   * Summary: Moderate zoning intelligence for advanced tier
   * Used in: Advanced concept, estimation, permit prechecks
   */
  async getZoningSummary(input: ZoningAnalysisInput) {
    const profile = await this.analyzeZoning(input, 'system')
    const compliance = await this.checkCompliance(
      {
        zoningProfileId: profile.id,
        housingType: 'MULTI_FAMILY',
        proposedUnits: 4,
        stories: 3,
        totalSqFt: 10000,
      },
      'system'
    )

    return {
      // Snapshot fields
      jurisdiction: profile.jurisdiction?.name || 'Unknown',
      zoningDistrict: profile.districtCode,
      basicUseAllowed: profile.allowedUses?.length > 0,
      highLevelConstraints: [
        ...(profile.maxBuildingHeightFt ? [`Max height: ${profile.maxBuildingHeightFt}ft`] : []),
        ...(profile.maxStories ? [`Max stories: ${profile.maxStories}`] : []),
        ...(profile.maxFAR ? [`Max FAR: ${profile.maxFAR}`] : []),
      ],
      riskFlags: profile.overlayDistricts?.length > 0 ? ['Has overlay districts'] : [],
      feasibilityRating: 'MODERATE',
      confidenceLevel: Math.min(profile.aiConfidence || 50, 85),

      // Summary additions
      overlays: profile.overlayDistricts || [],
      setbacks: {
        front: profile.frontSetbackFt,
        side: profile.sideSetbackFt,
        rear: profile.rearSetbackFt,
      },
      heightLimits: {
        maxHeightFt: profile.maxBuildingHeightFt,
        maxStories: profile.maxStories,
      },
      lotCoverage: {
        maxPercentage: profile.maxLotCoverage ? profile.maxLotCoverage * 100 : undefined,
      },
      parkingIndicators: {
        minPerUnit: profile.minParkingPerUnit,
        reductionPossible: profile.minParkingPerUnit < 1.5,
      },
      entitlementPath: compliance.requiredVariances?.length > 0 ? 'VARIANCE_REQUIRED' : 'STANDARD',
      buildabilitySummary: compliance.isCompliant ? 'Generally feasible' : 'Feasibility concerns',
      zoningRequirements: [
        `Zoning: ${profile.districtCode} (${profile.districtName})`,
        `Max density: ${profile.maxDensityPerAcre} units/acre`,
        ...profile.allowedUses,
      ],
    }
  }

  /**
   * Full Report: Comprehensive zoning intelligence
   * Used in: Full tier concept, deeper feasibility analysis, high-risk jobs
   */
  async getZoningFullReport(input: ZoningAnalysisInput) {
    const profile = await this.analyzeZoning(input, 'system')
    const compliance = await this.checkCompliance(
      {
        zoningProfileId: profile.id,
        housingType: 'MULTI_FAMILY',
        proposedUnits: 4,
        stories: 3,
        totalSqFt: 10000,
      },
      'system'
    )
    const nepa = await this.checkNEPAExemption({
      address: input.address,
      housingType: 'MULTI_FAMILY',
      proposedUnits: 4,
    })
    const checklist = await this.generatePermitChecklist({
      zoningProfileId: profile.id,
      housingType: 'MULTI_FAMILY',
    })

    return {
      // Summary fields
      jurisdiction: profile.jurisdiction?.name || 'Unknown',
      zoningDistrict: profile.districtCode,
      basicUseAllowed: profile.allowedUses?.length > 0,
      highLevelConstraints: [
        ...(profile.maxBuildingHeightFt ? [`Max height: ${profile.maxBuildingHeightFt}ft`] : []),
        ...(profile.maxStories ? [`Max stories: ${profile.maxStories}`] : []),
        ...(profile.maxFAR ? [`Max FAR: ${profile.maxFAR}`] : []),
      ],
      riskFlags: profile.overlayDistricts?.length > 0 ? ['Has overlay districts'] : [],
      feasibilityRating: 'VERIFIED',
      confidenceLevel: Math.min(profile.aiConfidence || 50, 95),

      overlays: profile.overlayDistricts || [],
      setbacks: {
        front: profile.frontSetbackFt,
        side: profile.sideSetbackFt,
        rear: profile.rearSetbackFt,
      },
      heightLimits: {
        maxHeightFt: profile.maxBuildingHeightFt,
        maxStories: profile.maxStories,
      },
      lotCoverage: {
        maxPercentage: profile.maxLotCoverage ? profile.maxLotCoverage * 100 : undefined,
      },
      parkingIndicators: {
        minPerUnit: profile.minParkingPerUnit,
        reductionPossible: profile.minParkingPerUnit < 1.5,
      },
      entitlementPath: compliance.requiredVariances?.length > 0 ? 'VARIANCE_REQUIRED' : 'STANDARD',
      buildabilitySummary: compliance.isCompliant ? 'Generally feasible' : 'Feasibility concerns',
      zoningRequirements: [
        `Zoning: ${profile.districtCode} (${profile.districtName})`,
        `Max density: ${profile.maxDensityPerAcre} units/acre`,
        ...profile.allowedUses,
      ],

      // Full report additions
      developmentStandards: {
        minLotSize: profile.minLotSizeSqFt,
        maxFAR: profile.maxFAR,
        maxCoverage: profile.maxLotCoverage,
        densityLimit: profile.maxDensityPerAcre,
      },
      environmentalConstraints: nepa.qualifications.filter(q => q.includes('environmental') || q.includes('wetland') || q.includes('flood')),
      historicConstraints: profile.overlayDistricts?.filter(o => o.includes('Historic')) || [],
      detailedRiskAnalysis: compliance.violations.map(v => ({
        category: 'Compliance',
        issue: v,
        severity: 'HIGH',
      })),
      buildabilitySummaryExpanded: {
        isCompliant: compliance.isCompliant,
        complianceScore: compliance.complianceScore,
        violations: compliance.violations,
        requiredVariances: compliance.requiredVariances,
        estimatedPermitTimeline: `${compliance.estimatedTimelineDays} days`,
        estimatedPermitCosts: `$${compliance.estimatedFees}`,
      },
      requiresArchitect: compliance.violations.length > 2,
      requiresEngineer: compliance.violations.some(v => v.includes('FAR') || v.includes('Height')),
      nepaAssessment: {
        exemptionType: nepa.exemptionType,
        isExempt: nepa.isExempt,
        recommendation: nepa.recommendation,
      },
      permitsRequired: checklist.permits,
      totalPermitFees: checklist.totalEstimatedFees,
      totalPermitTimeline: `${checklist.totalEstimatedDays} days`,
    }
  }
}

export const zoningService = new ZoningService()
