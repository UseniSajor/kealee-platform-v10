/**
 * PM Budget Service
 * Handles budget lines, entries, snapshots, alerts, variance, and forecasting
 */
import { prismaAny } from '../../utils/prisma-helper'

class PmBudgetService {
  async getOverview(projectId: string) {
    const lines = await prismaAny.budgetLine.findMany({ where: { projectId } })
    const totalBudget = lines.reduce((sum: number, l: any) => sum + (parseFloat(l.budgetAmount) || 0), 0)
    const totalActual = lines.reduce((sum: number, l: any) => sum + (parseFloat(l.actualAmount) || 0), 0)
    const totalCommitted = lines.reduce((sum: number, l: any) => sum + (parseFloat(l.committedAmount) || 0), 0)
    const totalVariance = totalBudget - totalActual
    return {
      projectId, totalBudget, totalActual, totalCommitted, totalVariance,
      variancePercent: totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0,
      lineCount: lines.length,
    }
  }

  async listLines(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId
    if (params.category) where.category = params.category
    if (params.status) where.status = params.status.toUpperCase()
    const page = params.page || 1
    const limit = params.limit || 50
    const [lines, total] = await Promise.all([
      prismaAny.budgetLine.findMany({ where, orderBy: { sortOrder: 'asc' }, skip: (page - 1) * limit, take: limit }),
      prismaAny.budgetLine.count({ where }),
    ])
    return { lines, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async createLine(data: any, userId: string) {
    return prismaAny.budgetLine.create({
      data: {
        projectId: data.projectId, code: data.code || null, name: data.name,
        category: data.category || null, description: data.description || null,
        budgetAmount: data.budgetAmount || 0, actualAmount: 0, committedAmount: 0,
        sortOrder: data.sortOrder || 0, status: 'ACTIVE',
        createdById: userId, metadata: data.metadata || {},
      },
    })
  }

  async updateLine(id: string, updates: any) {
    const existing = await prismaAny.budgetLine.findUnique({ where: { id } })
    if (!existing) throw new Error('Budget line not found')
    return prismaAny.budgetLine.update({
      where: { id },
      data: {
        ...(updates.code !== undefined && { code: updates.code }),
        ...(updates.name && { name: updates.name }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.budgetAmount !== undefined && { budgetAmount: updates.budgetAmount }),
        ...(updates.sortOrder !== undefined && { sortOrder: updates.sortOrder }),
        ...(updates.status && { status: updates.status.toUpperCase() }),
        ...(updates.metadata && { metadata: updates.metadata }),
      },
    })
  }

  async deleteLine(id: string) {
    const existing = await prismaAny.budgetLine.findUnique({ where: { id } })
    if (!existing) throw new Error('Budget line not found')
    await prismaAny.budgetLine.delete({ where: { id } })
    return { success: true }
  }

  async listEntries(params: any) {
    const where: any = {}
    if (params.budgetLineId) where.budgetLineId = params.budgetLineId
    if (params.projectId) where.budgetLine = { projectId: params.projectId }
    if (params.type) where.type = params.type.toUpperCase()
    const page = params.page || 1
    const limit = params.limit || 50
    const [entries, total] = await Promise.all([
      prismaAny.budgetEntry.findMany({ where, include: { budgetLine: true }, orderBy: { date: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prismaAny.budgetEntry.count({ where }),
    ])
    return { entries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async createEntry(data: any, userId: string) {
    const entry = await prismaAny.budgetEntry.create({
      data: {
        budgetLineId: data.budgetLineId, type: data.type.toUpperCase(),
        amount: data.amount, description: data.description || null,
        vendor: data.vendor || null, invoiceNumber: data.invoiceNumber || null,
        date: data.date ? new Date(data.date) : new Date(),
        createdById: userId, metadata: data.metadata || {},
      },
    })
    const line = await prismaAny.budgetLine.findUnique({ where: { id: data.budgetLineId } })
    if (line) {
      const field = data.type.toUpperCase() === 'COMMITTED' ? 'committedAmount' : 'actualAmount'
      await prismaAny.budgetLine.update({ where: { id: data.budgetLineId }, data: { [field]: { increment: data.amount } } })
    }
    return entry
  }

  async updateEntry(id: string, updates: any) {
    const existing = await prismaAny.budgetEntry.findUnique({ where: { id } })
    if (!existing) throw new Error('Budget entry not found')
    return prismaAny.budgetEntry.update({
      where: { id },
      data: {
        ...(updates.amount !== undefined && { amount: updates.amount }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.vendor !== undefined && { vendor: updates.vendor }),
        ...(updates.invoiceNumber !== undefined && { invoiceNumber: updates.invoiceNumber }),
        ...(updates.date && { date: new Date(updates.date) }),
        ...(updates.metadata && { metadata: updates.metadata }),
      },
    })
  }

  async getSnapshots(projectId: string) {
    return { snapshots: await prismaAny.budgetSnapshot.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } }) }
  }

  async takeSnapshot(projectId: string, userId: string, label?: string) {
    const overview = await this.getOverview(projectId)
    const lines = await prismaAny.budgetLine.findMany({ where: { projectId } })
    return prismaAny.budgetSnapshot.create({
      data: {
        projectId, label: label || new Date().toISOString(),
        totalBudget: overview.totalBudget, totalActual: overview.totalActual,
        totalCommitted: overview.totalCommitted, totalVariance: overview.totalVariance,
        lineData: lines, createdById: userId,
      },
    })
  }

  async getAlerts(projectId: string) {
    return { alerts: await prismaAny.budgetAlert.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } }) }
  }

  async acknowledgeAlert(alertId: string, userId: string) {
    const alert = await prismaAny.budgetAlert.findUnique({ where: { id: alertId } })
    if (!alert) throw new Error('Budget alert not found')
    return prismaAny.budgetAlert.update({ where: { id: alertId }, data: { acknowledged: true, acknowledgedBy: userId, acknowledgedAt: new Date() } })
  }

  async getVarianceReport(projectId: string) {
    const lines = await prismaAny.budgetLine.findMany({ where: { projectId } })
    const report = lines.map((line: any) => {
      const budget = parseFloat(line.budgetAmount) || 0
      const actual = parseFloat(line.actualAmount) || 0
      const variance = budget - actual
      return { id: line.id, name: line.name, code: line.code, category: line.category, budgetAmount: budget, actualAmount: actual, variance, variancePercent: budget > 0 ? (variance / budget) * 100 : 0, status: variance < 0 ? 'OVER_BUDGET' : variance === 0 ? 'ON_BUDGET' : 'UNDER_BUDGET' }
    })
    return { lines: report }
  }

  async getForecast(projectId: string) {
    const lines = await prismaAny.budgetLine.findMany({ where: { projectId } })
    const entries = await prismaAny.budgetEntry.findMany({ where: { budgetLine: { projectId } }, orderBy: { date: 'asc' } })
    const totalBudget = lines.reduce((s: number, l: any) => s + (parseFloat(l.budgetAmount) || 0), 0)
    const totalActual = lines.reduce((s: number, l: any) => s + (parseFloat(l.actualAmount) || 0), 0)
    const totalCommitted = lines.reduce((s: number, l: any) => s + (parseFloat(l.committedAmount) || 0), 0)
    return {
      projectId, totalBudget, totalActual, totalCommitted,
      projectedTotal: totalActual + totalCommitted,
      projectedVariance: totalBudget - (totalActual + totalCommitted),
      burnRate: entries.length > 0 ? totalActual / entries.length : 0,
      entryCount: entries.length,
    }
  }
}

export const pmBudgetService = new PmBudgetService()
