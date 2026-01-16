import { prisma } from '@kealee/database'

export class OrgService {
  // Create organization
  async createOrg(data: {
    name: string
    slug: string
    description?: string
    logo?: string
    ownerId: string
  }) {
    // Check if slug is already taken
    const existing = await prisma.org.findUnique({
      where: { slug: data.slug },
    })

    if (existing) {
      throw new Error('Organization slug already exists')
    }

    // Create org and add owner as ADMIN member
    const org = await prisma.org.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        logo: data.logo,
        status: 'ACTIVE',
        members: {
          create: {
            userId: data.ownerId,
            roleKey: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return org
  }

  // Get organization by ID
  async getOrgById(orgId: string) {
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
            properties: true,
          },
        },
      },
    })

    if (!org) {
      throw new Error('Organization not found')
    }

    return org
  }

  // Get organization by slug
  async getOrgBySlug(slug: string) {
    const org = await prisma.org.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    if (!org) {
      throw new Error('Organization not found')
    }

    return org
  }

  // List organizations (with pagination)
  async listOrgs(options: {
    page?: number
    limit?: number
    status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  }) {
    const page = options.page || 1
    const limit = options.limit || 20
    const skip = (page - 1) * limit

    const where: any = {}
    if (options.status) {
      where.status = options.status
    }

    const [orgs, total] = await Promise.all([
      prisma.org.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
      }),
      prisma.org.count({ where }),
    ])

    return {
      orgs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // Update organization
  async updateOrg(
    orgId: string,
    data: {
      name?: string
      description?: string
      logo?: string
      status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
    }
  ) {
    const org = await prisma.org.update({
      where: { id: orgId },
      data,
    })

    return org
  }

  // Add member to organization
  async addMember(orgId: string, userId: string, roleKey: string) {
    // Check if user is already a member
    const existing = await prisma.orgMember.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    })

    if (existing) {
      throw new Error('User is already a member of this organization')
    }

    const member = await prisma.orgMember.create({
      data: {
        orgId,
        userId,
        roleKey,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return member
  }

  // Remove member from organization
  async removeMember(orgId: string, userId: string) {
    const member = await prisma.orgMember.delete({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    })

    return member
  }

  // Update member role
  async updateMemberRole(orgId: string, userId: string, roleKey: string) {
    const member = await prisma.orgMember.update({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
      data: { roleKey },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    return member
  }

  // Get user's organizations
  async getUserOrgs(userId: string) {
    const memberships = await prisma.orgMember.findMany({
      where: { userId },
      include: {
        org: {
          include: {
            _count: {
              select: {
                members: true,
                projects: true,
              },
            },
          },
        },
      },
    })

    return memberships.map((m) => ({
      ...m.org,
      role: m.roleKey,
      joinedAt: m.joinedAt,
    }))
  }
}

export const orgService = new OrgService()
