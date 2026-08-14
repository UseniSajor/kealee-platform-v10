import { clawWorkerCapability, existingBotCapability } from './adapters'
import type { CapabilityExecutor } from './types'

export interface KealeeCapabilityDependencies {
  executeV30: (botType: string, payload: Record<string, unknown>) => Promise<{ output: Record<string, unknown>; evidence?: any[]; tokensUsed?: number; costCents?: number }>
  enqueueClaw: (worker: string, job: { idempotencyKey: string; capability: string; payload: Record<string, unknown> }) => Promise<{ jobId: string; accepted: boolean }>
  requestProfessionalReview: (payload: Record<string, unknown>) => Promise<{ requestId: string }>
}

const V30_BY_CAPABILITY: Record<string, string> = {
  'design.concept.generate': 'design', 'estimate.plan.generate': 'estimate',
  'zoning.property.analyze': 'zoning', 'permit.roadmap.generate': 'permit',
  'floorplan.concept.generate': 'floorplan', 'contractor.match': 'contractor',
  'project.plan.generate': 'project', 'sales.support.prepare': 'sales',
}

/** Compatibility adapters: legacy V30/Claw/human systems remain the executors. */
export function registerKealeeCapabilities(deps: KealeeCapabilityDependencies): Record<string, CapabilityExecutor> {
  const capabilities: Record<string, CapabilityExecutor> = {}
  for (const [capability, botType] of Object.entries(V30_BY_CAPABILITY)) {
    capabilities[capability] = existingBotCapability({ execute: async input => deps.executeV30(botType, input.payload) })
  }
  const claws: Record<string, string> = {
    'deliverable.assemble': 'docs-communication.doc-generator',
    'deliverable.publish': 'docs-communication.comms-hub',
    'customer.notify': 'docs-communication.kealee-messenger',
  }
  for (const [capability, worker] of Object.entries(claws)) {
    capabilities[capability] = clawWorkerCapability({ enqueue: job => deps.enqueueClaw(worker, job) })
  }
  capabilities['professional.review'] = async context => {
    const request = await deps.requestProfessionalReview({ ...context.step.input, runId: context.runId })
    return { status: 'awaiting_approval', output: { professionalReviewRequestId: request.requestId } }
  }
  capabilities['permit.filing.authorize'] = capabilities['professional.review']
  capabilities['intake.validate'] = async () => ({ status: 'complete', evidence: [{ type: 'validated-intake' }] })
  return capabilities
}

