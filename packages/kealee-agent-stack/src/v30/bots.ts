import type { V30BotType } from './types'
import { V30_WIRED_BOT_CONFIG } from './wired-bot-config'

export interface V30BotDefinition {
  type: V30BotType
  displayName: string
  description: string
  defaultModel: string
  timeoutSeconds: number
  parallelGroup: 'pre-payment' | 'post-payment-core' | 'post-payment-aux'
  estimatedCostUsd: number
}

/** Centralized compatibility resolver for legacy OpenAI-backed v3.0 jobs. */
export function resolveV30OpenAIModel(): string {
  return process.env.KEALEE_OPENAI_PRIMARY_MODEL ?? 'gpt-5.6-sol'
}

/** KeaBot v3.0 registry — 11 post-payment parallel bots + IntakeBot. */
export const V30_BOT_REGISTRY: Record<V30BotType, V30BotDefinition> = {
  intake: {
    type: 'intake',
    displayName: 'IntakeBot',
    description: 'Analyzes 9-question intake before payment; dynamic pricing',
    defaultModel: 'claude-sonnet-4-6',
    timeoutSeconds: V30_WIRED_BOT_CONFIG.intake.timeoutSeconds,
    parallelGroup: 'pre-payment',
    estimatedCostUsd: 0.05,
  },
  design: {
    type: 'design',
    displayName: 'DesignBot',
    description: 'Three design concepts with materials and image prompts',
    defaultModel: 'claude-opus-4-6',
    timeoutSeconds: V30_WIRED_BOT_CONFIG.design.timeoutSeconds,
    parallelGroup: 'post-payment-core',
    estimatedCostUsd: 0.15,
  },
  estimate: {
    type: 'estimate',
    displayName: 'EstimateBot',
    description: 'Preliminary or detailed cost breakdown by trade',
    defaultModel: 'claude-sonnet-4-6',
    timeoutSeconds: V30_WIRED_BOT_CONFIG.estimate.timeoutSeconds,
    parallelGroup: 'post-payment-core',
    estimatedCostUsd: 0.05,
  },
  zoning: {
    type: 'zoning',
    displayName: 'ZoningBot',
    description: 'Jurisdiction-specific permit requirements (DC / MD / VA)',
    defaultModel: 'claude-sonnet-4-6',
    timeoutSeconds: V30_WIRED_BOT_CONFIG.zoning.timeoutSeconds,
    parallelGroup: 'post-payment-core',
    estimatedCostUsd: 0.03,
  },
  floorplan: {
    type: 'floorplan',
    displayName: 'FloorplanBot',
    description: '2D floor plan coordinate data from design concept',
    defaultModel: 'claude-sonnet-4-6',
    timeoutSeconds: V30_WIRED_BOT_CONFIG.floorplan.timeoutSeconds,
    parallelGroup: 'post-payment-core',
    estimatedCostUsd: 0.02,
  },
  permit: {
    type: 'permit',
    displayName: 'PermitBot',
    description: 'Permit-ready plan specifications',
    defaultModel: 'claude-sonnet-4-6',
    timeoutSeconds: V30_WIRED_BOT_CONFIG.permit.timeoutSeconds,
    parallelGroup: 'post-payment-core',
    estimatedCostUsd: 0.04,
  },
  video: {
    type: 'video',
    displayName: 'VideoBot',
    description: 'Architectural walkthrough video prompts (Sora/Veo/Kling)',
    defaultModel: 'claude-sonnet-4-6',
    timeoutSeconds: V30_WIRED_BOT_CONFIG.video.timeoutSeconds,
    parallelGroup: 'post-payment-aux',
    estimatedCostUsd: 0.01,
  },
  contractor: {
    type: 'contractor',
    displayName: 'ContractorBot',
    description: 'Top contractor recommendations for scope and location',
    defaultModel: 'claude-sonnet-4-6',
    timeoutSeconds: V30_WIRED_BOT_CONFIG.contractor.timeoutSeconds,
    parallelGroup: 'post-payment-aux',
    estimatedCostUsd: 0.02,
  },
  sales: {
    type: 'sales',
    displayName: 'SalesBot',
    description: 'Objection handling with data-backed responses',
    defaultModel: 'claude-sonnet-4-6',
    timeoutSeconds: V30_WIRED_BOT_CONFIG.sales.timeoutSeconds,
    parallelGroup: 'post-payment-aux',
    estimatedCostUsd: 0.01,
  },
  marketing: {
    type: 'marketing',
    displayName: 'MarketingBot',
    description:
      'Platform growth: traffic, lead capture, and conversion paths for concept → estimate → permit → build (ops/Command Center — not a customer deliverable)',
    defaultModel: 'claude-sonnet-4-6',
    timeoutSeconds: V30_WIRED_BOT_CONFIG.marketing.timeoutSeconds,
    parallelGroup: 'post-payment-aux',
    estimatedCostUsd: 0.03,
  },
  support: {
    type: 'support',
    displayName: 'SupportBot',
    description: 'Customer Q&A and next-step guidance',
    defaultModel: 'claude-sonnet-4-6',
    timeoutSeconds: V30_WIRED_BOT_CONFIG.support.timeoutSeconds,
    parallelGroup: 'post-payment-aux',
    estimatedCostUsd: 0.01,
  },
  project: {
    type: 'project',
    displayName: 'ProjectBot',
    description: 'Workspace workflow updates and stage transitions',
    defaultModel: 'claude-sonnet-4-6',
    timeoutSeconds: V30_WIRED_BOT_CONFIG.project.timeoutSeconds,
    parallelGroup: 'post-payment-aux',
    estimatedCostUsd: 0.01,
  },
}

/**
 * Post-payment parallel bots (spec: 9 + DesignBot = wired set).
 * SupportBot is registry-only — customer Q&A is covered by ProjectBot (no duplicate run).
 */
export const V30_PARALLEL_BOT_TYPES: V30BotType[] = [
  'design',
  'estimate',
  'zoning',
  'floorplan',
  'permit',
  'video',
  'contractor',
  'sales',
  'project',
]

/** Ops-only bots — not run on paid customer intakes (use Command Center / API / crons). */
export const V30_OPS_BOT_TYPES: V30BotType[] = ['marketing', 'support']

/** Bots that must not run a second LLM alongside v30 (use v30 path only). */
export const V30_EXTERNAL_DESIGN_BOT_PATHS = [
  'services/api/src/modules/bots/bots.chain.ts#runDesignBot',
  'services/api/src/services/design-bot-service.ts#runDesignBot',
  'apps/web-main/app/api/concept/generate/route.ts',
] as const

export function getV30Bot(type: V30BotType): V30BotDefinition {
  return V30_BOT_REGISTRY[type]
}
