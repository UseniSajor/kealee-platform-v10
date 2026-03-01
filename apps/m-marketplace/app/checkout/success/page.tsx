'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Phone, Calendar, FileText, User, Sparkles } from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useCart } from '@/lib/cart-context'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { clearCart } = useCart()

  useEffect(() => {
    // Clear the cart on successful payment
    clearCart()

    if (typeof window !== 'undefined') {
      import('canvas-confetti').then(confetti => {
        confetti.default({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      }).catch(() => {})
    }
  }, [clearCart])

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-24">
        <div className="max-w-2xl w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="text-green-600" size={48} />
          </div>

          <h1 className="text-4xl font-black text-gray-900 mb-4">Order Confirmed!</h1>
          <p className="text-xl text-gray-600 mb-12 max-w-lg mx-auto">
            Thank you for choosing Kealee. Your concept package is being prepared and our team will reach out shortly.
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
        </div>
      </div>
      <Footer />
    </>
  )
}
