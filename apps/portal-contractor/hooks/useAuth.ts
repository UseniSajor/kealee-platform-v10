'use client'

import { useState, useEffect } from 'react'
import { getAuthToken } from '@/lib/supabase'

/** Returns the current Supabase session access token, or null if not signed in. */
export function useAuthToken(): string | null {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getAuthToken().then((t) => {
      if (active) setToken(t)
    })
    return () => { active = false }
  }, [])

  return token
}
