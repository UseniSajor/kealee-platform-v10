'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { mapNextPathToOwnerPortal } from '@/lib/owner-portal-next-path'

const OWNER_PORTAL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_OWNER_PORTAL_URL) ||
  'https://owner.kealee.com'

function AccessRedirect() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/deliverables'
  const email = searchParams.get('email') ?? ''
  const errorParam = searchParams.get('error') ?? ''

  useEffect(() => {
    const url = new URL('/login', OWNER_PORTAL.replace(/\/$/, ''))
    url.searchParams.set('next', mapNextPathToOwnerPortal(next))
    if (email) url.searchParams.set('email', email)
    if (errorParam === 'link-expired' || errorParam === 'link_expired') {
      url.searchParams.set('error', 'auth_callback_failed')
    }
    window.location.replace(url.toString())
  }, [next, email, errorParam])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#E8724B] border-t-transparent" />
        <p className="text-sm text-slate-600">Opening your Owner Portal…</p>
      </div>
    </div>
  )
}

export default function ConceptAccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E8724B] border-t-transparent" />
        </div>
      }
    >
      <AccessRedirect />
    </Suspense>
  )
}
