'use client'

import { useCallback, useEffect, useState } from 'react'
import { Clock, ExternalLink, Loader2, Play, RefreshCw, Zap } from 'lucide-react'
import { OpsPanel } from './ops-ui'

interface CronRow {
  id: string
  path: string
  schedule: string
  description: string
  triggerUrl: string
}

export function AutomationCrons() {
  const [crons, setCrons] = useState<CronRow[]>([])
  const [siteUrl, setSiteUrl] = useState('https://kealee.com')
  const [hasSecret, setHasSecret] = useState(false)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string | null>(null)
  const [log, setLog] = useState<Record<string, string>>({})

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/marketing/ops')
      .then(r => r.json())
      .then(j => {
        setCrons(j.crons ?? [])
        setSiteUrl(j.config?.siteUrl ?? 'https://kealee.com')
        setHasSecret(Boolean(j.config?.hasCronSecret))
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function triggerCron(cron: CronRow) {
    setRunning(cron.id)
    setLog(prev => ({ ...prev, [cron.id]: 'Running…' }))
    try {
      const res = await fetch('/api/marketing/cron-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: cron.path }),
      })
      const text = await res.text()
      let summary = text.slice(0, 200)
      try {
        const j = JSON.parse(text)
        summary = j.message ?? j.error ?? JSON.stringify(j).slice(0, 200)
      } catch {
        /* plain text */
      }
      setLog(prev => ({
        ...prev,
        [cron.id]: res.ok ? `OK: ${summary}` : `Error ${res.status}: ${summary}`,
      }))
    } catch (e: unknown) {
      setLog(prev => ({
        ...prev,
        [cron.id]: e instanceof Error ? e.message : 'Failed',
      }))
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="space-y-6">
      <OpsPanel title="Vercel cron jobs (web-main)" icon={Clock} accent="#A78BFA">
        <p className="mb-4 text-sm text-slate-500">
          Scheduled on <strong className="text-slate-700">kealee-web-main</strong>. Manual runs proxy through
          Command Center when <code className="text-teal-700">CRON_SECRET</code> matches web-main.
        </p>

        {!hasSecret && (
          <p className="mb-4 rounded-lg border px-3 py-2 text-xs text-amber-200" style={{ borderColor: '#E8793A40' }}>
            Configure <code>CRON_SECRET</code> on Command Center and web-main to enable manual triggers.
          </p>
        )}

        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: '#2ABFBF' }} />
        ) : (
          <div className="space-y-2">
            {crons.map(cron => (
              <div
                key={cron.id}
                className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold text-slate-900">{cron.id}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{cron.description}</p>
                  <p className="mt-1 font-mono text-[10px] text-slate-400">{cron.schedule}</p>
                  {log[cron.id] && (
                    <p className="mt-2 text-xs break-all" style={{ color: '#2ABFBF' }}>
                      {log[cron.id]}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={cron.triggerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900"
                    style={{ borderColor: '#E2E8F0' }}
                    title="Opens cron URL (needs Authorization in production)"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    URL
                  </a>
                  <button
                    type="button"
                    disabled={!hasSecret || running === cron.id}
                    onClick={() => triggerCron(cron)}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                    style={{ backgroundColor: '#2ABFBF', color: '#0f1c30' }}
                  >
                    {running === cron.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    Run now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={load}
          className="mt-4 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh status
        </button>
      </OpsPanel>

      <OpsPanel title="Weekly campaign (manual)" icon={Zap} accent="#E8793A">
        <p className="text-sm text-slate-500">
          Use the <strong className="text-slate-700">Weekly product campaign</strong> bar at the top of Marketing,
          or run <code className="text-teal-700">POST /api/marketing/campaign/start</code> from the Content tab
          launcher.
        </p>
        <a
          href={`${siteUrl.replace(/\/$/, '')}/api/marketing/card-media`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm"
          style={{ color: '#2ABFBF' }}
        >
          View public card manifest
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </OpsPanel>
    </div>
  )
}
