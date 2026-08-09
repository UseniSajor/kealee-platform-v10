'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  Bot,
  Building2,
  CircleDollarSign,
  Database,
  FileText,
  Globe2,
  Layers3,
  Loader2,
  Map,
  Network,
  Play,
  RefreshCw,
  Search,
  Share2,
  Video,
} from 'lucide-react'

interface DashboardData {
  geography: { states: number; counties: number; cities: number; permitOffices: number }
  production: { content: number; published: number; media: number; publications: number; failedJobs: number }
  performance30d: {
    impressions: number
    reach: number
    views: number
    clicks: number
    leads: number
    conversions: number
    revenue: number
  }
  queue: {
    configured: boolean
    connected: boolean
    counts: null | { waiting: number; active: number; delayed: number; completed: number; failed: number }
  }
  providers: Array<{ provider: string; category: string; configured: boolean; capability: string }>
  errors: Array<{ index: number; message: string }>
}

const modules = [
  { name: 'Market Intelligence', detail: 'Geography, permits, zoning, costs, and reports', icon: Database },
  { name: 'Programmatic SEO', detail: 'National guide pages, schema, sitemaps, and internal links', icon: Search },
  { name: 'AI Content Factory', detail: 'Research, writing, editing, versions, and approvals', icon: FileText },
  { name: 'Video Factory', detail: 'Runway, Kling, Veo, ElevenLabs, and media archives', icon: Video },
  { name: 'Social Distribution', detail: 'YouTube, Instagram, LinkedIn, Facebook, and TikTok', icon: Share2 },
  { name: 'AI Search Optimization', detail: 'Knowledge graph, citations, authority, and monitoring', icon: Network },
  { name: 'Agent System', detail: 'CMO, SEO, research, content, video, social, and conversion', icon: Bot },
  { name: 'Automation', detail: 'BullMQ, Redis, Trigger.dev, n8n, approvals, and retries', icon: Layers3 },
]

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dispatching, setDispatching] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/dashboard', { cache: 'no-store' })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || `HTTP ${response.status}`)
      setData(json)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Dashboard unavailable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function dispatch(type: 'market.ingest' | 'analytics.rollup' | 'search.monitor') {
    setDispatching(type)
    setMessage(null)
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          input: { scope: 'enabled' },
          idempotencyKey: `${type}:${new Date().toISOString().slice(0, 13)}`,
          approvalMode: type === 'market.ingest' ? 'automatic' : 'risk_based',
        }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(typeof json.error === 'string' ? json.error : JSON.stringify(json.error))
      setMessage(`${type} queued as ${json.jobId}`)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Dispatch failed')
    } finally {
      setDispatching(null)
    }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b px-5 py-4 lg:px-8" style={{ borderColor: 'var(--line)', background: 'rgba(9,22,16,.86)' }}>
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--orange)' }}>
              <Globe2 className="h-5 w-5 text-white" />
            </span>
            <div>
              <strong className="block">Kealee Marketing OS</strong>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>National construction growth infrastructure</span>
            </div>
          </div>
          <button onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-8 p-5 lg:p-8">
        <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-2xl border p-7 lg:p-9" style={{ borderColor: 'var(--line)', background: 'linear-gradient(135deg,#16372b,#10241d)' }}>
            <p className="text-xs font-bold uppercase tracking-[.2em]" style={{ color: 'var(--green)' }}>Mission control</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight lg:text-6xl">Automated national demand generation for construction.</h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
              Market intelligence, search publishing, content, media, social distribution, lead attribution, and agents share one Kealee data and workflow layer.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ActionButton label="Run enabled ingestion" busy={dispatching === 'market.ingest'} onClick={() => dispatch('market.ingest')} />
              <ActionButton label="Roll up analytics" busy={dispatching === 'analytics.rollup'} onClick={() => dispatch('analytics.rollup')} />
              <ActionButton label="Monitor AI search" busy={dispatching === 'search.monitor'} onClick={() => dispatch('search.monitor')} />
            </div>
            {message && <p className="mt-4 text-sm" style={{ color: 'var(--green)' }}>{message}</p>}
          </div>

          <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Automation fabric</h2>
              <Activity className="h-4 w-4" style={{ color: data?.queue.connected ? 'var(--green)' : 'var(--orange)' }} />
            </div>
            {loading ? <Loader2 className="mx-auto my-16 h-7 w-7 animate-spin" /> : (
              <>
                <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>
                  Redis {data?.queue.configured ? (data.queue.connected ? 'connected' : 'unavailable') : 'not configured'}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {Object.entries(data?.queue.counts ?? {}).map(([key, value]) => (
                    <MetricMini key={key} label={key} value={value} />
                  ))}
                </div>
                <div className="mt-6 space-y-2">
                  {data?.providers.map((provider) => (
                    <div key={provider.provider} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderColor: 'var(--line)' }}>
                      <div>
                        <p className="text-xs font-semibold">{provider.provider}</p>
                        <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{provider.capability}</p>
                      </div>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: provider.configured ? 'var(--green)' : '#52635b' }} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: 'var(--green)' }}>Live system</p>
              <h2 className="mt-2 text-2xl font-bold">National coverage and production</h2>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>No demo records</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <MetricCard icon={Map} label="States" value={data?.geography.states ?? 0} />
            <MetricCard icon={Map} label="Counties" value={data?.geography.counties ?? 0} />
            <MetricCard icon={Building2} label="Cities" value={data?.geography.cities ?? 0} />
            <MetricCard icon={Building2} label="Permit offices" value={data?.geography.permitOffices ?? 0} />
            <MetricCard icon={FileText} label="Content items" value={data?.production.content ?? 0} />
            <MetricCard icon={Globe2} label="Published" value={data?.production.published ?? 0} />
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
            <h2 className="text-xl font-bold">30-day growth</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricMini label="Impressions" value={data?.performance30d.impressions ?? 0} />
              <MetricMini label="Reach" value={data?.performance30d.reach ?? 0} />
              <MetricMini label="Views" value={data?.performance30d.views ?? 0} />
              <MetricMini label="Clicks" value={data?.performance30d.clicks ?? 0} />
              <MetricMini label="Leads" value={data?.performance30d.leads ?? 0} />
              <MetricMini label="Conversions" value={data?.performance30d.conversions ?? 0} />
              <MetricMini label="Revenue" value={`$${(data?.performance30d.revenue ?? 0).toLocaleString()}`} />
              <MetricMini label="Failed jobs" value={data?.production.failedJobs ?? 0} />
            </div>
          </div>
          <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
            <h2 className="text-xl font-bold">Production</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <MetricMini label="Content versions" value={data?.production.content ?? 0} />
              <MetricMini label="Media assets" value={data?.production.media ?? 0} />
              <MetricMini label="Publications" value={data?.production.publications ?? 0} />
              <MetricMini label="Published pages" value={data?.production.published ?? 0} />
            </div>
          </div>
        </section>

        <section>
          <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: 'var(--green)' }}>Domain modules</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {modules.map((module) => (
              <article key={module.name} className="rounded-xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
                <module.icon className="h-5 w-5" style={{ color: 'var(--orange)' }} />
                <h3 className="mt-4 font-bold">{module.name}</h3>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{module.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function ActionButton({ label, busy, onClick }: { label: string; busy: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={busy} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50" style={{ background: 'var(--orange)' }}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
      {label}
    </button>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number | string }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
      <Icon className="h-4 w-4" style={{ color: 'var(--green)' }} />
      <strong className="mt-4 block text-2xl">{typeof value === 'number' ? value.toLocaleString() : value}</strong>
      <span className="text-xs" style={{ color: 'var(--muted)' }}>{label}</span>
    </div>
  )
}

function MetricMini({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: 'var(--line)', background: 'rgba(255,255,255,.02)' }}>
      <strong className="block text-lg">{typeof value === 'number' ? value.toLocaleString() : value}</strong>
      <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{label}</span>
    </div>
  )
}
