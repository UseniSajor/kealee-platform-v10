'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, FlaskConical, Loader2, Plus } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'

interface Study {
  id: string
  title: string
  status: string
  targetUnits?: number | null
  targetSqFt?: number | string | null
  updatedAt: string
  scenarios: Array<{ id: string; name: string; irr?: number | null; roi?: number | null }>
}

export default function FeasibilityPage() {
  const [studies, setStudies] = useState<Study[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { orgs } = await apiFetch<{ orgs: Array<{ id: string }> }>('/orgs/my')
        if (!orgs?.length) return
        const result = await apiFetch<{ studies: Study[] }>(`/api/v1/feasibility/studies?orgId=${encodeURIComponent(orgs[0].id)}`)
        if (active) setStudies(result.studies)
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load feasibility studies')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1A2B4A]">Feasibility studies</h1>
          <p className="mt-1 text-sm text-gray-500">Only persisted project records and sourced scenario outputs are shown.</p>
        </div>
        <Link href="/pipeline/analyze" className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" /> Start feasibility
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Financial and site metrics are hidden until their source assumptions and deterministic validation records exist.</p>
        </div>
      </div>

      {loading ? <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div>
        : error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        : !studies.length ? <div className="mt-6 rounded-xl border border-gray-200 bg-white p-10 text-center">
          <FlaskConical className="mx-auto h-9 w-9 text-gray-300" />
          <p className="mt-3 font-medium text-gray-800">No persisted feasibility studies</p>
          <p className="mt-1 text-sm text-gray-500">Create a parcel and project to begin sourced analysis.</p>
        </div>
        : <div className="mt-6 grid gap-4">
          {studies.map(study => <article key={study.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="font-semibold text-[#1A2B4A]">{study.title}</h2>
                <p className="mt-1 text-xs text-gray-500">Updated {new Date(study.updatedAt).toLocaleString()}</p></div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{study.status}</span>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div><span className="text-gray-500">Target units</span><p className="font-semibold">{study.targetUnits ?? 'Not recorded'}</p></div>
              <div><span className="text-gray-500">Target area</span><p className="font-semibold">{study.targetSqFt ? `${Number(study.targetSqFt).toLocaleString()} sf` : 'Not recorded'}</p></div>
              <div><span className="text-gray-500">Persisted scenarios</span><p className="font-semibold">{study.scenarios.length}</p></div>
            </div>
            <p className="mt-4 text-xs font-medium text-amber-800">Preliminary feasibility / not for construction / subject to licensed professional review.</p>
          </article>)}
        </div>}
    </div>
  )
}
