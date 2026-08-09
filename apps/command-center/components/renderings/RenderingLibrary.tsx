'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Download,
  ExternalLink,
  Film,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  ShoppingBag,
} from 'lucide-react'

type LibraryTab = 'purchased' | 'marketing'

interface MediaAsset {
  id: string
  title: string
  kind: 'image' | 'video'
  url: string
  thumbnailUrl?: string
  provider?: string
  model?: string
  prompt?: string
  generatedAt?: string
  placement?: string
  collection?: string
}

interface PurchasedConcept {
  id: string
  clientName: string
  contactEmail?: string
  projectPath: string
  projectAddress?: string
  status: string
  paidAt?: string
  createdAt: string
  updatedAt?: string
  tier?: number | null
  renderJobs: string[]
  assets: MediaAsset[]
}

interface LibraryResponse {
  generatedAt: string
  marketing: MediaAsset[]
  purchasedConcepts: PurchasedConcept[]
  errors: string[]
}

export function RenderingLibrary() {
  const [tab, setTab] = useState<LibraryTab>('purchased')
  const [data, setData] = useState<LibraryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/renderings', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`)
      setData(payload as LibraryResponse)
    } catch (error) {
      setData({
        generatedAt: new Date().toISOString(),
        marketing: [],
        purchasedConcepts: [],
        errors: [error instanceof Error ? error.message : 'Could not load renderings'],
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const normalizedQuery = query.trim().toLowerCase()
  const concepts = useMemo(() => {
    if (!normalizedQuery) return data?.purchasedConcepts ?? []
    return (data?.purchasedConcepts ?? []).filter((concept) =>
      [
        concept.clientName,
        concept.contactEmail,
        concept.projectPath,
        concept.projectAddress,
        concept.id,
      ].some((value) => value?.toLowerCase().includes(normalizedQuery)),
    )
  }, [data?.purchasedConcepts, normalizedQuery])

  const marketing = useMemo(() => {
    if (!normalizedQuery) return data?.marketing ?? []
    return (data?.marketing ?? []).filter((asset) =>
      [asset.title, asset.collection, asset.placement, asset.model, asset.prompt]
        .some((value) => value?.toLowerCase().includes(normalizedQuery)),
    )
  }, [data?.marketing, normalizedQuery])

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#2ABFBF' }}>
            Asset administration
          </p>
          <h1 className="text-3xl font-bold text-white">Renderings</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/50">
            Customer-purchased design deliverables and public marketing media are stored and reviewed as separate collections.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm text-white/70 disabled:opacity-50"
          style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh library
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          icon={ShoppingBag}
          label="Purchased concept projects"
          value={data?.purchasedConcepts.length ?? 0}
          detail={`${data?.purchasedConcepts.reduce((sum, item) => sum + item.assets.length, 0) ?? 0} completed assets`}
          active={tab === 'purchased'}
          onClick={() => setTab('purchased')}
        />
        <SummaryCard
          icon={ImageIcon}
          label="Marketing & website media"
          value={data?.marketing.length ?? 0}
          detail="Public campaign and site assets"
          active={tab === 'marketing'}
          onClick={() => setTab('marketing')}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
        <div className="flex gap-1">
          <TabButton active={tab === 'purchased'} onClick={() => setTab('purchased')}>
            Purchased Concepts
          </TabButton>
          <TabButton active={tab === 'marketing'} onClick={() => setTab('marketing')}>
            Marketing & Website Media
          </TabButton>
        </div>
        <label className="relative sm:ml-auto sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
          <span className="sr-only">Search renderings</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tab === 'purchased' ? 'Search client, project, or address' : 'Search campaign, model, or prompt'}
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/25 focus:outline-none"
            style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E' }}
          />
        </label>
      </div>

      {data?.errors.map((error) => (
        <div key={error} className="flex items-start gap-2 rounded-lg border border-amber-700/40 bg-amber-950/20 p-3 text-sm text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ))}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#2ABFBF' }} />
        </div>
      ) : tab === 'purchased' ? (
        <PurchasedConceptGrid concepts={concepts} />
      ) : (
        <MarketingMediaGrid assets={marketing} />
      )}
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  active,
  onClick,
}: {
  icon: React.ElementType
  label: string
  value: number
  detail: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border p-5 text-left transition-colors"
      style={{
        borderColor: active ? '#2ABFBF' : '#2A3D5F',
        backgroundColor: active ? 'rgba(42,191,191,0.10)' : '#1A2B4A',
      }}
    >
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5" style={{ color: active ? '#2ABFBF' : 'rgba(255,255,255,0.4)' }} />
        <span className="text-3xl font-bold text-white">{value}</span>
      </div>
      <p className="mt-4 text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs text-white/40">{detail}</p>
    </button>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-3 py-2 text-xs font-semibold"
      style={active
        ? { backgroundColor: 'rgba(42,191,191,0.16)', color: '#5EE0D5' }
        : { color: 'rgba(255,255,255,0.45)' }}
    >
      {children}
    </button>
  )
}

function PurchasedConceptGrid({ concepts }: { concepts: PurchasedConcept[] }) {
  if (concepts.length === 0) {
    return <EmptyState title="No purchased concept renderings found" detail="Paid projects with completed render URLs will appear here." />
  }

  return (
    <div className="space-y-5">
      {concepts.map((concept) => (
        <section key={concept.id} className="overflow-hidden rounded-xl border" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
          <header className="flex flex-col justify-between gap-3 border-b p-4 sm:flex-row sm:items-center" style={{ borderColor: '#2A3D5F' }}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-white">{concept.clientName}</h2>
                <span className="rounded-full bg-emerald-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-300">Purchased</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase text-white/50">{concept.status}</span>
              </div>
              <p className="mt-1 text-xs text-white/45">
                {concept.projectPath.replace(/_/g, ' ')}
                {concept.projectAddress ? ` · ${concept.projectAddress}` : ''}
                {concept.tier ? ` · Tier ${concept.tier}` : ''}
              </p>
            </div>
            <div className="text-left text-xs text-white/35 sm:text-right">
              <p>Project {concept.id}</p>
              <p>{concept.paidAt ? `Paid ${formatDate(concept.paidAt)}` : `Created ${formatDate(concept.createdAt)}`}</p>
            </div>
          </header>
          {concept.assets.length > 0 ? (
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
              {concept.assets.map((asset) => <MediaCard key={asset.id} asset={asset} privateAsset />)}
            </div>
          ) : (
            <p className="p-4 text-sm text-white/40">
              {concept.renderJobs.length} generation job{concept.renderJobs.length === 1 ? '' : 's'} recorded; completed URLs are not available yet.
            </p>
          )}
        </section>
      ))}
    </div>
  )
}

function MarketingMediaGrid({ assets }: { assets: MediaAsset[] }) {
  if (assets.length === 0) {
    return <EmptyState title="No marketing media found" detail="Generated campaign and website assets will appear here." />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {assets.map((asset) => <MediaCard key={asset.id} asset={asset} />)}
    </div>
  )
}

function MediaCard({ asset, privateAsset = false }: { asset: MediaAsset; privateAsset?: boolean }) {
  return (
    <article className="overflow-hidden rounded-xl border" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
      <div className="relative aspect-video bg-black/35">
        {asset.kind === 'video' ? (
          <video className="h-full w-full object-cover" controls preload="metadata" poster={asset.thumbnailUrl}>
            <source src={asset.url} />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.url} alt={asset.title} className="h-full w-full object-cover" loading="lazy" />
        )}
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase text-white">
          {asset.kind === 'video' ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
          {asset.kind}
        </span>
        {privateAsset && (
          <span className="absolute right-2 top-2 rounded bg-emerald-900/80 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-100">Customer asset</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-white">{asset.title}</h3>
        {asset.placement && <p className="mt-1 text-xs text-white/40">{asset.placement}</p>}
        <div className="mt-3 space-y-1 text-[11px] text-white/35">
          {asset.provider && <p>Provider: <span className="text-white/60">{asset.provider}</span></p>}
          {asset.model && <p className="truncate">Model: <span className="text-white/60">{asset.model}</span></p>}
          {asset.generatedAt && <p>Generated: <span className="text-white/60">{formatDate(asset.generatedAt)}</span></p>}
        </div>
        {asset.prompt && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium" style={{ color: '#2ABFBF' }}>View prompt</summary>
            <p className="mt-2 max-h-28 overflow-auto rounded bg-black/20 p-2 text-xs leading-relaxed text-white/50">{asset.prompt}</p>
          </details>
        )}
        <div className="mt-4 flex gap-2">
          <a href={asset.url} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs text-white/65" style={{ borderColor: '#2A3D5F' }}>
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </a>
          <a href={asset.url} download className="flex items-center justify-center rounded-lg border px-3 py-2 text-white/65" style={{ borderColor: '#2A3D5F' }} aria-label={`Download ${asset.title}`}>
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </article>
  )
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed py-20 text-center" style={{ borderColor: '#2A3D5F' }}>
      <ImageIcon className="mx-auto h-9 w-9 text-white/20" />
      <h2 className="mt-4 text-sm font-semibold text-white/70">{title}</h2>
      <p className="mt-1 text-xs text-white/35">{detail}</p>
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
