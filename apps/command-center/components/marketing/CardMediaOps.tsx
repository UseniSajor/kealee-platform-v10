'use client'

import { useCallback, useEffect, useState } from 'react'
import { ImageIcon, Loader2, RefreshCw, Sparkles, Video, AlertCircle } from 'lucide-react'
import { OpsPanel } from './ops-ui'

interface CardMediaEntry {
  photoUrl: string
  photoAlt: string
  videoUrl?: string
  mediaType: 'video' | 'photo'
  source?: 'generated' | 'fallback'
  generatedAt?: string
}

interface CardMediaManifest {
  version: number
  updatedAt: string | null
  cards: Record<string, CardMediaEntry>
}

interface GenerateResult {
  success?: boolean
  generated?: number
  failed?: number
  error?: string
  results?: { key: string; ok: boolean; error?: string }[]
}

export function CardMediaOps() {
  const [manifest, setManifest] = useState<CardMediaManifest | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [scope, setScope] = useState<'all' | 'home' | 'product'>('all')
  const [skipVideo, setSkipVideo] = useState(false)
  const [lastResult, setLastResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch('/api/marketing/card-media')
      .then(r => r.json())
      .then(j => {
        if (j.error) throw new Error(j.error)
        setManifest(j as CardMediaManifest)
      })
      .catch(e => {
        setError(e instanceof Error ? e.message : 'Failed to load manifest')
        setManifest(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function runGenerate(opts: { keys?: string[] }) {
    const label = opts.keys?.[0] ?? scope
    setGenerating(label)
    setLastResult(null)
    try {
      const res = await fetch('/api/marketing/card-media/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: opts.keys ? undefined : scope,
          keys: opts.keys,
          skipVideo,
          dryRun: false,
        }),
      })
      const json = (await res.json()) as GenerateResult
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setLastResult(json)
      await load()
    } catch (e: unknown) {
      setLastResult({ error: e instanceof Error ? e.message : String(e) })
    } finally {
      setGenerating(null)
    }
  }

  const cards = manifest
    ? Object.entries(manifest.cards).sort(([a], [b]) => a.localeCompare(b))
    : []

  const homeCards = cards.filter(([k]) => k.startsWith('home:'))
  const productCards = cards.filter(([k]) => k.startsWith('product:'))

  return (
    <div className="space-y-6">
      <OpsPanel
        title="Homepage & service card media"
        icon={ImageIcon}
        accent="#E8793A"
        action={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      >
        <p className="mb-4 text-sm text-slate-500">
          MarketingBot prompts + DALL-E/Replicate on <strong className="text-slate-700">web-main</strong>.
          Manifest powers homepage circles and <code className="text-teal-700">/services/*</code> heroes.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={scope}
            onChange={e => setScope(e.target.value as typeof scope)}
            className="rounded-lg border px-3 py-2 text-sm text-slate-900"
            style={{ borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}
          >
            <option value="all">All cards</option>
            <option value="home">Homepage only (4)</option>
            <option value="product">Product pages only</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" checked={skipVideo} onChange={e => setSkipVideo(e.target.checked)} />
            Images only (skip video)
          </label>
          <button
            type="button"
            disabled={!!generating}
            onClick={() => runGenerate({})}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50"
            style={{ backgroundColor: '#E8793A', color: '#0f1c30' }}
          >
            {generating && !generating.includes(':') ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate batch
          </button>
        </div>

        {manifest?.updatedAt && (
          <p className="mb-3 text-xs text-slate-500">
            Manifest updated {new Date(manifest.updatedAt).toLocaleString()}
          </p>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 text-sm text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {lastResult && (
          <pre
            className="mb-4 max-h-28 overflow-auto rounded-lg border p-3 text-xs text-slate-600"
            style={{ borderColor: '#E2E8F0' }}
          >
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        )}
      </OpsPanel>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#2ABFBF' }} />
        </div>
      ) : (
        <>
          <CardGrid
            title="Homepage"
            cards={homeCards}
            generating={generating}
            onGenerate={key => runGenerate({ keys: [key] })}
          />
          <CardGrid
            title="Product / precon services"
            cards={productCards}
            generating={generating}
            onGenerate={key => runGenerate({ keys: [key] })}
          />
        </>
      )}
    </div>
  )
}

function CardGrid({
  title,
  cards,
  generating,
  onGenerate,
}: {
  title: string
  cards: [string, CardMediaEntry][]
  generating: string | null
  onGenerate: (key: string) => void
}) {
  if (cards.length === 0) return null
  return (
    <OpsPanel title={title} icon={ImageIcon}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([key, entry]) => {
          const isFallback = entry.source !== 'generated'
          const busy = generating === key
          return (
            <div
              key={key}
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
            >
              <div className="relative aspect-[4/3] bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.photoUrl}
                  alt={entry.photoAlt}
                  className="h-full w-full object-cover"
                />
                {entry.mediaType === 'video' && entry.videoUrl && (
                  <span
                    className="absolute top-2 right-2 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: 'rgba(42,191,191,0.9)', color: '#0f1c30' }}
                  >
                    <Video className="h-3 w-3" />
                    video
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="font-mono text-xs font-semibold text-slate-900">{key}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{entry.photoAlt}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: isFallback ? 'rgba(245,158,11,0.15)' : 'rgba(52,211,153,0.15)',
                      color: isFallback ? '#FCD34D' : '#6EE7B7',
                    }}
                  >
                    {entry.source ?? 'fallback'}
                  </span>
                  <button
                    type="button"
                    disabled={!!generating}
                    onClick={() => onGenerate(key)}
                    className="text-xs font-medium disabled:opacity-50"
                    style={{ color: '#2ABFBF' }}
                  >
                    {busy ? '…' : 'Regenerate'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </OpsPanel>
  )
}
