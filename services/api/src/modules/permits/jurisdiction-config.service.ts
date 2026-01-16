import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'

export const jurisdictionConfigService = {
  async getConfig(jurisdictionId: string) {
    const config = await prismaAny.jurisdictionConfig.findUnique({
      where: { jurisdictionId },
    })

    if (!config) {
      throw new NotFoundError('Jurisdiction configuration not found')
    }

    return config
  },

  async updateConfig(jurisdictionId: string, data: any) {
    return prismaAny.jurisdictionConfig.upsert({
      where: { jurisdictionId },
      update: data,
      create: {
        jurisdictionId,
        ...data,
      },
    })
  },
}
