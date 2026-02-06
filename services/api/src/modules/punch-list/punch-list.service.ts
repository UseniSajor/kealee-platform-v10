/**
 * KEALEE PLATFORM - PUNCH LIST SERVICE (SOP-015)
 * Manages project closeout deficiency tracking
 */

import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'

export const punchListService = {
  async createItem(
    data: {
      projectId: string
      milestoneId?: string
      title: string
      description?: string
      category?: string
      location?: string
      priority: string
      assignedTo?: string
      dueDate?: string
      photoUrls?: string[]
    },
    userId: string
  ) {
    const item = await prismaAny.punchListItem.create({
      data: {
        projectId: data.projectId,
        milestoneId: data.milestoneId || null,
        title: data.title,
        description: data.description || null,
        category: data.category || null,
        location: data.location || null,
        priority: data.priority,
        status: 'OPEN',
        assignedTo: data.assignedTo || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        photoUrls: data.photoUrls || [],
      },
    })

    await auditService.recordAudit({
      action: 'PUNCH_LIST_ITEM_CREATED',
      entityType: 'PunchListItem',
      entityId: item.id,
      userId,
      reason: `Punch list item created: ${data.title}`,
      after: { title: data.title, priority: data.priority },
    })

    return item
  },

  async getItem(id: string) {
    const item = await prismaAny.punchListItem.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
      },
    })

    if (!item) {
      throw new NotFoundError('PunchListItem', id)
    }

    return item
  },

  async listByProject(projectId: string, status?: string) {
    const where: any = { projectId }
    if (status) {
      where.status = status
    }

    return prismaAny.punchListItem.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    })
  },

  async updateItem(
    id: string,
    data: {
      status?: string
      assignedTo?: string
      priority?: string
      photoUrls?: string[]
      rejectionNote?: string
    },
    userId: string
  ) {
    const item = await prismaAny.punchListItem.findUnique({ where: { id } })
    if (!item) {
      throw new NotFoundError('PunchListItem', id)
    }

    const updateData: any = {}
    if (data.status) updateData.status = data.status
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo
    if (data.priority) updateData.priority = data.priority
    if (data.photoUrls) updateData.photoUrls = data.photoUrls
    if (data.rejectionNote) updateData.rejectionNote = data.rejectionNote
    if (data.status === 'COMPLETED') updateData.completedAt = new Date()

    const updated = await prismaAny.punchListItem.update({
      where: { id },
      data: updateData,
    })

    await auditService.recordAudit({
      action: 'PUNCH_LIST_ITEM_UPDATED',
      entityType: 'PunchListItem',
      entityId: id,
      userId,
      reason: `Punch list item updated`,
      before: { status: item.status },
      after: updateData,
    })

    return updated
  },

  async verifyItem(id: string, userId: string) {
    const item = await prismaAny.punchListItem.findUnique({ where: { id } })
    if (!item) {
      throw new NotFoundError('PunchListItem', id)
    }

    if (item.status !== 'COMPLETED') {
      throw new ValidationError('Item must be marked as completed before verification')
    }

    const updated = await prismaAny.punchListItem.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedBy: userId,
      },
    })

    await auditService.recordAudit({
      action: 'PUNCH_LIST_ITEM_VERIFIED',
      entityType: 'PunchListItem',
      entityId: id,
      userId,
      reason: `Punch list item verified: ${item.title}`,
    })

    return updated
  },

  async rejectItem(id: string, userId: string, note?: string) {
    const item = await prismaAny.punchListItem.findUnique({ where: { id } })
    if (!item) {
      throw new NotFoundError('PunchListItem', id)
    }

    if (item.status !== 'COMPLETED') {
      throw new ValidationError('Item must be marked as completed before rejection')
    }

    const updated = await prismaAny.punchListItem.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionNote: note || null,
      },
    })

    return updated
  },

  async getProjectSummary(projectId: string) {
    const items = await prismaAny.punchListItem.findMany({
      where: { projectId },
    })

    const byStatus = items.reduce((acc: Record<string, number>, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {})

    const byPriority = items.reduce((acc: Record<string, number>, item: any) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1
      return acc
    }, {})

    return {
      total: items.length,
      byStatus,
      byPriority,
      completionRate: items.length > 0
        ? Math.round(((byStatus.VERIFIED || 0) / items.length) * 100)
        : 0,
      openItems: (byStatus.OPEN || 0) + (byStatus.IN_PROGRESS || 0) + (byStatus.REJECTED || 0),
      readyForCloseout: items.length > 0 && (byStatus.OPEN || 0) === 0 && (byStatus.IN_PROGRESS || 0) === 0 && (byStatus.REJECTED || 0) === 0,
    }
  },
}
