/**
 * PM Team Service
 * Handles team members, roles, directory, and workload
 */
import { prismaAny } from '../../utils/prisma-helper'

class TeamService {
  async list(filters: {
    projectId?: string
    role?: string
    search?: string
    page?: number
    limit?: number
  }) {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 25
    const skip = (page - 1) * limit

    const where: any = {}
    if (filters.projectId) where.projectId = filters.projectId
    if (filters.role) where.role = filters.role
    if (filters.search) {
      where.user = {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      }
    }

    const [members, total] = await Promise.all([
      prismaAny.projectMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          project: { select: { id: true, name: true } },
        },
      }),
      prismaAny.projectMember.count({ where }),
    ])

    return {
      members,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async add(data: {
    projectId: string
    userId: string
    role: string
    addedById?: string
  }) {
    return prismaAny.projectMember.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        role: data.role,
        addedById: data.addedById,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        project: { select: { id: true, name: true } },
      },
    })
  }

  async updateRole(memberId: string, data: { role: string }) {
    const existing = await prismaAny.projectMember.findUnique({ where: { id: memberId } })
    if (!existing) throw new Error('Team member not found')

    return prismaAny.projectMember.update({
      where: { id: memberId },
      data: { role: data.role },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    })
  }

  async remove(memberId: string) {
    const existing = await prismaAny.projectMember.findUnique({ where: { id: memberId } })
    if (!existing) throw new Error('Team member not found')

    await prismaAny.projectMember.delete({ where: { id: memberId } })
    return { success: true }
  }

  async getDirectory(orgId: string) {
    const users = await prismaAny.user.findMany({
      where: {
        orgMembers: {
          some: { orgId },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        orgMembers: {
          where: { orgId },
          select: { role: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return { users, total: users.length }
  }

  async getWorkload(projectId: string) {
    const members = await prismaAny.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    const workload = await Promise.all(
      members.map(async (member: any) => {
        const [taskCount, rfiCount, submittalCount] = await Promise.all([
          prismaAny.scheduleItem.count({
            where: { projectId, assignedTo: member.userId },
          }),
          prismaAny.rFI.count({
            where: { projectId, assignedToId: member.userId, status: { not: 'CLOSED' } },
          }),
          prismaAny.submittal.count({
            where: { projectId, assignedToId: member.userId, status: { notIn: ['APPROVED', 'CLOSED'] } },
          }),
        ])

        return {
          member: {
            id: member.id,
            userId: member.userId,
            name: member.user.name,
            email: member.user.email,
            role: member.role,
          },
          tasks: taskCount,
          rfis: rfiCount,
          submittals: submittalCount,
          totalItems: taskCount + rfiCount + submittalCount,
        }
      })
    )

    return { workload }
  }
}

export const teamService = new TeamService()
