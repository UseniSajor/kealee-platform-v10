"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth as useClerkAuth, useClerk } from '@clerk/nextjs'

import { api } from "@pm/lib/api"
import type { AuthUser } from "@pm/lib/types/index"

export function useAuth() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useClerkAuth()
  const { signOut: clerkSignOut } = useClerk()
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => {
    if (!isLoaded) return
    let mounted = true

    async function load() {
      setLoading(true)
      try {
        if (!isSignedIn) {
          if (mounted) setUser(null)
          return
        }

        const me = await api.auth.me()
        if (mounted) setUser(me.user)
      } catch {
        if (mounted) setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [isLoaded, isSignedIn])

  const signOut = React.useCallback(async () => {
    await clerkSignOut()
    router.replace("/login")
  }, [clerkSignOut, router])

  return { user, loading, signedIn: Boolean(user), signOut }
}
