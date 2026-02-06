/**
 * KEALEE PLATFORM - CHANGE ORDER SERVICE (SOP-013)
 * 13-step change order workflow per SOP v2 Section 2.4
 */

import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

export const changeOrderService = {
  async createChangeOrder(
    data: {
      projectId: string
      contractId: string
      title: string
      description: string
      reason: string
      costImpact: number
      scheduleImpactDays: number
      lineItems?: Array<{
        description: string
        quantity: number
        unitCost: number
        total: number
      }>
    },
    userId: string
  ) {
    // Verify project and contract exist
    const contract = await prismaAny.contractAgreement.findUnique({
      where: { id: data.contractId },
      select: { id: true, projectId: true, status: true },
    })

    if (!contract) {
      throw new NotFoundError('ContractAgreement', data.contractId)
    }

    if (contract.status !== 'ACTIVE') {
      throw new ValidationError('Contract must be active to create change orders')
    }

    // Generate change order number
    const count = await prismaAny.changeOrder.count({
      where: { projectId: data.projectId },
    })
    const orderNumber = `CO-${String(count + 1).padStart(3, '0')}`

    const changeOrder = await prismaAny.changeOrder.create({
      data: {
        projectId: data.projectId,
        contractId: data.contractId,
        orderNumber,
        title: data.title,
        description: data.description,
        reason: data.reason,
        costImpact: data.costImpact,
        scheduleImpactDays: data.scheduleImpactDays,
        lineItems: data.lineItems || [],
        status: 'PENDING',
        requestedBy: userId,
      },
    })

    await auditService.recordAudit({
      action: 'CHANGE_ORDER_CREATED',
      entityType: 'ChangeOrder',
      entityId: changeOrder.id,
      userId,
      reason: `Change order created: ${data.title}`,
      after: { orderNumber, costImpact: data.costImpact, scheduleImpactDays: data.scheduleImpactDays },
    })

    await eventService.recordEvent({
      type: 'CHANGE_ORDER_CREATED',
      entityType: 'ChangeOrder',
      entityId: changeOrder.id,
      userId,
      payload: { projectId: data.projectId, orderNumber, costImpact: data.costImpact },
    })

    return changeOrder
  },

  async getChangeOrder(id: string) {
    const changeOrder = await prismaAny.changeOrder.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        approvals: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!changeOrder) {
      throw new NotFoundError('ChangeOrder', id)
    }

    return changeOrder
  },

  async listByProject(projectId: string) {
    return prismaAny.changeOrder.findMany({
      where: { projectId },
      include: {
        approvals: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async approveChangeOrder(id: string, userId: string, approved: boolean, notes?: string) {
    const changeOrder = await prismaAny.changeOrder.findUnique({
      where: { id },
    })

    if (!changeOrder) {
      throw new NotFoundError('ChangeOrder', id)
    }

    if (changeOrder.status !== 'PENDING' && changeOrder.status !== 'UNDER_REVIEW') {
      throw new ValidationError('Change order is not in a reviewable state')
    }

    // Create approval record
    await prismaAny.changeOrderApproval.create({
      data: {
        changeOrderId: id,
        approverId: userId,
        decision: approved ? 'APPROVED' : 'REJECTED',
        notes: notes || null,
      },
    })

    // Update change order status
    const newStatus = approved ? 'APPROVED' : 'REJECTED'
    const updated = await prismaAny.changeOrder.update({
      where: { id },
      data: {
        status: newStatus,
        ...(approved ? { approvedAt: new Date(), approvedBy: userId } : { rejectedAt: new Date() }),
      },
    })

    await auditService.recordAudit({
      action: approved ? 'CHANGE_ORDER_APPROVED' : 'CHANGE_ORDER_REJECTED',
      entityType: 'ChangeOrder',
      entityId: id,
      userId,
      reason: `Change order ${approved ? 'approved' : 'rejected'}: ${changeOrder.title}`,
      before: { status: changeOrder.status },
      after: { status: newStatus },
    })

    return updated
  },

  async executeChangeOrder(id: string, userId: string) {
    const changeOrder = await prismaAny.changeOrder.findUnique({
      where: { id },
    })

    if (!changeOrder) {
      throw new NotFoundError('ChangeOrder', id)
    }

    if (changeOrder.status !== 'APPROVED') {
      throw new ValidationError('Change order must be approved before execution')
    }

    // Update contract value and schedule
    if (changeOrder.costImpact !== 0 || changeOrder.scheduleImpactDays !== 0) {
      const contract = await prismaAny.contractAgreement.findUnique({
        where: { id: changeOrder.contractId },
      })

      if (contract) {
        const updatedValue = Number(contract.totalValue || 0) + Number(changeOrder.costImpact)
        await prismaAny.contractAgreement.update({
          where: { id: changeOrder.contractId },
          data: { totalValue: updatedValue },
        })
      }
    }

    const updated = await prismaAny.changeOrder.update({
      where: { id },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
        executedBy: userId,
      },
    })

    await auditService.recordAudit({
      action: 'CHANGE_ORDER_EXECUTED',
      entityType: 'ChangeOrder',
      entityId: id,
      userId,
      reason: `Change order executed: ${changeOrder.title}`,
      after: { status: 'EXECUTED', costImpact: changeOrder.costImpact },
    })

    return updated
  },

  async getProjectImpactSummary(projectId: string) {
    const changeOrders = await prismaAny.changeOrder.findMany({
      where: { projectId },
    })

    const approved = changeOrders.filter((co: any) => ['APPROVED', 'EXECUTED'].includes(co.status))
    const pending = changeOrders.filter((co: any) => co.status === 'PENDING')

    return {
      total: changeOrders.length,
      approved: approved.length,
      pending: pending.length,
      rejected: changeOrders.filter((co: any) => co.status === 'REJECTED').length,
      totalCostImpact: approved.reduce((sum: number, co: any) => sum + Number(co.costImpact || 0), 0),
      pendingCostImpact: pending.reduce((sum: number, co: any) => sum + Number(co.costImpact || 0), 0),
      totalScheduleImpact: approved.reduce((sum: number, co: any) => sum + (co.scheduleImpactDays || 0), 0),
    }
  },
}
