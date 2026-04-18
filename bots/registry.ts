/**
 * bots/registry.ts
 *
 * Central registry for all KeaBots. Exports every bot class,
 * a BOT_REGISTRY map, createAllBots(), and getBotByName().
 */

export { KeaBotMarketing } from './keabot-marketing/src/bot.js';
export { KeaBotOwner } from './keabot-owner/src/bot.js';
export { KeaBotPermit } from './keabot-permit/src/bot.js';
export { KeaBotEstimate } from './keabot-estimate/src/bot.js';
export { KeaBotGC } from './keabot-gc/src/bot.js';
export { KeaBotConstruction } from './keabot-construction/src/bot.js';
export { KeaBotMarketplace } from './keabot-marketplace/src/bot.js';
export { KeaBotLand } from './keabot-land/src/bot.js';
export { KeaBotOperations } from './keabot-operations/src/bot.js';
export { KeaBotCommand } from './keabot-command/src/bot.js';
export { KeaBotFinance } from './keabot-finance/src/bot.js';
export { KeaBotPayments } from './keabot-payments/src/bot.js';
export { KeaBotFeasibility } from './keabot-feasibility/src/bot.js';
export { KeaBotDeveloper } from './keabot-developer/src/bot.js';
export { KeaBotDesign } from './keabot-design/src/bot.js';
export { KeaBotContractorMatch } from './keabot-contractor-match/src/bot.js';
export { KeaBotProjectMonitor } from './keabot-project-monitor/src/bot.js';
export { KeaBotSupport } from './keabot-support/src/bot.js';

import { KeaBotMarketing } from './keabot-marketing/src/bot.js';
import { KeaBotOwner } from './keabot-owner/src/bot.js';
import { KeaBotPermit } from './keabot-permit/src/bot.js';
import { KeaBotEstimate } from './keabot-estimate/src/bot.js';
import { KeaBotGC } from './keabot-gc/src/bot.js';
import { KeaBotConstruction } from './keabot-construction/src/bot.js';
import { KeaBotMarketplace } from './keabot-marketplace/src/bot.js';
import { KeaBotLand } from './keabot-land/src/bot.js';
import { KeaBotOperations } from './keabot-operations/src/bot.js';
import { KeaBotCommand } from './keabot-command/src/bot.js';
import { KeaBotFinance } from './keabot-finance/src/bot.js';
import { KeaBotPayments } from './keabot-payments/src/bot.js';
import { KeaBotFeasibility } from './keabot-feasibility/src/bot.js';
import { KeaBotDeveloper } from './keabot-developer/src/bot.js';
import { KeaBotDesign } from './keabot-design/src/bot.js';
import { KeaBotContractorMatch } from './keabot-contractor-match/src/bot.js';
import { KeaBotProjectMonitor } from './keabot-project-monitor/src/bot.js';
import { KeaBotSupport } from './keabot-support/src/bot.js';

/**
 * Maps bot name strings to their constructor classes.
 * Keys match the directory names (without the "keabot-" prefix stripped,
 * so callers can use the full slug e.g. "keabot-marketing").
 */
export const BOT_REGISTRY = new Map<string, new () => any>([
  ['keabot-marketing',         KeaBotMarketing],
  ['keabot-owner',             KeaBotOwner],
  ['keabot-permit',            KeaBotPermit],
  ['keabot-estimate',          KeaBotEstimate],
  ['keabot-gc',                KeaBotGC],
  ['keabot-construction',      KeaBotConstruction],
  ['keabot-marketplace',       KeaBotMarketplace],
  ['keabot-land',              KeaBotLand],
  ['keabot-operations',        KeaBotOperations],
  ['keabot-command',           KeaBotCommand],
  ['keabot-finance',           KeaBotFinance],
  ['keabot-payments',          KeaBotPayments],
  ['keabot-feasibility',       KeaBotFeasibility],
  ['keabot-developer',         KeaBotDeveloper],
  ['keabot-design',            KeaBotDesign],
  ['keabot-contractor-match',  KeaBotContractorMatch],
  ['keabot-project-monitor',   KeaBotProjectMonitor],
  ['keabot-support',           KeaBotSupport],
]);

/**
 * Instantiates every registered bot and returns them as an array.
 */
export function createAllBots(): any[] {
  return Array.from(BOT_REGISTRY.values()).map((BotClass) => new BotClass());
}

/**
 * Looks up a bot constructor by name and returns a new instance,
 * or null if no bot with that name is registered.
 */
export function getBotByName(name: string): any | null {
  const BotClass = BOT_REGISTRY.get(name);
  if (!BotClass) return null;
  return new BotClass();
}
