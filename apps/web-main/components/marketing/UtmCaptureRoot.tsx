'use client'

import { Suspense } from 'react'
import { UtmCapture } from '@/components/marketing/UtmCapture'

export function UtmCaptureRoot() {
  return (
    <Suspense fallback={null}>
      <UtmCapture />
    </Suspense>
  )
}
