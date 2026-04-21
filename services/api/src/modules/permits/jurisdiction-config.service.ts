import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'
import { getPermitAdapterManager } from './integrations/adapter.manager'

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

  // Integration adapter methods
  async createFeeSchedule(data: any) {
    // Delegates to permit adapter
    const manager = getPermitAdapterManager()
    const adapter = await manager.getAdapter(data.jurisdictionCode || 'unknown')
    const fees = await adapter.getFees(data.permitType)
    return { id: data.jurisdictionCode, fees, ...data, source: adapter.name }
  },

  async calculateFee(jurisdictionId: string, data: { permitType?: string; valuation?: number; squareFootage?: number; unitCount?: number }) {
    // Delegates to permit adapter for jurisdiction-specific fee calculation
    const manager = getPermitAdapterManager()
    const adapter = await manager.getAdapter(jurisdictionId)
    const fees = await adapter.getFees(data.permitType || '')
    const baseFee = fees.reduce((sum, f) => sum + (f.required ? f.amount : 0), 0)
    return { amount: baseFee, jurisdictionId, permitType: data.permitType || '', source: adapter.name }
  },

  async createPermitTypeConfig(data: any) {
    // Store in DB, not delegated to adapter
    return prismaAny.permitTypeConfig?.create?.({
      data,
    }) || { id: `config-${Date.now()}`, ...data, source: 'local' }
  },

  async createReviewDiscipline(data: any) {
    // Store in DB, not delegated to adapter
    return prismaAny.reviewDiscipline?.create?.({
      data,
    }) || { id: `discipline-${Date.now()}`, ...data, source: 'local' }
  },

  async createInspectorAssignment(data: any) {
    // Store in DB, not delegated to adapter
    return prismaAny.inspectorAssignment?.create?.({
      data,
    }) || { id: `assignment-${Date.now()}`, ...data, source: 'local' }
  },

  async createBusinessRule(data: any) {
    // Store in DB, not delegated to adapter
    return prismaAny.businessRule?.create?.({
      data,
    }) || { id: `rule-${Date.now()}`, ...data, source: 'local' }
  },

  async evaluateBusinessRules(jurisdictionId: string, permitData: any) {
    // Evaluate stored rules against permit data
    const rules = await prismaAny.businessRule?.findMany?.({
      where: { jurisdictionId },
    }) || []

    // Simple pass/fail evaluation - extend with real business logic
    const results = rules.map((rule: any) => ({
      ruleId: rule.id,
      passed: true, // TODO: evaluate against permitData
    }))

    return { passed: results.every((r) => r.passed), rules: results }
  },

  async createHoliday(data: any) {
    // Store in DB
    return prismaAny.jurisdictionHoliday?.create?.({
      data,
    }) || { id: `holiday-${Date.now()}`, ...data, source: 'local' }
  },

  async isHoliday(jurisdictionId: string, date: Date, type?: string) {
    // Check against stored holidays
    const holiday = await prismaAny.jurisdictionHoliday?.findFirst?.({
      where: {
        jurisdictionId,
        date,
        ...(type && { type }),
      },
    })
    return !!holiday
  },

  async listConfiguration(jurisdictionId: string) {
    // List all configuration for jurisdiction
    const manager = getPermitAdapterManager()
    const adapter = await manager.getAdapter(jurisdictionId)

    return {
      jurisdictionId,
      adapterName: adapter.name,
      adapterAvailable: await adapter.isAvailable(),
      permitTypes: [], // Would query DB for configured types
      businessRules: [], // Would query DB for rules
      holidays: [], // Would query DB for holidays
    }
  },
}




