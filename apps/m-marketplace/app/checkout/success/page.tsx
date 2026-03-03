'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, FileText, User, Sparkles, Loader2 } from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useCart } from '@/lib/cart-context'

type VerifyStatus = 'polling' | 'confirmed' | 'timeout'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { clearCart } = useCart()

  const [status, setStatus] = useState<VerifyStatus>(sessionId ? 'polling' : 'confirmed')
  const [packageName, setPackageName] = useState<string | null>(null)
  const pollCount = useRef(0)
  const cartCleared = useRef(false)

  // Clear cart once on mount
  useEffect(() => {
    if (!cartCleared.current) {
      clearCart()
      cartCleared.current = true
    }
  }, [clearCart])

  // Fire confetti when order is confirmed
  const fireConfetti = useCallback(() => {
    if (typeof window !== 'undefined') {
      import('canvas-confetti').then(confetti => {
        confetti.default({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      }).catch(() => {})
    }
  }, [])

  // Poll for order verification
  useEffect(() => {
    if (!sessionId || status !== 'polling') return

    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/verify?session_id=${encodeURIComponent(sessionId)}`)
        const data = await res.json()

        if (cancelled) return

        if (data.found) {
          setStatus('confirmed')
          setPackageName(data.order?.packageName || null)
          fireConfetti()
          return
        }
      } catch {
        // Network error — continue polling
      }

      pollCount.current++

      // Timeout after ~30 seconds (15 polls x 2s)
      if (pollCount.current >= 15) {
        if (!cancelled) setStatus('timeout')
        return
      }

      // Poll again in 2 seconds
      if (!cancelled) {
        setTimeout(poll, 2000)
      }
    }

    // Start first poll after 1 second (give webhook time to fire)
    const timer = setTimeout(poll, 1000)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [sessionId, status, fireConfetti])

  // Retry from timeout state
  const handleRetry = () => {
    pollCount.current = 0
    setStatus('polling')
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-24">
        <div className="max-w-2xl w-full text-center">

          {/* ── POLLING STATE ── */}
          {status === 'polling' && (
            <>
              <div className="w-24 h-24 mx-auto mb-6 bg-sky-100 rounded-full flex items-center justify-center">
                <Loader2 className="text-sky-600 animate-spin" size={48} />
              </div>
              <h1 className="text-4xl font-black text-gray-900 mb-4">Processing Payment...</h1>
              <p className="text-xl text-gray-600 mb-12 max-w-lg mx-auto">
                Your payment was received. We&apos;re setting up your order now &mdash; this usually takes just a few seconds.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying order...
              </div>
            </>
          )}

          {/* ── TIMEOUT STATE ── */}
          {status === 'timeout' && (
            <>
              <div className="w-24 h-24 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                <FileText className="text-amber-600" size={48} />
              </div>
              <h1 className="text-4xl font-black text-gray-900 mb-4">Payment Received</h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto">
                Your payment was successful. Order processing is taking a bit longer than usual &mdash;
                you&apos;ll receive a confirmation email shortly.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm transition"
                >
                  Check Again
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition"
                >
                  Back to Home
                </Link>
              </div>
              <p className="text-sm text-gray-500">
                Questions? Call us at <a href="tel:+13015758777" className="text-sky-600 font-semibold hover:underline">(301) 575-8777</a>
              </p>
            </>
          )}

          {/* ── CONFIRMED STATE ── */}
          {status === 'confirmed' && (
            <>
              <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={48} />
              </div>

              <h1 className="text-4xl font-black text-gray-900 mb-4">Order Confirmed!</h1>
              <p className="text-xl text-gray-600 mb-12 max-w-lg mx-auto">
                Thank you for choosing Kealee.
                {packageName ? ` Your ${packageName} is` : ' Your concept package is'} being prepared and our team will reach out shortly.
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-12">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left">
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-sky-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Confirmation Email</h3>
                  <p className="text-sm text-gray-600">Check your email for order details, receipt, and next steps.</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Concept Delivery</h3>
                  <p className="text-sm text-gray-600">Your AI-generated concept package will be delivered within 24 hours.</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Your Account</h3>
                  <p className="text-sm text-gray-600">We&apos;ve created your account. Check your email for login credentials.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-sky-200 p-8 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Ready for the full project experience?</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Create a full project to get contractor bids, manage timelines, and track your renovation from start to finish.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/dashboard" className="inline-flex items-center gap-2 px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm transition">
                    Go to Dashboard <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition">
                    Back to Home
                  </Link>
                </div>
              </div>

              <p className="mt-8 text-sm text-gray-500">
                Questions? Call us at <a href="tel:+13015758777" className="text-sky-600 font-semibold hover:underline">(301) 575-8777</a>
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
