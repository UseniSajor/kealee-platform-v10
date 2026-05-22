import { calculateV30BasePrice, DEFAULT_V30_PRICING_FORMULA } from './pricing'
import type { V30IntakeAnalysis, V30IntakeFormAnswers } from './types'

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
