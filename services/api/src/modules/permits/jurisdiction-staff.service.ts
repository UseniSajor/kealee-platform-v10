import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'

export const jurisdictionStaffService = {
  async getStaff(jurisdictionId: string) {
    return prismaAny.jurisdictionStaff.findMany({
      where: { jurisdictionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  },

  async addStaff(jurisdictionId: string, userId: string, role: string) {
    return prismaAny.jurisdictionStaff.create({
      data: {
        jurisdictionId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  },

  async removeStaff(jurisdictionId: string, userId: string) {
    const staff = await prismaAny.jurisdictionStaff.findFirst({
      where: {
        jurisdictionId,
        userId,
      },
    })

    if (!staff) {
      throw new NotFoundError('Staff member not found')
    }

    await prismaAny.jurisdictionStaff.delete({
      where: { id: staff.id },
    })
  },

  // Stub methods for routes - to be implemented
  async createStaff(data: any) {
    return { id: 'stub', ...data }
  },
  async listStaff(jurisdictionId: string, options?: any) {
    return this.getStaff(jurisdictionId)
  },
  async balanceWorkload(jurisdictionId: string, options?: any) {
    return { balanced: true }
  },
  async assignWorkload(data: { jurisdictionId: string; staffId: string; permitIds: string[]; dueDate?: Date; assignedById?: string }) {
    return { assigned: true }
  },
  async recordPerformanceMetric(data: { staffId: string; metric?: any; score?: number; passed?: boolean; notes?: string; certificateFileUrl?: string; jurisdictionId?: string; periodStart?: Date; periodEnd?: Date }) {
    return { recorded: true }
  },
  async addCertification(data: { staffId: string; certification?: any; score?: number; passed?: boolean; notes?: string; certificateFileUrl?: string; jurisdictionId?: string; issueDate?: Date; expirationDate?: Date; createdById?: string }) {
    return { id: 'stub', ...data }
  },
  async assignTraining(data: { staffId: string; training?: any; trainingId?: string; dueDate?: Date; jurisdictionId?: string; expiresAt?: Date; assignedById?: string }) {
    return { id: 'stub', ...data }
  },
  async completeTraining(staffId: string, data: { trainingId?: string; score?: number; passed?: boolean; notes?: string }) {
    return { completed: true }
  },
  async provisionMobileApp(data: { staffId: string; jurisdictionId?: string; provisionedById?: string; deviceId?: string; deviceType?: string; deviceName?: string; deviceModel?: string; osVersion?: string; appVersion?: string }) {
    return { provisioned: true }
  },
  async getStaffPerformanceSummary(jurisdictionId: string, options?: { start?: Date; end?: Date }) {
    return { summary: {} }
  },
}




