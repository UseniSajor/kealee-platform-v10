'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardCheck, Loader2, RefreshCw, RotateCcw } from 'lucide-react'
import { generateSitePlan, getSitePlanOperationsQueue, type GeneratedSitePlan, type SitePlanQueueItem } from '@/lib/api/site-plans'

const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, character => character.toUpperCase())

export default function SitePlanOperationsPage() {
  const [workflows, setWorkflows] = useState<SitePlanQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<SitePlanQueueItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try { setWorkflows(await getSitePlanOperationsQueue()) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load the operations queue.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const totals = useMemo(() => workflows.reduce((result, workflow) => ({
    blockers: result.blockers + workflow.blockingComplianceCount,
    reviews: result.reviews + workflow.pendingReviewCount,
    corrections: result.corrections + workflow.openCorrectionCount,
  }), { blockers: 0, reviews: 0, corrections: 0 }), [workflows])

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-wider text-[#2ABFBF]">Delivery operations</p><h1 className="mt-1 text-3xl font-extrabold text-white">Site-plan queue</h1><p className="mt-2 text-sm text-slate-400">Authoritative workflow, compliance, professional review, and correction status.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-200 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
    </header>

    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Queue summary">
      {[{ name: 'Workflows', value: workflows.length, Icon: ClipboardCheck, color: '#2ABFBF' },
        { name: 'Blocking findings', value: totals.blockers, Icon: AlertTriangle, color: '#F87171' },
        { name: 'Pending reviews', value: totals.reviews, Icon: CheckCircle2, color: '#FBBF24' },
        { name: 'Open corrections', value: totals.corrections, Icon: RotateCcw, color: '#A78BFA' },
      ].map(({ name, value, Icon, color }) => <div key={name} className="rounded-2xl border border-slate-800 bg-[#111C30] p-5"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{name}</p><Icon className="h-5 w-5" style={{ color }} /></div><p className="mt-3 text-3xl font-black text-white">{value}</p></div>)}
    </section>

    {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
    {loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#2ABFBF]" aria-label="Loading site plans" /></div> : workflows.length === 0 ? <div className="rounded-2xl border border-slate-800 bg-[#111C30] p-10 text-center text-slate-400">No site-plan workflows are visible for your organization.</div> :
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#111C30]"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-800 bg-slate-900/50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-4">Project</th><th className="px-5 py-4">Stage</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Gates</th><th className="px-5 py-4">Updated</th><th className="px-5 py-4"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-slate-800">{workflows.map(workflow => <tr key={workflow.id} className="text-slate-200"><td className="px-5 py-4"><p className="font-semibold text-white">{workflow.projectId}</p><p className="mt-1 font-mono text-xs text-slate-500">v{workflow.version} · {workflow.id}</p></td><td className="px-5 py-4">{label(workflow.currentStage)}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-bold">{label(workflow.status)}</span></td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><Gate count={workflow.blockingComplianceCount} label="blockers" danger /><Gate count={workflow.pendingReviewCount} label="reviews" /><Gate count={workflow.openCorrectionCount} label="corrections" /></div></td><td className="px-5 py-4 text-slate-400">{new Date(workflow.updatedAt).toLocaleString()}</td><td className="px-5 py-4 text-right"><button type="button" disabled={workflow.currentStage !== 'PLAN_GENERATION'} onClick={() => setSelected(workflow)} className="rounded-lg bg-[#2ABFBF] px-3 py-2 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-30">Generate</button></td></tr>)}</tbody></table></div></section>}
    {selected && <GeneratorDialog workflow={selected} onClose={() => setSelected(null)} />}
  </div>
}

function Gate({ count, label: gateLabel, danger = false }: { count: number; label: string; danger?: boolean }) {
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${count && danger ? 'bg-red-500/15 text-red-300' : count ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/10 text-emerald-400'}`}>{count} {gateLabel}</span>
}

const EXAMPLE_GEOMETRY = JSON.stringify([{ id: 'property-boundary', layer: 'BOUNDARY', vertices: [
  { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 80 }, { x: 0, y: 80 },
], closed: true, authority: 'SURVEYED', sourceId: 'survey-document-id',
sourceRetrievedAt: new Date().toISOString(), confidence: 1 }], null, 2)

function GeneratorDialog({ workflow, onClose }: { workflow: SitePlanQueueItem; onClose: () => void }) {
  const [name, setName] = useState(`Site plan ${workflow.projectId}`)
  const [crs, setCrs] = useState('EPSG:2248')
  const [geometry, setGeometry] = useState(EXAMPLE_GEOMETRY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedSitePlan | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null)
    try {
      const parsed = JSON.parse(geometry) as Parameters<typeof generateSitePlan>[1]['geometry']
      if (!Array.isArray(parsed) || !parsed.length) throw new Error('Geometry must be a non-empty JSON array.')
      setResult(await generateSitePlan(workflow.id, { idempotencyKey: crypto.randomUUID(), name, units: 'FEET',
        crs, revision: 1, surveyVerified: false, requestedClassification: 'CONCEPT', geometry: parsed }))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Generation failed.') }
    finally { setBusy(false) }
  }

  function download(filename: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click()
    URL.revokeObjectURL(url)
  }

  function downloadBase64(filename: string, base64: string, type: string) {
    const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0))
    const url = URL.createObjectURL(new Blob([bytes], { type }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click()
    URL.revokeObjectURL(url)
  }

  return <div role="dialog" aria-modal="true" aria-labelledby="generator-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#111C30] p-6 shadow-2xl">
    <h2 id="generator-title" className="text-xl font-bold text-white">Generate concept site plan</h2><p className="mt-1 text-sm text-slate-400">Supply coordinate geometry with source provenance. Concept output is never a boundary survey or permit-ready plan.</p>
    <div className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-slate-300"><p className="font-semibold text-cyan-300">Your deliverable</p><p className="mt-1">A printable PDF plan sheet plus coordinate-accurate DXF and GeoJSON. Included features depend on the plat or survey source: boundaries, structures, setbacks, easements, contours, utilities, drainage, buffers, and disturbance areas are shown only when supplied.</p></div>
    <form onSubmit={submit} className="mt-5 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-300">Plan name<input required value={name} onChange={event => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-white" /></label><label className="text-sm font-medium text-slate-300">Coordinate reference system<input required value={crs} onChange={event => setCrs(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 font-mono text-white" /></label></div>
      <label className="block text-sm font-medium text-slate-300">Geometry JSON<textarea required rows={14} value={geometry} onChange={event => setGeometry(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 font-mono text-xs text-white" /></label>
      {error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      {result && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4"><p className="font-semibold text-emerald-300">Concept artifacts generated</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => downloadBase64(`site-plan-r${result.summary.revision}.pdf`, result.artifact.pdfBase64, 'application/pdf')} className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-bold text-slate-950">Download PDF</button><button type="button" onClick={() => download(`site-plan-r${result.summary.revision}.dxf`, result.artifact.dxf, 'application/dxf')} className="rounded-lg border border-emerald-500 px-3 py-2 text-sm font-bold text-emerald-300">Download DXF</button><button type="button" onClick={() => download(`site-plan-r${result.summary.revision}.geojson`, JSON.stringify(result.artifact.geoJson, null, 2), 'application/geo+json')} className="rounded-lg border border-emerald-500 px-3 py-2 text-sm font-bold text-emerald-300">Download GeoJSON</button></div></div>}
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300">Close</button><button type="submit" disabled={busy} className="rounded-lg bg-[#2ABFBF] px-4 py-2 font-bold text-slate-950 disabled:opacity-50">{busy ? 'Generating…' : 'Generate concept'}</button></div>
    </form>
  </div></div>
}
