'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { parseUTM } from '@/lib/marketing/utm'
import { storeUtm } from '@/lib/marketing/client-utm'

/**
 * Persists UTM query params to sessionStorage for later intake / lead API calls.
 */
export function UtmCapture() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!searchParams) return
    const utm = parseUTM(searchParams)
    storeUtm(utm)
  }, [searchParams])

  return null
}
