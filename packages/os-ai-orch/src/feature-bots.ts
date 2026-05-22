import type { V30BotType } from '@kealee/kealee-agent-stack'

/** Map v30 package feature labels → bot types (zip2 os-ai-orch). */
export function botTypesForPackageFeatures(features: string[]): V30BotType[] {
  const normalized = features.map(f => f.toLowerCase())
  const types = new Set<V30BotType>()

  if (normalized.some(f => f.includes('design'))) types.add('design')
  if (normalized.some(f => f.includes('floorplan'))) types.add('floorplan')
  if (normalized.some(f => f.includes('estimate'))) types.add('estimate')
  if (normalized.some(f => f.includes('permit'))) {
    types.add('zoning')
    types.add('permit')
  }
  if (normalized.some(f => f.includes('video'))) types.add('video')
  if (normalized.some(f => f.includes('support'))) types.add('support')

  types.add('contractor')
  types.add('project')

  return [...types]
}
