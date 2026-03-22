/**
 * Buildability Snapshot
 * Integrates with ZoningProfile / ParcelZoning tables and infers buildability risk
 * via Claude when live zoning data is unavailable.
 */

import Anthropic from '@anthropic-ai/sdk'

export interface ZoningData {
  zoningCode: string
  zoningDistrict: string
  setbackFront: number | null
  setbackSide: number | null
  setbackRear: number | null
  maxHeight: number | null
  maxCoverage: number | null
  lotSize: number | null
  notes: string | null
}

export interface BuildabilityRiskFlag {
  flag: string
  severity: 'low' | 'medium' | 'high'
  note: string
}

export interface BuildabilitySnapshot {
  intakeId: string
  projectPath: string
  zoningCode: string
  zoningDistrict: string
  setbacks: {
    front: number | null
    side: number | null
    rear: number | null
    unit: 'ft'
  }
  maxHeight: number | null
  maxCoverage: number | null
  lotSizeSqFt: number | null
  riskFlags: BuildabilityRiskFlag[]
  permitPath: string[]
  estimatedPermitCost: string
  estimatedPermitTimeline: string
  designReviewRequired: boolean
  structuralReviewRequired: boolean
  disclaimer: string
  inferredByAI: boolean
  generatedAt: string
}

interface BuildabilityInput {
  intakeId: string
  projectPath: string
  address: string
  jurisdiction?: string
  budgetRange?: string
  constraints?: string[]
  zoningData?: ZoningData | null
}

const PERMIT_PATH_BY_PROJECT: Record<string, string[]> = {
  kitchen_remodel: ['Building permit (if structural)', 'Electrical permit', 'Plumbing permit'],
  bathroom_remodel: ['Building permit', 'Plumbing permit', 'Electrical permit'],
  interior_renovation: ['Building permit', 'Electrical permit', 'Plumbing permit (if applicable)'],
  whole_home_remodel: [
    'Building permit',
    'Electrical permit',
    'Plumbing permit',
    'Mechanical permit',
    'Structural engineering review',
  ],
  addition_expansion: [
    'Building permit',
    'Zoning variance (if applicable)',
    'Structural engineering',
    'Electrical permit',
    'Plumbing permit',
    'Grading/drainage review',
  ],
  exterior_concept: ['Building permit (if structural)', 'Landscape permit (if applicable)'],
  capture_site_concept: ['TBD — full assessment needed'],
}

const PERMIT_COST_RANGE: Record<string, string> = {
  kitchen_remodel: '$500–$2,500',
  bathroom_remodel: '$300–$1,500',
  interior_renovation: '$500–$3,000',
  whole_home_remodel: '$2,000–$8,000',
  addition_expansion: '$3,000–$12,000',
  exterior_concept: '$200–$1,500',
  capture_site_concept: 'TBD',
}

const PERMIT_TIMELINE: Record<string, string> = {
  kitchen_remodel: '2–6 weeks',
  bathroom_remodel: '1–4 weeks',
  interior_renovation: '2–6 weeks',
  whole_home_remodel: '4–12 weeks',
  addition_expansion: '6–20 weeks',
  exterior_concept: '1–4 weeks',
  capture_site_concept: 'TBD',
}

function detectRiskFlags(
  input: BuildabilityInput,
  zoning: ZoningData | null
): BuildabilityRiskFlag[] {
  const flags: BuildabilityRiskFlag[] = []
  const addr = (input.address ?? '').toLowerCase()
  const constraints = input.constraints ?? []

  // Historic district
  if (
    addr.includes('historic') ||
    constraints.some((c) => c.toLowerCase().includes('historic'))
  ) {
    flags.push({
      flag: 'historic_overlay',
      severity: 'high',
      note: 'Property may be in a historic district — design review and material approval likely required.',
    })
  }

  // HOA
  if (constraints.some((c) => c.toLowerCase().includes('hoa'))) {
    flags.push({
      flag: 'hoa_restrictions',
      severity: 'medium',
      note: 'HOA approval may be required before permit submittal.',
    })
  }

  // Addition-specific flags
  if (input.projectPath === 'addition_expansion') {
    flags.push({
      flag: 'setback_compliance',
      severity: 'high',
      note: 'Addition must comply with setback requirements. Verify lot dimensions before design.',
    })
    flags.push({
      flag: 'structural_review',
      severity: 'high',
      note: 'Structural engineering required for any addition or second-story work.',
    })
  }

  // Whole home remodel structural flag
  if (input.projectPath === 'whole_home_remodel') {
    flags.push({
      flag: 'structural_assessment',
      severity: 'medium',
      note: 'Whole-home remodels often require structural assessment for load-bearing wall modifications.',
    })
  }

  // High coverage risk from zoning
  if (zoning?.maxCoverage && zoning.maxCoverage < 40) {
    flags.push({
      flag: 'coverage_limit',
      severity: 'medium',
      note: `Zoning limits lot coverage to ${zoning.maxCoverage}%. Verify proposed footprint against zoning rules.`,
    })
  }

  // Low height limit
  if (zoning?.maxHeight && zoning.maxHeight < 25) {
    flags.push({
      flag: 'height_limit',
      severity: 'medium',
      note: `Max building height is ${zoning.maxHeight}ft. Roof pitch and addition massing must stay within this limit.`,
    })
  }

  return flags
}

async function inferBuildabilityFromClaude(input: BuildabilityInput): Promise<{
  zoningCode: string
  zoningDistrict: string
  setbacks: { front: number | null; side: number | null; rear: number | null }
  maxHeight: number | null
  additionalFlags: BuildabilityRiskFlag[]
  notes: string
}> {
  const client = new Anthropic()
  const prompt = `You are a zoning and building code expert. Based on the address and jurisdiction provided, estimate typical zoning parameters for this property.

Address: ${input.address}
Jurisdiction: ${input.jurisdiction ?? 'unknown'}
Project Type: ${input.projectPath}

Provide your best estimate of:
1. Likely zoning code and district (e.g., "R-1, Single Family Residential")
2. Typical setbacks: front (ft), side (ft), rear (ft)
3. Typical max height (ft)
4. Any specific risk flags for this project type in this jurisdiction

Respond ONLY with valid JSON matching this structure:
{
  "zoningCode": "string",
  "zoningDistrict": "string",
  "setbacks": { "front": number_or_null, "side": number_or_null, "rear": number_or_null },
  "maxHeight": number_or_null,
  "additionalFlags": [{ "flag": "string", "severity": "low|medium|high", "note": "string" }],
  "notes": "string"
}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]+\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (_err) {
    // fallback below
  }

  return {
    zoningCode: 'Unknown',
    zoningDistrict: 'Single Family Residential (estimated)',
    setbacks: { front: 20, side: 5, rear: 15 },
    maxHeight: 35,
    additionalFlags: [],
    notes: 'Zoning data could not be confirmed. Consult your local planning department.',
  }
}

export async function buildBuildabilitySnapshot(
  input: BuildabilityInput
): Promise<BuildabilitySnapshot> {
  const zoning = input.zoningData ?? null
  let zoningCode = zoning?.zoningCode ?? ''
  let zoningDistrict = zoning?.zoningDistrict ?? ''
  let setbacks = {
    front: zoning?.setbackFront ?? null,
    side: zoning?.setbackSide ?? null,
    rear: zoning?.setbackRear ?? null,
  }
  let maxHeight = zoning?.maxHeight ?? null
  let inferredByAI = false
  let aiFlags: BuildabilityRiskFlag[] = []

  // If no live zoning data, infer from Claude
  if (!zoning) {
    inferredByAI = true
    const inferred = await inferBuildabilityFromClaude(input)
    zoningCode = inferred.zoningCode
    zoningDistrict = inferred.zoningDistrict
    setbacks = inferred.setbacks
    maxHeight = inferred.maxHeight
    aiFlags = inferred.additionalFlags ?? []
  }

  const detectedFlags = detectRiskFlags(input, zoning)
  const allFlags = [...detectedFlags, ...aiFlags]

  const structuralReviewRequired =
    input.projectPath === 'addition_expansion' ||
    input.projectPath === 'whole_home_remodel' ||
    allFlags.some((f) => f.flag === 'structural_review' || f.flag === 'structural_assessment')

  const designReviewRequired = allFlags.some(
    (f) => f.flag === 'historic_overlay' || f.flag === 'hoa_restrictions'
  )

  return {
    intakeId: input.intakeId,
    projectPath: input.projectPath,
    zoningCode,
    zoningDistrict,
    setbacks: { ...setbacks, unit: 'ft' },
    maxHeight,
    maxCoverage: zoning?.maxCoverage ?? null,
    lotSizeSqFt: zoning?.lotSize ?? null,
    riskFlags: allFlags,
    permitPath: PERMIT_PATH_BY_PROJECT[input.projectPath] ?? ['Building permit'],
    estimatedPermitCost: PERMIT_COST_RANGE[input.projectPath] ?? 'TBD',
    estimatedPermitTimeline: PERMIT_TIMELINE[input.projectPath] ?? 'TBD',
    designReviewRequired,
    structuralReviewRequired,
    disclaimer:
      inferredByAI
        ? 'Zoning data estimated by AI — not a substitute for a professional zoning review or permit consultation. Verify all parameters with your local jurisdiction.'
        : 'Zoning data sourced from platform GIS layer. Verify current zoning with your local jurisdiction before design.',
    inferredByAI,
    generatedAt: new Date().toISOString(),
  }
}
