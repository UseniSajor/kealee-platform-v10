'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Clock, FileText, Zap } from 'lucide-react'

interface OrderStatus {
  id: string
  status: string
  fullName: string
  email: string
  createdAt: string
  tier: string
  tierName: string
  paid: boolean
}

export default function PermitsSuccessClient() {
  const params = useSearchParams()
  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const sessionId = params.get('session_id')
    if (!sessionId) {
      setError('No order information found.')
      setLoading(false)
      return
    }

    // For now, we'll show a generic success message
    // In production, you might want to fetch order details from Stripe webhook data
    setOrder({
      id: sessionId,
      status: 'PROCESSING',
      fullName: 'Your Name',
      email: 'your.email@example.com',
      createdAt: new Date().toISOString(),
      tier: 'package',
      tierName: 'Full Permit Package',
      paid: true,
    })
    setLoading(false)
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full" />
          </div>
          <p className="mt-4 text-slate-600">Loading your order...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Order Confirmed</h1>
          <p className="text-lg text-slate-600 mb-4">
            Your permit service order has been received and is being processed.
          </p>
          {order && (
            <p className="text-sm text-slate-500">Order ID: {order.id}</p>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Next Steps</h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Payment Processed</h3>
                <p className="text-slate-600 mt-1">
                  Your payment has been received. You'll receive a confirmation email shortly.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Review & Processing</h3>
                <p className="text-slate-600 mt-1">
                  Within 1-2 business days, our team will review your project details and begin document preparation.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Documents Ready</h3>
                <p className="text-slate-600 mt-1">
                  Within 3-5 business days, your permit application package will be ready. You'll receive download instructions via email.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Submit Your Permit</h3>
                <p className="text-slate-600 mt-1">
                  Submit your completed package to your local jurisdiction. We're here to support you through the process.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">What's Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/"
              className="block text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg transition"
            >
              Return Home
            </Link>
            <a
              href="mailto:support@kealee.com"
              className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Contact Support
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Questions?</h3>
          <div className="space-y-4 text-sm text-slate-600">
            <p>
              <strong>How long does processing take?</strong> Typically 3-5 business days from order confirmation.
            </p>
            <p>
              <strong>What if I have changes?</strong> Email us within 24 hours with any project updates.
            </p>
            <p>
              <strong>Can I track my order?</strong> Yes, check your email for tracking updates and status notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
