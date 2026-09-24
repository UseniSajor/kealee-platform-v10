'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTenantBranding } from './TenantBrandingProvider'

type TokenProvider = () => Promise<string | null>

interface Profile {
  companyName: string
  productName?: string | null
  logoUrl?: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  supportEmail?: string | null
  supportPhone?: string | null
}

interface SelfTenant {
  profile: Profile
  products: Array<{ enabled: boolean; productTemplate: { key: string; name: string } }>
  plan?: { planName: string; supportTier: string; billingStatus: string } | null
  usageRollups: Array<{ id: string; metric: string; quantity: string | number; periodStart: string; periodEnd: string }>
  evaluationSuites: Array<{ id: string; name: string; active: boolean }>
}

export interface TenantSelfServiceSettingsProps {
  apiUrl: string
  getToken: TokenProvider
  organizationId?: string | null
}

export function TenantSelfServiceSettings({ apiUrl, getToken, organizationId }: TenantSelfServiceSettingsProps) {
  const presentation = useTenantBranding()
  const orgId = organizationId || presentation?.orgId
  const [tenant, setTenant] = useState<SelfTenant | null>(null)
  const [draft, setDraft] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const request = useCallback(async (path: string, init?: RequestInit) => {
    if (!orgId) throw new Error('Select a professional organization or open this page from its verified domain.')
    const token = await getToken()
    if (!token) throw new Error('Sign in to manage this company.')
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-kealee-org-id': orgId,
        ...(init?.headers ?? {}),
      },
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.message || payload.error || 'Request failed')
    return payload
  }, [apiUrl, getToken, orgId])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await request('/white-label/self')
      setTenant(payload.tenant)
      setDraft(payload.tenant.profile)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Company settings could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [request])

  useEffect(() => { void load() }, [load])

  const products = useMemo(
    () => tenant?.products.filter((item) => item.enabled).map((item) => item.productTemplate.name) ?? [],
    [tenant],
  )

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!draft) return
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const payload = await request('/white-label/self/profile', {
        method: 'PATCH',
        body: JSON.stringify(draft),
      })
      setDraft(payload.profile)
      setTenant((current) => current ? { ...current, profile: payload.profile } : current)
      setNotice('Company branding saved.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Company settings could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="h-56 animate-pulse rounded-xl bg-slate-100" aria-label="Loading company settings" />
  if (error && !tenant) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}<button className="ml-2 font-semibold underline" onClick={() => void load()}>Retry</button></div>
  if (!tenant || !draft) return null

  const field = (key: keyof Profile, label: string, type = 'text') => (
    <label className="text-sm font-medium text-slate-700">{label}
      <input
        className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
        type={type}
        value={String(draft[key] ?? '')}
        onChange={(event) => setDraft((current) => current ? { ...current, [key]: event.target.value || null } : current)}
      />
    </label>
  )

  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Professional administration</p><h1 className="mt-1 text-3xl font-semibold text-slate-950">Company operating system</h1><p className="mt-2 text-sm text-slate-600">Manage delegated branding and review licensed products, usage, and quality controls. Homeowner accounts are not managed here.</p></header>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    <form onSubmit={save} className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Brand and support</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {field('companyName', 'Company name')}{field('productName', 'Product name')}{field('logoUrl', 'Logo URL', 'url')}
        {field('supportEmail', 'Support email', 'email')}{field('supportPhone', 'Support phone')}
        {field('primaryColor', 'Primary color')}{field('secondaryColor', 'Secondary color')}{field('accentColor', 'Accent color')}
      </div>
      <button disabled={saving} className="mt-5 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save company settings'}</button>
    </form>
    <section className="grid gap-4 md:grid-cols-3">
      <article className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Licensed products</h2><p className="mt-2 text-sm text-slate-600">{products.length ? products.join(', ') : 'No active products'}</p></article>
      <article className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Plan</h2><p className="mt-2 text-sm text-slate-600">{tenant.plan?.planName || 'Not assigned'} · {tenant.plan?.supportTier || 'Support unavailable'}</p></article>
      <article className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Quality controls</h2><p className="mt-2 text-sm text-slate-600">{tenant.evaluationSuites.length} evaluation suite{tenant.evaluationSuites.length === 1 ? '' : 's'}</p></article>
    </section>
    <section className="rounded-xl border bg-white p-6"><h2 className="text-lg font-semibold">Recent measured usage</h2>{tenant.usageRollups.length ? <div className="mt-4 divide-y rounded-lg border">{tenant.usageRollups.slice(0, 20).map((item) => <div key={item.id} className="flex justify-between gap-4 p-3 text-sm"><span>{item.metric.replace(/_/g, ' ')}</span><span className="tabular-nums">{Number(item.quantity).toLocaleString()}</span></div>)}</div> : <p className="mt-3 text-sm text-slate-500">No usage rollups are available yet.</p>}</section>
  </div>
}
