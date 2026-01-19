import { useEffect, useState } from 'react'

/**
 * React Hook for CSRF Token Management
 * Fetches and manages CSRF tokens for form submissions
 */
export function useCSRFToken() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchToken() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/csrf-token`, {
          method: 'GET',
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setToken(data.csrfToken)
        } else {
          throw new Error('Failed to fetch CSRF token')
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchToken()
  }, [])

  return { token, loading, error }
}

/**
 * Component to add CSRF token to forms
 * Usage: <CSRFTokenField />
 */
export function CSRFTokenField() {
  const { token } = useCSRFToken()

  if (!token) return null

  return <input type="hidden" name="_csrf" value={token} />
}

/**
 * Hook to get CSRF token for manual form handling
 */
export function useCSRFHeader(): string | null {
  const { token } = useCSRFToken()
  return token
}
