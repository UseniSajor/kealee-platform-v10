'use client'

import { Users, Building2, CreditCard, FolderKanban, TrendingUp, ArrowUpRight, Activity, AlertTriangle } from 'lucide-react'

const STATS = [
  { label: 'Total Users', value: '1,247', change: '+34 this week', icon: Users, color: '#2ABFBF', bg: 'rgba(42, 191, 191, 0.1)' },
  { label: 'Organizations', value: '89', change: '+6 this month', icon: Building2, color: '#38A169', bg: 'rgba(56, 161, 105, 0.1)' },
  { label: 'Active Subscriptions', value: '67', change: '$48,750 MRR', icon: CreditCard, color: '#E8793A', bg: 'rgba(232, 121, 58, 0.1)' },
  { label: 'Total Projects', value: '312', change: '+18 this month', icon: FolderKanban, color: '#1A2B4A', bg: 'rgba(26, 43, 74, 0.1)' },
]

const RECENT_SIGNUPS = [
  { name: 'Jennifer Adams', email: 'jennifer@email.com', role: 'Owner', date: '2 hours ago' },
  { name: 'Summit Construction LLC', email: 'info@summitgc.com', role: 'Contractor', date: '5 hours ago' },
  { name: 'Greenfield Capital', email: 'ops@greenfield.com', role: 'Developer', date: '1 day ago' },
  { name: 'Maria Gonzalez', email: 'maria@email.com', role: 'Owner', date: '1 day ago' },
  { name: 'Apex Builders Inc', email: 'admin@apexbuilders.com', role: 'Contractor', date: '2 days ago' },
]

const ALERTS = [
  { message: 'Stripe webhook handler has 3 failed events in the last hour', severity: 'warning' },
  { message: 'GHL sync rate limit hit - contact creation queued', severity: 'warning' },
  { message: 'User support ticket #4521 unresolved for 48+ hours', severity: 'info' },
]

export default function AdminOverviewPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Admin Overview</h1>
        <p className="mt-1 text-sm text-gray-600">Platform health and key metrics</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2.5" style={{ backgroundColor: stat.bg }}>
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold" style={{ color: '#1A2B4A' }}>{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Signups */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-display mb-4 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Recent Signups</h2>
          <div className="space-y-3">
            {RECENT_SIGNUPS.map((user, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: '#F7FAFC' }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium text-white" style={{ backgroundColor: '#1A2B4A' }}>
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'rgba(42, 191, 191, 0.1)', color: '#1A2B4A' }}>{user.role}</span>
                  <p className="mt-0.5 text-xs text-gray-400">{user.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-display mb-4 text-lg font-semibold" style={{ color: '#1A2B4A' }}>System Alerts</h2>
          <div className="space-y-3">
            {ALERTS.map((alert, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{
                backgroundColor: alert.severity === 'warning' ? 'rgba(232, 121, 58, 0.05)' : 'rgba(42, 191, 191, 0.05)'
              }}>
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{
                  color: alert.severity === 'warning' ? '#E8793A' : '#2ABFBF'
                }} />
                <p className="text-sm text-gray-700">{alert.message}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl p-4" style={{ backgroundColor: '#F7FAFC' }}>
            <h3 className="font-display mb-2 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">API Uptime (30d)</p>
                <p className="text-lg font-bold" style={{ color: '#38A169' }}>99.95%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Response Time</p>
                <p className="text-lg font-bold" style={{ color: '#1A2B4A' }}>142ms</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Error Rate (24h)</p>
                <p className="text-lg font-bold" style={{ color: '#1A2B4A' }}>0.12%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Active Sessions</p>
                <p className="text-lg font-bold" style={{ color: '#1A2B4A' }}>47</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
