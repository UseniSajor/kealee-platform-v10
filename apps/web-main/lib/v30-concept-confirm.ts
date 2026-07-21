import type { V30IntakeAnswers } from '@/lib/v30'

/** Map legacy /concept/confirm fields → v30 IntakeBot answers. */
export function buildV30AnswersFromConceptConfirm(input: {
  projectPath: string
  scope: string
  budget: string
  zip: string
  timeline?: string
  sqft?: string
  address?: string
}): V30IntakeAnswers {
  const parsedSqft = Number.parseInt(String(input.sqft ?? '').replace(/\D/g, ''), 10)
  const squareFeet = Number.isFinite(parsedSqft) && parsedSqft > 0 ? parsedSqft : 1200

  return {
    propertyType: 'single-family',
    primaryScope: input.scope?.trim() || input.projectPath,
    budgetRange: input.budget?.trim() || '$100K-$250K',
    timeline: input.timeline?.trim() || '6-8 weeks',
    location: input.address?.trim() || input.zip?.trim() || 'Washington DC',
    squareFeet,
    yearBuilt: '1980-2000',
    utilities: { naturalGas: true, waterSewer: true },
    codeConsiderations: ['none'],
  }
}
