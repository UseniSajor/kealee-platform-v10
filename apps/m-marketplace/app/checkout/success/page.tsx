'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Phone, Calendar, FileText } from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function CheckoutSuccessPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('canvas-confetti').then(confetti => {
        confetti.default({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      }).catch(() => {})
    }
  }, [])

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
            Thank you for choosing Kealee. Our team will get started on your order right away.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left">
              <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-sky-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Confirmation</h3>
              <p className="text-sm text-gray-600">Check your email for order details and receipt.</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Team Contact</h3>
              <p className="text-sm text-gray-600">A specialist will contact you within 24 hours.</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Get Started</h3>
              <p className="text-sm text-gray-600">Log into your portal to track progress.</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm transition">
              Back to Home <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            Questions? <a href="tel:+13015758777" className="text-sky-600 font-semibold hover:underline">(301) 575-8777</a>
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}
