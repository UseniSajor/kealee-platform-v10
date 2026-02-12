import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'

class PMSelectionsService {
  async list(params: {
    projectId: string
    status?: string
    category?: string
    page?: number
    limit?: number
  }) {
    const { projectId, status, category, page = 1, limit = 50 } = params
    const skip = (page - 1) * limit
    const where: any = { projectId }
    if (status) where.status = status
    if (category) where.category = category

    const [selections, total] = await Promise.all([
      prismaAny.selection.findMany({
        where,
        include: {
          options: true,
          createdBy: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prismaAny.selection.count({ where }),
    ])

    return {
      data: selections,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getById(id: string) {
    const selection = await prismaAny.selection.findUnique({
      where: { id },
      include: {
        options: { orderBy: { createdAt: 'asc' } },
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    })
    if (!selection) throw new NotFoundError('Selection', id)
    return selection
  }

  async create(data: {
    projectId: string; title: string; description?: string; category: string
    specSection?: string; location?: string; dueDate?: string
    budgetAllowance?: number; createdById: string
  }) {
    return prismaAny.selection.create({
      data: {
        projectId: data.projectId, title: data.title, description: data.description,
        category: data.category, specSection: data.specSection, location: data.location,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        budgetAllowance: data.budgetAllowance, createdById: data.createdById, status: 'PENDING',
      },
      include: { options: true, createdBy: { select: { id: true, name: true, email: true } } },
    })
  }

  async update(id: string, data: {
    title?: string; description?: string; category?: string; specSection?: string
    location?: string; status?: string; dueDate?: string
    budgetAllowance?: number; actualCost?: number
  }) {
    const existing = await prismaAny.selection.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Selection', id)
    return prismaAny.selection.update({
      where: { id },
      data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : undefined },
      include: {
        options: true,
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async delete(id: string) {
    const existing = await prismaAny.selection.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Selection', id)
    await prismaAny.selection.delete({ where: { id } })
    return { success: true }
  }

  async addOption(selectionId: string, data: {
    name: string; description?: string; vendor?: string; manufacturer?: string
    modelNumber?: string; color?: string; finish?: string; leadTime?: string
    unitCost?: number; totalCost?: number; imageUrls?: string[]
    specSheetUrl?: string; isRecommended?: boolean
  }) {
    const selection = await prismaAny.selection.findUnique({ where: { id: selectionId } })
    if (!selection) throw new NotFoundError('Selection', selectionId)
    const option = await prismaAny.selectionOption.create({
      data: {
        selectionId, name: data.name, description: data.description, vendor: data.vendor,
        manufacturer: data.manufacturer, modelNumber: data.modelNumber, color: data.color,
        finish: data.finish, leadTime: data.leadTime, unitCost: data.unitCost,
        totalCost: data.totalCost, imageUrls: data.imageUrls || [],
        specSheetUrl: data.specSheetUrl, isRecommended: data.isRecommended || false,
      },
    })
    if (selection.status === 'PENDING') {
      await prismaAny.selection.update({ where: { id: selectionId }, data: { status: 'OPTIONS_PROVIDED' } })
    }
    return option
  }

  async updateOption(selectionId: string, optionId: string, data: {
    name?: string; description?: string; vendor?: string; manufacturer?: string
    modelNumber?: string; color?: string; finish?: string; leadTime?: string
    unitCost?: number; totalCost?: number; imageUrls?: string[]
    specSheetUrl?: string; isRecommended?: boolean
  }) {
    const option = await prismaAny.selectionOption.findFirst({ where: { id: optionId, selectionId } })
    if (!option) throw new NotFoundError('SelectionOption', optionId)
    return prismaAny.selectionOption.update({ where: { id: optionId }, data })
  }

  async removeOption(selectionId: string, optionId: string) {
    const option = await prismaAny.selectionOption.findFirst({ where: { id: optionId, selectionId } })
    if (!option) throw new NotFoundError('SelectionOption', optionId)
    await prismaAny.selectionOption.delete({ where: { id: optionId } })
    return { success: true }
  }

  async selectOption(selectionId: string, optionId: string) {
    const option = await prismaAny.selectionOption.findFirst({ where: { id: optionId, selectionId } })
    if (!option) throw new NotFoundError('SelectionOption', optionId)
    await prismaAny.selectionOption.updateMany({ where: { selectionId }, data: { isSelected: false } })
    await prismaAny.selectionOption.update({ where: { id: optionId }, data: { isSelected: true } })
    return prismaAny.selection.update({
      where: { id: selectionId },
      data: { selectedOptionId: optionId, status: 'SELECTED', actualCost: option.totalCost },
      include: { options: true, createdBy: { select: { id: true, name: true, email: true } } },
    })
  }

  async approve(selectionId: string, approvedById: string) {
    const selection = await prismaAny.selection.findUnique({ where: { id: selectionId } })
    if (!selection) throw new NotFoundError('Selection', selectionId)
    return prismaAny.selection.update({
      where: { id: selectionId },
      data: { status: 'APPROVED', approvedById, approvedAt: new Date() },
      include: {
        options: true,
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async getStats(projectId: string) {
    const selections = await prismaAny.selection.findMany({ where: { projectId }, include: { options: true } })
    const total = selections.length
    const byStatus: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    let totalBudget = 0, totalActual = 0, pendingCount = 0, overBudgetCount = 0
    for (const sel of selections) {
      byStatus[sel.status] = (byStatus[sel.status] || 0) + 1
      byCategory[sel.category] = (byCategory[sel.category] || 0) + 1
      if (sel.budgetAllowance) totalBudget += Number(sel.budgetAllowance)
      if (sel.actualCost) totalActual += Number(sel.actualCost)
      if (sel.status === 'PENDING' || sel.status === 'OPTIONS_PROVIDED') pendingCount++
      if (sel.budgetAllowance && sel.actualCost && Number(sel.actualCost) > Number(sel.budgetAllowance)) overBudgetCount++
    }
    return { total, byStatus, byCategory, pendingCount, overBudgetCount, totalBudget, totalActual, variance: totalActual - totalBudget }
  }
}

export const pmSelectionsService = new PMSelectionsService()
