import { PrismaClient } from '@prisma/client'
import type { FunnelProjectType } from '@prisma/client'
import type { ContractorGridData, CaseStudyGridData } from '../types'

const prisma = new PrismaClient()

export async function aggregateContractors(
  city: string,
  state: string
): Promise<ContractorGridData> {
  const contractors = await prisma.contractor.findMany({
    where: {
      state,
      status: 'ACTIVE',
    },
    orderBy: [
      { isVerified: 'desc' },
      { rating: 'desc' },
    ],
    take: 9,
  })

  return {
    title: `Top-Rated Contractors in ${city}, ${state}`,
    contractors: contractors.map((c) => ({
      id: c.id,
      companyName: c.companyName,
      contactName: c.contactName,
      city: c.city,
      state: c.state,
      trades: c.trades,
      rating: Number(c.rating),
      reviewCount: c.reviewCount,
      isVerified: c.isVerified,
      yearsInBusiness: c.yearsInBusiness,
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
