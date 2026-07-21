'use client'

import { useCallback, useState } from 'react'
import { api } from '@/lib/api'

type DisputeInitiationFormProps = {
  projectId: string
  milestoneId?: string
  onSuccess: () => void
  onCancel: () => void
}

export default function DisputeInitiationForm({
  projectId,
  milestoneId,
  onSuccess,
  onCancel,
}: DisputeInitiationFormProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!reason.trim() || !description.trim()) {
      setError('Please provide both a reason and description')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await api.initiateDispute({
        projectId,
        milestoneId,
        reason: reason.trim(),
        description: description.trim(),
        priority,
      })
      alert('Dispute filed successfully. Escrow has been frozen until resolution.')
      onSuccess()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to file dispute')
      setSubmitting(false)
    }
  }, [projectId, milestoneId, reason, description, priority, onSuccess])

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-900">⚠️ Important</p>
        <p className="mt-1 text-xs text-amber-800">
          Filing a dispute will freeze all escrow payments until the dispute is resolved. Please ensure you have
          attempted to resolve the issue through normal channels first.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Reason for Dispute <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Work quality issues, Timeline delays, Payment disputes"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Detailed Description <span className="text-red-600">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Provide a detailed description of the dispute, including relevant dates, communications, and any supporting information..."
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high' | 'urgent')}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !reason.trim() || !description.trim()}
          className="rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? 'Filing Dispute...' : 'File Dispute'}
        </button>
      </div>
    </div>
  )
}
