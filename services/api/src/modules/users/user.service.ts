import { prismaAny } from '../../utils/prisma-helper'

export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prismaAny.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  /**
   * List users with pagination
   */
  async listUsers(options: {
    page?: number
    limit?: number
    status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
    search?: string
    role?: string
  }) {
    const { page = 1, limit = 20, status, search, role } = options
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) {
      where.status = status
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (role) {
      where.orgMemberships = {
        some: {
          role: {
            key: role,
          },
        },
      }
    }

    const [users, total] = await Promise.all([
      prismaAny.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prismaAny.user.count({ where }),
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    data: {
      name?: string
      phone?: string
      avatar?: string
    }
  ) {
    const user = await prismaAny.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user
  }

  /**
   * Get user's organizations
   */
  async getUserOrganizations(userId: string) {
    const memberships = await prismaAny.orgMember.findMany({
      where: { userId },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            logo: true,
            status: true,
            createdAt: true,
          },
        },
      },
    })

    return memberships.map((m: any) => ({
      ...m.org,
      role: m.roleKey,
      joinedAt: m.createdAt,
    }))
  }
}

export const userService = new UserService()
