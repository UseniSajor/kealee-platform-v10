'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Building2, CircleHelp, Plus, Search } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { extractCollection, whiteLabelApi, type WhiteLabelTenant } from '@/lib/white-label-api'

export default function WhiteLabelTenantsPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<WhiteLabelTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [orgId, setOrgId] = useState('')
  const [eligibleOrgs, setEligibleOrgs] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await whiteLabelApi.listTenants()
      setTenants(extractCollection<WhiteLabelTenant>(result, ['tenants', 'orgs', 'items']))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Professional tenants could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!showCreate) return
    void api.getOrgs({ limit: 100 }).then(result => {
      const configured = new Set(tenants.map(tenant => tenant.orgId))
      setEligibleOrgs((result.orgs ?? []).filter(org => !configured.has(org.id)))
    }).catch(cause => setError(cause instanceof Error ? cause.message : 'Organizations could not be loaded.'))
  }, [showCreate, tenants])

  const visible = useMemo(() => tenants.filter(tenant => {
    const match = `${tenant.companyName} ${tenant.org?.name ?? ''} ${tenant.org?.slug ?? ''}`.toLowerCase().includes(search.toLowerCase())
    // A missing clientType belongs to the legacy professional Org model. Explicit homeowners stay out.
    const isProfessional = tenant.professional !== false && !['HOMEOWNER', 'CONSUMER'].includes((tenant.clientType ?? '').toUpperCase())
    return isProfessional && match
  }), [tenants, search])

  async function createTenant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const result = await whiteLabelApi.createTenant({ orgId, companyName: name.trim(), tier: 'MANAGED_BRANDED' })
      const created = result.tenant.profile
      setShowCreate(false)
      setName('')
      setOrgId('')
      if (created.orgId) router.push(`/white-label/${created.orgId}`)
      else await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tenant could not be created.')
    } finally {
      setSaving(false)
    }
  }

  return <ProtectedRoute><AppLayout>
    <div className="mx-auto max-w-6xl p-6 sm:p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Kealee control plane</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Professional White Label</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Provision and service branded operating systems for builders, developers, contractors, property operators, and agencies.</p>
        </div>
        <Button onClick={() => setShowCreate(current => !current)}><Plus className="h-4 w-4" />New professional tenant</Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
          <div className="flex items-start gap-3"><Building2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Professional tenants</p><p className="mt-1 text-blue-900/80">Each company owns its users, products, configuration, usage, and support history. Select a tenant to manage its service.</p></div></div>
        </div>
        <div className="rounded-xl border bg-white p-4 text-sm text-slate-600 md:max-w-xs">
          <div className="flex items-start gap-3"><CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" /><div><p className="font-semibold text-slate-900">Homeowner customers are separate</p><p className="mt-1">Homeowners use consumer and project services. They are never provisioned as white label tenants.</p></div></div>
        </div>
      </div>

      {showCreate && <form onSubmit={createTenant} className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Create professional tenant</h2>
        <p className="mt-1 text-sm text-slate-500">Choose an existing professional organization. Create one in <Link href="/orgs/new" className="text-blue-700 underline">Organizations</Link> first if needed.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Professional organization<select className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={orgId} onChange={event => { setOrgId(event.target.value); const selected = eligibleOrgs.find(org => org.id === event.target.value); if (selected) setName(selected.name) }} required><option value="">Select organization</option>{eligibleOrgs.map(org => <option key={org.id} value={org.id}>{org.name} ({org.slug})</option>)}</select></label>
          <label className="text-sm font-medium">Branded company name<Input className="mt-1" value={name} onChange={event => setName(event.target.value)} required maxLength={160} placeholder="Example Builders" /></label>
        </div>
        <div className="mt-4 flex gap-2"><Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create tenant'}</Button><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button></div>
      </form>}

      <div className="mb-4 flex items-center justify-between gap-4">
        <label className="relative block w-full max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input aria-label="Search professional tenants" className="pl-9" placeholder="Search companies" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <span className="text-sm text-slate-500">{loading ? 'Loading…' : `${visible.length} professional tenant${visible.length === 1 ? '' : 's'}`}</span>
      </div>
      {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error} <button type="button" className="ml-2 font-semibold underline" onClick={() => void load()}>Retry</button></div>}
      {loading ? <div className="space-y-3" aria-label="Loading professional tenants">{[0, 1, 2].map(item => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div> : visible.length === 0 ? <div className="rounded-xl border border-dashed bg-white px-6 py-12 text-center"><Building2 className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-3 font-semibold text-slate-900">{search ? 'No matching companies' : 'No professional tenants yet'}</h2><p className="mt-1 text-sm text-slate-500">{search ? 'Try another search.' : 'Create the first branded company workspace to begin provisioning.'}</p></div> : <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {visible.map(tenant => <Link key={tenant.orgId} href={`/white-label/${tenant.orgId}`} className="flex items-center gap-4 border-b p-5 transition-colors last:border-b-0 hover:bg-slate-50 focus-visible:bg-slate-50">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Building2 className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{tenant.companyName}</p><p className="truncate text-sm text-slate-500">{tenant.org?.slug || tenant.orgId}</p></div>
          <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'secondary'}>{tenant.status || 'Status unavailable'}</Badge><ArrowRight className="h-4 w-4 text-slate-400" />
        </Link>)}
      </div>}
    </div>
  </AppLayout></ProtectedRoute>
}
