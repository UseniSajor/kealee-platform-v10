'use client'

import { BarChart3, TrendingUp, DollarSign, Users, Building2, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const KPI_CARDS = [
  { label: 'Monthly Revenue', value: '$48,750', change: '+12.3%', positive: true, icon: DollarSign },
  { label: 'Active Users', value: '284', change: '+8.5%', positive: true, icon: Users },
  { label: 'Projects Created', value: '47', change: '+3', positive: true, icon: Building2 },
  { label: 'Avg Lead Score', value: '72.4', change: '-2.1', positive: false, icon: TrendingUp },
]

const REVENUE_BY_PACKAGE = [
  { name: 'PM Package A (Self-Service)', revenue: 4500, count: 15, bar: 15 },
  { name: 'PM Package B (Guided)', revenue: 18000, count: 12, bar: 60 },
  { name: 'PM Package C (Full-Service)', revenue: 22500, count: 5, bar: 75 },
  { name: 'PM Package D (Enterprise)', revenue: 3750, count: 1, bar: 12 },
  { name: 'Permit Packages', revenue: 8400, count: 7, bar: 28 },
  { name: 'Design Packages', revenue: 12600, count: 4, bar: 42 },
]

const FUNNEL_STAGES = [
  { stage: 'Website Visitors', count: 12400, pct: 100 },
  { stage: 'Lead Captured', count: 847, pct: 6.8 },
  { stage: 'Quote Requested', count: 234, pct: 1.9 },
  { stage: 'Checkout Started', count: 89, pct: 0.7 },
  { stage: 'Paid', count: 44, pct: 0.35 },
]

const TOP_MARKETS = [
  { city: 'Austin, TX', projects: 28, revenue: '$31,200' },
  { city: 'Dallas, TX', projects: 8, revenue: '$8,400' },
  { city: 'Houston, TX', projects: 6, revenue: '$5,600' },
  { city: 'San Antonio, TX', projects: 3, revenue: '$2,100' },
  { city: 'Other', projects: 2, revenue: '$1,450' },
]

const funnelColors = ['#1A2B4A', '#2ABFBF', '#38A169', '#E8793A', '#38A169']

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Platform KPIs, revenue metrics, and conversion funnel</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPI_CARDS.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border p-5" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
            <div className="flex items-center justify-between">
              <kpi.icon className="h-5 w-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span className={`flex items-center gap-1 text-xs font-medium`} style={{ color: kpi.positive ? '#38A169' : '#E53E3E' }}>
                {kpi.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {kpi.change}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Package */}
        <div className="rounded-xl border p-6" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
          <h2 className="font-display mb-4 text-lg font-semibold text-white">Revenue by Package</h2>
          <div className="space-y-4">
            {REVENUE_BY_PACKAGE.map((pkg) => (
              <div key={pkg.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{pkg.name}</span>
                  <span className="font-medium text-white">${pkg.revenue.toLocaleString()} ({pkg.count})</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#0F1A2E' }}>
                  <div className="h-full rounded-full" style={{ width: `${pkg.bar}%`, backgroundColor: '#2ABFBF' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="rounded-xl border p-6" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
          <h2 className="font-display mb-4 text-lg font-semibold text-white">Conversion Funnel</h2>
          <div className="space-y-3">
            {FUNNEL_STAGES.map((stage, i) => (
              <div key={stage.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{stage.stage}</span>
                  <span className="font-medium text-white">{stage.count.toLocaleString()} ({stage.pct}%)</span>
                </div>
                <div className="h-8 w-full overflow-hidden rounded-lg" style={{ backgroundColor: '#0F1A2E' }}>
                  <div className="flex h-full items-center justify-center rounded-lg text-xs font-medium text-white"
                    style={{ width: `${Math.max(stage.pct, 5)}%`, backgroundColor: funnelColors[i] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Markets */}
        <div className="rounded-xl border p-6 lg:col-span-2" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
          <h2 className="font-display mb-4 text-lg font-semibold text-white">Top Markets</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderColor: '#2A3D5F', borderBottomWidth: '1px' }}>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Market</th>
                  <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Projects</th>
                  <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Share</th>
                </tr>
              </thead>
              <tbody>
                {TOP_MARKETS.map((m) => (
                  <tr key={m.city} style={{ borderColor: 'rgba(42, 61, 95, 0.5)', borderBottomWidth: '1px' }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{m.city}</td>
                    <td className="px-4 py-3 text-right text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{m.projects}</td>
                    <td className="px-4 py-3 text-right text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{m.revenue}</td>
                    <td className="px-4 py-3 text-right text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{Math.round((m.projects / 47) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
