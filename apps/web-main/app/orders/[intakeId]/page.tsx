import { Suspense } from 'react'
import type { Metadata } from 'next'
import { OrderTrackerClient } from './client'

export const metadata: Metadata = {
  title: 'Your Kealee order',
  description: 'Track your Kealee preconstruction order, outstanding items, and deliverables.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function OrderPage({ params }: { params: { intakeId: string } }) {
  // The client reads the access token from the query string, so it must sit
  // under a Suspense boundary for `useSearchParams`.
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E8724B] border-t-transparent" />
        </div>
      }
    >
      <OrderTrackerClient intakeId={params.intakeId} />
    </Suspense>
  )
}
