import { prisma } from '@kealee/database'
import { NotFoundError } from '../../errors/app.error'

export const jurisdictionConfigService = {
  async getConfig(jurisdictionId: string) {
    const config = await prisma.jurisdictionConfig.findUnique({
      where: { jurisdictionId },
    })

    if (!config) {
      throw new NotFoundError('Jurisdiction configuration not found')
    }

    return config
  },

  async updateConfig(jurisdictionId: string, data: any) {
    return prisma.jurisdictionConfig.upsert({
      where: { jurisdictionId },
      update: data,
      create: {
        jurisdictionId,
        ...data,
      },
    })
  },
}
