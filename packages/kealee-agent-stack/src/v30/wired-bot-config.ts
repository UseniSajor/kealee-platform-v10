import type { V30BotType } from './types'

/** Source spec — Kealee Platform Agents/KEALEE-v30-ALL-10-BOTS-COMPLETE-WIRED.md */
export const V30_WIRED_SPEC_PATH =
  'Kealee Platform Agents/KEALEE-v30-ALL-10-BOTS-COMPLETE-WIRED.md'

/** Timeouts (seconds) and cache flags from wired Orgo integration block. */
export const V30_WIRED_BOT_CONFIG: Record<
  V30BotType,
  { timeoutSeconds: number; cacheEphemeral: boolean; maxTokens: number }
> = {
  // maxTokens must cover THINKING PLUS the JSON body. These bots run on
  // claude-opus-5 / claude-sonnet-5, where thinking is on by default and its
  // tokens are drawn from this same budget. The original 2048-8192 values were
  // sized for the visible JSON alone, so reasoning consumed the allowance and
  // every large response was cut off mid-string — surfacing as
  // "<Bot> JSON parse failed" rather than as the truncation it was.
  //
  // Measured on real orders before the raise: floorplan 10702 tokens against a
  // 3072 cap, video 8897 against 2048, contractor 4729 against 2048.
  intake: { timeoutSeconds: 30, cacheEphemeral: true, maxTokens: 16000 },
  design: { timeoutSeconds: 60, cacheEphemeral: true, maxTokens: 32000 },
  estimate: { timeoutSeconds: 45, cacheEphemeral: true, maxTokens: 16000 },
  zoning: { timeoutSeconds: 30, cacheEphemeral: true, maxTokens: 16000 },
  floorplan: { timeoutSeconds: 20, cacheEphemeral: false, maxTokens: 32000 },
  permit: { timeoutSeconds: 40, cacheEphemeral: true, maxTokens: 16000 },
  video: { timeoutSeconds: 15, cacheEphemeral: false, maxTokens: 16000 },
  contractor: { timeoutSeconds: 20, cacheEphemeral: true, maxTokens: 16000 },
  sales: { timeoutSeconds: 10, cacheEphemeral: false, maxTokens: 16000 },
  marketing: { timeoutSeconds: 25, cacheEphemeral: true, maxTokens: 16000 },
  support: { timeoutSeconds: 15, cacheEphemeral: false, maxTokens: 16000 },
  project: { timeoutSeconds: 5, cacheEphemeral: false, maxTokens: 16000 },
}

export function maxTokensForWiredBot(botType: V30BotType): number {
  return V30_WIRED_BOT_CONFIG[botType].maxTokens
}

export function useEphemeralCacheForBot(botType: V30BotType): boolean {
  return V30_WIRED_BOT_CONFIG[botType].cacheEphemeral
}
