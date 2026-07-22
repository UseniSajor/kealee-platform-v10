'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle, Clock, FileText, Loader2, Map, ShieldCheck } from 'lucide-react'
import { getAuthoritativeProjectStatus, listProjects } from '@/lib/api/owner'
import type { AuthoritativeProjectStatus, Project } from '@/lib/api/owner'

const STAGES = ['PARCEL_RESOLUTION', 'DOCUMENT_COLLECTION', 'FEASIBILITY', 'PLAN_GENERATION',
  'COMPLIANCE_AUDIT', 'PROFESSIONAL_REVIEW', 'SUBMISSION_CORRECTIONS']
const label = (value: string) => value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export default function SitePlansPage() {
  const [rows, setRows] = useState<Array<{ project: Project; status: AuthoritativeProjectStatus }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
        {!workflow ? <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">A site-plan workflow has not been created for this project.</p> : <>
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
      </section>
    })}
  </div>
}
