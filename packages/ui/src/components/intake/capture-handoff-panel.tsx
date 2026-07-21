'use client'

import { useState } from 'react'
import { Smartphone, Send, CheckCircle, Loader2, Copy } from 'lucide-react'

interface CaptureHandoffPanelProps {
  captureSessionId: string
  captureToken: string
  projectPath: string
  onLinkSent?: () => void
}

export function CaptureHandoffPanel({
  captureSessionId,
  captureToken,
  projectPath,
  onLinkSent,
}: CaptureHandoffPanelProps) {
  const [phone, setPhone] = useState('')
  const [clientName, setClientName] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const captureUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/capture/${captureToken}`
      : `/capture/${captureToken}`

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!phone) return
    setSending(true)
    setError(null)
    try {
      const resp = await fetch('/api/capture/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captureSessionId,
          phoneNumber: phone,
          clientName: clientName || undefined,
          projectPath,
        }),
      })
      const json = await resp.json()
      if (!resp.ok) {
        setError(json.error ?? 'Failed to send link')
      } else {
        setSent(true)
        onLinkSent?.()
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setSending(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(captureUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: '#1A2B4A' }}
        >
          <Smartphone className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>
            Send to Phone
          </h2>
          <p className="text-sm text-gray-500">
            Open the guided capture on your mobile device
          </p>
        </div>
      </div>

      {sent ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle className="h-12 w-12" style={{ color: '#E8793A' }} />
          <p className="font-medium" style={{ color: '#1A2B4A' }}>
            Link sent! Open it on your phone to begin capturing.
          </p>
          <p className="text-sm text-gray-500">
            The link expires in 48 hours. You can re-send below if needed.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-2 text-sm underline text-gray-400 hover:text-gray-600"
          >
            Send again
          </button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Client Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8793A]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8793A]"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={sending || !phone}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#E8793A' }}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {sending ? 'Sending…' : 'Send Capture Link via SMS'}
          </button>
        </form>
      )}

      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Or copy link</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={captureUrl}
            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
