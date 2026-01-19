/**
 * Auth helpers for m-ops-services
 * Gets current user and organization context
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function getAuthToken(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    // Try to get from localStorage (set by auth flow)
    const token = localStorage.getItem('supabase.auth.token')
    if (token) {
      try {
        const parsed = JSON.parse(token)
        return parsed?.access_token || null
      } catch {
        return null
      }
    }
  }
  return null
}

export async function getCurrentUser() {
  const token = await getAuthToken()
  if (!token) return null

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) return null
    const data = await response.json()
    return data.user || null
  } catch {
    return null
  }
}

export async function getCurrentUserOrgs() {
  const token = await getAuthToken()
  if (!token) return []

  try {
    const response = await fetch(`${API_BASE_URL}/orgs/my`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) return []
    const data = await response.json()
    return data.orgs || []
  } catch {
    return []
  }
}

export async function getPrimaryOrgId(): Promise<string | null> {
  const orgs = await getCurrentUserOrgs()
  // Return first active org, or first org if none are active
  const activeOrg = orgs.find((org: any) => org.status === 'ACTIVE')
  return activeOrg?.id || orgs[0]?.id || null
}
