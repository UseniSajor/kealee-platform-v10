import {
  DEFAULT_V30_PRICING_FORMULA,
  resolveV30PricingFormula,
  type V30PricingFormulaConfig,
} from '@kealee/kealee-agent-stack'

const API = () =>
  (process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

/** Load active v30 pricing formula from API (real-time; no redeploy). */
export async function fetchActiveV30PricingFormula(): Promise<V30PricingFormulaConfig> {
  const base = API()
  if (!base) return { ...DEFAULT_V30_PRICING_FORMULA }

  try {
    const res = await fetch(`${base}/v30/pricing/active`, { cache: 'no-store' })
    if (!res.ok) return { ...DEFAULT_V30_PRICING_FORMULA }
    const json = (await res.json()) as { formula?: unknown }
    return resolveV30PricingFormula(json.formula as Parameters<typeof resolveV30PricingFormula>[0])
  } catch {
    return { ...DEFAULT_V30_PRICING_FORMULA }
  }
}
