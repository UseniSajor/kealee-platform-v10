'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle, Clock, FileText, Loader2, Map, ShieldCheck } from 'lucide-react'
import { getAuthoritativeProjectStatus, getSiteFitScenario, listProjects, solveSiteFitScenario,
  startInfillSitePlan, uploadSitePlanSurvey } from '@/lib/api/owner'
import type { AuthoritativeProjectStatus, Project, SiteFitScenarioResult } from '@/lib/api/owner'
import { formatCatalogPrice, getPublicCatalogProduct } from '@kealee/core-rules'

const STAGES = ['PARCEL_RESOLUTION', 'DOCUMENT_COLLECTION', 'FEASIBILITY', 'PLAN_GENERATION',
  'COMPLIANCE_AUDIT', 'PROFESSIONAL_REVIEW', 'SUBMISSION_CORRECTIONS']
const label = (value: string) => value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
const DISCLAIMER = 'Preliminary feasibility / not for construction / subject to licensed professional review.'
const SITE_NEXT_STEPS = [
  {
    product: getPublicCatalogProduct('verified_site_feasibility'),
    text: 'Operations verifies zoning sources, parcel assumptions, overlays, and the buildable envelope.',
  },
  {
    product: getPublicCatalogProduct('project_launch'),
    text: 'Advance a selected footprint into a concept plan, quantities, and preliminary cost range.',
  },
  {
    product: getPublicCatalogProduct('professional_design'),
    text: 'Professional design review, permit coordination, and handoff toward Kealee design-build execution.',
  },
].filter((item): item is { product: NonNullable<typeof item.product>; text: string } => item.product !== null)

export default function SitePlansPage() {
  const [rows, setRows] = useState<Array<{ project: Project; status: AuthoritativeProjectStatus }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [siteFit, setSiteFit] = useState<Record<string, SiteFitScenarioResult>>({})
  async function refreshProject(project: Project) {
    const next = await getAuthoritativeProjectStatus(project.id)
    setRows(current => current.map(row => row.project.id === project.id ? { project, status: next } : row))
  }
  async function start(project: Project) {
    setBusyProjectId(project.id); setError(null)
    try {
      await startInfillSitePlan(project.id, 'US-MD-PRINCE_GEORGES')
      await refreshProject(project)
      setNotice('Site-plan order started. Upload the boundary/topographic survey to continue.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to start site-plan order') }
    finally { setBusyProjectId(null) }
  }
  async function upload(project: Project, workflowId: string, file?: File) {
    if (!file) return
    setBusyProjectId(project.id); setError(null)
    try {
      const result = await uploadSitePlanSurvey(workflowId, file, 'EPSG:2248')
      setNotice(`Survey accepted. Extraction job ${result.job.jobId} is queued for verification.`)
      await refreshProject(project)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to upload survey') }
    finally { setBusyProjectId(null) }
  }
  async function solve(project: Project, workflowId: string, form: HTMLFormElement) {
    const data = new FormData(form)
    const file = data.get('boundary')
    if (!(file instanceof File) || !file.size) return
    setBusyProjectId(project.id); setError(null)
    try {
      const parsed = JSON.parse(await file.text()) as { type?: string; coordinates?: number[][][];
        geometry?: { type?: string; coordinates?: number[][][] } }
      const boundary = parsed.type === 'Polygon' ? parsed : parsed.geometry
      if (boundary?.type !== 'Polygon' || !Array.isArray(boundary.coordinates)) {
        throw new Error('Upload a GeoJSON Polygon or Feature with a Polygon geometry.')
      }
      const queued = await solveSiteFitScenario(workflowId, {
        name: String(data.get('name') || 'Concept feasibility'),
        boundary: { type: 'Polygon', coordinates: boundary.coordinates },
        crs: String(data.get('crs') || 'EPSG:2248'),
        sourceReference: String(data.get('sourceReference')),
        setback: Math.min(Number(data.get('frontSetback')), Number(data.get('rearSetback')),
          Number(data.get('leftSetback')), Number(data.get('rightSetback'))),
        setbacks: {
          front: Number(data.get('frontSetback')),
          rear: Number(data.get('rearSetback')),
          leftSide: Number(data.get('leftSetback')),
          rightSide: Number(data.get('rightSetback')),
        },
        frontageDirection: String(data.get('frontageDirection')) as 'NORTH' | 'EAST' | 'SOUTH' | 'WEST',
        targetUnits: Number(data.get('targetUnits')),
        averageUnitSqFt: Number(data.get('averageUnitSqFt')),
        stories: Number(data.get('stories')),
        typology: String(data.get('typology')) as Parameters<typeof solveSiteFitScenario>[1]['typology'],
      })
      setNotice(`Two deterministic site-fit options are being generated in job ${queued.scenario.jobId}.`)
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        const result = await getSiteFitScenario(workflowId, queued.scenario.scenarioId)
        if (result.scenario.siteFitStatus !== 'SOLVING') {
          setSiteFit(current => ({ ...current, [workflowId]: result.scenario }))
          break
        }
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to solve site feasibility') }
    finally { setBusyProjectId(null) }
  }
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { projects } = await listProjects()
        const statuses = await Promise.all(projects.map(async project => ({
          project, status: await getAuthoritativeProjectStatus(project.id),
        })))
        if (active) setRows(statuses)
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load site-plan status')
      } finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [])

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><AlertTriangle className="mb-2 h-5 w-5" />{error}</div>
  return <div className="space-y-6">
    <div><h1 className="font-display text-2xl font-bold text-slate-900">Site-plan production</h1>
      <p className="mt-1 text-sm text-slate-500">Verified project records, professional review, and permit progress.</p></div>
    {notice && <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">{notice}</div>}
    {!rows.length && <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
      <Map className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-medium text-slate-700">No projects yet</p>
      <Link href="/projects/new" className="mt-3 inline-block text-sm font-medium text-teal-700">Start a project</Link></div>}
    {rows.map(({ project, status }) => {
      const workflow = status.sitePlan
      return <section key={project.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div>
          <Link href={`/project/${project.id}`} className="font-semibold text-slate-900 hover:text-teal-700">{project.name}</Link>
          <p className="mt-1 text-xs text-slate-500">Project phase: {status.project.currentPhase ? label(status.project.currentPhase) : 'Not recorded'}</p>
        </div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{workflow ? label(workflow.status) : 'Not ordered'}</span></div>
        {!workflow ? <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          <p>A site-plan workflow has not been created for this project.</p>
          <button type="button" disabled={busyProjectId === project.id} onClick={() => void start(project)}
            className="mt-3 rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
            {busyProjectId === project.id ? 'Starting…' : 'Start Prince George’s infill site plan'}
          </button>
          <p className="mt-2 text-xs">Preliminary automation requires survey verification and licensed professional review.</p>
        </div> : <>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{STAGES.map(stage => {
            const execution = workflow.stages.filter(item => item.stage === stage).at(-1)
            const complete = execution && ['COMPLETED', 'APPROVED'].includes(execution.status)
            const blocked = execution?.status === 'BLOCKED' || execution?.status === 'REJECTED'
            const Icon = complete ? CheckCircle : blocked ? AlertTriangle : Clock
            return <div key={stage} className={`rounded-lg border p-3 ${blocked ? 'border-red-200 bg-red-50' : complete ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
              <Icon className={`h-4 w-4 ${blocked ? 'text-red-600' : complete ? 'text-emerald-600' : 'text-slate-400'}`} />
              <p className="mt-2 text-xs font-semibold text-slate-800">{label(stage)}</p><p className="mt-1 text-xs text-slate-500">{execution ? label(execution.status) : 'Not started'}</p></div>
          })}</div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1"><FileText className="h-4 w-4" />{status.documents.length} project documents</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4" />{workflow.professionalReviews.filter(r => r.decision === 'APPROVED').length} professional approvals</span>
            <span>Verified {new Date(status.generatedAt).toLocaleString()}</span>
          </div></>}
        {workflow && <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label className="text-sm font-semibold text-slate-800">Upload boundary/topographic survey (PDF)</label>
          <input type="file" accept="application/pdf" disabled={busyProjectId === project.id}
            onChange={event => void upload(project, workflow.id, event.target.files?.[0])}
            className="mt-2 block w-full text-sm text-slate-600" />
          <p className="mt-2 text-xs text-slate-500">Extracted values remain unverified until reviewed beside the source survey.</p>
        </div>}
        {workflow && <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Concept site-fit scenarios</h3>
          <p className="mt-1 text-xs text-slate-600">Upload a projected GeoJSON boundary and confirm the sourced zoning assumptions used by the deterministic solver.</p>
          <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={event => {
            event.preventDefault(); void solve(project, workflow.id, event.currentTarget)
          }}>
            <label className="text-xs font-medium text-slate-700">Boundary GeoJSON
              <input name="boundary" type="file" accept=".geojson,application/geo+json,application/json" required className="mt-1 block w-full text-xs" />
            </label>
            <label className="text-xs font-medium text-slate-700">Scenario name
              <input name="name" defaultValue="Concept feasibility" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
            </label>
            <label className="text-xs font-medium text-slate-700">Projected CRS
              <input name="crs" defaultValue="EPSG:2248" pattern="EPSG:\d+" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
            </label>
            <label className="text-xs font-medium text-slate-700">Zoning source URL
              <input name="sourceReference" type="url" required placeholder="https://…" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
            </label>
            <label className="text-xs font-medium text-slate-700">Typology
              <select name="typology" defaultValue="SINGLE_FAMILY" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5">
                <option value="SINGLE_FAMILY">Single family</option><option value="TOWNHOME">Townhome</option>
                <option value="GARDEN_MULTIFAMILY">Garden multifamily</option><option value="WRAP_PODIUM_MULTIFAMILY">Wrap/podium</option>
                <option value="SURFACE_PARKING">Surface parking</option><option value="SMALL_MIXED_USE">Small mixed-use</option>
                <option value="ADU">ADU</option><option value="ADDITION">Home addition</option>
                <option value="POOL">Pool</option><option value="NEW_HOME">New home</option>
              </select>
            </label>
            <label className="text-xs font-medium text-slate-700">Front faces
              <select name="frontageDirection" defaultValue="NORTH" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5">
                <option value="NORTH">North</option><option value="EAST">East</option>
                <option value="SOUTH">South</option><option value="WEST">West</option>
              </select>
            </label>
            <label className="text-xs font-medium text-slate-700">Front setback (ft)
              <input name="frontSetback" type="number" min="0" step="0.1" defaultValue="25" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
            </label>
            <label className="text-xs font-medium text-slate-700">Rear setback (ft)
              <input name="rearSetback" type="number" min="0" step="0.1" defaultValue="20" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
            </label>
            <label className="text-xs font-medium text-slate-700">Left-side setback (ft)
              <input name="leftSetback" type="number" min="0" step="0.1" defaultValue="8" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
            </label>
            <label className="text-xs font-medium text-slate-700">Right-side setback (ft)
              <input name="rightSetback" type="number" min="0" step="0.1" defaultValue="8" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
            </label>
            <label className="text-xs font-medium text-slate-700">Target units
              <input name="targetUnits" type="number" min="1" defaultValue="1" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
            </label>
            <label className="text-xs font-medium text-slate-700">Average unit area (sf)
              <input name="averageUnitSqFt" type="number" min="1" defaultValue="1800" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
            </label>
            <label className="text-xs font-medium text-slate-700">Stories
              <input name="stories" type="number" min="1" defaultValue="2" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
            </label>
            <div className="flex items-end"><button type="submit" disabled={busyProjectId === project.id}
              className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
              {busyProjectId === project.id ? 'Solving…' : 'Generate two options'}
            </button></div>
          </form>
          <p className="mt-3 text-xs font-medium text-amber-800">{DISCLAIMER}</p>
          {siteFit[workflow.id]?.options.length ? <div className="mt-4 overflow-x-auto"><table className="min-w-full text-left text-xs">
            <thead><tr className="border-b text-slate-500"><th className="p-2">Option</th><th className="p-2">Units</th>
              <th className="p-2">GFA</th><th className="p-2">Coverage</th><th className="p-2">FAR</th>
              <th className="p-2">Parking</th><th className="p-2">Score</th><th className="p-2">Review</th></tr></thead>
            <tbody>{siteFit[workflow.id].options.map(option => <tr key={option.id} className="border-b border-slate-100">
              <td className="p-2 font-medium">{option.name}</td><td className="p-2">{option.unitCount}</td>
              <td className="p-2">{Number(option.grossFloorArea).toLocaleString()} sf</td><td className="p-2">{option.siteCoverage.toFixed(1)}%</td>
              <td className="p-2">{option.far.toFixed(2)}</td><td className="p-2">{option.parkingSpaces}</td>
              <td className="p-2">{option.score.toFixed(1)}</td><td className="p-2 text-amber-700">Required</td>
            </tr>)}</tbody></table></div> : null}
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {SITE_NEXT_STEPS.map(next => <div key={next.product.key} className="rounded-lg border border-teal-200 bg-teal-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{next.product.name}</p>
              <p className="mt-1 text-lg font-bold text-teal-800">{formatCatalogPrice(next.product)}</p>
              <p className="mt-2 text-xs text-slate-600">{next.text}</p>
              <Link href={next.product.href} className="mt-3 inline-block rounded bg-teal-700 px-3 py-2 text-xs font-semibold text-white">
                Continue
              </Link>
            </div>)}
          </div>
        </div>}
      </section>
    })}
  </div>
}
