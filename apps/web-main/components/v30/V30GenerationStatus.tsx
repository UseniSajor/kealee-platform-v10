'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface BotProgress {
  status: string
  progress: number
}

interface StatusPayload {
  stage?: 'generating' | 'complete' | 'failed' | 'idle'
  progress?: Record<string, BotProgress>
  successCount?: number
  failedCount?: number
  total?: number
  error?: string
}

const BOT_LABELS: Record<string, string> = {
  design: 'Design',
  estimate: 'Estimate',
  zoning: 'Zoning',
  floorplan: 'Floorplan',
  permit: 'Permits',
  video: 'Video',
  contractor: 'Contractors',
  sales: 'SalesBot',
  support: 'SupportBot',
  project: 'ProjectBot',
}

export function V30GenerationStatus({ intakeId }: { intakeId: string }) {
  const [status, setStatus] = useState<StatusPayload | null>(null)

  useEffect(() => {
    if (!intakeId) return

    let cancelled = false

    async function poll() {
      try {
        const res = await fetch(`/api/v30/status?intakeId=${encodeURIComponent(intakeId)}`)
        const data = (await res.json()) as StatusPayload
        if (!cancelled) setStatus(data)
        if (!cancelled && data.stage === 'generating') {
          setTimeout(poll, 4000)
        }
      } catch {
        if (!cancelled) setStatus({ stage: 'idle', error: 'Could not load status' })
      }
    }

    poll()
    const interval = setInterval(poll, 8000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [intakeId])

  if (!status || status.stage === 'idle') {
    return (
      <p className="text-sm text-slate-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
        Starting your custom package…
      </p>
    )
  }

  // Keep provider/worker details out of the customer surface. The status API
  // and operations logs retain the real error for recovery; customers see the
  // product continuing through preparation.
  if (status.error) {
    return (
      <p className="text-sm text-slate-600 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
        Your product is being prepared. We’ll let you know when it’s ready.
      </p>
    )
  }

  const entries = Object.entries(status.progress ?? {})

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 text-left">
      <p className="text-xs font-bold uppercase tracking-widest text-violet-700 mb-3">
        Kealee v30 — {status.stage === 'complete' ? 'Package ready' : 'Product being prepared'}
      </p>
      {entries.length > 0 ? (
        <ul className="space-y-2">
          {entries.map(([bot, p]) => (
            <li key={bot} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{BOT_LABELS[bot] ?? bot}</span>
              <span className="flex items-center gap-1.5 font-medium">
                {p.status === 'COMPLETE' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : p.status === 'FAILED' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                )}
                {p.progress}%
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-600">Parallel bots are queued…</p>
      )}
      {status.stage === 'complete' && (
        <p className="text-xs text-slate-500 mt-3">
          {status.successCount ?? 0} of {status.total ?? 0} deliverables complete.
        </p>
      )}
    </div>
  )
}
