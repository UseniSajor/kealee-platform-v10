export interface PermitServiceRecommendation {
  key: 'site-plan' | 'professional-drawings' | 'design-concept'
  title: string
  description: string
  href: string
  cta: string
}

export function getPermitServiceRecommendation(
  scope: string,
  hasSubmissionDocument: boolean,
): PermitServiceRecommendation | null {
  if (hasSubmissionDocument) return null

  const normalizedScope = scope.toLowerCase()
  if (/\b(deck|patio|pool|fence|driveway|grading|site|lot|setback|addition|new construction|accessory structure|adu)\b/.test(normalizedScope)) {
    return {
      key: 'site-plan',
      title: 'Start with a Kealee site plan',
      description: 'Your scope appears to affect the site or property layout. Build the parcel, setback, footprint, and permit-site-plan evidence needed for filing.',
      href: '/site-plans',
      cta: 'Choose a site-plan service',
    }
  }

  if (/\b(structural|load-bearing|wall removal|commercial|multifamily|engineering|architect|construction drawings|plan set)\b/.test(normalizedScope)) {
    return {
      key: 'professional-drawings',
      title: 'Add professional permit drawings',
      description: 'This scope is likely to require coordinated architectural or engineering sheets before the agency will accept the application.',
      href: '/intake/professional_drawings',
      cta: 'Start professional drawings',
    }
  }

  return {
    key: 'design-concept',
    title: 'Define the project with a Kealee design concept',
    description: 'You do not have a submission document yet. Start with a property-specific concept so the scope can advance into site planning or professional permit drawings.',
    href: '/products/concept',
    cta: 'Start a design concept',
  }
}
