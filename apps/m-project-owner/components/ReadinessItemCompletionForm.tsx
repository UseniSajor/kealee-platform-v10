'use client'

import { useState } from 'react'
import { type ReadinessItem } from '@/lib/api'

interface ReadinessItemCompletionFormProps {
  item: ReadinessItem
  onComplete: (itemId: string, response: unknown) => Promise<void>
  onCancel: () => void
}

export function ReadinessItemCompletionForm({
  item,
  onComplete,
  onCancel,
}: ReadinessItemCompletionFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Document Upload
  const [documentUrl, setDocumentUrl] = useState('')
  const [fileName, setFileName] = useState('')

  // Question/Answer
  const [answer, setAnswer] = useState<boolean | null>(null)
  const [explanation, setExplanation] = useState('')

  // Date Confirmation
  const [confirmedDate, setConfirmedDate] = useState('')
  const [dateNotes, setDateNotes] = useState('')

  // External Verification
  const [verifiedBy, setVerifiedBy] = useState('')
  const [verificationDate, setVerificationDate] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [verificationNotes, setVerificationNotes] = useState('')

  // Custom
  const [customData, setCustomData] = useState('{}')

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)

    try {
      let response: unknown

      switch (item.type) {
        case 'DOCUMENT_UPLOAD':
          if (!documentUrl || !fileName) {
            setError('Document URL and file name are required')
            setSubmitting(false)
            return
          }
          response = { documentUrl, fileName, uploadedAt: new Date().toISOString() }
          break

        case 'QUESTION_ANSWER':
          if (answer === null) {
            setError('Please select an answer (Yes or No)')
            setSubmitting(false)
            return
          }
          response = { answer, explanation: explanation || undefined }
          break

        case 'DATE_CONFIRMATION':
          if (!confirmedDate) {
            setError('Confirmed date is required')
            setSubmitting(false)
            return
          }
          response = { confirmedDate, notes: dateNotes || undefined }
          break

        case 'EXTERNAL_VERIFICATION':
          if (!verifiedBy || !verificationDate) {
            setError('Verified by and verification date are required')
            setSubmitting(false)
            return
          }
          response = {
            verifiedBy,
            verificationDate,
            referenceNumber: referenceNumber || undefined,
            notes: verificationNotes || undefined,
          }
          break

        case 'CUSTOM':
          try {
            response = JSON.parse(customData)
          } catch {
            setError('Invalid JSON format for custom data')
            setSubmitting(false)
            return
          }
          break

        default:
          setError(`Unknown item type: ${item.type}`)
          setSubmitting(false)
          return
      }

      await onComplete(item.id, response)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to complete item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-neutral-900">{item.title}</h3>
      {item.description ? (
        <p className="mt-1 text-sm text-neutral-600">{item.description}</p>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        {/* Document Upload Form */}
        {item.type === 'DOCUMENT_UPLOAD' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Document URL <span className="text-red-600">*</span>
              </label>
              <input
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://example.com/document.pdf"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                File Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="building-plans.pdf"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </>
        ) : null}

        {/* Question/Answer Form */}
        {item.type === 'QUESTION_ANSWER' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Answer <span className="text-red-600">*</span>
              </label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="answer"
                    checked={answer === true}
                    onChange={() => setAnswer(true)}
                    className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="text-sm text-neutral-700">Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="answer"
                    checked={answer === false}
                    onChange={() => setAnswer(false)}
                    className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="text-sm text-neutral-700">No</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Explanation (optional)</label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Provide additional context..."
                rows={3}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        ) : null}

        {/* Date Confirmation Form */}
        {item.type === 'DATE_CONFIRMATION' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Confirmed Date <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                value={confirmedDate}
                onChange={(e) => setConfirmedDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Notes (optional)</label>
              <textarea
                value={dateNotes}
                onChange={(e) => setDateNotes(e.target.value)}
                placeholder="Additional notes about the confirmed date..."
                rows={3}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        ) : null}

        {/* External Verification Form */}
        {item.type === 'EXTERNAL_VERIFICATION' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Verified By <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={verifiedBy}
                onChange={(e) => setVerifiedBy(e.target.value)}
                placeholder="Third-party organization or person name"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Verification Date <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                value={verificationDate}
                onChange={(e) => setVerificationDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Reference Number (optional)</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Verification reference number"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Notes (optional)</label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Additional verification notes..."
                rows={3}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        ) : null}

        {/* Custom Form */}
        {item.type === 'CUSTOM' ? (
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Custom Data (JSON) <span className="text-red-600">*</span>
            </label>
            <textarea
              value={customData}
              onChange={(e) => setCustomData(e.target.value)}
              placeholder='{"key": "value"}'
              rows={6}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="mt-1 text-xs text-neutral-500">Enter valid JSON format</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex justify-end gap-3">
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
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Completing...' : 'Complete Item'}
        </button>
      </div>
    </div>
  )
}
