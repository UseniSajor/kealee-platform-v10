'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react'

interface SessionData {
  id: string
  status: string
  tier: string
  projectType: string
  estimatedReadyAt?: string
  outputPdfUrl?: string
}

const STATUS_STEPS = [
  { key: 'paid', label: 'Payment confirmed' },
  { key: 'queued', label: 'Analysis queued' },
  { key: 'processing', label: 'AI generating concepts' },
  { key: 'review', label: 'Quality review' },
  { key: 'completed', label: 'Package ready' },
]

function getStepIndex(status: string): number {
  if (status === 'PENDING_PAYMENT') return 0
  if (status === 'DRAFT') return 1
  if (status === 'PROCESSING') return 2
  if (status === 'COMPLETED' || status === 'ARCHITECT_ROUTED') return 4
  if (status === 'FAILED') return -1
  return 1
}

export default function PreDesignProcessingPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const id = params?.id as string
  const isFromStripe = searchParams?.get('source') === 'stripe'

  const [session, setSession] = useState<SessionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [polls, setPolls] = useState(0)

  useEffect(() => {
    if (!id) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/pre-design/${id}`, { cache: 'no-store' })
        if (!res.ok) {
          // If Stripe session ID, we need to wait for webhook to create the record
          if (polls < 5) return
          setError('Session not found. If you just completed payment, please wait a moment.')
          return
        }
        const data: SessionData = await res.json()
        setSession(data)

        if (data.status === 'COMPLETED' || data.status === 'ARCHITECT_ROUTED') {
          router.push(`/pre-design/results/${data.id}`)
        }
      } catch {
        // Silent - keep polling
      }
      setPolls((p) => p + 1)
    }

    poll()
    const interval = setInterval(poll, 8000)
    return () => clearInterval(interval)
  }, [id, polls, router])

  const currentStep = session ? getStepIndex(session.status) : (isFromStripe ? 1 : 0)
  const isFailed = session?.status === 'FAILED'

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7FAFC' }}>
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        {isFailed ? (
          <>
            <AlertCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h1 className="text-2xl font-bold font-display mb-2" style={{ color: '#1A2B4A' }}>
              Something went wrong
            </h1>
            <p className="text-gray-500 mb-6">
              Your payment was processed but we hit an issue generating your concepts.
              Our team has been notified and will reach out within 1 business day.
            </p>
            <a
              href="mailto:hello@kealee.com"
              className="inline-block rounded-xl px-6 py-3 text-sm font-bold text-white"
              style={{ backgroundColor: '#E8793A' }}
            >
              Contact Support
            </a>
          </>
        ) : (
          <>
            {currentStep < 4 ? (
              <Loader2 className="mx-auto h-16 w-16 animate-spin mb-4" style={{ color: '#E8793A' }} />
            ) : (
              <CheckCircle className="mx-auto h-16 w-16 mb-4" style={{ color: '#38A169' }} />
            )}

            <h1 className="text-2xl font-bold font-display mb-2" style={{ color: '#1A2B4A' }}>
              {currentStep < 4 ? 'Your concepts are being created…' : 'Ready! Redirecting…'}
            </h1>

            <p className="text-gray-500 mb-8">
              {isFromStripe && polls < 3
                ? 'Confirming your payment…'
                : 'AI is analyzing your property and generating property-specific concepts. This typically takes 2–5 business days.'}
            </p>

            {/* Progress steps */}
            <div className="space-y-3 text-left">
              {STATUS_STEPS.map((step, i) => {
                const done = i < currentStep
                const active = i === currentStep
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: done ? '#38A169' : active ? '#E8793A' : '#E5E7EB',
                      }}
                    >
                      {done ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : active ? (
                        <Clock className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <span className="text-xs text-gray-400">{i + 1}</span>
                      )}
                    </div>
                    <span
                      className="text-sm"
                      style={{ color: done ? '#38A169' : active ? '#1A2B4A' : '#9CA3AF', fontWeight: active || done ? 600 : 400 }}
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {error && (
              <p className="mt-6 text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
            )}

            <p className="mt-8 text-xs text-gray-400">
              We'll email you when your package is ready. You can close this tab.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
