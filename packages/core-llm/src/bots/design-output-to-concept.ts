import type { DesignOutput } from './design-bot-enterprise'

/**
 * ConceptOutput shape expected by the concept delivery pipeline.
 * Mirrors the ConceptOutput interface in apps/web-main/app/api/concept/generate/route.ts.
 */
export interface MappedConceptOutput {
  designConcept: {
    style: string
    colorPalette: string[]
    keyFeatures: string[]
  }
  mepSystem: {
    electrical: string
    plumbing: string
    hvac: string
    lighting: string
  }
  billOfMaterials: Array<{
    item: string
    quantity: number
    unit: string
    estimatedCost: number
    description: string
  }>
  estimatedCost: number
  projectTimeline: string
  description: string
  includes: string[]
  renderUrls: string[]
  permitScope: {
    requiresPermit: boolean
    permitTypes: string[]
    estimatedPermitFee: number
    estimatedProcessingDays: number
    requiresPE: boolean
    notes: string
  }
  zoningNotes: string
  buildabilityFlag: 'feasible' | 'feasible-with-variance' | 'challenging'
  readinessScore: number
}

/**
 * Map DesignBotEnterprise output to the ConceptOutput shape used by the
 * concept delivery pipeline. Picks the highest-scoring concept by styleMatch.
 *
 * Permit/zoning/render/PDF fields are left as placeholder defaults —
 * ensureConceptPermitZoningFields and the render pipeline fill real values
 * after this mapper runs. Nothing downstream changes.
 */
export function mapDesignOutputToConceptOutput(
  output: DesignOutput,
  opts: { tier: number; projectPath: string; includes: string[] },
): MappedConceptOutput {
  if (!output.concepts || output.concepts.length === 0) {
    throw new Error('DesignBot returned no concepts')
  }

  // Pick concept with highest styleMatch (first wins on tie)
  const best = output.concepts.reduce(
    (prev, curr) => (curr.styleMatch > prev.styleMatch ? curr : prev),
    output.concepts[0],
  )

  const materials = best.materials.filter(Boolean)
  const materialCount = materials.length || 1
  const laborCost = Math.round(best.estimatedCost * 0.3)
  const costPerMaterial = Math.round((best.estimatedCost * 0.7) / materialCount)
  const projectLabel = opts.projectPath.replace(/_/g, ' ')

  const billOfMaterials: MappedConceptOutput['billOfMaterials'] = [
    ...materials.map((mat) => ({
      item: mat,
      quantity: 1,
      unit: 'lot',
      estimatedCost: costPerMaterial,
      description: `${mat} for ${projectLabel}`,
    })),
    {
      item: 'Labor - Installation',
      quantity: 1,
      unit: 'lot',
      estimatedCost: laborCost,
      description: 'Professional installation and project management',
    },
  ]

  return {
    designConcept: {
      style: best.name,
      colorPalette: materials.slice(0, 4),
      keyFeatures:
        best.uniqueFeatures.length > 0
          ? best.uniqueFeatures
          : [best.description].filter(Boolean),
    },
    mepSystem: {
      electrical: 'Updated electrical systems per code requirements',
      plumbing: 'N/A',
      hvac: 'N/A',
      lighting: 'LED lighting throughout',
    },
    billOfMaterials,
    estimatedCost: best.estimatedCost,
    projectTimeline: `${output.estimatedTimeline} days`,
    description: best.description,
    includes: opts.includes,
    renderUrls: [],
    // Placeholder permit/zoning — ensureConceptPermitZoningFields fills real values
    permitScope: {
      requiresPermit: false,
      permitTypes: [],
      estimatedPermitFee: 0,
      estimatedProcessingDays: 0,
      requiresPE: false,
      notes: 'Permit requirements pending enrichment.',
    },
    zoningNotes: 'Zoning analysis pending enrichment.',
    buildabilityFlag: 'feasible',
    readinessScore: 75,
  }
}
