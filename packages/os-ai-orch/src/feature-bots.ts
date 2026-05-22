import { V30_PARALLEL_BOT_TYPES, type V30BotType } from '@kealee/kealee-agent-stack'

/**
 * KeaBot v3.0 — run all 10 post-payment bots in parallel (Kealee Platform Agents spec).
 * Package features still control billing; generation runs the full bot suite.
 */
export function botTypesForPackageFeatures(_features: string[]): V30BotType[] {
  return [...V30_PARALLEL_BOT_TYPES]
}
