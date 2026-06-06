import {
  COMMAND_BOT_SYSTEM_PROMPT,
  CONSTRUCTION_BOT_SYSTEM_PROMPT,
  DESIGN_BOT_SYSTEM_PROMPT,
  DEVELOPER_BOT_SYSTEM_PROMPT,
  FEASIBILITY_BOT_SYSTEM_PROMPT,
  FINANCE_BOT_SYSTEM_PROMPT,
  GC_BOT_SYSTEM_PROMPT,
  LAND_BOT_SYSTEM_PROMPT,
  MARKETING_BOT_SYSTEM_PROMPT,
  OPERATIONS_BOT_SYSTEM_PROMPT,
  OWNER_BOT_SYSTEM_PROMPT,
  PAYMENTS_BOT_SYSTEM_PROMPT,
} from '@kealee/agent-prompts'
import type { BotCostProfile, BotId, BotMigrationStatus } from './bots.types'

export interface BotCatalogEntry {
  id: BotId
  name: string
  description: string
  status: BotMigrationStatus
  costProfile: BotCostProfile
  requiresLLM: boolean
  systemPrompt: string
  dataModel?: string
  temporaryReason?: string
}

const marketingCopy = (id: BotId, name: string, description: string): BotCatalogEntry => ({
  id,
  name,
  description,
  status: 'READY',
  costProfile: 'low',
  requiresLLM: true,
  systemPrompt: MARKETING_BOT_SYSTEM_PROMPT,
})

export const MIGRATED_BOT_CATALOG: readonly BotCatalogEntry[] = [
  {
    id: 'owner-bot',
    name: 'OwnerBot',
    description: 'Owner-facing project guidance and next actions',
    status: 'PARTIAL',
    costProfile: 'medium',
    requiresLLM: true,
    systemPrompt: OWNER_BOT_SYSTEM_PROMPT,
    dataModel: 'project',
  },
  {
    id: 'gc-bot',
    name: 'GCBot',
    description: 'General contractor operations and project guidance',
    status: 'PARTIAL',
    costProfile: 'medium',
    requiresLLM: true,
    systemPrompt: GC_BOT_SYSTEM_PROMPT,
    dataModel: 'project',
  },
  {
    id: 'feasibility-bot',
    name: 'FeasibilityBot',
    description: 'Evaluates project feasibility from supplied and project data',
    status: 'PARTIAL',
    costProfile: 'medium',
    requiresLLM: true,
    systemPrompt: FEASIBILITY_BOT_SYSTEM_PROMPT,
    dataModel: 'project',
  },
  {
    id: 'command-bot',
    name: 'CommandBot',
    description: 'Routes command-center requests into actionable responses',
    status: 'PARTIAL',
    costProfile: 'medium',
    requiresLLM: true,
    systemPrompt: COMMAND_BOT_SYSTEM_PROMPT,
    dataModel: 'project',
  },
  {
    id: 'design-bot',
    name: 'DesignBot',
    description: 'Produces design guidance from project and intake context',
    status: 'PARTIAL',
    costProfile: 'high',
    requiresLLM: true,
    systemPrompt: DESIGN_BOT_SYSTEM_PROMPT,
    dataModel: 'project',
  },
  {
    id: 'finance-bot',
    name: 'FinanceBot',
    description: 'Summarizes project financial context and recommended actions',
    status: 'PARTIAL',
    costProfile: 'medium',
    requiresLLM: true,
    systemPrompt: FINANCE_BOT_SYSTEM_PROMPT,
    dataModel: 'project',
  },
  {
    id: 'developer-bot',
    name: 'DeveloperBot',
    description: 'Development project analysis and coordination guidance',
    status: 'PARTIAL',
    costProfile: 'medium',
    requiresLLM: true,
    systemPrompt: DEVELOPER_BOT_SYSTEM_PROMPT,
    dataModel: 'project',
  },
  {
    id: 'construction-bot',
    name: 'ConstructionBot',
    description: 'Construction execution analysis and field recommendations',
    status: 'PARTIAL',
    costProfile: 'medium',
    requiresLLM: true,
    systemPrompt: CONSTRUCTION_BOT_SYSTEM_PROMPT,
    dataModel: 'project',
  },
  {
    id: 'land-bot',
    name: 'LandBot',
    description: 'Land and parcel analysis',
    status: 'TEMPORARY',
    costProfile: 'medium',
    requiresLLM: true,
    systemPrompt: LAND_BOT_SYSTEM_PROMPT,
    temporaryReason: 'TODO: add canonical parcel/zoning API or Parcel Prisma model; currently uses caller-supplied context.',
  },
  {
    id: 'payments-bot',
    name: 'PaymentsBot',
    description: 'Payment and escrow workflow guidance',
    status: 'PARTIAL',
    costProfile: 'medium',
    requiresLLM: true,
    systemPrompt: PAYMENTS_BOT_SYSTEM_PROMPT,
    dataModel: 'project',
  },
  {
    id: 'operations-bot',
    name: 'OperationsBot',
    description: 'Operational workflow analysis and recommended actions',
    status: 'PARTIAL',
    costProfile: 'medium',
    requiresLLM: true,
    systemPrompt: OPERATIONS_BOT_SYSTEM_PROMPT,
    dataModel: 'project',
  },
  marketingCopy('pitch-bot', 'PitchBot', 'Creates concise project or product pitches'),
  marketingCopy('email-subject-bot', 'EmailSubjectBot', 'Creates email subject-line options'),
  marketingCopy('google-ad-bot', 'GoogleAdBot', 'Creates Google Ads copy variants'),
  marketingCopy('meta-ad-bot', 'MetaAdBot', 'Creates Meta Ads copy variants'),
  marketingCopy('day1-email-bot', 'Day1EmailBot', 'Creates day-one lifecycle email copy'),
  marketingCopy('day8-email-bot', 'Day8EmailBot', 'Creates day-eight lifecycle email copy'),
] as const
