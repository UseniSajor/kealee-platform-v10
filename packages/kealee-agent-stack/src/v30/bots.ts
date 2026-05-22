import type { V30BotType } from './types'

export interface V30BotDefinition {
  type: V30BotType
  displayName: string
  description: string
  defaultModel: string
  timeoutSeconds: number
  parallelGroup: 'pre-payment' | 'post-payment-core' | 'post-payment-aux'
  estimatedCostUsd: number
}

/** KeaBot v3.0 registry — 10 post-payment bots + IntakeBot. */
export const V30_BOT_REGISTRY: Record<V30BotType, V30BotDefinition> = {
  intake: {
    type: 'intake',
    displayName: 'IntakeBot',
    description: 'Analyzes 9-question intake before payment; dynamic pricing',
    defaultModel: 'claude-sonnet-4-5',
    timeoutSeconds: 45,
    parallelGroup: 'pre-payment',
    estimatedCostUsd: 0.05,
  },
  design: {
    type: 'design',
    displayName: 'DesignBot',
    description: 'Three design concepts with materials and image prompts',
    defaultModel: 'claude-opus-4-1',
    timeoutSeconds: 90,
    parallelGroup: 'post-payment-core',
    estimatedCostUsd: 0.15,
  },
  estimate: {
    type: 'estimate',
    displayName: 'EstimateBot',
    description: 'Preliminary or detailed cost breakdown by trade',
    defaultModel: 'claude-sonnet-4-5',
    timeoutSeconds: 60,
    parallelGroup: 'post-payment-core',
    estimatedCostUsd: 0.05,
  },
  zoning: {
    type: 'zoning',
    displayName: 'ZoningBot',
    description: 'Jurisdiction-specific permit requirements (DC / MD / VA)',
    defaultModel: 'claude-sonnet-4-5',
    timeoutSeconds: 30,
    parallelGroup: 'post-payment-core',
    estimatedCostUsd: 0.03,
  },
  floorplan: {
    type: 'floorplan',
    displayName: 'FloorplanBot',
    description: '2D floor plan coordinate data from design concept',
    defaultModel: 'claude-sonnet-4-5',
    timeoutSeconds: 25,
    parallelGroup: 'post-payment-core',
    estimatedCostUsd: 0.02,
  },
  permit: {
    type: 'permit',
    displayName: 'PermitBot',
    description: 'Permit-ready plan specifications',
    defaultModel: 'claude-sonnet-4-5',
    timeoutSeconds: 45,
    parallelGroup: 'post-payment-core',
    estimatedCostUsd: 0.04,
  },
  video: {
    type: 'video',
    displayName: 'VideoBot',
    description: 'Architectural walkthrough video prompts (Sora/Veo/Kling)',
    defaultModel: 'claude-sonnet-4-5',
    timeoutSeconds: 20,
    parallelGroup: 'post-payment-aux',
    estimatedCostUsd: 0.01,
  },
  contractor: {
    type: 'contractor',
    displayName: 'ContractorBot',
    description: 'Top contractor recommendations for scope and location',
    defaultModel: 'claude-sonnet-4-5',
    timeoutSeconds: 20,
    parallelGroup: 'post-payment-aux',
    estimatedCostUsd: 0.02,
  },
  sales: {
    type: 'sales',
    displayName: 'SalesBot',
    description: 'Objection handling with data-backed responses',
    defaultModel: 'claude-sonnet-4-5',
    timeoutSeconds: 15,
    parallelGroup: 'post-payment-aux',
    estimatedCostUsd: 0.01,
  },
  support: {
    type: 'support',
    displayName: 'SupportBot',
    description: 'Customer Q&A and next-step guidance',
    defaultModel: 'claude-sonnet-4-5',
    timeoutSeconds: 15,
    parallelGroup: 'post-payment-aux',
    estimatedCostUsd: 0.01,
  },
  project: {
    type: 'project',
    displayName: 'ProjectBot',
    description: 'Workspace workflow updates and stage transitions',
    defaultModel: 'claude-sonnet-4-5',
    timeoutSeconds: 15,
    parallelGroup: 'post-payment-aux',
    estimatedCostUsd: 0.01,
  },
}

/** Bots that run in parallel after payment (excludes intake). */
export const V30_PARALLEL_BOT_TYPES: V30BotType[] = [
  'design',
  'estimate',
  'zoning',
  'floorplan',
  'permit',
  'video',
  'contractor',
  'sales',
  'support',
  'project',
]

export function getV30Bot(type: V30BotType): V30BotDefinition {
  return V30_BOT_REGISTRY[type]
}
