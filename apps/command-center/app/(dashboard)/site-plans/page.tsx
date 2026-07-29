'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardCheck, Loader2, RefreshCw, RotateCcw } from 'lucide-react'
import { extractSitePlanDocument, generateSitePlan, getSitePlanOperationsQueue,
  runEngineeringTask,
  type GeneratedSitePlan, type SitePlanDocumentExtraction, type SitePlanQueueItem } from '@/lib/api/site-plans'

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
    redlines: result.redlines + workflow.openRedlineCount,
  }), { blockers: 0, reviews: 0, corrections: 0, redlines: 0 }), [workflows])

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-wider text-[#2ABFBF]">Delivery operations</p><h1 className="mt-1 text-3xl font-extrabold" style={{ color: '#1A2B4A' }}>Site-plan queue</h1><p className="mt-2 text-sm text-slate-500">Authoritative workflow, compliance, professional review, and correction status.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
    </header>

    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Queue summary">
      {[{ name: 'Workflows', value: workflows.length, Icon: ClipboardCheck, color: '#2ABFBF' },
        { name: 'Blocking findings', value: totals.blockers, Icon: AlertTriangle, color: '#DC2626' },
        { name: 'Pending reviews', value: totals.reviews, Icon: CheckCircle2, color: '#D97706' },
        { name: 'Redlines / corrections', value: totals.redlines + totals.corrections, Icon: RotateCcw, color: '#7C3AED' },
      ].map(({ name, value, Icon, color }) => <div key={name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{name}</p><Icon className="h-5 w-5" style={{ color }} /></div><p className="mt-3 text-3xl font-black" style={{ color: '#1A2B4A' }}>{value}</p></div>)}
    </section>

    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#2ABFBF]" aria-label="Loading site plans" /></div> : workflows.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400 shadow-sm">No site-plan workflows are visible for your organization.</div> :
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Project</th><th className="px-5 py-4">Stage</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Gates</th><th className="px-5 py-4">Updated</th><th className="px-5 py-4"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-slate-200">{workflows.map(workflow => <tr key={workflow.id} className="text-slate-700"><td className="px-5 py-4"><p className="font-semibold" style={{ color: '#1A2B4A' }}>{workflow.projectId}</p><p className="mt-1 font-mono text-xs text-slate-400">v{workflow.version} · {workflow.id}</p></td><td className="px-5 py-4">{label(workflow.currentStage)}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-bold">{label(workflow.status)}</span></td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><Gate count={workflow.blockingComplianceCount} label="blockers" danger /><Gate count={workflow.pendingReviewCount} label="reviews" /><Gate count={workflow.openCorrectionCount} label="corrections" /></div></td><td className="px-5 py-4 text-slate-500">{new Date(workflow.updatedAt).toLocaleString()}</td><td className="px-5 py-4 text-right"><button type="button" disabled={workflow.currentStage !== 'PLAN_GENERATION'} onClick={() => setSelected(workflow)} className="rounded-lg bg-[#2ABFBF] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-30">Generate</button></td></tr>)}</tbody></table></div></section>}
    {selected && <GeneratorDialog workflow={selected} onClose={() => setSelected(null)} />}
  </div>
}

function Gate({ count, label: gateLabel, danger = false }: { count: number; label: string; danger?: boolean }) {
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${count && danger ? 'bg-red-50 text-red-700' : count ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{count} {gateLabel}</span>
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
  const [extracting, setExtracting] = useState(false)
  const [extraction, setExtraction] = useState<SitePlanDocumentExtraction | null>(null)
  const [analysisInput, setAnalysisInput] = useState(JSON.stringify({
    points: [{ x: 0, y: 0, z: 100, sourcePointId: 'P1' }, { x: 100, y: 0, z: 102, sourcePointId: 'P2' },
      { x: 100, y: 80, z: 105, sourcePointId: 'P3' }, { x: 0, y: 80, z: 101, sourcePointId: 'P4' }],
    interval: 1, areaSqFt: 8000, runoffCoefficient: 0.55, rainfallIntensityInPerHour: 2.5,
    rainfallSource: 'NOAA Atlas 14 / jurisdiction-approved source required', ruleVersion: 'PG-PHASE1-2026',
  }, null, 2))
  const [analysisResult, setAnalysisResult] = useState<unknown>(null)
  async function runTask(type: Parameters<typeof runEngineeringTask>[1]['type'], stageCode: string) {
    setBusy(true); setError(null)
    try {
      const options = JSON.parse(analysisInput) as Record<string, unknown>
      if (type.startsWith('GENERATE_') && ['GENERATE_DXF', 'GENERATE_VECTOR_PDF', 'GENERATE_REPORT'].includes(type)) {
        options.geometry = JSON.parse(geometry)
        options.name = name; options.crs = crs; options.units = 'FEET'; options.revision = 1
      }
      setAnalysisResult(await runEngineeringTask(workflow.id, { type, stageCode, options }))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Engineering analysis failed.') }
    finally { setBusy(false) }
  }

  async function extract(file: File | undefined) {
    if (!file) return
    setExtracting(true); setError(null); setResult(null)
    try {
      const next = await extractSitePlanDocument(workflow.id, file, crs, 'FEET')
      setExtraction(next)
      if (next.geometry.length > 0) {
        setGeometry(JSON.stringify(next.geometry, null, 2))
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Document extraction failed.') }
    finally { setExtracting(false) }
  }

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

  return <div role="dialog" aria-modal="true" aria-labelledby="generator-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
    <h2 id="generator-title" className="text-xl font-bold" style={{ color: '#1A2B4A' }}>Generate concept site plan</h2><p className="mt-1 text-sm text-slate-500">Supply coordinate geometry with source provenance. Concept output is never a boundary survey or permit-ready plan.</p>
    <div className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-700"><p className="font-semibold text-cyan-700">Your deliverable</p><p className="mt-1">A printable PDF plan sheet plus coordinate-accurate DXF and GeoJSON. Included features depend on the plat or survey source: boundaries, structures, setbacks, easements, contours, utilities, drainage, buffers, and disturbance areas are shown only when supplied.</p></div>
    <form onSubmit={submit} className="mt-5 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-600">Plan name<input required value={name} onChange={event => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-900" /></label><label className="text-sm font-medium text-slate-600">Coordinate reference system<input required value={crs} onChange={event => setCrs(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-mono text-slate-900" /></label></div>
      <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-600">Upload plat or survey
        <input type="file" accept="application/pdf" disabled={extracting} onChange={event => void extract(event.target.files?.[0])} className="mt-2 block w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-2 file:font-semibold file:text-white" />
        <span className="mt-2 block text-xs font-normal text-slate-400">PDF, JPG, or PNG up to 25 MB. Extraction is AI-assisted and must be checked against the source.</span>
      </label>
      {extracting && <p aria-live="polite" className="rounded-lg bg-cyan-50 p-3 text-sm text-cyan-700">Extracting boundaries, site features, dimensions, and source provenance…</p>}
      {extraction && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><p className="font-semibold">Review required: {extraction.geometry.length} features extracted from {extraction.filename}</p>{extraction.warnings.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">{extraction.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>}</div>}
      <label className="block text-sm font-medium text-slate-600">Geometry JSON<textarea required rows={14} value={geometry} onChange={event => setGeometry(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-900" /></label>
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="font-semibold" style={{ color: '#1A2B4A' }}>Terrain, drainage, BMP and drawing workers</h3>
        <p className="mt-1 text-xs text-slate-500">Inputs must reference verified sources. Results remain preliminary until professional approval.</p>
        <textarea rows={8} value={analysisInput} onChange={event => setAnalysisInput(event.target.value)}
          className="mt-3 w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-900" />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => void runTask('GENERATE_SURFACE', 'TERRAIN_GRADING_ANALYSIS')} className="rounded-lg border border-cyan-500 px-3 py-2 text-xs font-bold text-cyan-700">Build terrain</button>
          <button type="button" disabled={busy} onClick={() => void runTask('GENERATE_CONTOURS', 'TERRAIN_GRADING_ANALYSIS')} className="rounded-lg border border-cyan-500 px-3 py-2 text-xs font-bold text-cyan-700">Generate contours</button>
          <button type="button" disabled={busy} onClick={() => void runTask('ANALYZE_DRAINAGE', 'STORMWATER_SCREENING')} className="rounded-lg border border-blue-500 px-3 py-2 text-xs font-bold text-blue-700">Run runoff/BMP screen</button>
          <button type="button" disabled={busy} onClick={() => void runTask('RUN_COMPLIANCE_AUDIT', 'COMPLIANCE_AUDIT')} className="rounded-lg border border-amber-500 px-3 py-2 text-xs font-bold text-amber-700">Run compliance</button>
          <button type="button" disabled={busy} onClick={() => void runTask('GENERATE_DXF', 'DRAWING_REPORT_GENERATION')} className="rounded-lg border border-emerald-500 px-3 py-2 text-xs font-bold text-emerald-700">Queue DXF/PDF/preview</button>
        </div>
        {analysisResult !== null && <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-white border border-slate-200 p-3 text-xs text-slate-700">{JSON.stringify(analysisResult, null, 2)}</pre>}
      </section>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {result && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold text-emerald-700">Concept artifacts generated</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => downloadBase64(`site-plan-r${result.summary.revision}.pdf`, result.artifact.pdfBase64, 'application/pdf')} className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-bold text-white">Download PDF</button><button type="button" onClick={() => download(`site-plan-r${result.summary.revision}.dxf`, result.artifact.dxf, 'application/dxf')} className="rounded-lg border border-emerald-500 px-3 py-2 text-sm font-bold text-emerald-700">Download DXF</button><button type="button" onClick={() => download(`site-plan-r${result.summary.revision}.geojson`, JSON.stringify(result.artifact.geoJson, null, 2), 'application/geo+json')} className="rounded-lg border border-emerald-500 px-3 py-2 text-sm font-bold text-emerald-700">Download GeoJSON</button></div></div>}
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} disabled={busy || extracting} className="rounded-lg border border-slate-300 px-4 py-2 text-slate-600">Close</button><button type="submit" disabled={busy || extracting} className="rounded-lg bg-[#2ABFBF] px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? 'Generating…' : 'Generate concept'}</button></div>
    </form>
  </div></div>
}
