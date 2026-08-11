export interface ProjectClarityReport {
  title: string
  preparedAt: string
  projectAddress: string
  projectSummary: string
  readinessStatus: string
  observations: string[]
  recommendedServices: Array<{ name: string; reason: string; href: string }>
  nextActions: string[]
}

export function buildProjectClarityReport(input: {
  address: string
  projectDescription: string
  budgetRange?: string
  timeline?: string
}): ProjectClarityReport {
  const scope = input.projectDescription.toLowerCase()
  const siteRelated = /\b(deck|patio|pool|fence|driveway|grading|addition|adu|new construction|lot|site|setback)\b/.test(scope)
  const professionalPlansLikely = /\b(structural|load-bearing|wall|addition|adu|new construction|commercial|multifamily)\b/.test(scope)
  const recommendations: ProjectClarityReport['recommendedServices'] = [
    { name: 'Design Concept', reason: 'Translate the stated goal into a visible, property-specific scope before detailed production.', href: '/products/concept' },
    ...(siteRelated ? [{ name: 'Site Plans & Feasibility', reason: 'Confirm the proposed work against parcel, setback, footprint, and site constraints.', href: '/site-plans' }] : []),
    { name: 'Detailed Construction Estimate', reason: `Test the scope against the stated budget${input.budgetRange ? ` of ${input.budgetRange}` : ''}.`, href: '/products/detailed_estimate' },
    { name: professionalPlansLikely ? 'Professional Permit Drawings' : 'Permit Path Assessment', reason: professionalPlansLikely ? 'Prepare the coordinated drawings likely required for agency filing.' : 'Confirm the permitting authority, required documents, and approval sequence.', href: professionalPlansLikely ? '/products/professional_design' : '/permits' },
  ]

  return {
    title: 'Kealee Project Clarity Report',
    preparedAt: new Date().toISOString(),
    projectAddress: input.address,
    projectSummary: input.projectDescription,
    readinessStatus: professionalPlansLikely ? 'Scope definition and permit-document planning recommended' : siteRelated ? 'Site feasibility should be confirmed before permit filing' : 'Ready to select a design and preconstruction path',
    observations: [
      `Desired timing: ${input.timeline || 'Not specified'}`,
      `Budget range: ${input.budgetRange || 'Not specified'}`,
      siteRelated ? 'The described work appears to affect the site, footprint, or zoning review path.' : 'No explicit site-impact trigger was identified in the initial description.',
      professionalPlansLikely ? 'The described work may require professional permit drawings.' : 'Professional drawing requirements should be confirmed during permit-path review.',
    ],
    recommendedServices: recommendations,
    nextActions: [
      'Confirm the project scope and intended outcome.',
      'Add available photos, surveys, sketches, plans, or agency correspondence.',
      `Start with ${recommendations[0].name}${siteRelated ? ' and site feasibility' : ''}.`,
      'Advance the selected scope into estimating, permit planning, and required professional documents.',
    ],
  }
}
