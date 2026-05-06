'use client'

import { useEffect, useState } from 'react'
import { Search, AlertTriangle, CheckCircle, Info, RefreshCw, Loader2 } from 'lucide-react'

interface PlatformEvent {
  id: string
  timestamp: string
  source: string
  type: string
  message: string
  severity: 'info' | 'success' | 'warning' | 'error'
}

const severityConfig: Record<string, { icon: typeof Info; color: string; dot: string }> = {
  info:    { icon: Info,          color: '#2ABFBF', dot: '#2ABFBF' },
  success: { icon: CheckCircle,   color: '#38A169', dot: '#38A169' },
  warning: { icon: AlertTriangle, color: '#E8793A', dot: '#E8793A' },
  error:   { icon: AlertTriangle, color: '#E53E3E', dot: '#E53E3E' },
}

const sourceColors: Record<string, { bg: string; text: string }> = {
  stripe:       { bg: 'rgba(167, 139, 250, 0.15)', text: '#A78BFA' },
  web:          { bg: 'rgba(42, 191, 191, 0.15)',   text: '#2ABFBF' },
  'twin-engine':{ bg: 'rgba(42, 191, 191, 0.15)',   text: '#4DD4D4' },
  keabot:       { bg: 'rgba(56, 161, 105, 0.15)',   text: '#38A169' },
  'ai-engine':  { bg: 'rgba(232, 121, 58, 0.15)',   text: '#E8793A' },
  supabase:     { bg: 'rgba(56, 161, 105, 0.15)',   text: '#38A169' },
  worker:       { bg: 'rgba(232, 121, 58, 0.15)',   text: '#E8793A' },
}

const FALLBACK_EVENTS: PlatformEvent[] = [
  { id: 'f1', timestamp: new Date(Date.now() - 60000).toISOString(), source: 'stripe', type: 'webhook', message: 'checkout.session.completed — Kitchen Remodel · Sample Client', severity: 'success' },
  { id: 'f2', timestamp: new Date(Date.now() - 180000).toISOString(), source: 'web', type: 'intake', message: 'New intake submitted: exterior concept · Sample User', severity: 'info' },
  { id: 'f3', timestamp: new Date(Date.now() - 360000).toISOString(), source: 'keabot', type: 'conversation', message: 'New lead captured via KeaBot chat widget', severity: 'info' },
]

export default function EventsPage() {
  const [events, setEvents]           = useState<PlatformEvent[]>([])
  const [loading, setLoading]         = useState(true)
  const [live, setLive]               = useState(false)
  const [search, setSearch]           = useState('')
  const [severityFilter, setSeverity] = useState('all')
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  async function fetchEvents() {
    setLoading(true)
    try {
      const res = await fetch('/api/events')
      if (!res.ok) throw new Error('fetch failed')
      const body = await res.json()
      setEvents(body.events?.length ? body.events : FALLBACK_EVENTS)
      setLive(body.live ?? false)
    } catch {
      setEvents(FALLBACK_EVENTS)
      setLive(false)
    } finally {
      setLoading(false)
      setLastFetched(new Date())
    }
  }

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, 30_000) // auto-refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const filtered = events.filter(e => {
    const matchSearch = e.message.toLowerCase().includes(search.toLowerCase()) || e.source.includes(search.toLowerCase())
    const matchSev    = severityFilter === 'all' || e.severity === severityFilter
    return matchSearch && matchSev
  })

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Event Stream</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {live ? 'Live events from platform services' : 'Platform events · sample data until DB connected'}
          </p>
        </div>
        <button
          onClick={fetchEvents}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
          style={{ backgroundColor: '#2A3D5F', color: 'rgba(255,255,255,0.7)' }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {lastFetched ? `Updated ${lastFetched.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Refresh'}
        </button>
      </div>

      {/* Live badge */}
      {live && (
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: '#38A169' }} />
          <span className="text-xs font-medium" style={{ color: '#38A169' }}>Live — connected to Supabase</span>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text"
            placeholder="Filter events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none"
            style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'error', 'warning', 'success', 'info'].map(s => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className="rounded-lg px-3 py-2 text-xs font-medium capitalize"
              style={{
                backgroundColor: severityFilter === s ? 'rgba(42, 191, 191, 0.15)' : '#2A3D5F',
                color: severityFilter === s ? '#2ABFBF' : 'rgba(255,255,255,0.5)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && events.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#2ABFBF' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
          No events match the current filter.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(event => {
            const sev = severityConfig[event.severity] ?? severityConfig.info
            const src = sourceColors[event.source] ?? { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.6)' }
            return (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-lg border p-4"
                style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}
              >
                <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: sev.dot }} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded px-1.5 py-0.5 text-xs font-mono font-medium" style={{ backgroundColor: src.bg, color: src.text }}>
                      {event.source}
                    </span>
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
      )}
    </div>
  )
}
