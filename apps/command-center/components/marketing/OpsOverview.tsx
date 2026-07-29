'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart2,
  RefreshCw,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { OpsPanel, StatCard } from './ops-ui'
import type { FunnelStats } from '@/lib/marketing/funnel-stats'
import type { ChannelBucketMetrics } from '@/lib/marketing/channel-attribution'

type DatePreset = '7d' | '30d' | '90d' | 'all'

interface OpsPayload {
  live: boolean
  error?: string
  stats: FunnelStats | null
  leadsToday: number
  paidToday: number
  dripByStatus: Record<string, number>
  dateRange?: { from: string; to: string }
  periodSpend?: { paid_ads: number; marketing_saas: number; source: string }
  config?: {
    siteUrl: string
    hasCronSecret: boolean
    hasSupabaseAdmin: boolean
  }
  quickLinks?: { label: string; href: string; external?: boolean }[]
}

function rangeQuery(preset: DatePreset): string {
  const to = new Date()
  const toStr = to.toISOString().slice(0, 10)
  if (preset === 'all') return '?preset=all'
  const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
  return `?from=${from.toISOString().slice(0, 10)}&to=${toStr}`
}

function ChannelComparisonTable({ buckets }: { buckets: ChannelBucketMetrics[] }) {
  const active = buckets.filter(b => b.leads > 0)
  if (active.length === 0) {
    return <p className="text-sm text-slate-500">No leads recorded for this period.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b text-xs uppercase tracking-wide text-slate-500" style={{ borderColor: '#E2E8F0' }}>
            <th className="pb-2 pr-3 font-semibold">Channel</th>
            <th className="pb-2 pr-3 font-semibold">Projects</th>
            <th className="pb-2 pr-3 font-semibold">Leads</th>
            <th className="pb-2 pr-3 font-semibold">Sales</th>
            <th className="pb-2 pr-3 font-semibold">Revenue</th>
            <th className="pb-2 pr-3 font-semibold">Est. cost</th>
            <th className="pb-2 font-semibold">ROI</th>
          </tr>
        </thead>
        <tbody>
          {active.map(b => (
            <tr key={b.bucket} className="border-b border-slate-100">
              <td className="py-2.5 pr-3 font-medium text-slate-900">{b.label}</td>
              <td className="py-2.5 pr-3 text-slate-700">{b.projects}</td>
              <td className="py-2.5 pr-3 text-slate-700">
                {b.leads}
                <span className="ml-1 text-xs text-slate-500">({b.conversionRate} paid)</span>
              </td>
              <td className="py-2.5 pr-3 text-slate-700">{b.sales}</td>
              <td className="py-2.5 pr-3 font-medium" style={{ color: '#2ABFBF' }}>
                {b.revenueUsd}
              </td>
              <td className="py-2.5 pr-3 text-slate-500">{b.costUsd}</td>
              <td className="py-2.5 text-slate-700">{b.roi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Breakdown({
  title,
  data,
}: {
  title: string
  data: Record<string, number>
}) {
  const entries = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  if (entries.length === 0) return null
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="space-y-1">
        {entries.map(([k, n]) => (
          <li key={k} className="flex justify-between text-sm">
            <span className="truncate pr-2 text-slate-600">{k.replace(/_/g, ' ')}</span>
            <span className="font-medium text-slate-900">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function OpsOverview() {
  const [data, setData] = useState<OpsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState<DatePreset>('30d')

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/marketing/ops${rangeQuery(preset)}`)
      .then(r => r.json())
      .then(j => setData(j))
      .catch(() => setData({ live: false, error: 'Request failed', stats: null, leadsToday: 0, paidToday: 0, dripByStatus: {} }))
      .finally(() => setLoading(false))
  }, [preset])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#2ABFBF' }} />
      </div>
    )
  }

  if (!data?.live || !data.stats) {
    return (
      <OpsPanel title="Marketing ops" icon={AlertCircle} accent="#EF4444">
        <p className="text-sm text-rose-300">{data?.error ?? 'Could not load ops data'}</p>
        <p className="mt-2 text-xs text-slate-500">
          Set <code className="text-teal-700">SUPABASE_SERVICE_ROLE_KEY</code> on Command Center.
        </p>
        <button
          type="button"
          onClick={load}
          className="mt-4 text-sm font-medium"
          style={{ color: '#2ABFBF' }}
        >
          Retry
        </button>
      </OpsPanel>
    )
  }

  const s = data.stats

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">Funnel + automation health (live Supabase)</p>
          {data.dateRange && (
            <p className="text-xs text-slate-400">
              {data.dateRange.from} → {data.dateRange.to}
              {s.channelComparison.costSource && (
                <span className="ml-2 rounded px-1.5 py-0.5" style={{ backgroundColor: '#E2E8F0' }}>
                  cost: {s.channelComparison.costSource}
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['7d', '30d', '90d', 'all'] as DatePreset[]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className="rounded-lg border px-2.5 py-1 text-xs"
              style={{
                borderColor: preset === p ? '#2ABFBF' : '#E2E8F0',
                color: preset === p ? '#2ABFBF' : '#64748B',
              }}
            >
              {p === 'all' ? 'All' : p}
            </button>
          ))}
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900"
            style={{ borderColor: '#E2E8F0' }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {!data.config?.hasCronSecret && (
        <div
          className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: '#E8793A40', backgroundColor: 'rgba(232,121,58,0.08)', color: '#FDBA74' }}
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <code>CRON_SECRET</code> not set — card media generation and manual cron triggers will fail until
            configured on Command Center and web-main.
          </span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total leads" value={s.totalLeads} sub={`${s.last7DaysLeads} last 7d`} />
        <StatCard label="Conversion" value={s.conversionRate} sub={`${s.converted} converted`} accent="#E8793A" />
        <StatCard label="Leads today" value={data.leadsToday} sub={`${data.paidToday} paid today`} />
        <StatCard
          label="Drip pending"
          value={s.sequencesPending}
          sub={`${s.last7DaysPaid} paid (7d)`}
          accent="#A78BFA"
        />
      </div>

      <OpsPanel title="Organic vs paid ads vs marketing SaaS" icon={BarChart2} accent="#2ABFBF">
        <ChannelComparisonTable buckets={s.channelComparison.buckets} />
        <div className="mt-4 flex flex-wrap gap-4 border-t pt-4 text-sm" style={{ borderColor: '#E2E8F0' }}>
          <div>
            <span className="text-slate-500">Total revenue </span>
            <span className="font-semibold text-slate-900">
              ${(s.channelComparison.totals.revenueCents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Total est. cost </span>
            <span className="font-semibold text-slate-900">
              ${(s.channelComparison.totals.estimatedCostCents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Blended ROI </span>
            <span className="font-semibold" style={{ color: '#E8793A' }}>
              {s.channelComparison.totals.roi}
            </span>
          </div>
        </div>
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-slate-500">
          {s.channelComparison.notes.map((note: string) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </OpsPanel>

      <div className="grid gap-4 lg:grid-cols-3">
        <OpsPanel title="Pipeline breakdown" icon={BarChart2}>
          <div className="space-y-4">
            <Breakdown title="By source" data={s.bySource} />
            <Breakdown title="By project path" data={s.byProjectPath} />
            <Breakdown title="By status" data={s.byStatus} />
          </div>
        </OpsPanel>

        <OpsPanel title="Attribution" icon={BarChart2} accent="#E8793A">
          <Breakdown title="By UTM source" data={s.byUtmSource} />
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg border p-3" style={{ borderColor: '#E2E8F0' }}>
              <p className="text-lg font-bold text-slate-900">{s.paidCount}</p>
              <p className="text-xs text-slate-500">Paid</p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: '#E2E8F0' }}>
              <p className="text-lg font-bold text-slate-900">{s.conceptReadyCount}</p>
              <p className="text-xs text-slate-500">Concept ready</p>
            </div>
          </div>
        </OpsPanel>

        <OpsPanel title="Quick links" icon={CheckCircle2}>
          <ul className="space-y-2">
            {(data.quickLinks ?? []).map(link => (
              <li key={link.href}>
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:underline"
                    style={{ color: '#2ABFBF' }}
                  >
                    {link.label}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <Link href={link.href} className="text-sm hover:underline" style={{ color: '#2ABFBF' }}>
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          {Object.keys(data.dripByStatus).length > 0 && (
            <div className="mt-4 border-t pt-4" style={{ borderColor: '#E2E8F0' }}>
              <Breakdown title="Drip queue (7d)" data={data.dripByStatus} />
            </div>
          )}
        </OpsPanel>
      </div>
    </div>
  )
}
