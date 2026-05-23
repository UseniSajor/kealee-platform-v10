import { V30_PARALLEL_BOT_TYPES, type V30BotType } from '@kealee/kealee-agent-stack'

/**
 * KeaBot v3.0 — 9 parallel post-payment bots (DesignBot is canonical v30 executor only).
 * SupportBot is not run here (avoid duplicate with ProjectBot).
 */
/** Always run core post-payment bots; gate optional bots on package features (spec-aligned). */
export function botTypesForPackageFeatures(features: string[]): V30BotType[] {
  const normalized = new Set(
    features.map(f => f.toLowerCase().replace(/\s+/g, '')),
  )
  const core: V30BotType[] = ['design', 'estimate', 'zoning', 'contractor', 'sales', 'project']
  const optional: V30BotType[] = ['floorplan', 'permit', 'video', 'marketing']
  const out = new Set<V30BotType>(core)
  for (const bot of optional) {
    const key =
      bot === 'permit'
        ? 'permits'
        : bot === 'video'
          ? 'videos'
          : bot
    if (normalized.has(key) || normalized.has(bot)) out.add(bot)
  }
  // Premium+ and explicit Marketing feature activate MarketingBot
  if (normalized.has('marketing') || normalized.has('cadexport')) {
    out.add('marketing')
  }
  return V30_PARALLEL_BOT_TYPES.filter(t => out.has(t))
}
