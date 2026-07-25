'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AUTH_HUB = process.env.NEXT_PUBLIC_AUTH_HUB_URL ?? 'https://kealee.com/auth'

export function AccountCompleteBanner() {
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user?.email) return
      setEmail(user.email)
      const completed = user.user_metadata?.accountCompletedAt
      const isMagicOnly = user.app_metadata?.provider === 'email' && !completed
      setShow(!completed || isMagicOnly)
    })
  }, [])

  if (!show) return null

  const href = `${AUTH_HUB}/complete?email=${encodeURIComponent(email)}&next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '/deliverables')}`

  return (
    <div
      className="mb-4 flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor: '#2ABFBF40', backgroundColor: 'rgba(42,191,191,0.08)' }}
    >
      <p className="text-sm text-gray-700">
        <strong style={{ color: '#1A2B4A' }}>Save your project</strong> — create a password to access estimates, permits, and all deliverables anytime.
      </p>
      <Link
        href={href}
        className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: '#E8793A' }}
      >
        Create password →
      </Link>
    </div>
  )
}
