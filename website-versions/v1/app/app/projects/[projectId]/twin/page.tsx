'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { TwinOverview } from '@kealee/ui/components/twin/twin-overview'
import { TwinSpatialMap } from '@kealee/ui/components/twin/twin-spatial-map'
import { TwinSystemsPanel } from '@kealee/ui/components/twin/twin-systems-panel'
import { TwinAssetGallery } from '@kealee/ui/components/twin/twin-asset-gallery'
import { TwinObservationList } from '@kealee/ui/components/twin/twin-observation-list'
import { Loader2, AlertTriangle } from 'lucide-react'

interface TwinData {
  twin: {
    id: string
    address: string
    creation_path: string
    status: string
    created_at: string
    source_capture_session_ids: string[]
    floor_area_sqft?: number | null
    year_built?: number | null
    property_type?: string | null
  }
  spatialNodes: Array<{
    id: string
    node_key: string
    level: string
    area_type: string
    label: string
    sqft?: number | null
    parent_node_key?: string | null
    observation_count?: number
    asset_count?: number
  }>
  systemNodes: Array<{
    id: string
    system_key: string
    system_category: string
    label: string
    condition?: string | null
    estimated_age_years?: number | null
    brand?: string | null
    model?: string | null
    observation_count?: number
  }>
  observations: Array<{
    id: string
    zone: string
    label: string
    description?: string | null
    severity?: string | null
    confidence?: number | null
    spatial_node_key?: string | null
    system_node_key?: string | null
  }>
  assets: Array<{
    id: string
    zone: string
    storage_url: string
    ai_label?: string | null
    ai_description?: string | null
    created_at: string
  }>
}

type Tab = 'overview' | 'spatial' | 'systems' | 'gallery' | 'observations'

export default function ProjectTwinPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.projectId as string
  const twinId = searchParams.get('twinId')

  const [twinData, setTwinData] = useState<TwinData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  useEffect(() => {
    async function load() {
      const url = twinId
        ? `/api/twin?twinId=${twinId}`
        : `/api/twin?projectId=${projectId}`
      try {
        const resp = await fetch(url)
        if (!resp.ok) {
          const { error: err } = await resp.json()
          setError(err ?? 'Twin not found')
          return
        }
        setTwinData(await resp.json())
      } catch {
        setError('Failed to load project dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId, twinId])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#E8793A' }} />
      </div>
    )
  }

  if (error || !twinData) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-gray-600">{error ?? 'Project dashboard not available'}</p>
      </div>
    )
  }

  const { twin, spatialNodes, systemNodes, observations, assets } = twinData

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'spatial', label: 'Spatial Map', count: spatialNodes.length },
    { key: 'systems', label: 'Systems', count: systemNodes.length },
    { key: 'gallery', label: 'Gallery', count: assets.length },
    { key: 'observations', label: 'Observations', count: observations.length },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>
          Digital Twin
        </h1>
        <p className="text-sm text-gray-500">{twin.address}</p>
      </div>

      {/* Tab nav */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={
              activeTab === tab.key
                ? { backgroundColor: '#fff', color: '#1A2B4A', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                : { color: '#6B7280' }
            }
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-xs"
                style={
                  activeTab === tab.key
                    ? { backgroundColor: '#FFF4ED', color: '#E8793A' }
                    : { backgroundColor: '#E5E7EB', color: '#9CA3AF' }
                }
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <TwinOverview
          twin={twin}
          spatialNodeCount={spatialNodes.length}
          systemNodeCount={systemNodes.length}
          observationCount={observations.length}
          assetCount={assets.length}
        />
      )}
      {activeTab === 'spatial' && <TwinSpatialMap nodes={spatialNodes} />}
      {activeTab === 'systems' && <TwinSystemsPanel systems={systemNodes} />}
      {activeTab === 'gallery' && <TwinAssetGallery assets={assets} />}
      {activeTab === 'observations' && <TwinObservationList observations={observations} />}
    </div>
  )
}
