"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

import { api } from "@/lib/api"
import type { AuthUser } from "@/lib/types/index"

let _supabase: ReturnType<typeof createBrowserClient> | null = null
function getSupabase() {
  if (!_supabase) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabase
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [loading, setLoading] = React.useState(true)
  const supabase = getSupabase()

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
  }, [supabase])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }, [router, supabase])

  return { user, loading, signedIn: Boolean(user), signOut }
}

