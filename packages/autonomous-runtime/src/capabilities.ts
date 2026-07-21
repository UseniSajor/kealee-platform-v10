import type { CapabilityDefinition, ExecutionPlan } from './types'

const objectSchema = { type: 'object', additionalProperties: true }
const base = (id: string, overrides: Partial<CapabilityDefinition> = {}): CapabilityDefinition => ({
  id, inputSchema: objectSchema, outputSchema: objectSchema, allowedTools: [], authorityLevel: 'prepare',
  requiredEvidence: ['execution-result'], retryPolicy: { maxAttempts: 3, backoffMs: 5_000 }, approvalPolicy: 'none',
  dataSensitivity: 'customer', modelPolicy: { providerNeutral: true }, tokenLimit: 40_000,
  costLimitCents: 500, timeoutMs: 10 * 60_000,
  professionalLimitations: ['Preliminary AI-assisted output; a qualified human must supply any stamp, seal, certification, or approval.'],
  ...overrides,
})

export const KEALEE_CAPABILITIES: Record<string, CapabilityDefinition> = Object.fromEntries([
  base('intake.validate', { authorityLevel: 'read', requiredEvidence: ['validated-intake'] }),
  base('design.concept.generate', { allowedTools: ['v30.design'], requiredEvidence: ['design-concept'], modelPolicy: { primary: 'openai', fallbacks: ['anthropic'], providerNeutral: true } }),
  base('estimate.plan.generate', { allowedTools: ['v30.estimate', 'cost-database'], requiredEvidence: ['estimate-plan'], modelPolicy: { primary: 'openai', fallbacks: ['anthropic'], providerNeutral: true }, professionalLimitations: ['Planning range only unless a qualified estimator explicitly reviews and seals the estimate.'] }),
  base('zoning.property.analyze', { allowedTools: ['v30.zoning', 'jurisdiction-sources'], requiredEvidence: ['zoning-sources'], modelPolicy: { primary: 'openai', fallbacks: ['anthropic'], providerNeutral: true } }),
  base('permit.roadmap.generate', { allowedTools: ['v30.permit', 'jurisdiction-sources'], requiredEvidence: ['permit-roadmap'], modelPolicy: { primary: 'openai', fallbacks: ['anthropic'], providerNeutral: true }, professionalLimitations: ['Roadmap is not permit approval or authorization to build.'] }),
  base('floorplan.concept.generate', { allowedTools: ['v30.floorplan'], requiredEvidence: ['concept-floorplan'] }),
  base('contractor.match', { allowedTools: ['v30.contractor', 'marketplace'], requiredEvidence: ['contractor-match'] }),
  base('project.plan.generate', { allowedTools: ['v30.project'], requiredEvidence: ['project-plan'] }),
  base('sales.support.prepare', { allowedTools: ['v30.sales'], dataSensitivity: 'internal', requiredEvidence: ['sales-handoff'] }),
  base('deliverable.assemble', { allowedTools: ['document-generator'], requiredEvidence: ['deliverable'] }),
  base('deliverable.publish', { allowedTools: ['storage', 'owner-portal'], authorityLevel: 'execute', requiredEvidence: ['published-deliverable'] }),
  base('customer.notify', { allowedTools: ['email'], authorityLevel: 'execute', requiredEvidence: ['notification-receipt'] }),
  base('permit.filing.authorize', { authorityLevel: 'professional', approvalPolicy: 'professional', requiredEvidence: ['professional-authorization'], professionalLimitations: ['Requires an authorized human permit specialist; the runtime cannot approve or sign filings.'] }),
  base('professional.review', { authorityLevel: 'professional', approvalPolicy: 'professional', requiredEvidence: ['professional-review'] }),
].map(definition => [definition.id, definition]))

const BOT_CAPABILITIES: Record<string, string> = {
  design: 'design.concept.generate', estimate: 'estimate.plan.generate', zoning: 'zoning.property.analyze',
  permit: 'permit.roadmap.generate', floorplan: 'floorplan.concept.generate', contractor: 'contractor.match',
  project: 'project.plan.generate', sales: 'sales.support.prepare',
}

export function fulfillmentPlan(botTypes: string[]): ExecutionPlan {
  const executionSteps = [...new Set(botTypes.map(type => BOT_CAPABILITIES[type]).filter(Boolean))]
  return {
    version: 1,
    steps: [
      { key: 'intake', title: 'Validate customer requirements', capability: 'intake.validate', dependsOn: [], completionCriteria: [{ key: 'validated', description: 'Requirements and uploads persisted', required: true, evidenceTypes: ['validated-intake'] }] },
      ...executionSteps.map((capability, index) => ({ key: `work_${index + 1}`, title: KEALEE_CAPABILITIES[capability].id, capability, dependsOn: ['intake'], maxAttempts: KEALEE_CAPABILITIES[capability].retryPolicy.maxAttempts })),
      { key: 'assemble', title: 'Assemble homeowner report', capability: 'deliverable.assemble', dependsOn: executionSteps.map((_, index) => `work_${index + 1}`), completionCriteria: [{ key: 'deliverable', description: 'Homeowner report assembled', required: true, evidenceTypes: ['deliverable'] }] },
      { key: 'publish', title: 'Publish homeowner report', capability: 'deliverable.publish', dependsOn: ['assemble'] },
      { key: 'notify', title: 'Notify customer', capability: 'customer.notify', dependsOn: ['publish'] },
    ],
  }
}

