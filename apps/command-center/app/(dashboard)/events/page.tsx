'use client'

import { useState } from 'react'
import { Radio, Search, Filter, AlertTriangle, CheckCircle, Info, Zap, RefreshCw } from 'lucide-react'

const EVENTS = [
  { id: '1', timestamp: '2026-03-10T14:32:08Z', source: 'stripe', type: 'webhook', message: 'checkout.session.completed - $82,500 (Kitchen Remodel)', severity: 'info' },
  { id: '2', timestamp: '2026-03-10T14:30:55Z', source: 'twin-engine', type: 'health_check', message: 'Twin health degraded: Pool House - score dropped to 64%', severity: 'warning' },
  { id: '3', timestamp: '2026-03-10T14:28:12Z', source: 'ghl', type: 'sync', message: 'Contact sync failed: API rate limit (429) - retry queued', severity: 'error' },
  { id: '4', timestamp: '2026-03-10T14:25:00Z', source: 'keabot', type: 'conversation', message: 'New lead captured: jennifer.a@email.com - Kitchen Remodel interest (score: 82)', severity: 'info' },
  { id: '5', timestamp: '2026-03-10T14:22:33Z', source: 'ai-engine', type: 'completion', message: 'Report generation completed: Q1 2026 portfolio summary (3.2s)', severity: 'success' },
  { id: '6', timestamp: '2026-03-10T14:20:00Z', source: 'scheduler', type: 'cron', message: 'Daily twin health check started for 32 active twins', severity: 'info' },
  { id: '7', timestamp: '2026-03-10T14:15:12Z', source: 'supabase', type: 'auth', message: 'New user signup: contractor portal - summit@construction.com', severity: 'info' },
  { id: '8', timestamp: '2026-03-10T14:10:45Z', source: 'stripe', type: 'webhook', message: 'invoice.paid - $4,500 PM Package B monthly', severity: 'success' },
  { id: '9', timestamp: '2026-03-10T14:05:00Z', source: 'worker', type: 'job', message: 'Estimation job completed: ADU Build - 142 line items generated', severity: 'success' },
  { id: '10', timestamp: '2026-03-10T14:00:00Z', source: 'redis', type: 'pubsub', message: 'Channel: project-updates - 847 messages processed in last hour', severity: 'info' },
]

const severityConfig: Record<string, { icon: typeof Info; color: string; dot: string }> = {
  info: { icon: Info, color: '#2ABFBF', dot: '#2ABFBF' },
  success: { icon: CheckCircle, color: '#38A169', dot: '#38A169' },
  warning: { icon: AlertTriangle, color: '#E8793A', dot: '#E8793A' },
  error: { icon: AlertTriangle, color: '#E53E3E', dot: '#E53E3E' },
}

const sourceColors: Record<string, { bg: string; text: string }> = {
  stripe: { bg: 'rgba(167, 139, 250, 0.15)', text: '#A78BFA' },
  ghl: { bg: 'rgba(42, 191, 191, 0.15)', text: '#2ABFBF' },
  'twin-engine': { bg: 'rgba(42, 191, 191, 0.15)', text: '#4DD4D4' },
  keabot: { bg: 'rgba(56, 161, 105, 0.15)', text: '#38A169' },
  'ai-engine': { bg: 'rgba(232, 121, 58, 0.15)', text: '#E8793A' },
  scheduler: { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.6)' },
  supabase: { bg: 'rgba(56, 161, 105, 0.15)', text: '#38A169' },
  worker: { bg: 'rgba(232, 121, 58, 0.15)', text: '#E8793A' },
  redis: { bg: 'rgba(220, 38, 38, 0.15)', text: '#E53E3E' },
}

export default function EventsPage() {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')

  const filtered = EVENTS.filter(e => {
    const matchSearch = e.message.toLowerCase().includes(search.toLowerCase()) || e.source.includes(search.toLowerCase())
    const matchSev = severityFilter === 'all' || e.severity === severityFilter
    return matchSearch && matchSev
  })

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Event Stream</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Real-time events from all platform services</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium" style={{ backgroundColor: '#2A3D5F', color: 'rgba(255,255,255,0.7)' }}>
          <RefreshCw className="h-4 w-4" />
          Auto-refresh: ON
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input type="text" placeholder="Filter events..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none"
            style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }} />
        </div>
        <div className="flex gap-2">
          {['all', 'error', 'warning', 'success', 'info'].map((s) => (
            <button key={s} onClick={() => setSeverityFilter(s)}
              className="rounded-lg px-3 py-2 text-xs font-medium capitalize"
              style={{
                backgroundColor: severityFilter === s ? 'rgba(42, 191, 191, 0.15)' : '#2A3D5F',
                color: severityFilter === s ? '#2ABFBF' : 'rgba(255,255,255,0.5)'
              }}>{s}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((event) => {
          const sev = severityConfig[event.severity]
          const src = sourceColors[event.source] || { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.6)' }
          return (
            <div key={event.id} className="flex items-start gap-3 rounded-lg border p-4" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
              <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: sev.dot }} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded px-1.5 py-0.5 text-xs font-mono font-medium" style={{ backgroundColor: src.bg, color: src.text }}>{event.source}</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>{event.type}</span>
                </div>
                <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{event.message}</p>
              </div>
              <span className="flex-shrink-0 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
