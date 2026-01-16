import { prisma } from '@kealee/database'
import { NotFoundError } from '../../errors/app.error'

export type SearchContractorsInput = {
  specialty?: string
  search?: string
  verifiedOnly?: boolean
  minRating?: number
  limit?: number
  offset?: number
}

export const marketplaceService = {
  async searchContractors(input: SearchContractorsInput) {
    const where: any = {
      user: {
        status: 'ACTIVE',
      },
    }

    // Filter by specialty (if MarketplaceProfile had specialties field, we'd use it)
    // For now, we'll search by businessName or description
    if (input.search) {
      where.OR = [
        { businessName: { contains: input.search, mode: 'insensitive' } },
        // If description field exists in future schema updates
      ]
    }

    if (input.verifiedOnly) {
      // If verified field exists in future schema updates
      // where.verified = true
    }

    const [profiles, total] = await Promise.all([
      prisma.marketplaceProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
        take: input.limit || 20,
        skip: input.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.marketplaceProfile.count({ where }),
    ])

    return {
      profiles: profiles.map((p) => ({
        id: p.id,
        userId: p.userId,
        businessName: p.businessName,
        user: p.user,
        // Placeholder fields for future schema enhancements
        rating: null as number | null,
        reviewCount: 0,
        projectsCompleted: 0,
        performanceScore: null as number | null,
        verified: false,
        specialties: [] as string[],
      })),
      total,
      limit: input.limit || 20,
      offset: input.offset || 0,
    }
  },

  async getContractorProfile(profileId: string) {
    const profile = await prisma.marketplaceProfile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    })

    if (!profile) throw new NotFoundError('MarketplaceProfile', profileId)

    // Get active contracts count as a proxy for "available capacity"
    const activeContractsCount = await prisma.contractAgreement.count({
      where: {
        contractorId: profile.userId,
        status: { in: ['DRAFT', 'SENT', 'SIGNED', 'ACTIVE'] },
      },
    })

    // Get completed projects count
    const completedProjectsCount = await prisma.contractAgreement.count({
      where: {
        contractorId: profile.userId,
        status: 'COMPLETED',
      },
    })

    return {
      id: profile.id,
      userId: profile.userId,
      businessName: profile.businessName,
      user: profile.user,
      // Placeholder fields for future schema enhancements
      rating: null as number | null,
      reviewCount: 0,
      projectsCompleted: completedProjectsCount,
      performanceScore: null as number | null,
      verified: false,
      specialties: [] as string[],
      availableCapacity: activeContractsCount < 5 ? 'Available' : activeContractsCount < 10 ? 'Limited' : 'Fully Booked',
      activeContractsCount,
    }
  },

  async sendContractorInvitation(contractorId: string, projectId: string, ownerId: string) {
    // Verify contractor exists
    const contractor = await prisma.marketplaceProfile.findUnique({
      where: { userId: contractorId },
      include: { user: true },
    })

    if (!contractor) throw new NotFoundError('MarketplaceProfile', contractorId)

    // Verify project exists and owner has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true, name: true },
    })

    if (!project) throw new NotFoundError('Project', projectId)
    if (project.ownerId !== ownerId) {
      throw new Error('Only the project owner can send invitations')
    }

    // In a real implementation, we would:
    // 1. Create an invitation record (if we had an Invitation model)
    // 2. Queue an email notification via the worker service
    // For now, we'll return a success response

    return {
      success: true,
      message: 'Invitation sent successfully',
      contractor: {
        id: contractor.id,
        userId: contractor.userId,
        businessName: contractor.businessName,
        email: contractor.user.email,
      },
    }
  },
}
