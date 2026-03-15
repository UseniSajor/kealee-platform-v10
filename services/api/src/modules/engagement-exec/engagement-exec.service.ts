/**
 * engagement-exec.service.ts
 * Commercial execution layer — change orders, milestone approvals,
 * escrow state machine, dispute/hold workflows.
 * Wraps ContractAgreement, EscrowAgreement, Milestone. No replacements.
 */
import prisma from '../../lib/prisma'
import type {
  CreateChangeOrderBody,
  RespondChangeOrderBody,
  SubmitMilestoneBody,
  ApproveMilestoneBody,
  OpenDisputeBody,
  ResolveDisputeBody,
  ReleaseEscrowBody,
  ChangeOrderDto,
  MilestoneApprovalDto,
  DisputeDto,
  EscrowStateDto,
} from './engagement-exec.dto'

const db = prisma as any

// ─── ACCESS HELPERS ───────────────────────────────────────────────────────────

async function _requireContractAccess(contractId: string, userId: string) {
  const contract = await db.contractAgreement.findFirst({
    where: {
      id: contractId,
      OR: [
        { ownerId: userId },
        { contractorId: userId },
        { project: { memberships: { some: { userId } } } },
      ],
    },
    select: { id: true, status: true, ownerId: true, contractorId: true },
  })
  if (!contract) throw Object.assign(new Error('Contract not found or access denied'), { statusCode: 404 })
  return contract
}

// ─── CHANGE ORDERS ────────────────────────────────────────────────────────────

export async function createChangeOrder(userId: string, body: CreateChangeOrderBody): Promise<ChangeOrderDto> {
  await _requireContractAccess(body.contractId, userId)

  const co = await db.changeOrder.create({
    data: {
      contractId: body.contractId,
      title: body.title,
      description: body.description,
      amountDelta: body.amountDelta,
      scheduleDeltaDays: body.scheduleDeltaDays,
      reason: body.reason,
      status: 'PENDING',
      requestedById: userId,
    },
  })

  return _mapChangeOrder(co)
}

export async function listChangeOrders(contractId: string, userId: string): Promise<ChangeOrderDto[]> {
  await _requireContractAccess(contractId, userId)
  const orders = await db.changeOrder.findMany({
    where: { contractId },
    orderBy: { createdAt: 'desc' },
  })
  return orders.map(_mapChangeOrder)
}

export async function respondToChangeOrder(
  changeOrderId: string,
  userId: string,
  body: RespondChangeOrderBody
): Promise<ChangeOrderDto> {
  const co = await db.changeOrder.findFirst({
    where: { id: changeOrderId },
    include: { contract: { select: { ownerId: true, contractorId: true, id: true, amount: true } } },
  })
  if (!co) throw Object.assign(new Error('Change order not found'), { statusCode: 404 })

  // Only the other party can respond (not the requester)
  if (co.requestedById === userId) {
    throw Object.assign(new Error('Cannot respond to your own change order'), { statusCode: 422 })
  }

  const newStatus = body.action === 'APPROVE' ? 'APPROVED'
    : body.action === 'REJECT' ? 'REJECTED' : 'COUNTERED'

  const updated = await db.$transaction(async (tx: any) => {
    const updatedCo = await tx.changeOrder.update({
      where: { id: changeOrderId },
      data: {
        status: newStatus,
        respondedById: userId,
        respondedAt: new Date(),
        counterAmountDelta: body.counterAmountDelta,
        notes: body.notes,
      },
    })

    // If approved, update the contract amount
    if (body.action === 'APPROVE') {
      await tx.contractAgreement.update({
        where: { id: co.contract.id },
        data: { amount: { increment: co.amountDelta } },
      })
    }

    return updatedCo
  })

  return _mapChangeOrder(updated)
}

// ─── MILESTONE EXECUTION ──────────────────────────────────────────────────────

export async function submitMilestone(userId: string, body: SubmitMilestoneBody): Promise<MilestoneApprovalDto> {
  const milestone = await db.milestone.findFirst({
    where: {
      id: body.milestoneId,
      contract: { contractorId: userId },
    },
    include: { contract: { select: { ownerId: true, contractorId: true } } },
  })
  if (!milestone) throw Object.assign(new Error('Milestone not found'), { statusCode: 404 })
  if (milestone.status !== 'PENDING') {
    throw Object.assign(new Error(`Milestone is already ${milestone.status}`), { statusCode: 422 })
  }

  const updated = await db.milestone.update({
    where: { id: body.milestoneId },
    data: {
      status: 'SUBMITTED',
      completedAt: new Date(),
    },
  })

  return _mapMilestoneApproval(updated)
}

export async function approveMilestone(userId: string, body: ApproveMilestoneBody): Promise<MilestoneApprovalDto> {
  const milestone = await db.milestone.findFirst({
    where: {
      id: body.milestoneId,
      contract: { ownerId: userId },
    },
    include: {
      contract: {
        include: { escrowAgreement: true },
      },
    },
  })
  if (!milestone) throw Object.assign(new Error('Milestone not found'), { statusCode: 404 })
  if (milestone.status !== 'SUBMITTED') {
    throw Object.assign(new Error('Milestone must be SUBMITTED before approval'), { statusCode: 422 })
  }

  const updated = await db.$transaction(async (tx: any) => {
    const newStatus = body.approved ? 'APPROVED' : 'PENDING'

    const updatedMilestone = await tx.milestone.update({
      where: { id: body.milestoneId },
      data: {
        status: newStatus,
        approvedAt: body.approved ? new Date() : undefined,
      },
    })

    // If approved and escrow exists, create a release transaction
    if (body.approved && milestone.contract.escrowAgreement) {
      const escrow = milestone.contract.escrowAgreement
      const releaseAmount = Number(milestone.amount)

      await tx.escrowTransaction?.create({
        data: {
          escrowId: escrow.id,
          type: 'MILESTONE_RELEASE',
          amount: releaseAmount,
          description: `Milestone approved: ${milestone.name}`,
          status: 'PENDING',
        },
      })

      // Deduct from available balance
      await tx.escrowAgreement.update({
        where: { id: escrow.id },
        data: {
          availableBalance: { decrement: releaseAmount },
          currentBalance: { decrement: releaseAmount },
        },
      })
    }

    return updatedMilestone
  })

  return _mapMilestoneApproval(updated)
}

export async function releaseMilestonePayment(userId: string, body: ReleaseEscrowBody): Promise<{ success: boolean; paidAmount: number }> {
  const milestone = await db.milestone.findFirst({
    where: {
      id: body.milestoneId,
      status: 'APPROVED',
      contract: { ownerId: userId },
    },
    include: { contract: { include: { escrowAgreement: true } } },
  })
  if (!milestone) throw Object.assign(new Error('Approved milestone not found'), { statusCode: 404 })

  await db.$transaction(async (tx: any) => {
    await tx.milestone.update({
      where: { id: body.milestoneId },
      data: { status: 'PAID', paidAt: new Date() },
    })

    await tx.escrowTransaction?.create({
      data: {
        escrowId: milestone.contract.escrowAgreement?.id,
        type: 'DISBURSEMENT',
        amount: body.amount,
        description: body.notes ?? `Payment for milestone: ${milestone.name}`,
        status: 'COMPLETED',
      },
    })
  })

  return { success: true, paidAmount: body.amount }
}

// ─── DISPUTES ────────────────────────────────────────────────────────────────

export async function openDispute(userId: string, body: OpenDisputeBody): Promise<DisputeDto> {
  await _requireContractAccess(body.contractId, userId)

  // Check no open dispute already
  const existing = await db.dispute.findFirst({
    where: { contractId: body.contractId, status: 'OPEN' },
  })
  if (existing) throw Object.assign(new Error('A dispute is already open for this contract'), { statusCode: 409 })

  const dispute = await db.$transaction(async (tx: any) => {
    const d = await tx.dispute.create({
      data: {
        contractId: body.contractId,
        reason: body.reason,
        requestedResolution: body.requestedResolution,
        status: 'OPEN',
        openedById: userId,
      },
    })

    // Put escrow on hold
    const escrow = await tx.escrowAgreement.findFirst({ where: { contractId: body.contractId } })
    if (escrow) {
      await tx.escrowAgreement.update({
        where: { id: escrow.id },
        data: { status: 'ON_HOLD' },
      })
    }

    // Mark contract as disputed
    await tx.contractAgreement.update({
      where: { id: body.contractId },
      data: { status: 'DISPUTED' },
    })

    return d
  })

  return _mapDispute(dispute)
}

export async function resolveDispute(
  disputeId: string,
  userId: string,
  body: ResolveDisputeBody
): Promise<DisputeDto> {
  const dispute = await db.dispute.findFirst({
    where: { id: disputeId },
    include: { contract: { include: { escrowAgreement: true } } },
  })
  if (!dispute) throw Object.assign(new Error('Dispute not found'), { statusCode: 404 })
  if (dispute.status !== 'OPEN') throw Object.assign(new Error('Dispute is not open'), { statusCode: 422 })

  const updated = await db.$transaction(async (tx: any) => {
    const d = await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolution: body.resolution,
        resolutionType: body.resolutionType,
        resolvedAt: new Date(),
        resolvedById: userId,
      },
    })

    // Reactivate escrow if dismissed or resolved
    if (dispute.contract.escrowAgreement) {
      await tx.escrowAgreement.update({
        where: { id: dispute.contract.escrowAgreement.id },
        data: { status: 'ACTIVE' },
      })
    }

    // Restore contract to ACTIVE
    await tx.contractAgreement.update({
      where: { id: dispute.contractId },
      data: { status: 'ACTIVE' },
    })

    return d
  })

  return _mapDispute(updated)
}

// ─── ESCROW STATE ─────────────────────────────────────────────────────────────

export async function getEscrowState(contractId: string, userId: string): Promise<EscrowStateDto | null> {
  await _requireContractAccess(contractId, userId)

  const escrow = await db.escrowAgreement.findFirst({
    where: { contractId },
    include: {
      holds: { where: { status: 'ACTIVE' } },
      transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })
  if (!escrow) return null

  return {
    id: escrow.id,
    contractId: escrow.contractId,
    status: escrow.status,
    currentBalance: Number(escrow.currentBalance),
    availableBalance: Number(escrow.availableBalance),
    heldBalance: Number(escrow.heldBalance),
    holdbackPercentage: escrow.holdbackPercentage,
    holds: (escrow.holds ?? []).map((h: any) => ({
      id: h.id,
      amount: Number(h.amount),
      reason: h.reason,
      status: h.status,
      expiresAt: h.expiresAt?.toISOString() ?? null,
    })),
    recentTransactions: (escrow.transactions ?? []).map((t: any) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      description: t.description ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
  }
}

// ─── MAPPERS ──────────────────────────────────────────────────────────────────

function _mapChangeOrder(co: any): ChangeOrderDto {
  return {
    id: co.id,
    contractId: co.contractId,
    title: co.title,
    description: co.description ?? null,
    amountDelta: Number(co.amountDelta),
    scheduleDeltaDays: co.scheduleDeltaDays ?? null,
    reason: co.reason,
    status: co.status,
    requestedById: co.requestedById,
    respondedById: co.respondedById ?? null,
    respondedAt: co.respondedAt?.toISOString() ?? null,
    counterAmountDelta: co.counterAmountDelta ? Number(co.counterAmountDelta) : null,
    notes: co.notes ?? null,
    createdAt: co.createdAt.toISOString(),
  }
}

function _mapMilestoneApproval(m: any): MilestoneApprovalDto {
  return {
    milestoneId: m.id,
    status: m.status,
    approvedById: m.approvedById ?? null,
    approvedAt: m.approvedAt?.toISOString() ?? null,
    amount: Number(m.amount),
    notes: m.notes ?? null,
  }
}

function _mapDispute(d: any): DisputeDto {
  return {
    id: d.id,
    contractId: d.contractId,
    reason: d.reason,
    status: d.status,
    requestedResolution: d.requestedResolution,
    openedById: d.openedById,
    createdAt: d.createdAt.toISOString(),
    resolvedAt: d.resolvedAt?.toISOString() ?? null,
  }
}
