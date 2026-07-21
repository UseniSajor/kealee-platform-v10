import { PrismaRuntimeStore, fulfillmentPlan } from '@kealee/autonomous-runtime'
import type { V30BotType } from '@kealee/kealee-agent-stack'

export async function ensureAutonomousFulfillmentRun(input: {
  intakeId: string
  stripeSessionId: string
  productKey: string
  botTypes: V30BotType[]
  workflowTemplateId?: string
  propertyIntelligenceDepth?: string
}) {
  const store = new PrismaRuntimeStore()
  return store.createOrLoadRun({
    id: `fulfillment:${input.intakeId}`,
    objective: `Deliver the purchased ${input.productKey} homeowner package`,
    successCriteria: [
      { key: 'homeowner-deliverable', description: 'Evidence-backed homeowner report is published', required: true, evidenceTypes: ['published-deliverable'] },
      { key: 'customer-notified', description: 'Customer notification is recorded', required: true, evidenceTypes: ['notification-receipt'] },
    ],
    constraints: {
      intakeId: input.intakeId, productKey: input.productKey,
      workflowTemplateId: input.workflowTemplateId,
      propertyIntelligenceDepth: input.propertyIntelligenceDepth,
      professionalBoundary: 'No approval, stamp, seal, or certification without qualified human evidence.',
    },
    authorityPolicy: { deniedCapabilities: ['permit.filing.authorize'], professionalActionsRequireApproval: true },
    budget: { maxSteps: 30, tokenLimit: 200_000, costLimitCents: 5_000, timeLimitMs: 4 * 24 * 60 * 60 * 1000 },
  }, `stripe:${input.stripeSessionId}`, fulfillmentPlan(input.botTypes, { requireProfessionalReview: input.productKey === 'certified_estimate' }))
}
