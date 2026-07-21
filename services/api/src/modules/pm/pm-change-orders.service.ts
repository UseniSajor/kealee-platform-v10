import { prismaAny } from '../../utils/prisma-helper'

class ChangeOrderService {
  async list(filters: { projectId?: string; status?: string; requestedBy?: string; page?: number; limit?: number; search?: string }) {
    const { projectId, status, requestedBy, page = 1, limit = 50, search } = filters
    const where: any = {}
    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (requestedBy) where.requestedBy = requestedBy
    if (search) where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { changeOrderNumber: { contains: search, mode: 'insensitive' } }]

    const [items, total] = await Promise.all([
      prismaAny.changeOrder.findMany({ where, include: { approvals: true, lineItems: true, project: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prismaAny.changeOrder.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getById(id: string) {
    return prismaAny.changeOrder.findUnique({ where: { id }, include: { approvals: { include: { approver: { select: { id: true, name: true, email: true } } } }, lineItems: true, project: { select: { id: true, name: true } } } })
  }

  async create(data: any) {
    const { lineItems, ...coData } = data
    return prismaAny.changeOrder.create({ data: { ...coData, lineItems: lineItems?.length ? { create: lineItems } : undefined }, include: { lineItems: true } })
  }

  async update(id: string, data: any) {
    const { lineItems, ...coData } = data
    if (lineItems) {
      await prismaAny.changeOrderLineItem.deleteMany({ where: { changeOrderId: id } })
      await prismaAny.changeOrderLineItem.createMany({ data: lineItems.map((li: any) => ({ ...li, changeOrderId: id })) })
    }
    return prismaAny.changeOrder.update({ where: { id }, data: coData, include: { lineItems: true, approvals: true } })
  }

  async softDelete(id: string) {
    return prismaAny.changeOrder.update({ where: { id }, data: { status: 'CANCELLED' } })
  }

  async submit(id: string) {
    return prismaAny.changeOrder.update({ where: { id }, data: { status: 'SUBMITTED', submittedAt: new Date() } })
  }

  async approve(id: string, data: { approverId: string; role: string; comments?: string }) {
    await prismaAny.changeOrderApproval.create({ data: { changeOrderId: id, approverId: data.approverId, role: data.role, status: 'APPROVED', comments: data.comments, approvedAt: new Date(), decidedAt: new Date() } })
    return prismaAny.changeOrder.update({ where: { id }, data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: data.approverId }, include: { approvals: true } })
  }

  async reject(id: string, data: { approverId: string; role: string; reason: string }) {
    await prismaAny.changeOrderApproval.create({ data: { changeOrderId: id, approverId: data.approverId, role: data.role, status: 'REJECTED', comments: data.reason, decidedAt: new Date() } })
    return prismaAny.changeOrder.update({ where: { id }, data: { status: 'REJECTED', rejectionReason: data.reason, reviewedAt: new Date() }, include: { approvals: true } })
  }

  async getStats(projectId?: string) {
    const where: any = projectId ? { projectId } : {}
    const [total, byStatus, totalAmount] = await Promise.all([
      prismaAny.changeOrder.count({ where }),
      prismaAny.changeOrder.groupBy({ by: ['status'], where, _count: true }),
      prismaAny.changeOrder.aggregate({ where, _sum: { totalCost: true } }),
    ])
    return { total, byStatus: byStatus.reduce((acc: any, s: any) => ({ ...acc, [s.status]: s._count }), {}), totalAmount: totalAmount._sum?.totalCost || 0 }
  }
}

export const changeOrderService = new ChangeOrderService()
