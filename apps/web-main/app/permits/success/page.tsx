import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Permit Package Confirmed | Kealee',
  description: 'Your permit package request has been confirmed.',
}

const TIER_NAMES: Record<string, string> = {
  simple: 'Permit Research + Checklist',
  package: 'Full Permit Package',
  coordination: 'Permit Coordination Service',
  expediting: 'Expedited Permit Filing',
}

interface OrderStatus {
  id: string
  status: string
  fullName: string | null
  email: string | null
  tier: string | null
  tierName: string | null
  paid: boolean
}

async function fetchOrderStatus(intakeId: string): Promise<OrderStatus | null> {
  try {
    const apiUrl =
      process.env.INTERNAL_API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:3001'

    const res = await fetch(
      `${apiUrl}/api/v1/permits/intake-status?intake_id=${encodeURIComponent(intakeId)}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function PermitSuccessPage({
  searchParams,
}: {
  searchParams: { tier?: string; email?: string; intake_id?: string }
}) {
  const intakeId = searchParams.intake_id
  const fallbackTier = searchParams.tier ?? 'package'
  const fallbackEmail = searchParams.email ? decodeURIComponent(searchParams.email) : null

  // Fetch real status from DB
  const order = intakeId ? await fetchOrderStatus(intakeId) : null

  const tierName =
    order?.tierName ??
    TIER_NAMES[order?.tier ?? fallbackTier] ??
    'Permit Package'

  const email = order?.email ?? fallbackEmail
  const isPaid = order?.paid ?? true // optimistic on Stripe redirect
  const customerName = order?.fullName

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-20"
      style={{ backgroundColor: '#F8FAFC' }}
    >
      <div className="max-w-lg w-full text-center">
        {/* Status icon */}
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ backgroundColor: isPaid ? '#2ABFBF20' : '#FEF9C320' }}
        >
          {isPaid ? (
            <svg className="w-10 h-10" style={{ color: '#2ABFBF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-10 h-10" style={{ color: '#CA8A04' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-3" style={{ color: '#1A2B4A' }}>
          {isPaid ? 'Order confirmed!' : 'Processing your order…'}
        </h1>

        <p className="text-lg text-gray-600 mb-2">
          {customerName ? `Hi ${customerName.split(' ')[0]}, you're getting the ` : "You're getting the "}
          <span className="font-semibold" style={{ color: '#1A2B4A' }}>{tierName}</span>
        </p>

        {email && (
          <p className="text-sm text-gray-500 mb-2">
            Confirmation sent to <span className="font-medium">{email}</span>
          </p>
        )}

        {/* Real DB status */}
        {order && (
          <div className="inline-flex items-center gap-2 mb-8">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: isPaid ? '#16A34A' : '#CA8A04' }}
            />
            <span className="text-xs text-gray-500">
              Status: <span className="font-semibold">{order.status}</span>
              {order.id && <span className="ml-1 text-gray-400">· #{order.id.slice(-8)}</span>}
            </span>
          </div>
        )}

        {!order && <div className="mb-8" />}

        {/* What happens next */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 text-left">
          <h2 className="font-bold mb-4" style={{ color: '#1A2B4A' }}>What happens next</h2>
          <ol className="space-y-3">
            {[
              'Our permit team reviews your project details within 1 business day',
              'We contact you to confirm project scope and any missing information',
              'Your permit package is prepared and delivered per your selected tier',
              'We support you through submission and any correction cycles',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: '#1A2B4A', color: '#fff' }}
                >
                  {i + 1}
                </div>
                <span className="text-sm text-gray-600">{text}</span>
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
          <a href="mailto:permits@kealee.com" className="underline">permits@kealee.com</a>
          {' '}— we respond within 4 business hours.
        </p>
      </div>
    </div>
  )
}
