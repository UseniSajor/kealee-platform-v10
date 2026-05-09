import { CheckCircle, Clock, FileText, Home } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Estimate Order Confirmed — Kealee',
  description: 'Your cost estimation order has been received. Our team will prepare your trade-by-trade breakdown.',
}

export default function EstimateSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Order Confirmed</h1>
          <p className="text-lg text-slate-600 mb-8">
            Your cost estimation request has been received. Our team is preparing your estimate.
          </p>

          {/* What Happens Next */}
          <div className="space-y-4 mb-8 text-left">
            <div className="flex gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900">Estimate Preparation</h3>
                <p className="text-sm text-slate-600">
                  Our licensed estimators will prepare a trade-by-trade cost breakdown within 3–5 business days
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <FileText className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900">RSMeans Validation</h3>
                <p className="text-sm text-slate-600">
                  Pricing is validated against RSMeans data and local DMV market rates. Lender-ready PDF included.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900">You'll Hear From Us</h3>
                <p className="text-sm text-slate-600">
                  We'll email you when your estimate is ready. You can also log in to check the status.
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps CTA */}
          <div className="space-y-3 mb-8">
            <Link href="/projects">
              <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                View My Projects
              </button>
            </Link>
            <Link href="/">
              <button className="w-full px-6 py-3 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition">
                Back to Home
              </button>
            </Link>
          </div>

          {/* Info Box */}
          <div className="text-left">
            <h3 className="font-semibold text-slate-900 mb-3">Questions?</h3>
            <p className="text-sm text-slate-600 mb-3">
              Contact our support team:
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:support@kealee.com" className="text-blue-600 hover:underline">
                  support@kealee.com
                </a>
              </p>
              <p>
                <strong>Phone:</strong>{' '}
                <a href="tel:+1-202-555-0100" className="text-blue-600 hover:underline">
                  (202) 555-0100
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Additional Services CTA */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/permits">
              <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer">
                <h3 className="font-semibold text-slate-900 mb-2">Get Permit Services</h3>
                <p className="text-sm text-slate-600">
                  Need permits filed? Browse our permit preparation services
                </p>
              </div>
            </Link>
            <Link href="/concept-engine">
              <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer">
                <h3 className="font-semibold text-slate-900 mb-2">Design Services</h3>
                <p className="text-sm text-slate-600">
                  Get professional design concepts for your project
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
