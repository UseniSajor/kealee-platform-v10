'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart2, ImageIcon, FileText, MapPin, CheckCircle, Clock,
  Loader2, Sparkles, LayoutDashboard, ListTodo,
} from 'lucide-react'
import {
  SERVICE_TYPES,
  PROPERTY_TYPES,
  PROPERTY_STYLES,
} from '@kealee/marketing-agency'

type Tab = 'overview' | 'assets' | 'visuals' | 'content' | 'leads' | 'tasks'

interface Asset {
  id: string
  title?: string
  asset_type: string
  approval_status: string
  storage_url?: string
  thumbnail_url?: string
  labels?: string[]
  service_type?: string
}

export default function MarketingWorkspacePage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [approved, setApproved] = useState<Asset[]>([])
  const [pending, setPending] = useState<Asset[]>([])
  const [leadSummary, setLeadSummary] = useState<Record<string, unknown>>({})
  const [analytics, setAnalytics] = useState<Record<string, unknown>>({})
  const [tasks, setTasks] = useState<unknown[]>([])
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  const [serviceType, setServiceType] = useState<string>(SERVICE_TYPES[0])
  const [propertyType, setPropertyType] = useState<string>(PROPERTY_TYPES[0])
  const [propertyStyle, setPropertyStyle] = useState<string>(PROPERTY_STYLES[0])
  const [city, setCity] = useState('')
  const [variant, setVariant] = useState<'before' | 'after' | 'hero'>('after')

  const [draftBody, setDraftBody] = useState('')
  const [draftType, setDraftType] = useState<'ad_copy' | 'social_caption' | 'landing_section'>('ad_copy')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cfg, appr, mine, leads, stats, t] = await Promise.all([
        fetch('/api/marketing/workspace/config').then((r) => r.json()),
        fetch('/api/marketing/assets/approved').then((r) => r.json()),
        fetch('/api/marketing/assets/mine').then((r) => r.json()),
        fetch('/api/marketing/leads/summary').then((r) => r.json()),
        fetch('/api/marketing/analytics/summary').then((r) => r.json()),
        fetch('/api/marketing/tasks').then((r) => r.json()),
      ])
      setConfig(cfg.config ?? {})
      setApproved(appr.items ?? [])
      setPending((mine.items ?? []).filter((a: Asset) => a.approval_status !== 'approved' && a.approval_status !== 'published'))
      setLeadSummary(leads)
      setAnalytics(stats)
      setTasks(t.tasks ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function generateVisual() {
    setGenerating(true)
    setGenError(null)
    try {
      const res = await fetch('/api/marketing/concept-visuals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: serviceType,
          property_type: propertyType,
          property_style: propertyStyle,
          city: city || undefined,
          variant,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      await load()
      setTab('assets')
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e))
    } finally {
      setGenerating(false)
    }
  }

  async function submitDraft() {
    const res = await fetch('/api/marketing/content/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_type: draftType, body: draftBody, submit: true }),
    })
    if (res.ok) {
      setDraftBody('')
      await load()
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'assets', label: 'Assets', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'visuals', label: 'Concept Visuals', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'content', label: 'Copy Drafts', icon: <FileText className="w-4 h-4" /> },
    { id: 'leads', label: 'Leads', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo className="w-4 h-4" /> },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-800" />
      </div>
    )
  }

  const brand = (config.brandGuide ?? {}) as Record<string, string>

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Kealee Marketing Workspace</h1>
          <p className="text-emerald-200 text-sm">Approved assets, drafts, and campaign insights — no customer PII</p>
        </div>
        <Link href="/admin/marketing/approvals" className="text-sm text-emerald-200 hover:text-white underline">
          Admin approvals
        </Link>
      </header>

      <nav className="border-b bg-white px-6 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {tab === 'overview' && (
          <div className="grid md:grid-cols-3 gap-4">
            <StatCard label="Approved assets" value={approved.length} icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} />
            <StatCard label="Pending review" value={pending.length} icon={<Clock className="w-5 h-5 text-amber-600" />} />
            <StatCard label="Leads today" value={String(leadSummary.today ?? 0)} icon={<BarChart2 className="w-5 h-5 text-blue-600" />} />
            <div className="md:col-span-3 bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-lg mb-2">{brand.name ?? 'Kealee'} Brand Guide</h2>
              <p className="text-slate-600">{brand.tagline}</p>
              <p className="text-sm text-slate-500 mt-2">Voice: {brand.voice}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {((config.targetLocations as string[]) ?? []).map((loc) => (
                  <span key={loc} className="inline-flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded-full">
                    <MapPin className="w-3 h-3" /> {loc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'assets' && (
          <AssetGrid title="Approved for use" items={approved} />
        )}

        {tab === 'visuals' && (
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">Generate concept visual (Replicate Flux)</h2>
            <p className="text-sm text-slate-500">
              Photorealistic AI renders labeled &quot;Concept visual&quot; — not real customer projects.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <Select label="Service" value={serviceType} onChange={setServiceType} options={SERVICE_TYPES} />
              <Select label="Property type" value={propertyType} onChange={setPropertyType} options={PROPERTY_TYPES} />
              <Select label="Style" value={propertyStyle} onChange={setPropertyStyle} options={PROPERTY_STYLES} />
              <Select label="Variant" value={variant} onChange={(v) => setVariant(v as typeof variant)} options={['before', 'after', 'hero']} />
              <label className="block text-sm">
                City (optional)
                <input className="mt-1 w-full border rounded-lg px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} />
              </label>
            </div>
            {genError && <p className="text-red-600 text-sm">{genError}</p>}
            <button
              type="button"
              disabled={generating}
              onClick={generateVisual}
              className="bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate with Replicate
            </button>
            <AssetGrid title="Your pending visuals" items={pending.filter((a) => a.asset_type.includes('concept') || a.asset_type.includes('before'))} />
          </div>
        )}

        {tab === 'content' && (
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">Draft copy for Kealee approval</h2>
            <Select label="Content type" value={draftType} onChange={(v) => setDraftType(v as typeof draftType)} options={['ad_copy', 'social_caption', 'landing_section']} />
            <textarea
              className="w-full border rounded-lg px-3 py-2 min-h-[160px] text-sm"
              placeholder="Write ad copy, social caption, or landing section..."
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
            />
            <button type="button" onClick={submitDraft} className="bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm">
              Submit for approval
            </button>
          </div>
        )}

        {tab === 'leads' && (
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">Lead summary (aggregated — no PII)</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <StatCard label="Total (30d)" value={String(leadSummary.total ?? 0)} />
              <StatCard label="Hot leads" value={String(leadSummary.hotCount ?? 0)} />
              <StatCard label="Capacity / day" value={String(leadSummary.capacityPerDay ?? 50)} />
            </div>
            <Breakdown title="By source" data={(leadSummary.bySource as Record<string, number>) ?? {}} />
            <Breakdown title="By service" data={(leadSummary.byService as Record<string, number>) ?? {}} />
          </div>
        )}

        {tab === 'tasks' && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-lg mb-4">Tasks assigned to you</h2>
            {tasks.length === 0 ? (
              <p className="text-slate-500 text-sm">No open tasks.</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t: { id: string; title: string; status: string; due_at?: string }) => (
                  <li key={t.id} className="border rounded-lg p-3 text-sm flex justify-between">
                    <span>{t.title}</span>
                    <span className="text-slate-400">{t.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  )
}

function AssetGrid({ title, items }: { title: string; items: Asset[] }) {
  return (
    <div>
      <h2 className="font-semibold text-lg mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-slate-500 text-sm">No assets yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((a) => (
            <div key={a.id} className="bg-white border rounded-xl overflow-hidden">
              {a.storage_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.storage_url} alt={a.title ?? 'Asset'} className="w-full h-40 object-cover" />
              )}
              <div className="p-3 text-sm">
                <p className="font-medium">{a.title ?? a.asset_type}</p>
                <p className="text-slate-500 capitalize">{a.approval_status.replace(/_/g, ' ')}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(a.labels ?? []).map((l) => (
                    <span key={l} className="text-xs bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">{l}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <label className="block text-sm">
      {label}
      <select className="mt-1 w-full border rounded-lg px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
        ))}
      </select>
    </label>
  )
}

function Breakdown({ title, data }: { title: string; data: Record<string, number> }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-700 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(data).map(([k, v]) => (
          <span key={k} className="text-xs bg-slate-100 px-2 py-1 rounded">{k}: {v}</span>
        ))}
      </div>
    </div>
  )
}
