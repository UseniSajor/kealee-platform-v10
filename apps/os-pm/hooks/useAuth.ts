"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { supabase } from "@/lib/supabase"
import { api } from "@/lib/api"
import type { AuthUser } from "@/lib/types/index"

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
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

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void load()
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }, [router])

  return { user, loading, signedIn: Boolean(user), signOut }
}

