"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "./supabase"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

function isAllowedPmRole(roleKey?: string | null) {
  if (!roleKey) return false
  return ["PM", "PM_SUPERVISOR", "project_manager", "pm_supervisor", "ADMIN"].includes(roleKey)
}

async function apiGet<T>(endpoint: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || err.error || "API request failed")
  }
  return res.json()
}

export function useRequirePmAuth() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        router.replace("/login")
        return
      }

      try {
        const me = await apiGet<{ user: { id: string } }>("/auth/me", session.access_token)
        const orgs = await apiGet<{ orgs: Array<{ role: string }> }>(
          `/users/${me.user.id}/orgs`,
          session.access_token
        )
        const role = orgs.orgs.find((o) => isAllowedPmRole(o.role))?.role
        if (!isAllowedPmRole(role)) {
          await supabase.auth.signOut()
          router.replace("/login?error=unauthorized")
          return
        }
        if (!cancelled) setReady(true)
      } catch {
        await supabase.auth.signOut()
        router.replace("/login")
      }
    }

    check()

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setReady(false)
      check()
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [router])

  return { ready }
}

