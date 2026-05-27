'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

const AUTH_HUB = process.env.NEXT_PUBLIC_AUTH_HUB_URL ?? 'https://kealee.com/auth'

function RedirectToAuthHub() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/deliverables'
  const email = searchParams.get('email') ?? ''

  useEffect(() => {
    const url = new URL(`${AUTH_HUB}/complete`)
    url.searchParams.set('next', `${window.location.origin}${next.startsWith('/') ? next : `/${next}`}`)
    if (email) url.searchParams.set('email', email)
    window.location.replace(url.toString())
  }, [next, email])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#2ABFBF]" />
    </div>
  )
}

/** Redirects to universal auth hub account completion (kealee.com/auth/complete). */
export default function AccountCompletePage() {
  return (
    <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-[#2ABFBF]" />}>
      <RedirectToAuthHub />
    </Suspense>
  )
}
