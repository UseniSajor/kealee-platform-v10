'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Building2, CheckCircle2, Clock3, Globe2, LifeBuoy, Play, Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { extractCollection, extractObject, whiteLabelApi, type WhiteLabelBranding, type WhiteLabelDeployment, type WhiteLabelDomain, type WhiteLabelEvaluation, type WhiteLabelPlan, type WhiteLabelProduct, type WhiteLabelSupportSession, type WhiteLabelTenant, type WhiteLabelUsage } from '@/lib/white-label-api'

type Tab = 'overview' | 'branding' | 'domains' | 'products' | 'modules' | 'plan' | 'usage' | 'deployment' | 'evaluations' | 'support'
const tabs: Array<{ key: Tab; label: string }> = [
  { key: 'overview', label: 'Overview' }, { key: 'branding', label: 'Branding' }, { key: 'domains', label: 'Domains' },
  { key: 'products', label: 'Products' }, { key: 'modules', label: 'Modules' }, { key: 'plan', label: 'Plan' },
  { key: 'usage', label: 'Usage' }, { key: 'deployment', label: 'Deployment' }, { key: 'evaluations', label: 'Evaluations' }, { key: 'support', label: 'Support access' },
]

const BRAND_FIELDS: Array<{ key: keyof WhiteLabelBranding; label: string; placeholder?: string; type?: string }> = [
  { key: 'companyName', label: 'Display company name' }, { key: 'logoUrl', label: 'Logo URL', type: 'url' },
  { key: 'faviconUrl', label: 'Favicon URL', type: 'url' }, { key: 'primaryColor', label: 'Primary color', placeholder: '#1A2B4A' },
  { key: 'secondaryColor', label: 'Secondary color', placeholder: '#2ABFBF' }, { key: 'accentColor', label: 'Accent color', placeholder: '#F59E0B' },
  { key: 'emailFromName', label: 'Email sender name' }, { key: 'emailFromAddress', label: 'Email sender address', type: 'email' },
  { key: 'emailReplyToAddress', label: 'Email reply-to address', type: 'email' },
  { key: 'supportEmail', label: 'Support email', type: 'email' }, { key: 'supportPhone', label: 'Support phone' },
  { key: 'reportHeader', label: 'Report header' }, { key: 'reportFooter', label: 'Report footer' }, { key: 'legalDisclaimer', label: 'Legal disclaimer' },
]

function responseMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback
}

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6"><div className="mb-5"><h2 className="text-lg font-semibold text-slate-900">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{children}</section>
}

function Empty({ message }: { message: string }) { return <p className="rounded-lg border border-dashed bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{message}</p> }

function LabeledInput({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<Input className="mt-1" value={value} onChange={event => onChange(event.target.value)} type={type} placeholder={placeholder} /></label>
}

export default function WhiteLabelTenantPage() {
  const params = useParams<{ orgId: string }>()
  const orgId = params.orgId
  const [tab, setTab] = useState<Tab>('overview')
  const [tenant, setTenant] = useState<WhiteLabelTenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [panelLoading, setPanelLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [panelError, setPanelError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [branding, setBranding] = useState<WhiteLabelBranding>({})
  const [domains, setDomains] = useState<WhiteLabelDomain[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [catalog, setCatalog] = useState<WhiteLabelProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [entitlements, setEntitlements] = useState<Array<{ moduleKey: string; enabled: boolean }>>([])
  const [plan, setPlan] = useState<WhiteLabelPlan>({})
  const [usage, setUsage] = useState<WhiteLabelUsage>({})
  const [deployment, setDeployment] = useState<WhiteLabelDeployment>({})
  const [evaluations, setEvaluations] = useState<WhiteLabelEvaluation[]>([])
  const [newEvaluation, setNewEvaluation] = useState('')
  const [supportSessions, setSupportSessions] = useState<WhiteLabelSupportSession[]>([])
  const [supportReason, setSupportReason] = useState('')
  const [supportHours, setSupportHours] = useState('1')

  const loadTenant = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await whiteLabelApi.getTenant(orgId)
      const next = result.tenant.profile
      if (['HOMEOWNER', 'CONSUMER'].includes((next.clientType ?? '').toUpperCase()) || next.professional === false) {
        throw new Error('This customer belongs in homeowner operations, not the professional white label workspace.')
      }
      setTenant(next)
      setBranding(Object.fromEntries(BRAND_FIELDS.map(field => [field.key, next[field.key as keyof WhiteLabelTenant] ?? ''])) as WhiteLabelBranding)
      setDomains(result.tenant.domains ?? [])
      setSelectedProducts((result.tenant.products ?? []).filter(item => item.enabled !== false).map(item => item.productKey ?? item.productTemplate?.key ?? '').filter(Boolean))
      setPlan(result.tenant.plan ?? {})
      setDeployment(result.tenant.deployment ?? {})
    } catch (cause) {
      setError(responseMessage(cause, 'Professional tenant could not be loaded.'))
    } finally { setLoading(false) }
  }, [orgId])

  useEffect(() => { void loadTenant() }, [loadTenant])

  const loadPanel = useCallback(async (selected: Tab) => {
    if (selected === 'overview' || selected === 'branding') return
    setPanelLoading(true)
    setPanelError(null)
    try {
      if (selected === 'domains') setDomains(extractCollection<WhiteLabelDomain>(await whiteLabelApi.getDomains(orgId), ['domains', 'items']))
      if (selected === 'products') {
        const [catalogResponse, productsResponse] = await Promise.all([whiteLabelApi.getProductCatalog(), whiteLabelApi.getProducts(orgId)])
        setCatalog(extractCollection<WhiteLabelProduct>(catalogResponse, ['products', 'items']))
        setSelectedProducts((productsResponse.tenant.products ?? []).filter(item => item.enabled !== false).map(item => item.productKey ?? item.productTemplate?.key ?? '').filter(Boolean))
      }
      if (selected === 'modules') {
        const response = await api.getOrgEntitlements(orgId)
        setEntitlements((response.entitlements ?? []).map((item: { moduleKey: string; enabled: boolean }) => ({ moduleKey: item.moduleKey, enabled: item.enabled })))
      }
      if (selected === 'plan') setPlan(extractObject<WhiteLabelPlan>(await whiteLabelApi.getPlan(orgId), ['plan']))
      if (selected === 'usage') setUsage(extractObject<WhiteLabelUsage>(await whiteLabelApi.getUsage(orgId), ['usage']))
      if (selected === 'deployment') setDeployment(extractObject<WhiteLabelDeployment>(await whiteLabelApi.getDeployment(orgId), ['deployment']))
      if (selected === 'evaluations') setEvaluations(extractCollection<WhiteLabelEvaluation>(await whiteLabelApi.getEvaluations(orgId), ['evaluationSuites', 'evaluations', 'suites', 'items']))
      if (selected === 'support') setSupportSessions(extractCollection<WhiteLabelSupportSession>(await whiteLabelApi.getSupportAccess(orgId), ['sessions', 'supportAccess', 'items']))
    } catch (cause) {
      setPanelError(responseMessage(cause, 'This service could not be loaded.'))
    } finally { setPanelLoading(false) }
  }, [orgId])

  useEffect(() => { if (tenant) void loadPanel(tab) }, [tenant, tab, loadPanel])

  async function mutate(action: () => Promise<unknown>, success: string, reloadPanel = true) {
    setBusy(true)
    setPanelError(null)
    setNotice(null)
    try {
      await action()
      setNotice(success)
      if (reloadPanel) await loadPanel(tab)
      if (tab === 'branding' || tab === 'overview') await loadTenant()
    } catch (cause) { setPanelError(responseMessage(cause, 'The change could not be saved.')) }
    finally { setBusy(false) }
  }

  const totalUsage = useMemo(() => usage.items ?? (usage.summary ?? []).map(item => ({ metric: item.metric, quantity: Number(item._sum.quantity ?? 0), unit: item.unit, estimatedCost: Number(item._sum.unitCostCents ?? 0) / 100 })), [usage])

  return <ProtectedRoute><AppLayout><div className="mx-auto max-w-7xl p-6 sm:p-8">
    <Link href="/white-label" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"><ArrowLeft className="h-4 w-4" />Professional tenants</Link>
    {loading && !tenant ? <div className="space-y-4" aria-label="Loading tenant"><div className="h-14 w-1/2 animate-pulse rounded-lg bg-slate-100" /><div className="h-64 animate-pulse rounded-xl bg-slate-100" /></div> : error || !tenant ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error || 'Tenant unavailable.'}<Button className="ml-3" variant="outline" onClick={() => void loadTenant()}>Retry</Button></div> : <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Professional tenant</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{tenant.companyName}</h1><p className="mt-1 text-sm text-slate-500">{tenant.org?.slug || orgId}</p></div><div className="flex items-center gap-2"><Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'secondary'}>{tenant.status || 'Status unavailable'}</Badge><Button variant="outline" size="sm" onClick={() => { void loadTenant(); void loadPanel(tab) }}><RefreshCw className="h-4 w-4" />Refresh</Button></div></div>
      <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950"><ShieldCheck className="mr-2 inline h-4 w-4" />This workspace manages professional company tenants. Homeowner accounts and projects are serviced through consumer operations.</div>
      <nav aria-label="Tenant management" className="mb-6 flex gap-1 overflow-x-auto border-b pb-1">{tabs.map(item => <button key={item.key} type="button" onClick={() => { setTab(item.key); setNotice(null); setPanelError(null) }} className={`shrink-0 rounded-t-md px-3 py-2 text-sm font-medium ${tab === item.key ? 'border-b-2 border-blue-600 bg-blue-50 text-blue-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`} aria-current={tab === item.key ? 'page' : undefined}>{item.label}</button>)}</nav>
      {notice && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"><CheckCircle2 className="mr-2 inline h-4 w-4" />{notice}</p>}
      {panelError && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{panelError}<button className="ml-2 font-semibold underline" onClick={() => void loadPanel(tab)}>Retry</button></div>}
      {panelLoading && tab !== 'branding' && tab !== 'overview' ? <div className="h-40 animate-pulse rounded-xl bg-slate-100" /> : <div className="space-y-5">
        {tab === 'overview' && <><div className="grid gap-4 md:grid-cols-3"><SummaryCard label="Company" value={branding.companyName || tenant.companyName} detail="Branded identity" icon={Building2} /><SummaryCard label="Deployment" value={deployment.mode || 'Not configured'} detail={deployment.serviceLevel || 'Service level unavailable'} icon={Globe2} /><SummaryCard label="Plan" value={plan.planName || plan.planKey || 'Not assigned'} detail={plan.billingStatus || 'Billing status unavailable'} icon={ShieldCheck} /></div><Panel title="Service management" description="Choose an area to configure the professional operating system and maintain its service."><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{tabs.filter(item => item.key !== 'overview').map(item => <button key={item.key} type="button" onClick={() => setTab(item.key)} className="flex items-center justify-between rounded-lg border p-4 text-left text-sm font-medium text-slate-800 hover:border-blue-300 hover:bg-blue-50">{item.label}<ArrowUpRight className="h-4 w-4 text-slate-400" /></button>)}</div></Panel></>}
        {tab === 'branding' && <Panel title="Branding and communications" description="These settings are applied to the tenant portal, outbound email, reports, and generated documents where supported."><form onSubmit={event => { event.preventDefault(); void mutate(() => whiteLabelApi.updateProfile(orgId, branding), 'Branding saved.', false) }}><div className="grid gap-4 sm:grid-cols-2">{BRAND_FIELDS.map(field => <LabeledInput key={field.key} label={field.label} value={String(branding[field.key] ?? '')} type={field.type} placeholder={field.placeholder} onChange={value => setBranding(previous => ({ ...previous, [field.key]: value || null }))} />)}</div><Button type="submit" className="mt-5" disabled={busy}>{busy ? 'Saving…' : 'Save branding'}</Button></form></Panel>}
        {tab === 'domains' && <Panel title="Portal domains" description="Domain verification and certificate status are reported by the platform."><form onSubmit={event => { event.preventDefault(); if (newDomain.trim()) void mutate(async () => { await whiteLabelApi.addDomain(orgId, newDomain.trim().toLowerCase()); setNewDomain('') }, 'Domain added.') }} className="mb-5 flex flex-wrap gap-2"><Input aria-label="New domain" type="text" placeholder="portal.example.com" className="min-w-56 flex-1" value={newDomain} onChange={event => setNewDomain(event.target.value)} required /><Button type="submit" disabled={busy}><Plus className="h-4 w-4" />Add domain</Button></form>{domains.length === 0 ? <Empty message="No custom domains have been added." /> : <div className="divide-y rounded-lg border">{domains.map(domain => <div key={domain.id} className="flex flex-wrap items-center gap-3 p-4"><Globe2 className="h-5 w-5 text-slate-500" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{domain.hostname ?? domain.domain}</p><p className="text-xs text-slate-500">{domain.status || 'Verification pending'}{domain.certificateStatus ? ` · TLS ${domain.certificateStatus}` : ''}{domain.isPrimary ? ' · Primary' : ''}</p></div>{domain.status === 'PENDING' || domain.status === 'FAILED' ? <Button size="sm" variant="outline" disabled={busy} onClick={() => void mutate(() => whiteLabelApi.provisionDomain(orgId, domain.id), 'Domain provisioning started.')}>Provision</Button> : null}{domain.status === 'VERIFYING' ? <Button size="sm" variant="outline" disabled={busy} onClick={() => void mutate(() => whiteLabelApi.verifyDomain(orgId, domain.id), 'Domain verification checked.')}>Verify DNS</Button> : null}{!domain.isPrimary && domain.status === 'ACTIVE' && <Button size="sm" variant="outline" disabled={busy} onClick={() => void mutate(() => whiteLabelApi.updateDomain(orgId, domain.id, { isPrimary: true }), 'Primary domain updated.')}>Make primary</Button>}<Button size="icon-sm" variant="ghost" disabled={busy} aria-label={`Remove ${domain.hostname ?? domain.domain}`} onClick={() => { if (window.confirm('Remove this domain?')) void mutate(() => whiteLabelApi.removeDomain(orgId, domain.id), 'Domain removed.') }}><Trash2 className="h-4 w-4" /></Button></div>)}</div>}</Panel>}
        {tab === 'products' && <Panel title="Licensed operating systems" description="Select the product packages available to this professional tenant.">{catalog.length === 0 ? <Empty message="No product packages are available from the platform catalog." /> : <><div className="grid gap-3 md:grid-cols-2">{catalog.map(product => <label key={product.key} className="flex cursor-pointer gap-3 rounded-lg border p-4 hover:bg-slate-50"><input className="mt-1 h-4 w-4" type="checkbox" checked={selectedProducts.includes(product.key)} onChange={event => setSelectedProducts(previous => event.target.checked ? [...previous, product.key] : previous.filter(key => key !== product.key))} /><span><span className="block font-medium text-slate-900">{product.name}</span><span className="mt-1 block text-sm text-slate-500">{product.description || product.key}</span>{product.enabledModuleKeys?.length ? <span className="mt-2 block text-xs text-slate-500">Modules: {product.enabledModuleKeys.join(', ')}</span> : null}</span></label>)}</div><Button className="mt-5" disabled={busy} onClick={() => void mutate(() => whiteLabelApi.updateProducts(orgId, selectedProducts), 'Products updated.')}>{busy ? 'Saving…' : 'Save products'}</Button></>}</Panel>}
        {tab === 'modules' && <Panel title="Module entitlements" description="Module access is enforced by the platform. Changes here affect the company’s licensed features.">{entitlements.length === 0 ? <Empty message="No module entitlements are configured for this tenant." /> : <div className="divide-y rounded-lg border">{entitlements.map(entitlement => <div key={entitlement.moduleKey} className="flex items-center gap-3 p-4"><div className="flex-1"><p className="font-medium text-slate-900">{entitlement.moduleKey.replaceAll('_', ' ')}</p><p className="text-xs text-slate-500">{entitlement.enabled ? 'Enabled' : 'Disabled'}</p></div><Button size="sm" variant={entitlement.enabled ? 'outline' : 'default'} disabled={busy} onClick={() => void mutate(() => entitlement.enabled ? api.disableModule(orgId, entitlement.moduleKey) : api.enableModule(orgId, entitlement.moduleKey), `Module ${entitlement.enabled ? 'disabled' : 'enabled'}.`)}>{entitlement.enabled ? 'Disable' : 'Enable'}</Button></div>)}</div>}</Panel>}
        {tab === 'plan' && <Panel title="Plan and support tier" description="The platform plan determines subscription terms and usage allowances. Billing identifiers are displayed for reconciliation."><div className="grid gap-4 sm:grid-cols-2"><LabeledInput label="Plan key" value={plan.planKey ?? ''} onChange={value => setPlan(previous => ({ ...previous, planKey: value }))} /><LabeledInput label="Plan name" value={plan.planName ?? ''} onChange={value => setPlan(previous => ({ ...previous, planName: value }))} /><LabeledInput label="Base monthly amount (cents)" type="number" value={String(plan.baseMonthlyAmountCents ?? '')} onChange={value => setPlan(previous => ({ ...previous, baseMonthlyAmountCents: Number(value) }))} /><LabeledInput label="Support tier" value={plan.supportTier ?? ''} onChange={value => setPlan(previous => ({ ...previous, supportTier: value }))} /><ReadOnly label="Billing status" value={plan.billingStatus} /><ReadOnly label="Stripe customer" value={plan.stripeCustomerId} /><ReadOnly label="Stripe subscription" value={plan.stripeSubscriptionId} /></div><Button className="mt-5" disabled={busy || !plan.planKey || !plan.planName || plan.baseMonthlyAmountCents == null} onClick={() => void mutate(() => whiteLabelApi.updatePlan(orgId, { planKey: plan.planKey, planName: plan.planName, baseMonthlyAmountCents: plan.baseMonthlyAmountCents, supportTier: plan.supportTier }), 'Plan updated.')}>{busy ? 'Saving…' : 'Save plan'}</Button></Panel>}
        {tab === 'usage' && <Panel title="Measured usage" description="Only recorded usage is shown. Metering coverage and costs depend on enabled services.">{usage.periodStart || usage.periodEnd ? <p className="mb-4 text-sm text-slate-500">Period: {usage.periodStart || '—'} to {usage.periodEnd || '—'}</p> : null}{totalUsage.length === 0 ? <Empty message="No usage has been recorded for this period." /> : <div className="divide-y rounded-lg border">{totalUsage.map(item => <div key={item.metric} className="flex items-center justify-between gap-4 p-4"><span className="font-medium text-slate-800">{item.metric.replaceAll('_', ' ')}</span><span className="tabular-nums text-slate-700">{item.quantity.toLocaleString()} {item.unit || ''}{item.estimatedCost != null ? ` · $${item.estimatedCost.toFixed(2)}` : ''}</span></div>)}</div>}</Panel>}
        {tab === 'deployment' && <Panel title="Deployment service" description="Hosting mode and operational state for this tenant. Infrastructure changes require a coordinated deployment."><div className="grid gap-4 sm:grid-cols-2"><ReadOnly label="Mode" value={deployment.mode} /><ReadOnly label="Environment" value={deployment.environmentKey} /><ReadOnly label="Region" value={deployment.region} /><ReadOnly label="Service level" value={deployment.serviceLevel} /></div><p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Deployment configuration is managed through the Kealee release process. This view records the current service state.</p></Panel>}
        {tab === 'evaluations' && <Panel title="Customer evaluations" description="Versioned test suites capture expected outputs and support regression checks before model or prompt changes."><form onSubmit={event => { event.preventDefault(); if (newEvaluation.trim()) void mutate(async () => { await whiteLabelApi.createEvaluation(orgId, newEvaluation.trim()); setNewEvaluation('') }, 'Evaluation suite created.') }} className="mb-5 flex flex-wrap gap-2"><Input aria-label="Evaluation suite name" className="min-w-56 flex-1" placeholder="Suite name" value={newEvaluation} onChange={event => setNewEvaluation(event.target.value)} required /><Button disabled={busy} type="submit"><Plus className="h-4 w-4" />Create suite</Button></form>{evaluations.length === 0 ? <Empty message="No evaluation suites are configured for this tenant." /> : <div className="divide-y rounded-lg border">{evaluations.map(suite => <div key={suite.id} className="flex flex-wrap items-center gap-3 p-4"><div className="flex-1"><p className="font-medium">{suite.name}</p><p className="text-xs text-slate-500">{suite.status || 'No run status'}{suite.lastRunAt ? ` · Last run ${new Date(suite.lastRunAt).toLocaleString()}` : ''}{suite.passingRate != null ? ` · ${Math.round(suite.passingRate * 100)}% passing` : ''}</p></div><Button size="sm" variant="outline" disabled={busy} onClick={() => void mutate(() => whiteLabelApi.runEvaluation(orgId, suite.id), 'Evaluation run started.')}><Play className="h-4 w-4" />Run</Button></div>)}</div>}</Panel>}
        {tab === 'support' && <Panel title="Audited support access" description="Every tenant support session must have a reason and is recorded with its actor and expiration."><form onSubmit={event => { event.preventDefault(); if (supportReason.trim().length >= 10) void mutate(async () => { await whiteLabelApi.requestSupportAccess(orgId, supportReason.trim(), ['TENANT_READ'], new Date(Date.now() + Number(supportHours) * 3600000).toISOString()); setSupportReason('') }, 'Read-only support access requested.') }} className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]"><Input aria-label="Reason for support access" placeholder="Reason for access (at least 10 characters)" value={supportReason} onChange={event => setSupportReason(event.target.value)} required minLength={10} /><select aria-label="Access duration" className="h-9 rounded-md border bg-white px-3 text-sm" value={supportHours} onChange={event => setSupportHours(event.target.value)}><option value="1">1 hour</option><option value="4">4 hours</option><option value="24">24 hours</option></select><Button disabled={busy} type="submit"><LifeBuoy className="h-4 w-4" />Request read access</Button></form>{supportSessions.length === 0 ? <Empty message="No support access sessions have been recorded." /> : <div className="divide-y rounded-lg border">{supportSessions.map(session => <div key={session.id} className="flex flex-wrap items-center gap-3 p-4"><Clock3 className="h-4 w-4 text-slate-500" /><div className="flex-1"><p className="font-medium">{session.reason}</p><p className="text-xs text-slate-500">{session.status || 'Status unavailable'}{session.actorId ? ` · ${session.actorId}` : ''}{session.expiresAt ? ` · Expires ${new Date(session.expiresAt).toLocaleString()}` : ''}</p></div>{!['REVOKED', 'DENIED', 'EXPIRED'].includes((session.status ?? '').toUpperCase()) && <Button size="sm" variant="outline" disabled={busy} onClick={() => void mutate(() => whiteLabelApi.closeSupportAccess(orgId, session.id), 'Support access revoked.')}>Revoke</Button>}</div>)}</div>}</Panel>}
      </div>}
    </>}
  </div></AppLayout></ProtectedRoute>
}

function SummaryCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Building2 }) {
  return <div className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><Icon className="h-5 w-5 text-blue-600" /></div><p className="mt-3 truncate text-xl font-semibold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>
}

function ReadOnly({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><p className="text-sm font-medium text-slate-700">{label}</p><p className="mt-1 min-h-9 rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-600">{value || 'Not configured'}</p></div>
}
