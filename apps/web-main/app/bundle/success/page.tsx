import { Suspense } from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'Order Confirmed — Kealee Full-Stack Design Bundle',
}

function SuccessContent() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        {/* Check icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&rsquo;re all set!</h1>
        <p className="text-gray-500 mb-8">
          Your <strong>Full-Stack Design Bundle</strong> is confirmed. Our team is already working on your deliverables.
        </p>

        {/* Deliverables list */}
        <div className="text-left space-y-4 mb-8">
          {[
            {
              label: 'Design Concept',
              detail: 'AI-generated renders + concept PDF — delivered within 24 hrs',
              color: 'orange',
            },
            {
              label: 'Cost Estimation',
              detail: 'Detailed cost breakdown for your project scope',
              color: 'blue',
            },
            {
              label: 'Permit Roadmap',
              detail: 'Jurisdiction-specific permit checklist and filing guide',
              color: 'green',
            },
          ].map(({ label, detail, color }) => (
            <div key={label} className="flex gap-3 items-start">
              <div
                className={`mt-0.5 h-5 w-5 shrink-0 rounded-full flex items-center justify-center
                  ${color === 'orange' ? 'bg-orange-100 text-orange-600' : ''}
                  ${color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                  ${color === 'green' ? 'bg-green-100 text-green-600' : ''}`}
              >
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-5.121-5.121a1 1 0 111.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{detail}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mb-6">
          A confirmation email has been sent to you. Check your inbox (and spam folder) for details.
        </p>

        <Link
          href="/"
          className="inline-block w-full rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}

export default function BundleSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  )
}
