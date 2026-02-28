import { PrismaClient } from '@prisma/client'
import type { FunnelProjectType } from '@prisma/client'
import type { ConceptPackagesData, CaseStudyGridData } from '../types'

const prisma = new PrismaClient()

const CONCEPT_FEATURES: Record<string, string[]> = {
  basic: [
    'AI-generated floor plan',
    '3D concept visualization',
    'Budget estimate report',
    '48-hour delivery',
  ],
  enhanced: [
    'Everything in Basic',
    '3 design options to choose from',
    'Materials recommendation',
    'Detailed cost breakdown',
    'Revision round included',
  ],
  premium: [
    'Everything in Enhanced',
    'Photo-realistic renders',
    'Virtual walkthrough tour',
    'ROI analysis report',
    'Priority 24-hour delivery',
    '2 revision rounds included',
  ],
}

export async function aggregateConceptPackages(): Promise<ConceptPackagesData> {
  const packages = await prisma.stripeProduct.findMany({
    where: {
      productType: 'concept',
      active: true,
    },
    orderBy: { price: 'asc' },
  })

  if (packages.length === 0) {
    // Fallback concept packages if none in DB
    return {
      title: 'Choose Your AI Concept Package',
      subtitle: 'See your project in 3D before committing to major costs',
      packages: [
        { id: 'concept-basic', name: 'Basic AI Concept', description: 'AI floor plan + 3D visualization + budget estimate', price: 9900, tierLevel: 'basic', features: CONCEPT_FEATURES.basic },
        { id: 'concept-enhanced', name: 'Enhanced AI Concept', description: '3 design options + materials + detailed costs', price: 49900, tierLevel: 'enhanced', features: CONCEPT_FEATURES.enhanced },
        { id: 'concept-premium', name: 'Premium AI Concept', description: 'Photo renders + virtual tour + ROI analysis', price: 89900, tierLevel: 'premium', features: CONCEPT_FEATURES.premium },
      ],
    }
  }

  return {
    title: 'Choose Your AI Concept Package',
    subtitle: 'See your project in 3D before committing to major costs',
    packages: packages.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      tierLevel: p.tierLevel,
      features: CONCEPT_FEATURES[p.tierLevel || 'basic'] || CONCEPT_FEATURES.basic,
    })),
  }
}

export async function aggregateCaseStudies(
  projectType: FunnelProjectType,
  state: string
): Promise<CaseStudyGridData> {
  const caseStudies = await prisma.caseStudy.findMany({
    where: {
      isPublished: true,
      OR: [
        { projectType, state },
        { projectType },
        { state },
      ],
    },
    orderBy: [
      { isFeatured: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 6,
  })

  return {
    title: 'Similar Projects in Your Area',
    caseStudies: caseStudies.map((cs) => ({
      id: cs.id,
      title: cs.title,
      description: cs.description,
      city: cs.city,
      state: cs.state,
      budget: Number(cs.budget),
      durationWeeks: cs.durationWeeks,
      beforeImageUrl: cs.beforeImageUrl,
      afterImageUrl: cs.afterImageUrl,
      highlights: cs.highlights,
    })),
  }
}
