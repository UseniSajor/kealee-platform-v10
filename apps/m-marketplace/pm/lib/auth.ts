import { supabase } from "./supabase"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

async function apiGet<T>(endpoint: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || err.error || "API request failed")
  }
  return res.json()
}

function isAllowedPmRole(roleKey?: string | null) {
  if (!roleKey) return false
  return ["PM", "PM_SUPERVISOR", "project_manager", "pm_supervisor", "ADMIN"].includes(roleKey)
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  const accessToken = data.session?.access_token
  if (!accessToken) {
    await supabase.auth.signOut()
    throw new Error("Missing session token")
  }

  // Fetch user from Kealee API (local DB)
  const me = await apiGet<{ user: { id: string; name: string } }>("/auth/me", accessToken)

  // Determine role from org memberships in local DB
  const orgs = await apiGet<{ orgs: Array<{ role: string }> }>(`/users/${me.user.id}/orgs`, accessToken)
  const role = orgs.orgs.find((o) => isAllowedPmRole(o.role))?.role

  if (!isAllowedPmRole(role)) {
    await supabase.auth.signOut()
    throw new Error("Unauthorized: PM access only")
  }

  return { user: data.user, role, name: me.user.name }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const accessToken = session?.access_token
  if (!accessToken) return null

  const me = await apiGet<{ user: { id: string; name: string; email: string } }>("/auth/me", accessToken)
  const orgs = await apiGet<{ orgs: Array<{ role: string }> }>(`/users/${me.user.id}/orgs`, accessToken)
  const role = orgs.orgs.find((o) => isAllowedPmRole(o.role))?.role

  return { ...me.user, role }
}

