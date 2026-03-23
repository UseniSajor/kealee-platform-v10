'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FlaskConical, Users, CreditCard, ShoppingCart, HardHat,
  Building2, FileCheck, Zap, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Trash2, ClipboardList, ChevronDown, ChevronUp,
  ArrowRight, Loader2,
} from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

type ResultState = { success: boolean; data: unknown } | null

// ── Helpers ────────────────────────────────────────────────────────────────

async function callApi(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${API_BASE}/test${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  return { success: res.ok, data }
}

function StatusBadge({ status }: { status: string }) {
  const color = {
    pass: '#2ABFBF', fail: '#EF4444', warn: '#F59E0B', info: '#6B7280',
  }[status] ?? '#6B7280'
  const icon = {
    pass: <CheckCircle2 className="h-3.5 w-3.5" />,
    fail: <XCircle className="h-3.5 w-3.5" />,
    warn: <AlertTriangle className="h-3.5 w-3.5" />,
    info: <AlertTriangle className="h-3.5 w-3.5" />,
  }[status]
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${color}20`, color }}>
      {icon} {status.toUpperCase()}
    </span>
  )
}

function ResultPanel({ result }: { result: ResultState }) {
  const [open, setOpen] = useState(true)
  if (!result) return null
  return (
    <div className="mt-3 rounded-xl border" style={{
      borderColor: result.success ? '#2ABFBF40' : '#EF444440',
      backgroundColor: result.success ? '#0D2A2A' : '#2A0D0D',
    }}>
      <button className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold"
        style={{ color: result.success ? '#2ABFBF' : '#FCA5A5' }}
        onClick={() => setOpen(o => !o)}>
        <span className="flex items-center gap-2">
          {result.success ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {result.success ? 'Success' : 'Error'}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <pre className="overflow-x-auto px-4 pb-4 text-xs leading-relaxed text-gray-300">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      )}
    </div>
  )
}

function TriggerButton({
  label, onClick, loading, color = '#E8793A',
}: { label: string; onClick: () => void; loading: boolean; color?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
      style={{ backgroundColor: color }}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
      {label}
    </button>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function TestPanelPage() {
  const [status, setStatus] = useState<any>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [checklist, setChecklist] = useState<any[]>([])
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, ResultState>>({})

  const setLoad = (key: string, val: boolean) => setLoading(l => ({ ...l, [key]: val }))
  const setResult = (key: string, result: ResultState) => setResults(r => ({ ...r, [key]: result }))

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true)
    const [s, e, c] = await Promise.all([
      callApi('/status'),
      callApi('/events?limit=30'),
      callApi('/checklist'),
    ])
    setStatus(s.data)
    setEvents((e.data as any)?.events ?? [])
    setChecklist((c.data as any)?.checklist ?? [])
    setStatusLoading(false)
  }, [])

  useEffect(() => { refreshStatus() }, [refreshStatus])

  async function run(key: string, path: string, method = 'POST', body?: unknown) {
    setLoad(key, true)
    const result = await callApi(path, method, body)
    setResult(key, result)
    setLoad(key, false)
    // Refresh events after each trigger
    const e = await callApi('/events?limit=30')
    setEvents((e.data as any)?.events ?? [])
  }

  const testMode = (status as any)?.testMode
  const users: any[] = (status as any)?.users ?? []
  const stripeStatus = (status as any)?.stripeProducts ?? {}

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#2ABFBF20' }}>
            <FlaskConical className="h-5 w-5" style={{ color: '#2ABFBF' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>Test Panel</h1>
            <p className="text-sm text-gray-500">End-to-end flow simulation and verification</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {testMode !== undefined && (
            <span className="rounded-full px-3 py-1 text-xs font-semibold"
              style={testMode
                ? { backgroundColor: '#2ABFBF20', color: '#2ABFBF' }
                : { backgroundColor: '#EF444420', color: '#EF4444' }}>
              {testMode ? 'TEST MODE ACTIVE' : 'TEST MODE DISABLED'}
            </span>
          )}
          <button onClick={refreshStatus}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            <RefreshCw className={`h-4 w-4 ${statusLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {!testMode && !statusLoading && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
          <p className="text-sm font-semibold text-orange-700">TEST_MODE is not enabled</p>
          <p className="mt-1 text-sm text-orange-600">
            Set <code className="rounded bg-orange-100 px-1">TEST_MODE=true</code> in the API service environment variables to enable test triggers.
          </p>
        </div>
      )}

      {/* QA Checklist */}
      {checklist.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5" style={{ color: '#1A2B4A' }} />
            <h2 className="text-base font-bold font-display" style={{ color: '#1A2B4A' }}>QA Checklist</h2>
          </div>
          <div className="space-y-3">
            {checklist.map((item: any) => (
              <div key={item.item} className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.item}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{item.detail}</p>
                  {item.action && <code className="mt-1 text-xs text-gray-400">{item.action}</code>}
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Part 2: Test Users */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" style={{ color: '#1A2B4A' }} />
            <h2 className="text-base font-bold font-display" style={{ color: '#1A2B4A' }}>Test Users</h2>
          </div>
          <TriggerButton label="Seed All Test Users" onClick={() => run('seed', '/seed-users')} loading={!!loading.seed} color="#1A2B4A" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u: any) => (
            <div key={u.key} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{u.name}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
              <StatusBadge status={u.exists ? 'pass' : 'fail'} />
            </div>
          ))}
        </div>
        <ResultPanel result={results.seed ?? null} />
      </div>

      {/* Part 3A: AI Concept Purchases */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" style={{ color: '#E8793A' }} />
          <h2 className="text-base font-bold font-display" style={{ color: '#1A2B4A' }}>AI Concept Purchases</h2>
          <span className="text-xs text-gray-400">→ Stripe checkout → webhook → ConceptPackageOrder</span>
        </div>
        <div className="flex flex-wrap gap-3 mb-2">
          {[
            { tier: 'essential',    label: 'Essential — $585',   color: '#2ABFBF' },
            { tier: 'professional', label: 'Professional — $775', color: '#1A2B4A' },
            { tier: 'premium',      label: 'Premium — $999',      color: '#805AD5' },
            { tier: 'white_glove',  label: 'White Glove — $1,999', color: '#E8793A' },
          ].map(({ tier, label, color }) => (
            <TriggerButton key={tier} label={label}
              onClick={() => run(`concept_${tier}`, '/trigger/concept', 'POST', { tier })}
              loading={!!loading[`concept_${tier}`]} color={color} />
          ))}
        </div>
        {['essential', 'professional', 'premium', 'white_glove'].map(tier => (
          <ResultPanel key={tier} result={results[`concept_${tier}`] ?? null} />
        ))}
      </div>

      {/* Part 3B: Contractor Subscriptions */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <HardHat className="h-5 w-5" style={{ color: '#E8793A' }} />
          <h2 className="text-base font-bold font-display" style={{ color: '#1A2B4A' }}>Contractor Subscriptions</h2>
          <span className="text-xs text-gray-400">→ Stripe subscription → plan assigned → permissions updated</span>
        </div>
        <div className="flex flex-wrap gap-3 mb-2">
          {[
            { plan: 'starter', label: 'Starter',    color: '#2ABFBF' },
            { plan: 'growth',  label: 'Growth',     color: '#E8793A' },
            { plan: 'pro',     label: 'Pro Growth', color: '#1A2B4A' },
          ].map(({ plan, label, color }) => (
            <TriggerButton key={plan} label={label}
              onClick={() => run(`sub_${plan}`, '/trigger/subscription', 'POST', { plan })}
              loading={!!loading[`sub_${plan}`]} color={color} />
          ))}
        </div>
        {['starter', 'growth', 'pro'].map(plan => (
          <ResultPanel key={plan} result={results[`sub_${plan}`] ?? null} />
        ))}
      </div>

      {/* Part 3C: Lead Purchase */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" style={{ color: '#2ABFBF' }} />
          <h2 className="text-base font-bold font-display" style={{ color: '#1A2B4A' }}>Lead Purchase</h2>
          <span className="text-xs text-gray-400">→ lead paid → contractor assigned → confirmation emails</span>
        </div>
        <TriggerButton label="Simulate Lead Purchase"
          onClick={() => run('lead', '/trigger/lead')} loading={!!loading.lead} color="#2ABFBF" />
        <ResultPanel result={results.lead ?? null} />
      </div>

      {/* Part 3D: Get Contractor Now — Rule Verification */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileCheck className="h-5 w-5" style={{ color: '#38A169' }} />
          <h2 className="text-base font-bold font-display" style={{ color: '#1A2B4A' }}>Get Contractor Now — Rules</h2>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg border border-gray-100 p-3">
            <p className="font-semibold text-gray-600 mb-1">Case A</p>
            <p className="text-gray-400">Concept ✓ / No permit</p>
            <p className="font-bold mt-1" style={{ color: '#38A169' }}>→ SHOW button</p>
          </div>
          <div className="rounded-lg border border-gray-100 p-3">
            <p className="font-semibold text-gray-600 mb-1">Case B</p>
            <p className="text-gray-400">Concept ✓ / Permit near approval</p>
            <p className="font-bold mt-1" style={{ color: '#38A169' }}>→ SHOW button</p>
          </div>
          <div className="rounded-lg border border-gray-100 p-3">
            <p className="font-semibold text-gray-600 mb-1">Case C</p>
            <p className="text-gray-400">No concept</p>
            <p className="font-bold mt-1" style={{ color: '#EF4444' }}>→ HIDE button</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'gcn_a', label: 'Test Case A', params: '?hasConcept=true&permitRequired=false&permitStatus=none' },
            { key: 'gcn_b', label: 'Test Case B', params: '?hasConcept=true&permitRequired=true&permitStatus=NEAR_APPROVAL' },
            { key: 'gcn_c', label: 'Test Case C', params: '?hasConcept=false&permitRequired=false&permitStatus=none' },
          ].map(({ key, label, params }) => (
            <TriggerButton key={key} label={label}
              onClick={() => run(key, `/get-contractor-now${params}`, 'GET')}
              loading={!!loading[key]} color="#38A169" />
          ))}
        </div>
        {['gcn_a', 'gcn_b', 'gcn_c'].map(k => (
          <ResultPanel key={k} result={results[k] ?? null} />
        ))}
      </div>

      {/* Part 3E: Opportunity Assignment */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5" style={{ color: '#805AD5' }} />
          <h2 className="text-base font-bold font-display" style={{ color: '#1A2B4A' }}>Opportunity Assignment</h2>
          <span className="text-xs text-gray-400">→ Pro Growth contractor prioritized in queue</span>
        </div>
        <div className="flex gap-3">
          <TriggerButton label="Post-Concept (no permit)"
            onClick={() => run('opp_post', '/trigger/opportunity', 'POST', { type: 'post_concept' })}
            loading={!!loading.opp_post} color="#805AD5" />
          <TriggerButton label="Permit Approved"
            onClick={() => run('opp_permit', '/trigger/opportunity', 'POST', { type: 'permit_approved' })}
            loading={!!loading.opp_permit} color="#1A2B4A" />
        </div>
        <ResultPanel result={results.opp_post ?? null} />
        <ResultPanel result={results.opp_permit ?? null} />
      </div>

      {/* Part 3F: Contract Award + 3% Fee */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5" style={{ color: '#E8793A' }} />
          <h2 className="text-base font-bold font-display" style={{ color: '#1A2B4A' }}>Contract Award + 3% Platform Fee</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {[
            { val: 5000000,  label: '$50k contract' },
            { val: 7500000,  label: '$75k contract' },
            { val: 15000000, label: '$150k contract' },
            { val: 50000000, label: '$500k contract' },
          ].map(({ val, label }) => (
            <TriggerButton key={val} label={label}
              onClick={() => run(`contract_${val}`, '/trigger/contract', 'POST', { contractValue: val })}
              loading={!!loading[`contract_${val}`]} color="#E8793A" />
          ))}
        </div>
        {[5000000, 7500000, 15000000, 50000000].map(val => (
          <ResultPanel key={val} result={results[`contract_${val}`] ?? null} />
        ))}
      </div>

      {/* Part 5: Stripe Products */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" style={{ color: '#1A2B4A' }} />
            <h2 className="text-base font-bold font-display" style={{ color: '#1A2B4A' }}>Stripe Products</h2>
            <span className="text-xs text-gray-400">
              {stripeStatus.configured ?? 0}/25 price IDs configured
            </span>
          </div>
          <TriggerButton label="Validate" onClick={() => run('stripe', '/stripe', 'GET')} loading={!!loading.stripe} color="#1A2B4A" />
        </div>
        <ResultPanel result={results.stripe ?? null} />
      </div>

      {/* Part 6: Event Log */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" style={{ color: '#2ABFBF' }} />
            <h2 className="text-base font-bold font-display" style={{ color: '#1A2B4A' }}>Test Event Log</h2>
            <span className="text-xs text-gray-400">{events.length} recent events</span>
          </div>
          <button onClick={async () => {
            const e = await callApi('/events?limit=30')
            setEvents((e.data as any)?.events ?? [])
          }} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-gray-400">No test events yet. Run some triggers above.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-1.5">
            {events.map((ev: any, i: number) => (
              <div key={i} className="flex items-start justify-between rounded-lg border border-gray-100 px-3 py-2">
                <div>
                  <code className="text-xs font-semibold" style={{ color: '#2ABFBF' }}>{ev.type}</code>
                  <span className="ml-2 text-xs text-gray-400">{ev.entityType} · {ev.entityId?.slice(0, 8)}…</span>
                </div>
                <span className="text-xs text-gray-400">
                  {ev.createdAt ? new Date(ev.createdAt).toLocaleTimeString() : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cleanup */}
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
        <div className="mb-3 flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-500" />
          <h2 className="text-base font-bold font-display text-red-700">Cleanup Test Data</h2>
        </div>
        <p className="mb-3 text-sm text-red-600">
          Deletes all test concept orders, subscriptions, leads, fee records, and TEST_ events.
          Test users are preserved.
        </p>
        <TriggerButton label="Delete All Test Data"
          onClick={() => run('cleanup', '/cleanup', 'DELETE')} loading={!!loading.cleanup} color="#EF4444" />
        <ResultPanel result={results.cleanup ?? null} />
      </div>
    </div>
  )
}
