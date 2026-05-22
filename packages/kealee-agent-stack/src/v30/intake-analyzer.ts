import { calculateV30BasePrice, DEFAULT_V30_PRICING_FORMULA } from './pricing'
import { executeV30BotWithLlm, shouldUseV30Llm } from './llm-executor'
import { getV30SystemPrompt } from './prompts'
import type { V30Complexity, V30IntakeAnalysis, V30IntakeFormAnswers, V30RiskLevel } from './types'

const DEFAULT_FEATURES = ['Design', 'Estimate', 'Zoning']

/**
 * Heuristic IntakeBot — deterministic analysis before LLM enrichment.
 * API layer can call Claude with INTAKE_BOT_PROMPT for full analysisJson.
 */
export function analyzeV30Intake(answers: V30IntakeFormAnswers): V30IntakeAnalysis {
  const { total, complexity, breakdown } = calculateV30BasePrice(answers)

  let riskLevel: V30IntakeAnalysis['riskLevel'] = 'low'
  if (answers.yearBuilt.includes('pre-1950') || answers.codeConsiderations.length > 2) {
    riskLevel = 'high'
  } else if (complexity !== 'simple') {
    riskLevel = 'medium'
  }

  const estimatedDays =
    complexity === 'complex' ? 45 : complexity === 'moderate' ? 28 : 14

  const suggestedFeatures = [...DEFAULT_FEATURES]
  if (answers.primaryScope.toLowerCase().includes('kitchen')) {
    suggestedFeatures.push('Floorplan')
  }
  if (answers.timeline.toLowerCase().includes('asap')) {
    suggestedFeatures.push('Support')
  }

  return {
    scopeComplexity: complexity,
    riskLevel,
    estimatedCost: total,
    estimatedDays,
    suggestedFeatures,
    analysisJson: {
      summary: `${complexity} ${answers.primaryScope} project in ${answers.location}`,
      factors: [
        `${answers.squareFeet} sq ft`,
        answers.budgetRange,
        answers.timeline,
      ],
      pricingBreakdown: breakdown,
      formulaVersion: DEFAULT_V30_PRICING_FORMULA,
    },
  }
}

function asComplexity(v: unknown, fallback: V30Complexity): V30Complexity {
  if (v === 'simple' || v === 'moderate' || v === 'complex') return v
  return fallback
}

function asRisk(v: unknown, fallback: V30RiskLevel): V30RiskLevel {
  if (v === 'low' || v === 'medium' || v === 'high') return v
  return fallback
}

/**
 * Heuristic intake + optional IntakeBot LLM (KEALEE-v30-ALL-10-BOTS-COMPLETE-WIRED).
 */
export async function analyzeV30IntakeWithLlm(
  answers: V30IntakeFormAnswers,
): Promise<V30IntakeAnalysis> {
  const base = analyzeV30Intake(answers)
  if (!shouldUseV30Llm()) return base

  const llm = await executeV30BotWithLlm({
    projectId: 'intake',
    packageId: 'intake',
    botType: 'intake',
    inputData: answers as unknown as Record<string, unknown>,
    systemPrompt: getV30SystemPrompt('intake'),
  })

  const out = llm.outputData
  if (llm.status !== 'COMPLETE' || !out) return base

  const breakdown = out.analysisBreakdown as Record<string, unknown> | undefined
  const recommended = breakdown?.recommended_features
  const costMid =
    typeof out.estimatedCostMid === 'number'
      ? out.estimatedCostMid
      : typeof out.estimatedCostMin === 'number' && typeof out.estimatedCostMax === 'number'
        ? Math.round((out.estimatedCostMin + out.estimatedCostMax) / 2)
        : base.estimatedCost

  return {
    scopeComplexity: asComplexity(out.scopeComplexity, base.scopeComplexity),
    riskLevel: asRisk(out.riskLevel, base.riskLevel),
    estimatedCost: costMid,
    estimatedDays:
      typeof out.estimatedDays === 'number' ? out.estimatedDays : base.estimatedDays,
    suggestedFeatures: Array.isArray(recommended)
      ? (recommended as string[])
      : base.suggestedFeatures,
    analysisJson: { ...base.analysisJson, wiredIntake: out, llmModel: llm.modelUsed },
  }
}
