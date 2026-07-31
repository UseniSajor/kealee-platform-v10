'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Smartphone, Send, CheckCircle, Loader2, Copy, WifiOff } from 'lucide-react'

interface CaptureHandoffPanelProps {
  captureSessionId: string
  captureToken: string
  projectPath: string
  returnPath?: string
  onLinkSent?: () => void
}

export function CaptureHandoffPanel({
  captureSessionId,
  captureToken,
  projectPath,
  returnPath,
  onLinkSent,
}: CaptureHandoffPanelProps) {
  const [phone, setPhone] = useState('')
  const [clientName, setClientName] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [smsAvailable, setSmsAvailable] = useState<boolean | null>(null)

  const captureUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/capture/${captureToken}${returnPath ? `?returnTo=${encodeURIComponent(returnPath)}` : ''}`
      : `/capture/${captureToken}${returnPath ? `?returnTo=${encodeURIComponent(returnPath)}` : ''}`

  useEffect(() => {
    let active = true
    fetch('/api/capture/send-link')
      .then(response => response.json())
      .then((status: { available?: boolean }) => {
        if (active) setSmsAvailable(Boolean(status.available))
      })
      .catch(() => {
        if (active) setSmsAvailable(false)
      })
    return () => { active = false }
  }, [])

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
          returnPath,
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
            Open on Your Phone
          </h2>
          <p className="text-sm text-gray-500">
            Open the guided capture on your mobile device
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-950">Secure capture link</p>
        <p className="mt-1 text-xs text-blue-700">Open directly on this device, or copy the link and send it to your phone using any messaging app.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => window.location.assign(captureUrl)}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#1A2B4A] px-3 py-2.5 text-xs font-semibold text-white"
          >
            Open capture <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-xs font-semibold text-blue-900"
          >
            <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>

      {smsAvailable === false && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
          <span>SMS delivery is offline. Use <strong>Open capture</strong> or <strong>Copy link</strong>; photos and videos still upload normally.</span>
        </div>
      )}

      {smsAvailable === null && (
        <div className="mb-5 flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking SMS availability…
        </div>
      )}

      {smsAvailable && (sent ? (
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
      ))}

      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Capture URL</p>
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
