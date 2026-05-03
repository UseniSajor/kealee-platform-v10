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

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment confirmed!</h1>
        <p className="text-gray-500 mb-8">
          Your <strong>Full-Stack Design Bundle</strong> is underway. All three deliverables will appear
          in your Owner Portal as they are completed.
        </p>

        {/* Deliverables list */}
        <div className="text-left space-y-4 mb-8">
          {[
            {
              label: 'Design Concept',
              detail: 'AI-generated renders and concept PDF — view in portal when ready',
              color: 'orange',
            },
            {
              label: 'Cost Estimation',
              detail: 'Detailed cost breakdown — view in portal when ready',
              color: 'blue',
            },
            {
              label: 'Permit Roadmap',
              detail: 'Jurisdiction-specific checklist and filing guide — view in portal when ready',
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
          A payment confirmation email with your portal login details has been sent to your inbox.
        </p>

        <Link
          href={process.env.NEXT_PUBLIC_OWNER_PORTAL_URL ?? 'https://owner.kealee.com'}
          className="inline-block w-full rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Go to Owner Portal
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
