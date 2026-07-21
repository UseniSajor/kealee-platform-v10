import type { V30BotType } from './types'

/** Source spec — Kealee Platform Agents/KEALEE-v30-ALL-10-BOTS-COMPLETE-WIRED.md */
export const V30_WIRED_SPEC_PATH =
  'Kealee Platform Agents/KEALEE-v30-ALL-10-BOTS-COMPLETE-WIRED.md'

/** Timeouts (seconds) and cache flags from wired Orgo integration block. */
export const V30_WIRED_BOT_CONFIG: Record<
  V30BotType,
  { timeoutSeconds: number; cacheEphemeral: boolean; maxTokens: number }
> = {
  intake: { timeoutSeconds: 30, cacheEphemeral: true, maxTokens: 4000 },
  design: { timeoutSeconds: 60, cacheEphemeral: true, maxTokens: 8192 },
  estimate: { timeoutSeconds: 45, cacheEphemeral: true, maxTokens: 6144 },
  zoning: { timeoutSeconds: 30, cacheEphemeral: true, maxTokens: 5120 },
  floorplan: { timeoutSeconds: 20, cacheEphemeral: false, maxTokens: 3072 },
  permit: { timeoutSeconds: 40, cacheEphemeral: true, maxTokens: 8192 },
  video: { timeoutSeconds: 15, cacheEphemeral: false, maxTokens: 2048 },
  contractor: { timeoutSeconds: 20, cacheEphemeral: true, maxTokens: 2048 },
  sales: { timeoutSeconds: 10, cacheEphemeral: false, maxTokens: 2048 },
  marketing: { timeoutSeconds: 25, cacheEphemeral: true, maxTokens: 4096 },
  support: { timeoutSeconds: 15, cacheEphemeral: false, maxTokens: 2048 },
  project: { timeoutSeconds: 5, cacheEphemeral: false, maxTokens: 2048 },
}

export function maxTokensForWiredBot(botType: V30BotType): number {
  return V30_WIRED_BOT_CONFIG[botType].maxTokens
}

export function useEphemeralCacheForBot(botType: V30BotType): boolean {
  return V30_WIRED_BOT_CONFIG[botType].cacheEphemeral
}
