'use client'

/**
 * Kealee v30 customer workspace — tabbed view of parallel bot deliverables.
 * Spec: UI UX v30.zip → /workspace/:projectId
 */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, LayoutGrid, Palette, Calculator, FileCheck, Layers, Video } from 'lucide-react'
import { isV30EnabledClient } from '@/lib/v30'
import { V30GenerationStatus } from '@/components/v30/V30GenerationStatus'

type TabId = 'overview' | 'design' | 'estimate' | 'permits' | 'floorplan' | 'video'

interface BotExecution {
  botType: string
  status: string
  progress: number
  outputData?: Record<string, unknown>
  result?: { contentJson?: Record<string, unknown> }
}

interface WorkspacePayload {
  intakeId?: string
  projectId?: string | null
  projectPath?: string
  clientName?: string
  quote?: { totalPrice?: number; features?: string[] }
  package?: { features?: string[]; totalPrice?: number | string }
  executions?: BotExecution[]
  generation?: { stage?: string }
}

const TABS: { id: TabId; label: string; icon: React.ElementType; bots: string[] }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid, bots: [] },
  { id: 'design', label: 'Concepts', icon: Palette, bots: ['design'] },
  { id: 'estimate', label: 'Estimate', icon: Calculator, bots: ['estimate'] },
  { id: 'permits', label: 'Permits', icon: FileCheck, bots: ['zoning', 'permit'] },
  { id: 'floorplan', label: 'Floorplan', icon: Layers, bots: ['floorplan'] },
  { id: 'video', label: 'Video', icon: Video, bots: ['video'] },
]

function outputForTab(executions: BotExecution[], bots: string[]): Record<string, unknown> | null {
  for (const bot of bots) {
    const ex = executions.find(e => e.botType === bot && e.status === 'COMPLETE')
    const data = (ex?.result?.contentJson ?? ex?.outputData) as Record<string, unknown> | undefined
    if (data) return data
  }
  return null
}

export default function V30WorkspacePage() {
  const params = useParams()
  const intakeId = typeof params.intakeId === 'string' ? params.intakeId : ''
  const v30 = isV30EnabledClient()
  const [tab, setTab] = useState<TabId>('overview')
  const [data, setData] = useState<WorkspacePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!v30 || !intakeId) return
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/v30/workspace?intakeId=${encodeURIComponent(intakeId)}`)
        const json = (await res.json()) as WorkspacePayload & { error?: string }
        if (!res.ok) throw new Error(json.error ?? 'Failed to load workspace')
        if (!cancelled) setData(json)
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Load failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 10_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [v30, intakeId])

  if (!v30) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-slate-600">v30 workspace is not enabled.</p>
      </div>
    )
  }

  const executions = data?.executions ?? []
  const tabDef = TABS.find(t => t.id === tab)!
  const tabOutput = tab === 'overview' ? null : outputForTab(executions, tabDef.bots)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600">Kealee v30 Workspace</p>
            <h1 className="text-xl font-bold text-slate-900">{data?.clientName ?? 'Your project'}</h1>
            <p className="text-sm text-slate-500">{data?.projectPath?.replace(/_/g, ' ')}</p>
          </div>
          {data?.quote?.totalPrice != null && (
            <p className="text-2xl font-black text-slate-900">
              ${Number(data.quote.totalPrice).toLocaleString()}
            </p>
          )}
        </div>
        <nav className="mx-auto max-w-5xl px-4 flex gap-1 overflow-x-auto pb-0">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap ${
                  tab === t.id
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {loading && (
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading workspace…
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3">{error}</div>
        )}

        {!loading && tab === 'overview' && (
          <div className="space-y-6">
            <V30GenerationStatus intakeId={intakeId} />
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-3">Package features</h2>
              <div className="flex flex-wrap gap-2">
                {(data?.package?.features ?? data?.quote?.features ?? []).map(f => (
                  <span key={f} className="rounded-full bg-violet-100 text-violet-800 text-xs font-semibold px-3 py-1">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-500">
              <Link href={`/concept/access?next=${encodeURIComponent(`/concept/${intakeId}`)}`} className="text-violet-600 underline">
                Open classic concept portal
              </Link>
            </p>
          </div>
        )}

        {!loading && tab !== 'overview' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {tabOutput ? (
              <pre className="text-xs text-slate-700 overflow-auto max-h-[32rem] whitespace-pre-wrap">
                {JSON.stringify(tabOutput, null, 2)}
              </pre>
            ) : (
              <p className="text-slate-500 text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {tabDef.label} deliverable is still generating…
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
