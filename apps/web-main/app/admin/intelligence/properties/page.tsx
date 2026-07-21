'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOpsAuth, fetchIntelligenceApi } from '@/lib/admin/use-ops-auth'

interface PropertyRow {
  id: string
  address: string
  jurisdiction: string | null
  propertyType: string | null
  ownershipType: string | null
  dataQualityScore: number
  recommendedProducts: string[]
  opportunityScores: Array<{
    totalOpportunityScore: number
    recommendedPriority: string
    estimatedProjectValue: unknown
    confidenceScore: number
  }>
  campaignRecommendations: Array<{
    recommendedCampaign: string
    recommendedChannel: string
    salesPriority: string | null
  }>
}

export default function IntelligencePropertiesPage() {
  const { secret } = useOpsAuth()
  const [items, setItems] = useState<PropertyRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [productType, setProductType] = useState('')

  const load = useCallback(async () => {
    if (!secret) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (jurisdiction) params.set('jurisdiction', jurisdiction)
      if (propertyType) params.set('propertyType', propertyType)
      if (productType) params.set('productType', productType)
      const data = await fetchIntelligenceApi<{ items: PropertyRow[] }>(
        `/api/admin/intelligence/properties?${params}`,
        secret,
      )
      setItems(data.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [secret, jurisdiction, propertyType, productType])

  useEffect(() => {
    void load()
  }, [load])

  if (!secret) {
    return <p className="text-gray-500">Enter your Kealee ops secret above to load properties.</p>
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Jurisdiction"
          value={jurisdiction}
          onChange={(e) => setJurisdiction(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />
        <input
          placeholder="Property type"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />
        <input
          placeholder="Product"
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />
        <button onClick={load} className="rounded bg-[#C8521A] px-4 py-2 text-sm text-white">
          {loading ? 'Loading…' : 'Apply filters'}
        </button>
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((p) => {
          const score = p.opportunityScores[0]
          const campaign = p.campaignRecommendations[0]
          return (
            <article key={p.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-[#1A2B4A]">{p.address}</h2>
              <p className="text-sm text-gray-500">{p.jurisdiction ?? '—'} · {p.propertyType ?? 'unknown'}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-gray-400">Opportunity</dt>
                  <dd className="font-medium">{score?.totalOpportunityScore ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Priority</dt>
                  <dd className="font-medium">{score?.recommendedPriority ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Top product</dt>
                  <dd>{p.recommendedProducts[0]?.replace(/_/g, ' ') ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Campaign</dt>
                  <dd>{campaign?.recommendedCampaign ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Data quality</dt>
                  <dd>{(p.dataQualityScore * 100).toFixed(0)}%</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Confidence</dt>
                  <dd>{score ? `${(score.confidenceScore * 100).toFixed(0)}%` : '—'}</dd>
                </div>
              </dl>
            </article>
          )
        })}
      </div>
      {!loading && items.length === 0 && (
        <p className="text-gray-500">No property twins yet. Run lead scoring or ingest sample parcels.</p>
      )}
    </div>
  )
}
