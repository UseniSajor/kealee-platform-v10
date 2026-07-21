'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isV30EnabledClient } from '@/lib/v30'

/** Redirect legacy v20 intake URLs to v30 when flag is on (migrate traffic off fixed tiers). */
export function V30ConceptRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const v30 = isV30EnabledClient()

  useEffect(() => {
    if (v30) router.replace('/get-concept')
  }, [v30, router])

  if (v30) return null
  return <>{children}</>
}
