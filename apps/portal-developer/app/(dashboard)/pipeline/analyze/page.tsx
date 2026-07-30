'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Loader2, MapPin, ShieldCheck } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api/client'
import { supabase } from '@/lib/supabase'

async function ensureOrgId(): Promise<string> {
  const { orgs } = await apiFetch<{ orgs: Array<{ id: string }> }>('/orgs/my')
  if (orgs?.length) return orgs[0].id
  const { data: { user } } = await supabase.auth.getUser()
  const label = String(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'developer')
  const slugBase = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'developer'
  const slug = `${slugBase}-${(user?.id ?? Date.now().toString(36)).slice(0, 8)}`.toLowerCase()
  const { org } = await apiFetch<{ org: { id: string } }>('/orgs', {
    method: 'POST',
    body: JSON.stringify({ name: `${label}'s Organization`, slug }),
  })
  return org.id
}

export default function AnalyzePage() {
  const router = useRouter()
  const [parcel, setParcel] = useState({ address: '', acreage: '', apn: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createProject() {
    if (!parcel.address.trim()) {
      setError('Enter the property address before continuing.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const orgId = await ensureOrgId()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be signed in to create a project')
      const { parcel: createdParcel } = await apiFetch<{ parcel: { id: string } }>('/api/v1/land/parcels', {
        method: 'POST',
        body: JSON.stringify({
          orgId,
          label: parcel.address.trim(),
          parcelNumber: parcel.apn.trim() || undefined,
          address: parcel.address.trim(),
          acreage: parcel.acreage ? Number(parcel.acreage) : undefined,
          identifiedBy: user.id,
        }),
      })
      const { project } = await apiFetch<{ project: { id: string } }>(
        `/api/v1/land/parcels/${createdParcel.id}/convert`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: `${parcel.address.trim()} — Development feasibility`,
            orgId,
            ownerId: user.id,
            description: 'Developer feasibility intake. Zoning and scenario results are pending sourced analysis.',
          }),
        },
      )
      router.push(`/pipeline/${project.id}`)
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message
        : reason instanceof Error ? reason.message : 'Unable to create the project')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/pipeline" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to pipeline
      </Link>
      <h1 className="font-display text-2xl font-bold text-[#1A2B4A]">Start development feasibility</h1>
      <p className="mt-2 text-sm text-gray-600">
        Create the parcel and project record first. Kealee will display zoning, yield, cost, and returns only after sourced analysis has completed.
      </p>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">No sample feasibility results</p>
            <p className="mt-1">
              Zone, setbacks, overlays, units, costs, NOI, ROI, and IRR remain unavailable until Kealee has authoritative sources and deterministic scenario outputs for this parcel.
            </p>
          </div>
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <label className="block text-sm font-medium text-gray-700">Property address</label>
        <div className="relative mt-1">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={parcel.address} onChange={event => setParcel({ ...parcel, address: event.target.value })}
            placeholder="Enter the full property address" className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">Acreage, if known
            <input value={parcel.acreage} onChange={event => setParcel({ ...parcel, acreage: event.target.value })}
              inputMode="decimal" placeholder="0.25" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm" />
          </label>
          <label className="text-sm font-medium text-gray-700">APN / parcel number, if known
            <input value={parcel.apn} onChange={event => setParcel({ ...parcel, apn: event.target.value })}
              placeholder="Parcel identifier" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm" />
          </label>
        </div>
        <div className="mt-5 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
          Preliminary feasibility / not for construction / subject to licensed professional review.
        </div>
        <button type="button" onClick={() => void createProject()} disabled={submitting}
          className="mt-5 inline-flex items-center rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create parcel and continue
        </button>
      </section>
    </div>
  )
}
