'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface Approval { approvedAt: string; generation: number }

/**
 * "Approved by customer" — the customer approves the recommended concept
 * direction from their portal. This is the writer behind the package's
 * Approved-by-customer stamp (form_data.conceptConfirmedAt).
 */
export function ConceptApproval({ intakeId, onApproved }: { intakeId: string; onApproved?: (pdfUrl?: string) => void }) {
  const [approval, setApproval] = useState<Approval | null>(null)
  const [canApprove, setCanApprove] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch(`/api/concept/${intakeId}/approve`)
      .then(r => (r.ok ? r.json() : null))
      .then(body => {
        if (!active || !body) return
        setApproval(body.approval ?? null)
        setCanApprove(Boolean(body.canApprove))
        setGeneration(Number(body.generation ?? 0))
      })
      .catch(() => undefined)
      .finally(() => active && setLoaded(true))
    return () => { active = false }
  }, [intakeId])

  const approve = useCallback(async () => {
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/concept/${intakeId}/approve`, { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'Your approval could not be saved. Try again.')
      setApproval(body.approval ?? null)
      onApproved?.(body.pdfUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your approval could not be saved. Try again.')
    } finally {
      setBusy(false)
    }
  }, [intakeId, onApproved])

  if (!loaded || !canApprove) return null

  if (approval) {
    const stale = generation > approval.generation
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <div>
          <p className="font-semibold">Approved by you on {new Date(approval.approvedAt).toLocaleDateString()}</p>
          <p className="text-emerald-800">
            {stale
              ? 'The concept has been revised since your approval. Review the new version and approve it again if it still matches what you want.'
              : 'Your package carries the “Approved by customer” stamp. It remains a concept — not for permit or construction — until a licensed professional prepares the permit drawings.'}
          </p>
          {stale && (
            <button onClick={approve} disabled={busy} className="mt-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              {busy ? 'Saving…' : 'Approve the revised concept'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
      <p className="font-semibold text-gray-900">Does the recommended design match what you want?</p>
      <p className="mt-1 text-gray-600">
        Approving marks the package “Approved by customer” and tells Kealee to move to the next step. You can still ask for changes afterwards.
      </p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <button
        onClick={approve}
        disabled={busy}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {busy ? 'Saving your approval…' : 'Approve this concept'}
      </button>
    </div>
  )
}
