import { SAMPLE_PARCELS } from '../fixtures/sample-parcels.js'
import { KEALEE_PRODUCTS, KEALEE_PRODUCT_LABELS } from '../constants/products.js'

export interface Phase6ConnectorInput {
  parcelId?: string
  address?: string
  jurisdiction?: string
}

export interface Phase6DataBundle {
  parcelData?: Record<string, unknown>
  permitData?: Record<string, unknown>[]
  gisData?: Record<string, unknown>
  censusMarketData?: Record<string, unknown>
  crmHistory?: Record<string, unknown>[]
  campaignHistory?: Record<string, unknown>[]
  serviceCatalog?: Record<string, unknown>[]
  complianceFlags: string[]
  dataSources: string[]
  dataQualityScore: number
}

function matchSample(input: Phase6ConnectorInput) {
  if (!input.address && !input.parcelId) return undefined
  return SAMPLE_PARCELS.find(
    (p) =>
      p.parcelId === input.parcelId ||
      (input.address && p.address.toLowerCase().includes(input.address.split(',')[0].toLowerCase())),
  )
}

/** Phase 6 — GIS, permit, market connectors (env URLs + sample fallback) */
export async function fetchPhase6DataBundle(input: Phase6ConnectorInput): Promise<Phase6DataBundle> {
  const sources: string[] = []
  let quality = 0.45
  const sample = matchSample(input)

  const gisUrl = process.env.INTELLIGENCE_GIS_API_URL
  const permitUrl = process.env.INTELLIGENCE_PERMIT_API_URL
  const marketUrl = process.env.INTELLIGENCE_MARKET_API_URL

  let gisData: Record<string, unknown> | undefined
  let permitData: Record<string, unknown>[] = []
  let censusMarketData: Record<string, unknown> | undefined

  if (sample) {
    gisData = {
      parcelId: sample.parcelId,
      lotSize: sample.lotSize,
      buildingSize: sample.buildingSize,
      zoning: 'zoning' in sample ? sample.zoning : undefined,
      source: 'sample_parcel',
    }
    permitData =
      'permitHistory' in sample ? [...sample.permitHistory] : []
    censusMarketData = { jurisdiction: sample.jurisdiction, market: 'DMV' }
    sources.push('sample_parcel', 'dmv_market_context')
    quality = 0.78
  }

  if (gisUrl && input.address) {
    try {
      const res = await fetch(`${gisUrl}?address=${encodeURIComponent(input.address)}`, {
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) {
        gisData = { ...(gisData ?? {}), ...(await res.json() as Record<string, unknown>) }
        sources.push('gis_api')
        quality = Math.min(1, quality + 0.15)
      }
    } catch {
      sources.push('gis_api_unavailable')
    }
  }

  if (permitUrl && (input.parcelId || input.address)) {
    try {
      const q = input.parcelId ?? input.address ?? ''
      const res = await fetch(`${permitUrl}?q=${encodeURIComponent(q)}`, {
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) {
        const data = await res.json()
        permitData = Array.isArray(data) ? data : [data]
        sources.push('permit_api')
        quality = Math.min(1, quality + 0.12)
      }
    } catch {
      sources.push('permit_api_unavailable')
    }
  }

  if (marketUrl && input.jurisdiction) {
    try {
      const res = await fetch(`${marketUrl}?jurisdiction=${encodeURIComponent(input.jurisdiction)}`, {
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) {
        censusMarketData = { ...(censusMarketData ?? {}), ...(await res.json() as Record<string, unknown>) }
        sources.push('market_api')
        quality = Math.min(1, quality + 0.1)
      }
    } catch {
      sources.push('market_api_unavailable')
    }
  }

  return {
    parcelData: sample
      ? { parcelId: sample.parcelId, address: sample.address, propertyType: sample.propertyType }
      : input.address
        ? { address: input.address }
        : undefined,
    permitData,
    gisData,
    censusMarketData,
    crmHistory: [],
    campaignHistory: [],
    serviceCatalog: KEALEE_PRODUCTS.map((p) => ({ id: p, label: KEALEE_PRODUCT_LABELS[p] })),
    complianceFlags: [],
    dataSources: sources.length ? sources : ['fallback'],
    dataQualityScore: quality,
  }
}
