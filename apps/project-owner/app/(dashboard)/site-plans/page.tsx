'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle, Clock, FileText, Loader2, Map, ShieldCheck } from 'lucide-react'
import { getAuthoritativeProjectStatus, listProjects, startInfillSitePlan, uploadSitePlanSurvey } from '@/lib/api/owner'
import type { AuthoritativeProjectStatus, Project } from '@/lib/api/owner'

const STAGES = ['PARCEL_RESOLUTION', 'DOCUMENT_COLLECTION', 'FEASIBILITY', 'PLAN_GENERATION',
  'COMPLIANCE_AUDIT', 'PROFESSIONAL_REVIEW', 'SUBMISSION_CORRECTIONS']
const label = (value: string) => value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export default function SitePlansPage() {
  const [rows, setRows] = useState<Array<{ project: Project; status: AuthoritativeProjectStatus }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
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
      </section>
    })}
  </div>
}
