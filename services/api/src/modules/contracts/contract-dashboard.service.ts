import { prismaAny } from '../../utils/prisma-helper'
// Prisma types available through prismaAny
import { AuthorizationError, NotFoundError } from '../../errors/app.error'

export const contractDashboardService = {
  async getUserContracts(userId: string) {
    // Get all contracts where user is owner or contractor
    const contracts = await prismaAny.contractAgreement.findMany({
      where: {
        OR: [{ ownerId: userId }, { contractorId: userId }],
      },
      include: {
        project: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, email: true } },
        contractor: { select: { id: true, name: true, email: true } },
        milestones: { select: { id: true, name: true, amount: true, status: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Get signature status for each contract
    const contractsWithStatus = await Promise.all(
      contracts.map(async (contract: any) => {
        let needsSignature = false
        let pendingSigners: string[] = []
        let lastSignatureDate: Date | null = null

        if (contract.docusignEnvelopeId && (contract.status === 'SENT' || contract.status === 'SIGNED')) {
          // In production, this would fetch from DocuSign API
          // For now, determine based on contract status
          if (contract.status === 'SENT') {
            needsSignature = true
            if (contract.contractorId === userId) {
              pendingSigners.push('contractor')
            }
            if (contract.ownerId === userId) {
              pendingSigners.push('owner')
            }
          } else if (contract.status === 'SIGNED') {
            lastSignatureDate = contract.updatedAt
          }
        }

        return {
          ...contract,
          needsSignature,
          pendingSigners,
          lastSignatureDate,
        }
      })
    )

    return contractsWithStatus
  },

  async getSigningAuditTrail(contractId: string, userId: string) {
    const contract = await prismaAny.contractAgreement.findUnique({
      where: { id: contractId },
      include: { project: { select: { ownerId: true } } },
    })

    if (!contract) throw new NotFoundError('ContractAgreement', contractId)
    if (contract.project.ownerId !== userId && contract.contractorId !== userId) {
      throw new AuthorizationError('Only contract parties can view audit trail')
    }

    // Get audit logs for signing events
    const auditLogs = await prismaAny.auditLog.findMany({
      where: {
        entityType: 'ContractAgreement',
        entityId: contractId,
        OR: [
          { action: { contains: 'SIGN' } },
          { action: { contains: 'SENT' } },
          { action: { contains: 'STATUS' } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get events for signing
    const events = await prismaAny.event.findMany({
      where: {
        entityType: 'ContractAgreement',
        entityId: contractId,
        OR: [
          { type: { contains: 'SIGN' } },
          { type: { contains: 'CONTRACT' } },
        ],
      },
      orderBy: { occurredAt: 'desc' },
    })

    return {
      auditLogs: auditLogs.map((log: any) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        user: log.user,
        createdAt: log.createdAt,
      })),
      events: events.map((event: any) => ({
        id: event.id,
        type: event.type,
        metadata: event.metadata,
        createdAt: event.createdAt,
      })),
    }
  },

  async cancelContract(contractId: string, userId: string, reason: string) {
    const contract = await prismaAny.contractAgreement.findUnique({
      where: { id: contractId },
      include: { project: { select: { ownerId: true } } },
    })

    if (!contract) throw new NotFoundError('ContractAgreement', contractId)
    if (contract.project.ownerId !== userId) {
      throw new AuthorizationError('Only the contract owner can cancel')
    }

    if (contract.status === 'CANCELLED' || contract.status === 'ARCHIVED') {
      throw new Error('Contract is already cancelled or archived')
    }

    const updated = await prismaAny.contractAgreement.update({
      where: { id: contractId },
      data: {
        status: 'CANCELLED',
      },
    })

    // Create audit log
    await prismaAny.auditLog.create({
      data: {
        entityType: 'ContractAgreement',
        entityId: contractId,
        action: 'CANCELLED',
        details: { reason },
        userId: userId,
      },
    })

    // Create event
    await prismaAny.event.create({
      data: {
        entityType: 'ContractAgreement',
        entityId: contractId,
        type: 'CONTRACT_CANCELLED',
        payload: { reason, cancelledBy: userId },
        userId: userId,
      },
    })

    return updated
  },

  async archiveContract(contractId: string, userId: string) {
    const contract = await prismaAny.contractAgreement.findUnique({
      where: { id: contractId },
      include: { project: { select: { ownerId: true } } },
    })

    if (!contract) throw new NotFoundError('ContractAgreement', contractId)
    if (contract.project.ownerId !== userId) {
      throw new AuthorizationError('Only the contract owner can archive')
    }

    if (contract.status !== 'COMPLETED' && contract.status !== 'SIGNED') {
      throw new Error('Only completed or signed contracts can be archived')
    }

    const updated = await prismaAny.contractAgreement.update({
      where: { id: contractId },
      data: {
        status: 'ARCHIVED',
      },
    })

    // Create audit log
    await prismaAny.auditLog.create({
      data: {
        entityType: 'ContractAgreement',
        entityId: contractId,
        action: 'ARCHIVED',
        details: {},
        userId: userId,
      },
    })

    return updated
  },

  async getPendingSignatures(userId: string) {
    const contracts = await prismaAny.contractAgreement.findMany({
      where: {
        status: 'SENT',
        OR: [{ ownerId: userId }, { contractorId: userId }],
        docusignEnvelopeId: { not: null },
      },
      include: {
        project: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, email: true } },
        contractor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' }, // Oldest first
    })

    return contracts.map((contract: any) => ({
      id: contract.id,
      projectName: contract.project.name,
      totalAmount: contract.totalAmount,
      owner: contract.owner,
      contractor: contract.contractor,
      sentAt: contract.updatedAt, // When status changed to SENT
      daysPending: Math.floor((Date.now() - contract.updatedAt.getTime()) / (1000 * 60 * 60 * 24)),
    }))
  },
}
