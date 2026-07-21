import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export type MarketingAssetType = 'index' | 'plan' | 'stack' | 'campaign'

export interface MarketingLibraryIndex {
  version: string
  updatedAt: string
  description: string
  plans: { id: string; path: string; title: string }[]
  stacks: { id: string; path: string; title: string }[]
  campaigns: { id: string; path: string; title: string; regenerate?: string }[]
}

function marketingRoot(): string {
  return join(process.cwd(), '..', '..', 'marketing')
}

function readJson<T>(relativePath: string): T | null {
  const full = join(marketingRoot(), relativePath.replace(/^marketing\//, ''))
  if (!existsSync(full)) return null
  try {
    return JSON.parse(readFileSync(full, 'utf8')) as T
  } catch {
    return null
  }
}

export function loadMarketingIndex(): MarketingLibraryIndex | null {
  return readJson<MarketingLibraryIndex>('index.json')
}

export function loadMarketingAsset(relativePath: string): unknown | null {
  return readJson(relativePath)
}

export function loadFullLibrary(): {
  index: MarketingLibraryIndex | null
  plans: Record<string, unknown>
  stacks: Record<string, unknown>
  campaigns: Record<string, unknown>
} {
  const index = loadMarketingIndex()
  const plans: Record<string, unknown> = {}
  const stacks: Record<string, unknown> = {}
  const campaigns: Record<string, unknown> = {}

  for (const p of index?.plans ?? []) {
    const data = loadMarketingAsset(p.path)
    if (data) plans[p.id] = data
  }
  for (const s of index?.stacks ?? []) {
    const data = loadMarketingAsset(s.path)
    if (data) stacks[s.id] = data
  }
  for (const c of index?.campaigns ?? []) {
    const data = loadMarketingAsset(c.path)
    if (data) campaigns[c.id] = data
  }

  return { index, plans, stacks, campaigns }
}
