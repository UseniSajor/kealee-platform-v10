import { V30_PARALLEL_BOT_TYPES, type V30BotType } from '@kealee/kealee-agent-stack'

/**
 * KeaBot v3.0 — 9 parallel post-payment bots (DesignBot is canonical v30 executor only).
 * SupportBot is not run here (avoid duplicate with ProjectBot).
 */
export function botTypesForPackageFeatures(_features: string[]): V30BotType[] {
  return [...V30_PARALLEL_BOT_TYPES]
}
