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
}
