"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useClerk } from '@clerk/nextjs'

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
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { signOut } = useClerk()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      if (!isLoaded) return
      const accessToken = isSignedIn ? await getToken() : null
      if (!accessToken) {
        router.replace("/login")
        return
      }

      try {
        const me = await apiGet<{ user: { id: string } }>("/auth/me", accessToken)
        const orgs = await apiGet<{ orgs: Array<{ role: string }> }>(
          `/users/${me.user.id}/orgs`,
          accessToken
        )
        const role = orgs.orgs.find((o) => isAllowedPmRole(o.role))?.role
        if (!isAllowedPmRole(role)) {
          await signOut()
          router.replace("/login?error=unauthorized")
          return
        }
        if (!cancelled) setReady(true)
      } catch {
        await signOut()
        router.replace("/login")
      }
    }

    check()

    return () => {
      cancelled = true
    }
  }, [getToken, isLoaded, isSignedIn, router, signOut])

  return { ready }
}
