/**
 * services/keabots/registry.ts
 * Service-layer bot registry — maps bot names to metadata
 */

import type { BotStage } from './types.js';
import { STAGE_TO_BOT } from './types.js';

export interface BotMeta {
  name: string;
  displayName: string;
  description: string;
  stage: BotStage;
  domain: string;
  version: string;
}

export const BOT_REGISTRY: BotMeta[] = [
  { name: 'keabot-owner', displayName: 'Owner Bot', description: 'Project ownership & intake', stage: 'intake', domain: 'owner', version: '1.0.0' },
  { name: 'keabot-design', displayName: 'Design Bot', description: 'AI design & concept generation', stage: 'design', domain: 'design', version: '1.0.0' },
  { name: 'keabot-permit', displayName: 'Permit Bot', description: 'Permit research & filing', stage: 'permit', domain: 'permit', version: '1.0.0' },
  { name: 'keabot-estimate', displayName: 'Estimate Bot', description: 'Cost estimation with CTC', stage: 'estimate', domain: 'estimate', version: '1.0.0' },
  { name: 'keabot-contractor-match', displayName: 'Contractor Match Bot', description: 'Contractor matching & scoring', stage: 'contractor', domain: 'contractor', version: '1.0.0' },
  { name: 'keabot-feasibility', displayName: 'Feasibility Bot', description: 'Project feasibility analysis', stage: 'feasibility', domain: 'feasibility', version: '1.0.0' },
  { name: 'keabot-payments', displayName: 'Payments Bot', description: 'Payment processing & escrow', stage: 'payments', domain: 'payments', version: '1.0.0' },
  { name: 'keabot-construction', displayName: 'Construction Bot', description: 'Construction execution tracking', stage: 'execution', domain: 'construction', version: '1.0.0' },
  { name: 'keabot-project-monitor', displayName: 'Project Monitor Bot', description: 'Real-time project tracking', stage: 'monitoring', domain: 'monitoring', version: '1.0.0' },
  { name: 'keabot-support', displayName: 'Support Bot', description: 'Customer support automation', stage: 'support', domain: 'support', version: '1.0.0' },
  { name: 'keabot-marketing', displayName: 'Marketing Bot', description: 'Marketing launch automation', stage: 'marketing', domain: 'marketing', version: '1.0.0' },
  { name: 'keabot-finance', displayName: 'Finance Bot', description: 'Financial tracking & reporting', stage: 'monitoring', domain: 'finance', version: '1.0.0' },
  { name: 'keabot-gc', displayName: 'GC Bot', description: 'General contractor management', stage: 'contractor', domain: 'gc', version: '1.0.0' },
  { name: 'keabot-land', displayName: 'Land Bot', description: 'Land analysis & due diligence', stage: 'intake', domain: 'land', version: '1.0.0' },
  { name: 'keabot-marketplace', displayName: 'Marketplace Bot', description: 'Marketplace operations', stage: 'contractor', domain: 'marketplace', version: '1.0.0' },
  { name: 'keabot-operations', displayName: 'Ops Bot', description: 'Operations management', stage: 'monitoring', domain: 'operations', version: '1.0.0' },
  { name: 'keabot-command', displayName: 'Command Bot', description: 'Command center orchestration', stage: 'monitoring', domain: 'command', version: '1.0.0' },
  { name: 'keabot-developer', displayName: 'Developer Bot', description: 'Developer portal', stage: 'intake', domain: 'developer', version: '1.0.0' },
];

export function getBotMeta(name: string): BotMeta | undefined {
  return BOT_REGISTRY.find(b => b.name === name);
}

export function getBotsByDomain(domain: string): BotMeta[] {
  return BOT_REGISTRY.filter(b => b.domain === domain);
}
