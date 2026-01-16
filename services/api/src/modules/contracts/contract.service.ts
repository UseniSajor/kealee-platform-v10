import { prismaAny } from '../../utils/prisma-helper'
import { AuthorizationError, NotFoundError } from '../../errors/app.error'

export const contractService = {
  async createContract(data: {
    projectId: string
    templateId?: string | null
    contractorId?: string | null
    terms?: string | null
    milestones?: Array<{ name: string; description?: string | null; amount: number }>
  }, userId: string) {
    // Implementation placeholder
    throw new Error('Not implemented')
  },

  async getContract(id: string, userId: string) {
    const contract = await prismaAny.contractAgreement.findUnique({
      where: { id },
      include: {
        project: true,
        owner: true,
        contractor: true,
        milestones: true,
      },
    })

    if (!contract) {
      throw new NotFoundError('Contract not found')
    }

    // Check authorization
    if (contract.ownerId !== userId && contract.contractorId !== userId) {
      throw new AuthorizationError('Not authorized to view this contract')
    }

    return contract
  },

  async listProjectContracts(projectId: string, userId: string) {
    const contracts = await prismaAny.contractAgreement.findMany({
      where: {
        projectId,
        OR: [{ ownerId: userId }, { contractorId: userId }],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        contractor: { select: { id: true, name: true, email: true } },
        milestones: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return contracts
  },

  async updateContract(id: string, userId: string, data: {
    terms?: string | null
    status?: string
  }) {
    const contract = await prismaAny.contractAgreement.findUnique({
      where: { id },
    })

    if (!contract) {
      throw new NotFoundError('Contract not found')
    }

    if (contract.ownerId !== userId) {
      throw new AuthorizationError('Not authorized to update this contract')
    }

    return prismaAny.contractAgreement.update({
      where: { id },
      data,
    })
  },

  async addMilestone(id: string, userId: string, data: {
    name: string
    description?: string | null
    amount: number
  }) {
    const contract = await prismaAny.contractAgreement.findUnique({
      where: { id },
    })

    if (!contract) {
      throw new NotFoundError('Contract not found')
    }

    if (contract.ownerId !== userId) {
      throw new AuthorizationError('Not authorized to modify this contract')
    }

    return prismaAny.contractMilestone.create({
      data: {
        contractId: id,
        ...data,
      },
    })
  },

  async updateMilestone(milestoneId: string, userId: string, data: {
    name?: string
    description?: string | null
    amount?: number
    status?: string
  }) {
    const milestone = await prismaAny.contractMilestone.findUnique({
      where: { id: milestoneId },
      include: { contract: true },
    })

    if (!milestone) {
      throw new NotFoundError('Milestone not found')
    }

    if (milestone.contract.ownerId !== userId) {
      throw new AuthorizationError('Not authorized to modify this milestone')
    }

    return prismaAny.contractMilestone.update({
      where: { id: milestoneId },
      data,
    })
  },

  async deleteMilestone(milestoneId: string, userId: string) {
    const milestone = await prismaAny.contractMilestone.findUnique({
      where: { id: milestoneId },
      include: { contract: true },
    })

    if (!milestone) {
      throw new NotFoundError('Milestone not found')
    }

    if (milestone.contract.ownerId !== userId) {
      throw new AuthorizationError('Not authorized to delete this milestone')
    }

    await prismaAny.contractMilestone.delete({
      where: { id: milestoneId },
    })
  },
}
