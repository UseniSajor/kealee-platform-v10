'use client'

import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Layers, Mail, RefreshCw, Loader2, ExternalLink, FileText } from 'lucide-react'
import { OpsPanel } from './ops-ui'

type LibTab = 'plan' | 'stack' | 'campaigns' | 'index'

interface LibraryPayload {
  ok: boolean
  index: {
    plans: { id: string; title: string; path: string }[]
    stacks: { id: string; title: string; path: string }[]
    campaigns: { id: string; title: string; path: string; regenerate?: string }[]
    description?: string
  } | null
  plans: Record<string, unknown>
  stacks: Record<string, unknown>
  campaigns: Record<string, unknown>
  error?: string
}

export function PlansLibrary() {
  const [data, setData] = useState<LibraryPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<LibTab>('plan')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/marketing/library')
      .then(r => r.json())
      .then(j => {
        setData(j)
        const first =
          j.index?.plans?.[0]?.id ??
          j.index?.stacks?.[0]?.id ??
          j.index?.campaigns?.[0]?.id ??
          null
        setSelectedId(first)
      })
      .catch(() => setData({ ok: false, index: null, plans: {}, stacks: {}, campaigns: {} }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const items =
    tab === 'plan'
      ? data?.index?.plans ?? []
      : tab === 'stack'
        ? data?.index?.stacks ?? []
        : tab === 'campaigns'
          ? data?.index?.campaigns ?? []
          : []

  const detail =
    tab === 'plan' && selectedId
      ? data?.plans[selectedId]
      : tab === 'stack' && selectedId
        ? data?.stacks[selectedId]
        : tab === 'campaigns' && selectedId
          ? data?.campaigns[selectedId]
          : tab === 'index'
            ? data?.index
            : null

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#2ABFBF' }} />
      </div>
    )
  }

  if (!data?.ok) {
    return (
      <OpsPanel title="Marketing library" icon={BookOpen} accent="#EF4444">
        <p className="text-sm text-rose-300">{data?.error ?? 'Could not load marketing/ library'}</p>
      </OpsPanel>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/50 max-w-2xl">
          Saved plans, stacks, and campaigns live in <code className="text-teal-400">marketing/</code> (git).
          No paid ads or marketing SaaS subscriptions required.
        </p>
        <div className="flex gap-2">
          <a
            href="https://github.com"
            className="hidden"
            aria-hidden
          />
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs text-white/60"
            style={{ borderColor: '#2A3D5F' }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b pb-0" style={{ borderColor: '#2A3D5F' }}>
        {(
          [
            { id: 'plan' as LibTab, label: 'Plans', icon: FileText },
            { id: 'stack' as LibTab, label: 'Stacks', icon: Layers },
            { id: 'campaigns' as LibTab, label: 'Campaigns', icon: Mail },
            { id: 'index' as LibTab, label: 'Catalog', icon: BookOpen },
          ] as const
        ).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id)
              setSelectedId(null)
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px ${
              tab === t.id ? 'text-teal-400 border-teal-400' : 'text-white/40 border-transparent'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <OpsPanel title="Assets" icon={BookOpen}>
          <ul className="max-h-96 space-y-1 overflow-y-auto">
            {tab === 'index' ? (
              <li className="text-xs text-white/50 p-2">{data.index?.description}</li>
            ) : (
              items.map(item => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selectedId === item.id ? 'bg-teal-900/30 text-teal-300' : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    {item.title}
                    <span className="block font-mono text-[10px] text-white/30">{item.path}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </OpsPanel>

        <div className="lg:col-span-2">
          <OpsPanel
            title={tab === 'index' ? 'Library catalog' : selectedId ?? 'Select an asset'}
            icon={FileText}
            action={
              tab === 'campaigns' ? (
                <span className="text-[10px] text-white/40">pnpm run generate:marketing-library</span>
              ) : undefined
            }
          >
            {detail ? (
              <pre
                className="max-h-[32rem] overflow-auto rounded-lg border p-3 text-xs text-white/75"
                style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E' }}
              >
                {JSON.stringify(detail, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-white/40">Select an item from the list.</p>
            )}
          </OpsPanel>
        </div>
      </div>

      <OpsPanel title="Organic playbook (repo)" icon={ExternalLink} accent="#E8793A">
        <p className="text-sm text-white/60 mb-2">
          Full narrative: <strong className="text-white/80">marketing/ORGANIC-AUTOMATION-PLAN.md</strong>
        </p>
        <ul className="list-disc space-y-1 pl-5 text-xs text-white/50">
          <li>Email + crons (Resend) — no Klaviyo</li>
          <li>Supabase leads — no GHL</li>
          <li>Reddit / LinkedIn / IG organic — no ad boost</li>
          <li>Stripe conversion — pricing from core-rules</li>
        </ul>
      </OpsPanel>
    </div>
  )
}
