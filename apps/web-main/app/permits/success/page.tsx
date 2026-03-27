import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Permit Package Confirmed | Kealee',
  description: 'Your permit package request has been confirmed.',
}

export default function PermitSuccessPage({
  searchParams,
}: {
  searchParams: { tier?: string; email?: string }
}) {
  const tierNames: Record<string, string> = {
    simple: 'Permit Research + Checklist',
    package: 'Full Permit Package',
    coordination: 'Permit Coordination Service',
    expediting: 'Expedited Permit Filing',
  }

  const tier = searchParams.tier ?? 'package'
  const tierName = tierNames[tier] ?? 'Permit Package'
  const email = searchParams.email

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-20"
      style={{ backgroundColor: '#F8FAFC' }}
    >
      <div className="max-w-lg w-full text-center">
        {/* Check icon */}
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ backgroundColor: '#2ABFBF20' }}
        >
          <svg
            className="w-10 h-10"
            style={{ color: '#2ABFBF' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-3" style={{ color: '#1A2B4A' }}>
          Order confirmed!
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          You're getting the <span className="font-semibold" style={{ color: '#1A2B4A' }}>{tierName}</span>
        </p>
        {email && (
          <p className="text-sm text-gray-500 mb-8">
            Confirmation sent to <span className="font-medium">{decodeURIComponent(email)}</span>
          </p>
        )}

        {/* What happens next */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 text-left">
          <h2 className="font-bold mb-4" style={{ color: '#1A2B4A' }}>What happens next</h2>
          <ol className="space-y-3">
            {[
              { step: '1', text: 'Our permit team reviews your project details within 1 business day' },
              { step: '2', text: 'We contact you to confirm project scope and any missing information' },
              { step: '3', text: 'Your permit package is prepared and delivered per your selected tier' },
              { step: '4', text: 'We support you through submission and any correction cycles' },
            ].map((item) => (
              <li key={item.step} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: '#1A2B4A', color: '#fff' }}
                >
                  {item.step}
                </div>
                <span className="text-sm text-gray-600">{item.text}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/permits"
            className="px-6 py-3 rounded-xl font-semibold border-2 border-gray-200 text-gray-600 hover:border-gray-300 transition-colors text-sm"
          >
            Back to Permits
          </Link>
          <a
            href="mailto:permits@kealee.com"
            className="px-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 text-sm"
            style={{ backgroundColor: '#E8793A' }}
          >
            Email permits@kealee.com
          </a>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Questions? Email{' '}
          <a href="mailto:permits@kealee.com" className="underline">
            permits@kealee.com
          </a>{' '}
          — we respond within 4 business hours.
        </p>
      </div>
    </div>
  )
}
