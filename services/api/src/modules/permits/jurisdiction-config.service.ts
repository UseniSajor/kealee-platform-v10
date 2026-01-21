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

  // Stub methods for routes - to be implemented
  async createFeeSchedule(data: any) {
    return { id: 'stub', ...data }
  },
  async calculateFee(jurisdictionId: string, data: { permitType?: string; valuation?: number; squareFootage?: number; unitCount?: number }) {
    return { amount: 0, jurisdictionId, permitType: data.permitType || '' }
  },
  async createPermitTypeConfig(data: any) {
    return { id: 'stub', ...data }
  },
  async createReviewDiscipline(data: any) {
    return { id: 'stub', ...data }
  },
  async createInspectorAssignment(data: any) {
    return { id: 'stub', ...data }
  },
  async createBusinessRule(data: any) {
    return { id: 'stub', ...data }
  },
  async evaluateBusinessRules(jurisdictionId: string, permitData: any) {
    return { passed: true, rules: [] }
  },
  async createHoliday(data: any) {
    return { id: 'stub', ...data }
  },
  async isHoliday(jurisdictionId: string, date: Date, type?: string) {
    return false
  },
  async listConfiguration(jurisdictionId: string) {
    return []
  },
}


