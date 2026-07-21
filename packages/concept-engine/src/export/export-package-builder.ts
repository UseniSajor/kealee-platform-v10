/**
 * Export Package Builder
 *
 * Assembles the architect-ready export package for PRE_DESIGN tier projects.
 * Generates:
 * - JSON manifest (full structured data for architect consumption)
 * - Handoff summary object (for email / PDF rendering)
 *
 * DXF and SketchUp exports require separate CAD tooling and are placeholders here.
 */

export interface ExportPackageInput {
  preDesignId: string
  projectType: string
  tier: string
  executionRoute: string
  confidenceScore?: number
  complexityScore?: number
  conceptSummary?: Record<string, any>
  styleProfile?: Record<string, any>
  budgetRange?: Record<string, any>
  feasibilitySummary?: Record<string, any>
  zoningSummary?: Record<string, any>
  buildabilitySummary?: Record<string, any>
  scopeOfWork?: Record<string, any>
  systemsImpact?: Record<string, any>
  estimateFramework?: Record<string, any>
  outputImages?: Array<{ url: string; label?: string; caption?: string }>
  propertyAddress?: string
  contactEmail?: string
  contactName?: string
}

export interface ExportManifest {
  manifestVersion: string
  generatedAt: string
  preDesignId: string
  project: {
    type: string
    tier: string
    propertyAddress?: string
    contactName?: string
    contactEmail?: string
  }
  routing: {
    executionRoute: string
    confidenceScore?: number
    complexityScore?: number
  }
  outputs: {
    conceptSummary?: Record<string, any>
    styleProfile?: Record<string, any>
    budgetRange?: Record<string, any>
    feasibilitySummary?: Record<string, any>
    zoningSummary?: Record<string, any>
    buildabilitySummary?: Record<string, any>
    scopeOfWork?: Record<string, any>
    systemsImpact?: Record<string, any>
    estimateFramework?: Record<string, any>
    images?: Array<{ url: string; label?: string; caption?: string }>
  }
}

export interface HandoffSummary {
  preDesignId: string
  projectType: string
  tier: string
  propertyAddress?: string
  executionRoute: string
  requiresArchitect: boolean
  conceptTitle?: string
  budgetMidpoint?: number
  budgetCurrency?: string
  scopeSummary?: string
  keyFlags: string[]
  generatedAt: string
}

export interface ExportPackageResult {
  manifest: ExportManifest
  manifestJson: string
  handoffSummary: HandoffSummary
  /** URL placeholder — actual storage upload handled by the calling service */
  outputJsonUrl?: string
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildExportPackage(input: ExportPackageInput): ExportPackageResult {
  const now = new Date().toISOString()

  const manifest: ExportManifest = {
    manifestVersion: '1.0',
    generatedAt: now,
    preDesignId: input.preDesignId,
    project: {
      type: input.projectType,
      tier: input.tier,
      propertyAddress: input.propertyAddress,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
    },
    routing: {
      executionRoute: input.executionRoute,
      confidenceScore: input.confidenceScore,
      complexityScore: input.complexityScore,
    },
    outputs: {
      conceptSummary: input.conceptSummary,
      styleProfile: input.styleProfile,
      budgetRange: input.budgetRange,
      feasibilitySummary: input.feasibilitySummary,
      zoningSummary: input.zoningSummary,
      buildabilitySummary: input.buildabilitySummary,
      scopeOfWork: input.scopeOfWork,
      systemsImpact: input.systemsImpact,
      estimateFramework: input.estimateFramework,
      images: input.outputImages,
    },
  }

  // Derive key flags for handoff summary
  const keyFlags: string[] = []
  if (input.executionRoute === 'ARCHITECT_REQUIRED') keyFlags.push('ARCHITECT_REQUIRED')
  if (input.executionRoute === 'ARCHITECT_RECOMMENDED') keyFlags.push('ARCHITECT_RECOMMENDED')
  if (input.complexityScore && input.complexityScore >= 0.75) keyFlags.push('HIGH_COMPLEXITY')
  if (input.confidenceScore && input.confidenceScore < 0.55) keyFlags.push('LOW_CONFIDENCE')

  const buildability = input.buildabilitySummary as any
  if (buildability?.flags) {
    for (const f of buildability.flags) keyFlags.push(f)
  }

  const budget = input.budgetRange as any
  const handoffSummary: HandoffSummary = {
    preDesignId: input.preDesignId,
    projectType: input.projectType,
    tier: input.tier,
    propertyAddress: input.propertyAddress,
    executionRoute: input.executionRoute,
    requiresArchitect: input.executionRoute === 'ARCHITECT_REQUIRED',
    conceptTitle: (input.conceptSummary as any)?.title,
    budgetMidpoint: budget?.mid,
    budgetCurrency: budget?.currency ?? 'USD',
    scopeSummary: (input.scopeOfWork as any)?.summary,
    keyFlags,
    generatedAt: now,
  }

  return {
    manifest,
    manifestJson: JSON.stringify(manifest, null, 2),
    handoffSummary,
  }
}
